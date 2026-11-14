// Frame-accurate staging. Clause times are the faster-whisper marks on the Kokoro take.
// Cameras match the first short: close enough that the toon faces read.
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
  ...hidden(), show: true, ...extra, x, y, z, floor: extra.floor ?? 0,
});

const momAt = (x: number, y: number, z: number, extra: Partial<Pose> = {}) =>
  ch(x, y, z, { expr: "smile", ...extra });

const pack = (
  place: Place, cam: Cam, noob: Pose, mom: Pose, extra: Partial<State> = {}, boss?: Pose,
): State => ({
  place, mix: extra.mix ?? 0, cam, noob, mom, boss: boss ?? hidden(),
  snack: extra.snack ?? 0, beam: extra.beam ?? 0, scraps: extra.scraps ?? 0, pad: extra.pad ?? 0,
  respawn: extra.respawn ?? false, titleHome: extra.titleHome ?? false,
  captionY: extra.captionY ?? 0.62, dust: extra.dust ?? 0, portal: extra.portal ?? 0,
});

const LEDGE = 1.23;

function hook(t: number): State {
  const u = seg(t, 0, 2.15);
  const cam = camLerp(C(0.1, 1.85, 5.6, -0.05, 1.15, 0.35, 50), C(0.05, 1.75, 5.0, 0.0, 1.1, 0.4, 46), u);
  return pack("kitchen", cam,
    ch(0.65, lf(0.45, 0.12, u), 0.5, { yaw: -0.05, shatter: lf(0.32, 0.1, u), expr: "surprise", squash: lf(1.04, 1, u) }),
    momAt(-0.75, 0, 0.25, { yaw: 0.12, expr: "smile" }),
    { respawn: true, pad: 1, captionY: 0.64 },
  );
}

function slam(t: number): State {
  const u = seg(t, 2.2, 2.55);
  const settle = seg(t, 2.55, 2.95);
  const cam = camLerp(C(0.25, 1.7, 4.2, 0.15, 1.05, 0.45, 44), C(0.2, 1.6, 3.8, 0.1, 1.0, 0.45, 42), seg(t, 2.2, 3.0));
  return pack("kitchen", cam,
    ch(0.55, lf(0.55, 0, u), 0.55, {
      yaw: 0.1, shatter: lf(0.25, 0, u), expr: u > 0.75 ? "frown" : "surprise",
      squash: lf(1, 0.82, u) + settle * 0.18, fall: (1 - u) * 0.35,
    }),
    momAt(-0.7, 0, 0.3, { yaw: 0.4, expr: "surprise", headPitch: 0.1 }),
    { respawn: t < 2.45, pad: 1, dust: Math.sin(cl((t - 2.45) / 0.4, 0, 1) * Math.PI), captionY: 0.66 },
  );
}

function slip(t: number): State {
  const run = seg(t, 3.02, 3.55);
  const leap = seg(t, 3.55, 4.15);
  const drop = seg(t, 4.15, 4.9);
  const z = lf(0.7, -0.2, run) + lf(0, -1.6, leap) + lf(0, -0.5, drop);
  const y = Math.sin(leap * Math.PI) * 0.85 - drop * 1.15;
  const cam = camLerp(C(5.6, 1.85, 0.3, 0.05, 0.95, -0.8, 46), C(5.1, 1.55, -0.6, 0.0, 0.55, -1.6, 44), seg(t, 3.02, 4.9));
  return pack("obby", cam,
    ch(0.05, Math.max(-1.4, y), z, {
      yaw: 1.2, walk: run * (1 - leap), phase: t * 9, jump: leap, fall: drop,
      expr: drop > 0.2 ? "surprise" : "focus", floor: y < -0.15 ? -1.6 : 0,
    }),
    hidden(),
    { captionY: 0.7 },
  );
}

function land(t: number): State {
  const u = seg(t, 4.94, 5.6);
  const cam = camLerp(C(0.2, 1.85, 4.8, 0.0, 1.15, 0.35, 46), C(0.1, 1.75, 4.3, -0.05, 1.1, 0.3, 44), u);
  return pack("kitchen", cam,
    ch(0.65, 0, 0.6, { yaw: lf(-0.35, 0.65, u), expr: "surprise", headPitch: lf(0.12, 0, u), walk: 0.3, phase: t * 6 }),
    momAt(-0.7, 0, 0.25, { yaw: 0.45, expr: "smile" }),
    { pad: 0.35, captionY: 0.62 },
  );
}

function snack(t: number): State {
  const reach = seg(t, 6.9, 7.45);
  const bite = seg(t, 7.5, 8.15);
  const cam = camLerp(C(0.05, 1.7, 3.9, 0.0, 1.2, 0.4, 42), C(0.0, 1.65, 3.5, 0.05, 1.15, 0.4, 40), seg(t, 6.78, 8.4));
  return pack("kitchen", cam,
    ch(0.55, 0, 0.55, { yaw: -0.45, expr: bite > 0.3 ? "smile" : "focus", headPitch: 0.16 * bite }),
    momAt(-0.55, 0, 0.4, { yaw: 0.55, expr: "smile", armR: -1.35 * reach }),
    { snack: 1, captionY: 0.66 },
  );
}

