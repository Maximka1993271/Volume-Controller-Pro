# Visualizers and Spectrogram

## Spectrum visualizer styles

The v4.8.31 popup offers seven styles:

1. **Bars** — vertical frequency bars.
2. **Line** — a connected frequency curve.
3. **Wave** — a wave-shaped spectrum display.
4. **Mirror** — a mirrored spectrum.
5. **Dots** — discrete frequency points.
6. **Filled area** — a filled spectrum area.
7. **Radial** — a circular spectrum with live frequency bars and peak markers.

Choose the style in Settings under the visualizer controls.

## Spectrogram

The spectrogram is separate from the spectrum style selector. It displays frequency history over time and has its own settings:

- Color palette.
- History duration.
- Frequency/time grid.
- Smoothing between frames.
- Glow for the current-time line.

The currently shipped interface offers GTA-style palette support and additional named palettes for the spectrogram. The default recommended visualizer setup is Bars, 48 bands, and balanced performance.

## Performance settings

Power Saving has three modes:

- **Balanced**
- **Performance**
- **Efficiency**

These modes change the visualization workload. They do not change the basic purpose of the audio controls.

## Troubleshooting a blank visualization

- Confirm that capture is active and that the selected media tab is eligible.
- Start or resume playback and allow the visualizer to receive audio samples.
- Check that the relevant visualizer or spectrogram panel is enabled in Settings.
- If CPU use is high, enable Power Saving and select a more efficient mode.
