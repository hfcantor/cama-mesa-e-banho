---
name: slideshow
description: Create animated presentation videos from Markdown or images, with optional narration, captions and music.
---
# Slideshow

Markdown deck: slides separated by `---`; `# title`, `## subtitle`, bullets, paragraphs, one image; per-slide `<!-- duration: 5, transition: wipe-left, background: #123, layout: split -->`; speaker notes after a `Notes:` line become narration.
```bash
hfr slideshow deck.md -o talk --theme midnight|paper|sunset --transition fade|slide|zoom|wipe|iris|blur --music assets/bg.mp3 --narrate --provider espeak --voice pt-br
hfr slideshow photos/*.jpg -o album --duration 3 --resolution vertical-1080
hfr render talk
```
With narration, each slide lasts at least as long as its voice-over, captions are generated with word timings and the music ducks under the voice.
