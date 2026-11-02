// The Tower of Pisa, procedural: a white-marble ground floor with a blind arcade, six loggia floors (inner wall with
// doorways, a ring of 30 columns, cornice), a smaller bell chamber. Close to the real proportions (15.5 m wide,
// ~55 m tall). Each level is its own group stacked on the one below, so the tower can be shown at any construction
// stage, lean as a whole (about its base centre: the low side sinks into the ground), and bend: every level above
// the 3rd can tilt back a little relative to the one below (the medieval correction that made it "a banana").
import * as THREE from "three";
import { Batch, lam } from "../../engine/build";
import { ctex, rep } from "../../engine/paint";

export const R = 7.75;               // outer radius (m)
const H0 = 11, HL = 5.0, HB = 6.5;   // ground floor, loggia, bell chamber heights
export const LEVELS = 8;             // 0 = ground floor, 1-6 loggias, 7 bell chamber
export const levelH = (i: number) => (i === 0 ? H0 : i === 7 ? HB : HL);
export const towerH = () => H0 + 6 * HL + HB;

const marbleTex = () => ctex("pisaMarble", 512, 512, (g, r) => {
  g.fillStyle = "#efe9dc"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 64) { g.fillStyle = "rgba(150,145,140,0.16)"; g.fillRect(0, y, 512, 5); }    // courses
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.18)" : "rgba(170,160,150,0.08)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 20 + r() * 60, 8 + r() * 20, 0, 0, 7); g.fill(); }
});
/** one blind arch of the ground floor (texture repeats 15 times round the drum): pilasters, round arch, lozenge */
const arcadeTex = () => ctex("pisaArcade", 256, 1024, (g) => {
  g.fillStyle = "#efe9dc"; g.fillRect(0, 0, 256, 1024);
  for (let y = 0; y < 1024; y += 48) { g.fillStyle = "rgba(150,145,140,0.14)"; g.fillRect(0, y, 256, 4); }
  g.fillStyle = "#ddd5c4"; g.beginPath(); g.moveTo(40, 1024); g.lineTo(40, 260); g.arc(128, 260, 88, Math.PI, 0); g.lineTo(216, 1024); g.closePath(); g.fill(); // recessed panel
  g.strokeStyle = "rgba(60,50,45,0.55)"; g.lineWidth = 5; g.stroke();
  g.fillStyle = "#f7f3ea"; g.fillRect(0, 0, 26, 1024); g.fillRect(230, 0, 26, 1024);                     // pilasters
  g.strokeStyle = "rgba(60,50,45,0.35)"; g.lineWidth = 3; g.strokeRect(2, -4, 22, 1032); g.strokeRect(232, -4, 22, 1032);
  g.fillStyle = "#b9b3a6"; g.beginPath(); g.moveTo(128, 300); g.lineTo(164, 360); g.lineTo(128, 420); g.lineTo(92, 360); g.closePath(); g.fill(); // lozenge
  g.strokeStyle = "rgba(60,50,45,0.5)"; g.lineWidth = 3; g.stroke();
  g.fillStyle = "#3d3a4a"; g.beginPath(); g.moveTo(96, 1024); g.lineTo(96, 820); g.arc(128, 820, 32, Math.PI, 0); g.lineTo(160, 1024); g.closePath(); g.fill(); // small door in every 15th? (all: reads as arcade)
});
/** loggia inner wall: dark doorways between the columns (repeats 15 times) */
const innerTex = () => ctex("pisaInner", 256, 512, (g) => {
  g.fillStyle = "#e3dccd"; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "#4a4458"; g.beginPath(); g.moveTo(84, 512); g.lineTo(84, 210); g.arc(128, 210, 44, Math.PI, 0); g.lineTo(172, 512); g.closePath(); g.fill();
  g.strokeStyle = "rgba(60,50,45,0.5)"; g.lineWidth = 4; g.stroke();
});

const cyl = (r0: number, r1: number, h: number, seg = 48, open = false) => new THREE.CylinderGeometry(r1, r0, h, seg, 1, open).translate(0, h / 2, 0);
const ring = (r: number, h: number, w: number) => {
  const outer = new THREE.CylinderGeometry(r + w, r + w, h, 48, 1, true).translate(0, h / 2, 0);
  const top = new THREE.RingGeometry(r - 1.2, r + w, 48).rotateX(-Math.PI / 2).translate(0, h, 0);
  return [outer, top];
};

