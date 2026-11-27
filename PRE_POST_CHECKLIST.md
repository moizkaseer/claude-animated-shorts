# Pre-post checklist (Wobbly History)

Read this before writing a new short and again before calling one ready to post. Where it conflicts with the house
defaults in `SKILL.md` (music, the script beat formula), **this file wins**. The last step is always:

```bash
cd studio && node scripts/qa-ready.mjs <name>      # only call the short "ready to post" when it prints READY
```

Why: on 27 Nov 2026 we compared our five Shorts (Pisa 31.6K views; Sewers, Emus, Lightning, Bear ~1.05-1.24K each)
with four animated history/facts channels. The gap was story framing, the opening shot, endings and volume, not the
animation quality. Benchmarks are at the bottom.

## 1. Script template
1. **Line 1 is a character in trouble**, in the middle of the action: "You're Gustave Eiffel, and Paris is about to
   tear your tower down." / "He poured a ton of sand into a brand-new locomotive." Start with You / He / She / They or
   a named person, never with a topic sentence ("The Eiffel Tower was...") or a date ("In 1932...").
2. **A rival or antagonist** (a city council, a rival engineer, the enemy, nature) who wants the opposite.
3. **At most 2 dates** in the whole script. No year-by-year timeline.
4. **One twist**: the "wait, that's why" moment (keep the "You see," everyday analogy if it helps).
5. **Punchline ending that loops**: the last line is a joke or ironic payoff that shares a keyword with the hook,
   so the replay feels seamless ("...which, in Pisa, is about three wars.").
6. **No spoken call to action**: never "like and subscribe", "comment", "follow". All three flops that ended this
   way stalled near 1K. None of the 12 competitor Shorts we measured says one.
7. **Facts verified, with sources** at the top of `media/<name>/SCRIPT.md`. Jokes are real facts too.

## 2. Opening frame (frame 0 is also the cover)
- A **medium close-up of a character mid-action** (pushing, pouring, running, arguing), with the **iconic landmark or
  object behind them**, not a wide shot with tiny figures and not a plain building front.
- The **paradox banner** in big outlined type in the top third ("RADIO SAVED THIS TOWER").
- **Motion at frame 0**: the action or a camera push-in is already moving, with no static first second.

## 3. Pace and length
- **60-70 s** (the gate allows 55-75 s). Pisa (the hit) ran 70 s; Emus, Lightning and Bear ran 37-41 s.
- **About 3.7 spoken words per second** (gate: 3.4-4.2). Ours measured 2.9-3.3; the fast-growing peers run 3.5-4.0.
  Tighten pauses / raise `atempo` on the voice until the script fits.

## 4. Packaging
- **Question title**: "Why Did a Radio Save the Eiffel Tower?" (statement titles that give away the answer are out).
- **History-only tags**: `#shorts #history #weirdhistory` + the place/topic. Never gaming, stream, clip or emote tags.
- Description: the story in 2 lines plus the sources. Optionally pin a comment linking the next related Short.

## 5. Standing channel rules (owner's)
- **No music**: voice + light sound effects only (`audio/shorts/<name>/music.py` = the silent module, as in eiffel).
- **No impression voices** (no imitating real people or celebrities).
- **Free-licence assets only** (our own renders, CC0 models; free-licence stills only).
- No cross-posting. The owner approves every upload in his own words.

## 6. The gate: `node scripts/qa-ready.mjs <name>` (from `studio/`)
Automatic: duration, words/s, no CTA, hook starts with a character (else REVIEW), at most 2 dates, the ending shares
a keyword with the hook, a silent music stem, motion between frame 0 and frame 10, the banner in frame 0 (else
REVIEW), a question title and history-only tags (`media/<name>/youtube.json`), and sources in SCRIPT.md.
Manual (look at frame 0 and read the script): the MCU character mid-action, rival / twist / punchline, no impression
voices, free-licence assets. `--reviewed` accepts REVIEW items after a human has checked them. Older shorts:
`--video <file> --title "..." --tags "a,b"`.

## Benchmarks (measured 27 Nov 2026; yt-dlp + YouTube auto-captions + ffmpeg scene detection)
| Channel | Subs | Cadence | Their 3 best recent Shorts | Length | Words/s | Cuts/10 s |
|---|---|---|---|---|---|---|
| Squire Explains (2D bean characters, history; started 2026) | 26.5K (+281 % since 21 Oct, ChannelDB) | ~1.3/day | 162K, 87K, 68K | 65-71 s | 3.5 | 2.0-5.7 |
| Segment Zero (3D sets, 2D characters, war/engineering) | 21.9K (+428 % since 2 Nov, ChannelDB) | ~1/day | 4.0M, 2.7M, 2.4M | 59-68 s | 4.0-4.1 | 0-0.8 |
| Hoodie Guy (live host + cartoon animals) | 2.33M | ~2/week | 20.8M, 13.2M, 10.1M | 62-68 s | 3.2-3.6 | 3.1-3.7 |
| More Parz (cartoon over stock, comedy) | 3.69M | ~1/week | 14.3M, 12.1M, 9.2M | 147-169 s | 1.9-2.1 | 6.1-7.3 |
| **Wobbly History (us)** | 28 | 5 in 23 days | 31.6K, 1.24K, 1.19K | 37-70 s | 2.9-3.3 | 2.0-6.3 |

- Openings: Squire 3/3 open with "You...", Segment Zero 3/3 with "He [did something odd]..."; ours 5/5 opened with a
  fact or a date.
- Question titles: Squire 20/30 (median 121K vs 44.5K for statements); Segment Zero 10/30 (1.15M vs 445K).
- Spread: even the growers get 15K-30K floors and occasional 1M+ hits, so volume matters (they post daily).
- Not gaps: cuts per 10 s, word-by-word captions, the 2D look (Squire's is close to ours), like rate (ours 1.1-3.1 %
  vs Squire 1.7-2.6 %, Segment Zero 1.5-1.9 %).
