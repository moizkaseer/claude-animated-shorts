// Block-character sets for the Noobyville review. Built once, posed from director.direct(frame).
import * as THREE from "three";
import type { CharPose, Expr, Place, State } from "./director";
import { SET_X } from "./director";

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
  pupilL: THREE.Object3D;
  pupilR: THREE.Object3D;
  mouth: THREE.Mesh;
  browL: THREE.Mesh;
  browR: THREE.Mesh;
  shadow: THREE.Mesh;
  seed: number;
  waist: number;
};

type Block = { mesh: THREE.Object3D; from: THREE.Vector3; to: THREE.Vector3 };

export type World = {
  root: THREE.Group;
  sets: Record<"obby" | "garden" | "roof" | "workshop" | "finale", THREE.Group>;
  noob: Rig;
  mom: Rig;
  friends: Rig[];
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  lamp: THREE.PointLight;
  sky: THREE.Mesh;
  skyMat: THREE.ShaderMaterial;
  fog: THREE.Fog;
  bg: THREE.Color;
  checkpointMat: THREE.MeshToonMaterial;
  flagMat: THREE.MeshToonMaterial;
  doorPivot: THREE.Group;
  blocks: Block[];
  walls: THREE.Group;
  ceiling: THREE.Object3D;
  lobby: THREE.Group;
  wifi: THREE.Group;
  dust: THREE.Group;
  ribbonL: THREE.Object3D;
  ribbonR: THREE.Object3D;
  portal: THREE.Group;
};

const WAIST = 0.98;

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
  t.needsUpdate = true;
  return t;
}

