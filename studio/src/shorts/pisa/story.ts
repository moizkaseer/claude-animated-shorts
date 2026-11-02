// "The Tower Saved by Wars": shot plan timed to the narration's WORDS (engine/words.ts), so replacing
// media/pisa/voice/words.json (placeholder -> real take) re-times every shot, cut, reaction and effect.
// The tower stands at the origin and leans toward +x; most cameras sit on the +z side looking toward -z
// (screen right = +x = the way it leans). Eras: now / medieval / 1934 / room (the Professor's classroom) / 1990 / whatif.
import { V3, clamp01, smooth, lin } from "../../engine/core";
import { Key, Dof, Fg, pushK, dolly, zoom, makeKickAt, makeCamAt, makeDofAt } from "../../engine/camera";
import type { ShotDef, Timeline } from "../../engine/short";
import { wordClock, Word } from "../../engine/words";
import words from "../../../media/pisa/voice/words.json";

export const W = wordClock(words as Word[]);
const f = W.f, s = W.s;
export const TOTAL = Math.round((W.end + 0.6) * 30);

export type Era = "now" | "medieval" | "1934" | "room" | "1990" | "whatif";
export type PisaShot = ShotDef & { era: Era; beat: string };
const cuts: [string, number, Era, PisaShot["light"], string][] = [
  // [first word of the shot, occurrence, era, light, beat]
  ["The Leaning Tower", 1, "now", "day", "hook: the leaning tower today"],
  ["because its builders", 1, "medieval", "day", "hook: builders turn into soldiers"],
  ["In 1173", 1, "medieval", "day", "1173: the first ring"],
  ["Five years", 1, "medieval", "day", "second floor: it tips"],
  ["It's sitting", 1, "medieval", "day", "soft wet mud, 3 m foundation"],
  ["So Pisa", 1, "medieval", "day", "they go to war"],
  ["For almost", 1, "medieval", "golden", "a hundred years go by"],
  ["When the builders", 1, "medieval", "day", "back: taller on the short side"],
  ["So now", 1, "medieval", "day", "a banana"],
  ["Then Pisa", 1, "medieval", "day", "a sea battle lost"],
  ["Centuries later", 1, "1934", "day", "1934: cement"],
  ["Luckily", 1, "1934", "day", "luckily"],
  ["Unluckily", 1, "1934", "day", "unluckily: it leans more"],
  ["You see", 1, "room", "interior", "the Professor: a sponge"],
  ["Squeeze it slowly", 1, "room", "interior", "slowly / fast"],
  ["Every war", 1, "room", "interior", "the chalkboard: every war"],
  ["Build it all", 1, "whatif", "golden", "built at once: it falls"],
  ["In 1990", 1, "1990", "day", "1990: closed, soil pulled out"],
  ["Now it's stable", 1, "now", "golden", "stable for 300 years"],
  ["Which in Pisa", 1, "now", "golden", "about three wars"],
];
export const SHOTS: PisaShot[] = cuts.map(([w, n, era, light, beat], i) => ({
  id: i + 1, a: i === 0 ? 0 : f(w, n), b: i + 1 < cuts.length ? f(cuts[i + 1][0], cuts[i + 1][1]) : TOTAL, light, era, beat,
  // the square at golden hour: the sun low behind the camera, so the face of the tower we see is lit (a side sun
  // split the drum into an orange and a purple half)
  ...(era === "now" || era === "whatif" ? (light === "golden" ? { sunAz: 150, sunEl: 12 } : { sunAz: 70, sunEl: 30 }) : {}),
}));
const A = (id: number) => SHOTS[id - 1].a;
export const XFADE: Record<number, number> = { 7: 8, 8: 8, 11: 10, 14: 8, 17: 6, 18: 8, 19: 8 };
export const FLASH_AT = A(3);

