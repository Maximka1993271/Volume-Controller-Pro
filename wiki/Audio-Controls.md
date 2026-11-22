# Audio Controls

## Master volume

The master volume control ranges from 0% to 600%. Use the mute control to silence output without losing the selected volume value.

High volume does not create additional headroom in the source audio. Raising the level can make clipping or distortion more noticeable, so start at a moderate level and increase it carefully.

## Bass Boost

Bass Boost adjusts low-frequency energy. The documented implementation uses a low-shelf filter around 105 Hz, with an adjustment range of 0 to +12 dB.

Use smaller adjustments first. A large bass boost can make some tracks or speakers sound distorted or muddy.

## Voice Boost

Voice Boost is intended to improve speech clarity. The documented focus ranges are around 1.25 kHz and 2.8 kHz, with an adjustment range of 0 to +8 dB.

AUTO and MANUAL mode controls are available. In AUTO mode, an active automatic genre profile can determine the effective value; MANUAL mode lets the user keep a chosen value.

## Per-site audio profiles

The extension keeps separate saved audio profiles for supported YouTube and Spotify Web Player pages. A profile can store its own enabled state, volume, Bass Boost, Voice Boost, Peak Limiter, Night Mode, and selected audio preset.

The recommended balanced setup temporarily disables the YouTube and Spotify profiles without deleting their saved values. Re-enable a profile when you want its stored settings applied.

## Peak Limiter

The Peak Limiter is the final peak/safety-ceiling stage. The interface recommends leaving it enabled to soften sharp peaks. It is separate from Night Mode.

## Night Mode

Night Mode changes audio dynamics for quieter listening, aiming to soften louder sounds and make quieter dialogue easier to hear. In the v4.8.30+ signal path, the programme compressor remains connected for Night Mode even when the separate final Peak Limiter / Safety Ceiling stage is bypassed.

## Automatic genre mode and manual overrides

Automatic Genre Detection can select Bass and Voice profile values while capture is active. Manual overrides let you keep a chosen Bass or Voice value rather than allowing the genre profile to change that control.

For classification details and limitations, see [Automatic Genre Detection](Automatic-Genre-Detection).
