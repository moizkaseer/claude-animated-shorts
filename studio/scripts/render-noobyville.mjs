// Render the Noobyville review at 1080x1920. Does not touch scripts/render.mjs.
// usage: node scripts/render-noobyville.mjs [--scale 1] [--frames a-b] [--chunk 80] [--concurrency 1]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const scale = Number(opt("--scale", "1"));
const chunk = Number(opt("--chunk", "80"));
const concurrency = Number(opt("--concurrency", "1"));
const id = "MomRobloxReview";
const tmp = path.resolve(process.env.REMOTION_TMP || ".remotion-tmp");
fs.mkdirSync(tmp, { recursive: true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmp;

const { bundle } = await import("@remotion/bundler");
const { renderMedia, selectComposition } = await import("@remotion/renderer");
const require = createRequire(import.meta.url);
const rdir = path.dirname(require.resolve("@remotion/compositor-linux-x64-gnu/package.json"));
const full = process.env.FFMPEG || (spawnSync("ffmpeg", ["-version"]).status === 0 ? "ffmpeg" : null);
const ffmpeg = full || path.join(rdir, "ffmpeg");
const env = full ? process.env : { ...process.env, LD_LIBRARY_PATH: rdir };
const ff = (a) => spawnSync(ffmpeg, a, { stdio: "inherit", env }).status === 0;

const dir = path.resolve("out/momroblox");
fs.mkdirSync(dir, { recursive: true });
const chromiumOptions = { gl: process.env.GL || "swangle" };
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve("src/noobyville/entry.tsx"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions });
const [first, last] = opt("--frames", null)?.split("-").map(Number) ?? [0, composition.durationInFrames - 1];
const partial = first !== 0 || last !== composition.durationInFrames - 1;
const cdir = path.join(dir, "chunks", String(scale));
fs.mkdirSync(cdir, { recursive: true });
const parts = [];
let done = 0;
const total = last - first + 1;
for (let a = first; a <= last; a += chunk) {
  const b = Math.min(last, a + chunk - 1);
  const out = path.join(cdir, `c_${String(a).padStart(5, "0")}_${b}.mp4`);
  parts.push(out);
  if (fs.existsSync(out) && !args.includes("--force")) { done += b - a + 1; console.log(`chunk ${a}-${b}: done earlier`); continue; }
  for (let attempt = 1; ; attempt++) {
    const part = out.replace(/\.mp4$/, ".part.mp4");
    try {
      const tc = Date.now();
      await renderMedia({
        composition, serveUrl, codec: "h264", crf: 18, scale, outputLocation: part, chromiumOptions, concurrency,
        frameRange: [a, b], timeoutInMilliseconds: 180000, muted: true,
        imageFormat: "jpeg", jpegQuality: 90,
      });
      fs.renameSync(part, out);
      done += b - a + 1;
      const fps = (b - a + 1) / ((Date.now() - tc) / 1000);
      console.log(`chunk ${a}-${b}: ${fps.toFixed(2)} fps | ${done}/${total} | ${((Date.now() - t0) / 60000).toFixed(1)} min | ~${((total - done) / Math.max(fps, 0.01) / 60).toFixed(0)} min left`);
      break;
    } catch (e) {
      fs.rmSync(part, { force: true });
      console.log(`chunk ${a}-${b}: attempt ${attempt} failed (${String(e.message || e).split("\n")[0].slice(0, 200)})`);
      if (attempt >= 3) { console.error("giving up; re-run to resume"); process.exit(1); }
    }
  }
}
fs.rmSync(serveUrl.replace(/^file:\/\//, ""), { recursive: true, force: true });

const video = path.join(dir, partial ? `video_${first}-${last}_silent.mp4` : "video_silent.mp4");
const list = path.join(cdir, "list.txt");
fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
if (!ff(["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-map", "0:v:0", "-c", "copy", "-movflags", "+faststart", video])) {
  console.error("join failed"); process.exit(1);
}
console.log("video", path.relative(".", video));
const mix = path.join(dir, "audio", "mix.wav");
const final = path.join(dir, "MOM_ROBLOX_REVIEW.mp4");
if (!partial && fs.existsSync(mix)) {
  if (!ff(["-y", "-v", "error", "-i", video, "-i", mix, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", final])) {
    console.error("mux failed"); process.exit(1);
  }
  console.log("final", path.relative(".", final));
} else if (!partial) console.log("no mix yet:", mix);
