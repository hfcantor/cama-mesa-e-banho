"""Monta a linha do tempo (schedule.json) e a trilha completa (mix.wav)."""
import os, json, re, numpy as np, soundfile as sf
from scipy import signal
from timeline import BEATS

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
FPS = 30
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- linha do tempo
idx = json.load(open(f"{HERE}/lines/index.json"))
keys = list(idx.keys())
sched, t, k = [], 0.0, 0
for b in BEATS:
    pre, gap, post = b.get("pre", 0.25), b.get("gap", 0.35), b.get("post", 0.4)
    cur, lines = pre, []
    for ln in b.get("lines", []):
        key = keys[k]; k += 1
        d = idx[key]["dur"]
        lines.append(dict(key=key, speaker=ln[0], text=ln[1], t0=t + cur, dur=d))
        cur += d + gap
    end = (cur - gap + post) if lines else 0
    dur = max(b.get("min", 0), end)
    sched.append(dict(id=b["id"], t0=t, dur=dur, shot=b["shot"], lines=lines,
                      sfx=[(n, (dur - 0.15) if s is None else s) for n, s in b.get("sfx", [])],
                      mus=b.get("mus"), amb=b.get("amb")))
    t += dur
TOTAL = t
N = int(np.ceil(TOTAL * SR))
print(f"duração total: {TOTAL:.2f}s")

# ---------------------------------------------------------------- utilidades
def lp(x, f, o=4): return signal.sosfilt(signal.butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=4): return signal.sosfilt(signal.butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, a, b, o=4): return signal.sosfilt(signal.butter(o, [a, b], "band", fs=SR, output="sos"), x)
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, min(nr, n))[-nr:]
    return e
def tt(d): return np.arange(int(d * SR)) / SR
def place(buf, x, at, g=1.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    j = min(len(buf), i + len(x)); s = max(0, -i)
    buf[max(i, 0):j] += g * x[s:s + j - max(i, 0)]
def noise(d): return rng.standard_normal(int(d * SR))
def reverb(x, mix=0.25):
    y = x.copy()
    for dl, g in [(0.029, .5), (0.037, .45), (0.041, .4), (0.053, .35), (0.067, .3), (0.083, .25)]:
        n = int(dl * SR); z = np.zeros_like(x)
        for rep in range(1, 7):
            if n * rep < len(x): z[n * rep:] += x[:-n * rep] * (g ** rep)
        y += mix * lp(z, 5000) / 3
    return y

# ---------------------------------------------------------------- efeitos
def sfx_buzz(muffled=False):
    d = 0.42; x = tt(d)
    s = np.sign(np.sin(2 * np.pi * 175 * x)) * 0.5 + np.sin(2 * np.pi * 350 * x) * 0.3
    s *= (0.6 + 0.4 * np.sin(2 * np.pi * 28 * x)) * env(len(x), 0.01, 0.05)
    s = lp(s, 900 if muffled else 2500)
    return s * (0.25 if muffled else 0.45)
def sfx_impact():
    d = 2.2; x = tt(d)
    f = 70 * np.exp(-x * 1.6) + 32
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.4)
    s += lp(noise(d), 1500) * np.exp(-x * 7) * 0.5
    return reverb(s, 0.35) * 0.9
def sfx_riser_out():
    d = 3.0; x = tt(d)
    s = bp(noise(d), 600, 4000) * np.exp(-x * 1.4) * 0.15
    return reverb(s, .5)
def sfx_hit():
    d = 1.2; x = tt(d)
    s = np.sin(2 * np.pi * (55 + 30 * np.exp(-x * 8)) * x) * np.exp(-x * 3.5)
    return (s + lp(noise(d), 800) * np.exp(-x * 15) * .3) * .7
def sfx_whoosh():
    d = 0.8; x = tt(d); e = np.sin(np.pi * x / d) ** 2
    s = noise(d); out = np.zeros_like(s)
    for i in range(8):
        a, b = i * len(s) // 8, (i + 1) * len(s) // 8
        fc = 300 + 2500 * (i / 8)
        out[a:b] = bp(s, fc * .7, fc * 1.3)[a:b]
    return out * e * 0.35
