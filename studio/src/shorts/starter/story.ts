// Starter short: the template to copy for a new video (scripts/new-short.mjs does it) and the test of the engine's
// light presets and sets. Four 2.5 s shots: day street, golden lake, night street, interior room.
// Timing rules (SKILL.md): every visual reaction lands 0-3 frames before its word; holds always push in; big
// reframes are cuts; glides 18-40 f. Replace SHOTS / CAMS / DOF / markers with your story, keep the export shape.
import { V3 } from "../../engine/core";
import { Key, Dof, Fg, pushK, dolly, zoom, makeKickAt, makeCamAt, makeDofAt } from "../../engine/camera";
import type { ShotDef, Timeline } from "../../engine/short";

export const TOTAL = 300;
// add your own per-shot fields (who is on screen, story time...) to this type and read them in set.ts / cast.ts
export type StarterShot = ShotDef & { scene: "street" | "lake" | "room" };
export const SHOTS: StarterShot[] = [
  { id: 1, a: 0, b: 75, light: "day", scene: "street" },
  { id: 2, a: 75, b: 150, light: "golden", scene: "lake", sunAz: 10, sunEl: 8 },
  { id: 3, a: 150, b: 225, light: "night", scene: "street", sunAz: 40, sunEl: 22 },
  { id: 4, a: 225, b: 300, light: "interior", scene: "room", sunAz: 55, sunEl: 45 },
];
export const XFADE: Record<number, number> = { 2: 8, 3: 8, 4: 8 };
export const FLASH_AT: number | undefined = undefined;

// where things are (the set and the cast read these too)
export const LAKE: { x: number; z: number; rx: number; rz: number } = { x: -70, z: 30, rx: 16, rz: 10 };
export const ROOM_AT: V3 = [1000, 0.05, 0];              // the room is built far from the street (past its hills), at this offset
export const LAMP_Z = 7;                                 // a street lamp at x = +4.1 (right pavement), z = 7

// ---- cameras: each shot pushes in from its first frame; shot 1 cuts closer on frame 40 ----
const S1a = (f: number) => dolly([1.6, 1.75, -8], [4.6, 1.35, 2.2], pushK(f, 0, 0.0025), { fov: 42 });
const S1b = (f: number) => dolly([3.6, 1.6, -2.5], [4.5, 1.5, 1.6], pushK(f, 40, 0.003), { fov: 38, roll: 0.03 });
const S2a = (f: number) => dolly([LAKE.x + LAKE.rx + 5, 1.6, LAKE.z - 6], [LAKE.x + LAKE.rx - 1.2, 1.2, LAKE.z + 1], pushK(f, 75, 0.0022), { fov: 40 });
const S3a = (f: number) => zoom([1.5, 1.6, LAMP_Z - 9], [4.0, 1.9, LAMP_Z + 1], 42, pushK(f, 150, 0.0025));
const S4a = (f: number) => dolly([ROOM_AT[0] + 1.9, 1.6, 2.6], [ROOM_AT[0] - 0.4, 1.1, -1.5], pushK(f, 225, 0.002), { fov: 44 });
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 40, cut: true, s: S1b }],
  2: [{ f: 75, s: S2a }],
  3: [{ f: 150, s: S3a }],
  4: [{ f: 225, s: S4a }],
};
export const KICKS: [number, number][] = [];
export const camAt = makeCamAt(CAMS, makeKickAt(KICKS));

// ---- lens: blur the background on the close framing and the room, keep the wides sharp ----
const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 40, cInf: 12, focus: () => [4.6, 1.6, 1.8] },
  { f: 75, cInf: 7 },
  { f: 150, cInf: 0 },
  { f: 225, cInf: 8 },
];
export const dofAt = makeDofAt(DOF);

// ---- near framing props (Kenney names or cartoon plants), one per shot at most ----
export const FOREGROUND: Fg[] = [
  // e.g. { a: 75, b: 150, kit: "plant_bushDetailed", pos: [x, 0, z], s: 1.0 }: a whole object at 0.3-0.5 x the focus
  // distance covering 10-25 % of one frame edge. Check it on a still: cut off by the frame or blurred into a blob, it
  // reads as a "green ball" (SKILL.md readability traps), so this starter has none.
];

export const timeline: Timeline = {
  frames: TOTAL, shots: SHOTS, xfade: XFADE, flashAt: FLASH_AT, camAt, dofAt,
  kicks: KICKS, cuts: [40], markers: [{ t: 40 / 30, name: "cut_close" }], constants: { LAMP_Z },
};
