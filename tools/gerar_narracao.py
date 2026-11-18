#!/usr/bin/env python3
"""
Gera a narração do episódio com Google Cloud Text-to-Speech (voz neural pt-BR)
e o timings.json com o instante REAL de cada palavra (marcas SSML devolvidas
pela própria API), para a legenda aparecer exatamente quando a palavra é dita.

O texto falado é EXATAMENTE o das falas em episodes/<ep>/episode.js.

Chave de API (uma das opções):
  - variável de ambiente GOOGLE_TTS_API_KEY, ou
  - segredo de rede configurado no ambiente para texttospeech.googleapis.com
    (cabeçalho x-goog-api-key), que o proxy injeta automaticamente.

Uso:
  python3 tools/gerar_narracao.py ep01                  # gera L01..L14.mp3 + timings.json
  python3 tools/gerar_narracao.py ep01 --listar         # lista vozes pt-BR disponíveis
  python3 tools/gerar_narracao.py ep01 --voz pt-BR-Neural2-B --so L03,L07
  python3 tools/gerar_narracao.py ep01 --dry            # só mostra o SSML, sem chamar a API
"""
import base64
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape

RAIZ = Path(__file__).resolve().parent.parent
API = "https://texttospeech.googleapis.com/v1beta1"
VOZ_PADRAO = "pt-BR-Neural2-B"  # masculina, neural; aceita marcas SSML (tempo por palavra)

# Direção de interpretação por fala: velocidade, tom e pausa após vírgulas/reticências.
# Nada aqui muda o TEXTO — só o jeito de falar.
DIRECAO = {
    "L01": dict(rate=0.88, pitch=-2.0),   # pergunta de abertura, misteriosa
    "L02": dict(rate=0.95, pitch=-1.0),   # gancho, contando um causo
    "L03": dict(rate=0.86, pitch=-2.5),   # revelação, pausa dramática
    "L04": dict(rate=1.00, pitch=-1.0),   # urgência crescente
    "L05": dict(rate=0.97, pitch=-1.5),
    "L06": dict(rate=0.95, pitch=-1.0),
    "L07": dict(rate=1.04, pitch=0.0),    # chamada leve para curtir
    "L08": dict(rate=0.92, pitch=-2.0),   # tensão
    "L09": dict(rate=0.90, pitch=-2.5),
    "L10": dict(rate=0.98, pitch=-1.5),   # clímax
    "L11": dict(rate=0.90, pitch=-0.5),   # deslumbramento
    "L12": dict(rate=0.95, pitch=0.5),    # alívio, virada
    "L13": dict(rate=0.92, pitch=0.5),
    "L14": dict(rate=1.00, pitch=0.5),    # chamada para comentar
}
PAUSAS = {"...": "650ms", "…": "650ms", ",": "250ms", ":": "350ms", ".": "450ms", "?": "450ms", "!": "400ms"}


def ler_roteiro(ep):
    src = (RAIZ / "episodes" / ep / "episode.js").read_text(encoding="utf-8")
    return {m.group(1): m.group(2).replace("\\'", "'")
            for m in re.finditer(r"\{\s*id:\s*'(L\d+)',\s*text:\s*'((?:[^'\\]|\\.)*)'", src)}


def ssml(fid, texto):
    """SSML com uma marca antes de cada palavra (w0, w1, ...) e pausas nas pontuações."""
    d = DIRECAO.get(fid, dict(rate=0.95, pitch=-1.0))
    partes = []
    palavras = texto.split()
    for i, w in enumerate(palavras):
        partes.append(f'<mark name="w{i}"/>{escape(w)}')
        if i < len(palavras) - 1:
            fim = "..." if w.endswith("...") else w[-1]
            if fim in PAUSAS:
                partes.append(f'<break time="{PAUSAS[fim]}"/>')
    partes.append(f'<mark name="w{len(palavras)}"/>')
    corpo = " ".join(partes)
    return (f'<speak><prosody rate="{d["rate"]}" pitch="{d["pitch"]:+.1f}st">'
            f"{corpo}</prosody></speak>"), palavras


def chamar(caminho, corpo=None):
    req = urllib.request.Request(f"{API}/{caminho}", method="POST" if corpo else "GET")
    req.add_header("Content-Type", "application/json; charset=utf-8")
    chave = os.environ.get("GOOGLE_TTS_API_KEY")
    if chave:
        req.add_header("x-goog-api-key", chave)
    data = json.dumps(corpo).encode() if corpo else None
    try:
        with urllib.request.urlopen(req, data, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"Erro da API ({e.code}): {e.read().decode()[:400]}")


def main():
    a = sys.argv[1:]
    ep = next((x for x in a if not x.startswith("--") and not re.match(r"^(L\d+,?)+$|^pt-", x)), "ep01")
    voz = a[a.index("--voz") + 1] if "--voz" in a else VOZ_PADRAO
    so = set(a[a.index("--so") + 1].split(",")) if "--so" in a else None

    if "--listar" in a:
        for v in chamar("voices?languageCode=pt-BR").get("voices", []):
            print(v["name"], v["ssmlGender"], v.get("naturalSampleRateHertz"))
        return

    falas = ler_roteiro(ep)
    pasta = RAIZ / "audio" / ep / "narracao"
    pasta.mkdir(parents=True, exist_ok=True)
    tpath = pasta / "timings.json"
    timings = json.loads(tpath.read_text(encoding="utf-8")) if tpath.exists() else {}

    for fid, texto in falas.items():
        if so and fid not in so:
            continue
        doc, palavras = ssml(fid, texto)
        if "--dry" in a:
            print(fid, doc, "\n")
            continue
        res = chamar("text:synthesize", {
            "input": {"ssml": doc},
            "voice": {"languageCode": "pt-BR", "name": voz},
            "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 44100, "effectsProfileId": ["headphone-class-device"]},
            "enableTimePointing": ["SSML_MARK"],
        })
        (pasta / f"{fid}.mp3").write_bytes(base64.b64decode(res["audioContent"]))
        marcas = {tp["markName"]: tp["timeSeconds"] for tp in res.get("timepoints", [])}
        if all(f"w{i}" in marcas for i in range(len(palavras) + 1)):
            # fim de cada palavra = início da próxima menos a pausa; aproximamos com 92% do intervalo
            ws = []
            for i, w in enumerate(palavras):
                s, e = marcas[f"w{i}"], marcas[f"w{i + 1}"]
                fim = "..." if w.endswith("...") else w[-1]
                pausa = int(PAUSAS[fim][:-2]) / 1000 if (i < len(palavras) - 1 and fim in PAUSAS) else 0
                ws.append([w, round(s, 3), round(max(s + 0.08, e - pausa - (e - s) * 0.04), 3)])
            timings[fid] = ws
            info = f"{len(ws)} palavras com tempo real"
        else:
            timings.pop(fid, None)
            info = "sem marcas de tempo (voz não suporta) — legenda usará a duração real da fala"
        print(f"{fid}.mp3 gerado — {info}")

    if "--dry" not in a:
        tpath.write_text(json.dumps(timings, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\nGravado: {tpath.relative_to(RAIZ)}  (voz: {voz})")


if __name__ == "__main__":
    main()
