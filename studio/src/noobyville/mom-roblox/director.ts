// Frame-accurate staging for the Mom Roblox review short.
// Every pose is a pure function of the frame so Remotion can seek.
// Times follow the supplied narration (see words.ts), not the 55-70s Professor template.

export const FPS = 30;
export const FRAMES = 889;
export const DUR = FRAMES / FPS;

export type Place = "obby" | "garden" | "roof" | "workshop" | "hall" | "bedroom";
export type Expr = "neutral" | "smile" | "laugh" | "surprise" | "frown" | "smug" | "talk" | "focus";
export type Gesture = "none" | "walk" | "wave" | "point" | "carry" | "reach" | "belly" | "shrug" | "jump";

export type CharPose = {
  show: boolean;
  x: number; y: number; z: number;
  yaw: number;
  bob: number;
  squash: number;
  lean: number;
  recline: number;
  gesture: Gesture;
  hold: number;
  walk: number;
  phase: number;
  expr: Expr;
  headYaw: number;
  headPitch: number;
  floor: number;
};

export type Cam = { x: number; y: number; z: number; lx: number; ly: number; lz: number; fov: number; roll: number };

export type State = {
  place: Place;
  cam: Cam;
  noob: CharPose;
  mom: CharPose;
  friends: CharPose[];
  checkpoint: number;
  door: number;
  blocks: number[];
  walls: number;
  wifi: number;
  dust: number;
  ribbon: number;
  portal: number;
  captionY: number;
  bubble: boolean;
  day: string | null;
};

export const SET_X: Record<Place, number> = {
  obby: 0,
  garden: 240,
  roof: 480,
  workshop: 720,
  hall: 960,
  bedroom: 960,
};

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lf = (a: number, b: number, u: number) => a + (b - a) * u;
const sm = (u: number) => { const x = cl(u, 0, 1); return x * x * (3 - 2 * x); };
const smt = (u: number) => { const x = cl(u, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const segt = (t: number, a: number, b: number) => smt((t - a) / (b - a));

const C = (x: number, y: number, z: number, lx: number, ly: number, lz: number, fov: number, roll = 0): Cam =>
  ({ x, y, z, lx, ly, lz, fov, roll });

const camLerp = (a: Cam, b: Cam, u: number): Cam => ({
  x: lf(a.x, b.x, u), y: lf(a.y, b.y, u), z: lf(a.z, b.z, u),
  lx: lf(a.lx, b.lx, u), ly: lf(a.ly, b.ly, u), lz: lf(a.lz, b.lz, u),
  fov: lf(a.fov, b.fov, u), roll: lf(a.roll, b.roll, u),
});

const hidden = (): CharPose => ({
  show: false, x: 0, y: -8, z: 0, yaw: 0, bob: 0, squash: 1, lean: 0, recline: 0,
  gesture: "none", hold: 0, walk: 0, phase: 0, expr: "neutral", headYaw: 0, headPitch: 0, floor: 0,
});

const ch = (x: number, y: number, z: number, extra: Partial<CharPose> = {}): CharPose => ({
  ...hidden(), show: true, hold: 1, ...extra, x, y, z, floor: extra.floor ?? y,
});

const breathe = (p: CharPose, t: number, seed: number): CharPose => {
  if (!p.show) return p;
  const w = Math.sin(t * 3.2 + seed);
  return { ...p, bob: p.bob + w * 0.018, squash: p.squash * (1 + Math.sin(t * 2.2 + seed) * 0.012) };
};

type Keys = { t: number; x: number; y: number; z: number; arc?: number };
const pathAt = (t: number, keys: Keys[]) => {
  if (t <= keys[0].t) return { x: keys[0].x, y: keys[0].y, z: keys[0].z };
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1], b = keys[i];
      const u = smt((t - a.t) / Math.max(0.001, b.t - a.t));
      const arc = Math.sin(Math.PI * cl(u, 0, 1)) * (b.arc ?? 0);
      return { x: lf(a.x, b.x, u), y: lf(a.y, b.y, u) + arc, z: lf(a.z, b.z, u) };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last.x, y: last.y, z: last.z };
};

