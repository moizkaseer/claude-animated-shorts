# "The Tower Saved by Wars" mix settings (audio/engine/mixer.py).
import timeline as T

TITLE = "The Tower Saved by Wars"
MUSIC_DESC = "original score in D dorian, 108 bpm, one tune arranged per era"
# music LU under the voice per music.SECTIONS section (standard: bed ~ -10; quieter under the explanation)
MUSIC_TARGET = {"hook": -9.5, "build": -10.5, "war": -10.0, "hundred": -11.0, "back": -10.0, "battle": -11.0, "band": -9.5,
                "class": -12.0, "whatif": -10.0, "fix": -11.5, "end": -10.0}
SECTION_ALIAS = {}
SECTION_START = {}
HARD_SWITCH = (T.FLASH, T.TIP, T.CRASH)
DIPS = []
NOTES = "Every cue is placed from words.json phrases and the shot list, so a new voice take re-times the whole soundtrack."
REPORT = [(f"shot {i}: {T.SHOTS[i]['beat']}", *T.shot_t(i)) for i in sorted(T.SHOTS)]
