// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
// day / golden are the bridge short's final values (4 verifier rounds); night / interior are new presets (2026-11-02),
// first tuned on test renders, not yet through a verifier round.
type C3 = [number, number, number];
export type LightName = "day" | "golden" | "night" | "interior";
export const LIGHT_NAMES: LightName[] = ["day", "golden", "night", "interior"];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
  contact: C3; blobTail: boolean;   // cast.ts ground shadows: tight contact pool colour; soft tail away from the sun (no real card shadows)
  sunVisible: boolean; disc: C3;    // draw the sun / moon disc + halo (HDR disc colour; halo = sunDisc x1.3)
  shadowMin: number;                // minimum half-size (m) of the sun shadow frustum (low suns throw long shadows)
  stars: number;                    // painted stars in the sky (0 = none)
};
export const LIGHTS: Record<LightName, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
    contact: [0.2, 0.21, 0.33], blobTail: true, sunVisible: false, disc: [6.0, 4.4, 2.4], shadowMin: 0, stars: 0,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
    contact: [0.24, 0.2, 0.33], blobTail: false, sunVisible: true, disc: [6.0, 4.4, 2.4], shadowMin: 30, stars: 0,
  },
  // moonlight: cool blue-white key from a high-ish moon (shown as a disc), deep violet-blue shade, blue haze. Warm
  // practicals (windows, lanterns: emissive HDR, see build.ts glow()) carry the colour contrast like the reference nights.
  night: {
    az: 35, el: 24,
    lit: [0.4, 0.5, 1.0], shade: [0.07, 0.08, 0.25], lift: [0.02, 0.03, 0.12], lambert: 0.35, sideK: 0.84, term: 0.15,
    charTint: [0.72, 0.8, 1.0], charShade: 0.84, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.82, 0.84, 1.0],
    blob: [0.55, 0.56, 0.75], actorShadow: false,
    top: "#0f1640", hor: "#3a4f9a", skyCurve: [0.0, 0.5, 0.6], fog: "#32468c", fogNear: 20, fogFar: 260, sunDisc: "#c9d6ff",
    sunCol: "#c9d6ff", sunI: 1.4, sky: "#3a4f9a", ground: "#1c1d3a", hemiI: 0.4,
    bias: -0.0004, normalBias: 0.02,
    contact: [0.16, 0.17, 0.32], blobTail: true, sunVisible: true, disc: [3.2, 3.5, 4.2], shadowMin: 0, stars: 1,
  },
  // indoors: warm key through a window / from the ceiling, soft lilac shade, no haze (fog pushed past the walls);
  // the sky stops are the day sky, seen through windows.
  interior: {
    az: 60, el: 52,
    lit: [1.45, 1.3, 1.06], shade: [0.36, 0.31, 0.42], lift: [0.06, 0.05, 0.1], lambert: 0.4, sideK: 0.86, term: 0.22,
    charTint: [1.0, 0.95, 0.88], charShade: 0.88, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.94, 0.9, 0.96],
    blob: [0.62, 0.58, 0.6], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 200, fogFar: 900, sunDisc: "#000000",
    sunCol: "#fff0d6", sunI: 2.6, sky: "#f3e6d0", ground: "#8a6a58", hemiI: 0.55,
    bias: -0.0003, normalBias: 0.012,
    contact: [0.24, 0.22, 0.32], blobTail: false, sunVisible: false, disc: [6.0, 4.4, 2.4], shadowMin: 0, stars: 0,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<LightName, WorldLook> = {
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
  night: {
    // deep indigo overhead, a lighter blue band at the horizon (reference nights: saturated blue, never black)
    sky: { c: ["#3a4f9a", "#2f4290", "#22327a", "#1a2666", "#0f1640"], e: [0, 4, 10, 20, 40] },
    water: { near: "#13235a", mid: "#1d3478", far: "#3a5aa8", crest: "#5f7fd0", trough: "#0b1640", glint: "#e8eeff", shade: [0.45, 0.5, 0.8] },
    cloud: { lit: "#9fb0e6", mid: "#6c7fc4", shade: "#3d4c92" },
    bounce: [0, 0, 0.02],
    sat: 1.2,
  },
  interior: {
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0.03, 0.02, 0.0],
    sat: 1.06,
  },
};