def sfx_flip():
    d = 0.35; x = tt(d)
    return (bp(noise(d), 1500, 6000) * np.exp(-x * 25) * .4 + np.sin(2 * np.pi * 140 * x) * np.exp(-x * 30) * .5) * .8
def sfx_tick():
    d = .25; x = tt(d)
    return (np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 40) * .25)
def sfx_ping():
    d = .7; x = tt(d)
    s = np.sin(2 * np.pi * 1320 * x) * np.exp(-x * 9) * (x < .12) + np.sin(2 * np.pi * 1760 * x) * np.exp(-(x - .12).clip(0) * 7) * (x >= .12)
    return s * .25
def sfx_type():
    d = .08; x = tt(d)
    return bp(noise(d), 2000, 7000) * np.exp(-x * 90) * .35
def sfx_delete():
    d = .45; x = tt(d); f = 900 - 600 * x / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), .01, .15) * .18
def sfx_creak():
    d = 1.3; x = tt(d)
    f = 340 + 120 * np.sin(2 * np.pi * .8 * x) + 30 * rng.standard_normal(len(x)).cumsum() / 400
    s = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 18 * x)))
    return bp(s, 300, 2500) * env(len(x), .1, .3) * .12
def sfx_step():
    d = .3; x = tt(d)
    return (lp(noise(d), 400) * np.exp(-x * 30) * 1.2 + np.sin(2 * np.pi * 70 * x) * np.exp(-x * 25) * .6) * .5
def sfx_chair():
    d = .7; x = tt(d)
    s = bp(noise(d), 500, 2500) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 37 * x))) * env(len(x), .05, .2)
    return s * .25
def sfx_pat():
    d = .2; x = tt(d)
    return lp(noise(d), 1200) * np.exp(-x * 45) * .6
def sfx_door_slam():
    d = 1.5; x = tt(d)
    s = lp(noise(d), 900) * np.exp(-x * 18) + np.sin(2 * np.pi * 85 * x) * np.exp(-x * 10)
    return reverb(s, .3) * .6
def sfx_moto():
    d = 3.2; x = tt(d); c = d * .45
    dop = 1 + 0.12 * np.tanh((c - x) * 2.5)
    f = 95 * dop * (1 + .03 * np.sin(2 * np.pi * 9 * x))
    s = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * .6 + signal.sawtooth(2 * np.pi * np.cumsum(f * 2.01) / SR) * .3
    s = lp(s, 1800) + bp(noise(d), 200, 1200) * .3
    return s * np.exp(-((x - c) / .9) ** 2) * .35
SFX = dict(buzz=sfx_buzz, buzz_muffled=lambda: sfx_buzz(True), impact=sfx_impact, riser_out=sfx_riser_out,
           hit=sfx_hit, whoosh=sfx_whoosh, flip=sfx_flip, tick=sfx_tick, ping=sfx_ping, type=sfx_type,
           delete=sfx_delete, creak=sfx_creak, step=sfx_step, chair=sfx_chair, pat=sfx_pat,
           door_slam=sfx_door_slam, moto=sfx_moto)

# ---------------------------------------------------------------- música
def note(m): return 440 * 2 ** ((m - 69) / 12)
def pluck(f, d, bright=.5):
    n = int(d * SR); p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = (buf[i % p] + buf[(i + 1) % p]) * 0.5 * (0.993 + bright * 0.006)
    return out
_pl = {}
def pl(m, d, b=.5):
    key = (m, round(d, 2), b)
    if key not in _pl: _pl[key] = pluck(note(m), d, b)
    return _pl[key]

