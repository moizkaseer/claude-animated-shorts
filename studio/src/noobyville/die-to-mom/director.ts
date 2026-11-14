// Frame-accurate staging. Every pose is a pure function of the frame.
// Clause times are the faster-whisper marks on the Kokoro take, not the script's estimates.
export const FPS = 30;
export const FRAMES = 1039;
export const DUR = FRAMES / FPS;

export type Place = "kitchen" | "obby" | "arena" | "dinner" | "living";
export type Expr = "smile" | "surprise" | "frown" | "focus";

export type Pose = {
  show: boolean;
  x: number; y: number; z: number;
  yaw: number;
  floor: number;
  walk: number;
  phase: number;
  jump: number;
  fall: number;
  recline: number;
  shatter: number;
  expr: Expr;
  armL: number;
  armR: number;
  armRz: number;
  headPitch: number;
  squash: number;
  scale: number;
};

export type Cam = { x: number; y: number; z: number; lx: number; ly: number; lz: number; fov: number };

export type State = {
  place: Place;
  mix: number;
  cam: Cam;
  noob: Pose;
  mom: Pose;
  boss: Pose;
  snack: number;
  beam: number;
  scraps: number;
  pad: number;
  respawn: boolean;
  titleHome: boolean;
  captionY: number;
  dust: number;
  portal: number;
};

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lf = (a: number, b: number, u: number) => a + (b - a) * u;
const sm = (u: number) => { const x = cl(u, 0, 1); return x * x * (3 - 2 * x); };
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));

const C = (x: number, y: number, z: number, lx: number, ly: number, lz: number, fov: number): Cam =>
  ({ x, y, z, lx, ly, lz, fov });

const camLerp = (a: Cam, b: Cam, u: number): Cam => ({
  x: lf(a.x, b.x, u), y: lf(a.y, b.y, u), z: lf(a.z, b.z, u),
  lx: lf(a.lx, b.lx, u), ly: lf(a.ly, b.ly, u), lz: lf(a.lz, b.lz, u),
  fov: lf(a.fov, b.fov, u),
});

const hidden = (): Pose => ({
  show: false, x: 0, y: -8, z: 0, yaw: 0, floor: 0, walk: 0, phase: 0, jump: 0, fall: 0,
  recline: 0, shatter: 0, expr: "smile", armL: 0, armR: 0, armRz: 0, headPitch: 0, squash: 1, scale: 1,
});

const ch = (x: number, y: number, z: number, extra: Partial<Pose> = {}): Pose => ({
  ...hidden(), show: true, ...extra, x, y, z, floor: extra.floor ?? 0, scale: extra.scale ?? 1,
});

const momAt = (x: number, y: number, z: number, extra: Partial<Pose> = {}) =>
  ch(x, y, z, { scale: 1.08, expr: "smile", ...extra });

const pack = (
  place: Place, cam: Cam, noob: Pose, mom: Pose, extra: Partial<State> = {}, boss?: Pose,
): State => ({
  place, mix: extra.mix ?? 0, cam, noob, mom, boss: boss ?? hidden(),
  snack: extra.snack ?? 0, beam: extra.beam ?? 0, scraps: extra.scraps ?? 1, pad: extra.pad ?? 0,
  respawn: extra.respawn ?? false, titleHome: extra.titleHome ?? false,
  captionY: extra.captionY ?? 0.56, dust: extra.dust ?? 0, portal: extra.portal ?? 0,
});

function hook(t: number): State {
  const u = seg(t, 0, 2.15);
  const cam = camLerp(C(0.0, 2.7, 10.6, -0.05, 1.6, 0.3, 44), C(0.05, 2.55, 9.8, 0.0, 1.5, 0.35, 42), u);
  const shatter = lf(0.55, 0.22, u);
  const y = lf(1.15, 0.55, u);
  return pack("kitchen", cam,
    ch(1.15, y, 0.55, { yaw: -0.05, shatter, expr: "surprise", squash: lf(1.05, 1, u), phase: t * 4 }),
    momAt(-1.05, 0, 0.15, { yaw: 0.05, expr: "smile", armR: -0.25, headPitch: -0.02 }),
    { respawn: true, pad: 1, captionY: 0.62 },
  );
}

function slam(t: number): State {
  const u = seg(t, 2.2, 2.55);
  const settle = seg(t, 2.55, 2.95);
  const y = lf(0.85, 0, u);
  const cam = camLerp(C(0.35, 2.35, 8.8, 0.15, 1.25, 0.45, 44), C(0.3, 2.15, 8.2, 0.1, 1.15, 0.45, 42), seg(t, 2.2, 3.0));
  return pack("kitchen", cam,
    ch(0.55, y, 0.55, {
      yaw: 0.15, shatter: lf(0.28, 0, u), expr: u > 0.8 ? "frown" : "surprise",
      squash: lf(1, 0.82, u) + settle * 0.18, fall: (1 - u) * 0.4,
    }),
    momAt(-0.85, 0, 0.35, { yaw: 0.35, expr: "surprise", headPitch: 0.12 }),
    { respawn: t < 2.45, pad: 1, dust: Math.sin(cl((t - 2.45) / 0.4, 0, 1) * Math.PI), captionY: 0.64 },
  );
}

