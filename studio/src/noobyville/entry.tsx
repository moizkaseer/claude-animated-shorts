// Separate Remotion root for the Noobyville review. Not registered with the
// Professor shorts, so bridge / pisa / starter stay untouched.
import React from "react";
import { Composition, registerRoot } from "remotion";
import { Film } from "./mom-roblox/Film";

export const RemotionRoot: React.FC = () => (
  <Composition id="MomRobloxReview" component={Film} durationInFrames={889} fps={30} width={1080} height={1920} />
);

registerRoot(RemotionRoot);
