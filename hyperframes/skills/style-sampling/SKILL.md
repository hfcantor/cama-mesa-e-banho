---
name: style-sampling
description: Extract a reusable visual style (palette, colour roles, typography, radii, shadows) from images, videos or web pages.
---
# Style sampling

```bash
hfr style-sample reference.jpg -o style        # or a video, a URL, or a local .html page
```
Writes `tokens.json` (palette with weights, semantic roles checked for WCAG contrast, typography/radius/shadows for pages),
`theme.css` (CSS variables) and a style-board composition. Link `theme.css` from a composition and use `var(--color-accent)`, `var(--font-heading)`, etc.
`hfr capture <url> -o tour` produces a scrolling "site tour" composition from a full-page screenshot.
