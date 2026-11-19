# @hfr/player

<hf-player> web component: embeds a composition in an iframe with playback controls (postMessage protocol).

## Uso

```html
<script type="module" src="/player.js"></script>
<hf-player src="/preview/meu-video/index.html" controls loop></hf-player>
```
API: `play()`, `pause()`, `seek(t)`, `step(n)`, `reload()`, `describe()`; eventos `ready`, `timeupdate`, `play`, `pause`, `ended`.

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
