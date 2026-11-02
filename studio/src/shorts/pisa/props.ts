// Pisa-only scenery and effect drawings: the cathedral, the baptistery, the city wall, the 1934 cement truck and hose,
// the 1990s lead counterweights / steel bands / fence / drill rig, the mud ring, the classroom chalkboard, and the 2D
// effect cards (banana, sponge, water drops).
import * as THREE from "three";
import { Batch, V, lam, boxGeo } from "../../engine/build";
import { ctex, rep } from "../../engine/paint";
import { Pen, INK, rrect } from "../../engine/toon";

const col = (hex: string) => lam("pisa" + hex, () => ({ color: hex }));
const at = (x: number, y: number, z: number, yaw = 0) => new THREE.Matrix4().makeRotationY(yaw).setPosition(x, y, z);
const cyl = (r0: number, r1: number, h: number, seg = 24) => new THREE.CylinderGeometry(r1, r0, h, seg).translate(0, h / 2, 0);

// ---------------- buildings ----------------
/** Pisan Romanesque wall: white marble with thin grey stripes and a row of blind arches (tile = 8 m wide, 8 m tall) */
const romanesqueTex = () => ctex("pisaRomanesque", 512, 512, (g) => {
  g.fillStyle = "#efe9dc"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) { g.fillStyle = "rgba(120,120,130,0.22)"; g.fillRect(0, y, 512, 7); }
  for (const x of [64, 192, 320, 448]) {
    g.fillStyle = "#ddd5c4"; g.beginPath(); g.moveTo(x - 44, 512); g.lineTo(x - 44, 230); g.arc(x, 230, 44, Math.PI, 0); g.lineTo(x + 44, 512); g.closePath(); g.fill();
    g.strokeStyle = "rgba(60,50,45,0.5)"; g.lineWidth = 4; g.stroke();
    g.fillStyle = "#4a4458"; g.beginPath(); g.moveTo(x - 12, 380); g.lineTo(x - 12, 300); g.arc(x, 300, 12, Math.PI, 0); g.lineTo(x + 12, 380); g.closePath(); g.fill(); // window slit
  }
});
const brickWallTex = () => ctex("pisaBrickWall", 512, 512, (g, r) => {
  g.fillStyle = "#c9845c"; g.fillRect(0, 0, 512, 512);
  for (let y = 0, row = 0; y < 512; y += 24, row++) for (let x = -(row % 2) * 32; x < 512; x += 64) {
    g.fillStyle = ["#c47a52", "#b86e48", "#cf8c62", "#bf7650"][Math.floor(r() * 4)]; g.fillRect(x + 2, y + 2, 60, 20);
  }
});
export const cathedral = (b: Batch, x: number, z: number) => {
  const wall = lam("pisaRomanesqueM", () => ({ map: rep(romanesqueTex(), 1, 1) }));
  const roof = col("#b8653f"), L = 70, W = 22, H = 18;
  b.add(boxGeo(V(x - L / 2, 0, z - W / 2), V(x + L / 2, H, z + W / 2), 8), wall);                       // nave
  b.add(boxGeo(V(x - L / 2 - 2, 0, z - W / 2 - 0.5), V(x - L / 2, H + 6, z + W / 2 + 0.5), 8), wall);   // facade slab, taller
  b.add(boxGeo(V(x - 6, 0, z - W / 2 - 14), V(x + 6, H - 2, z + W / 2 + 14), 8), wall);                 // transept
  for (const s of [-1, 1]) b.add(new THREE.PlaneGeometry(L, 13).rotateX(s * 1.0).translate(0, 0, 0), roof, at(x, H + 2.6, z + s * W / 4));
  b.add(new THREE.SphereGeometry(7, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), col("#c9c2b4"), at(x, H + 2, z));   // dome
  b.add(cyl(7, 7, 2.5, 24), wall, at(x, H, z));
};
export const baptistery = (b: Batch, x: number, z: number) => {
  const wall = lam("pisaRomanesqueM", () => ({ map: rep(romanesqueTex(), 1, 1) }));
  b.add(cyl(17, 17, 18, 48), wall, at(x, 0, z));
  b.add(new THREE.ConeGeometry(18, 14, 48).translate(0, 7, 0), col("#b8653f"), at(x, 18, z));
  b.add(new THREE.SphereGeometry(5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), col("#c9c2b4"), at(x, 31, z));
};
/** a crenellated brick city wall along x from x0 to x1 at z, h tall */
export const cityWall = (b: Batch, x0: number, x1: number, z: number, h = 11) => {
  const m = lam("pisaBrickWallM", () => ({ map: rep(brickWallTex(), 1, 1) }));
  b.add(boxGeo(V(x0, 0, z - 1.5), V(x1, h, z + 1.5), 6), m);
  for (let x = x0; x < x1; x += 3) b.add(boxGeo(V(x, h, z - 1.5), V(x + 1.7, h + 1.6, z + 1.5), 6), m);
};

