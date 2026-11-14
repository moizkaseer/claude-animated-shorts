// Same toon block characters, outlines, and lighting as the Mom-joins-Roblox short.
// Sets are fewer merged parts so the software-GL render stays lighter.
import * as THREE from "three";
import type { Expr, Place, Pose, State } from "./director";

export type Rig = {
  root: THREE.Group;
  pivot: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  eyeL: THREE.Object3D;
  eyeR: THREE.Object3D;
  mouth: THREE.Mesh;
  browL: THREE.Mesh;
  browR: THREE.Mesh;
  shadow: THREE.Mesh;
  seed: number;
  built: number;
  homes: THREE.Vector3[];
  bits: THREE.Object3D[];
};

export type World = {
  root: THREE.Group;
  sets: Record<Place, THREE.Group>;
  noob: Rig;
  mom: Rig;
  boss: Rig;
  sky: THREE.Mesh;
  skyMat: THREE.ShaderMaterial;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  lamp: THREE.PointLight;
  fog: THREE.Fog;
  bg: THREE.Color;
  pads: THREE.Mesh[];
  portal: THREE.Group;
  snack: THREE.Mesh;
  beam: THREE.Mesh;
  dust: THREE.Group;
  scraps: THREE.Group;
  fadeObby: THREE.Material[];
  fadeLiving: THREE.Material[];
};

const WAIST = 0.98;
export const SET_X: Record<Place, number> = {
  kitchen: 0, obby: 80, arena: 160, dinner: 240, living: 320,
};

function gradient(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 1;
  const g = c.getContext("2d")!;
  ["#7f7874", "#c9c1b8", "#ffffff", "#ffffff"].forEach((hex, i) => {
    g.fillStyle = hex;
    g.fillRect(i, 0, 1, 1);
  });
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.LinearSRGBColorSpace;
  return t;
}

function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let offset = 0;
  let vcount = 0;
  for (const g of geos) vcount += g.attributes.position.count;
  const pos = new Float32Array(vcount * 3);
  const nor = new Float32Array(vcount * 3);
  const col = new Float32Array(vcount * 3);
  const idx: number[] = [];
  for (const g of geos) {
    const p = g.attributes.position as THREE.BufferAttribute;
    const n = g.attributes.normal as THREE.BufferAttribute;
    const c = g.attributes.color as THREE.BufferAttribute;
    pos.set(p.array as Float32Array, offset * 3);
    nor.set(n.array as Float32Array, offset * 3);
    col.set(c.array as Float32Array, offset * 3);
    const src = g.getIndex();
    if (src) for (let i = 0; i < src.count; i++) idx.push(src.getX(i) + offset);
    else for (let i = 0; i < p.count; i++) idx.push(i + offset);
    offset += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  out.setIndex(idx);
  return out;
}

