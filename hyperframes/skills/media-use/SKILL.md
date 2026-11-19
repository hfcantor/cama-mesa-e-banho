---
name: media-use
description: Prepare and inspect media for compositions: probe, transcode, extract frames, analyse audio, detect silence/scenes, palettes, fonts.
---
# Media use

- Inspect before using: `hfr media probe file` (duration, codec, fps, alpha, audio).
- Huge or exotic files: `hfr media transcode in.mov assets/clip.mp4 --max-height 1080` (H.264/AAC) or `--codec vp9`.
- Audio: `hfr media loudness file` (LUFS), `hfr media silence file`, `hfr media analyze music.mp3 -o analysis.json`.
- Visual: `hfr media scenes video.mp4`, `hfr media palette image.jpg`, `hfr media thumbnail video.mp4 out.jpg --time 3`.
- Fonts: put .woff2/.ttf in `assets/fonts/` and declare `@font-face` (or use `/__hf/fonts/*`); the inspector reports fonts that fall back.
- Video in compositions is rendered frame-accurately from extracted frames: set `data-media-start` for trims and `muted` when the audio is not wanted.
- Audio-reactive visuals: `data-audio-analysis="assets/music.mp3"` on the root, then `hf.audio.level(t)` / `hf.audio.bands(t)` or `<canvas data-hf-visualizer>`.
