// Top title banner plus centre-band word captions. Nothing is drawn below y=1536
// or in the right-hand platform column.
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
    if (cur.length && (punct || gap > 0.28 || cur.length >= 3 || next.length > 18)) flush();
    cur.push(w);
  }
  flush();
  return out;
};

const fit = (text: string, maxW: number, cap: number) => {
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return 64;
  let s = cap;
  while (s > 34) {
    c.font = `400 ${s}px ${FONT}`;
    if (c.measureText(text).width <= maxW) return s;
    s -= 2;
  }
  return s;
};

export const TitleBanner: React.FC<{ home: boolean }> = ({ home }) => {
  const text = home ? "What If You Never Left Home?" : "What If Dying in Roblox Sent You to Mom?";
  const maxW = 1080 - 48 - 200;
  const size = fit(text, maxW, home ? 54 : 40);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 6 }}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, height: 168,
        background: "linear-gradient(#14181f 0%, #14181f 128px, rgba(20,24,31,0) 168px)",
      }}>
        <div style={{
          margin: "28px 200px 0 48px",
          textAlign: "center",
          fontFamily: `${FONT}, "Arial Black", sans-serif`,
          fontSize: size,
          lineHeight: 1.05,
          color: "#fffdf8",
          WebkitTextStroke: "6px #14181f",
          paintOrder: "stroke fill",
          textShadow: "0 3px 0 #14181f",
        }}>
          {text}
          {home ? null : <span style={{ fontFamily: '"Noto Color Emoji", sans-serif', WebkitTextStroke: "0px", fontSize: size * 0.82 }}> 😳</span>}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RespawnTag: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 6 }}>
      <div style={{
        position: "absolute", top: 132, left: 48, right: 220, textAlign: "center",
        fontFamily: `${FONT}, "Arial Black", sans-serif`,
        fontSize: 28, color: "#fffdf8", letterSpacing: 0.5,
        WebkitTextStroke: "5px #14181f", paintOrder: "stroke fill",
      }}>Respawning...</div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ y: number }> = ({ y }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const phrases = useMemo(() => phrasesOf(WORDS), []);
  let phrase: Phrase | null = null;
  for (let i = 0; i < phrases.length; i++) {
    const start = phrases[i].words[0].s;
    const end = phrases[i].words[phrases[i].words.length - 1].e;
    const next = phrases[i + 1]?.words[0].s ?? Infinity;
    const until = i === phrases.length - 1 ? 100 : Math.min(next, end + 0.22);
    if (t >= start - 0.02 && t < until) { phrase = phrases[i]; break; }
  }
  if (!phrase) return null;
  const maxW = 1080 - 48 - 220;
  const size = fit(phrase.text, maxW, 78);
  const half = size * 0.62;
  // Centre band, always above the bottom 20% and under the title banner.
  const centerPx = Math.min(Math.max(y * 1920, 250 + half), 1536 - half - 10);
  const stroke = `${Math.max(7, Math.round(size * 0.09))}px #14181f`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 5 }}>
      <div style={{ position: "absolute", left: 48, right: 220, top: centerPx, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
        <div style={{
          textAlign: "center",
          fontFamily: `${FONT}, "Arial Black", sans-serif`,
          fontSize: size,
          lineHeight: 1.05,
          color: "#ffffff",
          WebkitTextStroke: stroke,
          paintOrder: "stroke fill",
          textShadow: "0 3px 0 #14181f",
          maxWidth: maxW,
        }}>
          {phrase.words.map((w, i) => {
            const active = t >= w.s - 0.03 && t < w.e + 0.04;
            return (
              <span key={i} style={{ color: active ? "#ffe14a" : "#ffffff" }}>
                {i ? " " : ""}{w.w}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