function signTexture(lines: string[], bg: string, fg: string, border: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 280;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 280);
  g.strokeStyle = border;
  g.lineWidth = 18;
  g.strokeRect(12, 12, 488, 256);
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "700 92px TitanOne, sans-serif";
  lines.forEach((line, i) => {
    const y = lines.length === 1 ? 140 : 95 + i * 100;
    g.fillText(line, 256, y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function paperTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff8ee";
  g.fillRect(0, 0, 256, 320);
  g.strokeStyle = "#e7b15a";
  g.lineWidth = 10;
  g.strokeRect(6, 6, 244, 308);
  g.fillStyle = "#2a211c";
  g.font = "700 42px TitanOne, sans-serif";
  g.textAlign = "center";
  g.fillText("HOMEWORK", 128, 52);
  g.fillStyle = "#5c5148";
  for (let i = 0; i < 8; i++) g.fillRect(28, 88 + i * 26, 200, 5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
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

  const root = new THREE.Group();
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { top: { value: new THREE.Color("#2f9ed0") }, bot: { value: new THREE.Color("#8ad4ea") } },
    vertexShader: "varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top, bot; varying float h; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(-0.02, 0.55, h)), 1.0); }",
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(160, 24, 16), skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = -2;
  root.add(sky);

  const hemi = new THREE.HemisphereLight("#9ee7f6", "#e7b48a", 0.62);
  const sun = new THREE.DirectionalLight("#fff3d8", 0.85);
  sun.position.set(7, 14, 6);
  const fill = new THREE.DirectionalLight("#ffd0b0", 0.22);
  fill.position.set(-6, 5, -3);
  const lamp = new THREE.PointLight("#ffc27a", 0.0, 8, 1.4);
  root.add(hemi, sun, fill, lamp);

  const fog = new THREE.Fog("#8ad4ea", 16, 60);
  const bg = new THREE.Color("#8ad4ea");

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

  const merged = (parent: THREE.Object3D, parts: (number | string)[][]) => {
    const geos: THREE.BufferGeometry[] = [];
    const box = new THREE.BoxGeometry(1, 1, 1);
    for (const p of parts) {
      const x = Number(p[0]), y = Number(p[1]), z = Number(p[2]);
      const w = Number(p[3]), h = Number(p[4]), d = Number(p[5]);
      const ry = Number(p[7] || 0);
      const g = box.clone();
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0));
      m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(w, h, d));
      g.applyMatrix4(m4);
      const col = new THREE.Color(String(p[6]));
      const colors = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < g.attributes.position.count; i++) {
        colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
      }
      g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geos.push(g);
    }
    const mergedGeo = mergeGeos(geos);
    const mesh = new THREE.Mesh(mergedGeo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad }));
    parent.add(mesh);
    return mesh;
  };

  const makeRig = (opts: {
    skin: string; shirt: string; pants: string; shoe: string; hair: "none" | "bun" | "cap" | "short";
    hairColor?: string; glasses?: boolean; scale?: number; seed: number; buttons?: boolean;
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
    } else if (opts.hair === "cap") {
      part(head, 0.78, 0.22, 0.78, opts.hairColor || "#e23b3b", 0, 0.32, 0.02);
      part(head, 0.4, 0.12, 0.4, opts.hairColor || "#e23b3b", 0, 0.28, 0.4, false);
    } else if (opts.hair === "short") {
      part(head, 0.74, 0.28, 0.72, opts.hairColor || "#2b241f", 0, 0.26, -0.02);
    }
    const eye = (x: number) => {
      const g = new THREE.Group();
      g.position.set(x, 0.05, headS / 2 + 0.02);
      const white = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.05), basic("#fffdf8"));
      g.add(white);
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.04), basic("#1a1a1e"));
      pupil.position.z = 0.03;
      g.add(pupil);
      head.add(g);
      return { g, pupil };
    };
    const L = eye(-0.16);
    const R = eye(0.16);
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
    return {
      root: rootG, pivot, body, head, armL, armR, legL, legR,
      eyeL: L.g, eyeR: R.g, pupilL: L.pupil, pupilR: R.pupil,
      mouth, browL: brow(-0.16), browR: brow(0.16), shadow, seed: opts.seed, waist: WAIST,
    };
  };

  const obby = new THREE.Group();
  const garden = new THREE.Group();
  const roof = new THREE.Group();
  const workshop = new THREE.Group();
  const finale = new THREE.Group();
  finale.position.x = SET_X.hall;
  garden.position.x = SET_X.garden;
  roof.position.x = SET_X.roof;
  workshop.position.x = SET_X.workshop;
  root.add(obby, garden, roof, workshop, finale);

  const wood = "#e39a3c", wood2 = "#c47a28", teal = "#178ea3", orange = "#f08a3a", grass = "#3cb85c";
  merged(obby, [
    [-0.05, -0.28, 0.15, 3.3, 0.56, 2.7, wood],
    [-0.05, -0.05, 0.15, 3.15, 0.12, 2.55, "#f2c27a"],
    [0.05, -0.28, -4.35, 3.3, 0.56, 2.5, orange],
    [0.05, -0.05, -4.35, 3.15, 0.12, 2.35, "#ffb15a"],
    [-0.12, -1.02, -2.05, 1.55, 0.42, 1.35, "#f0c14a"],
    [0, -1.55, -2.15, 4.2, 0.25, 3.4, teal],
    [0.4, -1.48, -1.4, 1.1, 0.08, 0.35, "#8fe4ef"],
    [-2.6, -0.2, -1.2, 1.4, 1.1, 1.4, "#f0a04a"],
    [2.5, 0.1, -3.2, 1.2, 1.5, 1.2, "#ef7d4a"],
    [-3.1, 0.4, -5.2, 1.6, 2.2, 1.6, "#d98a3c"],
    [2.8, -0.1, 1.4, 1.1, 0.9, 1.1, grass],
  ]);
  // trees
  merged(obby, [
    [-2.3, 0.7, 1.0, 0.28, 1.1, 0.28, "#8a5528"],
    [-2.3, 1.55, 1.0, 1.1, 0.7, 1.1, "#2f9a45"],
    [-2.3, 2.05, 1.0, 0.7, 0.5, 0.7, "#46c45a"],
    [2.4, 0.55, -5.6, 0.28, 1.0, 0.28, "#8a5528"],
    [2.4, 1.4, -5.6, 1.15, 0.75, 1.15, "#248a3e"],
  ]);
  const portal = new THREE.Group();
  portal.position.set(-0.35, 0, 1.55);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    part(portal, 0.16, 0.16, 0.16, i % 2 ? "#3de6ff" : "#bff7ff", Math.sin(a) * 0.78, 1.15 + Math.cos(a) * 0.95, 0, false);
  }
  obby.add(portal);
  const dust = new THREE.Group();
  dust.position.set(-0.12, -0.7, -2.05);
  for (let i = 0; i < 4; i++) part(dust, 0.16, 0.12, 0.16, "#f3e2b0", (i - 1.5) * 0.22, 0.1, (i % 2) * 0.18, false);
  obby.add(dust);

  merged(garden, [
    [0, -0.35, 0, 6.2, 0.5, 6.2, grass],
    [0, -0.08, 0.4, 1.4, 0.08, 3.2, "#d7b07a"],
    [-2.3, 0.35, -0.4, 0.9, 0.7, 0.9, "#2f8d46"],
    [2.2, 0.28, 0.8, 0.8, 0.55, 0.8, "#257a3c"],
    [-1.8, 0.15, 1.6, 0.7, 0.4, 0.7, "#33924a"],
  ]);
  const flowerCols = ["#ff5d8f", "#ffd24a", "#8b6cff", "#ff7a3c"];
  for (let i = 0; i < 8; i++) {
    const ang = i * 0.8;
    const rad = 1.8 + (i % 3) * 0.35;
    part(garden, 0.22, 0.22, 0.22, flowerCols[i % 4], Math.cos(ang) * rad, 0.18, Math.sin(ang) * rad, false);
    part(garden, 0.06, 0.28, 0.06, "#2f7a32", Math.cos(ang) * rad, 0.05, Math.sin(ang) * rad, false);
  }
  const checkpointMat = mat("#3aa0ff");
  const flagMat = mat("#3aa0ff");
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.18, 16), checkpointMat);
  pad.position.set(0, 0.1, -1.55);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), mat("#f4f1ea"));
  pole.position.set(0, 0.8, -1.55);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.06), flagMat);
  flag.position.set(0.24, 1.3, -1.55);
  garden.add(pad, pole, flag);

  merged(roof, [
    [0, -0.2, 0.2, 3.4, 0.4, 5.4, "#e06a45"],
    [0, 0.02, 0.2, 3.2, 0.08, 5.2, "#f29a62"],
    [-1.3, 0.55, 1.3, 0.4, 0.7, 0.4, "#c9d2d6"],
    [1.15, 0.7, -0.4, 0.45, 0.95, 0.45, "#d5dee2"],
    [-2.6, 0.4, -1.5, 1.5, 1.6, 1.4, "#f0b429"],
    [2.7, 0.2, 1.2, 1.3, 1.8, 1.3, "#3aa0c8"],
    [-2.4, 0.9, 2.2, 1.2, 2.4, 1.2, "#ef7d55"],
    [2.5, 1.1, -2.4, 1.4, 2.8, 1.3, "#6b5bd6"],
  ]);
  const ribbonMat = mat("#ffe14a");
  const postL = part(roof, 0.12, 1.5, 0.12, "#fff6e8", -0.7, 0.75, -2.55);
  const postR = part(roof, 0.12, 1.5, 0.12, "#fff6e8", 0.7, 0.75, -2.55);
  void postL; void postR;
  const ribbonL = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.06), ribbonMat);
  ribbonL.position.set(-0.34, 1.15, -2.55);
  const ribbonR = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.06), ribbonMat);
  ribbonR.position.set(0.34, 1.15, -2.55);
  roof.add(ribbonL, ribbonR);
  const wifi = new THREE.Group();
  wifi.position.set(-0.95, 1.7, 0.35);
  const ink = basic("#243044");
  for (let i = 0; i < 3; i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.16 + i * 0.16, 0.035, 6, 18, Math.PI), ink);
    arc.rotation.z = Math.PI;
    arc.position.y = 0.05;
    wifi.add(arc);
  }
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), ink);
  dot.position.y = -0.02;
  wifi.add(dot);
  roof.add(wifi);

  merged(workshop, [[0, -0.2, 0.2, 6.4, 0.4, 6.6, "#d39a52"]]);
  const walls = new THREE.Group();
  merged(walls, [
    [0, 1.5, -3.05, 6.2, 3.0, 0.28, "#f2c7a0"],
    [-3.05, 1.5, 0.2, 0.28, 3.0, 6.2, "#e7b48a"],
    [3.05, 1.5, 0.2, 0.28, 3.0, 6.2, "#e7b48a"],
    [0, 1.7, -2.95, 1.5, 1.15, 0.08, "#9fd8ea"],
    [-0.02, 1.7, -2.9, 0.06, 1.15, 0.08, "#f4efe6"],
    [0, 1.7, -2.9, 1.5, 0.06, 0.08, "#f4efe6"],
  ]);
  const ceiling = part(walls, 6.2, 0.2, 6.2, "#f7e2c4", 0, 3.05, 0.2, false);
  workshop.add(walls);
  merged(workshop, [
    [1.5, 0.45, 0.9, 1.3, 0.16, 0.7, "#c68642"],
    [1.5, 0.22, 0.55, 0.12, 0.44, 0.12, "#a86b32"],
    [1.5, 0.22, 1.25, 0.12, 0.44, 0.12, "#a86b32"],
  ]);
  const blockCols = ["#ff5d8f", "#ffd24a", "#3aa0ff", "#46c45a", "#ff7a3c", "#8b6cff", "#3de6ff", "#f2f2f2"];
  const froms = [
    [1.35, 0.7, 0.7], [1.55, 0.95, 0.85], [1.2, 1.15, 0.6], [1.7, 0.7, 0.95],
    [1.4, 1.35, 0.75], [1.15, 0.85, 1.05], [1.65, 1.15, 0.55], [1.45, 1.55, 0.9],
  ];
  const tos = [
    [-0.55, 0.28, -1.15], [0.55, 0.28, -1.15], [-0.55, 0.85, -1.15], [0.55, 0.85, -1.15],
    [0, 1.42, -1.15], [-1.15, 0.35, -0.35], [1.15, 0.35, -0.35], [0, 0.28, -0.55],
  ];
  const blocks: Block[] = froms.map((f, i) => {
    const mesh = part(workshop, 0.5, 0.5, 0.5, blockCols[i], f[0], f[1], f[2]);
    return { mesh, from: new THREE.Vector3(...f), to: new THREE.Vector3(...tos[i]) };
  });
  const lobby = new THREE.Group();
  merged(lobby, [
    [0, 0.02, -0.2, 2.4, 0.06, 2.4, "#ffd24a"],
    [-1.6, 0.02, 1.2, 0.8, 0.06, 0.8, "#ff5d8f"],
    [1.6, 0.02, 1.1, 0.8, 0.06, 0.8, "#3aa0ff"],
  ]);
  const lobbySign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), new THREE.MeshBasicMaterial({ map: signTexture(["MOM GAME"], "#1d3a4a", "#fff6df", "#ffd24a") }));
  lobbySign.position.set(0, 2.15, -1.2);
  lobby.add(lobbySign);
  workshop.add(lobby);

  // corridor + bedroom
  merged(finale, [
    [0, -0.2, -3.4, 3.5, 0.4, 6.6, "#e6b15a"],
    [0, -0.02, -3.2, 1.15, 0.06, 5.6, "#c4493a"],
    [-1.65, 1.4, -3.2, 0.22, 2.8, 6.2, "#f0c27a"],
    [1.65, 1.4, -3.2, 0.22, 2.8, 6.2, "#f0c27a"],
    // doorway surround at z=0
    [-1.22, 1.5, 0, 0.7, 3.0, 0.28, "#f0c27a"],
    [1.22, 1.5, 0, 0.7, 3.0, 0.28, "#f0c27a"],
    [0, 2.7, 0, 1.7, 0.7, 0.28, "#f0c27a"],
    // bedroom shell
    [0, -0.18, 2.8, 4.6, 0.36, 5.2, "#d39a55"],
    [0, 1.55, 5.35, 4.6, 3.1, 0.24, "#f3d0b0"],
    [-2.25, 1.55, 2.8, 0.24, 3.1, 5.0, "#f0c4a4"],
    [2.25, 1.55, 2.8, 0.24, 3.1, 5.0, "#efc09a"],
    [0, 3.05, 2.8, 4.6, 0.18, 5.2, "#f7e0c4"],
    [0, 1.7, 5.2, 1.5, 1.15, 0.08, "#8fd0ea"],
    [0, 0.04, 2.5, 2.2, 0.06, 1.5, "#e36b7a"],
    // bed
    [-1.35, 0.28, 3.5, 1.3, 0.35, 2.0, "#c4536a"],
    [-1.35, 0.52, 4.2, 1.2, 0.22, 0.4, "#fff6ea"],
    [-1.35, 0.22, 3.5, 1.4, 0.28, 2.1, "#c68642"],
    // desk
    [0.85, 0.48, 2.7, 1.35, 0.1, 0.7, "#c68642"],
    [0.4, 0.24, 2.5, 0.1, 0.48, 0.1, "#a86b32"],
    [1.3, 0.24, 2.5, 0.1, 0.48, 0.1, "#a86b32"],
    [1.3, 0.24, 2.95, 0.1, 0.48, 0.1, "#a86b32"],
    // chair
    [0.85, 0.28, 2.05, 0.42, 0.1, 0.42, "#8a5a32"],
    [0.85, 0.55, 1.88, 0.42, 0.5, 0.08, "#8a5a32"],
    // backpack
    [-1.05, 0.32, 1.45, 0.42, 0.5, 0.28, "#3d6fe0"],
    [-1.05, 0.42, 1.45, 0.22, 0.16, 0.3, "#ffd24a"],
    // exit door
    [2.1, 1.15, 2.35, 0.12, 2.1, 1.05, "#3e8f4a"],
  ]);
  const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.28, 10), basic("#ffd27a"));
  lampShade.position.set(1.25, 1.05, 2.75);
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), mat("#f4efe6"));
  lampStem.position.set(1.25, 0.75, 2.75);
  finale.add(lampShade, lampStem);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.54), new THREE.MeshBasicMaterial({ map: paperTexture() }));
  paper.position.set(0.7, 0.72, 2.72);
  paper.rotation.x = -0.7;
  finale.add(paper);
  const lock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.08), basic("#f0d56a"));
  lock.position.set(2.02, 1.15, 2.55);
  finale.add(lock);
  // lanterns
  for (const z of [-2.2, -4.4]) {
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.18), basic("#ffcf70"));
    glow.position.set(-1.35, 2.15, z);
    finale.add(glow);
  }
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.72, 0, 0);
  const doorBoard = part(doorPivot, 1.38, 2.2, 0.1, "#8a4b2f", 0.7, 1.12, 0);
  const handle = part(doorPivot, 0.08, 0.08, 0.12, "#f0d56a", 1.2, 1.05, -0.08, false);
  void doorBoard; void handle;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.72), new THREE.MeshBasicMaterial({ map: signTexture(["FREE", "ROBUX"], "#14343c", "#fff8ea", "#ffd15a") }));
  sign.position.set(0.7, 1.45, -0.07);
  sign.rotation.y = Math.PI;
  doorPivot.add(sign);
  finale.add(doorPivot);

  const noob = makeRig({ skin: "#ffd84a", shirt: "#2f6bff", pants: "#3cbf56", shoe: "#f4f6fb", hair: "none", seed: 1, scale: 1 });
  const mom = makeRig({ skin: "#f3c39a", shirt: "#ef6d4a", pants: "#31457a", shoe: "#3a2a28", hair: "bun", hairColor: "#6b3a2a", glasses: true, buttons: true, seed: 2, scale: 1.06 });
  const friends = [
    makeRig({ skin: "#f0c199", shirt: "#8b6cff", pants: "#2c2a33", shoe: "#f4f1ea", hair: "cap", hairColor: "#e23b3b", seed: 3, scale: 0.92 }),
    makeRig({ skin: "#e7b48a", shirt: "#ff7a3c", pants: "#2457c5", shoe: "#f4f6fb", hair: "short", hairColor: "#2b241f", seed: 4, scale: 0.9 }),
    makeRig({ skin: "#f3c39a", shirt: "#14a3a3", pants: "#f0c14a", shoe: "#fff6ea", hair: "bun", hairColor: "#4a2c22", seed: 5, scale: 0.9 }),
  ];

  return {
    root, sets: { obby, garden, roof, workshop, finale }, noob, mom, friends,
    sun, hemi, lamp, sky, skyMat, fog, bg, checkpointMat, flagMat, doorPivot, blocks, walls, ceiling, lobby,
    wifi, dust, ribbonL, ribbonR, portal,
  };
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