export function buildWorld(): World {
  const grad = gradient();
  const toon = new Map<string, THREE.MeshToonMaterial>();
  const mat = (hex: string) => {
    let m = toon.get(hex);
    if (!m) {
      m = new THREE.MeshToonMaterial({ color: hex, gradientMap: grad });
      toon.set(hex, m);
    }
    return m;
  };
  const basic = (hex: string) => new THREE.MeshBasicMaterial({ color: hex });
  const outline = new THREE.MeshBasicMaterial({ color: "#1a1a1e", side: THREE.BackSide });

  const part = (parent: THREE.Object3D, w: number, h: number, d: number, color: string, x: number, y: number, z: number, outlined = true) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const geo = new THREE.BoxGeometry(w, h, d);
    g.add(new THREE.Mesh(geo, mat(color)));
    if (outlined) {
      const o = new THREE.Mesh(geo, outline);
      o.scale.setScalar(1.055);
      g.add(o);
    }
    parent.add(g);
    return g;
  };

  const merged = (parent: THREE.Object3D, parts: number[][], colorList: string[]) => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const geos: THREE.BufferGeometry[] = [];
    parts.forEach((p, i) => {
      const g = box.clone();
      const m4 = new THREE.Matrix4().compose(
        new THREE.Vector3(p[0], p[1], p[2]),
        new THREE.Quaternion(),
        new THREE.Vector3(p[3], p[4], p[5]),
      );
      g.applyMatrix4(m4);
      const col = new THREE.Color(colorList[i]);
      const colors = new Float32Array(g.attributes.position.count * 3);
      for (let k = 0; k < g.attributes.position.count; k++) {
        colors[k * 3] = col.r; colors[k * 3 + 1] = col.g; colors[k * 3 + 2] = col.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geos.push(g);
    });
    const mesh = new THREE.Mesh(mergeGeos(geos), new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad }));
    parent.add(mesh);
    return mesh;
  };

  const makeRig = (opts: {
    skin: string; shirt: string; pants: string; shoe: string;
    hair: "none" | "bun" | "short"; hairColor?: string; glasses?: boolean; buttons?: boolean;
    scale?: number; seed: number;
  }): Rig => {
    const rootG = new THREE.Group();
    rootG.scale.setScalar(opts.scale ?? 1);
    const pivot = new THREE.Group();
    pivot.position.y = WAIST;
    rootG.add(pivot);
    const body = new THREE.Group();
    body.position.y = -WAIST;
    pivot.add(body);
    const legH = 0.58, torsoH = 0.7, headS = 0.7, armH = 0.6;
    const hip = (side: number) => {
      const piv = new THREE.Group();
      piv.position.set(side * 0.22, legH, 0);
      body.add(piv);
      part(piv, 0.28, legH, 0.3, opts.pants, 0, -legH / 2 + 0.02, 0);
      part(piv, 0.3, 0.14, 0.34, opts.shoe, 0, -legH + 0.07, 0.03);
      return piv;
    };
    const legL = hip(-1);
    const legR = hip(1);
    part(body, 0.86, torsoH, 0.5, opts.shirt, 0, legH + torsoH / 2, 0);
    if (opts.buttons) {
      part(body, 0.1, 0.1, 0.06, "#fff6ea", 0, legH + 0.42, 0.27, false);
      part(body, 0.1, 0.1, 0.06, "#fff6ea", 0, legH + 0.24, 0.27, false);
    }
    const arm = (side: number) => {
      const piv = new THREE.Group();
      piv.position.set(side * 0.58, legH + torsoH * 0.82, 0);
      body.add(piv);
      part(piv, 0.24, armH, 0.24, opts.shirt, 0, -armH / 2 + 0.04, 0);
      part(piv, 0.28, 0.26, 0.28, opts.skin, 0, -armH + 0.02, 0.02);
      return piv;
    };
    const armL = arm(-1);
    const armR = arm(1);
    const head = new THREE.Group();
    head.position.set(0, legH + torsoH + headS / 2, 0);
    body.add(head);
    part(head, headS, headS, headS, opts.skin, 0, 0, 0);
    if (opts.hair === "bun") {
      part(head, 0.38, 0.32, 0.38, opts.hairColor || "#5c3318", 0, 0.42, -0.02);
      part(head, 0.16, 0.48, 0.62, opts.hairColor || "#5c3318", -0.34, -0.02, 0);
      part(head, 0.16, 0.48, 0.62, opts.hairColor || "#5c3318", 0.34, -0.02, 0);
    } else if (opts.hair === "short") {
      part(head, 0.74, 0.28, 0.72, opts.hairColor || "#2b241f", 0, 0.26, -0.02);
    }
    const eye = (x: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0.05, headS / 2 + 0.02);
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.05), basic("#fffdf8")));
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.04), basic("#1a1a1e"));
      pupil.position.z = 0.03;
      g.add(pupil);
      head.add(g);
      return g;
    };
    const eyeL = eye(-0.16);
    const eyeR = eye(0.16);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.04), basic("#1a1a1e"));
    mouth.position.set(0, -0.16, headS / 2 + 0.03);
    head.add(mouth);
    const brow = (x: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 0.04), basic("#1a1a1e"));
      m.position.set(x, 0.22, headS / 2 + 0.03);
      head.add(m);
      return m;
    };
    if (opts.glasses) {
      const gmat = basic("#2a2428");
      const ring = (x: number) => {
        const m = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 6, 14), gmat);
        m.position.set(x, 0.05, headS / 2 + 0.06);
        head.add(m);
      };
      ring(-0.16); ring(0.16);
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.03), gmat);
      bridge.position.set(0, 0.05, headS / 2 + 0.06);
      head.add(bridge);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.46, 16), new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, opacity: 0.28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    root.add(rootG, shadow);
    const bits = [head, armL, armR, legL, legR];
    return {
      root: rootG, pivot, body, head, armL, armR, legL, legR,
      eyeL, eyeR, mouth, browL: brow(-0.16), browR: brow(0.16),
      shadow, seed: opts.seed, built: opts.scale ?? 1,
      homes: bits.map((b) => b.position.clone()),
      bits,
    };
  };

  const root = new THREE.Group();
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color("#2f9ed0") }, bot: { value: new THREE.Color("#8ad4ea") } },
    vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top, bot; varying float h; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(-0.02, 0.55, h)), 1.0); }",
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 20, 12), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -2;
  root.add(sky);
  const hemi = new THREE.HemisphereLight("#9ee7f6", "#e7b48a", 0.62);
  const sun = new THREE.DirectionalLight("#fff3d8", 0.85);
  sun.position.set(7, 14, 6);
  const fill = new THREE.DirectionalLight("#ffd0b0", 0.22);
  fill.position.set(-6, 5, -3);
  const lamp = new THREE.PointLight("#ffc27a", 0, 9, 1.4);
  root.add(hemi, sun, fill, lamp);
  const fog = new THREE.Fog("#8ad4ea", 14, 48);
  const bg = new THREE.Color("#8ad4ea");

  const kitchen = new THREE.Group();
  const obby = new THREE.Group();
  const arena = new THREE.Group();
  const dinner = new THREE.Group();
  const living = new THREE.Group();
  kitchen.position.x = SET_X.kitchen;
  obby.position.x = SET_X.obby;
  arena.position.x = SET_X.arena;
  dinner.position.x = SET_X.dinner;
  living.position.x = SET_X.living;
  root.add(kitchen, obby, arena, dinner, living);

  const kMesh = merged(kitchen, [
    [0, -0.16, 0.2, 6.2, 0.32, 6.4],
    [0, 1.45, -2.9, 6.2, 2.9, 0.22],
    [-3.05, 1.45, 0.2, 0.22, 2.9, 6.2],
    [3.05, 1.45, 0.2, 0.22, 2.9, 6.2],
    [0, 2.95, 0.2, 6.2, 0.16, 6.2],
    [-1.6, 1.7, -2.75, 1.4, 1.05, 0.08],
    [-2.2, 0.85, -1.3, 1.5, 0.9, 0.7],
    [2.15, 1.05, -1.5, 0.9, 1.9, 0.7],
    [-2.2, 1.55, -2.2, 1.6, 0.7, 0.45],
  ], ["#e0a15a", "#f3d2b4", "#e7b48a", "#e7b48a", "#f7e2c4", "#8fd0ea", "#f4efe6", "#e8eef2", "#2f6bff"]);
  const padK = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.1, 16), mat("#7ef0f2"));
  padK.position.set(0.35, 0.06, 0.7);
  kitchen.add(padK);
  const portal = new THREE.Group();
  portal.position.set(1.7, 0, -1.55);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    part(portal, 0.14, 0.14, 0.14, i % 2 ? "#3de6ff" : "#bff7ff", Math.sin(a) * 0.62, 1.05 + Math.cos(a) * 0.78, 0, false);
  }
  kitchen.add(portal);

  const oMesh = merged(obby, [
    [-0.05, -0.28, 0.15, 3.1, 0.56, 2.5],
    [-0.05, -0.02, 0.15, 2.95, 0.1, 2.35],
    [0.05, -0.28, -3.6, 2.9, 0.56, 2.2],
    [0.05, -0.02, -3.6, 2.75, 0.1, 2.05],
    [0, -1.35, -1.7, 3.6, 0.2, 2.8],
    [-1.15, -0.55, -2.4, 1.1, 0.28, 1.0],
    [0, 1.05, -1.55, 2.3, 0.36, 1.55],
    [-2.3, 0.55, 0.9, 0.22, 1.0, 0.22],
    [-2.3, 1.35, 0.9, 0.9, 0.6, 0.9],
    [2.2, 0.4, -4.4, 0.22, 0.9, 0.22],
    [2.2, 1.15, -4.4, 0.95, 0.6, 0.95],
    [0, -2.2, -1.5, 10, 0.2, 10],
  ], ["#e39a3c", "#f2c27a", "#f08a3a", "#ffb15a", "#178ea3", "#e23b3b", "#f0c14a", "#8a5528", "#2f9a45", "#8a5528", "#248a3e", "#3cb85c"]);

  const aMesh = merged(arena, [
    [0, -0.18, 0.1, 6.4, 0.36, 6.2],
    [-2.6, 1.3, -1.2, 1.1, 2.6, 1.1],
    [2.5, 1.6, -0.6, 1.0, 3.2, 1.0],
    [-1.8, 0.9, 2.0, 0.9, 1.8, 0.9],
    [2.0, 0.7, 1.8, 1.1, 1.5, 1.0],
    [0, 2.1, -2.8, 5.2, 0.9, 0.6],
  ], ["#e08a45", "#ef7d55", "#d4652c", "#f0a04a", "#c46a38", "#b85a30"]);

  const dMesh = merged(dinner, [
    [0, -0.16, 0.2, 6.2, 0.32, 6.2],
    [0, 1.45, -2.85, 6.2, 2.9, 0.22],
    [-3.05, 1.45, 0.2, 0.22, 2.9, 6.0],
    [3.05, 1.45, 0.2, 0.22, 2.9, 6.0],
    [0, 2.95, 0.2, 6.2, 0.16, 6.0],
    [0, 0.42, -0.15, 1.7, 0.12, 0.9],
    [-0.7, 0.2, -0.45, 0.1, 0.4, 0.1],
    [0.7, 0.2, -0.45, 0.1, 0.4, 0.1],
    [0, 0.55, -0.15, 0.55, 0.06, 0.55],
    [0, 0.62, -0.15, 0.28, 0.08, 0.28],
  ], ["#d39a52", "#f6d7b0", "#f0c898", "#e8bc90", "#f7e2c4", "#c68642", "#a86b32", "#a86b32", "#fff8ee", "#e23b3b"]);
  const padD = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.08, 14), mat("#7ef0f2"));
  padD.position.set(0.15, 0.04, 0.85);
  dinner.add(padD);

  const lMesh = merged(living, [
    [0, -0.16, 0.2, 6.4, 0.32, 6.4],
    [0, 1.5, -2.9, 6.4, 3.0, 0.22],
    [-3.15, 1.5, 0.2, 0.22, 3.0, 6.2],
    [3.15, 1.5, 0.2, 0.22, 3.0, 6.2],
    [0, 3.05, 0.2, 6.4, 0.16, 6.2],
    [-1.3, 0.38, 0.3, 1.6, 0.4, 0.7],
    [-1.3, 0.55, 0.0, 1.5, 0.28, 0.28],
    [1.6, 0.7, -1.6, 1.3, 0.9, 0.12],
    [0.2, 0.02, 0.55, 2.2, 0.04, 1.4],
    [-1.8, 1.55, -1.4, 1.2, 0.9, 0.08],
  ], ["#d39a55", "#f3d0b0", "#f0c4a4", "#efc09a", "#f7e0c4", "#3d6fe0", "#2f5ec4", "#243044", "#e36b7a", "#8fd0ea"]);
  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.28, 10), basic("#ffd27a"));
  lampShade.position.set(-2.15, 1.15, -0.6);
  living.add(lampShade);
  const padL = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.08, 16), mat("#7ef0f2"));
  padL.position.set(0.15, 0.05, 0.55);
  living.add(padL);
  const scraps = new THREE.Group();
  part(scraps, 0.35, 0.35, 0.35, "#f0c14a", -1.4, 0.3, -0.8, false);
  part(scraps, 0.28, 0.28, 0.28, "#178ea3", 1.5, 0.45, 1.1, false);
  part(scraps, 0.32, 0.22, 0.32, "#ef7d55", 0.2, 0.7, -1.6, false);
  living.add(scraps);

  const snack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.12), mat("#e23b3b"));
  root.add(snack);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 1, 8), basic("#ffe39a"));
  beam.visible = false;
  root.add(beam);
  const dust = new THREE.Group();
  for (let i = 0; i < 4; i++) part(dust, 0.12, 0.08, 0.12, "#f3e2b0", (i - 1.5) * 0.18, 0.06, (i % 2) * 0.12, false);
  root.add(dust);

  const noob = makeRig({ skin: "#ffd84a", shirt: "#2f6bff", pants: "#3cbf56", shoe: "#f4f6fb", hair: "none", seed: 1, scale: 1 });
  const mom = makeRig({ skin: "#f3c39a", shirt: "#ef6d4a", pants: "#31457a", shoe: "#3a2a28", hair: "bun", hairColor: "#6b3a2a", glasses: true, buttons: true, seed: 2, scale: 1.06 });
  const boss = makeRig({ skin: "#b9b4ae", shirt: "#d64545", pants: "#3a3532", shoe: "#2a2422", hair: "short", hairColor: "#4a403c", seed: 7, scale: 1.28 });

  const fadeObby = [oMesh.material as THREE.Material];
  const fadeLiving = [lMesh.material as THREE.Material];
  void kMesh; void aMesh; void dMesh;

  return {
    root, sets: { kitchen, obby, arena, dinner, living }, noob, mom, boss,
    sky, skyMat, hemi, sun, lamp, fog, bg,
    pads: [padK, padD, padL], portal, snack, beam, dust, scraps, fadeObby, fadeLiving,
  };
}

