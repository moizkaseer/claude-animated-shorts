# Sound effects + ambience beds for "The Tower Saved by Wars", placed from the picture (out/pisa/timeline.json) and
# the narration's words (timeline.py), rendered into one stereo SFX stem. Level rule as the bridge: each EVENT has a
# naive level (LU vs the voice, as its max momentary loudness) and sits SFX_DB = -6 dB under it; BEDS are integrated.
import numpy as np
from dsp import ns, tt, rng, dbg, lp, hp, bp, pan, st, place, fades, colored, momentary_max, integrated, make_ir, convolve_st, smooth_noise
import sfx_gen as G
import timeline as T

N = ns(T.DUR)
SFX_DB = -6.0


def mixsig(*parts):
    """sum mono / stereo signals of different lengths (padded to the longest)"""
    xs = [st(np.asarray(x, float)) for x in parts]
    out = np.zeros((2, max(x.shape[1] for x in xs)))
    for x in xs:
        out[:, :x.shape[1]] += x
    return out


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, lpf=None, send=0.12, group=None):
        self.t, self.name, self.desc, self.gen, self.naive, self.kind, self.p = t, name, desc, gen, naive, kind, p
        self.extra, self.lpf, self.send, self.group, self.cut = extra, lpf, send, group or name, None
        self.applied = naive + (SFX_DB if kind == "event" else 0.0) + extra
        self.measured = None


def _bed(dur, r, birds=0.4, breeze=1.0, kind="day"):
    n = ns(dur)
    x = G.breeze(dur, r, breeze, 0.15, 850)
    if birds:
        x += pan(G.bird_chirps(dur, r, birds, "sparrow" if kind == "day" else "blackbird") * 0.07, 0.5)
    if kind == "room":
        x = st(bp(colored(n, r, 1.0), 60, 900, 1) * 0.15)                     # quiet room tone
    if kind == "machine":
        x += st(lp(colored(n, r, 1.2), 300, 2) * 0.6 * (0.85 + 0.15 * smooth_noise(n, r, 2.0)))
    return fades(x, 0.3, 0.4), 0.0


