---
name: hyperframes-core
description: Write HyperFrames-compatible HTML compositions (timing, presets, keyframes, captions, media, GSAP/Anime/Lottie/Three) that render deterministically to video with hfr.
---
# HyperFrames core — authoring compositions

Use when creating or editing a video composition (HTML that renders to MP4 with `hfr`).

## Rules that make renders correct
1. One root: `<div data-composition data-width data-height data-fps data-duration>`. Everything visible goes inside it.
2. Every element that appears/disappears is a clip: `data-start` + (`data-duration` | `data-end`). Times: `2`, `1.5s`, `45f`, `intro.end + 0.3`.
3. Prefer declarative motion: `data-enter="fade-up 0.8 out-expo"`, `data-exit="fade 0.4"`, `data-keyframes='[{"t":0,"scale":1},{"t":4,"scale":1.2}]'`, `data-kenburns="in 0.15"`.
4. JS animation must be seekable: build GSAP timelines with `{ paused: true }` and call `hf.register(tl, { start: 'clipId' })`; Anime.js: `autoplay: false` + `hf.register(anim)`; canvas/Three.js: draw inside `hf.onFrame((t) => …)`. Never animate with `setTimeout`/`setInterval`.
5. Load libraries from the engine, never a CDN: `/__hf/lib/gsap.js`, `/__hf/lib/anime.js`, `/__hf/lib/lottie.js`, importmap for `three`. Fonts: `/__hf/fonts/inter/index.css`.
6. Media: `<video src muted data-media-start>`; `<audio data-volume data-fade-out>`; captions `<div data-hf-captions="file.json" data-style="karaoke">`.
7. All assets local to the project (`assets/`). Remote URLs are flagged by the linter.

## Workflow
```bash
hfr init my-video --template blank   # or promo, captions-vertical, three-scene, lottie, audio-visualizer, multi-scene, tailwind-promo, anime-showcase
hfr lint my-video                    # fix every error before rendering
hfr inspect my-video --thumbnails /tmp/thumbs   # look at the contact sheet
hfr render my-video -o out.mp4
```
Full reference: docs/COMPOSITION.md.
