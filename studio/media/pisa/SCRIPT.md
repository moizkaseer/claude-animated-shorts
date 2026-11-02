# The Tower Saved by Wars (v1, 2026-11-02)
Host: The Professor (narrates; on screen for the "You see" explanation and the ending).
Target: ~231 words at ~3.7 words/s = ~62 s.

## Facts and sources
- Construction began 14 August 1173; in 1178 the tower began to sink after construction reached the second floor; a
  ~3 m foundation in weak, unstable subsoil. Halted "for the better part of a century", which "allowed time for the
  underlying soil to settle". Resumed 1272 (Giovanni di Simone): "upper floors with one side taller than the other".
  Halted again after the Pisan defeat by Genoa at the naval Battle of Meloria. Bell chamber 1372. Closed 7 Jan 1990,
  reopened 15 Dec 2001 (eleven years); soil removed from under the raised side; tilt cut from 5.5 deg to ~3.97 deg;
  "declared stable for at least another 300 years". (Wikipedia, Leaning Tower of Pisa)
- Pisa's wars with Genoa, Florence and Lucca during the pause. (designingbuildings.co.uk, Leaning Tower of Pisa)
- "If they had built all eight right away, without letting the tower settle, it would likely have collapsed."
  Silty alluvial soil from a former estuary. The corrections gave "a slight banana shape". Engineers working for
  Mussolini's government injected "almost 200 tons of cement into the base"; the fix "added a tenth of a degree to the
  tilt". (PBS NOVA, "Leaning Tower")
- Underexcavation reduced the inclination by about 10 %. (Burland, Jamiolkowski & Viggiani 2009, via artnet)
- Physics: slow loading lets water drain out of soft clay (consolidation), which makes it stronger; fast loading
  squeezes it out sideways (bearing failure). Standard soil mechanics.
- Joke check: "the cement worked" = it went in and set (true); "leaned even more" = +0.1 deg (true).
  "Three hundred years ... about three wars" = the first pause lasted ~94 years (true-ish, deliberately deadpan).

## Script
The Leaning Tower of Pisa is only standing because its builders kept stopping to go to war.
In 1173, Pisa starts building the most beautiful bell tower in Italy.
Five years in, at the second floor, it starts to tip.
It's sitting on soft, wet mud, on a foundation just three metres deep.
So Pisa does the sensible thing: it stops building and goes to war. For almost a hundred years.
When the builders come back, they make every new floor taller on the short side.
So now the tower doesn't just lean. It bends, like a banana.
Then Pisa loses a sea battle, and building stops again.
Centuries later, Mussolini's engineers pump two hundred tons of cement under it to straighten it.
Luckily, the cement worked.
Unluckily, the tower leaned even more.
You see, wet clay is like a sponge full of water.
Squeeze it slowly and the water seeps out, so it firms up. Squeeze it fast, and it just squishes sideways.
Every war gave the mud decades to squeeze out its water and get strong enough for the next floor.
Build it all at once, and it probably falls over.
In 1990, it leaned so far they closed it for eleven years, while engineers pulled soil out from under the high side.
Now it's stable for at least three hundred years.
Which, in Pisa, is about three wars.

## Production log
- 2026-11-02: picture v1 built against a placeholder voice (shots are timed to WORDS, so the real take re-times them):
  20 shots, sets: Piazza dei Miracoli (procedural tower with lean / banana / build stages, cathedral, baptistery,
  city wall), classroom with chalkboard. Voice: ElevenLabs "George" (premade, British storyteller), eleven_v4,
  "[dry, deadpan, brisk storytelling pace]" — first attempt refused: free generations busy, nothing charged.
- Next: generate the voice -> transcribe for word timings -> media/pisa/voice/{voice.wav, words.json} -> sound
  design (audio/shorts/pisa: medieval-flavoured score, hammer / creak / march / cement / crash cues) -> preview render.
- 2026-11-02 late: voice generated on the user's free plan (2 takes, 1,294 credits each; take B used, both kept in
  voice_takes/). 82 s raw -> align_voice --tighten (73 s) -> atempo 1.06 = 69.2 s, 3.35 words/s. Word timings by
  local alignment (Scribe transcription was busy). Soundtrack mixed (-15 LUFS, -1.2 dBTP). Preview render started.
  Free-plan voice: non-commercial + "Voice: ElevenLabs (elevenlabs.io)" credit in the description.
