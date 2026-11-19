# @hfr/core



## Uso

```ts
import { parseComposition, resolveTimings, loadProject, bundleRuntime } from '@hfr/core';
const project = await loadProject('meu-video');
console.log(project.scenes[0].composition.clips);
```
O runtime do navegador está em `src/runtime/` e é exposto como `window.hf` (ver docs/COMPOSITION.md).

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