const faceYaw = (x: number, z: number, tx: number, tz: number) => Math.atan2(tx - x, tz - z);

function hook(t: number): State {
  // t = 0 is frame 0. Negative t is the end-of-film pre-roll so the file loops.
  const emerge = smt((t + 1.02) / 2.43);
  const cam = hookCam(t);
  const mx = lf(-0.55, -0.15, emerge);
  const mz = lf(1.05, 0.35, emerge);
  const momY = lf(-0.05, 0, emerge);
  const noob = ch(0.55, 0, 0.05, {
    yaw: faceYaw(0.55, 0.05, mx, mz),
    expr: emerge > 0.22 ? "surprise" : "neutral",
    gesture: emerge > 0.72 ? "wave" : "none",
    hold: seg(emerge, 0.62, 0.9),
    phase: t * 9,
    headYaw: -0.15,
  });
  const mom = ch(mx, momY, mz, {
    yaw: faceYaw(mx, mz, 0.55, 0.05),
    expr: emerge > 0.55 ? "smile" : "neutral",
    squash: lf(0.82, 1, emerge),
    gesture: emerge > 0.8 ? "wave" : "walk",
    walk: (1 - emerge) * 0.85,
    phase: t * 8,
    hold: seg(emerge, 0.75, 1),
    show: t > -0.85,
  });
  return pack("obby", cam, noob, mom, 0.55 + emerge * 0.45, {
    captionY: 0.7, day: null, bubble: false,
  });
}

function hookCam(t: number): Cam {
  const u = smt((t + 1.05) / 3.3);
  return camLerp(
    C(1.6, 3.15, 8.4, -0.05, 1.2, 0.45, 50, 0),
    C(1.15, 2.7, 7.1, -0.1, 1.15, 0.35, 46, -0.02),
    u,
  );
}

