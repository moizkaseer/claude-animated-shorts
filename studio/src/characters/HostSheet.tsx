// The host's model sheet (a still): turnaround, every expression, the main poses. Check it after any design change:
//   node scripts/stills.mjs HostSheet out/characters/host_ 0 1
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, bodySide, Expr, FrontOpts } from "../engine/toon";
import { HOST, HOST_NAME, HOST_SEED } from "./host";

const EXPRS: Expr[] = ["neutral", "stern", "smile", "smile_closed", "grin", "laugh", "whistle", "nervous", "shock", "relief", "relief_open", "dazed", "pained", "lick"];

export const HostSheet: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#f3ead8"; g.fillRect(0, 0, 1080, 1920);
    const ink = "#241726";
    const draw = (x: number, y: number, k: number, fn: (p: Pen) => void, label?: string) => {
      g.save(); g.translate(x, y); g.scale(k, k); fn(new Pen(g)); g.restore();
      if (label) { g.fillStyle = "rgba(36,23,38,0.6)"; g.font = "18px sans-serif"; g.textAlign = "center"; g.fillText(label, x + 300 * k, y + 1000 * k + 16); g.textAlign = "left"; }
    };
    const front = (o: FrontOpts) => (p: Pen) => bodyFront(p, HOST, { seed: HOST_SEED, mode: "stand", ...o });
    g.fillStyle = ink; g.font = "bold 40px sans-serif"; g.fillText(HOST_NAME, 28, 54);
    g.font = "22px sans-serif"; g.fillText("channel host: model sheet", 28, 86);
    // turnaround
    const k1 = 0.5;
    draw(-20, 100, k1, front({ facing: -1 }), "3/4 left");
    draw(250, 100, k1, front({}), "front");
    draw(520, 100, k1, front({ facing: 1 }), "3/4 right");
    draw(790, 100, k1, (p) => bodySide(p, HOST, { seed: HOST_SEED, mode: "stand" }), "side");
    // poses
    g.fillStyle = ink; g.font = "bold 26px sans-serif"; g.fillText("poses", 28, 640);
    draw(-20, 640, k1, front({ wave: 0, expr: "smile", facing: 1 }), "explain");
    draw(250, 640, k1, (p) => bodySide(p, HOST, { seed: HOST_SEED, mode: "march", phase: 0.25, stomp: 0.6, expr: "neutral" }), "walk");
    draw(520, 640, k1, front({ mode: "sit", expr: "smile_closed" }), "sit");
    draw(790, 640, k1, front({ mode: "fall", expr: "shock" }), "fall");
    // expressions: heads only (the top 45 % of the card)
    g.fillStyle = ink; g.font = "bold 26px sans-serif"; g.fillText("expressions", 28, 1190);
    EXPRS.forEach((e, i) => {
      const cx = (i % 5) * 216, cy = 1200 + Math.floor(i / 5) * 240;
      g.save(); g.beginPath(); g.rect(cx, cy, 216, 230); g.clip();
      draw(cx - 50, cy - 40, 0.5, front({ expr: e }));
      g.restore();
      g.fillStyle = "rgba(36,23,38,0.6)"; g.font = "18px sans-serif"; g.textAlign = "center"; g.fillText(e, cx + 108, cy + 226); g.textAlign = "left";
    });
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