const setOf = (place: Place): "obby" | "garden" | "roof" | "workshop" | "finale" =>
  place === "hall" || place === "bedroom" ? "finale" : place;

const lookOf = (place: Place) => {
  if (place === "workshop") return { sky: ["#f2c7a0", "#f7e2c4"], fog: "#f2c7a0", hemi: ["#ffe0c2", "#e7b48a", 0.7], sun: 0.35, lamp: 0.9, lampAt: [1.2, 2.2, 0.4] as const };
  if (place === "bedroom") return { sky: ["#f3d0b0", "#f7e0c4"], fog: "#f3d0b0", hemi: ["#ffe0c2", "#e7b48a", 0.62], sun: 0.28, lamp: 1.15, lampAt: [1.25, 1.3, 2.75] as const };
  if (place === "hall") return { sky: ["#f0a05a", "#ffd19a"], fog: "#ffd19a", hemi: ["#ffe0b0", "#e7a56a", 0.55], sun: 0.8, lamp: 0.35, lampAt: [0, 2.2, -3] as const };
  if (place === "roof") return { sky: ["#3aa0d8", "#9ad7ef"], fog: "#9ad7ef", hemi: ["#b7e6f6", "#e7b48a", 0.58], sun: 0.9, lamp: 0, lampAt: [0, 3, 0] as const };
  if (place === "garden") return { sky: ["#3ec6e0", "#b7ebc8"], fog: "#b7ebc8", hemi: ["#c6f3ff", "#e7c48a", 0.6], sun: 0.88, lamp: 0, lampAt: [0, 3, 0] as const };
  return { sky: ["#2f9ed0", "#8ad4ea"], fog: "#8ad4ea", hemi: ["#9ee7f6", "#e7b48a", 0.58], sun: 0.9, lamp: 0, lampAt: [0, 3, 0] as const };
};