function day1(t: number): State {
  let cam: Cam;
  // Side view so the gap reads left-to-right in the portrait frame.
  if (t < 4.8) cam = camLerp(C(6.6, 2.7, -0.4, 0.0, 0.9, -1.7, 48), C(6.2, 2.45, -0.9, 0.0, 0.8, -2.05, 46), segt(t, 2.5, 4.8));
  else if (t < 5.28) cam = camLerp(C(2.4, 1.85, 3.6, 0.45, 1.15, 0.35, 42), C(2.15, 1.75, 3.3, 0.42, 1.12, 0.3, 40), segt(t, 4.8, 5.28));
  else cam = camLerp(C(6.8, 2.6, -1.2, 0.05, 0.85, -2.4, 50), C(6.3, 2.35, -2.2, 0.1, 0.8, -3.4, 48), segt(t, 5.28, 6.96));

  let mom: CharPose;
  let noob: CharPose;
  let dust = 0;

  if (t < 3.3) {
    const u = seg(t, 2.7, 3.3);
    mom = ch(-0.28, -0.14 * u, 0.32, { yaw: 1.15, expr: "focus", squash: 1 - 0.16 * u, headPitch: -0.12 });
    noob = ch(0.62, 0, 0.55, { yaw: 1.0, expr: "smile", headYaw: -0.1 });
  } else if (t < 4.18) {
    const u = cl((t - 3.3) / 0.88, 0, 1);
    const z = lf(0.32, -2.05, sm(u));
    const y = lf(0, -0.78, smt(u)) + Math.sin(Math.PI * u) * 1.28;
    const squash = u < 0.1 ? lf(0.84, 1, u / 0.1) : u > 0.9 ? lf(1, 0.78, (u - 0.9) / 0.1) : 1;
    mom = ch(-0.16, y, z, {
      yaw: 1.15, expr: u < 0.82 ? "focus" : "surprise", squash, gesture: "jump", phase: u, floor: y < -0.2 ? -0.78 : 0,
    });
    noob = ch(0.62, 0, 0.55, { yaw: 1.05, expr: "surprise", headPitch: -0.15 });
    if (u > 0.92) dust = (u - 0.92) / 0.08;
  } else if (t < 5.28) {
    const getUp = seg(t, 4.35, 4.85);
    mom = ch(-0.12, -0.78, -2.02, {
      yaw: 0.4, expr: t < 4.7 ? "frown" : "frown", squash: lf(0.8, 1, getUp), headPitch: 0.15, floor: -0.78,
    });
    const laugh = seg(t, 4.8, 5.05);
    noob = ch(0.55, 0, 0.42, {
      yaw: 0.15,
      expr: "laugh",
      gesture: "belly",
      hold: laugh,
      phase: t * 14,
      bob: Math.abs(Math.sin(t * 16)) * 0.06 * laugh,
      lean: -0.08 * laugh,
    });
    dust = t < 4.55 ? seg(t, 4.18, 4.35) * (1 - seg(t, 4.35, 4.55)) : 0;
  } else {
    const u = cl((t - 5.28) / 1.35, 0, 1);
    const ride = pathAt(t, [
      { t: 5.28, x: 0.55, y: 0, z: 0.42 },
      { t: 5.62, x: 0.15, y: -0.78, z: -1.85, arc: 0.55 },
      { t: 6.45, x: 0.2, y: 0, z: -4.25, arc: 1.45 },
      { t: 6.9, x: 0.15, y: 0, z: -4.35 },
    ]);
    const pick = seg(t, 5.55, 5.82);
    const put = seg(t, 6.48, 6.78);
    const carrying = pick * (1 - put);
    noob = ch(ride.x, ride.y, ride.z, {
      yaw: 1.1,
      expr: "smile",
      gesture: carrying > 0.45 ? "carry" : "jump",
      hold: Math.max(carrying, t < 5.75 ? seg(t, 5.28, 5.45) : 0),
      phase: t < 5.75 ? cl((t - 5.28) / 0.34, 0, 1) : t * 10,
      walk: t > 5.85 && t < 6.5 ? 1 : t > 6.6 ? 0.35 : 0,
      floor: ride.y < -0.3 ? -0.78 : 0,
    });
    const chest = { x: ride.x - 0.02, y: ride.y + 0.1, z: ride.z + 0.32 };
    if (put > 0.05) {
      mom = ch(lf(chest.x, -0.48, put), lf(chest.y, 0, put), lf(chest.z, -4.22, put), {
        yaw: 0.35, expr: "smile", recline: -1.12 * (1 - put), floor: 0, walk: 0.2, phase: t * 6,
      });
    } else {
      mom = ch(lf(-0.12, chest.x, pick), lf(-0.78, chest.y, pick), lf(-1.95, chest.z, pick), {
        yaw: Math.PI, expr: pick > 0.4 ? "surprise" : "frown", recline: -1.12 * pick,
        floor: pick > 0.5 ? ride.y : -0.78, walk: 0.3 * pick, phase: t * 7,
      });
    }
    dust = t > 6.4 && t < 6.72 ? Math.sin(cl((t - 6.4) / 0.32, 0, 1) * Math.PI) : 0;
  }

  // The failed jump fills the top of the frame, so the line sits in the lower safe band.
  const captionY = t < 4.8 ? 0.78 : t < 5.28 ? 0.72 : 0.18;
  return pack("obby", cam, noob, mom, 0.25, { dust, captionY, day: "DAY 1" });
}

