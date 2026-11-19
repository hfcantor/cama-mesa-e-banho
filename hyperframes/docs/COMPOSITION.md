# Formato de composição — referência

Uma composição é um documento HTML com **um** elemento raiz marcado com `data-composition`.
Tudo dentro dele é renderizado no tamanho declarado; o runtime é injetado automaticamente pelo servidor
(preview, inspector e render usam exatamente o mesmo runtime).

## Raiz

| Atributo | Padrão | Descrição |
|---|---|---|
| `data-width`, `data-height` | 1920 × 1080 | tamanho em pixels CSS (use `--scale 2` no render para 4K a partir de layout 1080p) |
| `data-fps` | 30 | quadros por segundo (1–120) |
| `data-duration` | derivada | duração em segundos; sem ela, usa o fim do último clipe/timeline registrada |
| `data-background` | — | cor de fundo |
| `data-audio-analysis` | — | arquivo de áudio analisado (FFT offline) para `hf.audio.*` e visualizadores |

## Clipes (elementos temporizados)

Qualquer elemento com `data-start`, `data-duration` ou `data-end`, além de `<audio>`, `<video>`,
`[data-hf-lottie]`, `[data-hf-captions]` e `[data-hf-particles]`. Fora do intervalo `[start, end)` o clipe fica
com `visibility: hidden` (continua no layout, então animações CSS e fontes já estão carregadas).

**Valores de tempo:** `2`, `2.5s`, `500ms`, `45f` (quadros), `1.5m`, `00:01:02.5`.
**Referências:** `intro.end`, `intro.start + 0.5`, `prev.end - 250ms`, `intro` (= `intro.end`).

| Atributo | Descrição |
|---|---|
| `data-start` / `data-duration` / `data-end` | tempo absoluto na composição (sem duração: até o fim da composição ou da mídia) |
| `data-track` | trilha (inteiro) usada pelo Studio e pelo lint de sobreposição |
| `data-name` | rótulo no Studio |
| `data-enter`, `data-exit` | `preset [duração] [easing] [atraso]`, ex.: `fade-up 0.8 out-expo` |
| `data-keyframes` | JSON `[{ "t": 0, "x": 0, "y": 0, "scale": 1, "rotate": 0, "opacity": 1, "blur": 0, "ease": "in-out-sine" }]` (t relativo ao início do clipe) |
| `data-kenburns` | `in`/`out`/`left`/`right`/`up`/`down` + intensidade (ex.: `in 0.15`) |

**Presets:** `fade`, `fade-up`, `fade-down`, `fade-left`, `fade-right`, `slide-up/down/left/right`, `zoom-in`, `zoom-out`,
`pop`, `blur-in`, `rotate-in`, máscaras `wipe-left/right/up/down`, `iris`, `diamond`, `none`.
**Easings:** `linear`, `in/out/in-out` × `quad|cubic|quart|expo|sine`, `in-back`, `out-back`, `out-elastic`, `out-bounce`,
`ease`, `ease-in`, `ease-out`, `ease-in-out`, `cubic-bezier(a,b,c,d)`.

Os efeitos usam as propriedades CSS individuais `translate`, `scale`, `rotate`, `opacity`, `filter` e `clip-path`, de
modo que não conflitam com animações GSAP em `transform` no mesmo elemento.

### Mídia

```html
<video src="assets/a.mp4" data-start="2" data-media-start="10" data-duration="4" muted data-loop></video>
<audio src="assets/musica.mp3" data-start="0" data-volume="0.7" data-fade-in="1" data-fade-out="2" data-loop></audio>
```

No render, os vídeos são substituídos por quadros extraídos com FFmpeg na taxa da composição (precisão de quadro e
suporte a H.264 no Chromium headless). O áudio de `<audio>` e de `<video>` sem `muted` é mixado pelo producer.

Projetos com `hyperframes.json` também aceitam trilhas globais com *ducking*:

```json
{ "name": "demo", "entry": "index.html",
  "audio": [
    { "src": "assets/voz.mp3", "role": "narration" },
    { "src": "assets/musica.mp3", "volume": 0.6, "loop": true, "fadeOut": 2, "duckUnder": "narration" } ],
  "captions": { "src": "legendas.srt", "embed": true } }
```