// ---------------- the tower's state over time ----------------
/** levels standing, lean (deg toward +x), banana (deg per level from the 4th), scaffold */
export type TowerState = { built: number; lean: number; banana: number; scaffold: boolean; era: Era };
const TIP0 = s("to tip"), TIP1 = TIP0 + 0.5;
export const towerAt = (id: number, t: number): TowerState => {
  const era = SHOTS[id - 1].era;
  switch (id) {
    case 1: case 19: case 20: return { built: 8, lean: 4.0, banana: 0.9, scaffold: false, era };
    case 2: return { built: 2, lean: 3, banana: 0, scaffold: true, era };
    case 3: return { built: lin([[s("starts building"), 0.15], [s("in Italy") + 0.4, 1]], t), lean: 0, banana: 0, scaffold: true, era };
    case 4: return { built: 2, lean: 3 * smooth((t - TIP0) / (TIP1 - TIP0)) + 0.4 * Math.max(0, Math.sin(Math.min(1, (t - TIP0) / 0.9) * Math.PI)) * clamp01((t - TIP0) / 0.5), banana: 0, scaffold: true, era };
    case 5: case 6: case 7: case 10: return { built: 2, lean: 3, banana: 0, scaffold: id !== 7, era };
    case 8: return { built: lin([[A(8) / 30 + 0.3, 2.2], [A(9) / 30, 5]], t), lean: 3.2, banana: 1.1 * smooth((t - A(8) / 30) / 2), scaffold: false, era };
    case 9: return { built: 5, lean: 3.4, banana: 1.1, scaffold: true, era };
    case 11: case 12: return { built: 8, lean: 4.9, banana: 0.9, scaffold: false, era };
    case 13: return { built: 8, lean: 4.9 + 0.9 * smooth((t - s("even more")) / 0.35), banana: 0.9, scaffold: false, era };
    case 17: { const k = clamp01((t - A(17) / 30) / 0.8); const fall = Math.max(0, t - s("falls")); return { built: 8 * smooth(k), lean: 3 + 70 * clamp01(fall / 0.9) ** 2, banana: 0, scaffold: false, era }; }
    case 18: return { built: 8, lean: lin([[A(18) / 30 + 1.0, 5.5], [A(19) / 30 - 0.2, 4.0]], t), banana: 0.9, scaffold: false, era };
    default: return { built: 8, lean: 4, banana: 0.9, scaffold: false, era };
  }
};

// ---------------- cameras ----------------
// people stand at z ~ 9-13 in front of the tower; ROOM_AT is the Professor's classroom, far away from the square
export const ROOM_AT: V3 = [1000, 0.05, 0];
/** the three blocks the builders work on (set.ts builds them, cast.ts stands a builder at the left of each) */
export const WORK_BLOCKS: [number, number][] = [[2.65, 12.4], [4.4, 12.1], [6.15, 12.5]];
const RX = ROOM_AT[0];
const S = (id: number, pos: V3, look: V3, rate = 0.0022, rest = {}) => (fr: number) => dolly(pos, look, pushK(fr, A(id), rate), { fov: 42, ...rest });
const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: (fr) => zoom([16, 1.7, 78], [4, 22, 0], 46, pushK(fr, 0, 0.0025)) }],
  2: [{ f: A(2), s: S(2, [3.9, 0.95, 18.6], [3.9, 2.1, 11.6], 0.0028, { fov: 46 }) }], // low: the builders at their blocks, the tower looming
  3: [{ f: A(3), s: S(3, [-16, 8.5, 36], [-1, 2.5, 4], 0.0018, { fov: 46 }) }],
  4: [{ f: A(4), s: S(4, [2, 2.5, 34], [1, 7.5, 0], 0.002, { fov: 44 }) }, { f: f("to tip") + 6, dur: 22, s: S(4, [6, 2.0, 26], [3, 9, 0], 0.003, { roll: 0.05, fov: 42 }) }],
  5: [{ f: A(5), s: S(5, [14.5, 0.9, 15.5], [7.4, 0.7, 5.5], 0.0025, { fov: 40 }) }],
  6: [{ f: A(6), s: S(6, [4.6, 1.2, 18.2], [4.4, 1.9, 11.6], 0.0028, { fov: 44 }) }, { f: f("goes to war"), dur: 30, s: S(6, [10.5, 1.5, 19], [9.8, 1.6, 11.6], 0.002, { fov: 44 }) }],
  7: [{ f: A(7), s: S(7, [-20, 2, 32], [1, 7, 0], 0.0018, { fov: 44 }) }],
  8: [{ f: A(8), s: (fr) => zoom([3, 12, 66], [3, 15, 0], 44, pushK(fr, A(8), 0.0015)) }],
  9: [{ f: A(9), s: S(9, [11, 2.0, 25], [4.5, 9, 4], 0.0025, { fov: 44 }) }, { f: f("banana"), dur: 18, s: S(9, [7.6, 1.7, 18.2], [7.3, 1.6, 11.6], 0.004, { fov: 40, roll: 0.04 }) }],
  10: [{ f: A(10), s: S(10, [2.8, 1.65, 18.0], [2.7, 1.45, 10.8]) }],
  11: [{ f: A(11), s: (fr) => zoom([30, 2.2, 46], [5, 12, 0], 44, pushK(fr, A(11), 0.002)) }],
  12: [{ f: A(12), s: S(12, [14.5, 1.75, 16.5], [12.3, 1.6, 12.0], 0.003, { fov: 36 }) }],
  13: [{ f: A(13), s: (fr) => zoom([20, 2.5, 72], [6, 22, 0], 46, pushK(fr, A(13), 0.0015)) }],
  14: [{ f: A(14), s: S(14, [RX + 1.3, 1.6, 2.3], [RX - 0.2, 1.3, -1.2], 0.0022, { fov: 40 }) }],
  15: [{ f: A(15), s: S(15, [RX + 1.05, 1.5, 1.7], [RX + 0.15, 1.35, -1.1], 0.003, { fov: 38 }) }],
  16: [{ f: A(16), s: S(16, [RX + 0.1, 1.6, 1.9], [RX - 0.15, 1.65, -2.6], 0.0025, { fov: 44 }) }],
  17: [{ f: A(17), s: (fr) => zoom([-6, 2, 92], [10, 22, 0], 48, pushK(fr, A(17), 0.0012)) }],
  18: [{ f: A(18), s: S(18, [-34, 2.2, 42], [-7, 8, 0], 0.0018, { fov: 44 }) }],
  19: [{ f: A(19), s: S(19, [4.6, 1.5, 31.5], [4.6, 6, 0], 0.002, { fov: 50 }) }],
  20: [{ f: A(20), s: S(20, [2.6, 1.7, 16.2], [1.6, 1.62, 12.2], 0.004, { fov: 36 }) }],
};
export const KICKS: [number, number][] = [[TIP0, 0.8], [s("even more"), 0.9], [s("falls") + 0.75, 1.6]];
export const camAt = makeCamAt(CAMS, makeKickAt(KICKS));

