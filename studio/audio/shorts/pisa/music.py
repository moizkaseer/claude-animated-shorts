# Original score for "The Tower Saved by Wars": one tune (D dorian, 108 bpm) arranged per era, every section placed
# from the picture's shots (out/pisa/timeline.json) and the narration's words, so it re-times with the voice.
#   hook: fife + lute dance, tabor; a drum march as the builders turn into soldiers; button on the white flash
#   1173 build: lute arpeggios + soft fife | the tip: stop, low drone | mud: low pizzicato | war: drum march
#   hundred years: slow drone + music-box clock | back: bouncy lute reprise, comic slide on "banana"
#   sea battle: timpani roll + sad brass fall | 1934: oom-pah brass band, button on "Luckily", wah-wah on "Unluckily"
#   classroom: pizzicato + vibes, curious | what-if: rising roll, cut before the crash | 1990: mechanical pulse
#   ending: warm reprise on vibes + fife, final chord on "three wars".
import numpy as np
from dsp import ns, rng, pan, place, dbg, make_ir, convolve_st, integrated, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 60 / 108
F = I.m2f
R = rng(1173)


def _r():
    return rng(int(R.integers(1 << 30)))


# theme (beats, length, midi): D dorian, 2 bars
THEME = [(0, 1, 74), (1, .5, 77), (1.5, .5, 79), (2, 1, 81), (3, 1, 84), (4, .5, 81), (4.5, .5, 79), (5, 1, 77), (6, 1, 76), (7, 1, 74)]
CHORDS = {"Dm": [50, 57, 62, 65], "C": [48, 55, 60, 64], "Am": [45, 52, 57, 60], "G": [43, 50, 55, 59], "F": [41, 48, 53, 57],
          "D": [50, 57, 62, 66], "A7": [45, 52, 55, 61]}
PROG = ["Dm", "C", "Dm", "Am"]


class Band:
    def __init__(self):
        self.tr, self.send, self.cues = {}, {}, []

    def add(self, name, x, t, p=0.0, g=1.0, send=0.15):
        if name not in self.tr:
            self.tr[name], self.send[name] = np.zeros((2, N)), send
        if t < T.DUR:
            place(self.tr[name], pan(x, p) if np.ndim(x) == 1 else x, t, g)


def tune(b, name, t0, t1, fn, vel, transpose=0, p=0.0):
    """loop the theme from t0, cut at t1"""
    k = 0
    while True:
        for (bt, d, m) in THEME:
            t = t0 + (k * 8 + bt) * Q
            if t >= t1:
                return
            m += transpose
            x = (I.fife(F(m), d * Q * 0.9, vel * R.uniform(0.93, 1.04), _r()) if fn == "fife" else
                 I.glock(F(m), vel, _r()) if fn == "glock" else
                 I.vibes(F(m), vel, _r(), dur=1.2, damp=d * Q + 0.3) if fn == "vibes" else
                 I.musicbox(F(m), vel, _r()))
            b.add(name, x, t, p)
        k += 1


def lute(b, t0, t1, vel, pattern="strum", prog=PROG, transpose=0):
    """plucked lute: strums on beats 1/3 (strum) or rolling 8th arpeggios (arp), one chord per bar"""
    k = 0
    while t0 + k * Q < t1:
        bar, beat = divmod(k, 4)
        c = [m + transpose for m in CHORDS[prog[bar % len(prog)]]]
        t = t0 + k * Q
        if pattern == "strum":
            if beat in (0, 2):
                for j, m in enumerate(c):
                    b.add("lute", I.pluck(F(m), vel * (1 if beat == 0 else 0.8), _r(), dur=1.1, bright=0.45), t + 0.012 * j, 0.2 - 0.1 * j)
            else:
                b.add("lute", I.pluck(F(c[2] + 12), vel * 0.55, _r(), dur=0.5, bright=0.5), t, 0.25)
        else:  # arp: 8ths
            for h in (0, 1):
                m = c[(beat * 2 + h) % 4] + (12 if (beat * 2 + h) % 4 > 1 else 0)
                b.add("lute", I.pluck(F(m), vel * (0.9 if h == 0 else 0.7), _r(), dur=0.7, bright=0.5), t + h * Q / 2, 0.15)
        if beat == 0:
            b.add("bass", I.pluck(F(c[0] - 12), vel * 1.1, _r(), dur=1.4, bright=0.25), t, -0.1)
        k += 1