function back(t: number): State {
  const hop = seg(t, 8.7, 9.45);
  const cam = camLerp(C(-0.3, 1.85, 4.6, 0.6, 1.1, -0.4, 48), C(0.1, 1.75, 4.1, 0.9, 1.05, -0.7, 46), seg(t, 8.52, 9.6));
  return pack("kitchen", cam,
    ch(lf(0.15, 1.15, hop), Math.sin(hop * Math.PI) * 0.55, lf(0.5, -0.7, hop), {
      yaw: 0.7, jump: hop, expr: "focus", walk: 1 - hop, phase: t * 10,
    }),
    momAt(-0.7, 0, 0.35, { yaw: 0.65, expr: "smile", armR: -0.9 }),
    { portal: 1, captionY: 0.66 },
  );
}

function boss(t: number): State {
  const swat = seg(t, 9.85, 10.35);
  const down = seg(t, 10.15, 10.75);
  const cam = camLerp(C(1.5, 1.9, 4.8, 0.05, 1.05, 0.15, 48), C(1.1, 1.6, 4.1, 0.1, 0.85, 0.25, 46), seg(t, 9.62, 11.4));
  return pack("arena", cam,
    ch(0.7, 0, 0.7, {
      yaw: -0.4, walk: 1 - down, phase: t * 8, expr: down > 0.35 ? "frown" : "surprise",
      recline: -1.15 * down, shatter: 0.35 * down, fall: swat * (1 - down),
    }),
    hidden(),
    { captionY: 0.68 },
    ch(-0.75, 0, -0.15, { yaw: 0.7, expr: "frown", armRz: -1.2 * swat, phase: t }),
  );
}

function dinner(t: number): State {
  const u = seg(t, 11.5, 12.3);
  const cam = camLerp(C(0.05, 1.9, 4.9, 0.0, 1.15, 0.2, 46), C(0.0, 1.75, 4.3, 0.05, 1.1, 0.2, 44), u);
  return pack("dinner", cam,
    ch(0.35, lf(1.15, 0, u), 0.7, { yaw: 0.05, shatter: lf(0.65, 0, u), expr: "surprise", squash: lf(1.05, 1, u) }),
    momAt(-0.85, 0, 0.15, { yaw: 0.3, expr: "smile" }),
    { respawn: t < 12.15, pad: lf(1, 0.25, u), captionY: 0.62 },
  );
}

function plate(t: number): State {
  const eat = seg(t, 13.35, 13.85);
  const cam = C(0.15, 1.65, 3.7, 0.05, 1.1, 0.1, 42);
  return pack("dinner", cam,
    ch(0.25, 0, 0.55, { yaw: -0.2, expr: "focus", recline: 0.28 * eat, headPitch: 0.22 * eat }),
    momAt(-0.75, 0, 0.2, { yaw: 0.5, expr: "smile", armR: -1.05, headPitch: Math.sin(t * 5) * 0.06 }),
    { captionY: 0.66 },
  );
}

function edge(t: number): State {
  const back = seg(t, 14.45, 15.4);
  const cam = camLerp(C(0.15, 2.35, 4.4, 0.05, 1.7, -1.3, 46), C(0.1, 2.25, 4.0, 0.0, 1.65, -1.55, 44), back);
  return pack("obby", cam,
    ch(0.05, LEDGE, lf(-1.05, -1.7, back), {
      yaw: 0.05, walk: 0.8, phase: -t * 8, expr: "frown", fall: 0.2, armL: -0.3, armR: -0.3, floor: LEDGE,
    }),
    hidden(),
    { captionY: 0.7 },
  );
}

function hang(t: number): State {
  const slipU = seg(t, 16.2, 17.8);
  const cam = camLerp(C(1.7, 1.35, 2.6, 0.05, 0.85, -0.7, 46), C(1.45, 1.2, 2.3, 0.0, 0.7, -0.55, 44), slipU);
  return pack("obby", cam,
    ch(0.0, lf(-0.45, -0.75, slipU), -0.55, {
      yaw: 0.05, expr: "frown", armL: -2.35, armR: -2.35, floor: -0.4, headPitch: -0.08,
    }),
    hidden(),
    { captionY: 0.7 },
  );
}

function pull(t: number): State {
  const u = seg(t, 18.05, 19.7);
  const cam = camLerp(C(2.4, 1.85, 3.2, 0.2, 1.15, -1.05, 50), C(2.1, 1.75, 2.9, 0.25, 1.2, -1.15, 48), u);
  return pack("obby", cam,
    ch(lf(0.0, 0.25, u), lf(-0.1, 0.7, u), lf(-0.5, -0.95, u), {
      yaw: 0.1, expr: "surprise", fall: 1 - u, armL: lf(-2.2, -0.4, u), armR: lf(-2.2, -0.4, u), floor: -0.3,
    }),
    momAt(0.55, LEDGE, -1.45, { yaw: 0.55, expr: "smile", armL: -1.2, headPitch: 0.22, floor: LEDGE }),
    { beam: 1, captionY: 0.68 },
  );
}

