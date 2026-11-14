// Plastic R6 avatars and part-built Roblox-style places. Original designs:
// classic yellow/blue/green Noob, and a rose-shirt Mom with a bob, not a copied cast.
import * as THREE from "three";
import type { Expr, Pose, State } from "./director";

export type Rig = {
  root: THREE.Group;
  waist: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  head: THREE.Mesh;
  faces: Record<Expr, THREE.CanvasTexture>;
  bits: THREE.Object3D[];
  homes: THREE.Vector3[];
  bursts: THREE.Vector3[];
  shadow: THREE.Mesh;
};

export type World = {
  root: THREE.Group;
  sets: Record<string, THREE.Group>;
  mats: THREE.Material[];
  noob: Rig;
  mom: Rig;
  boss: Rig;
  snack: THREE.Mesh;
  beam: THREE.Mesh;
  dust: THREE.Group;
  scraps: THREE.Group;
  fadeObby: THREE.Material[];
  fadeLiving: THREE.Material[];
  pads: THREE.Mesh[];
  portal: THREE.Group;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  lamp: THREE.PointLight;
  stud: THREE.CanvasTexture;
};

const SET_X: Record<string, number> = { kitchen: 0, obby: 240, arena: 480, dinner: 720, living: 240 };

const hex = (h: string) => new THREE.Color(h);

function studTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    g.fillStyle = "#cfcfcf";
    g.beginPath();
    g.arc(16 + x * 32, 16 + y * 32, 10, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f7f7f7";
    g.beginPath();
    g.arc(13 + x * 32, 13 + y * 32, 4.5, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function plastic(color: string, rough = 0.38) {
  return new THREE.MeshStandardMaterial({ color: hex(color), roughness: rough, metalness: 0.02 });
}

function neon(color: string) {
  return new THREE.MeshStandardMaterial({
    color: hex(color), emissive: hex(color), emissiveIntensity: 0.85, roughness: 0.25, metalness: 0,
  });
}

function merge(geos: THREE.BufferGeometry[]) {
  let vc = 0, ic = 0;
  for (const g of geos) {
    vc += g.attributes.position.count;
    ic += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(vc * 3);
  const nrm = new Float32Array(vc * 3);
  const col = new Float32Array(vc * 3);
  const idx = new Uint32Array(ic);
  let v = 0, ii = 0;
  for (const g of geos) {
    const p = g.attributes.position;
    const n = g.attributes.normal;
    const c = g.attributes.color;
    const base = v;
    for (let i = 0; i < p.count; i++) {
      pos[(v + i) * 3] = p.getX(i); pos[(v + i) * 3 + 1] = p.getY(i); pos[(v + i) * 3 + 2] = p.getZ(i);
      nrm[(v + i) * 3] = n.getX(i); nrm[(v + i) * 3 + 1] = n.getY(i); nrm[(v + i) * 3 + 2] = n.getZ(i);
      col[(v + i) * 3] = c.getX(i); col[(v + i) * 3 + 1] = c.getY(i); col[(v + i) * 3 + 2] = c.getZ(i);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[ii++] = g.index.getX(i) + base;
    else for (let i = 0; i < p.count; i++) idx[ii++] = base + i;
    v += p.count;
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

function box(list: THREE.BufferGeometry[], cx: number, cy: number, cz: number, w: number, h: number, d: number, color: string) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(cx, cy, cz);
  const col = new THREE.Color(color);
  const arr = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < g.attributes.position.count; i++) {
    arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  list.push(g);
}

function studPlane(parent: THREE.Object3D, stud: THREE.CanvasTexture, x: number, y: number, z: number, w: number, d: number, color: string) {
  const map = stud.clone();
  map.repeat.set(Math.max(1, w / 0.85), Math.max(1, d / 0.85));
  map.needsUpdate = true;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: hex(color), map, roughness: 0.5, metalness: 0 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function faceTexture(skin: string, kind: Expr) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = skin;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#1a1a1a";
  const eye = (x: number, y: number, rx: number, ry: number) => {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
  };
  if (kind === "surprise") {
    eye(88, 108, 26, 30); eye(168, 108, 26, 30);
    g.beginPath(); g.ellipse(128, 176, 16, 18, 0, 0, Math.PI * 2); g.fill();
  } else if (kind === "frown") {
    eye(88, 112, 22, 26); eye(168, 112, 22, 26);
    g.strokeStyle = "#1a1a1a"; g.lineWidth = 8; g.lineCap = "round";
    g.beginPath(); g.moveTo(70, 78); g.lineTo(108, 92); g.stroke();
    g.beginPath(); g.moveTo(186, 78); g.lineTo(148, 92); g.stroke();
    g.beginPath(); g.moveTo(96, 186); g.quadraticCurveTo(128, 168, 160, 186); g.stroke();
  } else if (kind === "focus") {
    eye(90, 112, 18, 22); eye(166, 112, 18, 22);
    g.fillRect(96, 176, 64, 10);
  } else {
    eye(88, 108, 20, 28); eye(168, 108, 20, 28);
    g.strokeStyle = "#1a1a1a"; g.lineWidth = 10; g.lineCap = "round";
    g.beginPath(); g.moveTo(86, 168); g.quadraticCurveTo(128, 210, 170, 168); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRig(skin: string, torso: string, legs: string, hair: "none" | "bob"): Rig {
  const root = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 16),
    new THREE.MeshBasicMaterial({ color: "#1a1a1a", transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  root.add(shadow);
  const waist = new THREE.Group();
  waist.position.y = 1.2;
  root.add(waist);
  const torsoM = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.2, 0.62), plastic(torso, 0.34));
  torsoM.position.y = 0.6;
  waist.add(torsoM);
  const limb = (color: string, px: number, py: number, w: number, h: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(px, py, 0);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), plastic(color, 0.4));
    mesh.position.y = -h / 2;
    pivot.add(mesh);
    waist.add(pivot);
    return pivot;
  };
  const legL = limb(legs, -0.3, 0, 0.5, 1.2);
  const legR = limb(legs, 0.3, 0, 0.5, 1.2);
  const armL = limb(skin, -0.84, 1.1, 0.46, 1.15);
  const armR = limb(skin, 0.84, 1.1, 0.46, 1.15);
  const faces: Record<Expr, THREE.CanvasTexture> = {
    smile: faceTexture(skin, "smile"),
    surprise: faceTexture(skin, "surprise"),
    frown: faceTexture(skin, "frown"),
    focus: faceTexture(skin, "focus"),
  };
  const skinMat = plastic(skin, 0.42);
  const faceMat = new THREE.MeshStandardMaterial({ map: faces.smile, roughness: 0.55, metalness: 0 });
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 1.05), [skinMat, skinMat, skinMat, skinMat, faceMat, skinMat]);
  head.position.y = 1.75;
  waist.add(head);
  const bits: THREE.Object3D[] = [torsoM, legL, legR, armL, armR, head];
  if (hair === "bob") {
    const hm = plastic("#4a2c1a", 0.5);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.38, 1.16), hm);
    top.position.y = 2.2;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.7, 0.28), hm);
    back.position.set(0, 1.85, -0.48);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.9), hm);
    sideL.position.set(-0.55, 1.85, 0.02);
    const sideR = sideL.clone();
    sideR.position.x = 0.55;
    waist.add(top, back, sideL, sideR);
    bits.push(top, back, sideL, sideR);
  }
  const homes = bits.map((b) => b.position.clone());
  const bursts = [
    new THREE.Vector3(0.05, 0.45, 0.08),
    new THREE.Vector3(-0.38, -0.05, 0.12),
    new THREE.Vector3(0.4, -0.02, 0.1),
    new THREE.Vector3(-0.48, 0.22, 0.06),
    new THREE.Vector3(0.5, 0.24, 0.05),
    new THREE.Vector3(0.02, 0.55, 0.1),
    new THREE.Vector3(0, 0.62, -0.08),
    new THREE.Vector3(0, 0.48, -0.16),
    new THREE.Vector3(-0.32, 0.4, 0.04),
    new THREE.Vector3(0.32, 0.4, 0.04),
  ];
  return { root, waist, legL, legR, armL, armR, head, faces, bits, homes, bursts, shadow };
}

