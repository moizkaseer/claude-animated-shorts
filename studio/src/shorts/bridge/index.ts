// "The Bridge That Fell for a Song" (1831 Broughton bridge): the proven example short, 67.5 s.
// story.ts = timing (shots, cameras, lens, markers), set.ts = scenery, cast.ts = who stands where.
import type { ShortDef } from "../../engine/short";
import { timeline, FOREGROUND } from "./story";
import { bridgeSet } from "./set";

export const bridge: ShortDef = {
  ...timeline,
  id: "BridgeShort",
  title: "The Bridge That Fell for a Song",
  foreground: FOREGROUND,
  kit: ["tree_oak", "tree_default", "tree_detailed", "tree_fat", "tree_cone", "tree-high-round", "tree", "plant_bushLarge", "plant_bushDetailed",
    "plant_bush", "hedge", "flower_redA", "flower_yellowA", "flower_purpleA", "grass_large", "grass", "lily_large", "lantern", "cart", "stall-red",
    "stall-green", "stall-bench", "banner-red", "banner-green", "windmill", "canoe"],
  set: bridgeSet,
};
