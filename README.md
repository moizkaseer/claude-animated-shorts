# Claude Animated Shorts

A Claude skill plus a working studio for 55-70 s vertical animated story shorts: 2D characters in a colourful 3D
world, with ink outlines, painted sets, lens blur, gliding cameras, an original synthesized score and sound effects.
Everything is rendered with three.js inside Remotion on your own PC, with no AI video generator.

Proven on **The Bridge That Fell for a Song**, a 67 s short about the 1831 Broughton bridge (`studio/src/shorts/bridge`).

## What's inside
| Path | What it is |
|---|---|
| `SKILL.md` | The skill: the full pipeline, every rule, the final look values, gotchas, readability traps |
| `studio/` | The Remotion project (see below) |
| `references/STYLE_BIBLE.md` | The script and visual formula measured from 20 reference shorts |
| `references/reports/` | Seven measured reports: motion, depth, textures, characters, lighting, outlines, grade |
| `references/frames/`, `references/sheets/` | 38 reference frames and 20 contact sheets (style study only) |

### studio/
| Path | What it is |
|---|---|
| `src/engine/` | The shared look: World, Short (post chain), ink, lens blur, grade, two-tone shading, character cards, camera grammar, light presets (day, golden, night, interior), water |
| `src/engine/sets/` | Reusable sets: `land` (ground, hills, trees, path, lake), `street` (houses, road, lamps, lit windows at night), `room` (interior with window, wallpaper, floor), `props` (lamps, benches, crates, furniture...) |
| `src/characters/` | The channel's own characters: the host, The Professor (`host.ts`), his model sheet and the concept sheet |
| `src/shorts/<name>/` | One folder per short: `story.ts` (timing, cameras, lens), `set.ts`, `cast.ts`, `index.ts` |
| `audio/engine/`, `audio/shorts/<name>/` | Synth instruments, SFX generators, DSP, the mixer; each short's cues, score and mix settings |
| `media/<name>/` | Script and voice (`voice/voice.wav`, `voice/words.json`) |
| `scripts/` | `new-short`, `stills`, `export-timeline`, `render` (resumable, mux, QA), `upload-kit`, `qa.py`, `sbs_sheet.py` |

## Setup
1. Node 22, Python 3 with numpy, scipy and Pillow, Google Chrome or Remotion's headless shell (downloaded on first render).
2. `cd studio && npm install`
3. Optional: a full ffmpeg build on PATH (or `FFMPEG` / `FFPROBE`) for the QA loudness line; the join and mux use
   Remotion's bundled ffmpeg.
4. Optional: Kenney CC0 models in `studio/public/kit/kenney/<name>.glb` (lanterns, carts, stalls...; trees are procedural).
5. To use it as a Claude skill, link or copy this folder to `~/.claude/skills/cartoon-3d-short/`, then in Claude Code
   say *"Use the cartoon short skill and make a short about ..."*.

## Commands (from `studio/`)
```bash
node scripts/new-short.mjs <name> "Title"                    # new short from the starter template
node scripts/stills.mjs <CompositionId> out/<name>/x_ 100,400 0.5   # test stills
npx remotion studio src/index.ts                             # live preview in the browser
node scripts/export-timeline.mjs <name>                      # picture timing -> out/<name>/timeline.json
python3 audio/mix.py <name>                                  # soundtrack -> out/<name>/audio/mix.wav
node scripts/render.mjs <name>                               # 2K render, mux, QA -> out/<name>/<name>_final.mp4
node scripts/upload-kit.mjs <name>                           # checks + file + cover frames + UPLOAD.md to paste
node scripts/stills.mjs HostSheet out/characters/host_ 0 1   # the host's model sheet
```

## Notes
- Story, characters and voice should always be your own. Use the references for the look, not the content.
- Each Remotion bundle copies `public/` into `.remotion-tmp/` (set `REMOTION_TMP` to move it); the scripts clean up after themselves.

## License
The code and docs are MIT (see `LICENSE`). The reference frames are included for style study only.