function day2(t: number): State {
  const cam = camLerp(C(1.4, 4.3, 6.8, 0.0, 0.6, 0.0, 50), C(1.05, 3.7, 5.6, 0.0, 0.5, -0.7, 47), segt(t, 6.96, 10.13));
  const runU = cl((t - 7.15) / 1.15, 0, 1);
  const noobZ = lf(1.55, -0.35, smt(Math.min(1, runU * 1.05)));
  const ahead = seg(t, 7.7, 8.25);
  const momZ = lf(1.35, -1.55, smt(cl(runU + ahead * 0.35, 0, 1)));
  const sliding = seg(t, 7.82, 8.05) * (1 - seg(t, 8.35, 8.6));
  const momY = -0.28 * sliding;
  const stole = seg(t, 8.18, 8.45);
  const quote = t >= 8.9 && t < 10.2;
  const noob = ch(0.48, 0, noobZ, {
    yaw: Math.PI,
    expr: stole > 0.4 ? "surprise" : "focus",
    gesture: "walk",
    walk: t < 8.45 ? 1 : 1 - seg(t, 8.45, 8.85),
    phase: t * 11,
    lean: 0.06,
  });
  const mom = ch(-0.42, momY, momZ, {
    yaw: quote ? 0.8 : Math.PI,
    expr: quote ? "talk" : sliding > 0.2 ? "smug" : "focus",
    gesture: quote ? "wave" : "walk",
    hold: quote ? 1 : 1,
    walk: quote ? 0 : 1,
    phase: quote ? t * 8 : t * 12,
    squash: 1 - 0.38 * sliding,
    recline: -0.9 * sliding,
    floor: 0,
    headYaw: quote ? 0.3 : 0,
  });
  return pack("garden", cam, noob, mom, 0.2, {
    checkpoint: stole,
    captionY: quote ? 0.70 : 0.18,
    bubble: quote,
    day: "DAY 2",
  });
}

function day3(t: number): State {
  const wifiShot = t >= 11.72;
  const cam = wifiShot
    ? camLerp(C(2.3, 2.15, 5.4, -0.05, 1.2, 0.25, 44), C(2.05, 2.05, 5.0, -0.1, 1.18, 0.2, 42), segt(t, 11.72, 13.29))
    : camLerp(C(3.4, 3.3, 4.6, 0.05, 0.9, -0.4, 48), C(2.9, 2.9, 2.6, 0.0, 0.85, -1.5, 46), segt(t, 10.37, 11.72));

  let noob: CharPose;
  let mom: CharPose;
  let ribbon = 0;
  if (!wifiShot) {
    const u = cl((t - 10.5) / 0.85, 0, 1);
    const momZ = lf(1.7, -2.55, smt(Math.min(1, u * 1.08)));
    const noobZ = lf(1.85, -1.15, smt(u * 0.92));
    const weave = Math.sin(u * Math.PI) * 0.35;
    ribbon = seg(t, 11.18, 11.38);
    mom = ch(-0.15 + weave, 0, momZ, {
      yaw: Math.PI, expr: ribbon > 0.4 ? "smug" : "focus", gesture: "walk", walk: 1, phase: t * 13, lean: 0.1,
    });
    noob = ch(0.45 - weave * 0.5, 0, noobZ, {
      yaw: Math.PI, expr: "focus", gesture: "walk", walk: 1, phase: t * 13 + 1, lean: 0.08,
    });
  } else {
    mom = ch(-0.2, 0, -2.55, { yaw: 0.2, expr: "smug", show: true });
    const point = seg(t, 11.78, 12.05);
    noob = ch(0.15, 0, 0.25, {
      yaw: -2.35,
      expr: "frown",
      gesture: "point",
      hold: point,
      headYaw: 0.45,
      headPitch: -0.15,
      phase: t,
    });
    ribbon = 1;
  }
  return pack("roof", cam, noob, mom, 0.15, {
    wifi: wifiShot ? 1 : 0,
    ribbon,
    captionY: wifiShot ? 0.72 : 0.16,
    day: "DAY 3",
  });
}

