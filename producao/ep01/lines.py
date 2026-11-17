"""Fala de cada personagem -> wav 48 kHz mono, com silêncio aparado."""
import os, subprocess, numpy as np, soundfile as sf, librosa, json, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TTS = os.path.join(HERE, "..", "tts")
OUT = os.path.join(HERE, "lines")
os.makedirs(OUT, exist_ok=True)
SR = 48000

# elenco de vozes: motor, modelo, velocidade, tom (semitons), volume
VOICES = {
    "rafael":  dict(eng="piper", model="faber-medium", speed=1.00, pitch=-0.8, vol=1.0),
    "diego":   dict(eng="kokoro", model="em_alex",     speed=1.15, pitch=0.0, vol=1.0),
    "marcelo": dict(eng="piper", model="cadu-medium",  speed=1.00, pitch=-0.8, vol=1.0),
    "bruno":   dict(eng="kokoro", model="pm_alex",     speed=1.10, pitch=0.6,  vol=1.0),
    "sandro":  dict(eng="kokoro", model="pm_santa",    speed=1.00, pitch=-0.6, vol=1.0),
    "lucas":   dict(eng="kokoro", model="em_santa",    speed=1.00, pitch=1.5, vol=1.0),
    "narr":    dict(eng="kokoro", model="pf_dora",     speed=1.00, pitch=0.0, vol=1.0),
}

_kok = None
def kokoro():
    global _kok
    if _kok is None:
        from kokoro_onnx import Kokoro
        _kok = Kokoro(f"{TTS}/kokoro-multi-lang-v1_0/model.onnx", f"{TTS}/voices-v1.0.bin")
    return _kok

def synth(speaker, text, path):
    v = VOICES[speaker]
    if v["eng"] == "piper":
        d = f"{TTS}/vits-piper-pt_BR-{v['model']}"
        tmp = path + ".raw.wav"
        subprocess.run(["python3", "-m", "piper", "-m", f"{d}/pt_BR-{v['model']}.onnx",
                        "-c", f"{d}/pt_BR-{v['model']}.onnx.json", "-f", tmp,
                        "--length-scale", str(1.0 / v["speed"]), "--noise-scale", "0.6",
                        "--noise-w-scale", "0.7"],
                       input=text.encode(), check=True, capture_output=True)
        y, sr = librosa.load(tmp, sr=SR); os.remove(tmp)
    else:
        s, sr = kokoro().create(text, voice=v["model"], speed=v["speed"], lang="pt-br")
        y = librosa.resample(np.asarray(s, dtype=np.float32), orig_sr=sr, target_sr=SR)
    if abs(v["pitch"]) > 0.01:
        y = librosa.effects.pitch_shift(y, sr=SR, n_steps=v["pitch"])
    _, (a, b) = librosa.effects.trim(y, top_db=45)
    m = int(0.04 * SR); y = y[max(0, a - m): b + m]
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.9 * v["vol"]
    fade = int(0.01 * SR); y[:fade] *= np.linspace(0, 1, fade); y[-fade:] *= np.linspace(1, 0, fade)
    sf.write(path, y, SR)
    return len(y) / SR

if __name__ == "__main__":
    from timeline import BEATS
    info = {}
    n = 0
    for b in BEATS:
        for ln in b.get("lines", []):
            key = f"{n:02d}_{ln[0]}"
            p = os.path.join(OUT, key + ".wav")
            if not os.path.exists(p) or "--force" in sys.argv:
                synth(ln[0], ln[1], p)
            info[key] = dict(speaker=ln[0], text=ln[1], dur=sf.info(p).duration)
            n += 1
    json.dump(info, open(os.path.join(OUT, "index.json"), "w"), ensure_ascii=False, indent=1)
    tot = sum(v["dur"] for v in info.values())
    for k, v in info.items(): print(f"{k:12s} {v['dur']:5.2f}s  {v['text']}")
    print("total fala: %.1fs" % tot)
