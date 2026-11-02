// Burned-in captions in the reference style (STYLE_BIBLE.md): one spoken word at a time, white bold sans with a
// thick black outline, centred in the lower middle (~66 % of the frame height), hard swap on each word's onset
// (2 frames early, like every reaction). A word that runs straight into the next (gap < 0.12 s) and is short may
// share the card with it, so tiny words ("a", "to", "in") do not flash by. Font: public/fonts/LiberationSans-Bold.ttf
// (SIL OFL). Sizes are in 1080x1920 pixels; the composition scales them with the render.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { FPS } from "./core";
import type { Word } from "./words";

export type CaptionStyle = { y?: number; size?: number; color?: string; stroke?: string; maxChars?: number };

const FONT = "CaptionSans";
let fontP: Promise<void> | null = null;
const loadFont = () => {
  if (!fontP) {
    const f = new FontFace(FONT, `url(${staticFile("fonts/LiberationSans-Bold.ttf")})`, { weight: "700" });
    fontP = f.load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); });
  }
  return fontP;
};

/** caption cards: [start s, end s, text], built once per word list */
export const captionCards = (words: Word[], maxChars = 14): [number, number, string][] => {
  const clean = (w: string) => w.replace(/[.,;:"“”]+$/g, "").replace(/^["“]/, "");
  const cards: [number, number, string][] = [];
  for (let i = 0; i < words.length; i++) {
    const start = words[i].s;
    let text = clean(words[i].w), end = words[i].e;
    // glue a very short word to the next one when they are spoken together and still fit on one line
    while (i + 1 < words.length && clean(words[i].w).length <= 3 && words[i + 1].s - words[i].e < 0.12 &&
      (text + " " + clean(words[i + 1].w)).length <= maxChars && !/[.,;:!?]$/.test(words[i].w)) {
      i++; text += " " + clean(words[i].w); end = words[i].e;
    }
    cards.push([start, end, text]);
  }
  return cards;
};

export const Captions: React.FC<{ words: Word[]; style?: CaptionStyle }> = ({ words, style = {} }) => {
  const f = useCurrentFrame();
  const [handle] = useState(() => delayRender("caption font"));
  useEffect(() => { loadFont().then(() => continueRender(handle)); }, [handle]);
  const [cards] = useState(() => captionCards(words, style.maxChars ?? 14));
  const t = (f + 2) / FPS; // swap 2 frames before the word, like the reactions
  let cur: string | null = null;
  for (let i = 0; i < cards.length; i++) {
    const next = cards[i + 1]?.[0] ?? Infinity;
    // a card stays up from its onset until the next card (or 0.4 s after its end in a pause)
    if (t >= cards[i][0] && t < Math.min(next, cards[i][1] + 0.4)) { cur = cards[i][2]; break; }
  }
  if (!cur) return null;
  const size = style.size ?? 104, y = style.y ?? 0.66;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: `${y * 100}%`, transform: "translateY(-50%)", textAlign: "center",
        fontFamily: `${FONT}, "Liberation Sans", Arial, sans-serif`, fontWeight: 700, fontSize: size, lineHeight: 1.05,
        color: style.color ?? "#ffffff", WebkitTextStroke: `${Math.round(size * 0.16)}px ${style.stroke ?? "#000000"}`,
        paintOrder: "stroke fill", letterSpacing: 1, padding: "0 60px",
        textShadow: `0 ${Math.round(size * 0.06)}px 0 rgba(0,0,0,0.85)`,
      }}>{cur}</div>
    </AbsoluteFill>
  );
};
