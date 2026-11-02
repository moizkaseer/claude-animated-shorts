# Placeholder narration for timing a short before the real voice exists (and for testing the sound pipeline):
# reads the script (one sentence per line, lines starting with '#' or empty are skipped), times the words at a steady
# rate (reference median 3.7 words/s, short gaps at commas, longer at sentence ends) and writes
#   media/<short>/voice/words.json  [{"w": word, "s": start s, "e": end s}, ...]
#   media/<short>/voice/voice.wav   48 kHz mono 24-bit: one soft voiced burst per word (NOT speech: timing only)
# Replace both with the real recording + hand-fixed word timings before the final mix.
# usage: python audio/tools/scratch_voice.py <short> <script.txt> [words_per_s=3.7] [start_s=0.05]
import json
import os
import sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "engine"))
from dsp import SR, ns, write_wav, bp, rng  # noqa: E402


def main():
    short, script = sys.argv[1], sys.argv[2]
    wps = float(sys.argv[3]) if len(sys.argv) > 3 else 3.7
    t = float(sys.argv[4]) if len(sys.argv) > 4 else 0.05
    lines = [l.strip() for l in open(script, encoding="utf-8") if l.strip() and not l.lstrip().startswith("#")]
    words, per = [], 1.0 / wps
    for line in lines:
        toks = line.split()
        for k, w in enumerate(toks):
            d = per * (0.55 + 0.09 * min(len(w.strip(".,!?;:'\"")), 9))     # longer words take longer
            words.append({"w": w, "s": round(t, 3), "e": round(t + 0.86 * d, 3)})
            t += d
            if w[-1] in ",;:":
                t += 0.12
        t += 0.22                                                        # sentence end
    dur = words[-1]["e"] + 0.3
    r = rng(7)
    y = np.zeros(ns(dur))
    for i, w in enumerate(words):
        a, b = ns(w["s"]), ns(w["e"])
        n = b - a
        tt = np.arange(n) / SR
        f0 = 115 + 12 * np.sin(i * 1.7)
        buzz = sum(np.sin(2 * np.pi * f0 * h * tt) / h for h in range(1, 12))
        env = np.sin(np.pi * np.linspace(0, 1, n)) ** 0.6
        y[a:b] += bp(buzz + 0.3 * r.standard_normal(n), 180, 3200, 2) * env
    y *= 0.25 / (np.abs(y).max() + 1e-9)
    out = os.path.join(HERE, "..", "..", "media", short, "voice")
    os.makedirs(out, exist_ok=True)
    write_wav(os.path.join(out, "voice.wav"), y[None, :])
    json.dump(words, open(os.path.join(out, "words.json"), "w"), indent=0)
    print(f"{len(words)} words, {words[-1]['e']:.2f} s ({len(words) / words[-1]['e']:.2f} words/s) -> media/{short}/voice/")


if __name__ == "__main__":
    main()
