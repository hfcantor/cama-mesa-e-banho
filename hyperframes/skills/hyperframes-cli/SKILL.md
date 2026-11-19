---
name: hyperframes-cli
description: Operate the hfr command line: init, preview, lint, inspect, render (formats, resolutions, ranges, workers), doctor, studio.
---
# hfr CLI

- Check the machine first: `hfr doctor` (FFmpeg, codecs, Chromium/WebGL, TTS, API keys).
- Create: `hfr init <dir> --template <name> --title "…"`.
- Iterate: `hfr preview <dir>` (live reload) or `hfr studio --workspace <dir>`.
- Validate: `hfr lint <dir> [--json]` (exit code 1 on errors), `hfr inspect <dir> --thumbnails <out>` (runtime errors, missing fonts, blank frames, determinism).
- Render: `hfr render <dir> -o out.mp4 [--resolution 1080p|4k|vertical-1080] [--scale 2] [--fps 60] [--quality draft|standard|high] [--range 2:5] [--workers 4] [--subtitles caps.srt]`. Output format follows the extension: .mp4 .webm .mov .gif.
- Draft renders for checking motion: `--quality draft --resolution 720p`.
- `hfr transitions`, `hfr libs`, `hfr lint --rules` list what is available.
Always read lint output before rendering; `--skip-lint` exists but hides real problems.
