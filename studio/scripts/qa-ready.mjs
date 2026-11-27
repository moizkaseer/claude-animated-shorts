// Ready-to-post gate for a Wobbly History short. Read-only: it never writes into out/ or media/.
// Checks the script, the soundtrack, the opening frames and the title against PRE_POST_CHECKLIST.md (repo root),
// prints PASS / FAIL / REVIEW / SKIP per check and an overall READY or NOT READY. Exit code 0 only when READY.
// usage: node scripts/qa-ready.mjs <short> [--video file.mp4] [--title "..."] [--tags "a,b"] [--reviewed] [--json]
//   <short>     folder name: media/<short>/script.txt (or the "## Script" part of SCRIPT.md), media/<short>/voice/,
//               out/<short>/ (<short>_final.mp4, else video.mp4, else the first finished render chunk for the frame
//               checks only), out/<short>/audio/stem_music.wav, media/<short>/youtube.json (title + tags).
//   --video     use this video instead (e.g. the published file of an older short).
//   --title/--tags  use these instead of media/<short>/youtube.json.
//   --reviewed  a human has looked at every REVIEW item and accepts it: REVIEW no longer blocks READY.
// READY = no FAIL, no SKIP, and no REVIEW (unless --reviewed). Thresholds are at the top of this file.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const T = {
  durMin: 55, durMax: 75,          // seconds
  wpsMin: 3.4, wpsMax: 4.2,        // spoken words per second of the finished short (channel target ~3.7)
  maxYears: 2,                     // dates (years) in the script
  musicPeakDb: -60,                // music stem must stay below this peak (dBFS)
  motionMin: 0.8,                  // mean abs grey difference (0-255) between frame 0 and frame 10
  bannerMin: 0.01,                 // share of top-band pixels that look like outlined banner text
};

const args = process.argv.slice(2);
const short = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const flag = (k) => args.includes(k);
if (!short || short.startsWith("--")) {
  console.error('usage: node scripts/qa-ready.mjs <short> [--video f.mp4] [--title "..."] [--tags "a,b"] [--reviewed] [--json]');
  process.exit(2);
}
const root = process.cwd();
const media = path.join(root, "media", short);
const out = path.join(root, "out", short);
const results = [];
const add = (id, status, detail) => results.push({ id, status, detail });

