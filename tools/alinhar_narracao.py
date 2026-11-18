#!/usr/bin/env python3
"""
Gera audio/<ep>/narracao/timings.json com o tempo REAL de cada palavra,
a partir dos arquivos de narração gravados (L01.mp3, L02.mp3, ...).

Usa reconhecimento de fala com carimbo de tempo por palavra (faster-whisper)
e alinha o resultado ao texto do roteiro, para que a legenda use exatamente
as palavras do roteiro nos instantes em que são pronunciadas.

Instalação (uma vez):   pip install faster-whisper
Uso:                    python3 tools/alinhar_narracao.py ep01
Opções:                 --modelo small|medium|large-v3   (padrão: small)

Formato gerado:  { "L01": [["E", 0.52, 0.61], ["se...", 0.61, 1.30], ...], ... }
(tempos em segundos, relativos ao início de cada arquivo)
"""
import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FORMATOS = ["mp3", "wav", "ogg", "m4a"]


def norm(w):
    w = unicodedata.normalize("NFD", w.lower())
    w = "".join(c for c in w if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", w)


def ler_roteiro(ep):
    """Extrai {id: texto} de episodes/<ep>/episode.js (campos id/text das falas)."""
    src = (RAIZ / "episodes" / ep / "episode.js").read_text(encoding="utf-8")
    falas = {}
    for m in re.finditer(r"\{\s*id:\s*'(L\d+)',\s*text:\s*'((?:[^'\\]|\\.)*)'", src):
        falas[m.group(1)] = m.group(2).replace("\\'", "'")
    return falas


def alinhar(palavras_roteiro, reconhecidas):
    """Mapeia cada palavra do roteiro a um intervalo de tempo reconhecido."""
    a = [norm(w) for w in palavras_roteiro]
    b = [norm(r[0]) for r in reconhecidas]
    tempos = [None] * len(a)
    for bloco in SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(bloco.size):
            r = reconhecidas[bloco.b + k]
            tempos[bloco.a + k] = (r[1], r[2])
    # palavras sem correspondência: interpola entre vizinhas conhecidas
    conhecidos = [i for i, t in enumerate(tempos) if t]
    if not conhecidos:
        return None
    for i, t in enumerate(tempos):
        if t:
            continue
        ant = max([j for j in conhecidos if j < i], default=None)
        prox = min([j for j in conhecidos if j > i], default=None)
        ini = tempos[ant][1] if ant is not None else tempos[prox][0]
        fim = tempos[prox][0] if prox is not None else tempos[ant][1]
        lacunas = (prox if prox is not None else len(a)) - (ant if ant is not None else -1) - 1
        pos = i - (ant if ant is not None else -1)
        passo = max(0.0, fim - ini) / (lacunas + 1)
        tempos[i] = (ini + passo * (pos - 1), ini + passo * pos)
    return [[w, round(t[0], 3), round(t[1], 3)] for w, t in zip(palavras_roteiro, tempos)]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    ep = args[0] if args else "ep01"
    modelo = "small"
    if "--modelo" in sys.argv:
        modelo = sys.argv[sys.argv.index("--modelo") + 1]
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("Instale antes:  pip install faster-whisper")

    pasta = RAIZ / "audio" / ep / "narracao"
    falas = ler_roteiro(ep)
    if not falas:
        sys.exit("Não encontrei as falas no episode.js")
    model = WhisperModel(modelo, compute_type="int8")
    saida = {}
    for fid, texto in falas.items():
        arq = next((pasta / f"{fid}.{e}" for e in FORMATOS if (pasta / f"{fid}.{e}").exists()), None)
        if not arq:
            print(f"{fid}: arquivo não encontrado — ignorado")
            continue
        segs, _ = model.transcribe(str(arq), language="pt", word_timestamps=True, initial_prompt=texto)
        rec = [(w.word.strip(), w.start, w.end) for s in segs for w in (s.words or [])]
        al = alinhar(texto.split(), rec)
        if al:
            saida[fid] = al
            print(f"{fid}: {len(al)} palavras alinhadas ({al[0][1]:.2f}s → {al[-1][2]:.2f}s)")
        else:
            print(f"{fid}: não foi possível alinhar")
    destino = pasta / "timings.json"
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nGravado: {destino.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
