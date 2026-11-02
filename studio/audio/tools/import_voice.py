# Bring a recorded / generated narration into a short:
#   media/<short>/voice/voice.wav   48 kHz mono 16-bit (any input format ffmpeg reads: mp3, m4a, wav...)
#   media/<short>/voice/words.json  [{"w", "s", "e"}] from a transcript with word times (ElevenLabs Scribe "words",
#                                   Whisper, ...: keys text|word|w, start|s, end|e; spacing / non-word entries dropped)
# Then hand-check words.json against the audio (shots and cues are timed to it).
# usage: python3 audio/tools/import_voice.py <short> <audio file> <transcript.json> [--trim-start]
#   --trim-start: cut leading silence so the first word starts at 0.05 s (the voice starts at frame 1-4)
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(os.path.dirname(HERE))


def ffmpeg():
    if os.environ.get("FFMPEG"):
        return os.environ["FFMPEG"], dict(os.environ)
    if shutil.which("ffmpeg"):
        return "ffmpeg", dict(os.environ)
    d = os.path.join(STUDIO, "node_modules", "@remotion", "compositor-linux-x64-gnu")
    return os.path.join(d, "ffmpeg"), {**os.environ, "LD_LIBRARY_PATH": d}


def main():
    short, audio, transcript = sys.argv[1], sys.argv[2], sys.argv[3]
    trim = "--trim-start" in sys.argv
    raw = json.load(open(transcript, encoding="utf-8"))
    items = raw.get("words", raw) if isinstance(raw, dict) else raw
    words = []
    for it in items:
        if it.get("type") not in (None, "word"):
            continue
        w = it.get("text", it.get("word", it.get("w", ""))).strip()
        if not w:
            continue
        words.append({"w": w, "s": float(it.get("start", it.get("s"))), "e": float(it.get("end", it.get("e")))})
    shift = (words[0]["s"] - 0.05) if trim and words[0]["s"] > 0.05 else 0.0
    for w in words:
        w["s"] = round(w["s"] - shift, 3)
        w["e"] = round(w["e"] - shift, 3)
    out = os.path.join(STUDIO, "media", short, "voice")
    os.makedirs(out, exist_ok=True)
    ff, env = ffmpeg()
    args = [ff, "-y", "-v", "error"] + (["-ss", f"{shift:.3f}"] if shift else []) + ["-i", audio, "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", os.path.join(out, "voice.wav")]
    if subprocess.run(args, env=env).returncode != 0:
        sys.exit("ffmpeg failed")
    json.dump(words, open(os.path.join(out, "words.json"), "w", encoding="utf-8"), indent=0)
    dur = words[-1]["e"]
    print(f"{len(words)} words, {dur:.2f} s ({len(words) / dur:.2f} words/s){f', trimmed {shift:.2f} s' if shift else ''} -> media/{short}/voice/")


if __name__ == "__main__":
    main()
