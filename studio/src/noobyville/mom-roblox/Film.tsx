// Noobyville review short. Separate from the Professor / Wobbly History pipeline:
// its own entry, its own block characters, the supplied am_liam narration.
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { apply, buildWorld } from "./build";
import { Captions, DayChip } from "./captions";
import { direct } from "./director";

const FONT = "TitanOne";
let fontP: Promise<void> | null = null;
const loadFont = () => {
  if (!fontP) {
    const f = new FontFace(FONT, `url(${staticFile("fonts/TitanOne-Regular.ttf")})`);
    fontP = f.load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); }).then(() => undefined);
  }
  return fontP;
};

const Scene: React.FC<{ frame: number }> = ({ frame }) => {
  const world = useMemo(() => buildWorld(), []);
  const { camera, scene } = useThree();
  const state = direct(frame);
  apply(world, state, camera as THREE.PerspectiveCamera, scene, frame);
  return <primitive object={world.root} />;
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("titan-one"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadFont().then(() => { setReady(true); continueRender(handle); }).catch(() => { setReady(true); continueRender(handle); });
  }, [handle]);
  const state = direct(frame);
  return (
    <AbsoluteFill style={{ background: "#8fd0e4" }}>
      {ready && (
        <ThreeCanvas
          width={width}
          height={height}
          gl={{ antialias: true, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace, powerPreference: "high-performance" }}
          camera={{ fov: 42, near: 0.08, far: 420, position: [0, 2, 6] }}
        >
          <Scene frame={frame} />
        </ThreeCanvas>
      )}
      {ready && <Captions y={state.captionY} bubble={state.bubble} />}
      {ready && <DayChip day={state.day} />}
    </AbsoluteFill>
  );
};
