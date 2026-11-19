# @hfr/voice

Narration: text-to-speech providers (espeak-ng, ElevenLabs, OpenAI, custom command), transcription (OpenAI, Whisper CLI) and offline word alignment.

## Uso

```ts
import { synthesize, transcribe, alignText, buildNarration } from '@hfr/voice';
const r = await synthesize({ text: 'Olá', out: 'vo.mp3', provider: 'espeak', voice: 'pt-br' });
```
Provedores: `espeak` (offline), `command` (`HFR_TTS_COMMAND`), `elevenlabs` (`ELEVENLABS_API_KEY`), `openai` (`OPENAI_API_KEY`). Transcrição: `openai` ou CLI `whisper`.

Documentação geral: [README](../../README.md) · [Arquitetura](../../docs/ARCHITECTURE.md) · [Formato](../../docs/COMPOSITION.md)
