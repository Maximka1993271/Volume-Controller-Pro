# Frequently Asked Questions

## Does the extension work on every website?

No. The documented capture allowlist and tests cover supported YouTube video routes and Spotify Web Player. Browser-internal pages and pages that prohibit script injection may not be controllable.

## Does it send captured audio to a server?

The project is designed for local browser processing. The repository privacy review found no call sending captured audio to a developer-controlled server in the reviewed JavaScript. That review is static and is not a guarantee about every runtime or binary environment.

## Why does genre detection sometimes show no result?

The classifier avoids guessing when a title is ambiguous or the audio signal is too quiet/short. Audio-only classification uses broad profiles and requires several consistent measurements.

## What is the maximum volume?

The master volume control ranges from 0% to 600%. Large volume increases can produce clipping or distortion; use moderate levels and keep the Peak Limiter enabled when appropriate.

## What are the Bass and Voice Boost ranges?

Bass Boost supports 0 to +12 dB. Voice Boost supports 0 to +8 dB.

## What are AUTO and MANUAL modes?

AUTO allows the active automatic genre profile to determine the relevant Bass or Voice value during capture. MANUAL keeps the value selected by the user.

## Does hiding a control disable its effect?

No. Visibility settings can hide a panel, effect card, or AUTO/MANUAL readout without turning off the effect or changing its mode.

## What is Quick Settings?

Quick Settings is a collapsible shortcut panel for frequently used controls. It starts collapsed by default.

## What changed in v4.8.31?

The release includes Filled area and Radial visualizer styles, expanded GTA VI palette support, Quick Settings and visibility controls, and more reliable audio/visualizer state confirmation.

## What is the current backup schema?

The v4.8.31 extension exports backup schema version 28. Older supported schemas are migrated during import.

## Can I move my settings to another installation?

Yes. Export a `.cfg` backup, then import it in the other installation. Review the backup before sharing it.
