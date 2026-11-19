# @hfr/sdk

Programmatic API: build compositions in code and lint, inspect, render, narrate and caption them.

## Uso

```ts
import { Composition, h } from '@hfr/sdk';
const c = new Composition({ width: 1280, height: 720, duration: 4 });
c.add(h('h1', { start: 0, enter: 'fade-up 0.6', style: { color: '#fff' } }, 'Olá'));
await c.render('out.mp4');
```

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
