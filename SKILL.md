---
name: cartoon-3d-short
description: Make a ~55-70 s vertical cartoon story short in the "2D characters in a colourful 3D world" style (flat bean-head cartoon cards with ink outlines, painted 3D world with black ink lines, saturated sky, depth-of-field backgrounds, gliding cameras, voice narration, synthesized SFX + original music), rendered with three.js inside Remotion from the studio/ project in this repo. Proven on "The Bridge That Fell for a Song" (2026-10-31). Use when the user asks for a new short / YouTube Short in this style, "like the bridge video", a history/science story short with cartoon characters in 3D, or says "use the cartoon short skill".
---

# Cartoon 3D story short (three.js + Remotion)

Everything lives in `studio/` (a Remotion project) of this repo:
- `src/engine/`: the look, shared by every short (ink, lens blur, grade, two-tone shading, card characters, sky, water,
  camera grammar, light presets day / golden / night / interior) and `src/engine/sets/` (land, street, room, props).
- `src/shorts/<name>/`: one folder per short: `story.ts` (timing: shots, cameras, lens, markers), `set.ts` (the
  scenery), `cast.ts` (who stands where), `index.ts` (its ShortDef). Registered in `src/shorts/index.ts`.
- `audio/engine/` (DSP, synth instruments, SFX generators, mixer) + `audio/shorts/<name>/` (timeline.py, sfx.py,
  music.py, mixcfg.py); `audio/mix.py <name>` makes the soundtrack.
- `media/<name>/`: SCRIPT.md, `voice/voice.wav` + `voice/words.json`.  `out/<name>/`: everything rendered.
- `src/characters/`: the channel's own characters. **The host is THE PROFESSOR** (`characters/host.ts`: bald
  crown with white puffs, white moustache, round glasses, red bow tie, brown tweed jacket; deadpan, knows every weird
  fact). He appears in every short: `host(out, cam, t, x, y, z, { mode: "stand" | "explain" | "sit" | "walk", expr,
  facing, swaps })` in the short's cast.ts. Model sheet: `node scripts/stills.mjs HostSheet out/characters/host_ 0 1`.
  Never redesign him per short: change `host.ts` only on purpose, and check the sheet.