function autoBlink(frame: number, seed: number) {
  const period = 80 + (seed % 19);
  const k = (frame + seed * 11) % period;
  if (k < 2) return 0.5;
  if (k < 4) return 1;
  if (k < 5) return 0.35;
  return 0;
}

function limb(rig: Rig, pose: CharPose, frame: number) {
  const s = Math.sin(pose.phase);
  const swing = pose.walk;
  rig.legL.rotation.x = s * 0.8 * swing;
  rig.legR.rotation.x = -s * 0.8 * swing;
  const g = pose.gesture;
  const h = pose.hold;
  const restL = { x: -s * 0.55 * swing, z: 0.18 };
  const restR = { x: s * 0.55 * swing, z: -0.18 };
  let L = { ...restL };
  let R = { ...restR };
  if (g === "jump") {
    const tuck = Math.sin(Math.PI * THREE.MathUtils.clamp(pose.phase, 0, 1));
    rig.legL.rotation.x = -0.95 * tuck;
    rig.legR.rotation.x = -0.8 * tuck;
    L = { x: -1.15 * tuck, z: 0.1 };
    R = { x: -1.05 * tuck, z: -0.1 };
  } else if (g === "wave") {
    R = { x: -2.45 + Math.sin(frame * 0.7) * 0.2, z: -0.15 };
  } else if (g === "point") {
    R = { x: -1.5, z: -0.45 };
  } else if (g === "carry") {
    L = { x: -1.25, z: 0.4 };
    R = { x: -1.25, z: -0.4 };
  } else if (g === "reach") {
    R = { x: -1.6, z: -0.12 };
  } else if (g === "belly") {
    const b = 0.7 + Math.sin(pose.phase) * 0.15;
    L = { x: -b, z: 0.55 };
    R = { x: -b, z: -0.55 };
  } else if (g === "shrug") {
    L = { x: -0.35, z: 1.05 };
    R = { x: -0.35, z: -1.05 };
  }
  const use = g === "none" || g === "walk" ? 0 : h;
  rig.armL.rotation.x = restL.x + (L.x - restL.x) * (g === "jump" ? 1 : use);
  rig.armR.rotation.x = restR.x + (R.x - restR.x) * (g === "jump" ? 1 : use);
  rig.armL.rotation.z = restL.z + (L.z - restL.z) * (g === "jump" ? 1 : use);
  rig.armR.rotation.z = restR.z + (R.z - restR.z) * (g === "jump" ? 1 : use);
  if (g === "jump") {
    rig.armL.rotation.x = L.x;
    rig.armR.rotation.x = R.x;
    rig.armL.rotation.z = L.z;
    rig.armR.rotation.z = R.z;
  }
}

