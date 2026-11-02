// Starter short (template + engine test): copy it with `node scripts/new-short.mjs <name>`.
import type { ShortDef } from "../../engine/short";
import { timeline, FOREGROUND } from "./story";
import { starterSet } from "./set";

export const starter: ShortDef = {
  ...timeline,
  id: "StarterShort",
  title: "Starter",
  foreground: FOREGROUND,
  kit: [],
  set: starterSet,
  sightReach: 0.75,
};