const LOOK: Record<Place, { sky: [string, string]; fog: string; hemi: [string, string, number]; sun: number; lamp: number }> = {
  kitchen: { sky: ["#f2c7a0", "#f7e2c4"], fog: "#f2c7a0", hemi: ["#ffe0c2", "#e7b48a", 0.7], sun: 0.4, lamp: 0.7 },
  obby: { sky: ["#2f9ed0", "#8ad4ea"], fog: "#8ad4ea", hemi: ["#9ee7f6", "#e7b48a", 0.58], sun: 0.9, lamp: 0 },
  arena: { sky: ["#f0a05a", "#ffd19a"], fog: "#ffd19a", hemi: ["#ffe0b0", "#e7a56a", 0.55], sun: 0.85, lamp: 0 },
  dinner: { sky: ["#f3d0b0", "#f7e0c4"], fog: "#f3d0b0", hemi: ["#ffe0c2", "#e7b48a", 0.64], sun: 0.32, lamp: 1.05 },
  living: { sky: ["#f3d0b0", "#f7e0c4"], fog: "#f3d0b0", hemi: ["#ffe0c2", "#e7b48a", 0.6], sun: 0.28, lamp: 1.2 },
};

function autoBlink(frame: number, seed: number) {
  const period = 80 + (seed % 19);
  const k = (frame + seed * 11) % period;
  if (k < 2) return 0.5;
  if (k < 4) return 1;
  if (k < 5) return 0.35;
  return 0;
}

