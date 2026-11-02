// Stylised water surface (textures.md 5.2 #4): depression-angle colour gradient (deep near, light at the horizon),
// sparse crest / trough / glint marks that thin out toward the camera, drifting with time, real sun-shadow
// visibility (darker under bridges / hulls). Colours are on-screen targets per light (LOOK.water), tone-map-inverted.
import * as THREE from "three";
import { waterNear, waterFar } from "./paint";
import { LFB, untone } from "./shade";
import type { WorldLook } from "./lights";

const WATER_DECL = `#include <common>
varying vec3 vWP;
uniform vec3 wNearC, wMidC, wFarC, wCrest, wTrough, wGlint, wShade;
uniform sampler2D wNearTex, wFarTex;
uniform float wTime;
uniform vec2 wFlow;`;
const WATER_COL = `
  vec3 wV = vWP - cameraPosition;
  float wd = length(wV);
  float wDep = asin(clamp(-wV.y / wd, 0.0, 1.0));       // depression angle of the view ray
  float wf = 1.0 - smoothstep(0.0, 0.42, wDep);         // 1 at the horizon .. 0 at 24 deg down
  vec3 wc = mix(mix(wNearC, wMidC, smoothstep(0.0, 0.55, wf)), wFarC, smoothstep(0.55, 1.0, wf));
  vec2 wp = vWP.xz + wFlow * wTime;                     // drift (m/s)
  vec4 mk = mix(texture2D(wNearTex, wp / 8.0), texture2D(wFarTex, wp / 40.0 + 0.37), smoothstep(25.0, 90.0, wd));
  wc = mix(wc, wTrough, mk.g * 0.6);
  wc = mix(wc, wCrest, mk.r * 0.7);
  wc = mix(wc, wGlint, mk.b * (0.3 + 0.5 * wf));
  diffuseColor.rgb = wc;`;

export class Water {
  mesh: THREE.Mesh;
  private U: Record<string, THREE.IUniform>;
  /** geo = the water surface (flat, facing up); flow = drift in m/s along x / z */
  constructor(geo: THREE.BufferGeometry, flow: [number, number] = [0.35, 0]) {
    const wNear = waterNear(), wFar = waterFar();
    for (const t of [wNear, wFar]) { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 16; t.needsUpdate = true; }
    this.U = {
      wNearC: { value: new THREE.Color() }, wMidC: { value: new THREE.Color() }, wFarC: { value: new THREE.Color() },
      wCrest: { value: new THREE.Color() }, wTrough: { value: new THREE.Color() }, wGlint: { value: new THREE.Color() },
      wShade: { value: new THREE.Vector3(0.5, 0.56, 0.72) }, wNearTex: { value: wNear }, wFarTex: { value: wFar }, wTime: { value: 0 },
      wFlow: { value: new THREE.Vector2(...flow) },
    };
    const m = new THREE.MeshLambertMaterial({ color: 0xffffff });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.U);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", WATER_DECL)
        .replace("#include <map_fragment>", WATER_COL)
        .replace("#include <lights_fragment_begin>", "float sunVis = 1.0;\n" + LFB)
        .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n  reflectedLight.directDiffuse = diffuseColor.rgb * mix(wShade, vec3(1.0), sunVis);\n  reflectedLight.indirectDiffuse = vec3(0.0);");
    };
    m.customProgramCacheKey = () => "water2";
    this.mesh = new THREE.Mesh(geo, m);
    this.mesh.receiveShadow = true;
  }
  /** colours of the shot's light (on-screen targets) and the time for the drift */
  update(look: WorldLook, t: number) {
    const W = this.U, wc = look.water;
    untone(wc.near, W.wNearC.value); untone(wc.mid, W.wMidC.value); untone(wc.far, W.wFarC.value);
    untone(wc.crest, W.wCrest.value); untone(wc.trough, W.wTrough.value); untone(wc.glint, W.wGlint.value);
    W.wShade.value.set(...wc.shade); W.wTime.value = t;
  }
}
