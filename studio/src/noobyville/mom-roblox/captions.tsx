// Large outlined word captions. Active word is gold. Phrases stay out of the
// bottom 20% and the right-hand platform column.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { WORDS, type Word } from "./words";

const FONT = "TitanOne";

export type Phrase = { words: Word[]; text: string };

export const phrasesOf = (words: Word[]): Phrase[] => {
  const out: Phrase[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({ words: cur, text: cur.map((w) => w.w).join(" ") });
    cur = [];
  };
  for (const w of words) {
    const next = (cur.map((x) => x.w).join(" ") + " " + w.w).trim();
    const gap = cur.length ? w.s - cur[cur.length - 1].e : 0;
    const punct = cur.length > 0 && /[.!?]$/.test(cur[cur.length - 1].w);
    if (cur.length && (punct || gap > 0.22 || cur.length >= 3 || next.length > 22)) flush();
    cur.push(w);
  }
  flush();
  return out;
};

const fit = (text: string, maxW: number) => {
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return 72;
  let s = 104;
  while (s > 48) {
    c.font = `400 ${s}px ${FONT}`;
    if (c.measureText(text).width <= maxW) return s;
    s -= 2;
  }
  return s;
};

export const Captions: React.FC<{ y: number; bubble: boolean }> = ({ y, bubble }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const phrases = useMemo(() => phrasesOf(WORDS), []);
  let phrase: Phrase | null = null;
  for (let i = 0; i < phrases.length; i++) {
    const start = phrases[i].words[0].s;
    const end = phrases[i].words[phrases[i].words.length - 1].e;
    const next = phrases[i + 1]?.words[0].s ?? Infinity;
    const until = i === phrases.length - 1 ? 100 : Math.min(next, end + 0.28);
    if (t >= start - 0.04 && t < until) { phrase = phrases[i]; break; }
  }
  if (!phrase) return null;
  const maxW = 1080 - 36 - 220;
  const size = fit(phrase.text, maxW);
  // Keep the glyph block above the bottom 20% (y > 0.80) and under the top day chip.
  const half = size * 0.62;
  const centerPx = Math.min(Math.max(y * 1920, 150 + half), 1536 - half - 8);
  const stroke = `${Math.max(8, Math.round(size * 0.09))}px #141414`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 4 }}>
      <div style={{ position: "absolute", left: 36, right: 220, top: centerPx, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
        <div style={{
          textAlign: "center",
          fontFamily: `${FONT}, "Arial Black", sans-serif`,
          fontSize: size,
          lineHeight: 1.05,
          color: "#ffffff",
          WebkitTextStroke: stroke,
          paintOrder: "stroke fill",
          textShadow: "0 4px 0 #141414",
          background: bubble ? "#fffdf8" : "transparent",
          borderRadius: bubble ? 28 : 0,
          border: bubble ? "6px solid #141414" : "none",
          padding: bubble ? "8px 16px 14px" : 0,
          maxWidth: maxW,
        }}>
          {phrase.words.map((w, i) => {
            const active = t >= w.s - 0.04 && t < w.e + 0.03;
            return (
              <span key={`${w.s}-${w.w}`} style={{ color: active ? "#ffe14a" : (bubble ? "#1a1a1e" : "#ffffff"), WebkitTextStroke: bubble ? "0px transparent" : stroke }}>
                {w.w}{i < phrase.words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const DayChip: React.FC<{ day: string | null }> = ({ day }) => {
  if (!day) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 5 }}>
      <div style={{
        position: "absolute",
        top: 36,
        left: 36,
        fontFamily: `${FONT}, sans-serif`,
        fontSize: 34,
        color: "#ffe14a",
        background: "#1b1b1f",
        border: "3px solid #ffffff",
        borderRadius: 12,
        padding: "6px 12px 8px",
        letterSpacing: 0.5,
        WebkitTextStroke: "0px transparent",
      }}>{day}</div>
    </AbsoluteFill>
  );
};