/** a tower level as a Batch-built group with its base at y = 0 */
const level = (i: number) => {
  const g = new THREE.Group(), b = new Batch(), h = levelH(i);
  const marble = lam("pisaMarbleM", () => ({ map: rep(marbleTex(), 4, 2) })), plain = lam("pisaCol", () => ({ color: "#f3eee4" }));
  if (i === 0) {
    b.add(cyl(R + 0.25, R + 0.25, 3.2, 48), marble, new THREE.Matrix4().makeTranslation(0, -3.2, 0)); // foundation drum (shows on the high side)
    b.add(cyl(R, R, h, 60), lam("pisaArcadeM", () => ({ map: rep(arcadeTex(), 15, 1) })));
    for (const g2 of ring(R, 0.45, 0.25)) b.add(g2, plain, new THREE.Matrix4().makeTranslation(0, h - 0.45, 0));
  } else {
    const rIn = i === 7 ? R * 0.58 : R - 1.4, rCol = i === 7 ? R * 0.66 : R - 0.3, n = i === 7 ? 12 : 30;
    b.add(cyl(rIn, rIn, h, 48), lam("pisaInnerM", () => ({ map: rep(innerTex(), n / 2, 1) })));
    b.add(new THREE.RingGeometry(0, rCol + 0.3, 48).rotateX(-Math.PI / 2).translate(0, 0.02, 0), plain); // gallery floor
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, x = Math.cos(a) * rCol, z = Math.sin(a) * rCol;
      b.add(cyl(0.2, 0.18, h - 0.9, 10), plain, new THREE.Matrix4().makeTranslation(x, 0.25, z));       // column
      b.add(new THREE.BoxGeometry(0.55, 0.3, 0.55).translate(0, 0.15, 0), plain, new THREE.Matrix4().makeRotationY(-a).setPosition(x, h - 0.65, z)); // capital
      b.add(new THREE.BoxGeometry(0.5, 0.25, 0.5).translate(0, 0.125, 0), plain, new THREE.Matrix4().makeRotationY(-a).setPosition(x, 0, z)); // base
    }
    for (const g2 of ring(rCol + 0.05, 0.42, 0.35)) b.add(g2, plain, new THREE.Matrix4().makeTranslation(0, h - 0.42, 0)); // cornice / walkway
    if (i === 7) {
      b.add(new THREE.ConeGeometry(rIn + 0.2, 1.2, 48).translate(0, h + 0.6, 0), lam("pisaRoof", () => ({ color: "#b8b1a4" })));
      b.add(cyl(0.12, 0.12, 2.4, 8), lam("pisaPole", () => ({ color: "#5a4a3a" })), new THREE.Matrix4().makeTranslation(0, h + 1.1, 0));
    }
  }
  b.build(g);
  return g;
};

/** medieval scaffold: a ring of poles with ledgers round the level being built */
const scaffold = () => {
  const g = new THREE.Group(), b = new Batch(), wood = lam("scaffoldWood", () => ({ color: "#9a6a3c" })), n = 18, r = R + 1.4, h = 7;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    b.add(cyl(0.08, 0.07, h, 6), wood, new THREE.Matrix4().makeTranslation(Math.cos(a) * r, -2, Math.sin(a) * r));
  }
  for (const y of [0.2, 2.4, 4.6]) for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
    const p0 = new THREE.Vector3(Math.cos(a0) * r, y, Math.sin(a0) * r), p1 = new THREE.Vector3(Math.cos(a1) * r, y, Math.sin(a1) * r);
    const len = p0.distanceTo(p1), mid = p0.clone().add(p1).multiplyScalar(0.5);
    b.add(new THREE.BoxGeometry(len, 0.12, 0.12), wood, new THREE.Matrix4().makeRotationY(-Math.atan2(p1.z - p0.z, p1.x - p0.x)).setPosition(mid.x, mid.y, mid.z));
    if (y > 1) b.add(new THREE.BoxGeometry(len, 0.06, 1.0), lam("scaffoldPlank", () => ({ color: "#c08a52" })), new THREE.Matrix4().makeRotationY(-Math.atan2(p1.z - p0.z, p1.x - p0.x)).setPosition(mid.x, mid.y + 0.09, mid.z));
  }
  b.build(g);
  return g;
};

export class Tower {
  root = new THREE.Group();           // at the base centre; lean = rotation about z (top moves toward +x)
  private levels: THREE.Group[] = [];
  private pivots: THREE.Group[] = []; // pivots[i] sits on top of level i-1: its own extra tilt = the banana correction
  private scaff = scaffold();
  constructor() {
    let parent: THREE.Object3D = this.root, y = 0;
    for (let i = 0; i < LEVELS; i++) {
      const pv = new THREE.Group();
      pv.position.y = y; parent.add(pv);
      const lv = level(i); pv.add(lv);
      this.pivots.push(pv); this.levels.push(lv);
      parent = pv; y = levelH(i);
    }
    this.root.add(this.scaff);
  }
  /** built = levels standing (0-8, a fraction raises the top one out of the ground... of its own height),
   *  lean = degrees toward +x, banana = degrees each level from the 4th up turns back, scaffold on the top level */
  set(built: number, lean: number, banana = 0, scaffoldOn = false) {
    const full = Math.floor(built), part = built - full;
    for (let i = 0; i < LEVELS; i++) {
      const lv = this.levels[i];
      lv.visible = i < full || (i === full && part > 0.02);
      lv.scale.y = i === full ? Math.max(0.02, part) : 1;
      this.pivots[i].rotation.z = i >= 3 ? (banana * Math.PI) / 180 : 0;
    }
    this.root.rotation.z = -(lean * Math.PI) / 180;
    // scaffold round the top standing level (in the root frame: follows the lean, ignores the small banana turns)
    this.scaff.visible = scaffoldOn && built > 0;
    let y = 0;
    for (let i = 0; i < Math.min(LEVELS, Math.ceil(built)) - 1; i++) y += levelH(i);
    this.scaff.position.y = y + 1;
  }
}
