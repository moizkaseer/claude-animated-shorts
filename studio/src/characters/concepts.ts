// Candidate host characters for the channel (concept round 1, 2026-11-02). Our own designs, built from the engine's
// construction rules (bean head, 3.5 head-heights, stick limbs, plum ink); none is based on a reference character.
import type { Outfit } from "../engine/toon";

export type Concept = { key: string; name: string; pitch: string; o: Outfit; seed: number };
export const CONCEPTS: Concept[] = [
  { key: "professor", name: "A  The Professor", pitch: "deadpan, knows every weird fact", seed: 3,
    o: { jacket: "#8a6a4a", pants: "#3b3f52", boots: "#4a3426", build: "stout", hat: "tufts", hair: "#ece8e0",
      moustache: "#ece8e0", glasses: "#2a201a", bowtie: "#c0353a" } },
  { key: "explorer", name: "B  The Explorer", pitch: "goes to the place where it happened", seed: 5,
    o: { jacket: "#c9b07a", pants: "#6a5a3a", boots: "#5a3b2a", skin: "#f5c9a0", hat: "pith", scarf: "#e05a3a", bag: "#8a5a34" } },
  { key: "traveler", name: "C  The Time Traveler", pitch: "drops into any century", seed: 2,
    o: { jacket: "#2f5f6a", pants: "#3b3f52", boots: "#2a201a", skin: "#ecd0b6", hat: "hair", hair: "#2a2a3a", goggles: "#7fd0e0", bag: "#7a4b2a" } },
  { key: "kid", name: "D  The Curious Kid", pitch: "asks the question everyone has", seed: 6,
    o: { jacket: "#f2b134", pants: "#3b5b9a", boots: "#f4f1ea", skin: "#c99067", build: "kid", hat: "beanie", hatCol: "#3f6fb5", bag: "#c0353a" } },
];
