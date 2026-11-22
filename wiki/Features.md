# Features

## Audio controls

| Feature | Range or behavior |
|---|---|
| Master volume | 0%–600%, including mute |
| Bass Boost | 0 to +12 dB |
| Voice Boost | 0 to +8 dB |
| Service profiles | Separate saved profiles for supported YouTube and Spotify Web Player pages |
| Peak Limiter | Optional final peak/safety-ceiling stage |
| Clipping warning | Visual warning when output gain or peaks present a risk |
| Night Mode | Dynamics control intended to make quieter listening easier |

The recommended balanced configuration starts at 100% master volume, Bass Boost +4 dB, Voice Boost +2 dB, limiter enabled, and Night Mode disabled. These are starting values, not a guarantee of suitable levels for every device or recording.

## Genre-aware audio

Automatic Genre Detection can classify music from title context and broad spectrum characteristics. It selects from predefined EQ families and can adjust Bass/Voice values while capture is active. It is not a remote music-identification service and does not retrieve official genre metadata from the media provider.

Read [Automatic Genre Detection](Automatic-Genre-Detection).

## Visualizations

The spectrum visualizer supports:

- Bars
- Line
- Wave
- Mirror
- Dots
- Filled area
- Radial

A separate spectrogram displays frequency history over time. Its settings include palette, history duration, grid, smoothing, and glow. Both visualizations can use the active GTA VI palette. The extension includes 25 GTA VI palettes, plus classic and alternative Neon, Ocean, Fire, and Monochrome palettes.

Read [Visualizers and Spectrogram](Visualizers-and-Spectrogram).

## Interface and performance

- Light, Dark, and System theme modes.
- English, Russian, and Ukrainian interface languages.
- Collapsible Quick Settings shortcuts and settings categories.
- 25 GTA VI accent palettes and matching visualizer colors.
- Independent visibility controls for Bass/Voice AUTO/MANUAL readouts and inactive effect cards.
- Optional scrollbar, capture-status, clipping, and limiter-off warnings.
- Power-saving modes: Balanced, Performance, and Efficiency.
- Optional clipping warning and capture-status indicator.

## Settings portability

Settings can be exported to and imported from `.cfg` files. The current backup schema is **28** and older supported schemas are migrated during import. A backup may include personal preferences and saved service-profile values. Review a backup before sharing it.
