// "The Tower Saved by Wars" set: the Piazza dei Miracoli (lawn, cathedral, baptistery, city wall, houses beyond), the
// procedural tower posed every frame from story.ts towerAt(), era props switched per shot (mud ring / 1934 cement
// truck / 1990s lead, bands, fence and drill rig), and the Professor's classroom far away at ROOM_AT.
import * as THREE from "three";
import { Batch, house, withSightLines } from "../../engine/build";
import { rng } from "../../engine/paint";
import type { SetCtx, SetHooks } from "../../engine/world";
import { land } from "../../engine/sets/land";
import { room } from "../../engine/sets/room";
import { table, shelf, frame, ceilingLamp } from "../../engine/sets/props";
import { Tower, R } from "./tower";
import { cathedral, baptistery, cityWall, cementTruck, leadAndBands, fenceRing, drillRig, mudRing, chalkboard, block, blockStack, treadCrane, cartWithBlock, timberPile, tent, dirtPatch } from "./props";
import { barrel, crate } from "../../engine/sets/props";
import { WORK_BLOCKS } from "./story";
import { stage } from "./cast";
import { SHOTS, ROOM_AT, towerAt, Era } from "./story";

export const pisaSet = (ctx: SetCtx): SetHooks => {
  const root = ctx.root;
  // ---- square ----
  land(root, ctx.kit, { clear: (x, z) => z > -95 && z < 100 && x > -150 && x < 130, trees: 70, radius: 260, seed: 12 });
  const b = new Batch();
  cathedral(b, -62, -30);
  baptistery(b, -140, -30);
  cityWall(b, -190, 150, -82);
  b.build(root);
  const hb = new Batch(), r = rng(21);
  withSightLines(ctx.rays, () => {
    for (let x = -180; x < 150; x += 9 + r() * 3) house(hb, x, -94 - r() * 6, 0, [7, 9][Math.floor(r() * 2)], 8, [8.4, 9.8, 11.2][Math.floor(r() * 3)], Math.floor(r() * 8));
    for (let x = -150; x < 150; x += 9 + r() * 3) house(hb, x, 112 + r() * 6, Math.PI, [7, 9][Math.floor(r() * 2)], 8, [8.4, 9.8][Math.floor(r() * 2)], Math.floor(r() * 8));
  });
  hb.build(root);
  // ---- the tower ----
  const tower = new Tower();
  root.add(tower.root);
  // ---- era props ----
  const era = (on: Era[]) => { const g = new THREE.Group(); g.userData.eras = on; root.add(g); return g; };
  const gMud = era(["medieval"]); gMud.add(mudRing(R));
  // the medieval building site: dirt yard, crane on the high side, blocks, cart, timber, tents, barrels
  const gSite = era(["medieval"]);
  gSite.add(dirtPatch(1, 9, 24));
  { const e = new Batch();
    treadCrane(e, -13, 2, Math.PI / 2, 13, 5.5);
    blockStack(e, 10.5, 14.5, 0.3); blockStack(e, -7.5, 16, -0.2, 2); blockStack(e, 14, 4, 1.3);
    for (const [x, z] of WORK_BLOCKS) block(e, x, z, 1.0, 0.55, 0.7, 0.1);
    cartWithBlock(e, -4.2, 14.2, 0.5);
    timberPile(e, 13.5, 9.5, 1.2);
    tent(e, -17, 15, 0, "#c0353a"); tent(e, 18, 17, 0.4, "#3f6fb5");
    barrel(e, 8.2, 0, 16.4); barrel(e, 9.0, 0, 16.9, 0.9); crate(e, 7.4, 0, 17.0, 0.7, 0.3); crate(e, -9.5, 0, 12.5, 0.8, -0.4);
    e.build(gSite); }
  const g34 = era(["1934"]); { const e = new Batch(); cementTruck(e, 18, 10, [R * 0.9, 0.4, 3]); e.build(g34); }
  const g90 = era(["1990"]); { const e = new Batch(); leadAndBands(e, R); fenceRing(e, 24); drillRig(e, -R - 7, 4); e.build(g90); }
  const eraGroups = [gMud, gSite, g34, g90];
  // ---- the classroom ----
  const cg = new THREE.Group();
  cg.position.set(...ROOM_AT);
  root.add(cg);
  const rm = room(cg, { w: 7, d: 6, h: 3.1, wall: "#e8d9b0", pattern: "#c9a45a", wainscot: "#3f6f5a", window: { x: 2.2 } });
  const cb = new Batch();
  chalkboard(cb, 0.4, 1.75, -rm.d / 2 + 0.01);
  table(cb, 0.55, 0, -1.0, 0, 1.2, 0.7, "#8a5a34");
  shelf(cb, -3.1, 0, -1.2, Math.PI / 2);
  frame(cb, -1.8, 1.9, -rm.d / 2 + 0.01);
  const glow = ceilingLamp(cb, 0.2, rm.h, -0.6);
  cb.build(cg);
  cg.add(...glow);
  return {
    pose: ({ id, t }) => {
      const st = towerAt(id, t);
      tower.set(st.built, st.lean, st.banana, st.scaffold);
      for (const g of eraGroups) g.visible = (g.userData.eras as Era[]).includes(SHOTS[id - 1].era);
    },
    stage: ({ id, t, info }) => stage(id, t, info),
  };
};
