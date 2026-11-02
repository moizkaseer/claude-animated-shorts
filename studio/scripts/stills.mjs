// Render test stills of one composition (bundles once, then one JPEG per frame).
// usage: node scripts/stills.mjs <compositionId> <outPrefix> <frame,frame,...> [scale=0.5]
// env: ENTRY (default src/index.ts), GL (default angle; try egl / swangle / vulkan if blank frames),
//      REMOTION_TMP (bundle temp dir, default .remotion-tmp: every bundle copies public/), INPUT_PROPS (JSON)
import fs from "node:fs";
import path from "node:path";

const tmp = path.resolve(process.env.REMOTION_TMP || ".remotion-tmp");
fs.mkdirSync(tmp, { recursive: true });
process.env.TMPDIR = process.env.TEMP = process.env.TMP = tmp;
const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");

const [id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
if (!id || !prefix || !frames) {
  console.error("usage: node scripts/stills.mjs <compositionId> <outPrefix> <frame,frame,...> [scale]");
  process.exit(1);
}
fs.mkdirSync(path.dirname(path.resolve(prefix)), { recursive: true });
const chromiumOptions = { gl: process.env.GL || "angle" };
const inputProps = process.env.INPUT_PROPS ? JSON.parse(process.env.INPUT_PROPS) : {};
const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.resolve(process.env.ENTRY || "src/index.ts"), publicDir: path.resolve("public") });
console.log("bundled", ((Date.now() - t0) / 1000).toFixed(1) + "s");
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const onBrowserLog = (l) => { if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300)); };
for (const f of frames.split(",").map(Number)) {
  // the iGPU's Chrome GPU process stalls now and then (the page never clears delayRender): retry the still
  for (let attempt = 1; ; attempt++) {
    const t1 = Date.now();
    try {
      await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 88,
        scale: Number(scale), chromiumOptions, inputProps, timeoutInMilliseconds: 120000, onBrowserLog });
      console.log("still", f, ((Date.now() - t1) / 1000).toFixed(1) + "s");
      break;
    } catch (e) {
      console.log(`still ${f}: attempt ${attempt} failed (${String(e.message || e).split("\n")[0].slice(0, 120)})`);
      if (attempt >= 3) throw e;
    }
  }
}
fs.rmSync(serveUrl.replace(/^file:\/\//, ""), { recursive: true, force: true }); // bundles never clean themselves up