function day4(t: number): State {
  const open = seg(t, 15.2, 15.75);
  const cam = t < 15.45
    ? camLerp(C(0.2, 2.35, 5.6, 0.1, 1.15, -0.4, 62), C(0.1, 2.15, 5.1, 0.0, 1.1, -0.55, 58), segt(t, 13.29, 15.45))
    : camLerp(C(0.25, 2.5, 6.2, 0.0, 1.1, 0.2, 66), C(0.1, 2.3, 5.6, 0.0, 1.05, -0.1, 62), segt(t, 15.45, 17.16));
  const placing = t < 15.25 ? 1 : 1 - seg(t, 15.25, 15.55);
  const mom = ch(0.15, 0, -0.55, {
    yaw: t < 15.4 ? 0.9 : Math.PI * 0.15,
    expr: t < 15.4 ? "smile" : "talk",
    gesture: t < 15.4 ? "reach" : "wave",
    hold: placing > 0.5 ? 1 : seg(t, 15.35, 15.6),
    phase: t * 8,
    headYaw: -0.2,
  });
  const noob = ch(-1.05, 0, 1.45, {
    yaw: faceYaw(-1.05, 1.45, 0.15, -0.4),
    expr: t > 15.6 ? "surprise" : "neutral",
    headYaw: 0.2,
    gesture: "none",
  });
  const friends = [0, 1, 2].map((i) => {
    const start = 15.5 + i * 0.22;
    const u = cl((t - start) / 0.95, 0, 1);
    if (u <= 0) return hidden();
    const x = [-0.85, 0.05, 0.8][i];
    const z = lf(3.1, -0.15, smt(u));
    return ch(x, 0, z, {
      yaw: Math.PI,
      expr: "smile",
      gesture: "walk",
      walk: u < 0.92 ? 1 : 0,
      phase: t * 12 + i,
      lean: 0.08,
    });
  });
  const blocks = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const start = 13.92 + i * 0.1;
    return backOut((t - start) / 0.42);
  });
  return pack("workshop", cam, noob, mom, 0.2, {
    friends, blocks, walls: open, captionY: 0.16, day: "DAY 4",
  });
}

function backOut(u: number) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2;
}

function day5(t: number): State {
  // Walk the corridor, read the sign, hand on the handle, then the door opens into the bedroom.
  const approaching = t < 21.4;
  let cam: Cam;
  if (t < 19.3) cam = camLerp(C(0.85, 2.35, -8.2, 0.0, 1.35, -0.6, 52), C(0.7, 2.05, -5.6, 0.0, 1.3, -0.15, 48), segt(t, 17.4, 19.3));
  else if (t < 21.4) cam = camLerp(C(0.85, 1.95, -4.8, 0.05, 1.35, 0.15, 46), C(0.75, 1.85, -3.9, 0.02, 1.32, 0.35, 44), segt(t, 19.3, 21.4));
  else cam = camLerp(C(0.7, 1.9, -3.5, 0.1, 1.25, 1.4, 52), C(0.45, 1.8, -2.6, 0.15, 1.2, 2.5, 56), segt(t, 21.4, 24.27));

  const walk = pathAt(t, [
    { t: 17.4, x: 0.1, y: 0, z: -5.4 },
    { t: 19.35, x: -0.35, y: 0, z: -2.15 },
    { t: 20.5, x: -0.45, y: 0, z: -1.85 },
    { t: 24.2, x: -0.5, y: 0, z: -1.9 },
  ]);
  const reaching = seg(t, 20.15, 20.5);
  const noob = ch(walk.x, walk.y, walk.z, {
    yaw: 0,
    expr: t > 21.5 ? "surprise" : t > 19.5 ? "focus" : "neutral",
    gesture: t > 20.1 ? "reach" : "walk",
    hold: t > 20.1 ? reaching : 1,
    walk: t < 19.4 ? 1 : 0,
    phase: t * 10,
    lean: t < 19.4 ? 0.06 : 0,
    headPitch: t > 19.6 && t < 21.3 ? -0.12 : 0,
  });
  // Mom is already at the desk, visible once the door is open.
  const door = seg(t, 21.42, 22.25) * 1.65;
  const momShow = door > 0.4;
  const mom = ch(0.4, 0, 3.25, {
    show: momShow,
    yaw: Math.PI,
    expr: "smug",
    gesture: "none",
  });
  return pack("hall", cam, noob, mom, 0.35, {
    door, captionY: approaching ? 0.16 : 0.72, day: t < 21.32 ? "DAY 5" : null,
  });
}

