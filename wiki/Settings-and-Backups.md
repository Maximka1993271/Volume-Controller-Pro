# Settings and Backups

## Settings layout

Settings categories are collapsible sections and start collapsed. The Done button closes the popup without changing audio state.

## Appearance and language

The interface supports:

- Theme: Light, Dark, or System.
- Language: English, Russian, or Ukrainian.
- 25 GTA VI accent palettes plus the classic palette.
- A preference to show or hide the popup scrollbar.

The palette gallery can be expanded or collapsed; its state is saved.

The browser extension also packages locale message files separately from the runtime interface dictionaries.

## Audio settings

The settings include master volume, Bass Boost, Voice Boost, AUTO/MANUAL mode controls, per-site profiles for supported services, Peak Limiter, Night Mode, and Automatic Genre Detection.

A hidden panel is not the same as a disabled effect. The settings include visibility switches for parts of the popup, including Bass Boost and Voice Boost panels. Hiding a panel changes the interface, not the corresponding audio processing state.

## Quick Settings

Quick Settings provides shortcuts for Peak Limiter, Night Mode, Bass Boost, Voice Boost, Automatic Genre Detection, RGB glow, and YouTube/Spotify profiles. It starts collapsed. Panel visibility and expanded/collapsed state are separate preferences.

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

The application validates imported configuration data and rejects malformed or unsupported future-schema files. The v4.8.31 source uses settings backup schema version **28**. Older supported backups are migrated during import.

## Before sharing a backup

A `.cfg` backup can include language/theme preferences, volume and EQ choices, visualization settings, service-profile values, Quick Settings state, and palette gallery state. Review the contents before sharing it publicly.