// ---------------- lens ----------------
const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: A(2), cInf: 10 },          // builders MS
  { f: A(3), cInf: 6 },
  { f: A(4), cInf: 0 },
  { f: A(5), cInf: 12 },          // low at the mud
  { f: A(6), cInf: 8 },
  { f: A(7), cInf: 0 },
  { f: A(9), cInf: 0 },
  { f: f("banana"), cInf: 12 },
  { f: A(10), cInf: 10 },
  { f: A(11), cInf: 0 },
  { f: A(12), cInf: 13 },         // engineer CU
  { f: A(13), cInf: 0 },
  { f: A(14), cInf: 8 },          // classroom
  { f: A(15), cInf: 12 },
  { f: A(16), cInf: 6 },
  { f: A(17), cInf: 0 },
  { f: A(19), cInf: 6, focus: () => [4.4, 1.6, 22.4] }, // the tourists sharp, the tower they "hold" a little soft
  { f: A(20), cInf: 14 },         // the Professor CU, tower soft behind him
];
export const dofAt = makeDofAt(DOF);
export const FOREGROUND: Fg[] = [];

export const timeline: Timeline = {
  frames: TOTAL, shots: SHOTS, xfade: XFADE, flashAt: FLASH_AT, camAt, dofAt, kicks: KICKS,
  cuts: [],          // every change inside a shot is a glide; shot changes are planned anyway
  markers: [
    { t: TIP0, name: "tip" }, { t: s("go to war"), name: "war" }, { t: s("goes to war"), name: "war" }, { t: s("banana"), name: "banana" }, { t: s("battle"), name: "battle" },
    { t: s("tons of cement"), name: "cement" }, { t: s("even more"), name: "lurch" }, { t: s("Squeeze it slowly"), name: "squeeze_slow" },
    { t: s("Squeeze it fast"), name: "squeeze_fast" }, { t: s("falls"), name: "fall" }, { t: s("falls") + 0.75, name: "crash" },
    { t: s("pulled soil"), name: "drill" }, { t: s("three wars"), name: "end" },
  ],
};
