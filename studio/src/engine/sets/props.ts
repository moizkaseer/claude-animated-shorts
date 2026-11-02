// Procedural props (no model files): street lamp, bench, crate, barrel, fence; indoor furniture: table, chair, sofa,
// bed, shelf with books, rug, picture frame, ceiling lamp, counter. Chunky cartoon proportions in flat two-tone
// colours; the world ink pass outlines them. Every function adds to a Batch at (x, y, z) facing local +z, turned by
// yaw, and returns the glow meshes (if any) for the caller's night group.
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../build";
import { ctex } from "../paint";
import { glowMat } from "./common";

type Glow = THREE.Object3D[];
const at = (x: number, y: number, z: number, yaw: number) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
const box = (b: Batch, mat: THREE.Material, m: THREE.Matrix4, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) =>
  b.add(boxGeo(V(x0, y0, z0), V(x1, y1, z1), 0, true), mat, m);
const col = (hex: string) => lam("prop" + hex, () => ({ color: hex }));
const cyl = (b: Batch, mat: THREE.Material, m: THREE.Matrix4, x: number, y0: number, y1: number, z: number, r0: number, r1 = r0, seg = 12) =>
  b.add(new THREE.CylinderGeometry(r1, r0, y1 - y0, seg).translate(x, (y0 + y1) / 2, z), mat, m);

