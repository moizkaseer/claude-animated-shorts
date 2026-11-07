// Master the supplied am_liam narration for the Noobyville review.
// Does not pitch-shift or time-stretch the speech. Voice only, no bed.
// Target: about -14 LUFS, true peak under -1 dBTP after AAC.
// loudnorm internally upsamples; aresample=48000 is applied again afterwards.
// Output length is exactly 889 frames at 30 fps (1,422,400 samples at 48 kHz).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out/momroblox/audio");
fs.mkdirSync(root, { recursive: true });
const input = path.resolve("media/momroblox/voice/voice.wav");
const output = path.join(root, "mix.wav");
const af = [
  "aresample=48000",
  "alimiter=limit=-6dB:level=disabled:attack=3:release=80",
  "loudnorm=I=-14:TP=-1.8:LRA=11",
  "volume=0.4dB",
  "alimiter=limit=-1.7dB:level=disabled",
  "aresample=48000",
  "apad=whole_dur=29.633333",
  "atrim=end_sample=1422400",
].join(",");
const r = spawnSync("ffmpeg", [
  "-y", "-hide_banner", "-v", "error", "-i", input,
  "-af", af, "-c:a", "pcm_s16le", output,
], { stdio: "inherit" });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log(output);