// ---------------- era props ----------------
/** 1934: a small cement mixer truck (cab, bed, drum) at (x, z) facing +x; a hose runs from the drum to `to` */
export const cementTruck = (b: Batch, x: number, z: number, to: [number, number, number]) => {
  const m = at(x, 0, z), cab = col("#4f6b4a"), dark = col("#2f3446");
  b.add(boxGeo(V(-2.8, 0.7, -1.1), V(2.8, 1.3, 1.1)), dark, m);                // chassis
  b.add(boxGeo(V(1.4, 1.3, -1.05), V(2.9, 3.0, 1.05)), cab, m);                // cab
  b.add(boxGeo(V(1.55, 2.2, -1.06), V(2.75, 2.85, 1.06)), col("#9fc3d8"), m);  // windows
  b.add(new THREE.CylinderGeometry(1.1, 0.8, 3.2, 20).rotateZ(Math.PI / 2 - 0.25).translate(-0.8, 2.4, 0), col("#d8cfa8"), m); // drum
  for (const [wx, wz] of [[-2, -1.1], [-2, 1.1], [2, -1.1], [2, 1.1]]) b.add(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 18).rotateX(Math.PI / 2).translate(wx, 0.55, wz), dark, m);
  // hose: a sagging chain of short segments from the drum spout to the target
  const a = new THREE.Vector3(x - 2.4, 2.0, z), c = new THREE.Vector3(...to);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const p0 = a.clone().lerp(c, t0).add(V(0, -2.2 * 4 * t0 * (1 - t0), 0)), p1 = a.clone().lerp(c, t1).add(V(0, -2.2 * 4 * t1 * (1 - t1), 0));
    const len = p0.distanceTo(p1), mid = p0.clone().add(p1).multiplyScalar(0.5);
    const g = new THREE.CylinderGeometry(0.16, 0.16, len, 8);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), p1.clone().sub(p0).normalize());
    b.add(g, col("#3a3a40"), new THREE.Matrix4().compose(mid, q, V(1, 1, 1)));
  }
};
/** 1990s: lead ingots stacked on a concrete ring on the high (north = -x) side, steel bands round the ground floor */
export const leadAndBands = (b: Batch, R: number) => {
  b.add(boxGeo(V(-R - 5, 0, -6), V(-R - 0.5, 0.8, 6)), col("#b9b3a6"));
  for (let k = 0; k < 6; k++) for (let j = 0; j < 4; j++) b.add(boxGeo(V(-R - 4.6 + j * 1.0, 0.8 + k * 0.45, -5.4 + (k % 2) * 0.3), V(-R - 3.7 + j * 1.0, 1.2 + k * 0.45, 5.4)), col("#5d6270"));
  for (const y of [2.2, 3.2]) b.add(new THREE.TorusGeometry(R + 0.12, 0.09, 6, 64).rotateX(Math.PI / 2).translate(0, y, 0), col("#3a3d47"));
};
/** 1990s: a construction fence round the lawn (radius r) with a gap toward the camera side (+z) */
export const fenceRing = (b: Batch, r: number) => {
  const post = col("#f2b134"), mesh = lam("pisaFenceMesh", () => ({ color: "#c9ccd2", transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  const n = 40;
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
    if (Math.abs(Math.sin(a0) - 1) < 0.08) continue;
    const p0 = V(Math.cos(a0) * r, 0, Math.sin(a0) * r), p1 = V(Math.cos(a1) * r, 0, Math.sin(a1) * r), len = p0.distanceTo(p1);
    b.add(cyl(0.06, 0.06, 2.0, 6), post, at(p0.x, 0, p0.z));
    b.add(new THREE.PlaneGeometry(len, 1.8).translate(0, 1.0, 0), mesh, at((p0.x + p1.x) / 2, 0, (p0.z + p1.z) / 2, -Math.atan2(p1.z - p0.z, p1.x - p0.x)));
  }
};
/** 1990s: the soil-extraction rig on the high side: a yellow machine with an inclined auger under the foundation */
export const drillRig = (b: Batch, x: number, z: number) => {
  const m = at(x, 0, z), y = col("#f2b134"), dark = col("#2f3446");
  b.add(boxGeo(V(-1.6, 0, -1.2), V(1.6, 1.6, 1.2)), y, m);
  b.add(boxGeo(V(-1.2, 1.6, -0.9), V(0.6, 2.6, 0.9)), y, m);
  b.add(new THREE.CylinderGeometry(0.18, 0.18, 7, 10).rotateZ(-1.15).translate(3.4, 0.6, 0), dark, m);   // auger going under the tower
  b.add(boxGeo(V(-1.7, 0, -1.3), V(1.7, 0.35, 1.3)), dark, m);
};
/** wet mud ring round the base (medieval shots): a flat darker disc with a few shiny puddles */
const mudTex = () => ctex("pisaMud", 512, 512, (g, r) => {
  const gr = g.createRadialGradient(256, 256, 120, 256, 256, 256);
  gr.addColorStop(0, "rgba(110,80,50,1)"); gr.addColorStop(0.75, "rgba(120,92,60,0.85)"); gr.addColorStop(1, "rgba(120,92,60,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = 150 + r() * 70; g.fillStyle = "rgba(150,180,200,0.55)"; g.beginPath(); g.ellipse(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, 10 + r() * 22, 6 + r() * 10, a, 0, 7); g.fill(); }
});
export const mudRing = (R: number) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(R * 3.4, R * 3.4).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: mudTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.position.y = 0.02;
  return m;
};
/** classroom chalkboard: the tower on a layer of mud, water drops leaving the mud, arrows (no words) */
const chalkTex = () => ctex("pisaChalk", 1024, 640, (g, r) => {
  g.fillStyle = "#2f4a3e"; g.fillRect(0, 0, 1024, 640);
  g.fillStyle = "rgba(255,255,255,0.05)"; for (let i = 0; i < 30; i++) g.fillRect(r() * 1024, r() * 640, 80, 6);   // chalk dust smears
  g.strokeStyle = "#f2efe6"; g.lineWidth = 6; g.lineCap = "round";
  g.fillStyle = "rgba(200,160,110,0.55)"; g.fillRect(80, 430, 864, 150);                        // mud layer
  g.beginPath(); g.moveTo(80, 430); for (let x = 80; x <= 944; x += 24) g.lineTo(x, 430 + 6 * Math.sin(x / 30)); g.stroke();
  g.save(); g.translate(512, 430); g.rotate(0.08); g.strokeRect(-70, -320, 140, 320);            // the tower, leaning
  for (let y = -270; y < 0; y += 50) { g.beginPath(); g.moveTo(-70, y); g.lineTo(70, y); g.stroke(); }
  g.restore();
  g.fillStyle = "#9fd4ff";
  for (const [x, y] of [[400, 520], [470, 545], [560, 525], [630, 548], [700, 515]]) {            // drops squeezed up and out
    g.beginPath(); g.moveTo(x, y - 18); g.quadraticCurveTo(x + 12, y + 4, x, y + 8); g.quadraticCurveTo(x - 12, y + 4, x, y - 18); g.fill();
  }
  for (const x of [300, 724]) { g.beginPath(); g.moveTo(x, 560); g.lineTo(x + (x < 512 ? -60 : 60), 470); g.stroke(); g.beginPath(); g.moveTo(x + (x < 512 ? -60 : 60), 470); g.lineTo(x + (x < 512 ? -38 : 38), 482); g.stroke(); }
});
let chalkMat: THREE.MeshBasicMaterial | undefined;
export const chalkboard = (b: Batch, x: number, y: number, z: number, w = 3.2, h = 2.0) => {
  b.add(boxGeo(V(x - w / 2 - 0.1, y - h / 2 - 0.1, z), V(x + w / 2 + 0.1, y + h / 2 + 0.1, z + 0.06)), col("#8a5a34"));
  // unlit board face: a lit one went dark in the room's shade and the drawing could not be read (readability traps)
  b.add(new THREE.PlaneGeometry(w, h).translate(x, y, z + 0.065), chalkMat ??= new THREE.MeshBasicMaterial({ map: chalkTex(), color: new THREE.Color(0.92, 0.92, 0.92) }));
  b.add(boxGeo(V(x - w / 2, y - h / 2 - 0.16, z), V(x + w / 2, y - h / 2 - 0.08, z + 0.2)), col("#8a5a34"));
};

// ---------------- 2D effect cards ----------------
/** a banana on a 320 x 200 canvas */
export const fxBanana = (p: Pen) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20, a = Math.PI * (0.15 + 0.7 * t); pts.push([160 - 130 * Math.cos(a), 170 - 120 * Math.sin(a) * 0.9]); }
  for (let i = 20; i >= 0; i--) { const t = i / 20, a = Math.PI * (0.15 + 0.7 * t); pts.push([160 - 100 * Math.cos(a), 170 - 80 * Math.sin(a) * 0.9 - 6 * Math.sin(Math.PI * t)]); }
  p.poly(pts, "#f6d24a", 8);
  p.stroke([[160 - 130 * Math.cos(Math.PI * 0.85), 170 - 120 * Math.sin(Math.PI * 0.85) * 0.9], [44, 70]], 12, "#6b4a2a");
  p.dot(282, 128, 7, "#4a3a20");
};
/** a sponge on a 400 x 360 canvas. squeeze 0..1; fast: it squishes out sideways (wide, splats) instead of draining */
export const fxSponge = (p: Pen, squeeze: number, fast: boolean) => {
  const h = 150 * (1 - 0.45 * squeeze), w = 190 * (fast ? 1 + 0.55 * squeeze : 1 - 0.05 * squeeze), cx = 200, by = 250;
  const body = rrect(cx - w / 2, by - h, cx + w / 2, by, 22);
  p.poly(body, fast ? "#e8c84a" : squeeze > 0.6 ? "#d9b44a" : "#f2d65a", 9);
  for (let i = 0; i < 9; i++) p.ell(cx - w / 2 + 30 + ((i * 53) % (w - 60)), by - h + 30 + ((i * 37) % (h - 50)), 9, 7, "#d4ac36", 0);
  if (!fast && squeeze > 0.05) for (let k = 0; k < 4; k++) { const y = by + 20 + ((squeeze * 3 + k * 0.27) % 1) * 90; p.ell(cx - 50 + k * 33, y, 9, 13, "#9fd4ff", 4); }
  if (fast && squeeze > 0.3) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) p.ell(cx + s * (w / 2 + 25 + k * 28), by - 40 - k * 22, 14 - k * 3, 10 - k * 2, "#9fd4ff", 4);
  p.stroke([[cx - w / 2 - 6, by - h - 6], [cx - w / 2 + 40, by - h + 16]], 12, INK);   // fingers (ink strokes) over the top
  p.stroke([[cx + w / 2 + 6, by - h - 6], [cx + w / 2 - 40, by - h + 16]], 12, INK);
};