function slip(t: number): State {
  const run = seg(t, 3.02, 3.55);
  const leap = seg(t, 3.55, 4.15);
  const drop = seg(t, 4.15, 4.9);
  const z = lf(1.3, -0.2, run) + lf(0, -1.5, leap) + lf(0, -0.4, drop);
  const y = Math.sin(leap * Math.PI) * 1.15 - drop * 1.7;
  const cam = camLerp(C(8.6, 2.6, -0.15, 0.05, 1.15, -0.7, 44), C(8.0, 2.2, -0.9, 0.0, 0.7, -1.5, 42), seg(t, 3.02, 4.9));
  return pack("obby", cam,
    ch(0.1, Math.max(-1.8, y), z, {
      yaw: 1.15, walk: run * (1 - leap), phase: t * 9, jump: leap, fall: drop,
      expr: drop > 0.2 ? "surprise" : "focus", floor: y < -0.2 ? -2 : 0,
    }),
    hidden(),
    { captionY: 0.68 },
  );
}

function land(t: number): State {
  const u = seg(t, 4.94, 5.6);
  const cam = camLerp(C(0.4, 2.6, 9.4, -0.1, 1.5, 0.35, 46), C(0.2, 2.45, 8.6, -0.15, 1.45, 0.3, 44), u);
  return pack("kitchen", cam,
    ch(0.7, 0, 0.7, { yaw: lf(-0.4, 0.7, u), expr: "surprise", headPitch: lf(0.15, 0, u), walk: 0.25, phase: t * 6 }),
    momAt(-0.9, 0, 0.2, { yaw: 0.4, expr: "smile" }),
    { pad: 0.4, captionY: 0.58 },
  );
}

function snack(t: number): State {
  const reach = seg(t, 6.9, 7.45);
  const bite = seg(t, 7.5, 8.15);
  const cam = camLerp(C(0.05, 2.45, 8.4, -0.05, 1.55, 0.4, 42), C(0.0, 2.35, 7.8, 0.05, 1.5, 0.4, 40), seg(t, 6.78, 8.4));
  return pack("kitchen", cam,
    ch(0.75, 0, 0.7, { yaw: -0.4, expr: bite > 0.3 ? "smile" : "focus", headPitch: 0.15 * bite, armL: -0.35 * bite }),
    momAt(-0.75, 0, 0.55, { yaw: 0.55, expr: "smile", armR: -1.15 * reach, headPitch: -0.05 }),
    { snack: 1, captionY: 0.62 },
  );
}

function back(t: number): State {
  const hop = seg(t, 8.7, 9.45);
  const cam = camLerp(C(-0.2, 2.7, 9.6, 0.8, 1.5, -0.4, 46), C(0.3, 2.55, 8.8, 1.2, 1.45, -0.6, 44), seg(t, 8.52, 9.6));
  const x = lf(0.2, 1.7, hop);
  const z = lf(1.0, -0.35, hop);
  const y = Math.sin(hop * Math.PI) * 0.85;
  return pack("kitchen", cam,
    ch(x, y, z, { yaw: 0.9, jump: hop, expr: "focus", walk: 1 - hop, phase: t * 10 }),
    momAt(-0.85, 0, 0.4, { yaw: 0.7, expr: "smile", armR: -0.9, armRz: -0.3 }),
    { portal: 1, captionY: 0.36 },
  );
}

function boss(t: number): State {
  const swat = seg(t, 9.85, 10.35);
  const down = seg(t, 10.15, 10.75);
  const cam = camLerp(C(3.2, 2.8, 9.4, 0.1, 1.3, 0.2, 48), C(2.4, 2.3, 8.2, 0.15, 1.0, 0.35, 46), seg(t, 9.62, 11.4));
  return pack("arena", cam,
    ch(0.85, lf(0, 0.22, down), lf(1.3, 0.55, down), {
      yaw: -0.35, walk: 1 - down, phase: t * 8, expr: down > 0.4 ? "frown" : "surprise",
      recline: -1.25 * down, shatter: 0.42 * down, fall: swat * (1 - down),
    }),
    hidden(),
    { captionY: 0.68 },
    ch(-0.95, 0, -0.4, { scale: 1.65, yaw: 0.55, expr: "frown", armRz: -1.45 * swat, phase: t }),
  );
}

