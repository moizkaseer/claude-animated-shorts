// What a short is, for the engine: its frames, shots (with their light), crossfades, camera, lens, the set it builds
// and the Kenney models it needs. Each short folder (src/shorts/<name>/index.ts) exports one ShortDef; Root.tsx
// registers it and scripts/export-timeline.mjs writes its timeline for the sound.
import type { Cam, Fg } from "./camera";
import type { LightName } from "./lights";
import type { SetFactory } from "./world";
import type { V3 } from "./core";
import type { Word } from "./words";
import type { CaptionStyle } from "./Captions";

/** one shot: frames [a, b), its light preset, optional sun override (degrees: az from the camera's forward axis
 *  toward screen right, el above the horizon; the sun is frozen per shot). Shorts add their own fields. */
export type ShotDef = { id: number; a: number; b: number; light: LightName; sunAz?: number; sunEl?: number };

/** a timed event for the sound (and the QA sheet): t in seconds, a name, anything else the audio wants */
export type Marker = { t: number; name: string; [k: string]: unknown };

/** the timing half of a short: everything here is plain maths (no DOM, no three.js), so story.ts can export it and
 *  scripts/export-timeline.mjs can run it in Node to write out/<id>/timeline.json for the sound and the QA */
export type Timeline = {
  frames: number;        // total frames at 30 fps
  shots: ShotDef[];      // ids 1..n in order, contiguous
  xfade: Record<number, number>; // crossfade length (frames) INTO shot id
  flashAt?: number;      // 4-frame white flash at this frame (after the hook)
  camAt: (id: number, f: number) => Cam;
  dofAt: (f: number) => { cInf: number; focus?: (f: number) => V3 };
  markers?: Marker[];    // sound / QA events (hits, snaps, pushes...)
  cuts?: number[];       // planned hard cuts inside shots (frames), for QA
  kicks?: [number, number][]; // impact kicks (s, gain), for QA
  constants?: Record<string, number>; // story constants the sound needs (e.g. SNAP), exported as-is
};

/** a whole short: its timeline plus the picture side (set, foreground props, Kenney models) */
export type ShortDef = Timeline & {
  id: string;            // Remotion composition id, e.g. "BridgeShort"
  title: string;
  foreground?: Fg[];
  kit?: string[];        // Kenney GLB names loaded from public/kit/kenney/<name>.glb (missing files are skipped)
  set: SetFactory;
  background?: string;   // DOM colour behind the canvas
  captions?: { words: Word[]; style?: CaptionStyle }; // burned-in word captions (engine/Captions.tsx); omit = none
  sightReach?: number;   // sight lines clear scenery up to this share of the lens -> subject distance (default 1;
                         // ~0.75 keeps walls / houses right behind the characters)
};

export const shotAt = (def: Timeline, f: number) => def.shots.find((s) => f >= s.a && f < s.b) ?? def.shots[def.shots.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (def: Timeline, f: number): { id: number; alpha: number }[] => {
  for (const s of def.shots) {
    const x = def.xfade[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(def, f).id, alpha: 1 }];
};
