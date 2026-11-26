#!/usr/bin/env python3
"""
Gera a narração do episódio com edge-tts (vozes neurais da Microsoft Edge,
sem chave de API) e o timings.json com o instante real de cada palavra
(eventos WordBoundary devolvidos pelo próprio serviço de voz).

O texto falado é EXATAMENTE o das falas em episodes/<ep>/episode.js.

Instalação:  pip install edge-tts
Uso:         python3 tools/gerar_narracao.py ep01
             python3 tools/gerar_narracao.py ep01 --so L03,L07
             python3 tools/gerar_narracao.py ep01 --voz pt-BR-AntonioNeural

Rede: precisa alcançar speech.platform.bing.com. Atrás de proxy, o script usa
HTTPS_PROXY automaticamente (o aiohttp do edge-tts não lê essa variável sozinho).
"""
import asyncio
import json
import os
import re
import sys
from pathlib import Path

import edge_tts

sys.path.insert(0, str(Path(__file__).resolve().parent))
from alinhar_narracao import alinhar, ler_roteiro  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
VOZ_PADRAO = "pt-BR-AntonioNeural"

# Interpretação por fala (velocidade e tom). Nada aqui muda o TEXTO.
DIRECAO_EP01 = {
    "L01": ("-12%", "-4Hz"),  # pergunta de abertura, misteriosa
    "L02": ("-6%", "-2Hz"),   # gancho, contando um causo
    "L03": ("-14%", "-5Hz"),  # revelação dramática
    "L04": ("-2%", "-2Hz"),   # urgência
    "L05": ("-4%", "-3Hz"),
    "L06": ("-6%", "-2Hz"),
    "L07": ("+2%", "+0Hz"),   # chamada leve para curtir
    "L08": ("-8%", "-4Hz"),   # tensão
    "L09": ("-10%", "-5Hz"),
    "L10": ("-4%", "-3Hz"),   # clímax
    "L11": ("-10%", "-1Hz"),  # deslumbramento
    "L12": ("-6%", "+1Hz"),   # alívio, virada
    "L13": ("-10%", "+1Hz"),
    "L14": ("-2%", "+1Hz"),   # chamada para comentar
}

# EP02: "E se você nunca trocasse o lençol?" (tom de curiosidade bem-humorada)
DIRECAO_EP02 = {
    "L01": ("-8%", "-2Hz"),   # pergunta de abertura
    "L02": ("-4%", "-1Hz"),
    "L03": ("-6%", "-1Hz"),   # carimbo do nível
    "L04": ("+0%", "+0Hz"),
    "L05": ("-2%", "-1Hz"),   # sorrisinho maldoso
    "L06": ("-6%", "-1Hz"),
    "L07": ("+2%", "+0Hz"),
    "L08": ("+2%", "+0Hz"),   # lista rápida de sintomas
    "L09": ("+4%", "+1Hz"),   # chamada leve para curtir
    "L10": ("-8%", "-2Hz"),
    "L11": ("-2%", "-2Hz"),   # nojo
    "L12": ("-6%", "-2Hz"),
    "L13": ("-4%", "+1Hz"),   # alívio
    "L14": ("+2%", "+0Hz"),
    "L15": ("-6%", "+1Hz"),
    "L16": ("-2%", "+1Hz"),   # chamada para comentar
}
DIRECAO_POR_EP = {"ep01": DIRECAO_EP01, "ep02": DIRECAO_EP02}


async def gerar(fid, texto, voz, destino, direcao=None):
    rate, pitch = (direcao or DIRECAO_EP01).get(fid, ("-6%", "-2Hz"))
    com = edge_tts.Communicate(texto, voz, rate=rate, pitch=pitch, boundary="WordBoundary",
                               proxy=os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy"))
    palavras = []
    with open(destino, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                ini = ch["offset"] / 1e7  # unidades de 100 ns
                palavras.append((ch["text"], ini, ini + ch["duration"] / 1e7))
    return palavras


async def main():
    a = sys.argv[1:]
    ep = next((x for x in a if not x.startswith("--") and not re.match(r"^(L\d+,?)+$|^pt-", x)), "ep01")
    voz = a[a.index("--voz") + 1] if "--voz" in a else VOZ_PADRAO
    so = set(a[a.index("--so") + 1].split(",")) if "--so" in a else None
    falas = ler_roteiro(ep)
    pasta = RAIZ / "audio" / ep / "narracao"
    pasta.mkdir(parents=True, exist_ok=True)
    tpath = pasta / "timings.json"
    timings = json.loads(tpath.read_text(encoding="utf-8")) if tpath.exists() else {}
    for fid, texto in falas.items():
        if so and fid not in so:
            continue
        destino = pasta / f"{fid}.mp3"
        rec = await gerar(fid, texto, voz, destino, DIRECAO_POR_EP.get(ep, DIRECAO_EP02))
        al = alinhar(texto.split(), rec) if rec else None
        if al:
            timings[fid] = al
        else:
            timings.pop(fid, None)
        print(f"{fid}.mp3  {destino.stat().st_size // 1024} KB  {len(rec)} marcas de palavra"
              f"  ({al[0][1]:.2f}s → {al[-1][2]:.2f}s)" if al else f"{fid}.mp3 sem marcas de palavra")
    tpath.write_text(json.dumps(timings, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nGravado: {tpath.relative_to(RAIZ)}  (voz: {voz})")


if __name__ == "__main__":
    asyncio.run(main())
