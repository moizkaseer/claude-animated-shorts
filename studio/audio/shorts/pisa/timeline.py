# "The Tower Saved by Wars": the picture's timing for the sound. Shots, crossfades, flash and markers come from
# out/pisa/timeline.json (audio/engine/tl.py); words from media/pisa/voice/words.json, looked up by PHRASE exactly
# like src/engine/words.ts, so the sound re-times itself with the voice. Mirrors of picture logic (hammer strikes,
# marching) follow src/shorts/pisa/cast.ts.
import os
import re
import tl
from tl import FPS, TOTAL, DUR, FLASH, SHOTS, XFADE, MARKERS, fr, shot_t, shot_at, words, hh  # noqa: F401

WORDS = words(os.path.join(os.environ["SHORT_VOICE"], "words.json"))
_norm = lambda t: re.sub(r"[^a-z0-9']", "", t.lower())
_toks = [_norm(w["w"]) for w in WORDS]


def _find(phrase, n=1):
    k = [x for x in (_norm(p) for p in phrase.split()) if x]
    seen = 0
    for i in range(len(_toks) - len(k) + 1):
        if _toks[i:i + len(k)] == k:
            seen += 1
            if seen == n:
                return WORDS[i], WORDS[i + len(k) - 1]
    raise KeyError(f'words.json has no occurrence {n} of "{phrase}"')


def s(phrase, n=1):
    """start (s) of the phrase's first word"""
    return float(_find(phrase, n)[0]["s"])


def e(phrase, n=1):
    """end (s) of the phrase's last word"""
    return float(_find(phrase, n)[1]["e"])


def A(i):
    """start time (s) of shot i"""
    return shot_t(i)[0]


def B(i):
    """end time (s) of shot i"""
    return shot_t(i)[1]


def era(i):
    return SHOTS[i]["era"]


def hammer_strikes(t0, t1, phase, every=0.8):
    """cast.ts hammerK: the hammer is up for 75 % of each cycle and lands at u = 0.75 (frame-quantised)"""
    out = []
    k = int((t0 + phase) // every) - 1
    while True:
        t = (k + 0.75) * every - phase
        k += 1
        if t >= t1:
            break
        if t >= t0:
            out.append(round(t * FPS) / FPS)
    return out


WAR_HOOK = s("go to war") - 2 / FPS      # builders turn into soldiers (shot 2)
WAR = s("goes to war") - 2 / FPS         # ... and again (shot 6)
TIP = s("to tip")
LURCH = s("even more")
FALL = s("falls")
CRASH = FALL + 0.75
SQUEEZE_SLOW = s("Squeeze it slowly")
SQUEEZE_FAST = s("Squeeze it fast")
BANANA = s("banana")
END_WORD = e("three wars")
