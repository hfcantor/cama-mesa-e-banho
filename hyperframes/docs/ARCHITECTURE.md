# Arquitetura

```
                ┌──────────── autores ────────────┐
                │  HTML/CSS/JS  ·  SDK  ·  Studio  │
                └───────────────┬─────────────────┘
                                ▼
 skills ──► registry ──► projeto (hyperframes.json + cenas HTML + assets)
 (slides, reverse, style,           │
  figma, remotion, capture)         ├──► lint (estático: parse5, css-tree, acorn, ffprobe)
                                    │
                                    ▼
                    engine: servidor de composições
     ┌─────────────────────────────────────────────────────────────────┐
     │ injeta runtime + parâmetros · compila Tailwind v4 · /__hf/lib/* │
     │ /__hf/probe · /__hf/frames (FFmpeg) · /__hf/analysis (FFT)      │
     │ /__hf/captions (parsers) · Range requests · safeJoin            │
     └───────────┬──────────────────────┬─────────────────┬────────────┘
                 ▼                      ▼                 ▼
      preview (player, Studio)   inspector (Chromium)   producer
                                                          │
                     ┌────────────────────────────────────┤
                     ▼                                    ▼
      N workers: Chromium page → hf.seek(t)      áudio: probe → filtro FFmpeg
      → CDP Page.captureScreenshot → stdin       (atrim, volume, afade, adelay,
      do FFmpeg (image2pipe) → segmento          sidechaincompress, amix, alimiter)
                     │                                    │
                     └──► concat → xfade entre cenas ─────┴──► encode/mux → ffprobe (verificação)
                                                                   │
                                     share (página estática) ◄─────┤
                                     cloud (S3/GCS) ◄──────────────┘
```

## Princípios

1. **Um único runtime.** Preview, inspector e render executam o mesmo código (`packages/core/src/runtime`),
   empacotado sob demanda com esbuild. O que se vê no Studio é o que sai no MP4.
2. **Tempo virtual.** Antes de qualquer script do usuário, o runtime substitui `performance.now`, `Date`,
   `requestAnimationFrame` e `Math.random` (seed). Cada quadro é uma função pura do tempo, então quadros podem
   ser capturados fora de ordem e em paralelo — e o inspector verifica isso re-renderizando quadros em ordem inversa.
3. **Bibliotecas reais.** GSAP, Anime.js, lottie-web, Three.js, Tailwind e CodeMirror vêm do npm; nada é reimplementado.
   Adaptadores apenas as tornam "buscáveis" (`seek`).
4. **FFmpeg para mídia.** Extração de quadros, análise de áudio, mixagem, transições entre cenas e encode. O Chromium
   do Playwright não decodifica H.264, por isso vídeos viram sequências de quadros no render.
5. **Sem build.** TypeScript estrito executado pelo Node 22.18+ (type stripping); `tsc --noEmit` para checagem.

## Pacotes e dependências

```
core ◄─ parsers ◄─ media ◄─ engine ◄─ producer ◄─ (cli, sdk, studio-server, cloud-common)
  ▲         ▲        ▲        ▲          ▲
  └─ lint ──┴────────┘        └─ inspector
voice (media, parsers) · registry (core) · skills (engine, media, parsers, voice, typescript)
shader-transitions (esbuild) · player (esbuild) · studio (codemirror, player) · share (media, parsers, fflate)
aws-lambda / gcp-cloud-run → cloud-common → producer
```

## Renderização (producer)

1. `loadProject` valida o manifesto e lê as cenas (parse5).
2. Para cada cena o producer abre a página em modo `render` e lê `hf.describe()`: tempos resolvidos (incluindo
   duração de mídia via ffprobe), adaptadores, erros. Erros de runtime abortam o render (a menos que `allowErrors`).
3. Os quadros são divididos em faixas contíguas entre *workers*; cada worker tem sua página e seu processo FFmpeg.
   Cenas simples em MP4 são codificadas direto no formato final e concatenadas sem recodificar; projetos com cenas,
   escalonamento ou outros formatos usam um intermediário H.264 CRF 10.
4. Áudio: cada fonte vira uma cadeia de filtros com trim/offset/volume/fades; ducking via `sidechaincompress`.
5. A saída é verificada com ffprobe (duração e tamanho); divergências viram avisos no resultado.

## Studio

`studio-server` expõe uma API REST (projetos, arquivos, timeline, PATCH de atributos de clipe preservando o resto do
arquivo byte a byte, mídia, lint, inspect, renders com fila e SSE, registry, TTS, transcrição, share) e serve:
`/` (SPA), `/preview/:id/*` (projeto com runtime em modo preview), `/share/:id/*`.

Segurança: escuta em 127.0.0.1 por padrão; fora do loopback exige token (`Authorization: Bearer`, `x-hfr-token` ou
cookie HttpOnly). Requisições que alteram estado precisam vir da mesma origem; JSON exige `content-type` correto;
caminhos são resolvidos com `safeJoin` (sem `..`, sem arquivos ocultos); uploads têm lista de extensões, limites
por tipo, verificação de assinatura binária e nomes sanitizados; a SPA é servida com CSP restritiva.

## Nuvem

`cloud-common` baixa o projeto (prefixo ou `.zip`, com proteção contra zip-slip e limites de tamanho), renderiza com o
producer e envia o resultado. `aws-lambda` (imagem de contêiner + `aws-lambda-ric`, S3 via AWS SDK v3) e `gcp-cloud-run`
(HTTP, Cloud Storage) só adicionam adaptadores de armazenamento. Ambos aceitam `file://` quando
`HFR_ALLOW_FILE_STORAGE=1`, o que permite testar a lógica completa localmente.
