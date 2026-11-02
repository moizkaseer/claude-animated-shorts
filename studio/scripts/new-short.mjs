// Start a new short from the starter template.
// usage: node scripts/new-short.mjs <name> ["Title"]      (name: lowercase letters, digits, dashes)
// Creates src/shorts/<name>/ (copy of src/shorts/starter with its own composition id), registers it in
// src/shorts/index.ts, and creates media/<name>/ (SCRIPT.md template, voice/) and audio/shorts/<name>/ (a minimal
// sound setup: timeline.py, sfx.py, music.py, mixcfg.py to fill in).
import fs from "node:fs";
import path from "node:path";

const [name, title = name] = process.argv.slice(2);
if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) { console.error('usage: node scripts/new-short.mjs <name> ["Title"]  (lowercase, digits, dashes)'); process.exit(1); }
const dst = path.resolve(`src/shorts/${name}`);
if (fs.existsSync(dst)) { console.error(`src/shorts/${name} already exists`); process.exit(1); }
const camel = name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const Pascal = camel[0].toUpperCase() + camel.slice(1);

// ---- picture ----
fs.cpSync(path.resolve("src/shorts/starter"), dst, { recursive: true });
const idx = path.join(dst, "index.ts");
fs.writeFileSync(idx, fs.readFileSync(idx, "utf8")
  .replace(/^\/\/ Starter short.*$/m, `// ${title}`)
  .replace("export const starter: ShortDef", `export const ${camel}: ShortDef`)
  .replace('id: "StarterShort"', `id: "${Pascal}Short"`)
  .replace('title: "Starter"', `title: ${JSON.stringify(title)}`)
  .replace("import { starterSet } from", `import { starterSet as ${camel}Set } from`)
  .replace("set: starterSet,", `set: ${camel}Set,`));
const reg = path.resolve("src/shorts/index.ts");
let r = fs.readFileSync(reg, "utf8");
r = r.replace(/(import \{ \w+ \} from "\.\/[\w-]+";\n)(?!import \{ \w+ \} from)/, `$1import { ${camel} } from "./${name}";\n`);
r = r.replace(/export const SHORTS: ShortDef\[\] = \[([^\]]*)\];/, (_, l) => `export const SHORTS: ShortDef[] = [${l}, ${camel}];`);
fs.writeFileSync(reg, r);

// ---- media: script + voice ----
const media = path.resolve(`media/${name}`);
fs.mkdirSync(path.join(media, "voice"), { recursive: true });
fs.writeFileSync(path.join(media, "SCRIPT.md"), `# ${title}

## Facts (each with its source)
-

## Script (~3.7 words/s, 55-70 s; one sentence per line)
Hook: the absurd fact in one line.
Setting: year, place, pride.
Escalation, three or four beats, each a little bigger.
The snap.
Deadpan double line: "Luckily ... / Unluckily ...".
You see, one idea through an everyday analogy.
The consequence: the rule it created.
Callback twist.
`);

// ---- sound ----
const au = path.resolve(`audio/shorts/${name}`);
fs.mkdirSync(au, { recursive: true });
fs.writeFileSync(path.join(au, "timeline.py"), `# ${title}: the picture's timing for the sound (all from out/${name}/timeline.json, see audio/engine/tl.py).
from tl import *  # noqa: F401,F403  FPS, TOTAL, DUR, FLASH, SHOTS, XFADE, MARKERS, C, fr, shot_t, shot_at, markers, cam, cam_distance, dist_fx, hh, words
`);
fs.writeFileSync(path.join(au, "sfx.py"), `# ${title}: every sound effect + ambience bed as a cue list timed to the picture, rendered into one stereo SFX
# stem (copy patterns from audio/shorts/bridge/sfx.py: Cue(t, name, desc, gen, naive_LU, kind, pan, extra, lpf, send)).
import numpy as np
from dsp import ns, rng, pan, st, place, integrated, momentary_max, dbg, lp, hp, fades
import sfx_gen as G
import timeline as T

N = ns(T.DUR)


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, lpf=None, send=0.12, group=None):
        self.t, self.name, self.desc, self.gen, self.naive, self.kind, self.p = t, name, desc, gen, naive, kind, p
        self.extra, self.lpf, self.send, self.group, self.cut = extra, lpf, send, group or name, None
        self.applied = naive + (-6.0 if kind == "event" else 0.0) + extra
        self.measured = None


def cues():
    C = []
    # whoosh on every hard cut, e.g.:
    for f in T.CUTS:
        C.append(Cue(T.fr(f), "whoosh_cam", "camera cut", (lambda r=rng(f): (G.whoosh(0.6, r, 0.09, 330, 2000, 0.8, 0.18, 0.15), 0.09)), -11))
    return C


def render(v_ref, on_event=None):
    C = cues()
    out = np.zeros((2, N))
    for c in C:
        x, anchor = c.gen()
        x = pan(np.asarray(x, float), c.p) if np.ndim(x) == 1 else np.asarray(x, float)
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(v_ref + c.applied - cur)
        if c.lpf:
            x = lp(x, c.lpf, 1)
        c.measured = (momentary_max(x) if c.kind == "event" else integrated(x)) - v_ref
        place(out, x, c.t - anchor)
    return hp(out, 25, 2), C
`);
fs.writeFileSync(path.join(au, "music.py"), `# ${title}: the original score (see audio/shorts/bridge/music.py for a full march built from audio/engine/instruments.py).
# SECTIONS = (name, start s, end s) drive the mixer's per-section music levels (mixcfg.MUSIC_TARGET).
import numpy as np
from dsp import ns, rng, pan, place, integrated, dbg
import instruments as I
import timeline as T

N = ns(T.DUR)
SECTIONS = [("all", 0.0, T.DUR)]


class Band:
    def __init__(self):
        self.out = np.zeros((2, N))
        self.cues = []


def build():
    b = Band()
    r = rng(1)
    # placeholder: a soft pad chord every 4 s (replace with the real score)
    for k in range(int(T.DUR // 4)):
        place(b.out, I.pad([I.m2f(m) for m in (58, 62, 65)], 3.8, 0.4, r), 4.0 * k)  # pad() is already stereo
    b.cues.append((0.0, "placeholder pad"))
    return b


def render(b, ref=-20.0):
    L = integrated(b.out)
    return (b.out * dbg(ref - L) if np.isfinite(L) else b.out), {}
`);
fs.writeFileSync(path.join(au, "mixcfg.py"), `# ${title}: mix settings (audio/engine/mixer.py).
import timeline as T

TITLE = ${JSON.stringify(title)}
MUSIC_DESC = "original score"
MUSIC_TARGET = {"all": -10.0}   # music LU under the voice per music.SECTIONS section
SECTION_ALIAS = {}
SECTION_START = {}
HARD_SWITCH = ()
DIPS = []                       # (start s, end s, dB) music rides under quiet words
NOTES = ""
REPORT = [(f"shot {i}", *T.shot_t(i)) for i in T.SHOTS]
`);
console.log(`created src/shorts/${name} (composition ${Pascal}Short), media/${name}/SCRIPT.md, audio/shorts/${name}/
next: write media/${name}/SCRIPT.md, record media/${name}/voice/voice.wav + words.json (or python3 audio/tools/scratch_voice.py ${name} <script.txt>),
      then shots/cameras in src/shorts/${name}/story.ts, the set in set.ts, the cast in cast.ts.`);
