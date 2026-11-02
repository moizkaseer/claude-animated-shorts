// An interior room: floor, four walls with wallpaper over a painted wainscot, skirting, ceiling, a window opening
// (real hole: the sky and the outside show through) with frame, sill and curtains, a door. Centred on x/z = 0, floor at
// y = 0, the window in the back wall (z = -d/2). The shell receives shadows but never casts them, so the key light
// (light "interior": warm, through the window side) reaches the floor and the furniture and characters cast shadows.
// Furnish it with sets/props.ts (table, chair, sofa, bed, shelf, rug, frame, ceilingLamp, counter).
import * as THREE from "three";
import { Batch, V, lam, boxGeo, quad } from "../build";
import { ctex, rep, planksHD } from "../paint";

export type RoomOpts = {
  w?: number; d?: number; h?: number;      // inner size (m): default 7 x 6 x 3
  wall?: string; pattern?: string;         // wallpaper base + motif colours
  wainscot?: string;                       // lower wall panel colour
  floor?: "planks" | "tiles";              // wood boards or a checker of `tiles` colours
  tiles?: [string, string];
  window?: { x?: number; w?: number; h?: number; sill?: number; curtain?: string } | false;
  door?: { wall: "left" | "right"; z?: number } | false;
};

const wallpaper = (base: string, motif: string) => ctex(`paper${base}${motif}`, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(255,255,255,0.12)"; for (let x = 0; x < 512; x += 64) g.fillRect(x, 0, 24, 512); // soft stripes
  g.fillStyle = motif;
  for (let y = 32; y < 512; y += 64) for (let x = (y / 64) % 2 ? 0 : 32; x < 512; x += 64) {
    g.beginPath(); g.moveTo(x + 32, y - 9); g.lineTo(x + 41, y); g.lineTo(x + 32, y + 9); g.lineTo(x + 23, y); g.closePath(); g.fill();
  }
  for (let i = 0; i < 18; i++) { g.fillStyle = "rgba(120,90,60,0.05)"; g.beginPath(); g.arc(r() * 512, r() * 512, 30 + r() * 60, 0, Math.PI * 2); g.fill(); }
});
const wainscotTex = (hex: string) => ctex("wainscot" + hex, 512, 256, (g) => {
  g.fillStyle = hex; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = "rgba(40,30,30,0.35)"; g.lineWidth = 4;
  for (let x = 16; x < 512; x += 128) { g.strokeRect(x, 30, 96, 196); g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(x + 4, 34, 88, 6); }
});
const tileTex = (a: string, b: string) => ctex(`tiles${a}${b}`, 256, 256, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * 64, y * 64, 64, 64); }
  g.strokeStyle = "rgba(40,40,50,0.25)"; g.lineWidth = 2;
  for (let k = 0; k <= 256; k += 64) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 256); g.moveTo(0, k); g.lineTo(256, k); g.stroke(); }
});

