# E SE...? | HISTÓRIAS DO TABOCAL

Motor de episódios animados em **9:16 (1080×1920)** para TikTok, Reels e Kwai. É feito em
HTML, CSS e JavaScript, com Three.js para o 3D e Web Audio API para o som.

**Episódio 01: "E se a Lua caísse na Terra?"** (cerca de 1:30 com tempos estimados)

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

## Narração (obrigatório para o vídeo final)

**Não há voz incluída.** Sem os arquivos, o player entra em **modo pré-visualização**: as
legendas e as cenas seguem tempos estimados pelo roteiro, nada é falado, e o painel lateral
avisa isso.

1. Grave cada fala em `audio/ep01/narracao/L01.mp3 … L14.mp3`. A lista com o texto de cada
   fala está em [`audio/ep01/narracao/LEIA-ME.md`](audio/ep01/narracao/LEIA-ME.md). Outra opção
   é **arrastar os arquivos para o vídeo** no navegador.
2. Ao carregar, o player lê a **duração real** de cada arquivo e detecta na forma de onda onde
   a fala começa e termina. A linha do tempo inteira (cenas, câmeras, efeitos, trilha) se
   reorganiza a partir desses tempos.
3. Para a legenda acompanhar **palavra por palavra** pelos tempos reais, gere o `timings.json`:
   ```bash
   pip install faster-whisper
   python3 tools/alinhar_narracao.py ep01
   ```
   Sem esse arquivo, cada palavra é distribuída por sílabas dentro do intervalo real da fala.
   É um cálculo fixo, sem nada aleatório.

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
- A trilha **abaixa sozinha** durante cada fala (ducking) e volta a subir nas pausas.

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
tools/alinhar_narracao.py           gera timings.json com tempos por palavra
vendor/, fonts/                     Three.js r170 (MIT), Anton e Montserrat (OFL), locais
```

### Novo episódio

Copie `episodes/ep01/` para `episodes/ep02/`, troque as falas (`lines`) e as cenas (`scenes`)
e abra `?ep=ep02`. A abertura "E SE...?", o selo da série, a chamada do meio e a tela final já
vêm do motor.

## Antes de publicar

- O roteiro do EP01 está marcado como **proposto** (`roteiroStatus`). Troque pelo texto
  aprovado se for diferente e mude o status para `aprovado`.
- O @ do perfil na chamada do meio está em `js/series.js` (`@historiasdotabocal`). Troque
  pelo @ real.