def tabor(b, t0, t1, vel, march=False):
    k = 0
    while t0 + k * Q / 2 < t1:
        t, s = t0 + k * Q / 2, k % 8
        hit = (s in (0, 3, 4, 6)) if not march else (s in (0, 2, 4, 5, 6))
        if hit:
            b.add("drum", I.snare(vel * (1.0 if s in (0, 4) else 0.6), _r(), dur=0.2, tune=0.55, snappy=0.25 if not march else 0.8), t, 0.05)
        if march and s in (0, 4):
            b.add("drum", I.timpani(F(38), vel * 0.7, _r(), dur=0.6), t, -0.05)
        k += 1


def drone(b, t0, t1, ms, vel, att=0.6):
    if t1 > t0 + 0.1:
        b.add("pad", I.pad([F(m) for m in ms], t1 - t0, vel, _r(), att=att, rel=0.8), t0, 0.0)


def oompah(b, t0, t1, vel):
    """1930s town band: tuba on 1/3, horns on 2/4, D major I-V"""
    k = 0
    while t0 + k * Q < t1:
        bar, beat = divmod(k, 4)
        c = CHORDS["D"] if bar % 2 == 0 else CHORDS["A7"]
        t = t0 + k * Q
        if beat in (0, 2):
            b.add("tuba", I.brass(F(c[0] - 12 + (7 if beat == 2 else 0)), 0.3, vel, _r(), "tuba"), t, -0.1)
        else:
            for j, m in enumerate(c[1:]):
                b.add("horns", I.brass(F(m), 0.16, vel * 0.6, _r(), "horn", scoop=-12), t + 0.004 * j, 0.3 - 0.1 * j)
        k += 1


def cutoff(b, t, names=None, fade=0.03):
    """silence the band from t (a hard stop on a word)"""
    g = np.ones(N)
    a = ns(t)
    g[a:a + ns(fade)] = np.linspace(1, 0, ns(fade))[: max(0, min(ns(fade), N - a))]
    g[a + ns(fade):] = 0
    for k in b.tr:
        if names is None or k in names:
            b.tr[k] *= g[None, :]


def resume(b, t, x):
    """music placed after a cutoff: build it in a fresh band and merge (so the cutoff does not touch it)"""
    for k, v in x.tr.items():
        if k not in b.tr:
            b.tr[k], b.send[k] = np.zeros((2, N)), x.send[k]
        b.tr[k] += v * (np.arange(N) >= ns(t))[None, :]


A, Bn = T.A, T.B
SECTIONS = [("hook", 0.0, A(3)), ("build", A(3), A(5)), ("war", A(5), A(7)), ("hundred", A(7), A(8)), ("back", A(8), A(10)),
            ("battle", A(10), A(11)), ("band", A(11), A(14)), ("class", A(14), A(17)), ("whatif", A(17), A(18)),
            ("fix", A(18), A(19)), ("end", A(19), T.DUR)]


