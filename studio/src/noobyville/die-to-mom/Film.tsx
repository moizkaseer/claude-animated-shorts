import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { apply, buildWorld } from "./build";
import { Captions, RespawnTag, TitleBanner } from "./captions";
import { direct } from "./director";

const loadFont = () => {
  const f = new FontFace("TitanOne", `url(${staticFile("fonts/TitanOne-Regular.ttf")})`);
  return f.load().then((ff) => {
    (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff);
  });
};

const Scene: React.FC<{ frame: number }> = ({ frame }) => {
  const world = useMemo(() => buildWorld(), []);
  const { camera, scene } = useThree();
  apply(world, direct(frame), camera as THREE.PerspectiveCamera, scene, frame);
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
    <AbsoluteFill style={{ background: "#3aa0e0" }}>
      {ready && (
        <ThreeCanvas
          width={width}
          height={height}
          gl={{ antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
          camera={{ fov: 48, near: 0.08, far: 240, position: [0, 2.4, 7] }}
        >
          <Scene frame={frame} />
        </ThreeCanvas>
      )}
      {ready && <TitleBanner home={state.titleHome} />}
      {ready && <RespawnTag show={state.respawn} />}
      {ready && <Captions y={state.captionY} />}
    </AbsoluteFill>
  );
};