### Legendas

```html
<div data-hf-captions="legendas.json" data-style="karaoke" data-position="bottom" data-max-words="5"
     style="font-size:72px; --hf-cap-active:#ffe14d"></div>
```

Formatos: `.srt`, `.vtt` (inclusive timestamps por palavra), `.json` (documento, lista de palavras ou JSON do Whisper/OpenAI),
`.txt` (tempos distribuídos). Estilos: `karaoke`, `pop`, `highlight`, `typewriter`, `bounce`, `plain`. Variáveis CSS:
`--hf-cap-color`, `--hf-cap-active`, `--hf-cap-upcoming`, `--hf-cap-spoken`, `--hf-cap-highlight-bg`, `--hf-cap-highlight-color`.
Atributos: `data-offset`, `data-max-words`, `data-max-chars`, `data-pause-break`.

### Lottie, partículas, visualizadores, shaders

```html
<div data-hf-lottie="assets/anim.json" data-start="1" data-loop style="width:400px;height:400px"></div>
<canvas data-hf-particles="snow" data-count="150" data-colors="#fff,#cde" data-seed="3"></canvas>
<canvas data-hf-visualizer="bars" data-color="#a78bfa"></canvas>          <!-- requer data-audio-analysis -->
<canvas data-hf-shader="ripple" data-from="#imgA" data-to="#imgB" data-start="3" data-duration="1.2"></canvas>
```

## Bibliotecas e fontes servidas

`/__hf/lib/gsap.js` (+ plugins `gsap/SplitText.js`, `gsap/MotionPathPlugin.js`, …), `/__hf/lib/anime.js`,
`/__hf/lib/lottie.js`, `/__hf/lib/three.module.js` (+ `/__hf/lib/three/addons/…`), `/__hf/lib/shader-transitions.js`.
Fontes: `/__hf/fonts/inter|bebas-neue|playfair-display|jetbrains-mono/index.css`. Liste com `hfr libs`.

Three.js via importmap:

```html
<script type="importmap">{"imports":{"three":"/__hf/lib/three.module.js","three/addons/":"/__hf/lib/three/addons/"}}</script>
```

Tailwind v4: `<style data-hf-tailwind>@import "tailwindcss"; @theme { --color-brand: #f06; }</style>`.

## API do runtime (`window.hf`)

| Membro | Descrição |
|---|---|
| `hf.register(anim, { start? })` | registra GSAP (Tween/Timeline), Anime.js (v3/v4), Lottie `AnimationItem`, `Animation` WAAPI ou uma função `(t) => void`; `start` em segundos ou id de clipe |
| `hf.onFrame((t, { frame, fps }) => …)` | callback a cada quadro (Three.js, canvas, contadores) |
| `hf.delayReady(promise)` | adia o início do render até a promise resolver |
| `hf.seek(t)`, `hf.seekFrame(n)`, `hf.play()`, `hf.pause()` | controle de tempo |
| `hf.time`, `hf.duration`, `hf.config`, `hf.mode`, `hf.ready` | estado |
| `hf.describe()` | linha do tempo resolvida, adaptadores, erros e avisos |
| `hf.audio.load(src)`, `hf.audio.level(t)`, `hf.audio.bands(t)` | análise de áudio determinística |
| `hf.random(key)` | aleatório determinístico por chave (além de `Math.random`, que já usa seed) |
| `window.__timelines` | compatibilidade: objetos/arrays de timelines registrados automaticamente |

Animações GSAP criadas durante o carregamento (`gsap.to(...)` sem registro) são controladas automaticamente pela
timeline global. Animações CSS e WAAPI são pausadas e posicionadas a cada quadro, relativas ao início do clipe que as contém.

## Cenas e transições (`hyperframes.json`)

```json
{ "name": "filme", "scenes": [
    { "src": "cenas/01.html" },
    { "src": "cenas/02.html", "transition": { "type": "circleopen", "duration": 0.8 } },
    { "src": "cenas/03.html", "transition": { "type": "wave", "duration": 0.6 } } ] }
```

Cada cena é renderizada separadamente e unida com FFmpeg `xfade` (lista completa: `hfr transitions`). A duração total
é a soma das cenas menos a sobreposição das transições.
