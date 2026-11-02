// Open country: a painted grass ground, rolling hills on the horizon, trees scattered outside a clear area, an
// optional dirt path and an optional lake (engine Water). The basis for parks, farms, battlefields, riverbanks.
import * as THREE from "three";
import { Batch, Kit, V, lam, prop } from "../build";
import { grassHD, rng, rep, ctex } from "../paint";
import { Water } from "../water";

export type LandOpts = {
  y?: number;                 // ground height
  clear?: (x: number, z: number) => boolean; // keep trees out of here (where the action is)
  trees?: number;             // how many trees to scatter (default 120)
  radius?: number;            // scatter radius (m, default 160)
  path?: { from: [number, number]; to: [number, number]; width?: number };
  lake?: { x: number; z: number; rx: number; rz: number };
  seed?: number;
};

const dirtTex = () => ctex("dirtHD", 512, 512, (g, r) => {
  g.fillStyle = "#c9a26a"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(150,110,60,0.18)" : "rgba(235,205,150,0.2)";
    g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 40, 6 + r() * 20, r() * 3, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(110,80,50,0.45)"; g.beginPath(); g.arc(r() * 512, r() * 512, 2 + r() * 4, 0, Math.PI * 2); g.fill(); }
});

export const land = (root: THREE.Object3D, kit: Kit, o: LandOpts = {}) => {
  const y = o.y ?? 0, r = rng(o.seed ?? 5), b = new Batch(), R = o.radius ?? 160;
  const clear = o.clear ?? (() => false);
  // ground: one big painted quad (4 m grass tiles)
  const gm = lam("grassHD", () => ({ map: grassHD() }));
  const g = new THREE.PlaneGeometry(1800, 1800).rotateX(-Math.PI / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 450, uv.getY(i) * 450);
  b.add(g, gm, new THREE.Matrix4().makeTranslation(0, y, 0));
  // path: a flat strip slightly above the grass
  if (o.path) {
    const [x0, z0] = o.path.from, [x1, z1] = o.path.to, w = o.path.width ?? 2.4, L = Math.hypot(x1 - x0, z1 - z0);
    const p = new THREE.PlaneGeometry(w, L).rotateX(-Math.PI / 2);
    const pu = p.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < pu.count; i++) pu.setXY(i, (pu.getX(i) * w) / 3, (pu.getY(i) * L) / 3);
    b.add(p, lam("dirt", () => ({ map: rep(dirtTex(), 1, 1) })), new THREE.Matrix4().makeRotationY(Math.atan2(x1 - x0, z1 - z0)).setPosition((x0 + x1) / 2, y + 0.01, (z0 + z1) / 2));
  }
  // hills ring
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("hillA", () => ({ color: "#78b257" })), lam("hillB", () => ({ color: "#6aa24e" })), lam("hillC", () => ({ color: "#8bbf63" }))];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r() * 0.4, d = 380 + r() * 160;
    b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(Math.cos(a) * d, y - 2, Math.sin(a) * d), new THREE.Quaternion(), V(150 + r() * 110, 40 + r() * 25, 120 + r() * 40)));
  }
  // trees (procedural cartoon vegetation: no model files needed)
  const kinds = ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree-high-round", "tree_cone"];
  for (let i = 0, n = o.trees ?? 120; i < n; i++) {
    const a = r() * Math.PI * 2, d = 14 + Math.sqrt(r()) * R, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (clear(x, z) || (o.lake && ((x - o.lake.x) / (o.lake.rx + 3)) ** 2 + ((z - o.lake.z) / (o.lake.rz + 3)) ** 2 < 1)) continue;
    prop(b, kit, kinds[Math.floor(r() * kinds.length)], x, y, z, 6 + r() * 5, r() * 6);
  }
  b.build(root);
  let water: Water | null = null;
  if (o.lake) {
    const lg = new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2);
    lg.scale(o.lake.rx, 1, o.lake.rz);
    water = new Water(lg.translate(o.lake.x, y + 0.03, o.lake.z), [0.05, 0.02]);
    root.add(water.mesh);
  }
  return { water };
};
