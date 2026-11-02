// Write a short's timeline for the sound and the QA: out/<short>/timeline.json (shots, crossfades, flash, cuts,
// kicks, markers, story constants and the camera of every frame), straight from src/shorts/<short>/story.ts, so the
// audio never copies picture timings by hand. Re-run it after every picture timing change.
// usage: node scripts/export-timeline.mjs <short folder, e.g. bridge>
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const name = process.argv[2];
if (!name) { console.error("usage: node scripts/export-timeline.mjs <short folder>"); process.exit(1); }
const entry = path.resolve(`src/shorts/${name}/story.ts`);
if (!fs.existsSync(entry)) { console.error(`no ${entry}`); process.exit(1); }
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tl-")), "story.mjs");
await build({ entryPoints: [entry], bundle: true, format: "esm", platform: "node", outfile: tmp, logLevel: "error" });
const mod = await import(pathToFileURL(tmp).href);
fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
const tl = mod.timeline;
if (!tl) { console.error(`${entry} must export \`timeline\` (engine/short.ts Timeline)`); process.exit(1); }

const FPS = 30;
const r = (v, n = 4) => Math.round(v * 10 ** n) / 10 ** n;
const scalar = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => ["number", "string", "boolean"].includes(typeof v)));
const shots = tl.shots.map(scalar);
// camera per frame: the shot on screen (base layer of a crossfade) -> [shot, px, py, pz, lx, ly, lz, fov]
const shotOf = (f) => tl.shots.find((s) => f >= s.a && f < s.b) ?? tl.shots[tl.shots.length - 1];
const camera = [];
for (let f = 0; f < tl.frames; f++) {
  const s = shotOf(f), c = tl.camAt(s.id, f);
  camera.push([s.id, ...c.pos.map((v) => r(v)), ...c.look.map((v) => r(v)), r(c.fov, 3)]);
}
const xfade = tl.shots.filter((s) => tl.xfade[s.id]).map((s) => [s.a - tl.xfade[s.id] / 2, s.a + tl.xfade[s.id] / 2, s.id]);
const out = {
  short: name, fps: FPS, frames: tl.frames, duration: tl.frames / FPS,
  shots, xfade, flash: tl.flashAt !== undefined ? [tl.flashAt, tl.flashAt + 4] : null,
  cuts: tl.cuts ?? [], kicks: tl.kicks ?? [], markers: tl.markers ?? [], constants: tl.constants ?? {},
  camera_columns: ["shot", "px", "py", "pz", "lx", "ly", "lz", "fov"], camera,
};
const dir = path.resolve(`out/${name}`);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "timeline.json"), JSON.stringify(out));
console.log(`out/${name}/timeline.json: ${tl.frames} frames (${(tl.frames / FPS).toFixed(2)} s), ${shots.length} shots, ${xfade.length} crossfades, ${out.markers.length} markers`);
