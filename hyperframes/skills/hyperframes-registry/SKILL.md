---
name: hyperframes-registry
description: Find and insert ready-made blocks (lower thirds, counters, charts, captions, 3D, Lottie, shaders) and templates into compositions.
---
# Registry

```bash
hfr registry list [--type block|template|transition] [--search chart]
hfr registry show lower-third            # params with defaults
hfr registry add lower-third --param title="Ana" --param start=2 --to index.html
```
Insertion appends the block at the end of the composition root, adds required libraries to `<head>` once and copies assets.
Custom registries: a directory or an HTTP URL serving `index.json` (`{ "items": [...] }`), passed with `--source` or `HFR_REGISTRY`.
An item is `item.json` + `snippet.html` (+ `head.html`, files). Use `{{param}}` (HTML-escaped) and `{{uid}}` placeholders; scripts should read parameters from `data-*` attributes, not from template substitution.