function dinner(t: number): State {
  const u = seg(t, 11.5, 12.3);
  const cam = camLerp(C(0.05, 2.7, 10.0, 0.0, 1.55, 0.25, 46), C(0.0, 2.5, 9.2, 0.05, 1.45, 0.2, 44), u);
  return pack("dinner", cam,
    ch(0.15, lf(1.7, 0, u), 1.15, { yaw: 0.1, shatter: lf(0.7, 0, u), expr: "surprise", squash: lf(1.06, 1, u) }),
    momAt(-1.15, 0, 0.15, { yaw: 0.25, expr: "smile" }),
    { respawn: t < 12.15, pad: lf(1, 0.3, u), captionY: 0.58 },
  );
}

function plate(t: number): State {
  const eat = seg(t, 13.35, 13.85);
  const cam = C(0.2, 2.45, 8.2, 0.0, 1.35, 0.15, 42);
  return pack("dinner", cam,
    ch(0.2, 0, 1.05, { yaw: -0.15, expr: "focus", recline: 0.35 * eat, headPitch: 0.28 * eat }),
    momAt(-1.05, 0, 0.35, { yaw: 0.45, expr: "smile", armR: -0.95, headPitch: Math.sin(t * 5) * 0.08 }),
    { captionY: 0.64 },
  );
}

function edge(t: number): State {
  const backstep = seg(t, 14.45, 15.4);
  const cam = camLerp(C(0.25, 4.6, 10.6, 0.05, 4.15, 4.2, 44), C(0.2, 4.4, 10.0, 0.05, 4.0, 3.9, 42), backstep);
  return pack("obby", cam,
    ch(0.05, 3.02, lf(4.5, 3.7, backstep), {
      yaw: 0.05, walk: 0.85, phase: -t * 8, expr: "frown", fall: 0.25, armL: -0.35, armR: -0.35, floor: 3.02,
    }),
    hidden(),
    { captionY: 0.68 },
  );
}

function hang(t: number): State {
  const slipU = seg(t, 16.2, 17.8);
  const cam = camLerp(C(2.8, -0.1, 12.6, 0.0, 2.15, 5.2, 48), C(2.4, -0.25, 12.2, 0.0, 1.95, 5.3, 46), slipU);
  return pack("obby", cam,
    ch(0.0, lf(0.05, -0.25, slipU), 5.5, {
      yaw: 0.12, expr: "frown", armL: -2.7, armR: -2.7, fall: 0.1, floor: -1.5, headPitch: -0.1,
    }),
    hidden(),
    { captionY: 0.7 },
  );
}

function pull(t: number): State {
  const u = seg(t, 18.05, 19.7);
  const cam = camLerp(C(1.5, 3.5, 13.6, 0.45, 2.85, 4.6, 52), C(1.2, 3.6, 13.0, 0.5, 3.0, 4.4, 50), u);
  return pack("obby", cam,
    ch(lf(0.05, 0.35, u), lf(-0.4, 1.4, u), lf(5.8, 4.5, u), {
      yaw: 0.15, expr: "surprise", fall: 1 - u, armL: lf(-2.5, -0.35, u), armR: lf(-2.5, -0.35, u), floor: -1.2,
    }),
    momAt(0.95, 3.02, 3.9, { yaw: 0.55, expr: "smile", armL: -1.25, headPitch: 0.28, floor: 3.02 }),
    { beam: 1, captionY: 0.7 },
  );
}

function lift(t: number): State {
  const u = seg(t, 20.04, 21.4);
  const cam = camLerp(C(0.5, 3.2, 12.2, 0.5, 2.4, 4.2, 48), C(0.35, 3.5, 12.6, 0.5, 2.7, 4.0, 50), u);
  return pack("obby", cam,
    ch(0.4, lf(1.2, 2.2, u), lf(4.7, 4.2, u), { yaw: 0.2, expr: "surprise", fall: 0.3 * (1 - u) }),
    momAt(1.05, lf(3.02, 2.2, u), 3.85, { yaw: 0.4, expr: "smile", armL: -0.9, floor: lf(3.02, 0, u) }),
    { beam: lf(1, 0.35, u), captionY: 0.36 },
  );
}

function fade(t: number): State {
  const u = seg(t, 22.35, 24.05);
  const cam = camLerp(C(0.2, 2.7, 10.2, 0.2, 1.5, 0.25, 48), C(0.1, 2.55, 9.4, 0.15, 1.45, 0.3, 46), u);
  return pack("obby", cam,
    ch(0.25, lf(1.5, 0.15, u), 0.35, { yaw: 0.2, expr: "surprise", fall: 0.2 * (1 - u) }),
    momAt(1.05, lf(1.5, 0, u), 0.15, { yaw: -0.35, expr: "smile" }),
    { mix: u, beam: lf(0.35, 0, u), scraps: 1, captionY: 0.38 },
  );
}

