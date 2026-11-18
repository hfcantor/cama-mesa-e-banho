# Narração do EP01 — coloque os arquivos aqui

Um arquivo por fala, com o id da fala no nome:

| Arquivo | Fala |
|---|---|
| `L01.mp3` | E se... a Lua começasse a cair em direção à Terra? |
| `L02.mp3` | Numa noite comum, aqui no Tabocal, o Tito percebeu algo estranho. |
| `L03.mp3` | A Lua estava maior. Muito maior. |
| `L04.mp3` | Em poucas horas, as marés subiram como nunca. O mar engoliu praias inteiras. |
| `L05.mp3` | A gravidade da Lua puxava a própria crosta da Terra… e os terremotos começaram. |
| `L06.mp3` | Nos observatórios, os cientistas não acreditavam no que viam. |
| `L07.mp3` | Se tá curtindo, já deixa o like e segue o perfil… porque o pior ainda vai acontecer. |
| `L08.mp3` | A dezoito mil quilômetros, a Lua cruzou o limite de Roche. |
| `L09.mp3` | E a gravidade da Terra começou a rasgá-la em pedaços. |
| `L10.mp3` | Bilhões de rochas cobriram o céu… e uma chuva de meteoros caiu sobre o planeta. |
| `L11.mp3` | Quando a poeira baixou, a Terra tinha ganhado algo novo: anéis. Como Saturno. |
| `L12.mp3` | Mas calma. Na vida real, a Lua está se afastando: quase quatro centímetros por ano. |
| `L13.mp3` | Ou seja… o Tito pode dormir tranquilo. |
| `L14.mp3` | E você? Acha que a humanidade sobreviveria? Comenta aí! |

- Formatos aceitos: `.mp3`, `.wav`, `.ogg`, `.m4a`.
- Silêncio no começo/fim do arquivo não atrapalha: o player detecta onde a fala começa e termina.
- Para sincronizar a legenda palavra por palavra, gere o `timings.json`:
  `python3 tools/alinhar_narracao.py ep01`
- Se o texto aprovado for diferente, altere o `text` da fala em `episodes/ep01/episode.js`
  **e** grave a narração com o texto novo — a legenda sempre mostra o texto do roteiro.