function lift(t: number): State {
  const u = seg(t, 20.04, 21.4);
  const cam = camLerp(C(0.4, 2.15, 4.6, 0.35, 1.5, -1.1, 48), C(0.3, 2.3, 5.0, 0.4, 1.7, -1.0, 50), u);
  return pack("obby", cam,
    ch(0.3, lf(0.65, 1.15, u), lf(-1.0, -1.2, u), { yaw: 0.15, expr: "surprise", fall: 0.25 * (1 - u) }),
    momAt(0.7, lf(LEDGE, 1.05, u), -1.4, { yaw: 0.4, expr: "smile", armL: -0.85, floor: lf(LEDGE, 0, u) }),
    { beam: lf(1, 0.3, u), captionY: 0.66 },
  );
}

function fade(t: number): State {
  const u = seg(t, 22.35, 24.05);
  const cam = camLerp(C(0.15, 1.9, 5.0, 0.15, 1.15, 0.2, 48), C(0.1, 1.8, 4.5, 0.15, 1.1, 0.25, 46), u);
  return pack("obby", cam,
    ch(0.2, lf(0.8, 0.05, u), 0.4, { yaw: 0.15, expr: "surprise" }),
    momAt(0.75, lf(0.8, 0, u), 0.15, { yaw: -0.3, expr: "smile" }),
    { mix: u, beam: lf(0.3, 0, u), scraps: 1, captionY: 0.64 },
  );
}

function hug(t: number): State {
  const u = seg(t, 24.4, 25.3);
  const cam = camLerp(C(0.25, 1.8, 4.8, 0.25, 1.15, 0.35, 48), C(0.2, 1.72, 4.3, 0.28, 1.12, 0.4, 46), u);
  return pack("living", cam,
    ch(0.55, lf(0.55, 0.02, u), 0.65, {
      yaw: -0.35, shatter: lf(0.45, 0, u), expr: "smile", recline: -0.2,
    }),
    momAt(0.15, 0, 0.25, { yaw: -0.1, expr: "smile", armL: -0.7, armR: -0.55 }),
    { respawn: t < 25.15, captionY: 0.66 },
  );
}

function room(t: number): State {
  const u = seg(t, 25.96, 27.2);
  const cam = camLerp(C(0.1, 1.9, 5.2, 0.05, 1.15, 0.35, 50), C(0.05, 1.8, 4.6, 0.1, 1.1, 0.4, 48), u);
  return pack("living", cam,
    ch(-0.4, 0, 0.7, { yaw: 0.4, expr: "smile" }),
    momAt(0.45, 0, 0.35, { yaw: -0.3, expr: "smile" }),
    { scraps: 1, captionY: 0.62 },
  );
}

function wait(t: number): State {
  const cam = camLerp(C(-0.1, 1.65, 3.15, 0.15, 1.35, 0.25, 38), C(0.0, 1.6, 2.9, 0.18, 1.32, 0.28, 36), seg(t, 27.94, 29.1));
  return pack("living", cam,
    ch(-0.85, 0, 0.85, { yaw: 0.55, expr: "smile" }),
    momAt(0.15, 0, 0.2, { yaw: 0.05, expr: "smile" }),
    { captionY: 0.68 },
  );
}

function check(t: number): State {
  const cam = camLerp(C(0.1, 1.8, 4.6, 0.1, 1.15, 0.4, 46), C(0.05, 1.72, 4.2, 0.15, 1.1, 0.45, 44), seg(t, 29.26, 30.5));
  return pack("living", cam,
    ch(-0.35, 0, 0.75, { yaw: 0.3, expr: "smile" }),
    momAt(0.5, 0, 0.4, { yaw: -0.25, expr: "smile" }),
    { pad: 1, captionY: 0.64 },
  );
}

function gone(t: number): State {
  const u = seg(t, 31.5, 32.85);
  const cam = camLerp(C(0.05, 1.8, 4.5, 0.1, 1.15, 0.4, 46), C(0.0, 1.72, 4.15, 0.1, 1.1, 0.4, 44), u);
  return pack("living", cam,
    ch(-0.3, 0, 0.75, { yaw: 0.28, expr: "smile" }),
    momAt(0.5, 0, 0.4, { yaw: -0.2, expr: "smile" }),
    { pad: 1, scraps: 1 - u, captionY: 0.62 },
  );
}

function flip(t: number): State {
  const u = seg(t, 33.24, 34.4);
  const cam = camLerp(C(0.2, 1.78, 4.5, 0.25, 1.15, 0.4, 46), C(0.15, 1.72, 4.15, 0.28, 1.12, 0.42, 44), u);
  return pack("living", cam,
    ch(0.15, 0.02, 0.6, { yaw: 0.1, expr: "smile", recline: -0.22 }),
    momAt(0.4, 0, 0.3, { yaw: -0.12, expr: "smile", armL: -0.65, armR: -0.5 }),
    { pad: 0.85, scraps: 0, titleHome: true, captionY: 0.66 },
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