function placeSet(parent: THREE.Group, x: number) {
  const g = new THREE.Group();
  g.position.x = x;
  parent.add(g);
  return g;
}

function partMesh(parent: THREE.Group, list: THREE.BufferGeometry[]) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.02 });
  const mesh = new THREE.Mesh(merge(list), mat);
  parent.add(mesh);
  return mat;
}

export function buildWorld(): World {
  const root = new THREE.Group();
  const stud = studTexture();
  const mats: THREE.Material[] = [];
  const kitchen = placeSet(root, SET_X.kitchen);
  const obby = placeSet(root, SET_X.obby);
  const arena = placeSet(root, SET_X.arena);
  const dinner = placeSet(root, SET_X.dinner);
  const living = placeSet(root, SET_X.living);

  const k: THREE.BufferGeometry[] = [];
  box(k, 0, -0.2, 0.4, 8.2, 0.4, 8.2, "#d08a45");
  box(k, 0, 1.8, -3.3, 8.2, 3.6, 0.28, "#f3d7ae");
  box(k, -4.0, 1.8, 0.4, 0.28, 3.6, 7.6, "#f0c898");
  box(k, 4.0, 1.8, 0.4, 0.28, 3.6, 7.6, "#e7b98a");
  box(k, 0.2, 2.15, -3.12, 1.8, 1.3, 0.08, "#8fd4f2");
  box(k, -2.5, 1.05, -1.6, 2.2, 1.1, 0.7, "#ece7df");
  box(k, -2.5, 2.35, -2.7, 2.3, 0.7, 0.45, "#2f6bff");
  box(k, 2.6, 1.3, -1.8, 1.1, 2.2, 0.8, "#e8eef7");
  box(k, 2.6, 2.15, -1.8, 0.9, 0.35, 0.08, "#9fd8ff");
  mats.push(partMesh(kitchen, k));
  studPlane(kitchen, stud, 0, 0.02, 0.4, 8.0, 8.0, "#e0a15a");

  const portal = new THREE.Group();
  portal.position.set(2.35, 1.35, -2.55);
  const frameMat = neon("#7dfff0");
  portal.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), frameMat));
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.1, 0.12), frameMat);
  left.position.set(-0.7, -0.2, 0);
  const right = left.clone(); right.position.x = 0.7;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.9), neon("#14343c"));
  glow.position.set(0, -0.15, -0.02);
  portal.add(left, right, glow);
  kitchen.add(portal);

  const o: THREE.BufferGeometry[] = [];
  box(o, 0, -6.2, -2, 28, 0.6, 28, "#3dba4a");
  box(o, 0.1, 0.25, 1.5, 3.2, 0.5, 3.2, "#f5c518");
  box(o, -0.2, 0.25, -1.6, 2.8, 0.5, 2.6, "#1ec8b8");
  box(o, 1.4, 0.7, -3.6, 2.4, 0.45, 2.2, "#ff8a2a");
  box(o, -1.5, -0.2, -3.4, 1.6, 0.35, 1.6, "#ff2d2d");
  box(o, 0.2, 1.15, -5.4, 2.6, 0.45, 2.4, "#3d8bff");
  box(o, 0.0, 2.8, 4.2, 3.2, 0.45, 2.4, "#f5c518");
  box(o, -2.2, 0.4, -6.2, 2.2, 0.4, 2.2, "#1ec8b8");
  box(o, 2.0, -1.2, -2.2, 1.8, 0.4, 1.8, "#ff5a7a");
  const fadeObby: THREE.Material[] = [partMesh(obby, o)];
  fadeObby.push(studPlane(obby, stud, 0.1, 0.52, 1.5, 3.1, 3.1, "#ffd84a").material);
  fadeObby.push(studPlane(obby, stud, -0.2, 0.52, -1.6, 2.7, 2.5, "#3adcc8").material);
  fadeObby.push(studPlane(obby, stud, 0.0, 3.05, 4.2, 3.1, 2.3, "#ffd84a").material);

  const a: THREE.BufferGeometry[] = [];
  box(a, 0, -0.2, 0, 8, 0.4, 8, "#c9843a");
  box(a, -3.2, 1.6, -1, 1.4, 3.4, 1.4, "#e07a32");
  box(a, 3.1, 2.1, -0.5, 1.3, 4.2, 1.3, "#d4652c");
  box(a, -2.4, 1.2, 2.4, 1.2, 2.6, 1.2, "#f0a050");
  box(a, 2.5, 0.8, 2.2, 1.5, 1.8, 1.1, "#c46a38");
  box(a, 0.2, 2.4, -3.4, 6, 1.2, 0.8, "#b85a30");
  mats.push(partMesh(arena, a));
  studPlane(arena, stud, 0, 0.02, 0, 7.8, 7.8, "#e0a15a");

  const d: THREE.BufferGeometry[] = [];
  box(d, 0, -0.2, 0.3, 8, 0.4, 7.4, "#c9843f");
  box(d, 0, 1.7, -3.0, 8, 3.4, 0.25, "#f6d7b0");
  box(d, -3.9, 1.7, 0.3, 0.25, 3.4, 6.6, "#f0c898");
  box(d, 3.9, 1.7, 0.3, 0.25, 3.4, 6.6, "#e8bc90");
  box(d, 0.1, 0.72, 0.15, 2.2, 0.12, 1.15, "#a86b32");
  box(d, -0.7, 0.38, 0.15, 0.12, 0.7, 0.12, "#8a5528");
  box(d, 0.9, 0.38, 0.15, 0.12, 0.7, 0.12, "#8a5528");
  box(d, -1.3, 0.48, -0.55, 0.5, 0.1, 0.5, "#8a5528");
  box(d, 1.3, 0.48, 1.0, 0.5, 0.1, 0.5, "#8a5528");
  box(d, 0.15, 0.86, 0.05, 0.7, 0.06, 0.55, "#f4f0e8");
  box(d, 0.15, 0.95, 0.05, 0.4, 0.12, 0.35, "#e24b4b");
  mats.push(partMesh(dinner, d));
  studPlane(dinner, stud, 0, 0.02, 0.3, 7.6, 7.0, "#e0a15a");

  const l: THREE.BufferGeometry[] = [];
  box(l, 0.2, -0.18, 0.4, 8.4, 0.36, 8, "#d39a55");
  box(l, 0.2, 1.7, -3.2, 8.4, 3.5, 0.28, "#f0c4a0");
  box(l, -3.9, 1.7, 0.4, 0.28, 3.5, 7.2, "#e7b890");
  box(l, 4.0, 1.7, 0.4, 0.28, 3.5, 7.2, "#f3d0b4");
  box(l, 0.2, 3.35, 0.4, 8.4, 0.2, 8, "#f7e0c4");
  box(l, -1.6, 0.48, -0.4, 2.2, 0.4, 0.8, "#3d6fe0");
  box(l, -1.6, 0.78, -0.15, 2.1, 0.35, 0.35, "#2a4ea8");
  box(l, -2.4, 0.7, -0.7, 0.35, 0.7, 0.35, "#c9a06a");
  box(l, 2.2, 1.15, -2.6, 1.6, 0.9, 0.12, "#243044");
  box(l, 0.4, 1.6, -3.0, 1.5, 1.15, 0.08, "#8fd0ea");
  box(l, 0.2, 0.04, 0.7, 2.4, 0.06, 1.6, "#e36b7a");
  const fadeLiving: THREE.Material[] = [partMesh(living, l)];
  fadeLiving.push(studPlane(living, stud, 0.2, 0.02, 0.4, 8.2, 7.6, "#e0a864").material);

  const scraps = new THREE.Group();
  for (const p of [[-1.8, 1.4, -1.6, "#f5c518"], [1.8, 1.8, -1.2, "#1ec8b8"], [0.2, 2.5, -2.2, "#ff8a2a"]] as const) {
    scraps.add(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), plastic(p[3])));
    scraps.children[scraps.children.length - 1].position.set(p[0], p[1], p[2]);
  }
  living.add(scraps);

  const pads: THREE.Mesh[] = [];
  const addPad = (parent: THREE.Group, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 20), neon("#8ffff0"));
    m.position.set(x, y, z);
    parent.add(m);
    pads.push(m);
    return m;
  };
  addPad(kitchen, 0.45, 0.06, 1.2);
  addPad(dinner, 0.15, 0.06, 1.2);
  addPad(living, 0.15, 0.06, 0.75);

  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.32, 10), neon("#ffd27a"));
  lampShade.position.set(-2.4, 1.35, -0.7);
  living.add(lampShade);

  const noob = makeRig("#f5c518", "#1a4fd6", "#2e9e3a", "none");
  const mom = makeRig("#f3c48a", "#e25b8a", "#2c3358", "bob");
  const boss = makeRig("#9a9a9a", "#c0392b", "#3a3a3a", "none");
  root.add(noob.root, mom.root, boss.root);

  const snack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.28), plastic("#f5c518", 0.3));
  root.add(snack);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 1, 12), neon("#ffe39a"));
  root.add(beam);
  const dust = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), plastic("#e7d3a4"));
    m.position.set((i - 2) * 0.28, 0.1, (i % 2) * 0.2);
    dust.add(m);
  }
  root.add(dust);

  const hemi = new THREE.HemisphereLight("#cfefff", "#c9843f", 0.85);
  const sun = new THREE.DirectionalLight("#fff4dd", 1.25);
  sun.position.set(7, 14, 8);
  const lamp = new THREE.PointLight("#ffd29a", 0, 8);
  root.add(hemi, sun, lamp);

  return {
    root, sets: { kitchen, obby, arena, dinner, living }, mats, noob, mom, boss,
    snack, beam, dust, scraps, fadeObby, fadeLiving, pads, portal, hemi, sun, lamp, stud,
  };
}

