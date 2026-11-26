# EP02: "E se você NUNCA trocasse o lençol?"

**Formato:** 9:16 (1080×1920), ~75 s, mesmo motor do EP01 (Three.js + narração por palavra).
**Estilo de referência:** os dois vídeos enviados (O emprego que ninguém quer no Japão / Os 3 domínios de bola mais difíceis).
**Personagem:** Tito (protagonista, deitado/sentado na cama). Os ácaros são 3D, bem expressivos, tipo "vizinhos de cama".

> Status: **rascunho para aprovação.** Nada do episódio foi codificado ainda.
> Números marcados com ⚠ são ordem de grandeza popular e devem ser conferidos antes de publicar.

---

## O que copiei dos vídeos de referência

| Técnica observada | Onde aparece lá | Como uso aqui |
|---|---|---|
| Corte a cada 1–2 s, um assunto por plano | Vídeo 1 inteiro | Mínimo de 38 planos em 75 s; nenhum plano passa de 3 s |
| Close extremo em objeto-chave | Relógio, plaquinha, calendário (V1) | Travesseiro, etiqueta "TROCADO HÁ: 0 DIAS", calendário, lupa no tecido |
| Contador digital que roda | "0 ANOS → 3 ANOS" (V1), km/h, RPM (V2) | "SEM TROCAR HÁ: 0 → 7 → 30 → 365 DIAS" e contador de ácaros |
| Estrutura em níveis numerados | NÍVEL 1/2/3 (V2) | NÍVEL 1 · 1 SEMANA, NÍVEL 2 · 1 MÊS, NÍVEL 3 · 1 ANO |
| Selo de câmera lenta e rebobinando | "CÂMERA LENTA 0,05x", "REBOBINANDO" (V2) | Zoom no tecido em câmera lenta e rebobinar até o lençol limpo |
| Etiquetinha flutuante curta + ✅/❌ | "ROXO NA CANELA", ✅ ❌ (V2) | "SUOR: ½ COPO ⚠", "PELE MORTA", ✅ trocado / ❌ sujo |
| Clima de cor segue a emoção | Quente/amarelo = bom, frio/cinza + chuva = ruim (V1) | Quarto quente e limpo no começo, esverdeado e escuro no Nível 3 |
| Metáfora de escala | Prédio de 12 andares = 35 m (V2) | Cidade de ácaros crescendo debaixo da cama |
| Legenda 1–2 palavras, palavra-chave em cor | Os dois | Já existe no motor (`emph`) |
| Balão de pensamento com ícone | "?" e "$" (V1) | 🛏️ "ahh, que delícia" (Tito) × 🕷️ "banquete!" (ácaros) |
| Fusão para passagem de tempo | V1 (dissolve + calendário) | Folha de calendário voando entre os níveis |

---

## Roteiro (narração, falas `L01…L16`)

| id | Texto | `emph` |
|---|---|---|
| L01 | E se… você nunca trocasse o lençol? | lencol: gold, nunca: red |
| L02 | Você passa um terço da vida deitado nele. | terco: gold, vida: blue |
| L03 | Nível um: uma semana. | nivel: gold, semana: gold |
| L04 | Toda noite você solta suor e milhares de células de pele. | suor: blue, pele: orange |
| L05 | E tem alguém muito feliz com isso: os ácaros. | acaros: red |
| L06 | Nível dois: um mês. | mes: gold |
| L07 | O lençol vira restaurante. Seu travesseiro, a cozinha. | restaurante: orange |
| L08 | Aí começam a coceira, o nariz entupido e a alergia. | coceira: red, alergia: red |
| L09 | Se curtiu, já deixa o like e segue o perfil… porque o Nível três é pior. | like: red, segue: gold |
| L10 | Nível três: um ano inteiro. | ano: gold |
| L11 | Milhões de ácaros, fungos, manchas e um cheiro que ninguém aguenta. | milhoes: gold, fungos: green |
| L12 | O Tito já nem consegue entrar no quarto. | tito: gold |
| L13 | Mas calma: a solução é simples. | calma: green, simples: green |
| L14 | Troque o lençol toda semana, e o travesseiro, as fronhas, a cada dois ou três dias, se der. | semana: gold |
| L15 | Cama limpa, sono melhor. O Tito agradece. | limpa: green, melhor: green |
| L16 | E você, quando foi a última vez que trocou? Comenta aí! | ultima: gold, comenta: blue |