function face(rig: Rig, expr: Expr, frame: number) {
  const blink = autoBlink(frame, rig.seed);
  let eyeY = 1, eyeX = 1, mouthX = 0.9, mouthY = 0.7, mouthDY = 0, brow = 0, browRot = 0, open = 0;
  if (expr === "smile") { eyeY = 0.85; mouthX = 1.25; mouthY = 0.7; brow = 0.03; }
  else if (expr === "laugh") { eyeY = 0.32; mouthX = 1.35; mouthY = 1.7; mouthDY = -0.02; brow = 0.05; }
  else if (expr === "surprise") { eyeX = 1.15; eyeY = 1.25; mouthX = 0.7; mouthY = 1.6; brow = 0.08; browRot = 0.25; }
  else if (expr === "frown") { eyeY = 0.8; mouthX = 0.85; mouthY = 0.55; mouthDY = -0.04; brow = -0.02; browRot = -0.35; }
  else if (expr === "smug") { eyeY = 0.55; mouthX = 1.15; mouthY = 0.55; brow = 0.04; browRot = 0.2; }
  else if (expr === "talk") { eyeY = 0.9; mouthX = 1.05; open = 0.6 + Math.sin(frame * 0.55) * 0.5; mouthY = 0.8 + open; brow = 0.02; }
  else if (expr === "focus") { eyeY = 0.75; mouthX = 0.7; mouthY = 0.45; brow = -0.03; browRot = -0.15; }
  const shut = expr === "laugh" ? blink * 0.3 : blink;
  rig.eyeL.scale.set(eyeX, Math.max(0.08, eyeY * (1 - 0.92 * shut)), 1);
  rig.eyeR.scale.set(eyeX, Math.max(0.08, eyeY * (1 - 0.92 * shut)), 1);
  rig.mouth.scale.set(mouthX, Math.max(0.35, mouthY), 1);
  rig.mouth.position.y = -0.16 + mouthDY;
  rig.browL.position.y = 0.22 + brow;
  rig.browR.position.y = 0.22 + brow;
  rig.browL.rotation.z = browRot;
  rig.browR.rotation.z = -browRot;
}

