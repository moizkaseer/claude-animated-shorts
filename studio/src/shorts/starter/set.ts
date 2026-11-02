// Starter short's set: one engine street (with a lake in its country) and one engine room built away from it.
// pose() switches the night-only pieces (lit windows, lamp glows, light pools) and drifts the lake.
import * as THREE from "three";
import { Batch } from "../../engine/build";
import type { SetCtx, SetHooks } from "../../engine/world";
import { street } from "../../engine/sets/street";
import { room } from "../../engine/sets/room";
import { table, chair, sofa, shelf, rug, frame, ceilingLamp } from "../../engine/sets/props";
import { LightGroup } from "../../engine/sets/common";
import { stage } from "./cast";
import { LAKE, ROOM_AT } from "./story";

export const starterSet = (ctx: SetCtx): SetHooks => {
  const st = street(ctx.root, ctx.kit, { length: 90, seed: 4, rays: ctx.rays, land: { lake: LAKE } });
  // the room: built at the origin of its own group, moved to ROOM_AT
  const g = new THREE.Group();
  g.position.set(...ROOM_AT);
  ctx.root.add(g);
  const r = room(g, { w: 7, d: 6, h: 3, wall: "#f2d27a", pattern: "#e0a845", wainscot: "#5fb8b0", window: { x: -0.6 } });
  const b = new Batch();
  rug(b, 0, 0, -0.6, 3, 2);
  table(b, 0.2, 0, -1.2);
  chair(b, 0.2, 0, -1.95, 0);
  sofa(b, -2.3, 0, 1.6, Math.PI);
  shelf(b, 3.1, 0, -2.5, -Math.PI / 2);
  frame(b, 2.0, 1.85, -r.d / 2 + 0.01);
  const lampGlow = ceilingLamp(b, 0.2, r.h, -1.2);
  b.build(g);
  const lit = new LightGroup(["night", "interior"]);
  lit.add(...lampGlow);
  g.add(lit);
  return {
    pose: ({ t, light, look }) => {
      st.night.show(light); st.day.show(light); lit.show(light);
      st.water?.update(look, t);
    },
    stage: ({ id, t, info }) => stage(id, t, info),
  };
};
