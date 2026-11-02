import React from "react";
import { Composition } from "remotion";
import { SHORTS } from "./shorts";
import { makeShort } from "./engine/Short";
import { FPS } from "./engine/core";
import { CharacterSheet } from "./characters/Sheet";
import { HostSheet } from "./characters/HostSheet";

const COMPONENTS = SHORTS.map((def) => ({ def, C: makeShort(def) }));

export const Root: React.FC = () => (
  <>
    {COMPONENTS.map(({ def, C }) => (
      <Composition key={def.id} id={def.id} component={C} durationInFrames={def.frames} fps={FPS} width={1080} height={1920} />
    ))}
    <Composition id="HostSheet" component={HostSheet} durationInFrames={1} fps={FPS} width={1080} height={1920} />
    <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
