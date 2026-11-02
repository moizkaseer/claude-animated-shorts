// Every short in the studio. Add a new one here (and nowhere else) to get a composition and a timeline export.
import type { ShortDef } from "../engine/short";
import { bridge } from "./bridge";
import { starter } from "./starter";
import { pisa } from "./pisa";

export const SHORTS: ShortDef[] = [bridge, starter, pisa];