⚠ Antes de gravar: conferir "terço da vida" (aprox. 1/3 se dorme 8 h), frequência de troca (recomendação comum: 1×/semana) e qualquer número de ácaros/suor. Se não confirmar, o texto fica qualitativo ("milhares", "muitos").

---

## Storyboard plano a plano

Legenda: **CÂM** = câmera · **FX** = efeito visual · **SFX** = som · **LEG** = destaque da legenda.

### ABERTURA / GANCHO (0:00–0:07)

| # | Tempo | Plano | CÂM | Ação / FX | SFX |
|---|---|---|---|---|---|
| 1 | 0:00–0:01 | Título "E SE…?" sobre um lençol branco impecável | Close, push-in | Logo da série, lençol ondulando | logo |
| 2 | 0:01–0:03 | Tito deitado, sorrindo, cercado de luz quente | Plano médio, orbita lenta | Contador "TROCADO HÁ: 0 DIAS" aparece na parede | ding |
| 3 | 0:03–0:04 | Calendário gigante | Close | Folha voa, número gira | whoosh |
| 4 | 0:04–0:05 | Rosto do Tito, olhos arregalados | Close extremo | Gota de suor, "?" no balão | sting |
| 5 | 0:05–0:07 | Plano aberto: o quarto inteiro, a cama no centro | Plano geral, afasta | Selo "UM TERÇO DA VIDA AQUI" ⚠ | riser |

### NÍVEL 1 · 1 SEMANA (0:07–0:22)

| # | Tempo | Plano | CÂM | Ação / FX | SFX |
|---|---|---|---|---|---|
| 6 | 0:07–0:08 | Carimbo "NÍVEL 1 · 1 SEMANA" | Fixa | Carimbo cai com impacto, tela treme | thud |
| 7 | 0:08–0:10 | Tito dormindo, "zzz" | Plano médio | Contador sobe 0 → 7 dias | tic-tac |
| 8 | 0:10–0:11 | Suor saindo do Tito | Close no travesseiro | Gotas caem; etiqueta "SUOR ⚠" | splash |
| 9 | 0:11–0:12 | Flocos de pele caindo como neve | Câmera lenta | Selo "CÂMERA LENTA 0,1x", etiqueta "PELE MORTA" | sino suave |
| 10 | 0:12–0:14 | Lupa sobre o tecido | Zoom extremo | Fibras do lençol viram um "campo" | zoom |
| 11 | 0:14–0:15 | Primeiro ácaro olha pra câmera | Close | Olhinhos brilhando, sorriso | pop |
| 12 | 0:15–0:17 | Ácaros descendo pela fronha com guardanapo | Plano médio | Balão do ácaro: 🍽️ "banquete!" | risada |
| 13 | 0:17–0:19 | Tito feliz, balão 🛏️ "que delícia" × ácaros em festa | Divide a tela | Duas reações lado a lado | contraste |
| 14 | 0:19–0:21 | Colônia de ácaros multiplicando | Plano aberto, topo | Contador de ácaros 10 → 100 → 1.000 | blips |
| 15 | 0:21–0:22 | Folha do calendário vira | Close | Fusão para o próximo nível | whoosh |

### NÍVEL 2 · 1 MÊS (0:22–0:42)

| # | Tempo | Plano | CÂM | Ação / FX | SFX |
|---|---|---|---|---|---|
| 16 | 0:22–0:23 | Carimbo "NÍVEL 2 · 1 MÊS" | Fixa | Tela treme, cor do quarto esfria | thud |
| 17 | 0:23–0:25 | Travesseiro virou cozinha: ácaro-chef | Close | Panelas, chapéu, fumaça | sizzle |
| 18 | 0:25–0:27 | Placa "RESTAURANTE DO TRAVESSEIRO" acende | Close na placa | Neon pisca | neon |
| 19 | 0:27–0:29 | Fila de ácaros na porta | Plano geral | Vários personagens, expressões variadas | murmúrio |
| 20 | 0:29–0:30 | Tito acorda coçando | Close no rosto | Olhos vermelhos, nariz escorrendo | espirro |
| 21 | 0:30–0:31 | ❌ "ALERGIA" | Plano médio | Ícone ❌ + etiqueta | erro |
| 22 | 0:31–0:33 | Tito espirra, os lençóis voam | Plano médio | Partículas, poeira, tela treme | atchim |
| 23 | 0:33–0:35 | Contador de ácaros 1.000 → 100.000 ⚠ | Close no contador | Números rodando como no "0 ANOS" | roleta |
| 24 | 0:35–0:38 | Cama "cresce" como prédio de ácaros (metáfora de escala) | Câmera sobe | Andares com janelas acesas, "CIDADE DE ÁCAROS" | pop-pop |
| 25 | 0:38–0:40 | **CTA:** botão de like pulando e "SEGUE" | Close | Coração gigante, setinha de seguir | ding |
| 26 | 0:40–0:42 | Calendário vira rápido (muitas folhas) | Close | Fusão, cor muda para esverdeado | whoosh+riser |