function face(rig: Rig, expr: Expr, frame: number) {
  const blink = autoBlink(frame, rig.seed);
  let eyeY = 1, mouthX = 0.9, mouthY = 0.7, mouthDY = 0, brow = 0, browRot = 0;
  if (expr === "smile") { eyeY = 0.85; mouthX = 1.25; mouthY = 0.7; brow = 0.03; }
  else if (expr === "surprise") { eyeY = 1.25; mouthX = 0.7; mouthY = 1.55; brow = 0.08; browRot = 0.25; }
  else if (expr === "frown") { eyeY = 0.8; mouthX = 0.85; mouthY = 0.5; mouthDY = -0.04; brow = -0.02; browRot = -0.35; }
  else if (expr === "focus") { eyeY = 0.75; mouthX = 0.7; mouthY = 0.45; brow = -0.03; browRot = -0.15; }
  const shut = 1 - 0.92 * blink;
  rig.eyeL.scale.set(1, Math.max(0.08, eyeY * shut), 1);
  rig.eyeR.scale.set(1, Math.max(0.08, eyeY * shut), 1);
  rig.mouth.scale.set(mouthX, Math.max(0.35, mouthY), 1);
  rig.mouth.position.y = -0.16 + mouthDY;
  rig.browL.position.y = 0.22 + brow;
  rig.browR.position.y = 0.22 + brow;
  rig.browL.rotation.z = browRot;
  rig.browR.rotation.z = -browRot;
}

