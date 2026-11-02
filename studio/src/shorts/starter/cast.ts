// Starter short's cast: who stands where in each shot, with blinks and expressions. Outfits: engine/toon.ts
// (Outfit: jacket, pants, boots, hat cap/hair/tophat/bonnet/shako, dress, moustache, build adult/stout/kid).
import { townsfolk, KID, PARENT, Outfit, Expr } from "../../engine/toon";
import { Stage, CamInfo, Who, person, lidAt, blob, beginStage, viewOf } from "../../engine/cast";
import { SHOTS, LAKE, ROOM_AT, LAMP_Z } from "./story";
import { host } from "../../characters/host";

const BAKER: Outfit = { jacket: "#f4efe2", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#3a2a20", skin: "#f5c9a0" };
const POSTIE: Outfit = { jacket: "#3f6fb5", pants: "#2f3446", boots: "#2a201a", hat: "cap", cap: "#c0353a", moustache: "#4a3426" };
const READER: Outfit = { ...townsfolk(3), hat: "hair", hair: "#8a5a3a", dress: "#7b5ac9" };

const stand = (out: Stage, cam: CamInfo, t: number, who: Who, x: number, y: number, z: number, expr: Expr, facing: -1 | 0 | 1 = 0, scale = 1) => {
  out.places.push(person(cam, who, x, y, z, { side: false, mirror: false }, { mode: "stand", expr, blink: lidAt(t, who.i), facing }, {}, scale));
  blob(out, x, y, z, scale);
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const s = SHOTS[id - 1], out = beginStage(s.light, cam);
  if (s.scene === "street" && id === 1) {
    // the channel host explains; the expression swap at 1.2 s is covered by a blink (swaps)
    host(out, cam, t, 4.4, 0.14, 1.6, { mode: t < 1.2 ? "stand" : "explain", expr: t < 1.2 ? "neutral" : "smile", facing: -1, swaps: [1.2] });
    stand(out, cam, t, { i: 2, o: POSTIE, okey: "postie" }, 5.4, 0.14, 2.6, t < 1.2 ? "stern" : "laugh", -1);
  }
  if (s.scene === "street" && id === 3) {
    host(out, cam, t, 4.6, 0.14, LAMP_Z + 0.6, { expr: "nervous", facing: -1 });
    // a walker crossing on the far pavement (march-style walk cycle, side view toward -z)
    const z = LAMP_Z + 8 - 1.3 * (t - 5), x = -4.5, view = viewOf(cam, x, z, 0, -1);
    out.places.push(person(cam, { i: 4, o: townsfolk(1), okey: "f1" }, x, 0.14, z, view,
      { mode: "stroll", phase: ((t * 1.2) % 1), expr: "smile" }, { mode: "march", phase: ((t * 1.2) % 1), stomp: 0.55, stride: 0.8 * view.fs }));
    blob(out, x, 0.14, z);
  }
  if (s.scene === "lake") {
    const x = LAKE.x + LAKE.rx + 0.6, z = LAKE.z;
    stand(out, cam, t, { i: 5, o: PARENT, okey: "parent" }, x, 0, z + 0.6, "smile", -1);
    stand(out, cam, t, { i: 6, o: KID, okey: "kid" }, x + 0.2, 0, z - 1.0, "grin", -1, 0.72);
  }
  if (s.scene === "room") {
    const [rx, ry] = ROOM_AT;
    stand(out, cam, t, { i: 7, o: READER, okey: "reader" }, rx - 1.2, ry, -1.0, "smile_closed", 1);
    host(out, cam, t, rx + 0.2, ry + 0.02, -1.7, { mode: "sit", expr: t < 8.5 ? "neutral" : "shock", swaps: [8.5] });
  }
  return out;
};
