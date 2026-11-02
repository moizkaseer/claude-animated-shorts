// Kenney CC0 models (https://kenney.nl: Nature Kit, Fantasy Town Kit, ...) as GLB files in
// public/kit/kenney/<name>.glb. Missing files are skipped (logged once), so a short still renders without them.
// Trees, bushes, hedges and banners never need a file: build.ts draws them procedurally.
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { staticFile } from "remotion";
import type { Kit } from "./build";

const cache = new Map<string, Promise<Kit>>();
export const loadKit = (names: string[] = []) => {
  const key = names.join("|");
  let p = cache.get(key);
  if (!p) {
    const loader = new GLTFLoader();
    p = Promise.all(names.map((n) => loader.loadAsync(staticFile(`kit/kenney/${n}.glb`)).then((g) => [n, g.scene] as const).catch(() => [n, null] as const)))
      .then((list) => {
        const miss = list.filter((e) => !e[1]).map((e) => e[0]);
        if (miss.length) console.warn(`kit: ${miss.length} Kenney models missing in public/kit/kenney/ (skipped): ${miss.join(", ")}`);
        return Object.fromEntries(list.filter((e) => e[1]).map(([n, s]) => [n, s!])) as Kit;
      });
    cache.set(key, p);
  }
  return p;
};