function applyChar(rig: Rig, pose: CharPose, frame: number, ox: number) {
  rig.root.visible = pose.show;
  rig.shadow.visible = pose.show;
  if (!pose.show) return;
  rig.root.position.set(pose.x + ox, pose.y + pose.bob, pose.z);
  rig.root.rotation.set(0, pose.yaw, pose.lean);
  rig.pivot.rotation.x = pose.recline;
  rig.body.scale.y = pose.squash;
  rig.head.rotation.set(pose.headPitch, pose.headYaw, 0);
  limb(rig, pose, frame);
  face(rig, pose.expr, frame);
  const lift = Math.max(0, pose.y - pose.floor);
  rig.shadow.position.set(pose.x + ox, pose.floor + 0.03, pose.z);
  const sc = 1 + lift * 0.12;
  rig.shadow.scale.set(sc, sc, sc);
  (rig.shadow.material as THREE.MeshBasicMaterial).opacity = 0.3 / (1 + lift * 0.45);
}

const BLUE = new THREE.Color("#3aa0ff");
const PINK = new THREE.Color("#ff5ca8");

export function apply(world: World, state: State, camera: THREE.PerspectiveCamera, scene: THREE.Scene, frame: number) {
  const key = setOf(state.place);
  for (const k of Object.keys(world.sets) as (keyof World["sets"])[]) world.sets[k].visible = k === key;
  const ox = SET_X[state.place];
  const look = lookOf(state.walls > 0.65 && state.place === "workshop" ? "obby" : state.place);
  (world.skyMat.uniforms.top.value as THREE.Color).set(look.sky[0]);
  (world.skyMat.uniforms.bot.value as THREE.Color).set(look.sky[1]);
  world.sky.visible = state.place !== "bedroom" && !(state.place === "workshop" && state.walls < 0.85);
  world.fog.color.set(look.fog);
  world.fog.near = state.place === "bedroom" || state.place === "workshop" ? 10 : 18;
  world.fog.far = state.place === "hall" ? 40 : 62;
  scene.fog = world.fog;
  world.bg.set(look.fog);
  scene.background = world.bg;
  world.hemi.color.set(look.hemi[0] as string);
  world.hemi.groundColor.set(look.hemi[1] as string);
  world.hemi.intensity = look.hemi[2] as number;
  world.sun.intensity = look.sun;
  world.lamp.intensity = look.lamp;
  world.lamp.position.set(look.lampAt[0] + (state.place === "bedroom" || state.place === "hall" ? ox : state.place === "workshop" ? SET_X.workshop : 0), look.lampAt[1], look.lampAt[2]);

  camera.position.set(state.cam.x + ox, state.cam.y, state.cam.z);
  camera.up.set(0, 1, 0);
  camera.lookAt(state.cam.lx + ox, state.cam.ly, state.cam.lz);
  camera.rotateZ(state.cam.roll);
  camera.fov = state.cam.fov;
  camera.updateProjectionMatrix();
  world.sky.position.copy(camera.position);

  applyChar(world.noob, state.noob, frame, ox);
  applyChar(world.mom, state.mom, frame, ox);
  world.friends.forEach((r, i) => applyChar(r, state.friends[i], frame, ox));

  world.checkpointMat.color.copy(BLUE).lerp(PINK, THREE.MathUtils.clamp(state.checkpoint, 0, 1));
  world.flagMat.color.copy(world.checkpointMat.color);
  world.doorPivot.rotation.y = -state.door;
  world.blocks.forEach((b, i) => {
    const u = state.blocks[i] ?? 0;
    b.mesh.position.lerpVectors(b.from, b.to, u);
    const pop = u > 0 && u < 1 ? 1 + Math.sin(u * Math.PI) * 0.18 : 1;
    b.mesh.scale.setScalar(pop);
  });
  world.walls.position.y = -2.8 * state.walls;
  world.ceiling.visible = state.walls < 0.9;
  world.lobby.visible = state.walls > 0.15;
  world.lobby.scale.setScalar(0.4 + 0.6 * state.walls);
  world.wifi.visible = state.wifi > 0.1;
  world.wifi.scale.setScalar(0.85 + Math.sin(frame * 0.4) * 0.06);
  world.dust.visible = state.dust > 0.05;
  world.dust.scale.setScalar(0.4 + state.dust);
  world.portal.scale.setScalar(0.92 + state.portal * 0.12);
  if (state.ribbon > 0.05) {
    world.ribbonL.rotation.z = state.ribbon * 0.9;
    world.ribbonR.rotation.z = -state.ribbon * 0.8;
    world.ribbonL.position.y = 1.15 - state.ribbon * 0.35;
    world.ribbonR.position.y = 1.15 - state.ribbon * 0.45;
  } else {
    world.ribbonL.rotation.z = 0;
    world.ribbonR.rotation.z = 0;
    world.ribbonL.position.y = 1.15;
    world.ribbonR.position.y = 1.15;
  }
}
