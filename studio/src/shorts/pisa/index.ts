// "The Tower Saved by Wars": the Leaning Tower of Pisa only survived because its builders kept stopping to go to war.
// The channel's first short (host: the Professor). Script and sources: media/pisa/SCRIPT.md.
import type { ShortDef } from "../../engine/short";
import { timeline, FOREGROUND } from "./story";
import { pisaSet } from "./set";
import words from "../../../media/pisa/voice/words.json";
import type { Word } from "../../engine/words";

export const pisa: ShortDef = {
  ...timeline,
  id: "PisaShort",
  title: "The Tower Saved by Wars",
  foreground: FOREGROUND,
  kit: [],
  set: pisaSet,
  sightReach: 0.7,
  captions: { words: words as Word[] },
};
