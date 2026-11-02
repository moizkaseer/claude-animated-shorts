// Time a short to its narration: shots, cuts, reactions and sounds are written against WORDS of words.json
// (media/<short>/voice/words.json, [{w, s, e}]), so swapping the voice (placeholder -> real take) re-times everything.
//   const W = wordClock(words);  W.s("tip") = start (s) of the first "tip"; W.s("In 1990") = start of the first
//   place those words come in a row (prefer phrases: a single short word like "in" repeats more than you think);
//   W.s("war", 2) = the second match. W.f(...) = its frame minus the 2-frame reaction lead; W.e(...) = end of the
//   LAST word of the phrase; W.end = last word end.
import { FPS } from "./core";

export type Word = { w: string; s: number; e: number };
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9']/g, "");

export const wordClock = (words: Word[]) => {
  const toks = words.map((w) => norm(w.w));
  /** [first word, last word] of the n-th place the phrase occurs */
  const find = (phrase: string, n = 1): [Word, Word] => {
    const k = phrase.split(/\s+/).map(norm).filter(Boolean);
    let seen = 0;
    for (let i = 0; i + k.length <= toks.length; i++)
      if (k.every((x, j) => toks[i + j] === x) && ++seen === n) return [words[i], words[i + k.length - 1]];
    throw new Error(`words.json has no occurrence ${n} of "${phrase}"`);
  };
  return {
    s: (phrase: string, n = 1) => find(phrase, n)[0].s,
    e: (phrase: string, n = 1) => find(phrase, n)[1].e,
    /** frame where a reaction to this phrase lands: 2 frames before its onset (reference: 0-3 f) */
    f: (phrase: string, n = 1) => Math.max(0, Math.round(find(phrase, n)[0].s * FPS) - 2),
    /** frame of the phrase's onset */
    on: (phrase: string, n = 1) => Math.round(find(phrase, n)[0].s * FPS),
    end: words[words.length - 1].e,
  };
};