function applyRig(rig: Rig, pose: Pose, origin: number, frame: number) {
  rig.root.visible = pose.show;
  if (!pose.show) return;
  const bob = Math.sin(frame * 0.18 + origin) * 0.015;
  rig.root.position.set(pose.x + origin, pose.y + bob, pose.z);
  rig.root.rotation.set(0, pose.yaw, 0);
  rig.root.scale.setScalar(pose.scale * 0.86);
  rig.waist.rotation.x = pose.recline;
  rig.waist.scale.y = pose.squash;
  const swing = Math.sin(pose.phase) * pose.walk;
  rig.legL.rotation.x = swing * 0.7;
  rig.legR.rotation.x = -swing * 0.7;
  rig.armL.rotation.x = -swing * 0.55 + pose.armL + pose.jump * -1.1 + pose.fall * -0.8;
  rig.armR.rotation.x = swing * 0.55 + pose.armR + pose.jump * -1.1 + pose.fall * -0.8;
  rig.armL.rotation.z = pose.fall * 0.7 + pose.jump * 0.15;
  rig.armR.rotation.z = pose.armRz + pose.fall * -0.7 + pose.jump * -0.15;
  rig.legL.rotation.x += pose.jump * 0.8;
  rig.legR.rotation.x += pose.jump * -0.2;
  const head = rig.head;
  head.rotation.x = pose.headPitch;
  const face = head.material as THREE.MeshStandardMaterial[];
  face[4].map = rig.faces[pose.expr];
  const s = pose.shatter;
  rig.bits.forEach((bit, i) => {
    const home = rig.homes[i];
    const burst = rig.bursts[i] ?? rig.bursts[0];
    bit.position.copy(home).addScaledVector(burst, s);
    if (bit !== head) bit.rotation.y = s * (i % 2 ? 0.8 : -0.6);
  });
  rig.shadow.position.y = pose.floor - pose.y + 0.03;
  rig.shadow.visible = pose.y < pose.floor + 0.2 && s < 0.2;
}

