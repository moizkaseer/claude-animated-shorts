// Final render of a short, resumable: the frames are rendered in chunks (out/<short>/chunks/<scale>/c_<first>.mp4,
// h264 crf 16), each retried up to 3 times (the iGPU's Chrome GPU process can stall: a chunk then times out), finished
// chunks are skipped when you run it again, then they are joined without re-encoding -> out/<short>/video.mp4,
// muxed with out/<short>/audio/mix.wav -> out/<short>/<short>_final.mp4, then frame-by-frame QA -> out/<short>/qa/.
// usage: node scripts/render.mjs <short> [--scale 1.3333] [--frames 0-299] [--chunk 150] [--concurrency 1] [--no-qa]
//   <short> = folder in src/shorts. scale 1.3333 = 1440x2560 (the 2K vertical delivery size); 0.5 for a preview.
//   Delete out/<short>/chunks/ after any picture change (chunks are reused by frame range and scale only).
// env: GL (default angle; egl hangs on this machine), REMOTION_TMP (bundle temp dir), FFMPEG / FFPROBE (a full
//      ffmpeg for the QA loudness line; otherwise Remotion's bundled ffmpeg is used), INPUT_PROPS (JSON, e.g.
//      '{"post":{"ink":false}}' for A/B tests: then use a --frames range and a fresh chunk folder).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const short = args[0];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
if (!short || short.startsWith("--")) { console.error("usage: node scripts/render.mjs <short> [--scale 1.3333] [--frames a-b] [--chunk 150] [--concurrency n] [--no-qa]"); process.exit(1); }
const scale = Number(opt("--scale", "1.3333"));
const chunk = Number(opt("--chunk", "150"));
const concurrency = Number(opt("--concurrency", "1"));
const tmp = path.resolve(process.env.REMOTION_TMP || ".remotion-tmp");
fs.mkdirSync(tmp, { recursive: true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmp;
const { bundle } = await import("@remotion/bundler");
const { renderMedia, selectComposition } = await import("@remotion/renderer");

const dir = path.resolve(`out/${short}`);
const idFile = path.resolve(`src/shorts/${short}/index.ts`);
if (!fs.existsSync(idFile)) { console.error(`no ${idFile}`); process.exit(1); }
const id = (fs.readFileSync(idFile, "utf8").match(/id:\s*"([^"]+)"/) || [])[1];
if (!id) { console.error(`no id: "..." in ${idFile}`); process.exit(1); }

// ffmpeg: a full build if there is one, else Remotion's bundled one (it has libx264, aac and the concat demuxer)
const require = createRequire(import.meta.url);
const rdir = path.dirname(require.resolve("@remotion/compositor-linux-x64-gnu/package.json"));
const full = process.env.FFMPEG || (spawnSync("ffmpeg", ["-version"]).status === 0 ? "ffmpeg" : null);
const ffmpeg = full || path.join(rdir, "ffmpeg");
const ffprobe = process.env.FFPROBE || (full ? "ffprobe" : path.join(rdir, "ffprobe"));
const env = full ? process.env : { ...process.env, LD_LIBRARY_PATH: rdir };
const ff = (a) => spawnSync(ffmpeg, a, { stdio: "inherit", env }).status === 0;

const chromiumOptions = { gl: process.env.GL || "angle" };
const inputProps = process.env.INPUT_PROPS ? JSON.parse(process.env.INPUT_PROPS) : {};
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const [first, last] = opt("--frames", null)?.split("-").map(Number) ?? [0, composition.durationInFrames - 1];
const partial = first !== 0 || last !== composition.durationInFrames - 1;
const cdir = path.join(dir, "chunks", String(scale) + (process.env.INPUT_PROPS ? "_props" : ""));
fs.mkdirSync(cdir, { recursive: true });
const parts = [];
let done = 0;
const total = last - first + 1;
for (let a = first; a <= last; a += chunk) {
  const b = Math.min(last, a + chunk - 1), out = path.join(cdir, `c_${String(a).padStart(5, "0")}_${b}.mp4`);
  parts.push(out);
  if (fs.existsSync(out)) { done += b - a + 1; console.log(`chunk ${a}-${b}: done earlier`); continue; }
  for (let attempt = 1; ; attempt++) {
    const part = out.replace(/\.mp4$/, ".part.mp4");
    try {
      const tc = Date.now();
      await renderMedia({ composition, serveUrl, codec: "h264", crf: 16, scale, outputLocation: part, chromiumOptions, concurrency,
        frameRange: [a, b], timeoutInMilliseconds: 120000, muted: true, inputProps });
      fs.renameSync(part, out);
      done += b - a + 1;
      const fps = (b - a + 1) / ((Date.now() - tc) / 1000);
      console.log(`chunk ${a}-${b}: ${fps.toFixed(2)} fps | ${done}/${total} frames | ${((Date.now() - t0) / 60000).toFixed(1)} min | ~${((total - done) / fps / 60).toFixed(0)} min left`);
      break;
    } catch (e) {
      fs.rmSync(part, { force: true });
      console.log(`chunk ${a}-${b}: attempt ${attempt} failed (${String(e.message || e).split("\n")[0].slice(0, 160)})`);
      if (attempt >= 3) { console.error("giving up: run the same command again to resume"); process.exit(1); }
    }
  }
}
fs.rmSync(serveUrl.replace(/^file:\/\//, ""), { recursive: true, force: true });

// ---- join the chunks (same encoder settings, so a stream copy) ----
const video = path.join(dir, partial ? `video_${first}-${last}_silent.mp4` : "video_silent.mp4"); // picture only: watch <short>_final.mp4
const list = path.join(cdir, "list.txt");
fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
if (!ff(["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-map", "0:v:0", "-c", "copy", "-movflags", "+faststart", video])) { console.error("join failed"); process.exit(1); }
console.log("video", path.relative(".", video), ((Date.now() - t0) / 60000).toFixed(1) + " min");

// ---- mux the soundtrack (the render has no audio of its own) ----
const mix = path.join(dir, "audio", "mix.wav");
const final = path.join(dir, `${short}_final.mp4`);
if (partial) console.log("partial render: not muxed");
else if (!fs.existsSync(mix)) console.log(`no ${path.relative(".", mix)}: run python3 audio/mix.py ${short}, then this command again (it reuses the chunks)`);
else {
  if (!ff(["-y", "-v", "error", "-i", video, "-i", mix, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k",
    "-shortest", "-movflags", "+faststart", final])) { console.error("mux failed"); process.exit(1); }
  console.log("final", path.relative(".", final));
}

// ---- QA (the loudness line needs a full ffmpeg; the frame checks work with any) ----
if (!args.includes("--no-qa") && !partial) {
  const tl = path.join(dir, "timeline.json");
  if (!full) console.log("QA with Remotion's bundled ffmpeg: no ebur128 filter, so no loudness line (set FFMPEG to a full build)");
  const target = fs.existsSync(final) ? final : video;
  spawnSync("python3", ["scripts/qa.py", target, path.join(dir, "qa"), ...(fs.existsSync(tl) ? [tl] : [])],
    { stdio: "inherit", env: { ...env, FFMPEG: ffmpeg, FFPROBE: ffprobe } });
}
