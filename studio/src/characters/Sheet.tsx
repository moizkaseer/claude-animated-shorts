// Character sheet (a still, not a short): every concept in four poses. Render with
//   node scripts/stills.mjs CharacterSheet out/characters/sheet_ 0 1
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, bodySide, Expr } from "../engine/toon";
import { CONCEPTS } from "./concepts";

const POSES: { label: string; expr: Expr; side?: boolean }[] = [
  { label: "neutral", expr: "neutral" }, { label: "happy", expr: "grin" }, { label: "shocked", expr: "shock" }, { label: "walking", expr: "smile", side: true },
];

export const CharacterSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#f3ead8"; g.fillRect(0, 0, 1080, 1920);
    CONCEPTS.forEach((c, row) => {
      const y0 = row * 480;
      g.fillStyle = row % 2 ? "#ece0c8" : "#f3ead8"; g.fillRect(0, y0, 1080, 480);
      g.fillStyle = "#241726"; g.font = "bold 34px sans-serif"; g.fillText(c.name, 24, y0 + 44);
      g.font = "24px sans-serif"; g.fillText(c.pitch, 24, y0 + 76);
      POSES.forEach((pz, i) => {
        g.save();
        g.translate(i * 270 + 9, y0 + 72);
        g.scale(0.42, 0.42);
        const p = new Pen(g);
        if (pz.side) bodySide(p, c.o, { mode: "march", phase: 0.25, expr: pz.expr, stomp: 0.7, seed: c.seed });
        else bodyFront(p, c.o, { mode: "stand", expr: pz.expr, seed: c.seed, facing: i === 1 ? 1 : 0 });
        g.restore();
        g.fillStyle = "rgba(36,23,38,0.55)"; g.font = "20px sans-serif"; g.fillText(pz.label, i * 270 + 100, y0 + 470);
      });
    });
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
