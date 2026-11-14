// Separate Remotion root for this Short. The earlier Mom Roblox review keeps
// its own entry and is not registered here.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { Film } from "./Film";
import { FRAMES, FPS } from "./director";

export const RemotionRoot: React.FC = () => (
  <Composition id="DieToMom" component={Film} durationInFrames={FRAMES} fps={FPS} width={1080} height={1920} />
);

registerRoot(RemotionRoot);