- Channel: mixed weird true facts (history and science). Uploads are manual (the upload kit, step 12).
- Examples: `bridge` (the full proven short, 67.5 s; it is the template author's story, so never upload it as ours)
  and `starter` (10 s template with the host: day street, golden lake, night street, interior room). Style research:
  `references/` (STYLE_BIBLE.md, reports/*.md, frames/, sheets/).

The style reference is a channel studied privately (`references/`).
- Those videos are private study material. Never upload, publish or send them.
- Never copy their scripts, characters or shots. Story, characters and voice are always OUR OWN.
- Never say the channel's name in a voice-over or description.

House rules (defaults from the original author; the channel owner may change them, ask once):
- No captions or labels in the video. English only. Voice: one steady tone. Jokes are researched real facts.
- Standard mix: music +3 dB, SFX -6 dB, voice unchanged.
- Final export 2K vertical: 1440x2560 (`--scale 1.3333`).
- A fresh verifier agent checks the look (see the look-match loop). Save after every step.
- "Just do it" once the script is approved.

## Pipeline (run commands from `studio/`)
0. **New short:** `node scripts/new-short.mjs <name> "Title"` (copies `src/shorts/starter`, registers it, creates
   `media/<name>/SCRIPT.md` and a minimal `audio/shorts/<name>/`).
1. **Topic and facts.** One surprising true story with a physical cause and effect (it should be visual), plus a
   simple everyday analogy that explains it. Facts with their source at the top of `media/<name>/SCRIPT.md`.
2. **Script** (~3.7 words/s, 55-70 s). Beat formula (20/20 reference videos follow it, see STYLE_BIBLE.md):
   - **Hook:** the absurd fact in one line ("Seventy-four soldiers knocked down an iron bridge just by walking across it.").
   - **Setting:** year, place, pride. **Action:** three or four beats, each a little bigger. **Snap:** the moment it breaks.
   - **Deadpan double line:** "Luckily ... / Unluckily ...".
   - **"You see,"** one physics idea through an everyday analogy (the kid on a swing).
   - **Consequence:** the rule it created. **Callback twist:** the ending, the video ends on the last word.
   - Never describe on screen what the viewer already sees. Example: `media/bridge/script.txt`.
3. **Voice.** Record or generate `media/<name>/voice/voice.wav` (48 kHz) and its word timings `words.json`
   (`[{"w", "s", "e"}]`, any speech-to-text with word times; hand-fix them: everything is timed to words.json).
   Before the real voice exists: `python3 audio/tools/scratch_voice.py <name> <script.txt>` writes a placeholder
   (timed buzz per word) so shots and sound can be laid out.
   - The channel voice is ElevenLabs "George" (premade British storyteller, voice id JBFqnCBsd6RMkjVDRZzb, model
     eleven_v4, prompt prefix "[dry, deadpan, brisk storytelling pace]"). Free-plan audio is non-commercial with an
     elevenlabs.io credit: fine for an unmonetized channel; a monetized one needs a paid plan WHEN generating.
     The free queue is often busy ("Free generations are busy"): retry in a later turn, never twice in one turn.
   - Word timings without a transcription service: `python3 audio/tools/align_voice.py <name> <take.mp3>
     media/<name>/script.txt --tighten` (energy pauses pinned to word boundaries; also caps pauses at 0.10 / 0.16 /
     0.26 s). George reads ~2.8 words/s with long pauses: tightening + `atempo=1.06` brought Pisa from 82 s to 69 s.
     With a transcript (ElevenLabs Scribe, Whisper): `python3 audio/tools/import_voice.py <name> <audio> <words.json>`.
   - Shots are written against PHRASES of words.json (`engine/words.ts`: `W.f("goes to war")`), never frame numbers:
     a new take re-times everything. Prefer phrases: short words repeat ("in" was in "In 1173", "in Italy", "five
     years in" and "In 1990").
4. **Shot plan** in `src/shorts/<name>/story.ts` (copy patterns from `bridge/story.ts`):
   - `SHOTS`: id, a/b frames, `light` (day / golden / night / interior), optional `sunAz` / `sunEl`, your own fields.
   - `XFADE` (crossfades at place/time changes), `FLASH_AT` (white flash after the hook).
   - `CAMS`: per-shot keys `{f, dur?, cut?, s: f => dolly(...) | zoom(...)}` with `pushK` push-ins (engine/camera.ts).
   - `KICKS` (impact flip-shakes), `DOF` (lens blur per beat), `FOREGROUND` (near framing props).
   - `timeline` export (Timeline: frames, shots, xfade, flashAt, camAt, dofAt, kicks, cuts, markers, constants).
   - Every visual reaction lands 0-3 frames before its word (cast.ts `LEAD`, `lidAt(t, i, swaps)`).
5. **World** (`set.ts`): build from `engine/sets` (`land`, `street`, `room`, `props`: lamps, benches, crates,
   barrels, fences, tables, chairs, sofas, beds, shelves, rugs, frames, ceiling lamps, counters), engine `build.ts`
   (`house`, `prop`, `Batch`, `Strand`, cartoon trees), `paint.ts` textures and `Water`. Write new pieces the same
   way (boxes + painted canvas textures, two-tone `lam()` materials). Things only seen at night (lit windows, lamp
   glows, light pools) go in a `LightGroup` that `pose()` shows per light. The room shell never casts shadows.
   Big sets far apart (e.g. a room at x = 1000) can share one set; scenery in front of any lens is culled
   (`sightReach` on the ShortDef: 0.75 keeps walls right behind the characters).
6. **Characters** (`cast.ts`): `beginStage(light, cam)`, the host with `host()` (characters/host.ts), then `person()` cards (front / side view by `viewOf`),
   `blob()` ground shadows, `lidAt()` blinks, effect cards (`fxBurst`, `fxSplash`, `fxStars`, `fxNote`, `fxPuff`...).
   Outfits and hats in `engine/toon.ts` (`Outfit`: jacket, pants, boots, hat cap / hair / tophat / bonnet / shako /
   pith / beanie / tufts, dress, moustache, glasses, bowtie, scarf, goggles, bag, build adult / stout / kid); add new
   hats / props there, keeping the construction rules below. Pass `seed` in the options to fix a recurring
   character's face.
7. **Post** is automatic (engine/Short.tsx): ink -> lens pre -> lens main -> bloom -> NEUTRAL tone map -> grade (MSAA 4).
8. **Sound** (`audio/shorts/<name>/`): `node scripts/export-timeline.mjs <name>` writes `out/<name>/timeline.json`
   (shots, crossfades, flash, cuts, kicks, markers, constants and the camera of every frame), then fill `sfx.py`
   (Cue list, distances via `tl.cam_distance`), `music.py` (score from `instruments.py`, SECTIONS) and `mixcfg.py`,
   then `python3 audio/mix.py <name>` -> `out/<name>/audio/mix.wav` (-15 LUFS, <= -1.2 dBTP), stems, cues.md.
   Lock the picture timing first; any later timing change: re-export the timeline, delete `out/<name>/audio/_cache`,
   re-run the mix.
9. **Look checks.** `node scripts/stills.mjs <CompositionId> out/<name>/x_ 100,400 0.5`. Side-by-sides against the
   reference: `python3 scripts/sbs_sheet.py out.jpg --ours a.jpg b.jpg --ref ../references/frames/short03_0060.jpg`.
   Send 1-3 sheets to a fresh verifier agent (strongest model, max effort): a <=200-word verdict + numbered fixes.
10. **Final render.** `node scripts/render.mjs <name>` (2K, resumable chunks, joins, muxes the mix, runs
    `scripts/qa.py`: black / white / frozen / pop frames outside the planned cuts, loudness, per-shot colour, 2 s
    contact sheets in `out/<name>/qa/`). Fix what QA finds, re-render only the affected chunks (delete them).
11. **Deliver** `out/<name>/<name>_final.mp4`, write notes, update memory.
12. **Upload kit.** `node scripts/upload-kit.mjs <name>`: the first run writes `media/<name>/youtube.json` (title
    <= 100 characters, description with the sources, tags, made-for-kids, cover times); fill it in, run again. It
    checks the video (9:16, >= 1080x1920, <= 3 min, audio) and writes `out/<name>/upload/` (the MP4, cover frame
    candidates, UPLOAD.md with everything to paste and the settings checklist). The channel owner uploads it in
    YouTube Studio or the app. (API uploads from an unverified Google Cloud app stay private until Google audits it.)

## Final look values (bridge after 4 verifier rounds; the engine defaults)
Opus-max scores at the end: colour day 7, golden 5-6, lighting 5-6, ink 6, textures 5-6, characters 7, depth 6-7,
composition 6-7 (from 5/3/4/5/4/7/4/6 at the start). night / interior are new (2026-11-02) and have not been
through a verifier round yet: tune them on the first short that uses them.
- **Light presets** (`engine/lights.ts`, sun camera-relative and frozen per shot):
  - day: az 75 / el 48, lit [1.58,1.5,1.33], shade [.30,.29,.36], lift [.05,.06,.11] (cool tint ONLY in shade), sky
    top #3e7fd2 → horizon #b8d0ec, fog = horizon, 25→300 m, uSat 1.08.
  - golden: az 6 / el 7 (backlit low sun), key toward #FFB36B ×1.5, violet-blue shade (facade ≈ #444380), sky
    #ffc47c → #8a6f8a, peach fog only past 50 m, sun disc #ffcf9e + bloom, contact blobs + real card shadows.
  - night: moon az 35 / el 24 (disc shown), lit [.4,.5,1.0], deep indigo sky with stars, blue fog 20→260 m; warm
    practicals (lit windows, lamps, light pools: HDR emissive, bloom) carry the colour contrast.
  - interior: warm key az 60 / el 52, lilac shade, no haze; the day sky shows through windows.
- **Albedos** (`paint.ts`/`build.ts`): muted brick / cream / ochre / terracotta houses with plinth, cornice, sills,
  hoods, door step, chimney + pot; warm grey/beige stone; ochre wood C* ~51-58 with near-black seams; iron dark and
  desaturated. Never lemon, never lavender lit faces. Dark materials are coloured darks (navy, aubergine), never black.
- **Ink** (`ink.ts`): #030303, 5.1 px near (6 m) → 3.3 px far (90 m) at 1080x1920, creases ×0.8 from 35°, depth
  jumps from 1 %, fog tint 0.3 only far; character cards on layer `NOINK` (they carry their own plum ink #241726).
- **Lens** (`dofAt`): cInf px at 1080: hook/river CU 15-16, close-ups 12-14, MS 10-12, park 7, golden sway 5,
  wides/aerials 0. Focus on the eyes of the front row. Change blur only on cuts or ramped with a camera glide.
- **Post**: bloom thr 1.0, int .5, 6 levels, radius .6; NEUTRAL tone map; grade per light; MSAA 4. Film grain exists
  but is OFF (the reference measures none; it quadruples the file size and turns to mush on YouTube).
- **Characters** (`toon.ts`/`cast.ts`/`cardshade.ts`): bean heads h/w .94, plum ink #241726, eyes .26 W apart, no
  blush, no catchlights, 14 expressions; adults 3.5 head-heights, legs 1.4 HH, single-stroke limbs, ink-dot hands;
  walk bob 3-7 %, lean 1-7°, planted feet; blinks every 0.5-2.3 s (4 f: half / shut / shut / half) and across every
  expression swap; tight contact shadow + sun-direction tail by day; golden rim inner only.
- **Camera** (`engine/camera.ts`): cuts on big jumps (> half a frame width or 40 % zoom); everything else a
  smootherstep glide of 18-40 f (peak ≤ 25 px/f at 720p); every hold pushes in 0.15-0.35 %/f, 0.6 %/f for ~35 f on
  punch words; rolls 4-8° over ≥ 18 f on emphasis beats; no hand-held float; impact kicks flip sign every frame and
  decay over 7 f; foreground props in ~1/3 of MS/CU; camera height ~0.8 × character height (few low shots).

## Look targets (measured from the reference; details in references/reports/)
- **Ink:** silhouettes, depth jumps and convex creases only; no line on wall/floor joins or the horizon; lines keep
  about the same width with distance and blur with the DOF. Character cards are never outlined by the world ink.
- **Colour:** day median luma ~.57; non-ink p5 ~.23 (no crushed blacks); lit chroma C* p90 ~55; day sky top ~#5e93d9,
  horizon 1.28× brighter. Golden: peach horizon #ffd08a, violet-blue shadows (never brown), backlit sun.
- **Depth:** DOF on about 1/3 of screen time (CU, MS, inserts), cInf 10-16 px at 1080, focus on the eyes; establishing
  and wide shots stay sharp. Fog = horizon colour. Bloom only on HDR emissives (threshold 1.0).
- **Framing:** head top at y ≈ .28 (CU), .35 (MS), .38 (FS), .50 (WS); horizon .40-.50; fov 34-46; ~22 % of
  reference shots are close-up inserts of objects (the reference's DOF lives there).

## Look-match loop (how the bridge look was reached; reuse for any "make it look like X" pass)
1. **Measure the reference first.** One analysis agent per topic (motion, depth, textures, characters, lighting,
   outlines, grade), numbers not adjectives, written to `references/reports/<topic>.md` (shared brief:
   `references/reports/CONTEXT.md`). Note: the reference videos and the measuring scripts are NOT in this repo; only
   the reports, 38 frames and 20 contact sheets are.
2. **Sandboxes, one owner per file.** Copy the short's folder (and the engine files an owner may touch) to
   `src/sandboxes/<n>/` with its own entry `index.tsx` (copy `src/index.ts` + `src/Root.tsx`, change the imports).
   Ownership used for the bridge: cam = story.ts; world = world.ts, lights.ts, shade.ts, grade.ts; mat = paint.ts,
   build.ts (+ sets); char = toon.ts, cast.ts, cardshade.ts; post = ink.ts, Short.tsx, lensblur.ts. Agents edit only
   their own files and render stills with `ENTRY=src/sandboxes/<n>/index.tsx node scripts/stills.mjs ...`.
3. **Merge** the owned files back, `npx tsc --noEmit`, re-sync every sandbox from main before the next round.
4. **Verify** with a fresh agent: side-by-side sheets, a score out of 10 per area (colour day / golden, lighting,
   ink, textures, characters, depth, composition) plus a numbered fix list with frame numbers. Map each fix to the
   file owner and resume that owner's agent (keeps its context).
5. Contracts between owners live in exported constants (`NOINK` from ink.ts, `dofAt`/`FOREGROUND` from story.ts,
   `LIGHTS`/`LOOK` from lights.ts, `TONE`/`CHAR` from shade.ts). Changing a contract means telling every owner.
6. **Engine changes must keep the bridge identical** (or be deliberate look changes): render the same frames before
   and after (`out/base/`), compare pixels (rendering is deterministic: identical code gives identical JPEGs).

## This machine (Linux laptop, Intel UHD 620, no NVIDIA, 14 GB RAM; measured 2026-11-02)
- WebGL works through Chrome's ANGLE backend (`GL=angle`, the default). `GL=egl` hangs. Very rarely a frame stalls
  the GPU process (seen twice in ~100 stills): stills then time out, `render.mjs` retries the chunk.
- Speed (measured): a test still takes 5-25 s (mostly scene setup); video at --scale 0.5 runs 0.24-0.3 fps (a 10 s
  starter: 18 min); the 1440x2560 final runs ~0.12 fps, so a 67 s short takes ~4.5 hours. Run it in the background,
  it resumes where it stopped. Cost split: lens blur ~25 %, ink ~10 %, the rest is the scene itself (4096 shadow map,
  MSAA 4, redrawing / uploading character cards); preview with --scale 0.5 and render 2K once, at the end.
- ffmpeg: Remotion's bundled one (in node_modules, no ebur128) is used for the join and mux; set `FFMPEG`/`FFPROBE`
  (or link a full build into ~/.local/bin) for the QA loudness line.

## Gotchas
- Kenney models are optional (`public/kit/kenney/<name>.glb`, CC0 from kenney.nl): trees, bushes, hedges and
  banners are procedural anyway; missing files are skipped with one console warning. Their nature-kit materials are
  teal: `build.ts` recolours them by material name.
- Cameras end up inside houses: the sight-line culler removes anything blocking a camera ray (`sightReach`).
- Ink in the same merged effect pass as DOF gets overwritten. Ink must be its own pass before the blur.
- Pixel-sized post parameters scale with resolution: stills at 0.5, the final at 1.333. R3F clamps dpr to ≥ 1, so
  `--scale 0.5` stills still render a 1080x1920 buffer.
- **Disk:** every Remotion bundle copies `public/` into the temp folder (`.remotion-tmp/` here; set REMOTION_TMP to a
  big drive). The scripts delete their own bundle; if a run is killed, empty `.remotion-tmp/` by hand.
- Remotion writes a silent audio track: the render renders muted and the mux maps `-map 0:v:0 -map 1:a:0`.
- Sub-agents may not be able to write report files: ask for a ≤150-word final message and save it yourself.
- Scratch `.ts` files inside `src/` break `tsc`: keep scratch out of `src/`.
- Film grain at 2.5 % made the 2K file 910 MB instead of ~250 MB. Keep it off.
- The mixer refuses NaN samples (they used to be written as silence). A section with no speech is levelled against
  the whole voice.

## Readability traps the verifier caught (check every new prop/shot for these)
- **A swing drawn as one rope that disappears behind the kid reads as a HANGING.** Always two ropes to a wide plank
  with the kid between them (`swingKid` in toon.ts), and a frame whose legs clear the arc (A-frame at each end).
- Props closer than ~2 m to a lens become huge cut-off blobs at the frame edge. When a camera moves, re-check every
  prop near its new position.
- A foreground bush cut by the frame edge or blurred by the DOF reads as a "green ball"; a foreground prop must be
  recognisable or gone (it happened again on the starter's lake shot).
- Flags: red + yellow star/diamond reads as Vietnam's. Use a period-correct flag (St George's cross for England 1831).
- Painted signs lit by a side sun go grey-blue and unreadable: give the sign face an unlit material.
- Golden rim light done as an offset outer copy turns every hat into a picture frame: inner rim only, head/torso only.
- Railings at chest height through characters: put the lens ~2.5 m up so rails cross legs, not torsos.
- Flat holds read as freezes in QA (frozen span ≥12 f): every hold needs a creeping push-in.
- A character standing behind another (same line from the lens) disappears: stagger them sideways.
