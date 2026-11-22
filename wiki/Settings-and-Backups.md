# Settings and Backups

## Appearance and language

The interface supports:

- Theme: Light, Dark, or System.
- Language: English, Russian, or Ukrainian.

The browser extension also packages locale message files separately from the runtime interface dictionaries.

## Audio settings

The settings include master volume, Bass Boost, Voice Boost, AUTO/MANUAL mode controls, per-site profiles for supported services, Peak Limiter, Night Mode, and Automatic Genre Detection.

A hidden panel is not the same as a disabled effect. The settings include visibility switches for parts of the popup, including Bass Boost and Voice Boost panels. Hiding a panel changes the interface, not the corresponding audio processing state.

## Visualizer and spectrogram settings

You can select the spectrum style and adjust visualizer options such as band count and sensitivity. The spectrogram has separate options for palette, history duration, grid, smoothing, and glow.

## Power Saving

Power Saving can be enabled and set to Balanced, Performance, or Efficiency. Use it when visualization workload is more important than maximum visual update detail.

## Export a settings backup

1. Open the extension popup.
2. Open Settings.
3. Select the export settings action.
4. Save the generated `.cfg` file in a safe location.

## Import a settings backup

1. Keep a copy of your current settings backup.
2. Open Settings and choose the import action.
3. Select the `.cfg` file.
4. Review the resulting settings in the popup.

The application validates imported configuration data and rejects malformed or unsupported future-schema files. The v4.8.31 source keeps settings backup schema version 18.

## Before sharing a backup

A `.cfg` backup can include language/theme preferences, volume and EQ choices, visualization settings, and saved service-profile values. Review the contents before sharing it publicly.