def music_bar(d):
    bpm = 128; beat = 60 / bpm; bars = int(np.ceil(d / (4 * beat))) + 1
    out = np.zeros(int(bars * 4 * beat * SR) + SR)
    prog = [(48, [60, 64, 67]), (45, [57, 60, 64]), (41, [57, 60, 65]), (43, [59, 62, 67])]
    mel = [72, 74, 76, 79, 76, 74, 72, 69, 72, 72, 74, 76, 74, 72, 71, 67]
    for bar in range(bars):
        root, ch = prog[bar % 4]; t0 = bar * 4 * beat
        for bt in range(4):
            tb = t0 + bt * beat
            # zabumba
            x = tt(.25); k = np.sin(2 * np.pi * (60 + 60 * np.exp(-x * 30)) * x) * np.exp(-x * 14)
            if bt in (0, 2): place(out, k * .55, tb)
            if bt == 3: place(out, k * .35, tb + beat * .5)
            # baixo
            place(out, lp(pl(root + (7 if bt % 2 else 0) - 12, beat * .9, .2), 600) * .5, tb)
            # violão no contratempo
            for j, m in enumerate(ch): place(out, hp(pl(m, beat * .45, .9), 200) * .16, tb + beat * .5 + j * .012)
            # triângulo / chocalho
            for s in range(2):
                y = tt(.06); place(out, hp(noise(.06), 6000) * np.exp(-y * 60) * (.08 if s else .05), tb + s * beat * .5)
        # melodia sanfonada
        for i in range(4):
            m = mel[(bar * 4 + i) % 16]; x = tt(beat * .95)
            f = note(m) * (1 + .004 * np.sin(2 * np.pi * 5.5 * x))
            s = (signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) + .5 * signal.square(2 * np.pi * np.cumsum(f * 1.003) / SR))
            place(out, lp(s, 2600) * env(len(x), .03, .1) * .045, t0 + i * beat)
    return reverb(out[:int(d * SR)], .2)

def pad(chords, d, seg, vol=.12, cutoff=1800):
    out = np.zeros(int(d * SR) + SR)
    for i in range(int(np.ceil(d / seg)) + 1):
        ch = chords[i % len(chords)]; x = tt(seg * 1.3)
        s = sum(signal.sawtooth(2 * np.pi * note(m) * (1 + dt) * x) for m in ch for dt in (-.003, .003))
        s = lp(s, cutoff) * env(len(x), seg * .4, seg * .5)
        place(out, s * vol / len(ch), i * seg)
    return out[:int(d * SR)]

def music_tension(d):
    x = tt(d)
    s = np.sin(2 * np.pi * 55 * x) * .3 + np.sin(2 * np.pi * 82.4 * x) * .15
    s *= .7 + .3 * np.sin(2 * np.pi * .25 * x)
    s += bp(noise(d), 2500, 5000) * (.04 + .03 * np.sin(2 * np.pi * 6 * x))
    hb = np.zeros_like(x)
    for b in np.arange(0, d, 1.1):
        for o in (0, .22):
            y = tt(.3); place(hb, np.sin(2 * np.pi * 48 * y) * np.exp(-y * 18) * (.7 if o == 0 else .45), b + o)
    return s * .5 + hb * .6

def music_drone(d):
    x = tt(d)
    s = np.sin(2 * np.pi * 41.2 * x) * .35 + np.sin(2 * np.pi * 61.7 * x) * .12
    s += lp(noise(d), 300) * .25 * (.6 + .4 * np.sin(2 * np.pi * .12 * x))
    s += pad([[57, 60, 63]], d, d, .05, 900)
    return s * .55