### NÍVEL 3 · 1 ANO (0:42–0:58)

| # | Tempo | Plano | CÂM | Ação / FX | SFX |
|---|---|---|---|---|---|
| 27 | 0:42–0:43 | Carimbo "NÍVEL 3 · 1 ANO" | Fixa | Tela escurece, vinheta verde | thud grave |
| 28 | 0:43–0:44 | Contador "365 DIAS" | Close | Números em LED, piscando | alarme |
| 29 | 0:44–0:46 | Lençol amarelado com manchas e fungos verdes | Zoom extremo | Selo "CÂMERA LENTA 0,05x", esporos | borbulhar |
| 30 | 0:46–0:48 | Nuvem de mau cheiro saindo da cama | Plano médio | Linhas onduladas verdes, moscas | zumbido |
| 31 | 0:48–0:50 | Metade da cama já é uma "selva" | Plano geral | Plantinhas crescendo no colchão | fanfarra torta |
| 32 | 0:50–0:52 | Tito na porta com a mão no nariz | Close | Olhos lacrimejando | tosse |
| 33 | 0:52–0:54 | "REBOBINANDO" até o lençol limpo (volta no tempo) | Efeito TV | Linhas de TV, calendário ao contrário | rewind |
| 34 | 0:54–0:56 | Lençol novo caindo sobre a cama | Câmera lenta | Selo "0,1x", tecido ondula | swoosh |
| 35 | 0:56–0:58 | Ácaros fugindo, mala na mão | Plano aberto | Saem correndo da cama | passos |

### VIRADA / SOLUÇÃO (0:58–1:12)

| # | Tempo | Plano | CÂM | Ação / FX | SFX |
|---|---|---|---|---|---|
| 36 | 0:58–1:00 | Calendário com "SEMANAL" marcado | Close | ✅ carimbo verde | ding |
| 37 | 1:00–1:03 | Checklist: lençol ✅ fronha ✅ travesseiro ✅ | Close na lista | Itens riscando | check |
| 38 | 1:03–1:05 | Quarto limpo, cor quente de volta | Plano geral | Raios de sol pela janela | harmonia |
| 39 | 1:05–1:08 | Tito dormindo sorrindo, balão 🌙 | Close | Estrelinhas, "zzz" suave | sino |
| 40 | 1:08–1:10 | Tito acorda de braços pra cima | Plano médio | Luz dourada, pássaros | alegre |
| 41 | 1:10–1:12 | Pergunta "QUANDO FOI A ÚLTIMA VEZ?" | Close no calendário | Folha em branco | ? |

### FINAL (1:12–1:15)

| # | Tempo | Plano | CÂM | Ação / FX |
|---|---|---|---|---|
| 42 | 1:12–1:15 | Tela final: **HISTÓRIAS DO TABOCAL**, "COMENTA AÍ!", "CURTA ❤️ COMENTE 💬 E SIGA!" | Fixa | Mesma tela final do EP01 |

---

## Decisões em aberto (preciso de você)

1. **Aprovar o tema e o texto da narração** (ou me dizer o que mudar).
2. **Marca da loja:** quer a logo/nome da loja no final ou um produto aparecendo no Nível 3 (lençol novo)? Sem isso, o episódio fica "puro conteúdo".
3. **Voz:** usar edge-tts (`pt-BR-AntonioNeural`) para ter áudio já, ou você grava no ElevenLabs depois?
4. **Cenário novo:** o motor tem os mundos `space`, `ocean`, `village`, `lab`. Para este episódio vou criar um mundo `quarto` (cama, janela, calendário, travesseiros, lupa/microscópio). OK?
