// "The Tower Saved by Wars" cast: medieval builders (who turn into spear-carrying soldiers on "war" and come back a
// century later with white moustaches), a soaked messenger, 1934 engineers in fedoras, 1990s engineers in hard hats,
// tourists holding the tower up, and the host, the Professor (characters/host.ts).
import { Outfit, Expr, fxCreak, fxPuff, fxStars } from "../../engine/toon";
import { Stage, CamInfo, Who, person, lidAt, blob, viewOf, beginStage, q } from "../../engine/cast";
import { host } from "../../characters/host";
import { SHOTS, W, ROOM_AT, WORK_BLOCKS } from "./story";
import { fxBanana, fxSponge } from "./props";

const s = W.s;
const BUILDERS: Outfit[] = [
  { jacket: "#a8724a", pants: "#5a4a3a", boots: "#4a3426", hat: "cap", cap: "#c0353a" },
  { jacket: "#6a7f4a", pants: "#4a4038", boots: "#4a3426", hat: "hair", hair: "#3a2a20", skin: "#f5c9a0", moustache: "#3a2a20" },
  { jacket: "#8c3b4a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#5a3b2a", skin: "#c99067", build: "stout" },
];
const SOLDIER = (o: Outfit): Outfit => ({ ...o, jacket: "#b8322e", hat: "kettle", rifle: true, spear: true });
const OLD = (o: Outfit): Outfit => ({ ...o, hat: o.hat === "cap" ? "cap" : "hair", hair: "#ece8e0", moustache: "#ece8e0" });
const ENG34: Outfit[] = [
  { jacket: "#5a5f6a", pants: "#3b3f52", boots: "#2a201a", hat: "fedora", bowtie: "#2f3446" },
  { jacket: "#7a6248", pants: "#4a4038", boots: "#2a201a", hat: "fedora", hatCol: "#6a5a48", skin: "#f5c9a0", moustache: "#2a201a" },
  { jacket: "#3f4a5a", pants: "#2f3446", boots: "#2a201a", hat: "fedora", hatCol: "#2f2a2a", build: "stout", glasses: "#2a201a" },
];
const ENG90: Outfit[] = [
  { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#4a3426", hat: "hardhat" },
  { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#4a3426", hat: "hardhat", hatCol: "#f4efe2", skin: "#ecd0b6", glasses: "#2a201a" },
];
const TOURISTS: Outfit[] = [
  { jacket: "#3fb5a8", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#f2b134" },
  { jacket: "#e05a7a", pants: "#3b3f52", boots: "#f4f1ea", hat: "hair", hair: "#5a3b2a", dress: "#e05a7a", skin: "#f5c9a0" },
  { jacket: "#f2b134", pants: "#4a4038", boots: "#5a3b2a", hat: "hair", hair: "#2a2a3a", skin: "#c99067", bag: "#3f6fb5" },
  { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#f4f1ea", hat: "beanie", hatCol: "#3fb5a8", build: "kid" },
  { jacket: "#5a8fc2", pants: "#6a5a3a", boots: "#4a3426", hat: "pith", skin: "#ecd0b6", glasses: "#2a201a" },
];

const who = (i: number, o: Outfit, key: string): Who => ({ i, o, okey: key });
const front = (out: Stage, cam: CamInfo, t: number, w: Who, x: number, z: number, expr: Expr, opts: { facing?: -1 | 0 | 1; swaps?: number[]; wave?: number; prop?: ["hammer", number] | null; mode?: "stand" | "sit" | "fall"; scale?: number; tilt?: number } = {}) => {
  const sc = opts.scale ?? (w.o.build === "kid" ? 0.72 : 1);
  out.places.push(person(cam, w, x, 0, z, { side: false, mirror: false },
    { mode: opts.mode ?? "stand", expr, blink: lidAt(t, w.i, opts.swaps), facing: opts.facing ?? 0, wave: opts.wave, prop: opts.prop ?? null, tilt: opts.tilt ?? 0 }, {}, sc));
  if (opts.mode !== "fall") blob(out, x, 0, z, sc);
};
/** a column marching toward +x from x0 (started at t0), 2 steps/s */
const marchOff = (out: Stage, cam: CamInfo, t: number, t0: number, spots: [number, number][], outfits: Outfit[], expr: Expr) =>
  spots.forEach(([x0, z], i) => {
    const x = x0 + 1.4 * Math.max(0, t - t0), ph = q((((t - t0) % 1) + 1) % 1, 60), view = viewOf(cam, x, z, 1, 0);
    out.places.push(person(cam, who(10 + i, outfits[i % outfits.length], `sold${i}`), x, 0, z, view,
      { mode: "march", phase: ph, expr, blink: lidAt(t, 10 + i) }, { mode: "march", phase: ph, expr, blink: lidAt(t, 10 + i), stomp: 1.1, stride: 0.9 * view.fs }));
    blob(out, x, 0, z);
  });
const hammerK = (t: number, every = 0.8) => { const u = (t % every) / every; return u < 0.75 ? 0 : 1; };

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const sh = SHOTS[id - 1], out = beginStage(sh.light, cam);
  const B = BUILDERS.map((o, i) => who(i, o, `b${i}`)), OLDB = BUILDERS.map((o, i) => who(i, OLD(o), `o${i}`));
  const tWar = (id === 6 ? s("goes to war") : s("go to war")) - 2 / 30;
  switch (id) {
    case 1: case 19: {
      // tourists "holding up" the tower (hand raised); the Professor among them at the end
      // id 19: in the foreground, "holding up" the tower behind them (the classic photo); id 1: small at its foot
      const near = id === 19;
      TOURISTS.forEach((o, i) => front(out, cam, t, who(40 + i, o, `t${i}`), near ? [3.0, 3.9, 4.8, 5.7, 6.4][i] : [-5, -1.5, 2.2, 5.5, 8.6][i],
        near ? [22.6, 21.6, 23.0, 21.8, 22.4][i] : [11.5, 12.6, 11.0, 12.8, 11.8][i], (["grin", "laugh", "smile", "grin", "smile_closed"] as Expr[])[i], { wave: 0, facing: 1 }));
      break;
    }
    case 2: case 6: {
      const spots: [number, number][] = WORK_BLOCKS.map(([x, z]) => [x - 0.72, z - 0.25]); // each builder at the left of his block
      if (t < tWar) B.forEach((w, i) => front(out, cam, t, w, spots[i][0], spots[i][1], i === 1 ? "stern" : "neutral", { prop: ["hammer", hammerK(t + i * 0.3)], facing: 1 }));
      else marchOff(out, cam, t, tWar, spots, BUILDERS.map(SOLDIER), "grin");
      break;
    }
    case 3:
      B.forEach((w, i) => front(out, cam, t, w, [-3.5, 0.5, 4.2][i], [9.6, 10.8, 9.9][i], i === 1 ? "smile_closed" : "grin", { prop: i !== 1 ? ["hammer", hammerK(t + i * 0.4)] : null, facing: (i === 0 ? 1 : -1) as -1 | 1 }));
      break;
    case 4: {
      const shock = t >= s("to tip") - 2 / 30;
      B.forEach((w, i) => front(out, cam, t, w, [-2.5, 1.5, 5.5][i], [10.8, 11.6, 11.0][i], shock ? (i === 1 ? "shock" : "nervous") : "neutral", { swaps: [s("to tip")] }));
      if (shock && t < s("to tip") + 1.6) for (const [x, y] of [[7.4, 4.5], [8.1, 9.5]]) out.fx.push({ key: `creak${q((t * 1.3) % 1, 30)}`, cw: 300, ch: 300, draw: (p) => fxCreak(p, q((t * 1.3) % 1, 30)), x, y, z: 1.5, w: 2.2, h: 2.2, rot: -0.4 });
      break;
    }
    case 5:
      front(out, cam, t, B[2], 8.9, 6.4, "nervous", { facing: -1 });
      break;
    case 7:
      break;
    case 8:
      OLDB.forEach((w, i) => i < 2 && front(out, cam, t, w, [-3.2, 4.0][i], [11.4, 11.0][i], "smile", { prop: ["hammer", hammerK(t + i * 0.4)] }));
      break;
    case 9: {
      const ban = t >= s("banana") - 2 / 30;
      OLDB.forEach((w, i) => front(out, cam, t, w, [6.4, 7.3, 8.2][i], [11.9, 11.3, 12.1][i], ban ? (i === 1 ? "grin" : "smile") : "neutral", { wave: i === 1 && ban ? 0 : undefined, facing: -1, swaps: [s("banana")] }));
      if (ban) out.fx.push({ key: "banana", cw: 320, ch: 200, draw: fxBanana, x: 7.72, y: 2.02, z: 11.2, w: 0.62, h: 0.39, rot: 0.3 });
      break;
    }
    case 10: {
      // the messenger runs in from the left soaking wet; the builders stop
      const tr = t - SHOTS[9].a / 30, x = Math.min(1.8, -4 + 6 * tr);
      const run = x < 1.8, mw = who(20, SOLDIER(BUILDERS[0]), "mess");
      if (run) { const view = viewOf(cam, x, 10.2, 1, 0); const ph = q((tr * 1.6) % 1, 60); out.places.push(person(cam, mw, x, 0, 10.2, view, { mode: "march", phase: ph, expr: "pained" }, { mode: "march", phase: ph, expr: "pained", stomp: 1.3, stride: 1.1 * view.fs })); blob(out, x, 0, 10.2); }
      else front(out, cam, t, mw, x, 10.2, "dazed");
      if (!run) out.fx.push({ key: `stars${q((t * 0.9) % 1, 30)}`, cw: 420, ch: 210, draw: (p) => fxStars(p, q((t * 0.9) % 1, 30)), x, y: 2.25, z: 10.2, w: 0.75, h: 0.375 });
      B.forEach((w, i) => i > 0 && front(out, cam, t, w, [0, 2.9, 3.8][i], [0, 11.2, 10.6][i], run ? "neutral" : "shock", { facing: -1 }));
      break;
    }
    case 11: case 12: case 13: {
      const lurch = id === 13 && t >= s("even more") - 2 / 30;
      ENG34.forEach((o, i) => front(out, cam, t, who(30 + i, o, `e34_${i}`), [10.6, 13.6, 12.3][i], [9.2, 10.4, 12.0][i],
        lurch ? "shock" : id === 12 && i === 2 ? "grin" : (["stern", "neutral", "smile"] as Expr[])[i], { facing: -1, swaps: [s("Luckily"), s("even more")] }));
      break;
    }
    case 14: case 15: case 16: {
      const [rx, ry] = ROOM_AT;
      if (id === 16) { host(out, cam, t, rx - 1.15, ry, -2.2, { mode: "explain", expr: "neutral", facing: 1 }); break; }
      host(out, cam, t, rx - 0.15, ry, -1.2, { mode: id === 14 ? "stand" : "explain", expr: id === 14 ? "neutral" : "smile", facing: 1, swaps: [s("Squeeze it fast")] });
      // the sponge in his hand: slow squeeze (drips), then fast (squish)
      const t1 = s("Squeeze it slowly"), t2 = s("Squeeze it fast"), fast = t >= t2 - 2 / 30;
      const k = id === 14 ? 0 : fast ? Math.min(1, (t - t2) / 0.25) : Math.min(1, (t - t1) / 1.6);
      out.fx.push({ key: `sponge${q(k, 30)}${fast ? "f" : "s"}`, cw: 400, ch: 360, draw: (p) => fxSponge(p, q(k, 30), fast), x: rx + 0.42, y: ry + 1.32, z: -1.05, w: 0.5, h: 0.45 });
      break;
    }
    case 17: {
      const crash = s("falls") + 0.75;
      if (t >= crash) { const u = Math.min(1, (t - crash) / 1.2); for (const dx of [8, 20, 32, 44]) out.fx.push({ key: `puff${q(u, 30)}`, cw: 300, ch: 300, draw: (p) => fxPuff(p, q(u, 30)), x: dx, y: 2.5, z: 2, w: 9, h: 9, soft: true }); }
      break;
    }
    case 18:
      ENG90.forEach((o, i) => front(out, cam, t, who(50 + i, o, `e90_${i}`), [-14.5, -11.8][i], [6.8, 9.2][i], (["stern", "nervous"] as Expr[])[i], { facing: 1 }));
      break;
    case 20:
      host(out, cam, t, 1.6, 0, 12.2, { mode: "stand", expr: t >= s("three wars") - 2 / 30 ? "smile_closed" : "neutral", facing: 1, swaps: [s("three wars")] });
      break;
  }
  return out;
};
