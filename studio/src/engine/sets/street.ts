// A town street along z: cobbled road, stone pavements, two rows of gabled houses facing the road (engine house(),
// eight painted styles), street lamps, grass and trees behind, hills. For night shots the returned `night` group holds
// lit windows, lamp glows and warm light pools on the ground; `day` holds the unlit lamp glass. Call show(light) on
// both from the set's pose (shorts/starter/set.ts shows how).
import * as THREE from "three";
import { Batch, Kit, V, lam, boxGeo, house, houseWindows, withSightLines, Ray } from "../build";
import { cobbleHD, stoneHD, rng } from "../paint";
import { land, LandOpts } from "./land";
import { lampPost } from "./props";
import { glowMat, lightPool, LightGroup } from "./common";

export type StreetOpts = {
  length?: number;     // m along z, centred on 0 (default 80)
  road?: number;       // road width (default 7)
  walk?: number;       // pavement width (default 2.2)
  lampEvery?: number;  // m between lamps on each side (default 14; 0 = none)
  litWindows?: number; // share of windows lit at night (default 0.55)
  seed?: number;
  rays?: Ray[];        // the film's sight lines: houses in front of a lens are left out
  land?: LandOpts;     // extra options for the surrounding country (e.g. a lake, a path)
};

export const street = (root: THREE.Object3D, kit: Kit, o: StreetOpts = {}) => {
  const L = o.length ?? 80, road = o.road ?? 7, walk = o.walk ?? 2.2, r = rng(o.seed ?? 3);
  const night = new LightGroup(["night"]), day = new LightGroup(["day", "golden", "interior"]);
  const front = road / 2 + walk;
  const lo = o.land ?? {};
  const { water } = land(root, kit, { trees: 90, radius: 140, seed: (o.seed ?? 3) + 1, ...lo,
    clear: (x, z) => Math.abs(x) < front + 14 || (lo.clear ? lo.clear(x, z) : false) });
  const b = new Batch();
  // road + pavements (+ kerbs)
  b.add(boxGeo(V(-road / 2, -0.05, -L / 2 - 20), V(road / 2, 0.02, L / 2 + 20), 2), lam("cobbleHD", () => ({ map: cobbleHD() })));
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -front : road / 2, x1 = s < 0 ? -road / 2 : front;
    b.add(boxGeo(V(x0, -0.05, -L / 2 - 20), V(x1, 0.14, L / 2 + 20), 2), lam("copeHD", () => ({ map: stoneHD("copeHD") })));
  }
  const lit = glowMat("#ffc46e", 1.9);
  withSightLines(o.rays ?? [], () => {
    for (const s of [-1, 1]) {
      let z = -L / 2;
      while (z < L / 2) {
        const w = [7, 9][Math.floor(r() * 2)], h = [7, 8.4, 9.8][Math.floor(r() * 3)], d = 8;
        const x = s * (front + d / 2), cz = z + w / 2, yaw = s < 0 ? Math.PI / 2 : -Math.PI / 2;
        if (house(b, x, cz, yaw, w, d, h, Math.floor(r() * 8), 0.14)) {
          // night: some front windows lit (a pane 3 cm in front of the painted glass)
          const m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, 0.14, cz);
          for (const wdw of houseWindows(w, h)) {
            if (r() > (o.litWindows ?? 0.55)) continue;
            const pane = new THREE.Mesh(new THREE.PlaneGeometry(wdw.w, wdw.h), lit);
            pane.position.set(wdw.x, wdw.y + wdw.h / 2, d / 2 + 0.03).applyMatrix4(m);
            pane.rotation.y = yaw;
            night.add(pane);
          }
        }
        z += w + (r() < 0.2 ? 2.5 : 0.25);
      }
    }
  });
  // lamps on both pavements, staggered; pools of light under them at night
  const every = o.lampEvery ?? 14;
  if (every > 0) for (const s of [-1, 1]) for (let z = -L / 2 + (s > 0 ? every / 2 : 0); z <= L / 2; z += every) {
    const x = s * (road / 2 + 0.6);
    const [glow, glass] = lampPost(b, x, 0.14, z);
    night.add(glow, lightPool(x, 0.14, z, 3.4, "#ffb35c", 1.4));
    day.add(glass);
  }
  b.build(root);
  root.add(night, day);
  return { night, day, water, front, road, walk };
};