// ---------------- the medieval building site (fills the square around the tower) ----------------
const marbleBlockMat = () => lam("pisaBlockM", () => ({ map: rep(ctex("pisaBlock", 256, 256, (g, r) => {
  g.fillStyle = "#efe9dc"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 18; i++) { g.strokeStyle = `rgba(150,145,150,${0.12 + r() * 0.15})`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(r() * 256, r() * 256); g.bezierCurveTo(r() * 256, r() * 256, r() * 256, r() * 256, r() * 256, r() * 256); g.stroke(); }
  g.strokeStyle = "rgba(90,80,75,0.35)"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 250);
}), 1, 1) }));
/** a cut marble block, w x h x d, base at y = 0 */
export const block = (b: Batch, x: number, z: number, w = 1.2, h = 0.6, d = 0.8, yaw = 0) =>
  b.add(boxGeo(V(-w / 2, 0, -d / 2), V(w / 2, h, d / 2)), marbleBlockMat(), at(x, 0, z, yaw));
/** a stack of blocks (pyramid-ish) */
export const blockStack = (b: Batch, x: number, z: number, yaw = 0, rows = 3) => {
  for (let r = 0; r < rows; r++) for (let k = 0; k < rows - r; k++)
    b.add(boxGeo(V(-0.6, 0, -0.4), V(0.6, 0.6, 0.4)), marbleBlockMat(), at(x + (k - (rows - r - 1) / 2) * 1.25 * Math.cos(yaw), r * 0.6, z - (k - (rows - r - 1) / 2) * 1.25 * Math.sin(yaw), yaw + (r % 2) * 0.05));
};
const wood = () => col("#9a6a3c"), woodD = () => col("#7a4f2e");
const beam = (b: Batch, p0: THREE.Vector3, p1: THREE.Vector3, th: number, mat: THREE.Material) => {
  const len = p0.distanceTo(p1), mid = p0.clone().add(p1).multiplyScalar(0.5);
  b.add(new THREE.BoxGeometry(th, len, th), mat, new THREE.Matrix4().compose(mid, new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), p1.clone().sub(p0).normalize()), V(1, 1, 1)));
};
/** medieval treadwheel crane: A-frame tower, a big wheel at the foot, a jib with a rope and a hanging block */
export const treadCrane = (b: Batch, x: number, z: number, yaw = 0, h = 12, reach = 5) => {
  const m = at(x, 0, z, yaw), P = (px: number, py: number, pz: number) => V(px, py, pz).applyMatrix4(m);
  for (const s of [-1, 1]) { beam(b, P(s * 1.6, 0, -1.2), P(0, h, 0), 0.32, wood()); beam(b, P(s * 1.6, 0, 1.2), P(0, h, 0), 0.32, wood()); }
  for (const y of [h * 0.3, h * 0.6]) beam(b, P(-1.6 * (1 - y / h), y, 0), P(1.6 * (1 - y / h), y, 0), 0.2, woodD());
  beam(b, P(0, h - 0.4, -1.0), P(0, h + 0.3, reach), 0.3, wood());                       // jib
  const wheel = new THREE.TorusGeometry(2.0, 0.16, 8, 32);
  b.add(wheel, woodD(), new THREE.Matrix4().makeRotationY(yaw).setPosition(P(0, 2.2, -2.2)).multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2)));
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; beam(b, P(0, 2.2, -2.2), P(0, 2.2 + Math.sin(a) * 2, -2.2 + Math.cos(a) * 2), 0.1, wood()); }
  beam(b, P(0, h + 0.25, reach), P(0, h * 0.42, reach), 0.04, col("#c9b07a"));            // rope
  b.add(boxGeo(V(-0.55, 0, -0.4), V(0.55, 0.6, 0.4)), marbleBlockMat(), new THREE.Matrix4().makeRotationY(yaw).setPosition(P(0, h * 0.42 - 0.62, reach)));
};
/** a two-wheeled hand cart with a block on it */
export const cartWithBlock = (b: Batch, x: number, z: number, yaw = 0) => {
  const m = at(x, 0, z, yaw);
  b.add(boxGeo(V(-1.1, 0.55, -0.7), V(1.1, 0.75, 0.7)), wood(), m);
  for (const s of [-1, 1]) b.add(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16).rotateX(Math.PI / 2).translate(0, 0.55, s * 0.78), woodD(), m);
  for (const s of [-1, 1]) b.add(boxGeo(V(1.1, 0.62, s * 0.5 - 0.05), V(2.4, 0.7, s * 0.5 + 0.05)), wood(), m);  // handles
  b.add(boxGeo(V(-0.6, 0.75, -0.4), V(0.6, 1.3, 0.4)), marbleBlockMat(), m);
};
/** a pile of timber planks */
export const timberPile = (b: Batch, x: number, z: number, yaw = 0) => {
  for (let r = 0; r < 4; r++) for (let k = 0; k < 4 - r; k++)
    b.add(boxGeo(V(-2, 0, -0.12), V(2, 0.22, 0.12)), r % 2 ? woodD() : wood(), at(x, r * 0.22, z + (k - (3 - r) / 2) * 0.3, yaw + (r % 2 ? 0.04 : -0.03)));
};
/** a striped work tent */
export const tent = (b: Batch, x: number, z: number, yaw = 0, hex = "#c0353a") => {
  const m = at(x, 0, z, yaw);
  b.add(new THREE.ConeGeometry(2.4, 2.4, 6).translate(0, 2.6, 0), col(hex), m);
  b.add(new THREE.CylinderGeometry(2.3, 2.3, 1.4, 6, 1, true).translate(0, 0.7, 0), lam("pisaTentWall", () => ({ color: "#f2e8d0", side: THREE.DoubleSide })), m);
};
/** a dirt work area (flat, under the site props) */
const dirtTex = () => ctex("pisaDirt", 512, 512, (g, r) => {
  const gr = g.createRadialGradient(256, 256, 60, 256, 256, 256);
  gr.addColorStop(0, "rgba(176,140,96,1)"); gr.addColorStop(0.7, "rgba(170,136,92,0.9)"); gr.addColorStop(1, "rgba(170,136,92,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? "rgba(140,105,70,0.35)" : "rgba(210,185,145,0.35)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 4 + r() * 16, 3 + r() * 8, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(240,235,225,0.8)"; g.fillRect(r() * 512, r() * 512, 3 + r() * 6, 2 + r() * 4); } // marble chips
});
export const dirtPatch = (x: number, z: number, r: number) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: dirtTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  m.position.set(x, 0.015, z);
  return m;
};