def cues():
    C, R = [], rng(1173)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append
    shots = sorted(T.SHOTS)
    # ---------------- beds per shot (outdoor day / golden / room / machines)
    for i in shots:
        a, b = T.A(i), T.B(i)
        x = T.XFADE.get(i + 1, 0) / 30
        dur = b - a + x / 2 + 0.3
        kind = "room" if T.era(i) == "room" else "machine" if T.era(i) == "1990" else "day"
        birds = 0.0 if kind != "day" else (0.25 if T.SHOTS[i]["light"] == "golden" else 0.45)
        add(Cue(a, f"bed{i}", f"ambience shot {i} ({kind})", (lambda r=rr(), d=dur, k=kind, bi=birds: _bed(d, r, bi, 1.0, k)),
                -30 if kind != "machine" else -24, "bed", send=0.0))
    # ---------------- shot changes: whooshes on cuts, softer on crossfades
    for i in shots[1:]:
        soft = i in T.XFADE
        add(Cue(T.A(i), "whoosh", f"into shot {i}", (lambda r=rr(), s=soft: (G.whoosh(0.7 if s else 0.5, r, 0.3 if s else 0.09, 300, 1800 if s else 2200, 0.8, 0.2, 0.12), 0.3 if s else 0.09)),
                -14 if soft else -11, send=0.12, group="whoosh"))
    add(Cue(T.FLASH, "flash", "reverse swell into the white flash", (lambda r=rr(): (G.whoosh(0.7, r, 0.33, 500, 4200, 0.9, 0.09, 0.4), 0.33)), -6, send=0.2))
    # ---------------- hammers (cast.ts: builders i strike at phase i*0.3 / i*0.4)
    strikes = []
    strikes += [t for i in range(3) for t in T.hammer_strikes(T.A(2), T.WAR_HOOK, i * 0.3)]
    strikes += [t for i in (0, 2) for t in T.hammer_strikes(T.A(3), T.B(3), i * 0.4)]
    strikes += [t for i in range(3) for t in T.hammer_strikes(T.A(6), T.WAR, i * 0.3)]
    strikes += [t for i in range(2) for t in T.hammer_strikes(T.A(8), T.B(8), i * 0.4)]
    for t in sorted(strikes):
        add(Cue(t, "hammer", "builder's hammer on stone", (lambda r=rr(): (G.hammer_hit(r, 0.7), 0.0)), -14, p=float(R.uniform(-0.4, 0.4)), send=0.18, group="hammer"))
    # ---------------- the tip: a long deep stone groan + grit
    add(Cue(T.TIP, "tip_groan", "the tower starts to tip: deep stone groan", (lambda r=rr(): (G.creak(1.4, r, 35, 70, G.TIMBER, [(0, 0), (0.25, 1), (0.8, 0.7), (1, 0)], 0.25, 0.08) * 1.0, 0.1)), -4, send=0.25))
    add(Cue(T.TIP + 0.1, "tip_grit", "grit trickling", (lambda r=rr(): (G.rattle(1.0, r, 18), 0.0)), -16, send=0.2))
    # ---------------- mud: squelch + bubbles
    add(Cue(T.A(5) + 0.4, "mud", "wet mud squelching round the base", (lambda r=rr(): (G.bubbles(2.5, r, 9, 150, 900, (0.02, 0.06)), 0.0)), -14, send=0.1))
    # ---------------- soldiers marching off (2 steps/s)
    for t0, t1 in [(T.WAR_HOOK, T.A(3)), (T.WAR, T.A(7))]:
        k = 0
        while t0 + k * 0.5 < t1:
            add(Cue(t0 + k * 0.5, "march", "three soldiers marching off", (lambda r=rr(), f=k % 2: G.column_stomp(r, 0.8, f, boots=3, width=0.4, boom_gain=0.2)),
                    -13, send=0.15, group="march"))
            k += 1
    # ---------------- the messenger: wet running steps, drips, a groan, dazed
    for k in range(8):
        add(Cue(T.A(10) + 0.1 + k * 0.28, "wet_step", "soaked messenger running in", (lambda r=rr(): (mixsig(G.stroll_step(r, 0.2), G.bubbles(0.2, r, 30, 600, 2400, (0.004, 0.02)) * 0.4), 0.0)),
                -14, p=-0.4 + 0.08 * k, send=0.12, group="wet_step"))
    add(Cue(T.A(10) + 2.4, "groan", "messenger groans", (lambda r=rr(): (G.oof(r, "ugh"), 0.0)), -12, send=0.15))
    # ---------------- 1934: truck engine + pump, the lurch
    add(Cue(T.A(11), "truck", "1930s cement truck idling + pump glugging", (lambda r=rr(), d=T.A(14) - T.A(11): (mixsig(lp(colored(ns(d), r, 1.5), 180, 2) * (0.7 + 0.3 * np.sin(2 * np.pi * 11 * tt(d))), G.bubbles(d, r, 3, 80, 400, (0.03, 0.08)) * 0.6), 0.0)),
            -24, "bed", send=0.05))
    add(Cue(T.LURCH, "lurch", "the tower lurches: deep crack + groan", (lambda r=rr(): (mixsig(G.wood_crack(r) * 0.6, G.creak(1.0, r, 30, 50, G.TIMBER, None, 0.3)), 0.0)), -3, send=0.25))
    # ---------------- the sponge
    for k in range(6):
        add(Cue(T.SQUEEZE_SLOW + 0.3 + k * 0.3, "drip", "water dripping out of the sponge", (lambda r=rr(): (G.clink(r, r.uniform(1800, 2600), 0.08, 0.5), 0.0)), -18, p=0.3, send=0.15, group="drip"))
    add(Cue(T.SQUEEZE_FAST, "splat", "fast squeeze: the sponge squishes out sideways", (lambda r=rr(): (lp(G.splash_big(r), 3000, 1) * 0.5, 0.0)), -8, p=0.3, send=0.15))
    # ---------------- what if: rising whoosh as it builds, fall, crash + rubble
    add(Cue(T.A(17) + 0.85, "build_up", "the tower shoots up all at once", (lambda r=rr(): (G.whoosh(0.9, r, 0.8, 300, 3000, 0.9, 0.1, 0.2), 0.8)), -8, send=0.15))
    add(Cue(T.CRASH, "fall_air", "air rush of the falling tower", (lambda r=rr(): (G.whoosh(0.8, r, 0.75, 200, 1400, 1.0, 0.05, 0.1), 0.75)), -6, send=0.1))
    add(Cue(T.CRASH, "crash", "it crashes: stone impact + boom", (lambda r=rr(): (mixsig(G.wood_crack(r), np.exp(-tt(1.6) / 0.35) * np.sin(2 * np.pi * 48 * tt(1.6)) * 0.9), 0.0)), 0, send=0.3))
    add(Cue(T.CRASH + 0.15, "rubble", "rubble settling", (lambda r=rr(): (G.rattle(1.6, r, 40, heavy=True), 0.0)), -10, send=0.3))
    # ---------------- 1990: the drill
    add(Cue(T.s("pulled soil"), "drill", "auger pulling soil out", (lambda r=rr(): (mixsig(G.rattle(2.4, r, 26, heavy=True) * 0.6, bp(colored(ns(2.4), r, 0.5), 150, 900, 2) * 0.4), 0.0)), -12, p=-0.4, send=0.1))
    # ---------------- tourists: chatter + laughs + camera clicks
    add(Cue(T.A(19), "tourists", "tourists chatting and laughing", (lambda r=rr(), d=T.A(20) - T.A(19) + 0.3: (mixsig(*[pan(lp(G.babble(d, r, r.uniform(120, 260), r.uniform(1.0, 1.3)), 3000, 1) * 0.5, r.uniform(-0.7, 0.7)) for _ in range(5)]), 0.0)),
            -16, send=0.3))
    for k in range(3):
        add(Cue(T.A(19) + 0.6 + k * 0.7, "click", "camera shutter", (lambda r=rr(): (mixsig(G.clink(r, 4200, 0.04, 1.2), np.pad(G.clink(r, 3000, 0.04, 1.0), (ns(0.05), 0))), 0.0)), -16, p=0.3, send=0.1, group="click"))
    return C


def render(v_ref, on_event=None):
    C = cues()
    out, send = np.zeros((2, N)), np.zeros(N)
    for c in C:
        x, anchor = c.gen()
        x = np.asarray(x, float)
        x = pan(x, c.p) if x.ndim == 1 else x
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(v_ref + c.applied - cur)
        if c.lpf:
            x = lp(x, c.lpf, 1)
        c.measured = (momentary_max(x) if c.kind == "event" else integrated(x)) - v_ref
        place(out, x, c.t - anchor)
        if c.send > 0:
            G._place_mono(send, c.send * x.mean(0), c.t - anchor)
    out += 0.5 * convolve_st(send, make_ir(1.2, 31, pre=0.012, hf=1.5))
    out = hp(out, 25, 2)
    end = ns(T.DUR - 0.12)
    out[:, end:] *= np.linspace(1, 0, N - end)[None, :] ** 2
    return out, C
