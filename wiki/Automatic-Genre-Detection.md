# Automatic Genre Detection

## What it does

Automatic Genre Detection uses the current track title and audio-spectrum analysis to choose an EQ family. The catalog contains **81 entries**:

- **76** title-based genre or subgenre labels.
- **5** broad audio-only profiles.

The complete maintained catalog, aliases, and EQ family table is in [AUTO_GENRE_CATALOG.md](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/AUTO_GENRE_CATALOG.md).

## When it runs

Audio-based classification requires a user-started capture session. The popup describes genre-based Bass/Voice adjustment as active only during manual capture. If capture is not running, the genre status may wait for capture rather than analyzing audio.

## Title matching

The title classifier normalizes case, punctuation, and diacritics, then matches known aliases. It uses context safeguards for ambiguous short words, so common terms such as “house”, “rock”, or “pop” are not always sufficient on their own.

Aliases containing a literal ampersand are treated carefully. For example, the catalog documents that “R&B Hits” is a valid match while “R B Session” is not.

## Audio-only profiles

Audio analysis chooses broad EQ families rather than trying to infer a precise subgenre from a spectrum. The catalog documents these five profiles:

- Bass-heavy
- Electronic
- Atmospheric
- Vocal
- Other (fallback)

The classifier requires multiple non-silent measurements. The documented implementation uses at least six measurements, applies a low-signal gate, and waits for three consecutive candidate matches with confidence of at least 0.60 before switching.

## Accuracy limits

- Title matching can only infer from words present in the title; it is not provider-supplied genre metadata.
- A spectrum alone cannot reliably identify an exact genre or subgenre.
- Ambiguous titles may correctly remain unclassified.
- Audio-based profiles are broad EQ groupings, not guaranteed descriptions of the music.

## Manual control

Manual Bass/Voice overrides allow a user to retain a selected value instead of having the active genre profile control that parameter. Disable Automatic Genre Detection in the popup or Settings to stop genre-aware adjustment.

For the exact alias list and EQ family values, consult the [full genre catalog](https://github.com/Maximka1993271/Volume-Controller-Pro/blob/main/AUTO_GENRE_CATALOG.md).