// ---------------- outdoor ----------------
/** cast-iron street lamp, lantern at h; the glass is a glow mesh (add it to a night group) */
export const lampPost = (b: Batch, x: number, y: number, z: number, h = 3.4, glass = "#ffc070"): Glow => {
  const m = at(x, y, z, 0), iron = col("#2f3446");
  cyl(b, iron, m, 0, 0, 0.35, 0, 0.16, 0.12);
  cyl(b, iron, m, 0, 0.35, h - 0.3, 0, 0.06, 0.05, 8);
  box(b, iron, m, -0.2, 0.2, h - 0.32, h - 0.26, -0.2, 0.2);
  box(b, iron, m, -0.24, 0.24, h + 0.28, h + 0.34, -0.24, 0.24);
  b.add(new THREE.ConeGeometry(0.3, 0.22, 4).rotateY(Math.PI / 4).translate(0, h + 0.45, 0), iron, m);
  const g = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.54, 0.34), glowMat(glass, 2.6));
  g.position.set(x, y + h + 0.01, z);
  const day = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.54, 0.34), col("#cfd8e6"));
  day.position.copy(g.position); day.name = "lampDay"; // unlit glass for day shots (callers put it in a day group)
  return [g, day];
};
export const bench = (b: Batch, x: number, y: number, z: number, yaw = 0) => {
  const m = at(x, y, z, yaw), wood = col("#a8724a"), iron = col("#2f3446");
  for (const s of [-0.7, 0.7]) { box(b, iron, m, s - 0.04, s + 0.04, 0, 0.45, -0.2, 0.2); box(b, iron, m, s - 0.04, s + 0.04, 0.45, 0.9, -0.24, -0.18); }
  for (const k of [0, 1, 2]) box(b, wood, m, -0.85, 0.85, 0.43, 0.47, -0.2 + k * 0.14, -0.1 + k * 0.14);
  for (const k of [0, 1]) box(b, wood, m, -0.85, 0.85, 0.58 + k * 0.17, 0.68 + k * 0.17, -0.25, -0.21);
};
export const crate = (b: Batch, x: number, y: number, z: number, s = 0.7, yaw = 0) => {
  const m = at(x, y, z, yaw);
  box(b, lam("crate", () => ({ map: crateTex() })), m, -s / 2, s / 2, 0, s, -s / 2, s / 2);
};
const crateTex = () => ctex("crateHD", 256, 256, (g) => {
  g.fillStyle = "#c08a52"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(70,35,15,0.75)"; g.lineWidth = 5;
  for (let y = 0; y <= 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  g.fillStyle = "#9a6a3c"; g.fillRect(0, 0, 256, 22); g.fillRect(0, 234, 256, 22); g.fillRect(0, 0, 22, 256); g.fillRect(234, 0, 22, 256);
  g.save(); g.translate(128, 128); g.rotate(Math.PI / 4); g.fillRect(-170, -12, 340, 24); g.restore();
});
export const barrel = (b: Batch, x: number, y: number, z: number, h = 1.0) => {
  const m = at(x, y, z, 0);
  cyl(b, col("#a5683b"), m, 0, 0, h, 0, 0.36 * h, 0.36 * h, 14);
  for (const f of [0.15, 0.85]) cyl(b, col("#3d3f4a"), m, 0, f * h - 0.04, f * h + 0.04, 0, 0.375 * h, 0.375 * h, 14);
};
/** picket fence along local x from 0 to len */
export const fence = (b: Batch, x: number, y: number, z: number, len: number, yaw = 0, hex = "#f2ead8") => {
  const m = at(x, y, z, yaw), c = col(hex);
  for (let u = 0; u <= len; u += 0.3) box(b, c, m, u - 0.05, u + 0.05, 0, 0.95, -0.03, 0.03);
  for (const h of [0.3, 0.75]) box(b, c, m, 0, len, h, h + 0.08, 0.03, 0.07);
};

// ---------------- indoor ----------------
export const table = (b: Batch, x: number, y: number, z: number, yaw = 0, w = 1.4, d = 0.8, hex = "#b5774a") => {
  const m = at(x, y, z, yaw), c = col(hex);
  box(b, c, m, -w / 2, w / 2, 0.72, 0.78, -d / 2, d / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(b, c, m, sx * (w / 2 - 0.1) - 0.04, sx * (w / 2 - 0.1) + 0.04, 0, 0.72, sz * (d / 2 - 0.1) - 0.04, sz * (d / 2 - 0.1) + 0.04);
};
export const chair = (b: Batch, x: number, y: number, z: number, yaw = 0, hex = "#8f5a36") => {
  const m = at(x, y, z, yaw), c = col(hex);
  box(b, c, m, -0.22, 0.22, 0.44, 0.49, -0.22, 0.22);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(b, c, m, sx * 0.18 - 0.03, sx * 0.18 + 0.03, 0, 0.44, sz * 0.18 - 0.03, sz * 0.18 + 0.03);
  for (const sx of [-1, 1]) box(b, c, m, sx * 0.18 - 0.03, sx * 0.18 + 0.03, 0.49, 0.98, -0.22, -0.16);
  box(b, c, m, -0.22, 0.22, 0.78, 0.94, -0.22, -0.17);
};
export const sofa = (b: Batch, x: number, y: number, z: number, yaw = 0, w = 2.1, hex = "#b8413a") => {
  const m = at(x, y, z, yaw), c = col(hex), dark = col("#7d2b28");
  box(b, c, m, -w / 2, w / 2, 0.12, 0.45, -0.45, 0.45);
  box(b, c, m, -w / 2, w / 2, 0.45, 0.95, -0.45, -0.22);
  for (const s of [-1, 1]) box(b, c, m, s * w / 2 - (s > 0 ? 0.22 : 0), s * w / 2 + (s < 0 ? 0.22 : 0), 0.45, 0.66, -0.45, 0.45);
  for (const k of [-1, 1]) box(b, col("#c9524a"), m, k > 0 ? 0.02 : -w / 2 + 0.24, k > 0 ? w / 2 - 0.24 : -0.02, 0.45, 0.55, -0.2, 0.42);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(b, dark, m, sx * (w / 2 - 0.1) - 0.04, sx * (w / 2 - 0.1) + 0.04, 0, 0.12, sz * 0.35 - 0.04, sz * 0.35 + 0.04);
};
export const bed = (b: Batch, x: number, y: number, z: number, yaw = 0, cover = "#5a8fc2") => {
  const m = at(x, y, z, yaw), wood = col("#a8724a");
  box(b, wood, m, -0.8, 0.8, 0.15, 0.4, -1.05, 1.05);
  box(b, wood, m, -0.8, 0.8, 0, 1.15, -1.1, -0.98);
  box(b, col("#f5f1e6"), m, -0.75, 0.75, 0.4, 0.58, -0.98, 1.0);
  box(b, col(cover), m, -0.78, 0.78, 0.5, 0.64, -0.3, 1.04);
  box(b, col("#ffffff"), m, -0.55, 0.55, 0.58, 0.72, -0.95, -0.6);
};
const BOOKS = ["#c0353a", "#3f6fb5", "#e0a83a", "#2f8a4f", "#7b5ac9", "#e2e0d6"];
export const shelf = (b: Batch, x: number, y: number, z: number, yaw = 0, w = 1.2, h = 1.9) => {
  const m = at(x, y, z, yaw), wood = col("#9a6a3c");
  box(b, wood, m, -w / 2, w / 2, 0, h, -0.32, -0.28);
  for (const s of [-1, 1]) box(b, wood, m, s * w / 2 - 0.03, s * w / 2 + 0.03, 0, h, -0.32, 0);
  const n = Math.max(2, Math.round(h / 0.45));
  for (let k = 0; k <= n; k++) {
    const yy = (k * (h - 0.04)) / n;
    box(b, wood, m, -w / 2, w / 2, yy, yy + 0.04, -0.32, 0);
    if (k === n) break;
    let u = -w / 2 + 0.05, i = k * 3;
    while (u < w / 2 - 0.12) {
      const bw = 0.05 + ((i * 37) % 5) * 0.012, bh = 0.24 + ((i * 53) % 4) * 0.03;
      box(b, col(BOOKS[i % BOOKS.length]), m, u, u + bw, yy + 0.04, yy + 0.04 + bh, -0.27, -0.05);
      u += bw + 0.01; i++;
    }
  }
};
export const counter = (b: Batch, x: number, y: number, z: number, yaw = 0, w = 2.4, hex = "#5fb8b0") => {
  const m = at(x, y, z, yaw);
  box(b, col(hex), m, -w / 2, w / 2, 0.08, 0.88, -0.3, 0.3);
  box(b, col("#f2ead8"), m, -w / 2 - 0.03, w / 2 + 0.03, 0.88, 0.94, -0.33, 0.33);
  box(b, col("#2f3446"), m, -w / 2, w / 2, 0, 0.08, -0.26, 0.26);
  for (let u = -w / 2 + 0.6; u < w / 2; u += 0.6) box(b, col("#2f3446"), m, u - 0.012, u + 0.012, 0.15, 0.82, 0.3, 0.31);
};
const rugTex = (hex: string) => ctex("rug" + hex, 512, 320, (g) => {
  g.fillStyle = hex; g.fillRect(0, 0, 512, 320);
  g.strokeStyle = "#f4e7c8"; g.lineWidth = 12; g.strokeRect(26, 26, 460, 268);
  g.strokeStyle = "rgba(60,25,25,0.4)"; g.lineWidth = 3; g.strokeRect(44, 44, 424, 232);
  g.fillStyle = "#f4e7c8"; g.beginPath(); g.ellipse(256, 160, 60, 40, 0, 0, Math.PI * 2); g.fill();
});
export const rug = (b: Batch, x: number, y: number, z: number, w = 2.6, d = 1.7, yaw = 0, hex = "#b85a4a") => {
  const m = at(x, y + 0.012, z, yaw);
  b.add(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), lam("rug" + hex, () => ({ map: rugTex(hex) })), m);
};
/** framed picture on a wall facing local +z; paint = a small landscape */
export const frame = (b: Batch, x: number, y: number, z: number, yaw = 0, w = 0.8, h = 0.6) => {
  const m = at(x, y, z, yaw);
  box(b, col("#7a4b2a"), m, -w / 2, w / 2, -h / 2, h / 2, 0, 0.04);
  b.add(new THREE.PlaneGeometry(w - 0.1, h - 0.1).translate(0, 0, 0.045), lam("picture", () => ({ map: pictureTex() })), m);
};
const pictureTex = () => ctex("picture", 256, 192, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, "#6a9fe0"); gr.addColorStop(1, "#cfe3f2");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 192);
  g.fillStyle = "#7fbc4e"; g.beginPath(); g.ellipse(70, 170, 140, 70, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#5ab04c"; g.beginPath(); g.ellipse(210, 180, 120, 60, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#fff3b0"; g.beginPath(); g.arc(190, 50, 18, 0, Math.PI * 2); g.fill();
});
/** pendant lamp hanging from the ceiling at height top; the shade's underside glows */
export const ceilingLamp = (b: Batch, x: number, top: number, z: number, drop = 0.9, hex = "#4fb3a8"): Glow => {
  const m = at(x, 0, z, 0);
  cyl(b, col("#2f3446"), m, 0, top - drop, top, 0, 0.012, 0.012, 6);
  b.add(new THREE.ConeGeometry(0.34, 0.3, 18, 1, true).translate(0, top - drop - 0.05, 0), lam("lampShade" + hex, () => ({ color: hex, side: THREE.DoubleSide })), m);
  const g = new THREE.Mesh(new THREE.CircleGeometry(0.3, 18).rotateX(Math.PI / 2), glowMat("#ffd9a0", 2.0));
  g.position.set(x, top - drop - 0.19, z);
  return [g];
};
