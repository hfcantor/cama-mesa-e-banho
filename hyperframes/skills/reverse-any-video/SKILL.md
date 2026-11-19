---
name: reverse-any-video
description: Analyse an existing video (cuts, durations, palette, camera motion, loudness) and scaffold a reconstruction project.
---
# Reverse any video

```bash
hfr reverse reference.mp4 -o rebuild [--threshold 0.25] [--reference]
```
Outputs `analysis.json`, `report.md` (scene table with timing, camera move, palette, keyframe) and a project with one clip per scene,
matched durations and a Ken Burns move approximating the detected camera motion. `--reference` adds the source video as a faded layer for side-by-side matching.
Then replace each scene's placeholder with real content (text, shapes, animation) using the keyframes in `reference/`.
Limits: no OCR/object recognition; slow dissolves may need a lower threshold.
