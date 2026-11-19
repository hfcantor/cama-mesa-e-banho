# @hfr/shader-transitions

Shader-based transitions: GLSL (WebGL, in-composition) and FFmpeg xfade (scene-level, producer).

## Uso

Cenas: `"transition": { "type": "circleopen", "duration": 0.8 }` (lista: `hfr transitions`).
Dentro da composição: `<script src="/__hf/lib/shader-transitions.js"></script>` + `<canvas data-hf-shader="ripple" data-from="#a" data-to="#b" data-start="2" data-duration="1">`.

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
