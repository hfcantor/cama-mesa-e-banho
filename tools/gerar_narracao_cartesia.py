#!/usr/bin/env python3
"""
Gera a narração do episódio com a Cartesia (text-to-speech) usando UM POST HTTP por fala,
sem SDK e sem dependências (só a biblioteca padrão do Python).

O texto falado é EXATAMENTE o das falas em episodes/<ep>/episode.js.

Chave:  CARTESIA_API_KEY, lida do ambiente ou do arquivo .env na raiz do projeto
        (o .env está no .gitignore; veja .env.example). A chave NUNCA vai para o navegador:
        esta ferramenta roda no terminal e só grava os arquivos de áudio.

Uso:    python3 tools/gerar_narracao_cartesia.py ep01
        python3 tools/gerar_narracao_cartesia.py ep01 --so L03,L07
        python3 tools/gerar_narracao_cartesia.py ep01 --lingua pt
        python3 tools/gerar_narracao_cartesia.py ep01 --timings      # exige faster-whisper

Saída:  audio/<ep>/narracao_cartesia/L01.wav ... (WAV PCM 16-bit, 44100 Hz)
        Fica numa pasta separada para não sobrescrever a narração atual. Para usá-la,
        aponte `narration.dir` e `narration.timings` do episode.js para essa pasta.

Rede:   precisa alcançar api.cartesia.ai. Atrás de proxy, o urllib usa HTTPS_PROXY sozinho.

Tempos por palavra: o endpoint /tts/bytes devolve só o áudio. Sem timings.json as legendas
usam tempos estimados. Use --timings (faster-whisper) para gerar os tempos reais.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from alinhar_narracao import alinhar, ler_roteiro  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
URL = "https://api.cartesia.ai/tts/bytes"
VERSAO_API = "2026-08-14"
MODELO = "sonic-3.6"
VOZ_PADRAO = "b0f46533-d4bb-493f-a26f-a99e1f2e86e3"


def carregar_env(caminho):
    try:
        for linha in caminho.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                k, v = linha.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    except FileNotFoundError:
        pass


def sintetizar(chave, texto, voz, lingua=None):
    corpo = {
        "model_id": MODELO,
        "transcript": texto,
        "voice": voz,
        "output_format": {"container": "wav", "encoding": "pcm_s16le", "sample_rate": 44100},
        "generation_config": {"speed": 1, "volume": 1},
    }
    if lingua:
        corpo["language"] = lingua
    req = urllib.request.Request(
        URL,
        data=json.dumps(corpo).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": chave,
            "Cartesia-Version": VERSAO_API,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.read()  # bytes do WAV, não é JSON
    except urllib.error.HTTPError as e:
        sys.exit(f"Cartesia respondeu {e.code}: {e.read().decode('utf-8', 'replace')}")


def gerar_timings(pasta, falas):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("\n--timings ignorado: instale antes  pip install faster-whisper")
        return
    model = WhisperModel("small", compute_type="int8")
    tpath = pasta / "timings.json"
    saida = json.loads(tpath.read_text(encoding="utf-8")) if tpath.exists() else {}
    for fid, texto in falas.items():
        arq = pasta / f"{fid}.wav"
        if not arq.exists():
            continue
        segs, _ = model.transcribe(str(arq), language="pt", word_timestamps=True, initial_prompt=texto)
        rec = [(w.word.strip(), w.start, w.end) for s in segs for w in (s.words or [])]
        al = alinhar(texto.split(), rec)
        if al:
            saida[fid] = al
            print(f"{fid}: {len(al)} palavras alinhadas ({al[0][1]:.2f}s → {al[-1][2]:.2f}s)")
        else:
            print(f"{fid}: não foi possível alinhar")
    tpath.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Gravado: {tpath.relative_to(RAIZ)}")


def main():
    a = sys.argv[1:]
    ep = next((x for x in a if not x.startswith("--") and not re.match(r"^(L\d+,?)+$", x)
               and (RAIZ / "episodes" / x).is_dir()), "ep01")
    valor = lambda flag: a[a.index(flag) + 1] if flag in a else None  # noqa: E731
    voz = valor("--voz") or VOZ_PADRAO
    lingua = valor("--lingua")
    so = set(valor("--so").split(",")) if valor("--so") else None

    carregar_env(RAIZ / ".env")
    chave = os.environ.get("CARTESIA_API_KEY")
    if not chave:
        sys.exit("CARTESIA_API_KEY não definida (coloque no .env da raiz ou no ambiente)")

    falas = ler_roteiro(ep)
    if not falas:
        sys.exit("Não encontrei as falas no episode.js")
    pasta = RAIZ / "audio" / ep / "narracao_cartesia"
    pasta.mkdir(parents=True, exist_ok=True)
    for fid, texto in falas.items():
        if so and fid not in so:
            continue
        audio = sintetizar(chave, texto, voz, lingua)
        destino = pasta / f"{fid}.wav"
        destino.write_bytes(audio)
        print(f"{fid}.wav  {len(audio) // 1024} KB")
    if "--timings" in a:
        gerar_timings(pasta, falas)
    print(f"\nGravado em {pasta.relative_to(RAIZ)}  (voz: {voz})")


if __name__ == "__main__":
    main()
