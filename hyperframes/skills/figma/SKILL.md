---
name: figma
description: Turn a Figma frame into an animated composition via the Figma REST API (FIGMA_TOKEN) or a saved node JSON.
---
# Figma → composition

```bash
export FIGMA_TOKEN=…                       # personal access token
hfr figma "https://www.figma.com/design/<key>/File?node-id=12-34" -o figma-intro
hfr figma --from-json node.json -o figma-intro   # offline, from a saved /v1/files/:key/nodes response
```
Frames/groups/rectangles/ellipses/text become positioned HTML (fills, gradients, radii, strokes, shadows, blur, text styles);
vectors and boolean shapes are exported as PNG renders by the API (online mode). Each top-level layer becomes a clip with a staggered entrance; edit `data-start`/`data-enter` to choreograph.
Add `@font-face` for the fonts listed in the generated `<head>` comment to match typography exactly.