function poseRig(rig: Rig, pose: Pose, frame: number, ox: number) {
  rig.root.visible = pose.show;
  rig.shadow.visible = pose.show && pose.shatter < 0.25;
  if (!pose.show) return;
  rig.root.scale.setScalar(rig.built * pose.scale);
  rig.root.position.set(pose.x + ox, pose.y, pose.z);
  rig.root.rotation.set(0, pose.yaw, 0);
  rig.pivot.rotation.x = pose.recline;
  rig.body.scale.y = pose.squash;
  rig.head.rotation.set(pose.headPitch, 0, 0);
  const s = Math.sin(pose.phase);
  const swing = pose.walk;
  const tuck = pose.jump > 0.05 ? Math.sin(Math.PI * THREE.MathUtils.clamp(pose.jump, 0, 1)) : 0;
  rig.legL.rotation.x = s * 0.8 * swing - 0.9 * tuck;
  rig.legR.rotation.x = -s * 0.8 * swing - 0.75 * tuck;
  const fall = pose.fall;
  rig.armL.rotation.x = -s * 0.55 * swing + pose.armL - 1.1 * tuck - 0.7 * fall;
  rig.armR.rotation.x = s * 0.55 * swing + pose.armR - 1.05 * tuck - 0.7 * fall;
  rig.armL.rotation.z = 0.18 + pose.fall * 0.45;
  rig.armR.rotation.z = -0.18 + pose.armRz - pose.fall * 0.45;
  face(rig, pose.expr, frame);
  const burst = [
    [0, 0.28, 0.04], [-0.22, 0.08, 0.02], [0.24, 0.1, 0.02], [-0.12, -0.06, 0.03], [0.14, -0.04, 0.03],
  ];
  rig.bits.forEach((bit, i) => {
    const h = rig.homes[i];
    bit.position.set(h.x + burst[i][0] * pose.shatter, h.y + burst[i][1] * pose.shatter, h.z + burst[i][2] * pose.shatter);
  });
  rig.shadow.position.set(pose.x + ox, pose.floor + 0.02, pose.z);
  const lift = Math.max(0, pose.y - pose.floor);
  const sc = 1 + lift * 0.15;
  rig.shadow.scale.set(sc, sc, sc);
  (rig.shadow.material as THREE.MeshBasicMaterial).opacity = 0.28 / (1 + lift * 0.5);
}

