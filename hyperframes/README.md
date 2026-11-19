# HyperFrames Rebuild (`hfr`)

Plataforma para transformar **HTML, CSS e JavaScript em vídeo**: composições com linha do tempo,
animações (GSAP, Anime.js, Lottie, Three.js, WAAPI, CSS), áudio, narração, legendas sincronizadas,
transições, renderização determinística em MP4/WebM/MOV/GIF, Studio web, CLI, SDK e renderização em nuvem.

> **Sobre a origem.** Este projeto é uma **reimplementação independente**, inspirada na arquitetura e
> nas funcionalidades descritas do HyperFrames by HeyGen (referência 0.9.70). Nenhum código-fonte
> original foi usado ou recebido. Formatos, APIs e nomes de pacotes (`@hfr/*`, comando `hfr`) são
> próprios deste projeto e não garantem compatibilidade binária com o produto original.

## Início rápido

Requisitos: **Node.js ≥ 22.18** (executa TypeScript diretamente), **FFmpeg/FFprobe** e **Chromium** (Playwright).

```bash
cd hyperframes
npm install
npx playwright-core install chromium     # se o Chromium ainda não estiver instalado
npx hfr doctor                            # verifica FFmpeg, codecs, Chromium/WebGL, TTS, chaves

npx hfr init meu-video --template promo  # 9 templates: npx hfr registry list --type template
cd meu-video
npx hfr preview                           # player no navegador com recarga automática
npx hfr lint && npx hfr inspect           # validação estática e em tempo de execução
npx hfr render -o renders/final.mp4 --resolution 1080p
npx hfr studio                            # interface web completa (http://127.0.0.1:4400)
```

## Como é uma composição

```html
<div data-composition data-width="1920" data-height="1080" data-fps="30" data-duration="8">
  <section id="intro" data-start="0" data-duration="3" data-enter="fade-up 0.8" data-exit="blur-in 0.5">…</section>
  <img src="assets/foto.jpg" data-start="intro.end" data-duration="4" data-kenburns="in 0.15">
  <video src="assets/clip.mp4" data-start="2" data-media-start="5" muted></video>
  <audio src="assets/musica.mp3" data-volume="0.6" data-fade-out="2"></audio>
  <div data-hf-captions="legendas.json" data-style="karaoke"></div>
</div>
<script src="/__hf/lib/gsap.js"></script>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.from('#intro h1', { y: 80, opacity: 0, duration: 1 });
  hf.register(tl);            // torna a animação "buscável" quadro a quadro
</script>
```

Referência completa: [docs/COMPOSITION.md](docs/COMPOSITION.md) · Arquitetura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## O que está implementado (e testado)

| Área | Situação | Como foi verificado |
|---|---|---|
| Modelo de composição, tempos relativos (`intro.end + 0.5`), trilhas | ✅ real | testes unitários |
| Runtime determinístico (tempo virtual: `performance.now`, `Date`, `requestAnimationFrame`, `Math.random` com seed) | ✅ real | testes de busca para frente/para trás e de pixels idênticos |
| GSAP (timeline global automática + `hf.register`), Anime.js v4, Lottie, Three.js (WebGL), WAAPI/animações CSS | ✅ real | templates renderizados e inspecionados |
| Tailwind CSS v4 (compilado no servidor com o motor oficial) | ✅ real | template `tailwind-promo` |
| Renderização MP4 (H.264/AAC), WebM (VP9/Opus), MOV (ProRes 422 HQ), GIF; 720p–4K; `--scale 2`; intervalos; workers paralelos | ✅ real | testes de integração com verificação de pixel, duração, fps e codec |
| Vídeo dentro da composição com precisão de quadro (frames extraídos via FFmpeg, pois o Chromium do Playwright não decodifica H.264) | ✅ real | teste de cor por quadro |
| Mixagem de áudio: offsets, trims, volume, fades, loop, *ducking* por sidechain | ✅ real | teste de silêncio/tom por janela de tempo |
| Transições entre cenas (58 do FFmpeg `xfade` + 5 por expressão de pixel) e transições WebGL/GLSL dentro da composição | ✅ real | teste de cross-fade |
| Presets de entrada/saída, máscaras (wipe, iris, diamond), blur, zoom, pan, Ken Burns, keyframes, partículas determinísticas | ✅ real | testes unitários + renders |
| Legendas: SRT/VTT/JSON/Whisper JSON, exportação SRT/VTT/ASS (karaokê), 6 estilos animados por palavra, faixa embutida (mov_text/WebVTT) | ✅ real | testes |
| Áudio reativo (FFT offline por quadro), visualizadores | ✅ real | testes de FFT/bandas |
| Lint (31 regras) e inspector (erros de runtime, fontes, quadros em branco, determinismo, A/V sync) | ✅ real | testes |
| CLI `hfr` (20 comandos), SDK, player `<hf-player>`, Studio (editor, linha do tempo arrastável, mídia, validação, render com progresso, registry, share) | ✅ real | testes de API + capturas de tela automatizadas |
| Registry: 17 blocos + 9 templates, registries remotos via HTTP | ✅ real | testes |
| Skills: slideshow, reverse-any-video, style sampling, captura de site, Figma (offline), Remotion → HyperFrames | ✅ real | testes com fixtures |
| Pacotes de compartilhamento (página estática, poster, VTT, checksums, zip do projeto) | ✅ real | CLI testada |
| AWS Lambda e Google Cloud Run (handlers) | ✅ lógica testada localmente com `file://` | **não** testados contra AWS/GCP reais; Dockerfiles não construídos neste ambiente |

