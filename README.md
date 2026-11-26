# E SE...? | HISTÓRIAS DO TABOCAL

Motor de episódios animados em **9:16 (1080×1920)** para TikTok, Reels e Kwai. É feito em
HTML, CSS e JavaScript, com Three.js para o 3D e Web Audio API para o som.

**Episódio 01: "E se a Lua caísse na Terra?"** (1:12 com a narração)

| # | Etapa | Cena | Mundo 3D |
|---|---|---|---|
| 1 | Abertura | Logo da série + título "E SE...?" sobre a Terra e a Lua | espaço |
| 2 | Gancho | Noite no Tabocal. Tito percebe que a Lua cresce | vila |
| 3 | Desenvolvimento | Marés gigantes engolem o litoral | litoral |
| 4 | Escalada | Terremoto, rachaduras incandescentes, "ALERTA SÍSMICO" | vila |
| 5 | Escalada | Observatório: cientistas em choque, alarme e sirene | observatório |
| 6 | Meio do vídeo | Chamada "Curta e siga" enquanto a Lua se aproxima (contador de distância) | espaço |
| 7 | Clímax 1 | Limite de Roche: a Lua se estica, racha e explode | espaço |
| 8 | Clímax 2 | Chuva de meteoros sobre a vila | vila |
| 9 | Final | A Terra ganha anéis | espaço |
| 10 | Virada | "Na vida real a Lua se afasta 3,8 cm/ano". Tito dorme na rede | vila |
| 11 | Chamada para ação | "E você? Comenta aí!" | vila |
| 12 | Tela final | **HISTÓRIAS DO TABOCAL**, "Gostou dessa história?", "CURTA ❤️ COMENTE 💬 E SIGA O PERFIL!" | vila ao amanhecer |

## Episódio 02: "E se você nunca trocasse o lençol?" (1:08 com a narração)

Feito no estilo de cortes rápidos dos vídeos de referência: 46 cenas de 1 a 3 s ancoradas nas palavras da narração, closes em objetos, níveis numerados com carimbo, contador LED, selos de câmera lenta/rebobinando, etiquetas com ponto colorido, ✅/❌ e checklist.

| Trecho | O que acontece |
|---|---|
| Gancho | Lençol limpo, Tito dormindo, calendário, "um terço da vida" |
| **Nível 1 · 1 semana** | Suor, pele morta em câmera lenta, lupa no tecido, primeiro ácaro, banquete, colônia crescendo |
| **Nível 2 · 1 mês** | "Restaurante do Travesseiro" (neon, chef, fila), coceira, nariz entupido, ATCHIM!, prédio de ácaros, chamada para curtir e seguir |
| **Nível 3 · 1 ano** | Mancha, fungos, cheiro, "selva" na cama, Tito não consegue entrar no quarto |
| Solução | Rebobinando, lençol novo caindo, ácaros fugindo com mala, checklist (lençol, travesseiro, fronhas), sono melhor, pergunta final |

Arquivos: `episodes/ep02/lines.js` (falas), `episodes/ep02/episode.js` (cenas e efeitos), `js/three/worlds/quarto.js` (cenário 3D, lençol que suja conforme `state.dirt`, ácaros, prédio, porta), `js/render/overlays2.js` (carimbo, LED, selos, etiquetas, lupa, checklist). Abra com `?ep=ep02`.

A trilha de EP02 é definida em `musicPlan` (trechos longos), porque as cenas curtas reiniciariam a música a cada corte. A narração usa a mesma ferramenta do EP01: `python3 tools/gerar_narracao.py ep02`. Os números citados (um terço da vida, troca semanal) devem ser conferidos antes de publicar.

## Episódios 03 a 12: "E se você nunca lavasse…?"

Dez episódios no mesmo estilo do EP02, todos montados a partir de DADOS (roteiro + textos das etiquetas), em `episodes/epNN/`. O motor genérico fica em:

- `js/core/templates.js`: o plano padrão de 16 falas e ~43 planos (gancho, três níveis com carimbo, LED, CTA no meio, rebobinar, checklist, pergunta final) e as câmeras geradas a partir do tecido em foco.
- `js/core/levelEpisode.js`: transforma o plano em cenas ancoradas nas palavras da narração, com trilha e efeitos sonoros automáticos.
- `js/three/worlds/room.js` (cômodo genérico), `dormitorio.js`, `banheiro.js`, `cozinha.js` (cenários) e `js/three/cloth.js` (tecidos que sujam e criam mofo conforme o nível).

| EP | Tema | Cenário | Tecido em foco |
|---|---|---|---|
| 03 | Toalha de banho | banheiro | toalha |
| 04 | Travesseiro | dormitório | fronha |
| 05 | Edredom | dormitório | edredom |
| 06 | Pano de prato | cozinha | pano |
| 07 | Cortina do box | banheiro | cortina |
| 08 | Tapete do banheiro | banheiro | tapete |
| 09 | Toalha de mesa | cozinha | toalha de mesa |
| 10 | Colchão | dormitório | colchão |
| 11 | Esponja de cozinha | cozinha | esponja |
| 12 | Guardanapo de pano | cozinha | guardanapo |

Abra com `?ep=ep05` (e assim por diante). A narração de cada um vem de `python3 tools/gerar_narracao.py epNN`.

**Conferir antes de publicar** (recomendações de higiene citadas na fala 14 de cada episódio): lavar toalha a cada 3 usos; travesseiro lavado a cada poucos meses e trocado quando amassado; edredom algumas vezes por ano; pano de prato trocado a cada 2 dias; cortina do box lavada 1 vez por mês; tapete do banheiro lavado toda semana; toalha de mesa lavada toda semana; colchão aspirado a cada poucos meses com protetor; esponja trocada a cada 1 a 2 semanas; guardanapo limpo a cada refeição. Os textos são qualitativos de propósito ("germes", "mofo"), sem números de bactérias.