def build():
    b = Band()
    # ---- hook: dance, then march from "go to war"; button on the flash
    tune(b, "fife", 0.1, A(3), "fife", 0.55)
    lute(b, 0.1, A(3), 0.55)
    tabor(b, 0.1, T.WAR_HOOK, 0.35)
    tabor(b, T.WAR_HOOK, A(3), 0.5, march=True)
    cutoff(b, T.FLASH - 0.02)
    hit = Band()
    for m in CHORDS["Dm"]:
        hit.add("horns", I.brass(F(m + 12), 0.25, 0.7, _r(), "stab", scoop=-15), T.FLASH, (m - 55) / 20)
    hit.add("drum", I.timpani(F(38), 0.8, _r()), T.FLASH, 0.0)
    hit.add("glock", I.glock(F(86), 0.5, _r()), T.FLASH, -0.3)
    b.cues += [(0.1, "hook: fife + lute dance, tabor"), (T.WAR_HOOK, "drum march as the builders become soldiers"), (T.FLASH, "button on the white flash")]
    # ---- 1173: proud building music, stops dead on "to tip"
    lute(hit, A(3) + 0.05, T.TIP, 0.5, "arp")
    tune(hit, "fife", A(3) + 0.05 + 8 * Q, T.TIP, "fife", 0.4)
    cutoff(hit, T.TIP - 0.03)
    resume(b, T.FLASH, hit)
    b.cues.append((A(3), "1173: lute arpeggios, then the fife; dead stop on 'to tip'"))
    # ---- after the tip: low drone, mud pizzicato, then the war march from "goes to war"
    after = Band()
    drone(after, T.TIP + 0.4, A(6), [38, 45, 50], 0.45)
    for k in range(int((A(6) - A(5)) / Q)):
        after.add("bass", I.pluck(F([38, 41, 38, 36][k % 4]), 0.6, _r(), dur=0.6, bright=0.2), A(5) + k * Q, -0.1)
    tabor(after, A(6), T.WAR, 0.3)
    tabor(after, T.WAR, A(7), 0.6, march=True)
    tune(after, "fife", T.WAR, A(7), "fife", 0.5)
    # ---- a hundred years: drone + music-box clock ticking fast (time flying)
    drone(after, A(7) - 0.1, A(8) + 0.3, [50, 57, 62, 65], 0.5, att=0.3)
    for k in range(int((A(8) - A(7)) / (Q / 2))):
        after.add("glock", I.musicbox(F([86, 81][k % 2]), 0.35, _r()), A(7) + k * Q / 2, 0.3)
    # ---- back: bouncy reprise (a fourth higher), comic slide on "banana"
    tune(after, "fife", A(8), A(10), "fife", 0.5, transpose=5)
    lute(after, A(8), A(10), 0.55, "strum", ["Dm", "C", "F", "C"], transpose=5)
    tabor(after, A(8), A(10), 0.3)
    after.add("horns", I.brass(F(67), 0.7, 0.7, _r(), "horn", scoop=0, fall=-9), T.BANANA + 0.15, 0.2)  # sliding "wahhh"
    # ---- sea battle: timpani roll, then a sad falling brass
    for k in range(10):
        after.add("drum", I.timpani(F(38), 0.25 + 0.06 * k, _r(), dur=0.5), A(10) + k * 0.09, 0.0)
    after.add("horns", I.brass(F(62), 0.9, 0.6, _r(), "horn", scoop=0, fall=-5), T.s("sea battle") + 0.3, 0.0)
    drone(after, A(10) + 1.0, A(11), [38, 45], 0.35)
    resume(b, T.TIP, after)
    b.cues += [(A(6), "war march"), (A(7), "a hundred years: drone + ticking music box"), (A(8), "reprise a 4th up"),
               (T.BANANA, "comic brass slide on 'banana'"), (A(10), "timpani roll + sad brass on the sea battle")]
    # ---- 1934: oom-pah band; "Luckily" button; "Unluckily" stop + wah-wah
    band = Band()
    oompah(band, A(11), T.s("Unluckily"), 0.55)
    tune(band, "fife", A(11) + 4 * Q, T.s("Unluckily"), "glock", 0.4, transpose=12)
    cutoff(band, T.s("Unluckily") - 0.03)
    for j, m in enumerate([62, 61, 60, 59]):
        band.add("horns", I.brass(F(m), 0.42 if j < 3 else 1.0, 0.65, _r(), "horn", scoop=-20, fall=-3 if j == 3 else 0), T.LURCH + 0.25 + j * 0.42, 0.0)
    resume(b, A(11), band)
    b.cues += [(A(11), "1934: oom-pah town band"), (T.s("Unluckily"), "dead stop, then a descending wah-wah as it leans more")]
    # ---- classroom: pizzicato + vibes
    cls = Band()
    for k in range(int((A(17) - A(14)) / Q)):
        cls.add("bass", I.pluck(F([50, 57, 53, 57][k % 4] - 12), 0.5, _r(), dur=0.5, bright=0.3), A(14) + k * Q, -0.1)
    tune(cls, "vibes", A(14) + 2 * Q, A(17), "vibes", 0.45, transpose=0)
    for t in (T.SQUEEZE_SLOW, T.SQUEEZE_FAST):
        cls.add("glock", I.glock(F(93), 0.4, _r()), t, 0.3)
    # ---- what-if: rising roll, cut right before the crash
    for tt, v in I.snare_roll(A(17) + 0.2, T.CRASH - 0.05, 0.1, 0.8, _r()):
        cls.add("drum", I.snare(v, _r(), dur=0.12, buzz=True), tt, 0.05)
    cutoff(cls, T.CRASH - 0.04)
    resume(b, A(14), cls)
    # ---- 1990: mechanical pulse; ending reprise; final chord on "three wars"
    fin = Band()
    for k in range(int((A(19) - A(18)) / (Q / 2))):
        fin.add("bass", I.pluck(F([38, 38, 45, 38][k % 4]), 0.45, _r(), dur=0.25, bright=0.3), A(18) + k * Q / 2, -0.1)
        if k % 4 == 2:
            fin.add("glock", I.glock(F(81), 0.25, _r(), dur=0.4), A(18) + k * Q / 2, 0.3)
    tune(fin, "vibes", A(19), T.END_WORD - 0.3, "vibes", 0.55)
    tune(fin, "fife", A(19) + 8 * Q, T.END_WORD - 0.3, "fife", 0.35)
    lute(fin, A(19), T.END_WORD - 0.3, 0.45, "arp")
    drone(fin, A(19), T.END_WORD, [50, 57, 62], 0.35)
    for j, m in enumerate([50, 57, 62, 65, 69]):
        fin.add("vibes", I.vibes(F(m), 0.45, _r(), dur=1.4), T.END_WORD - 0.05 + 0.02 * j, 0.2 - 0.1 * j)
    fin.add("glock", I.glock(F(86), 0.45, _r()), T.END_WORD, -0.2)
    resume(b, A(18), fin)
    b.cues += [(A(14), "classroom: pizzicato + vibes, glock ting on each squeeze"), (A(17), "rising roll, cut before the crash"),
               (A(18), "1990: mechanical pulse"), (A(19), "warm reprise"), (T.END_WORD, "final D minor chord on 'three wars'")]
    end = np.ones(N)
    a = ns(T.DUR - 0.4)
    end[a:] = np.linspace(1, 0, N - a) ** 1.5
    for k in b.tr:
        b.tr[k] *= end[None, :]
    return b


TARGET = {"fife": 0.0, "lute": -3.0, "bass": -4.0, "drum": -6.0, "pad": -5.0, "glock": -7.0, "horns": -3.0, "tuba": -3.0, "vibes": -2.0}


def render(b, ref=-20.0):
    hall = make_ir(1.4, 9, pre=0.015, hf=1.4)
    dry, wet, levels = np.zeros((2, N)), np.zeros((2, N)), {}
    for k, x in b.tr.items():
        if not np.any(x):
            continue
        L = integrated(x)
        x = x * dbg(ref + TARGET.get(k, -6) - L)
        levels[k] = round(L, 1)
        dry += x
        wet += b.send[k] * x
    return hp(dry + 0.7 * convolve_st(wet.mean(0), hall), 30, 2), levels
