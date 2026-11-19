#!/usr/bin/env python3
"""
Divide uma narração gravada em UM arquivo só (ex.: exportada do ElevenLabs)
nos arquivos L01.mp3 … L14.mp3 do episódio e gera o timings.json com o
instante real de cada palavra.

Como funciona:
  1. transcreve o áudio com faster-whisper (tempos por palavra);
  2. alinha a transcrição ao texto do roteiro (episodes/<ep>/episode.js);
  3. corta cada fala no meio do silêncio entre ela e a próxima;
  4. grava os tempos de cada palavra relativos ao início de cada arquivo.

Uso:
  pip install faster-whisper
  python3 tools/dividir_narracao.py ep01 narracao_completa.mp3 [--modelo small|<pasta-do-modelo>]

Requer ffmpeg no PATH.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from alinhar_narracao import alinhar, ler_roteiro  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
SR = 16000


def decodificar(arq):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(arq), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def refinar(audio, palavras, thr_db=-38.0):
    """Ajusta início/fim de cada palavra ao trecho que realmente tem voz (energia em janelas de 10 ms)."""
    win = SR // 100
    n = len(audio) // win
    rms = np.sqrt(np.mean(audio[: n * win].reshape(n, win) ** 2, axis=1))
    voz = 20 * np.log10(rms + 1e-9) > thr_db
    out = []
    for w, s, e in palavras:
        a, b = int(s * 100), max(int(s * 100) + 1, int(np.ceil(e * 100)))
        idx = np.nonzero(voz[a:b])[0]
        if len(idx):
            s2, e2 = (a + idx[0]) / 100, (a + idx[-1] + 1) / 100
            if e2 - s2 >= 0.05:
                s, e = s2, e2
        out.append([w, s, e])
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        sys.exit(__doc__)
    ep, entrada = args[0], Path(args[1])
    modelo = sys.argv[sys.argv.index("--modelo") + 1] if "--modelo" in sys.argv else "small"
    from faster_whisper import WhisperModel

    falas = ler_roteiro(ep)
    ids = list(falas)
    roteiro = [(fid, w) for fid in ids for w in falas[fid].split()]

    audio = decodificar(entrada)
    dur = len(audio) / SR
    model = WhisperModel(modelo, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(audio, language="pt", word_timestamps=True, beam_size=5,
                               initial_prompt=" ".join(falas.values()))
    rec = [(w.word.strip(), w.start, w.end) for s in segs for w in (s.words or [])]
    al = alinhar([w for _, w in roteiro], rec)
    if not al:
        sys.exit("Não foi possível alinhar a transcrição ao roteiro.")
    al = refinar(audio, al)

    # tempos absolutos por fala
    por_fala = {fid: [] for fid in ids}
    for (fid, _), (w, s, e) in zip(roteiro, al):
        por_fala[fid].append([w, s, e])

    # pontos de corte: meio do intervalo entre o fim de uma fala e o início da próxima
    cortes = [0.0]
    for a, b in zip(ids, ids[1:]):
        fim, ini = por_fala[a][-1][2], por_fala[b][0][1]
        cortes.append(max(fim, min(ini, (fim + ini) / 2)))
    cortes.append(dur)

    pasta = RAIZ / "audio" / ep / "narracao"
    pasta.mkdir(parents=True, exist_ok=True)
    timings = {}
    for i, fid in enumerate(ids):
        t0, t1 = cortes[i], cortes[i + 1]
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(entrada), "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}",
                        "-af", "afade=t=in:d=0.01,areverse,afade=t=in:d=0.02,areverse",
                        "-ar", "44100", "-ac", "1", "-b:a", "192k", str(pasta / f"{fid}.mp3")], check=True)
        timings[fid] = [[w, round(max(0.0, s - t0), 3), round(max(0.0, e - t0), 3)] for w, s, e in por_fala[fid]]
        print(f"{fid}.mp3  {t0:6.2f}s → {t1:6.2f}s  ({t1 - t0:4.2f}s)  “{' '.join(w for w, _, _ in por_fala[fid])}”")

    (pasta / "timings.json").write_text(json.dumps(timings, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nGravado: audio/{ep}/narracao/L01..L{len(ids):02d}.mp3 + timings.json")


if __name__ == "__main__":
    main()
