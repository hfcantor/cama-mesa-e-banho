---
name: remotion-to-hyperframes
description: Convert Remotion (React) compositions into HyperFrames HTML and report what could not be converted.
---
# Remotion → HyperFrames

```bash
hfr remotion my-remotion-app/src/index.ts -o converted [--composition MyComp]
```
Converted exactly: `<Composition>` metadata, `AbsoluteFill`, `Sequence`, `Series`, `Img`, `Audio`, `Video`/`OffthreadVideo`, `staticFile`, static styles,
local components with literal props, `interpolate(frame, …)` and `spring()` driving `opacity`/`transform` (sampled into `data-keyframes`).
Read `conversion-report.md`: "unsupported" items (state, effects, async data, `.map()`, conditionals, dynamic text) must be rebuilt by hand —
typically with a GSAP timeline registered via `hf.register()`. Render the result and compare with the Remotion output frame by frame.
