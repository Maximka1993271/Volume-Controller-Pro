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

Choose the style in Settings under the Visualizers category.

## Spectrum settings

- Band count: 24, 36, 48, 64, or 96.
- Sensitivity for quieter sounds.
- Palette: GTA VI theme, Neon, Ocean, Fire, or Monochrome.
- Glow, peak hold, and animation controls.

The extension includes 25 GTA VI palettes. Selecting one updates popup accents and the color stops used by the spectrum and spectrogram. The palette gallery also includes classic and can be expanded or collapsed.

## Spectrogram

The spectrogram is separate from the spectrum style selector. It displays frequency history over time and has its own settings:

- Color palette.
- History duration: 2, 4, 6, 8, or 12 seconds.
- Frequency/time grid.
- Smoothing between frames.
- Glow for the current-time line.

The currently shipped interface offers GTA-style palette support and additional named palettes for the spectrogram. The default recommended visualizer setup is Bars, 48 bands, and balanced performance.

## Capture and state confirmation

The visualizer and spectrogram need active capture and audio samples. Settings saved while capture is inactive can be applied at the next capture start. During active capture, commands are reflected as active only after the background/offscreen pipeline confirms success.

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
- Try another spectrum style or palette.
- If CPU use is high, enable Power Saving and select Balanced or Efficiency.