function momBeat(t: number): State {
  const cam = camLerp(
    C(-0.15, 1.9, 0.15, 0.15, 1.2, 2.7, 64),
    C(-0.05, 1.8, 0.35, 0.25, 1.15, 2.85, 60),
    segt(t, 24.27, 27.5),
  );
  const pointHw = seg(t, 25.35, 25.7) * (1 - seg(t, 26.15, 26.4));
  const pointLock = seg(t, 26.25, 26.55);
  const mom = ch(0.42, 0, 3.2, {
    yaw: Math.PI * 0.82,
    expr: "talk",
    gesture: pointLock > 0.25 ? "point" : "reach",
    hold: Math.max(pointHw, pointLock, 0.35),
    phase: t * 6,
    headPitch: pointHw > 0.3 ? 0.35 : 0.1,
    headYaw: pointLock > 0.3 ? -0.55 : 0.15,
  });
  const def = seg(t, 26.15, 26.7);
  const noob = ch(-0.85, -0.22 * def, 1.85, {
    yaw: faceYaw(-0.85, 1.85, 0.4, 3.1),
    expr: def > 0.35 ? "frown" : "surprise",
    squash: 1 - 0.28 * def,
    headPitch: 0.25 * def,
    gesture: "none",
    floor: 0,
  });
  return pack("bedroom", cam, noob, mom, 0.2, { door: 1.65, captionY: 0.16, day: null });
}

function invite(t: number): State {
  const cam = camLerp(C(0.05, 1.7, 4.7, 0.0, 1.35, 1.7, 42), C(0.0, 1.65, 4.45, 0.0, 1.32, 1.65, 40), segt(t, 27.73, 28.68));
  const noob = ch(0.0, 0, 1.7, {
    yaw: 0.02,
    expr: "smile",
    gesture: "shrug",
    hold: seg(t, 27.8, 28.1),
    headYaw: Math.sin(t * 2.5) * 0.08,
    headPitch: -0.06,
  });
  const mom = ch(1.15, 0, 2.7, {
    yaw: -2.4,
    expr: "smug",
    gesture: "none",
    headYaw: 0.3,
  });
  return pack("bedroom", cam, noob, mom, 0.15, { door: 1.65, captionY: 0.72, day: null });
}

function pack(
  place: Place,
  cam: Cam,
  noob: CharPose,
  mom: CharPose,
  portal: number,
  extra: Partial<State> & { dust?: number; checkpoint?: number; wifi?: number; ribbon?: number; friends?: CharPose[]; blocks?: number[]; walls?: number; door?: number },
): State {
  const t = 0;
  void t;
  return {
    place,
    cam,
    noob,
    mom,
    friends: extra.friends ?? [hidden(), hidden(), hidden()],
    checkpoint: extra.checkpoint ?? 0,
    door: extra.door ?? 0,
    blocks: extra.blocks ?? [0, 0, 0, 0, 0, 0, 0, 0],
    walls: extra.walls ?? 0,
    wifi: extra.wifi ?? 0,
    dust: extra.dust ?? 0,
    ribbon: extra.ribbon ?? 0,
    portal,
    captionY: extra.captionY ?? 0.7,
    bubble: extra.bubble ?? false,
    day: extra.day === undefined ? null : extra.day,
  };
}

export function direct(frame: number): State {
  const t = frame / FPS;
  let s: State;
  if (t >= 28.68) s = hook(t - DUR);
  else if (t < 2.498) s = hook(t);
  else if (t < 6.961) s = day1(t);
  else if (t < 10.375) s = day2(t);
  else if (t < 13.288) s = day3(t);
  else if (t < 17.398) s = day4(t);
  else if (t < 24.273) s = day5(t);
  else if (t < 27.731) s = momBeat(t);
  else s = invite(t);

  s.noob = breathe(s.noob, t, 1);
  s.mom = breathe(s.mom, t, 2);
  s.friends = s.friends.map((f, i) => breathe(f, t, 3 + i));
  return s;
}