### Dependências externas (implementadas, mas exigem credenciais/serviços)

| Recurso | Requisito | Alternativa legítima já incluída |
|---|---|---|
| TTS ElevenLabs (com tempos por caractere) | `ELEVENLABS_API_KEY` | **espeak-ng** offline (testado) ou qualquer CLI via `HFR_TTS_COMMAND` (piper, edge-tts…) + alinhamento offline |
| TTS OpenAI | `OPENAI_API_KEY` | idem |
| Transcrição automática | `OPENAI_API_KEY` ou CLI `whisper` local | `hfr captions align` (alinhamento por silêncios com o roteiro conhecido) |
| Importação do Figma online | `FIGMA_TOKEN` | `hfr figma --from-json` (conversão offline de um JSON salvo da API) |
| S3 / Cloud Storage | credenciais AWS/GCP | armazenamento `file://` para execução local |

### Limitações conhecidas

- Conversão Remotion é **estática** (AST): estado React, efeitos, dados assíncronos, `.map()` e renderização condicional são listados como "não suportados" no `conversion-report.md`.
- *Reverse any video* não faz OCR nem reconhecimento de objetos (exporta quadros-chave para reconstrução manual ou por IA).
- `setTimeout/setInterval` não são virtualizados (o lint avisa); use timelines, `data-keyframes` ou `hf.onFrame`.
- Vídeo com canal alfa (transparência) na saída não é suportado.

## Pacotes

| Pacote | Responsabilidade |
|---|---|
| `core` | modelo de composição, tempos, efeitos, legendas, partículas, projeto, **runtime do navegador** |
| `parsers` | SRT/VTT/ASS/JSON, slides em Markdown, checagem de sintaxe CSS/JS |
| `media` | ("media use") FFprobe/FFmpeg: probe, transcode, frames, FFT, silêncio, loudness, cenas, paleta, fontes, política de upload |
| `engine` | servidor de composições (injeção do runtime, libs, fontes, Tailwind, endpoints de mídia), Chromium headless, captura via CDP |
| `producer` | pipeline de render: planejamento, workers paralelos, concat, xfade, mixagem, encode, verificação |
| `shader-transitions` | transições GLSL (WebGL) e mapeamento para `xfade` |
| `lint` / `inspector` | validação estática / diagnóstico em execução |
| `voice` | TTS, transcrição, alinhamento, narração |
| `registry` | blocos e templates, parâmetros, inserção, registries remotos |
| `skills` | slideshow, reverse video, style sampling, captura de site, Figma, Remotion |
| `player` | web component `<hf-player>` |
| `sdk` / `sdk-playground` | API programática (`Composition`, `h()`) e exemplos executáveis |
| `cli` | comando `hfr` |
| `studio` / `studio-server` | interface web / API REST + SSE |
| `share` | pacote de compartilhamento estático |
| `cloud-common`, `aws-lambda`, `gcp-cloud-run` | renderização em nuvem |

Skills para agentes de IA (instruções no formato SKILL.md): [`skills/`](skills).

## Desenvolvimento

```bash
npm run typecheck     # tsc --noEmit em todo o monorepo (TypeScript estrito)
npm test              # 55 testes (unitários + integração com Chromium e FFmpeg reais)
npm run examples      # executa os exemplos do SDK (gera MP4s em packages/sdk-playground/out)
npm run registry:build  # regenera blocos/templates do registry
```

O código é TypeScript executado diretamente pelo Node (type stripping) — sem etapa de build. As partes de
navegador (runtime, player, Studio, transições WebGL) são empacotadas sob demanda com esbuild.

Licenças de terceiros: GSAP (licença "no charge" da GreenSock/Webflow), Anime.js (MIT), lottie-web (MIT),
Three.js (MIT), Tailwind CSS (MIT), CodeMirror (MIT), Playwright (Apache-2.0), fontes Fontsource (OFL).
