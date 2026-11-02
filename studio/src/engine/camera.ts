// Camera grammar measured in the reference study (references/reports/motion.md): every move is a symmetric
// smootherstep glide of 18-40 f (peak speed = 1.875 x distance / dur, so dur >= 0.075 x the move in 720p px keeps the
// peak near the reference 14-25 px/f); a reframe bigger than about half a frame width or 40 % zoom is a hard cut on
// its key frame. Glides are centred on the old key frame (the whoosh in the sound mix peaks there), so a glide key
// starts dur/2 earlier. Holds push in (dolly toward the look point or a fov zoom near walls): 0.15-0.35 %/f, ~0.6 %/f
// for ~35 f on punch words. Rolls of 4-8 deg over >= 18 f on emphasis beats, held tilt <= 0.07 rad. Impacts are
// 7-frame kicks that flip sign every frame. No hand-held float.
import { FPS, V3, clamp01 } from "./core";

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Shot = Partial<Cam> & { pos: V3; look: V3 };
/** a camera key: from frame f, glide over dur frames (default 24) to framing s, or cut to it */
export type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

/** reference camera ease: symmetric smootherstep (attack = release, ~10 f each on a 23 f move) */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
export const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** push-in factor since f0: the subject grows ~rate per frame; `punch` raises it (with 8 f soft edges) for the first n frames */
export const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** dolly push: camera slides toward the look point by factor k */
export const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** zoom push (camera stays put, for lenses next to walls / towers): tan(fov/2) shrinks by k */
export const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
/** a roll-only move on top of an existing framing */
export const rolled = (s: (f: number) => Shot, roll: number) => (f: number): Shot => ({ ...s(f), roll });

/** impact kicks (reference v14): the image offset flips sign every frame (~3 px at 720p per unit), decays to 0 in
 *  7 f, roll +-0.23 deg per unit; they start on the first frame at/after the event. kicks = [time s, gain]. */
export const makeKickAt = (kicks: [number, number][]) => (t: number) => {
  let a = 0;
  for (const [t0, g] of kicks) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
/** camera of shot `id` at frame f: its keys plus the kicks */
export const makeCamAt = (cams: Record<number, Key[]>, kickAt: (t: number) => number = () => 0) => (id: number, f: number): Cam => {
  const c = run(cams[id], f), a = kickAt(f / FPS);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a; // metres at the look distance for 3 px x a
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
/** frame at which the current key's move has finished (for picking billboard views per key, not per frame) */
export const makeKeyEnd = (cams: Record<number, Key[]>) => (id: number, f: number) => {
  let e = 0;
  for (const k of cams[id]) if (f >= k.f) e = k.f + (k.cut ? 0 : k.dur ?? 24);
  return Math.max(f, e);
};

// ---------------- lens: depth of field + foreground framing ----------------
/** Lens blur table entry (thin lens). cInf = blur-disc radius in px at 1080x1920 for things at infinity; 0 = all sharp.
 *  Reference: DOF on in ~1/3 of shots; when on, background CU/MS 12-16, FS 7-8, WS 5; establishing shots stay sharp.
 *  Entries switch on cuts (no dur) or ramp with the camera glide they share f/dur with. focus = world point (else the
 *  camera look point). */
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const makeDofAt = (table: Dof[]) => (f: number) => {
  let i = 0; while (i + 1 < table.length && f >= table[i + 1].f) i++;
  const d = table[i], p = table[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

/** near framing object, visible while a <= f < b; kit = a Kenney model name (or a cartoon plant: tree_*, plant_*,
 *  hedge). pos = base point, s = height (m), yaw (rad). Put them at 0.3-0.5 x the focus distance, covering 10-25 % of
 *  one frame edge, never a face; they are built outside the sight-line test. Keep a..b inside one shot. */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