// ---------- tools ----------
let ffmpeg = process.env.FFMPEG, ffprobe = process.env.FFPROBE;
if (!ffmpeg) {
  if (spawnSync("ffmpeg", ["-version"]).status === 0) { ffmpeg = "ffmpeg"; ffprobe = ffprobe || "ffprobe"; }
  else {
    try {
      const rdir = path.dirname(createRequire(import.meta.url).resolve("@remotion/compositor-linux-x64-gnu/package.json"));
      ffmpeg = path.join(rdir, "ffmpeg"); ffprobe = ffprobe || path.join(rdir, "ffprobe");
    } catch { ffmpeg = null; }
  }
}
const probeDur = (f) => {
  if (!ffprobe || !f || !fs.existsSync(f)) return null;
  const r = spawnSync(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" });
  const d = parseFloat(r.stdout); return Number.isFinite(d) ? d : null;
};
const maxVolume = (f) => {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-nostats", "-i", f, "-af", "volumedetect", "-vn", "-f", "null", "-"], { encoding: "utf8" });
  const m = r.stderr.match(/max_volume:\s*(-?[\d.]+|-inf) dB/); return m ? (m[1] === "-inf" ? -Infinity : parseFloat(m[1])) : null;
};
const grabFrame = (f, n, w, h, fmt) => {   // raw pixels of frame n
  const r = spawnSync(ffmpeg, ["-v", "error", "-i", f, "-vf", `select=eq(n\\,${n}),scale=${w}:${h}`, "-frames:v", "1",
    "-f", "rawvideo", "-pix_fmt", fmt, "-"], { maxBuffer: 64 << 20 });
  return r.stdout && r.stdout.length ? r.stdout : null;
};

// ---------- script ----------
let scriptText = null, scriptSrc = null;
if (fs.existsSync(path.join(media, "script.txt"))) { scriptText = fs.readFileSync(path.join(media, "script.txt"), "utf8"); scriptSrc = "script.txt"; }
else if (fs.existsSync(path.join(media, "SCRIPT.md"))) {
  const m = fs.readFileSync(path.join(media, "SCRIPT.md"), "utf8").match(/##\s*Script\s*\n([\s\S]*?)(\n##\s|$)/);
  if (m) { scriptText = m[1]; scriptSrc = "SCRIPT.md ## Script"; }
}
const lines = scriptText ? scriptText.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")) : [];
const words = lines.join(" ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
const STOP = new Set("the a an and or but so of to in on at by for with from is are was were be been it its this that these those there their they them he she his her you your yours we our i me my as into over under than then just only about which who what when where why how not no yes very really still even also".split(" "));
const keyset = (s) => new Set((s.toLowerCase().match(/[\p{L}']+/gu) || []).map((w) => w.replace(/'s$/, "").replace(/(ies)$/, "y").replace(/s$/, ""))
  .filter((w) => w.length >= 4 && !STOP.has(w)));

// ---------- durations ----------
let video = opt("--video", null), videoKind = "override";
if (!video) for (const [f, k] of [[path.join(out, `${short}_final.mp4`), "final"], [path.join(out, "video.mp4"), "joined (no audio mux yet)"]]) if (fs.existsSync(f)) { video = f; videoKind = k; break; }
let frameVideo = video;
if (!frameVideo) {   // first finished chunk: enough for the opening-frame checks while a render is still running
  const cdir = path.join(out, "chunks");
  if (fs.existsSync(cdir)) for (const s of fs.readdirSync(cdir).sort().reverse()) {
    const c = path.join(cdir, s, fs.existsSync(path.join(cdir, s)) ? (fs.readdirSync(path.join(cdir, s)).filter((x) => /^c_00000_\d+\.mp4$/.test(x))[0] || "") : "");
    if (c.endsWith(".mp4") && fs.existsSync(c)) { frameVideo = c; videoKind = "first render chunk only"; break; }
  }
}
const mix = path.join(out, "audio", "mix.wav");
let wordsJson = null;
try { wordsJson = JSON.parse(fs.readFileSync(path.join(media, "voice", "words.json"), "utf8")); } catch {}
let dur = null, durSrc = null;
if (video) { dur = probeDur(video); durSrc = `video (${path.relative(root, video)})`; }
if (dur == null && fs.existsSync(mix)) { dur = probeDur(mix); durSrc = "out/<short>/audio/mix.wav"; }
if (dur == null && Array.isArray(wordsJson) && wordsJson.length) { dur = wordsJson.at(-1).e; durSrc = "voice/words.json (last word end)"; }

// 1. duration
if (dur == null) add("duration 55-75 s", "SKIP", "no video, mix.wav or words.json yet");
else add("duration 55-75 s", dur >= T.durMin && dur <= T.durMax ? "PASS" : "FAIL", `${dur.toFixed(1)} s from ${durSrc}`);

// 2. words per second
if (!words.length) add("pace 3.4-4.2 words/s", "SKIP", "no script text found");
else if (dur == null) add("pace 3.4-4.2 words/s", "SKIP", `${words.length} words, no duration`);
else { const wps = words.length / dur; add("pace 3.4-4.2 words/s", wps >= T.wpsMin && wps <= T.wpsMax ? "PASS" : "FAIL", `${words.length} words / ${dur.toFixed(1)} s = ${wps.toFixed(2)} words/s (target ~3.7)`); }

// 3. no spoken call to action
if (!lines.length) add("no spoken CTA", "SKIP", "no script");
else {
  const CTA = /\b(subscrib\w*|like and (subscribe|share)|like (this|the) (video|short)|(hit|smash|drop|leave) (a |the )?like|comment\w*|follow (us|me|for|the channel|along for)|turn on (the )?notifications?|share this)\b/i;
  const hits = lines.filter((l) => CTA.test(l));
  add("no spoken CTA", hits.length ? "FAIL" : "PASS", hits.length ? `found: "${hits.join('" | "')}"` : "no like / subscribe / comment / follow lines");
}

// 4. hook = a character in trouble
if (!lines.length) add("hook starts with a character", "SKIP", "no script");
else {
  const first = lines[0];
  const w = (first.match(/^[\p{L}'’]+/u) || [""])[0];
  const PRON = /^(you|you're|you’re|he|he's|she|she's|they|they're|i|i'm|we)$/i;
  const NOT_NAME = /^(the|a|an|this|that|these|those|in|on|at|it|it's|there|one|every|some|when|after|before|why|how|what|so|and|but|imagine|picture|if)$/i;
  if (PRON.test(w)) add("hook starts with a character", "PASS", `"${first}"`);
  else if (/^\p{Lu}/u.test(w) && !NOT_NAME.test(w)) add("hook starts with a character", "REVIEW", `starts with "${w}": a named character? (a place or object name is not) "${first}"`);
  else add("hook starts with a character", "REVIEW", `"${first}" does not start with You / He / She / They or a name: rewrite as a character in trouble, or accept with --reviewed`);
}

// 5. at most 2 dates
if (!lines.length) add("at most 2 dates", "SKIP", "no script");
else {
  const years = [...new Set(lines.join(" ").match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || [])];
  add("at most 2 dates", years.length <= T.maxYears ? "PASS" : "FAIL", years.length ? `years: ${years.join(", ")}` : "no years");
}

// 6. ending loops back to the hook
if (lines.length < 2) add("ending loops to the hook", "SKIP", "no script");
else {
  const a = keyset(lines[0]), b = keyset(lines.at(-1));
  const shared = [...b].filter((x) => a.has(x));
  add("ending loops to the hook", shared.length ? "PASS" : "FAIL", shared.length ? `last line shares "${shared.join(", ")}" with the hook: "${lines.at(-1)}"` : `no shared keyword: "${lines.at(-1)}"`);
}

// 7. no music
const stem = path.join(out, "audio", "stem_music.wav");
if (!ffmpeg) add("no music", "SKIP", "no ffmpeg");
else if (!fs.existsSync(stem)) {
  if (fs.existsSync(mix)) add("no music", "PASS", "no music stem in the mix");
  else {   // no mix rendered here: judge the sound config instead
    const mp = path.join(root, "audio", "shorts", short, "music.py");
    if (!fs.existsSync(mp)) add("no music", "SKIP", "no mix and no audio/shorts/<short>/music.py");
    else { const src = fs.readFileSync(mp, "utf8"); const silent = /NO MUSIC/.test(src) && /np\.zeros/.test(src);
      add("no music", silent ? "PASS" : "FAIL", silent ? "music.py is the silent house-rule module (no mix to measure)" : "audio/shorts/<short>/music.py writes a score: replace it with the silent module (see audio/shorts/eiffel/music.py)"); }
  }
}
else { const p = maxVolume(stem); add("no music", p != null && p < T.musicPeakDb ? "PASS" : "FAIL", `music stem peak ${p === -Infinity ? "-inf (all zeros)" : p + " dBFS"}`); }

// 8 + 9. opening frames
if (!ffmpeg || !frameVideo) {
  add("motion at frame 0 (0 vs 10)", "SKIP", "no rendered video or chunk yet");
  add("paradox banner in frame 0", "SKIP", "no rendered video or chunk yet");
} else {
  const W = 90, H = 160, f0 = grabFrame(frameVideo, 0, W, H, "gray"), f10 = grabFrame(frameVideo, 10, W, H, "gray");
  if (!f0 || !f10) add("motion at frame 0 (0 vs 10)", "SKIP", "could not read frames 0 / 10");
  else { let s = 0; for (let i = 0; i < f0.length; i++) s += Math.abs(f0[i] - f10[i]); const d = s / f0.length;
    add("motion at frame 0 (0 vs 10)", d >= T.motionMin ? "PASS" : "FAIL", `mean pixel change ${d.toFixed(2)}/255 (${videoKind})`); }
  // banner: bright white / yellow pixels with a dark outline within 2 px, in the top 35 % of the frame
  const BW = 180, BH = 320, px = grabFrame(frameVideo, 0, BW, BH, "rgb24");
  if (!px) add("paradox banner in frame 0", "SKIP", "could not read frame 0");
  else {
    const top = Math.floor(BH * 0.35); let hit = 0;
    const at = (x, y) => (y * BW + x) * 3;
    for (let y = 2; y < top - 2; y++) for (let x = 2; x < BW - 2; x++) {
      const i = at(x, y), r = px[i], g = px[i + 1], b = px[i + 2];
      const bright = (r > 225 && g > 225 && b > 225) || (r > 210 && g > 170 && b < 110);
      if (!bright) continue;
      let dark = false;
      for (let dy = -2; dy <= 2 && !dark; dy++) for (let dx = -2; dx <= 2; dx++) { const j = at(x + dx, y + dy); if (Math.max(px[j], px[j + 1], px[j + 2]) < 60) { dark = true; break; } }
      if (dark) hit++;
    }
    const share = hit / (top * BW);
    add("paradox banner in frame 0", share >= T.bannerMin ? "PASS" : "REVIEW", `outlined bright text in top band: ${(share * 100).toFixed(2)} % of pixels ${share >= T.bannerMin ? "" : "(not detected: check frame 0 by eye)"}`);
  }
}

// 10 + 11. title and tags
let meta = null;
if (opt("--title")) meta = { title: opt("--title"), tags: (opt("--tags", "") || "").split(",").map((s) => s.trim()).filter(Boolean), src: "command line" };
else if (fs.existsSync(path.join(media, "youtube.json"))) { try { meta = { ...JSON.parse(fs.readFileSync(path.join(media, "youtube.json"), "utf8")), src: "media/<short>/youtube.json" }; } catch {} }
if (!meta || !meta.title) {
  add("title is a question", "SKIP", "no media/<short>/youtube.json yet (run node scripts/upload-kit.mjs <short>) and no --title");
  add("history-only tags", "SKIP", "no title / tags yet");
} else {
  const bare = meta.title.replace(/#\w+/g, "").trim();
  add("title is a question", /\?$/.test(bare) ? "PASS" : "FAIL", `"${meta.title}"`);
  const all = [meta.title, ...(meta.tags || [])].join(" ").toLowerCase();
  const GAMING = /\b(gaming|gamer|games?|clash\w*|brawl\w*|fortnite|minecraft|roblox|kick|twitch|stream\w*|emotes?|esports?|gta)\b/;
  const g = all.match(GAMING);
  const hist = /history/.test(all);
  add("history-only tags", !g && hist ? "PASS" : "FAIL", g ? `gaming tag "${g[0]}" found` : hist ? `tags: ${(meta.tags || []).join(", ") || "(title hashtags only)"}` : "no history tag");
}

// 12. facts have sources
const sm = path.join(media, "SCRIPT.md");
if (!fs.existsSync(sm)) add("facts have sources", "FAIL", "no media/<short>/SCRIPT.md");
else { const s = fs.readFileSync(sm, "utf8"); const ok = /source/i.test(s) && (/https?:\/\//.test(s) || /\((?:[^)]*?)(wikipedia|britannica|museum|archive|university|nova|bbc|gov|journal|\d{4})/i.test(s));
  add("facts have sources", ok ? "PASS" : "FAIL", ok ? "SCRIPT.md has a sources section with citations" : "add the facts and their sources to the top of SCRIPT.md"); }

// ---------- report ----------
const n = (s) => results.filter((r) => r.status === s).length;
const reviewed = flag("--reviewed");
const ready = n("FAIL") === 0 && n("SKIP") === 0 && (reviewed || n("REVIEW") === 0);
if (flag("--json")) { console.log(JSON.stringify({ short, ready, results, script: scriptSrc, video: video || frameVideo || null }, null, 1)); process.exit(ready ? 0 : 1); }
console.log(`qa-ready: ${short}  (script: ${scriptSrc || "none"}; video: ${video ? path.relative(root, video) : frameVideo ? path.relative(root, frameVideo) + " [frames only]" : "none"})\n`);
for (const r of results) console.log(`${r.status.padEnd(6)} ${r.id.padEnd(30)} ${r.detail}`);
console.log(`\nManual (not automatic): opening frame is a medium close-up of a character mid-action with the landmark behind;`);
console.log(`one rival, one twist, punchline ending; no impression voices; free-licence assets only. See PRE_POST_CHECKLIST.md.`);
console.log(`\n${ready ? "READY" : "NOT READY"}  (${n("PASS")} pass, ${n("FAIL")} fail, ${n("REVIEW")} review${reviewed ? " accepted" : ""}, ${n("SKIP")} skipped)`);
process.exit(ready ? 0 : 1);
