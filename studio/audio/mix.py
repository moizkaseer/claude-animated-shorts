# Make a short's soundtrack: python audio/mix.py <short>   (run from the studio folder)
# Needs out/<short>/timeline.json (node scripts/export-timeline.mjs <short>) and media/<short>/voice/voice.wav +
# words.json ([{"w", "s", "e"}], hand-fixed word timings). Writes out/<short>/audio/: mix.wav, stems, cues.md.
# The short's sound lives in audio/shorts/<short>/ (timeline.py, sfx.py, music.py, mixcfg.py); the shared synth,
# DSP and mixer in audio/engine/.
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STUDIO = os.path.dirname(HERE)
if len(sys.argv) < 2:
    sys.exit("usage: python audio/mix.py <short>")
short = sys.argv[1]
src = os.path.join(HERE, "shorts", short)
if not os.path.isdir(src):
    sys.exit(f"no audio/shorts/{short}/")
os.environ["SHORT_TIMELINE"] = os.path.join(STUDIO, "out", short, "timeline.json")
os.environ["SHORT_AUDIO_OUT"] = os.path.join(STUDIO, "out", short, "audio")
os.environ["SHORT_VOICE"] = os.path.join(STUDIO, "media", short, "voice")
sys.path[:0] = [src, os.path.join(HERE, "engine")]
import mixer  # noqa: E402

mixer.main()
