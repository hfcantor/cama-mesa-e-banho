# @hfr/media

Media toolkit (FFmpeg/FFprobe): probing, transcoding, frame extraction, audio analysis, scene detection, palettes, fonts.

## Uso

```ts
import { probe, transcode, extractFrames, analyzeAudio, detectScenes, extractPalette } from '@hfr/media';
const info = await probe('clip.mp4');
const bands = await analyzeAudio('musica.mp3', { fps: 30, bands: 32 });
```
Requer `ffmpeg`/`ffprobe` no PATH (ou `HFR_FFMPEG`/`HFR_FFPROBE`).

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