function aimBeam(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  const d = b.clone().sub(a);
  const len = Math.max(0.2, d.length());
  mesh.scale.set(1, len, 1);
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.multiplyScalar(1 / len));
}

const LOOK: Record<string, { sky: string; sun: string; hemi: number; sunI: number; lamp: number }> = {
  kitchen: { sky: "#7ec8ea", sun: "#fff6e4", hemi: 0.8, sunI: 1.15, lamp: 0.4 },
  obby: { sky: "#3ec0f5", sun: "#fff8ee", hemi: 0.9, sunI: 1.3, lamp: 0 },
  arena: { sky: "#f0a05a", sun: "#ffe0b8", hemi: 0.7, sunI: 1.35, lamp: 0 },
  dinner: { sky: "#f2c48a", sun: "#ffe6c4", hemi: 0.65, sunI: 0.9, lamp: 1.4 },
  living: { sky: "#f0b87a", sun: "#ffe0c0", hemi: 0.6, sunI: 0.85, lamp: 1.8 },
};

export function apply(world: World, state: State, camera: THREE.PerspectiveCamera, scene: THREE.Scene, frame: number) {
  const place = state.place;
  const fading = state.mix > 0.01 && state.mix < 0.99 && place === "obby";
  const origin = SET_X[place];
  for (const [name, group] of Object.entries(world.sets)) {
    group.visible = name === place || (fading && (name === "obby" || name === "living"));
    group.position.x = name === "living" && (fading || place === "living") ? SET_X.obby : SET_X[name];
  }
  const setOpacity = (list: THREE.Material[], opacity: number) => {
    for (const m of list) {
      m.transparent = opacity < 0.99;
      m.opacity = opacity;
    }
  };
  setOpacity(world.fadeObby, fading ? 1 - state.mix : 1);
  setOpacity(world.fadeLiving, place === "living" ? 1 : fading ? state.mix : 1);

  applyRig(world.noob, state.noob, origin, frame);
  applyRig(world.mom, state.mom, origin, frame);
  applyRig(world.boss, state.boss, origin, frame);

  world.snack.visible = state.snack > 0 && state.mom.show;
  if (world.snack.visible) {
    const u = Math.min(1, Math.max(0, (frame / 30 - 7.15) / 0.7));
    const ax = origin + state.mom.x + 0.7;
    const bx = origin + state.noob.x;
    world.snack.position.set(
      ax + (bx - ax) * u,
      1.5 + state.mom.y * 0 + (1.7 - 1.5) * u,
      state.mom.z + (state.noob.z - state.mom.z) * u + origin * 0 + state.mom.z,
    );
    world.snack.position.z = state.mom.z + (state.noob.z - state.mom.z) * u;
    world.snack.position.x = origin + (state.mom.x + 0.55) * (1 - u) + state.noob.x * u;
    world.snack.position.y = 1.55 - u * 0.15;
  }

  world.beam.visible = state.beam > 0.05 && state.mom.show && state.noob.show;
  if (world.beam.visible) {
    aimBeam(
      world.beam,
      new THREE.Vector3(origin + state.mom.x, state.mom.y + 1.6, state.mom.z),
      new THREE.Vector3(origin + state.noob.x, state.noob.y + 1.3, state.noob.z),
    );
    (world.beam.material as THREE.MeshStandardMaterial).opacity = state.beam;
    (world.beam.material as THREE.MeshStandardMaterial).transparent = true;
  }

  world.dust.visible = state.dust > 0.02;
  world.dust.position.set(origin + state.noob.x, 0.08, state.noob.z);
  world.dust.scale.setScalar(0.4 + state.dust * 1.4);

  world.scraps.visible = state.scraps > 0.02 && (place === "living" || fading);
  world.scraps.scale.setScalar(Math.max(0.001, state.scraps));
  world.portal.visible = place === "kitchen";
  world.portal.scale.setScalar(state.portal > 0 ? 1.08 : 1);

  const look = LOOK[place === "obby" && state.mix > 0.65 ? "living" : place];
  world.hemi.intensity = look.hemi;
  world.hemi.color.set(look.sky);
  world.sun.color.set(look.sun);
  world.sun.intensity = look.sunI;
  world.lamp.intensity = look.lamp;
  world.lamp.position.set(origin - 1.5, 2.2, 0.2);
  scene.background = new THREE.Color(look.sky);
  scene.fog = new THREE.Fog(look.sky, 28, 70);

  for (const pad of world.pads) {
    pad.visible = state.pad > 0.05;
    const mat = pad.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.4 + state.pad * 0.9;
  }

  camera.position.set(state.cam.x + origin, state.cam.y, state.cam.z);
  camera.lookAt(state.cam.lx + origin, state.cam.ly + 0.45, state.cam.lz);
  camera.fov = state.cam.fov;
  camera.updateProjectionMatrix();
}
