# Word timings for a narration whose exact script we know, without a speech-to-text service:
#   1. find the speech runs and the pauses between them (energy, 10 ms frames)
#   2. spread the words over the speech time in proportion to their syllables
#   3. pin every pause to the nearest word boundary (a monotone piecewise-linear remap), so phrase starts, which
#      almost always follow a pause, land exactly; words inside a run are typically within ~0.1 s
#   4. optionally tighten the pauses (--tighten): keep at most MAX_COMMA after a comma-free word / MAX_STOP after
#      punctuation, cutting silence only (10 ms crossfades), never the voice
# Writes media/<short>/voice/voice.wav (48 kHz mono 24-bit) and words.json. Hand-check, or replace words.json with a
# real transcript later (audio/tools/import_voice.py).
# usage: python3 audio/tools/align_voice.py <short> <audio file> <script.txt> [--tighten]
import json
import os
import re
import sys
import wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(HERE, "..", "engine"))
from dsp import write_wav  # noqa: E402
from import_voice import ffmpeg  # noqa: E402

SR = 48000
MAX_IN = 0.10      # pause kept between words inside a phrase (s)
MAX_COMMA = 0.16   # after a comma / colon
MAX_STOP = 0.26    # after a full stop


def syllables(w):
    w = w.lower()
    if re.fullmatch(r"\d{4}", w):                       # years: 1173 = eleven seventy-three
        return 5 if w[:2] != "19" else 4
    if w.isdigit():
        return 2 * len(w)
    w = re.sub(r"[^a-z]", "", w)
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and n > 1 and not w.endswith("le"):
        n -= 1
    return max(1, n)


def load(path):
    ff, env = ffmpeg()
    tmp = os.path.join(os.path.dirname(os.path.abspath(path)), "_align_in.wav")
    import subprocess
    if subprocess.run([ff, "-y", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", tmp], env=env).returncode:
        sys.exit("ffmpeg failed")
    w = wave.open(tmp)
    x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
    os.remove(tmp)
    return x


def main():
    short, audio, script = sys.argv[1], sys.argv[2], sys.argv[3]
    tighten = "--tighten" in sys.argv
    text = " ".join(l.strip() for l in open(script, encoding="utf-8") if l.strip() and not l.lstrip().startswith("#"))
    toks = text.split()
    x = load(audio)
    hop = SR // 100
    e = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, "same"))[::hop]
    on = e > 0.02 * e.max()
    # speech runs (gaps shorter than 150 ms belong to the run)
    runs, i, n = [], 0, len(on)
    while i < n:
        if on[i]:
            j = i
            while j < n and (on[j] or (j + 15 < n and on[j:j + 15].any())):
                j += 1
            runs.append([i / 100, j / 100])
            i = j
        else:
            i += 1
    # speech time axis
    sp = np.cumsum([0] + [b - a for a, b in runs])
    S = sp[-1]
    def real(st):                                         # speech time -> real time
        k = min(len(runs) - 1, max(0, np.searchsorted(sp, st, side="right") - 1))
        return runs[k][0] + (st - sp[k])
    syl = np.array([syllables(t) for t in toks], float)
    c = np.concatenate([[0], np.cumsum(syl)]) / syl.sum() * S   # word boundaries in speech time
    # pin each pause (the speech time where run k ends) to the nearest word boundary
    anchors = [(0.0, 0.0)]
    for k in range(len(runs) - 1):
        g = sp[k + 1]
        b = int(np.argmin(np.abs(c - g)))
        if 0 < b < len(toks) and c[b] > anchors[-1][0] + 1e-6 and g > anchors[-1][1] + 1e-6:
            anchors.append((c[b], g))
    anchors.append((c[-1], S))
    ax, ay = np.array([a for a, _ in anchors]), np.array([g for _, g in anchors])
    cs = np.interp(c, ax, ay)
    words = []
    for k, t in enumerate(toks):
        a, b = cs[k], cs[k + 1]
        s0, e0 = real(a + 1e-6), real(b - 1e-6)
        words.append({"w": t, "s": round(s0, 3), "e": round(max(e0, s0 + 0.05), 3)})
    # ---- tighten pauses: rebuild the audio from the speech runs with capped gaps
    if tighten:
        fade = int(0.01 * SR)
        pieces, shift_at = [], []                           # (original time, cumulative removed seconds)
        removed, prev_end = 0.0, 0.0
        lead = max(0.0, runs[0][0] - 0.05)
        removed += lead
        shift_at.append((runs[0][0], removed))
        for k, (a, b) in enumerate(runs):
            if k:
                gap = a - prev_end
                wb = max((w for w in words if w["e"] <= a + 0.05), key=lambda w: w["e"], default=None)
                cap = MAX_STOP if wb and wb["w"][-1] in ".!?" else MAX_COMMA if wb and wb["w"][-1] in ",;:" else MAX_IN
                keep = min(gap, cap)
                pieces.append(np.zeros(int(keep * SR)))
                removed += gap - keep
                shift_at.append((a, removed))
            seg = x[int(a * SR):int(b * SR)].copy()
            seg[:fade] *= np.linspace(0, 1, fade)[: len(seg[:fade])]
            seg[-fade:] *= np.linspace(1, 0, fade)[-len(seg[-fade:]):]
            pieces.append(seg)
            prev_end = b
        x = np.concatenate([np.zeros(int(0.05 * SR))] + pieces + [np.zeros(int(0.3 * SR))])
        def moved(t):
            r = 0.0
            for (ta, rm) in shift_at:
                if t >= ta - 0.02:
                    r = rm
            return t - r + 0.05 - 0.05
        for w in words:
            w["s"], w["e"] = round(moved(w["s"]), 3), round(moved(w["e"]), 3)
    out = os.path.join(STUDIO, "media", short, "voice")
    os.makedirs(out, exist_ok=True)
    write_wav(os.path.join(out, "voice.wav"), x[None, :] / max(1e-9, np.abs(x).max()) * 0.89)
    json.dump(words, open(os.path.join(out, "words.json"), "w", encoding="utf-8"), indent=0)
    d = words[-1]["e"]
    print(f"{len(toks)} words, {len(runs)} speech runs, {len(anchors) - 2} pauses pinned; {d:.2f} s ({len(toks) / d:.2f} words/s)"
          f"{' (pauses tightened)' if tighten else ''} -> media/{short}/voice/")


if __name__ == "__main__":
    main()
