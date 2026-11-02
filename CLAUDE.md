# Claude Animated Shorts: working notes for Claude

YouTube Shorts studio: 2D cartoon cards in a 3D toon world, three.js inside Remotion. `SKILL.md` is the full
pipeline and every look rule; read it before working on a short.

- Code: `studio/` (run every command from there). Engine in `studio/src/engine/`, one folder per short in
  `studio/src/shorts/<name>/` (registered in `studio/src/shorts/index.ts`), sound in `studio/audio/`.
- Check types with `npx tsc --noEmit`. Look at changes with `node scripts/stills.mjs <CompositionId> out/<x>/a_ <frames> 0.5`
  and read the JPEGs.
- Engine changes must not change the bridge short by accident: render the same bridge frames before and after and
  compare pixels (rendering is deterministic). Same for the sound: same voice in, identical `mix.wav` out.
- The picture's timing reaches the sound only through `out/<name>/timeline.json` (`node scripts/export-timeline.mjs <name>`).
- The channel's host is The Professor (`studio/src/characters/host.ts`); every short features him. Channel topic:
  mixed weird true facts. The owner uploads by hand with the kit from `node scripts/upload-kit.mjs <name>`.
- Never upload the bridge short as the channel's own: it is the template author's story.
- `references/` is private style study material from another channel: never upload or publish it, never copy its
  scripts, characters or shots, never name the channel.
- This machine: Intel iGPU, renders are slow (GPU-bound); `GL=angle` only (egl hangs). Run long renders in the
  background; `scripts/render.mjs` resumes from finished chunks.