function hug(t: number): State {
  const u = seg(t, 24.4, 25.3);
  const cam = camLerp(C(0.15, 2.55, 8.6, 0.25, 1.6, 0.45, 44), C(0.1, 2.4, 7.8, 0.3, 1.55, 0.5, 42), u);
  return pack("living", cam,
    ch(0.55, lf(1.15, 0.15, u), 0.7, {
      yaw: -0.45, shatter: lf(0.5, 0, u), expr: "smile", recline: -0.25, scale: 0.92, armL: -0.35, armR: -0.55,
    }),
    momAt(0.35, 0, 0.35, { yaw: -0.15, expr: "smile", armL: -0.85, armR: -0.85 }),
    { respawn: t < 25.15, mix: 1, captionY: 0.66 },
  );
}

function room(t: number): State {
  const u = seg(t, 25.96, 27.2);
  const cam = camLerp(C(0.15, 2.7, 10.4, 0.1, 1.4, 0.35, 50), C(0.05, 2.55, 9.6, 0.15, 1.35, 0.4, 48), u);
  return pack("living", cam,
    ch(-0.45, 0, 0.9, { yaw: 0.4, expr: "smile", scale: 0.96 }),
    momAt(0.55, 0, 0.45, { yaw: -0.35, expr: "smile", armR: -0.25 }),
    { mix: 1, scraps: 1, captionY: 0.58 },
  );
}

function wait(t: number): State {
  const cam = camLerp(C(-0.05, 2.55, 6.6, 0.15, 1.85, 0.25, 38), C(0.0, 2.48, 6.1, 0.18, 1.82, 0.28, 36), seg(t, 27.94, 29.1));
  return pack("living", cam,
    ch(-1.15, 0, 1.15, { yaw: 0.6, expr: "smile", scale: 0.96 }),
    momAt(0.15, 0, 0.25, { yaw: 0.05, expr: "smile", headPitch: -0.04 }),
    { mix: 1, captionY: 0.68 },
  );
}

function check(t: number): State {
  const cam = camLerp(C(0.1, 2.6, 9.6, 0.15, 1.4, 0.45, 46), C(0.05, 2.5, 8.8, 0.18, 1.35, 0.5, 44), seg(t, 29.26, 30.5));
  return pack("living", cam,
    ch(-0.35, 0, 0.95, { yaw: 0.35, expr: "smile" }),
    momAt(0.6, 0, 0.5, { yaw: -0.25, expr: "smile" }),
    { mix: 1, pad: 1, captionY: 0.6 },
  );
}

function gone(t: number): State {
  const u = seg(t, 31.5, 32.85);
  const cam = camLerp(C(0.05, 2.55, 9.2, 0.15, 1.4, 0.45, 46), C(0.0, 2.45, 8.6, 0.12, 1.35, 0.45, 44), u);
  return pack("living", cam,
    ch(-0.35, 0, 0.95, { yaw: 0.3, expr: "smile" }),
    momAt(0.55, 0, 0.5, { yaw: -0.2, expr: "smile" }),
    { mix: 1, pad: 1, scraps: 1 - u, captionY: 0.58 },
  );
}

function flip(t: number): State {
  const u = seg(t, 33.24, 34.4);
  const cam = camLerp(C(0.1, 2.5, 8.8, 0.25, 1.5, 0.5, 44), C(0.05, 2.42, 8.3, 0.28, 1.48, 0.52, 42), u);
  return pack("living", cam,
    ch(0.05, 0.15, 0.85, { yaw: 0.15, expr: "smile", recline: -0.35, scale: 0.94, armL: -0.3, armR: -0.3 }),
    momAt(0.4, 0, 0.4, { yaw: -0.1, expr: "smile", armL: -0.7, armR: -0.7 }),
    { mix: 1, pad: 0.8, scraps: 0, titleHome: true, captionY: 0.66 },
  );
}

export function direct(frame: number): State {
  const t = frame / FPS;
  if (t < 2.2) return hook(t);
  if (t < 3.02) return slam(t);
  if (t < 4.94) return slip(t);
  if (t < 6.78) return land(t);
  if (t < 8.52) return snack(t);
  if (t < 9.62) return back(t);
  if (t < 11.5) return boss(t);
  if (t < 13.28) return dinner(t);
  if (t < 14.36) return plate(t);
  if (t < 15.8) return edge(t);
  if (t < 17.96) return hang(t);
  if (t < 20.04) return pull(t);
  if (t < 22.28) return lift(t);
  if (t < 24.4) return fade(t);
  if (t < 25.96) return hug(t);
  if (t < 27.94) return room(t);
  if (t < 29.26) return wait(t);
  if (t < 31.42) return check(t);
  if (t < 33.24) return gone(t);
  return flip(t);
}