function aimBeam(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  const d = b.clone().sub(a);
  const len = Math.max(0.2, d.length());
  mesh.scale.set(1, len, 1);
  mesh.position.copy(a).addScaledVector(d, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.multiplyScalar(1 / len));
}

export function apply(world: World, state: State, camera: THREE.PerspectiveCamera, scene: THREE.Scene, frame: number) {
  const place = state.place;
  const fading = state.mix > 0.01 && state.mix < 0.99 && place === "obby";
  const origin = SET_X[place];
  for (const [name, group] of Object.entries(world.sets) as [Place, THREE.Group][]) {
    group.visible = name === place || (fading && (name === "obby" || name === "living"));
    group.position.x = name === "living" && (fading || place === "living") && fading ? SET_X.obby : SET_X[name];
  }
  if (place === "living") world.sets.living.position.x = SET_X.living;
  const setOp = (list: THREE.Material[], opacity: number) => {
    for (const m of list) {
      m.transparent = opacity < 0.99;
      m.opacity = opacity;
      m.depthWrite = opacity > 0.9;
    }
  };
  setOp(world.fadeObby, fading ? 1 - state.mix : 1);
  setOp(world.fadeLiving, place === "living" ? 1 : fading ? state.mix : 1);

  const look = fading && state.mix > 0.55 ? LOOK.living : LOOK[place];
  (world.skyMat.uniforms.top.value as THREE.Color).set(look.sky[0]);
  (world.skyMat.uniforms.bot.value as THREE.Color).set(look.sky[1]);
  world.sky.visible = place === "obby" || place === "arena";
  world.fog.color.set(look.fog);
  world.fog.near = place === "obby" || place === "arena" ? 16 : 9;
  world.fog.far = 46;
  scene.fog = world.fog;
  world.bg.set(look.fog);
  scene.background = world.bg;
  world.hemi.color.set(look.hemi[0]);
  world.hemi.groundColor.set(look.hemi[1]);
  world.hemi.intensity = look.hemi[2];
  world.sun.intensity = look.sun;
  world.lamp.intensity = look.lamp;
  world.lamp.position.set(origin - 1.6, 1.6, -0.2);

  camera.position.set(state.cam.x + origin, state.cam.y, state.cam.z);
  camera.up.set(0, 1, 0);
  camera.lookAt(state.cam.lx + origin, state.cam.ly, state.cam.lz);
  camera.fov = state.cam.fov;
  camera.updateProjectionMatrix();
  world.sky.position.copy(camera.position);

  poseRig(world.noob, state.noob, frame, origin);
  poseRig(world.mom, state.mom, frame, origin);
  poseRig(world.boss, state.boss, frame, origin);

  world.pads.forEach((p, i) => {
    const home = i === 0 ? "kitchen" : i === 1 ? "dinner" : "living";
    p.visible = state.pad > 0.05 && (world.sets[home].visible);
  });
  world.portal.scale.setScalar(0.92 + state.portal * 0.14);
  world.portal.visible = place === "kitchen" || fading;

  const u = THREE.MathUtils.clamp((frame / 30 - 7.15) / 0.7, 0, 1);
  world.snack.visible = state.snack > 0.5 && place === "kitchen";
  world.snack.position.set(
    origin + THREE.MathUtils.lerp(state.mom.x + 0.45, state.noob.x, u),
    1.15 - u * 0.15,
    THREE.MathUtils.lerp(state.mom.z + 0.15, state.noob.z + 0.2, u),
  );

  world.beam.visible = state.beam > 0.05;
  if (world.beam.visible) {
    const a = new THREE.Vector3(origin + state.mom.x, state.mom.y + 1.45, state.mom.z);
    const b = new THREE.Vector3(origin + state.noob.x, state.noob.y + 1.15, state.noob.z);
    aimBeam(world.beam, a, b);
    (world.beam.material as THREE.Material).opacity = state.beam;
    (world.beam.material as THREE.Material).transparent = true;
  }

  world.dust.visible = state.dust > 0.05;
  world.dust.position.set(origin + state.noob.x, state.noob.floor + 0.05, state.noob.z);
  world.dust.scale.setScalar(0.4 + state.dust);
  world.scraps.visible = (place === "living" || fading) && state.scraps > 0.02;
  world.scraps.scale.setScalar(Math.max(0.001, state.scraps));
}