## Como rodar

Os módulos ES precisam de um servidor local; abrir o arquivo com `file://` não funciona.

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

- **Espaço** reproduz ou pausa. **R** reinicia. Clicar na barra avança ou volta.
- `?q=0.5` diminui a resolução interna do 3D em máquinas fracas. O padrão é 0.75, e a gravação usa 1.0.
- `?bloom=0` desliga o pós-processamento de brilho.
- `?ep=ep02` carrega outro episódio de `episodes/`.

## Narração

A narração do EP01 está em `audio/ep01/narracao/L01.mp3 … L14.mp3`. Foi gravada no
**ElevenLabs** (Eleven v3, com tags de interpretação) num arquivo único e dividida por fala
com `tools/dividir_narracao.py`. Esse script transcreve o áudio com faster-whisper, alinha a
transcrição ao texto do roteiro, corta nos silêncios entre as falas e grava o `timings.json`
com o instante real de cada palavra, ajustado pela energia do áudio.

```bash
pip install faster-whisper
python3 tools/dividir_narracao.py ep01 narracao_completa.mp3
```

Alternativa sem conta, com voz sintética do edge-tts (`pt-BR-AntonioNeural`):

```bash
pip install edge-tts
python3 tools/gerar_narracao.py ep01            # todas as falas
python3 tools/gerar_narracao.py ep01 --so L03   # só uma
```

O serviço usado é `speech.platform.bing.com`, que precisa estar liberado na rede. Atrás de
proxy, o script usa `HTTPS_PROXY` sozinho. Ritmo e tom de cada fala ficam em `DIRECAO`,
dentro do script.

- Ao carregar, o player lê a duração real de cada arquivo, e a linha do tempo inteira (cenas,
  câmeras, efeitos, trilha) se ajusta a ela.
- As legendas usam o `timings.json`: cada palavra aparece quando é dita.
- Você também pode usar gravações próprias com os mesmos nomes, ou arrastá-las para o vídeo.
  Para gerar o `timings.json` de uma gravação humana, use `tools/alinhar_narracao.py`
  (precisa de faster-whisper).
- Sem nenhum arquivo, o player entra em modo pré-visualização (tempos estimados, sem voz) e
  avisa no painel lateral.

## Exportar

- **● Gravar** grava o episódio em tempo real, com imagem e áudio, direto do canvas
  1080×1920. O formato é MP4 quando o navegador grava H.264 (Chrome e Edge); caso contrário,
  WebM. Deixe a aba visível durante a gravação. Se a plataforma recusar o arquivo:
  `ffmpeg -i entrada.webm -c:v libx264 -crf 18 -c:a aac saida.mp4`
- **♪ WAV** exporta a mixagem completa (narração + trilha + efeitos), renderizada offline.

## Sincronização

- O relógio mestre é o `AudioContext`. Imagem, legendas, narração, efeitos e trilha usam o
  mesmo relógio, então não se separam, nem ao pausar (`suspend`) nem ao pular para outro ponto.
- Tudo é **ancorado em falas e palavras** (`{ line: 'L10', word: 'meteoros' }`). Os meteoros
  são uma função do tempo, e o som do impacto usa a mesma âncora da explosão na tela.
- As legendas aparecem palavra por palavra no instante da fala, com destaque de cor nas
  palavras-chave, e somem quando a fala termina.
- Durante cada fala, a trilha, os efeitos e o reverb **abaixam sozinhos** (ducking) e voltam nas pausas. A voz fica pelo menos 6 dB acima do fundo em todas as falas, medido na mixagem offline.

## Áudio original

Todos os efeitos (impactos, explosões, batimentos, vento, ondas, tremor, sirene, alarme,
bipes, passos, grilos, meteoros, trovão, riser, braam) e a trilha procedural são
**sintetizados ao vivo** com Web Audio. Não há amostras de terceiros. Os climas da trilha são
mistério, tensão, ação, deslumbramento, calma e encerramento.

## Estrutura

```
index.html, css/style.css          interface mínima (play/pausa/reiniciar/gravar)
js/main.js                          carregamento, interface, gravação, exportação
js/series.js                        identidade fixa da série (perfil, @)
js/core/timeline.js                 roteiro → tempos absolutos (âncoras)
js/core/narration.js                carga dos áudios, detecção de fala, arrastar e soltar
js/core/player.js                   relógio mestre, agendador, ducking, render offline
js/core/director.js                 cena ativa, transições, composição do quadro
js/audio/synth.js, music.js         efeitos e trilha originais
js/render/stage.js                  WebGL + bloom + compositor 2D, câmeras
js/render/overlays.js               legendas, logo, CTAs, tela final
js/three/                           personagens, partículas, texturas e os 4 mundos
episodes/ep01/episode.js            roteiro, cenas, câmeras e cues do episódio
tools/dividir_narracao.py           divide uma narração única em L01..L14 + timings.json
tools/gerar_narracao.py             gera a narração com edge-tts + timings.json
tools/alinhar_narracao.py           timings.json para gravações humanas (whisper)
vendor/, fonts/                     Three.js r170 (MIT), Anton e Montserrat (OFL), locais
```

### Novo episódio

Copie `episodes/ep01/` para `episodes/ep02/`, troque as falas (`lines`) e as cenas (`scenes`)
e abra `?ep=ep02`. A abertura "E SE...?", o selo da série, a chamada do meio e a tela final já
vêm do motor.

## Antes de publicar

- O @ do perfil na chamada do meio está em `js/series.js` (`@historiasdotabocal`). Troque
  pelo @ real.
