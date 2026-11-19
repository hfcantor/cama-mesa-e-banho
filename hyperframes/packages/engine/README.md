# @hfr/engine

Rendering engine: composition HTTP server (runtime injection, vendor libs, Tailwind, media endpoints), headless Chromium control and frame capture.

## Uso

```ts
import { startCompositionServer, launchBrowser, openComposition, captureFrame } from '@hfr/engine';
const srv = await startCompositionServer({ root: 'meu-video', mode: 'render' });
const comp = await openComposition(await launchBrowser(), srv.url, { width: 1920, height: 1080 });
const jpeg = await captureFrame(comp, 1.5, { format: 'jpeg', width: 1920, height: 1080 });
```
Variáveis: `HFR_CHROMIUM_PATH`, `HFR_CACHE_DIR`.

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
