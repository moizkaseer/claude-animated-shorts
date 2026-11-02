# The picture's timeline for the sound, read from out/<short>/timeline.json (written by
# scripts/export-timeline.mjs from src/shorts/<short>/story.ts). Nothing here is typed in by hand: shots, crossfades,
# flash, cuts, kicks, markers, story constants and the camera of every frame all come from the picture.
# The runner (audio/mix.py) sets SHORT_TIMELINE before anything imports this module.
import json
import math
import os
import numpy as np

PATH = os.environ.get("SHORT_TIMELINE")
if not PATH or not os.path.exists(PATH):
    raise SystemExit(f"timeline not found ({PATH}): run `node scripts/export-timeline.mjs <short>` first")
D = json.load(open(PATH, encoding="utf-8"))

FPS = D["fps"]
TOTAL = D["frames"]
DUR = TOTAL / FPS
SHOTS = {s["id"]: s for s in D["shots"]}          # id -> {id, a, b, light, ...the short's own fields}
XFADE = {x[2]: x[1] - x[0] for x in D["xfade"]}   # shot id -> crossfade frames into it
FLASH = D["flash"][0] / FPS if D["flash"] else None
CUTS = D["cuts"]
KICKS = D["kicks"]
MARKERS = D["markers"]
C = D["constants"]
CAM = np.array(D["camera"], dtype=float)           # per frame: shot, px, py, pz, lx, ly, lz, fov


def fr(f):
    return f / FPS


def shot_t(i):
    s = SHOTS[i]
    return fr(s["a"]), fr(s["b"])


def shot_at(t):
    f = t * FPS
    for i, s in SHOTS.items():
        if s["a"] <= f < s["b"]:
            return i
    return max(SHOTS)


def markers(name):
    """times (s) of every marker with this name, in order"""
    return [m["t"] for m in MARKERS if m["name"] == name]


def cam(t):
    """(position, look point, fov) of the camera on screen at time t (base layer during a crossfade)"""
    row = CAM[min(TOTAL - 1, max(0, int(round(t * FPS))))]
    return row[1:4], row[4:7], row[7]


def cam_distance(t, point):
    """metres from the camera on screen at time t to a world point (for distance-based level / low-pass / reverb)"""
    p, _, _ = cam(t)
    return float(np.linalg.norm(p - np.asarray(point, float)))


def dist_fx(d, near=3.5):
    """distance -> (gain dB, low-pass Hz, reverb send) for a sound source d metres from the lens"""
    d = max(d, near)
    g = -14.0 * math.log10(d / near)
    lpf = float(np.clip(17000 * (near / d) ** 0.55, 1800, 17000))
    send = 0.06 + 0.45 * float(np.clip(math.log(d / near) / math.log(25), 0, 1))
    return g, lpf, send


def hh(i, s=0):
    """same hash as engine/core.ts hh (IEEE doubles, so it reproduces the JS values)"""
    v = math.sin(i * 127.1 + s * 311.7) * 43758.5453
    return v - math.floor(v)


def easeout(u):
    u = min(1.0, max(0.0, u))
    return 1 - (1 - u) ** 4


def words(path):
    return json.load(open(path, encoding="utf-8"))
