// Shared set pieces: practical lights (glowing windows, lamps: HDR emissive, so the bloom pass catches them), light
// pools painted on the ground under lamps (the reference's warm pools at night), and per-light visibility so one
// built set can serve day, golden and night shots.
import * as THREE from "three";
import { ctex } from "../paint";
import { NOINK } from "../ink";
import type { LightName } from "../lights";

const glowMats = new Map<string, THREE.MeshBasicMaterial>();
/** self-lit HDR material: colour x k (k > 1 blooms; the bloom threshold is 1.0) */
export const glowMat = (hex = "#ffc070", k = 2.2) => {
  const key = `${hex}|${k}`;
  let m = glowMats.get(key);
  if (!m) { m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), fog: true }); glowMats.set(key, m); }
  return m;
};

const poolTex = () => ctex("lightPool", 256, 256, (g) => {
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  for (const [r, a] of [[0, 0.55], [0.35, 0.4], [0.7, 0.12], [1, 0]] as const) gr.addColorStop(r, `rgba(255,255,255,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
});
/** a soft warm pool of light on the ground (additive card, never inked) */
export const lightPool = (x: number, y: number, z: number, r: number, hex = "#ffb35c", k = 0.9) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), new THREE.MeshBasicMaterial({
    map: poolTex(), color: new THREE.Color(hex).multiplyScalar(k), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.02, z); m.layers.set(NOINK); m.renderOrder = 0.6;
  return m;
};

/** a group that is only visible in some lights (e.g. lit windows and lamp glows at night) */
export class LightGroup extends THREE.Group {
  constructor(public lights: LightName[]) { super(); }
  show(light: LightName) { this.visible = this.lights.includes(light); }
}
