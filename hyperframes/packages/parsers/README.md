# @hfr/parsers

Parsers and serializers: captions (SRT, WebVTT, ASS, JSON word timings), slide markdown, CSS/JS syntax checks.

## Uso

```ts
import { parseCaptions, toVtt, toAss, parseSlidesMarkdown, checkCss } from '@hfr/parsers';
const doc = parseCaptions('a.srt', texto);
await writeFile('a.vtt', toVtt(doc, { karaoke: true }));
```

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
