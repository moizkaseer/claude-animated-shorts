// The channel's host: THE PROFESSOR (chosen 2026-11-02 from concept round 1). Deadpan, knows every weird fact.
// This file is his locked design: change it here and every short changes with it (render the model sheet after any
// change: node scripts/stills.mjs HostSheet out/characters/host_ 0 1). Our own design; never based on a reference
// character.
//   look: stout build, bald crown with soft white side puffs, white moustache, round dark glasses, red bow tie,
//         brown tweed jacket, slate trousers, brown shoes. Signature pose: one hand raised, explaining.
import type { Outfit, Expr, FrontOpts, SideOpts } from "../engine/toon";
import { Stage, CamInfo, Who, person, lidAt, blob, viewOf } from "../engine/cast";

export const HOST_NAME = "The Professor";
export const HOST: Outfit = {
  jacket: "#8a6a4a", pants: "#3b3f52", boots: "#4a3426", build: "stout", skin: "#ffe2c2",
  hat: "tufts", hair: "#ece8e0", moustache: "#ece8e0", glasses: "#2a201a", bowtie: "#c0353a",
};
/** fixed head shape (the same face in every short) */
export const HOST_SEED = 3;
/** stable character index: blinks and caches never collide with crowd indices (0-999) */
export const HOST_I = 1000;
const WHO: Who = { i: HOST_I, o: HOST, okey: "host" };

export type HostPose = {
  expr?: Expr;
  /** "stand" | "explain" (hand raised) | "sit" | "walk" (along dx, dz) */
  mode?: "stand" | "explain" | "sit" | "walk";
  facing?: -1 | 0 | 1;      // front view: turn the face a little left / right
  swaps?: number[];         // expression-change times (s): a blink covers each one
  phase?: number;           // walk cycle 0..1
  dir?: [number, number];   // walk direction (world x, z)
  scale?: number;
};

/** put the host in a stage at (x, y, z) at time t; call after beginStage() in a short's cast.ts */
export const host = (out: Stage, cam: CamInfo, t: number, x: number, y: number, z: number, p: HostPose = {}) => {
  const { expr = "neutral", mode = "stand", facing = 0, swaps = [], phase = 0, dir = [0, -1], scale = 1 } = p;
  const blink = lidAt(t, HOST_I, swaps);
  if (mode === "walk") {
    const view = viewOf(cam, x, z, dir[0], dir[1]);
    const fo: FrontOpts = { mode: "stroll", phase, expr, blink, seed: HOST_SEED };
    const so: SideOpts = { mode: "march", phase, expr, blink, stomp: 0.6, stride: 0.85 * view.fs, seed: HOST_SEED };
    out.places.push(person(cam, WHO, x, y, z, view, fo, so, scale));
  } else {
    const fo: FrontOpts = { mode: mode === "sit" ? "sit" : "stand", expr, blink, facing, wave: mode === "explain" ? 0 : undefined, seed: HOST_SEED };
    out.places.push(person(cam, WHO, x, y, z, { side: false, mirror: false }, fo, {}, scale));
  }
  if (mode !== "sit") blob(out, x, y, z, scale);
};
