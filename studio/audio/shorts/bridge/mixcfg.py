# The bridge short's mix settings (engine: audio/engine/mixer.py).
import timeline as T

TITLE = "The Bridge That Fell for a Song"
MUSIC_DESC = "original march, Bb major, 120 bpm: quarter note = footfall"
# music level per section, LU relative to the voice in that section (after ducking); "+3 dB music" standard
# (user standard: bed -10 instead of the old -13; sway/swing deliberately softer and warmer, rule/tourists leave room
# for the hammer blows and the strolling footsteps)
MUSIC_TARGET = {"hook": -9.5, "town": -10.5, "march": -10.0, "bounce": -10.0, "whistle": -9.5, "tension": -10.0,
                "sway": -12.0, "swing": -11.5, "march2": -10.5, "rule": -11.5, "tourists": -11.0}
# sections without a level of their own: they take another section's gain (the dead stop's hall tail decays at the
# tension level)
SECTION_ALIAS = {"dropout": "tension"}
# where a section's level switch really happens, if not at its start (s)
SECTION_START = {"sway": 43.1}
# level switches that stay hard (music is silent there): the white flash cut and the end of the dropout
HARD_SWITCH = (T.FLASH, 43.1)
# music rides (start, end, dB): keep the quiet sentence-final words on top; the band blooms again in the gap after them
DIPS = [(3.65, 4.30, -3.0),     # hook fill under "...walking across it."
        (26.95, 27.36, -2.0),   # whistling column under "...every step."
        (32.20, 32.77, -4.0),   # tension crescendo under "...breaks step." -> blooms into the dead stop before "Then,"
        (61.25, 61.98, -3.0)]   # rule roll under "...in step."
NOTES = "The hook's last two footfalls (3.5, 4.0) are also 3 dB lower in the SFX for '...walking across it.'"

# report sections = shots
_s = lambda i: T.shot_t(i)
REPORT = [("hook (1)", 0.0, _s(1)[1]), ("town (2)", *_s(2)), ("march (3)", *_s(3)), ("bounce (4-5)", _s(4)[0], _s(5)[1]),
          ("whistle (6)", *_s(6)), ("groan (7)", *_s(7)), ("snap+fall (8)", *_s(8)), ("water (9-10)", _s(9)[0], _s(10)[1]),
          ("sway (11)", *_s(11)), ("swing (12)", *_s(12)), ("march2 (13)", *_s(13)), ("rule (14)", *_s(14)),
          ("tourists (15)", _s(15)[0], T.DUR)]
