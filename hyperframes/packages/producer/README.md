# @hfr/producer

Render pipeline: plans scenes, captures frames in parallel, mixes audio, applies scene transitions and encodes MP4/WebM/MOV/GIF with FFmpeg.

## Uso

```ts
import { renderProject } from '@hfr/producer';
const r = await renderProject({ project: 'meu-video', output: 'out.mp4', quality: 'high', workers: 4, onProgress: console.log });
```

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
