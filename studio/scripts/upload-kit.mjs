// Upload kit for one finished short (you upload it yourself in YouTube Studio or the YouTube app).
// usage: node scripts/upload-kit.mjs <short>
// Reads media/<short>/youtube.json (created as a template on the first run: fill it in and run again) and the final
// video out/<short>/<short>_final.mp4. Checks it against what a Short needs, then writes out/<short>/upload/:
//   <slug>.mp4 (the file to upload), cover_*.jpg (frame candidates to pick as the cover in the app), UPLOAD.md
//   (title / description / tags to paste + the settings checklist).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const short = process.argv[2];
if (!short) { console.error("usage: node scripts/upload-kit.mjs <short>"); process.exit(1); }
const media = path.resolve(`media/${short}`), dir = path.resolve(`out/${short}`);
const meta = path.join(media, "youtube.json");
if (!fs.existsSync(meta)) {
  fs.mkdirSync(media, { recursive: true });
  fs.writeFileSync(meta, JSON.stringify({
    title: "The bridge that fell for a song #Shorts",
    description: "In 1831, 74 soldiers knocked down an iron bridge just by walking across it. The Professor explains why.\n\nSources:\n- Wikipedia, Broughton Suspension Bridge\n\n#history #science #weirdfacts",
    tags: ["weird facts", "history", "science", "animation", "the professor"],
    madeForKids: false,
    category: "Education",
    cover_seconds: [1.0, null, null],
    _notes: "title <= 100 characters (aim for <= 60 so it shows in full); put your sources in the description; cover_seconds: times to grab cover frames (null = automatic)",
  }, null, 2) + "\n");
  console.log(`wrote ${path.relative(".", meta)}: fill in the title, description and tags for this short, then run again`);
  process.exit(0);
}
const m = JSON.parse(fs.readFileSync(meta, "utf8"));
const video = path.join(dir, `${short}_final.mp4`);
if (!fs.existsSync(video)) { console.error(`no ${path.relative(".", video)}: run node scripts/render.mjs ${short} first`); process.exit(1); }

const require = createRequire(import.meta.url);
const rdir = path.dirname(require.resolve("@remotion/compositor-linux-x64-gnu/package.json"));
const full = process.env.FFMPEG || (spawnSync("ffmpeg", ["-version"]).status === 0 ? "ffmpeg" : null);
const ffmpeg = full || path.join(rdir, "ffmpeg"), ffprobe = process.env.FFPROBE || (full ? "ffprobe" : path.join(rdir, "ffprobe"));
const env = full ? process.env : { ...process.env, LD_LIBRARY_PATH: rdir };

// ---- checks ----
const pr = JSON.parse(spawnSync(ffprobe, ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size", "-of", "json", video], { env }).stdout.toString());
const v = pr.streams.find((s) => s.codec_type === "video"), a = pr.streams.find((s) => s.codec_type === "audio");
const dur = Number(pr.format.duration), mb = Number(pr.format.size) / 1e6;
const checks = [
  [v && v.height > v.width && Math.abs(v.width / v.height - 9 / 16) < 0.01, `vertical 9:16 (${v?.width}x${v?.height})`],
  [dur <= 180, `length ${dur.toFixed(1)} s (Shorts: up to 3 min; this style: 55-70 s)`],
  [!!a, `audio track (${a ? a.codec_name : "MISSING"})`],
  [v && v.height >= 1920, "at least 1080x1920"],
  [m.title && m.title.length <= 100, `title ${m.title?.length ?? 0}/100 characters`],
  [m.description && m.description.length <= 5000, `description ${m.description?.length ?? 0}/5000 characters`],
  [!/[<>]/.test(m.title + m.description), "no < or > in title / description (YouTube rejects them)"],
  [(m.tags ?? []).join(",").length <= 500, "tags fit in 500 characters"],
];
let ok = true;
for (const [pass, what] of checks) { console.log(`${pass ? "ok  " : "FAIL"} ${what}`); ok &&= !!pass; }
if (!ok) { console.error("fix the failures above, then run again"); process.exit(1); }

// ---- kit ----
const up = path.join(dir, "upload");
fs.rmSync(up, { recursive: true, force: true });
fs.mkdirSync(up, { recursive: true });
const slug = m.title.replace(/#\w+/g, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || short;
fs.copyFileSync(video, path.join(up, `${slug}.mp4`));
const times = (m.cover_seconds ?? [1, null, null]).map((t, i) => t ?? [1.0, dur * 0.45, dur * 0.8][i]);
times.forEach((t, i) => spawnSync(ffmpeg, ["-y", "-v", "error", "-ss", String(t), "-i", video, "-frames:v", "1", "-q:v", "2", path.join(up, `cover_${i + 1}_${t.toFixed(1)}s.jpg`)], { env }));
const md = `# Upload: ${m.title}

File: \`${slug}.mp4\` (${mb.toFixed(0)} MB, ${dur.toFixed(1)} s, ${v.width}x${v.height})

## Paste these
**Title**
\`\`\`
${m.title}
\`\`\`
**Description**
\`\`\`
${m.description}
\`\`\`
**Tags** (YouTube Studio > Show more > Tags)
\`\`\`
${(m.tags ?? []).join(", ")}
\`\`\`

## Steps
YouTube Studio (desktop): Create > Upload videos > pick the file. Or the YouTube app: + > Upload a Short.
1. Title and description from above. Vertical and under 3 minutes, so it is published as a Short.
2. Cover: in the app, pick a frame (candidates: ${times.map((t, i) => `cover_${i + 1}_${t.toFixed(1)}s.jpg`).join(", ")}). Pick a frame with the Professor's face and the joke's prop visible.
3. Audience: **${m.madeForKids ? "Yes, it's made for kids" : "No, it's not made for kids"}** (answer honestly: this is a legal setting).
4. Show more > **Altered or synthetic content**: "No" for this cartoon style. Answer "Yes" only if the video shows a
   realistic-looking person, voice or event that was generated or altered (for example a cloned voice of a real person).
5. Category: ${m.category ?? "Education"}. Comments and the rest: your channel defaults.
6. Visibility: Public (or Schedule). Check the Short plays with sound on your phone after it goes live.

## Before you post
- Facts and jokes checked against the sources in the description.
- No reference-channel material in the video, title or description, and its name is never mentioned.
`;
fs.writeFileSync(path.join(up, "UPLOAD.md"), md);
console.log(`kit: ${path.relative(".", up)}/ (${slug}.mp4, ${times.length} cover candidates, UPLOAD.md)`);