export const room = (root: THREE.Object3D, o: RoomOpts = {}) => {
  const w = o.w ?? 7, d = o.d ?? 6, h = o.h ?? 3, b = new Batch();
  const paper = lam(`paper${o.wall}${o.pattern}`, () => ({ map: wallpaper(o.wall ?? "#f2d27a", o.pattern ?? "#e0a845") }));
  const wain = lam(`wain${o.wainscot}`, () => ({ map: wainscotTex(o.wainscot ?? "#5fb8b0") }));
  const trim = lam("roomTrim", () => ({ color: "#f4efe2" }));
  const WH = 1.0; // wainscot height
  // floor (uv in metres: planks 2 m / tiles 2 m per texture)
  const fm = o.floor === "tiles"
    ? lam(`tiles${o.tiles}`, () => ({ map: rep(tileTex(...(o.tiles ?? ["#5fb8b0", "#f4efe2"])), 1, 1) }))
    : lam("floorPlanks", () => ({ map: rep(planksHD(), 1, 1) }));
  b.add(quad(V(-w / 2, 0, d / 2), V(w / 2, 0, d / 2), V(w / 2, 0, -d / 2), V(-w / 2, 0, -d / 2), w / 2, d / 2), fm);
  b.add(quad(V(-w / 2, h, -d / 2), V(w / 2, h, -d / 2), V(w / 2, h, d / 2), V(-w / 2, h, d / 2)), lam("ceiling", () => ({ color: "#f6efe0" })));
  // a wall from (x0, z0) to (x1, z1) facing into the room, with optional holes [u0, u1, y0, y1] along it
  const wall = (x0: number, z0: number, x1: number, z1: number, holes: [number, number, number, number][] = []) => {
    const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len;
    const P = (u: number, y: number) => V(x0 + ux * u, y, z0 + uz * u);
    const piece = (u0: number, u1: number, y0: number, y1: number) => {
      if (u1 - u0 < 1e-3 || y1 - y0 < 1e-3) return;
      if (y0 < WH) b.add(quad(P(u0, y0), P(u1, y0), P(u1, Math.min(y1, WH)), P(u0, Math.min(y1, WH)), (u1 - u0) / 2, (Math.min(y1, WH) - y0) / 1, u0 / 2, y0), wain);
      if (y1 > WH) b.add(quad(P(u0, Math.max(y0, WH)), P(u1, Math.max(y0, WH)), P(u1, y1), P(u0, y1), (u1 - u0) / 1.6, (y1 - Math.max(y0, WH)) / 1.6, u0 / 1.6, Math.max(y0, WH) / 1.6), paper);
    };
    const cuts = [...holes].sort((a, c) => a[0] - c[0]);
    let u = 0;
    for (const [u0, u1, y0, y1] of cuts) { piece(u, u0, 0, h); piece(u0, u1, 0, y0); piece(u0, u1, y1, h); u = u1; }
    piece(u, len, 0, h);
    // skirting + chair rail: thin boxes standing 3 cm into the room, interrupted by the openings they cross
    const n = V(-uz, 0, ux).multiplyScalar(0.03);
    for (const [y0, y1] of [[0, 0.12], [WH - 0.03, WH + 0.03]] as const) {
      const segs: [number, number][] = [];
      let s = 0;
      for (const [u0, u1, hy0, hy1] of cuts) if (hy0 < y1 && hy1 > y0) { segs.push([s, u0]); s = u1; }
      segs.push([s, len]);
      for (const [a0, a1] of segs) {
        if (a1 - a0 < 0.01) continue;
        const a = P(a0, y0).add(n), c = P(a1, y1).add(n);
        b.add(boxGeo(V(Math.min(a.x, c.x) - Math.abs(n.x), y0, Math.min(a.z, c.z) - Math.abs(n.z)), V(Math.max(a.x, c.x) + Math.abs(n.x), y1, Math.max(a.z, c.z) + Math.abs(n.z))), trim);
      }
    }
  };
  const win = o.window === false ? null : { x: 0, w: 1.6, h: 1.5, sill: 0.95, curtain: "#e05a4a", ...(o.window ?? {}) };
  const winHole: [number, number, number, number][] = win ? [[w / 2 + win.x - win.w / 2, w / 2 + win.x + win.w / 2, win.sill, win.sill + win.h]] : [];
  wall(-w / 2, -d / 2, w / 2, -d / 2, winHole);                                    // back (window)
  const door = o.door === false ? null : { wall: "right" as const, z: 0.8, ...(o.door ?? {}) };
  const doorHole = (side: "left" | "right"): [number, number, number, number][] => door && door.wall === side ? [[d / 2 - door.z - 0.5, d / 2 - door.z + 0.5, 0, 2.1]] : [];
  wall(w / 2, -d / 2, w / 2, d / 2, doorHole("right").map(([u0, u1, y0, y1]) => [d - u1, d - u0, y0, y1]));   // right
  wall(-w / 2, d / 2, -w / 2, -d / 2, doorHole("left"));                          // left
  wall(w / 2, d / 2, -w / 2, d / 2);                                               // front (behind the camera)
  if (win) {
    const z = -d / 2, x0 = win.x - win.w / 2, x1 = win.x + win.w / 2, y0 = win.sill, y1 = win.sill + win.h, fr = lam("winFrame", () => ({ color: "#f7f2e8" }));
    for (const [a, c] of [[V(x0 - 0.08, y0 - 0.06, z), V(x1 + 0.08, y0, z + 0.12)], [V(x0 - 0.08, y1, z), V(x1 + 0.08, y1 + 0.08, z + 0.06)],
      [V(x0 - 0.08, y0, z), V(x0, y1, z + 0.06)], [V(x1, y0, z), V(x1 + 0.08, y1, z + 0.06)], [V(win.x - 0.025, y0, z - 0.02), V(win.x + 0.025, y1, z + 0.02)],
      [V(x0, (y0 + y1) / 2 - 0.025, z - 0.02), V(x1, (y0 + y1) / 2 + 0.025, z + 0.02)]] as const) b.add(boxGeo(a, c), fr);
    const cm = lam("curtain" + win.curtain, () => ({ color: win.curtain }));
    for (const s of [-1, 1]) b.add(boxGeo(V(win.x + s * (win.w / 2 + 0.05) - 0.22, y0 - 0.25, z + 0.06), V(win.x + s * (win.w / 2 + 0.05) + 0.22, y1 + 0.2, z + 0.14)), cm);
    b.add(boxGeo(V(x0 - 0.5, y1 + 0.2, z + 0.06), V(x1 + 0.5, y1 + 0.26, z + 0.16)), lam("rod", () => ({ color: "#2f3446" })));
  }
  if (door) {
    const sx = door.wall === "right" ? w / 2 - 0.02 : -w / 2 + 0.02, z = door.z;
    b.add(boxGeo(V(sx - 0.04, 0, z - 0.5), V(sx + 0.04, 2.1, z + 0.5)), lam("doorLeaf", () => ({ color: "#8a4a2c" })));
    b.add(boxGeo(V(sx - 0.07, 0.95, z + 0.32), V(sx + 0.07, 1.03, z + 0.38)), lam("knob", () => ({ color: "#d9b04a" })));
  }
  b.build(root, false);
  return { w, d, h };
};