def music_sad(d): return pad([[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], d, 2.6, .14, 1500)

def music_outro(d):
    out = pad([[57, 60, 64], [53, 57, 60]], d, 2.0, .1, 2200)
    beat = .5
    for i, tb in enumerate(np.arange(0, d, beat)):
        y = tt(.25); place(out, np.sin(2 * np.pi * (55 + 50 * np.exp(-y * 30)) * y) * np.exp(-y * 12) * .4 * (i % 2 == 0), tb)
        y = tt(.08); place(out, hp(noise(.08), 7000) * np.exp(-y * 50) * .05, tb + beat / 2)
    return out

MUS = dict(bar=music_bar, tension=music_tension, drone=music_drone, sad=music_sad, outro=music_outro)
MUS_GAIN = dict(bar=.55, tension=.55, drone=.6, sad=.55, outro=.55)

# ---------------------------------------------------------------- ambiências
def amb_crickets(d, g=1.0):
    out = np.zeros(int(d * SR) + SR)
    for c in range(5):
        f = rng.uniform(4200, 5200); per = rng.uniform(.6, 1.1); ph = rng.uniform(0, per)
        for t0 in np.arange(ph, d, per):
            for p in range(3):
                y = tt(.018); place(out, np.sin(2 * np.pi * f * y) * np.sin(np.pi * y / .018) * .05 * rng.uniform(.4, 1), t0 + p * .03)
    out += lp(noise(d + 1), 250) * .03
    return out[:int(d * SR)] * g
def amb_bar(d, g=1.0):
    x = tt(d); s = noise(d)
    m = bp(s, 250, 1800) * (.5 + .5 * np.abs(signal.sosfilt(signal.butter(2, 3, 'low', fs=SR, output='sos'), noise(d)) * 6).clip(0, 1))
    out = m * .09
    for t0 in rng.uniform(0, d, int(d / 1.5)):
        y = tt(.4); f = rng.uniform(2500, 4200)
        place(out, np.sin(2 * np.pi * f * y) * np.exp(-y * 14) * .05, t0)
    return out * g
AMB = dict(crickets=lambda d: amb_crickets(d), bar=lambda d: amb_bar(d), bar_quiet=lambda d: amb_bar(d, .45) + amb_crickets(d, .3),
           night=lambda d: amb_crickets(d, .8))

# ---------------------------------------------------------------- mixagem
dia = np.zeros(N); mus = np.zeros(N); amb = np.zeros(N); fx = np.zeros(N)
FADE = 0.6

def segments(field):
    segs, cur, start = [], None, 0
    for b in sched:
        v = b.get(field)
        if v is not None and v != cur:
            if cur and cur != "none": segs.append((cur, start, b["t0"]))
            cur, start = v, b["t0"]
    if cur and cur != "none": segs.append((cur, start, TOTAL))
    return segs

for name, a, b in segments("mus"):
    d = b - a + FADE
    s = MUS[name](d) * MUS_GAIN[name]
    s *= env(len(s), .4 if name != "bar" else .05, FADE)
    if name == "bar" and a > 0: pass
    place(mus, s, a)
for name, a, b in segments("amb"):
    d = b - a + FADE
    s = AMB[name](d); s *= env(len(s), .3, FADE); place(amb, s, a)

for b in sched:
    for n, s in b["sfx"]:
        place(fx, SFX[n](), b["t0"] + s)
    for ln in b["lines"]:
        y, _ = sf.read(f"{HERE}/lines/{ln['key']}.wav")
        g = .55 if ln["key"].endswith("lucas") and "Ainda" in ln["text"] else 1.0
        if ln["speaker"] in ("lucas", "rafael", "diego") and b["shot"].get("bg") == "night_street": g *= .9
        place(dia, y * g, ln["t0"])

# sala: um pouco de reverb no bar
dia = reverb(dia, .12)
# ducking
de = np.abs(dia); de = signal.sosfilt(signal.butter(2, 4, 'low', fs=SR, output='sos'), de)
de = (de / (de.max() + 1e-9) * 4).clip(0, 1)
mix = dia * 1.0 + mus * (1 - .55 * de) + amb * (1 - .4 * de) + fx
# limitador simples
pk = np.max(np.abs(mix)); mix = mix / pk * .95 if pk > .95 else mix
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
sf.write(f"{HERE}/mix.wav", np.stack([mix, mix], 1).astype(np.float32), SR)

# ---------------------------------------------------------------- boca + legendas
for b in sched:
    for ln in b["lines"]:
        y, _ = sf.read(f"{HERE}/lines/{ln['key']}.wav")
        hop = SR // FPS
        rms = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y), hop)])
        ref = np.percentile(rms, 90) + 1e-9
        m = (rms / ref).clip(0, 1.2)
        m = np.convolve(m, [.25, .5, .25], "same")
        ln["mouth"] = [round(float(v), 2) for v in m]
        words = ln["text"].split()
        w = np.array([len(re.sub(r"\W", "", x)) + 1.5 + (3 if re.search(r"[.,!?…]$", x) else 0) for x in words], float)
        cs = np.concatenate([[0], np.cumsum(w)]) / w.sum() * ln["dur"]
        ln["words"] = [dict(w=x, a=round(float(cs[i]), 3), b=round(float(cs[i + 1]), 3)) for i, x in enumerate(words)]

json.dump(dict(fps=FPS, total=TOTAL, beats=sched), open(f"{HERE}/schedule.json", "w"), ensure_ascii=False)
for b in sched: print(f"{b['t0']:6.2f} {b['dur']:5.2f} {b['id']}")
