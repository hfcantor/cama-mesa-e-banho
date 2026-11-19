#!/usr/bin/env python3
"""Writes the built-in project templates used by `hfr init --template <name>`.
Run from the repository root:  python3 packages/registry/scripts/build-templates.py
"""
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent / "items"
FONT = '<link rel="stylesheet" href="/__hf/fonts/inter/index.css">'


def template(name, title, description, files, params=None, tags=None):
    d = ROOT / name
    d.mkdir(parents=True, exist_ok=True)
    meta = {"name": name, "type": "template", "title": title, "description": description, "tags": tags or []}
    if params:
        meta["params"] = params
    (d / "item.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    for rel, content in files.items():
        f = d / rel
        f.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, bytes):
            f.write_bytes(content)
        else:
            f.write_text(content.strip() + "\n")


TITLE = {"title": {"type": "string", "default": "My video", "description": "project title"}}


def page(body, head="", size=(1920, 1080), fps=30, duration=6, background="#0b1020", extra="", scripts=""):
    w, h = size
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{{{{title}}}}</title>
  {FONT}
{head}
</head>
<body>
  <div id="stage" data-composition data-width="{w}" data-height="{h}" data-fps="{fps}" data-duration="{duration}" data-background="{background}"{extra}>
{body}
  </div>
{scripts}
</body>
</html>"""


manifest = lambda **kw: json.dumps({"name": "{{title}}", "version": 1, **kw}, indent=2)

# ---------------------------------------------------------------- blank
template("blank", "Blank", "Empty 1080p composition with one animated title.", {
    "hyperframes.json": manifest(entry="index.html", output={"file": "renders/video.mp4"}),
    "index.html": page("""
    <h1 data-start="0" data-duration="5" data-enter="fade-up 0.8" data-exit="fade 0.5"
        style="position:absolute;inset:0;display:grid;place-items:center;margin:0;color:#fff;font:800 120px 'Inter Variable',system-ui">{{title}}</h1>
""", duration=5),
}, TITLE, ["starter"])

# ---------------------------------------------------------------- promo (GSAP)
template("promo", "Product promo (GSAP)", "Intro, feature list, stat counter and outro driven by a GSAP timeline plus presets.", {
    "hyperframes.json": manifest(entry="index.html", output={"file": "renders/promo.mp4"}),
    "index.html": page("""
    <div class="bg"></div>
    <canvas data-hf-particles="dust" data-count="140" data-colors="#ffffff" data-start="0" style="position:absolute;inset:0;width:100%;height:100%"></canvas>

    <section id="intro" data-name="Intro" data-start="0" data-duration="3" data-exit="blur-in 0.5" class="center">
      <p class="eyebrow">Introducing</p>
      <h1 class="headline">{{title}}</h1>
    </section>

    <section id="features" data-name="Features" data-start="intro.end" data-duration="4" data-enter="fade 0.4" data-exit="fade 0.4" class="center">
      <ul class="features">
        <li>⚡ Renders HTML to MP4</li>
        <li>🎯 Frame-accurate timelines</li>
        <li>🧩 GSAP · Anime.js · Lottie · Three.js</li>
      </ul>
    </section>

    <section id="outro" data-name="Outro" data-start="features.end" data-end="10" data-enter="zoom-out 0.8 out-expo" class="center">
      <h2 class="headline small">Start building today</h2>
      <div class="pill">hfr init</div>
    </section>
    <div id="bar" data-start="0" data-duration="10" style="position:absolute;left:0;bottom:0;height:8px;width:100%;background:#22d3ee;transform-origin:0 50%"></div>
""", head="""  <script src="/__hf/lib/gsap.js"></script>
  <style>
    .bg{position:absolute;inset:-10%;background:radial-gradient(60% 60% at 30% 30%,#312e81 0%,transparent 70%),radial-gradient(50% 50% at 75% 70%,#0e7490 0%,transparent 70%),#0b1020}
    .center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;font-family:'Inter Variable',system-ui,sans-serif}
    .eyebrow{font-size:40px;letter-spacing:.3em;text-transform:uppercase;opacity:.7;margin:0 0 24px}
    .headline{font-size:150px;font-weight:900;letter-spacing:-.05em;margin:0;line-height:1}
    .headline.small{font-size:110px}
    .features{list-style:none;padding:0;margin:0;font-size:72px;font-weight:700;line-height:1.6;text-align:left}
    .pill{margin-top:48px;padding:20px 48px;border-radius:999px;background:#fff;color:#0b1020;font:700 48px 'JetBrains Mono Variable',monospace}
  </style>
  <link rel="stylesheet" href="/__hf/fonts/jetbrains-mono/index.css">""", duration=10, scripts="""
<script>
  // One GSAP timeline, registered so it is seekable frame by frame.
  const tl = gsap.timeline({ paused: true });
  tl.from('.eyebrow', { y: 40, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0.2)
    .from('.headline', { scale: 0.8, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0.35)
    .from('.features li', { x: -120, opacity: 0, stagger: 0.25, duration: 0.7, ease: 'back.out(1.6)' }, 3.3)
    .from('.pill', { y: 60, opacity: 0, duration: 0.6, ease: 'power3.out' }, 7.6)
    .fromTo('#bar', { scaleX: 0 }, { scaleX: 1, duration: 10, ease: 'none' }, 0)
    .to('.bg', { rotate: 8, scale: 1.1, duration: 10, ease: 'none' }, 0);
  hf.register(tl);
</script>"""),
}, TITLE, ["marketing", "gsap"])

# ---------------------------------------------------------------- captions (vertical)
words = "Every frame of this video is HTML. The captions are timed word by word and highlighted as they are spoken.".split()
t, ws = 0.3, []
for w in words:
    d = 0.18 + 0.045 * len(w)
    ws.append({"text": w, "start": round(t, 3), "end": round(t + d, 3)})
    t += d + (0.35 if w.endswith(".") else 0.06)
captions = {"language": "en", "cues": [{"start": ws[0]["start"], "end": ws[-1]["end"], "text": " ".join(words), "words": ws}]}
template("captions-vertical", "Vertical video with captions", "1080x1920 social video with word-highlighted captions; add narration with `hfr tts`.", {
    "hyperframes.json": manifest(entry="index.html", output={"file": "renders/vertical.mp4"}),
    "captions.json": json.dumps(captions, indent=2),
    "README.md": """# Vertical captions template

* `captions.json` holds word timings. Replace it with your own:
  - generate narration + timings: `hfr tts --file script.txt --out assets/narration.mp3 --captions captions.json`
  - or transcribe an existing voice-over: `hfr captions transcribe assets/voice.mp3 -o captions.json`
  - or align a known script offline: `hfr captions align assets/voice.mp3 script.txt -o captions.json`
* Then add `<audio src="assets/narration.mp3" data-start="0"></audio>` inside the composition.
""",
    "index.html": page("""
    <div class="bg" data-start="0" data-kenburns="in 0.12"></div>
    <h1 class="top" data-start="0.2" data-enter="fade-down 0.6">{{title}}</h1>
    <div data-hf-captions="captions.json" data-style="highlight" data-position="center" data-max-words="4"
         style="font-size:92px;font-family:'Inter Variable',system-ui;font-weight:900;--hf-cap-highlight-bg:#facc15"></div>
    <canvas data-hf-particles="bubbles" data-count="40" data-colors="#ffffff" data-start="0" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
""", head="""  <style>
    .bg{position:absolute;inset:0;background:linear-gradient(160deg,#111827,#7c2d12 60%,#ea580c)}
    .top{position:absolute;top:9%;left:8%;right:8%;margin:0;text-align:center;color:#fff;font:800 76px/1.1 'Inter Variable',system-ui}
  </style>""", size=(1080, 1920), duration=10, background="#111827"),
}, TITLE, ["social", "captions", "vertical"])

# ---------------------------------------------------------------- three.js
template("three-scene", "Three.js scene", "3D scene rendered with Three.js and driven by composition time (hf.onFrame).", {
    "hyperframes.json": manifest(entry="index.html", output={"file": "renders/three.mp4"}),
    "index.html": page("""
    <canvas id="gl" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
    <h1 data-start="0.5" data-duration="5" data-enter="fade-up 0.8" data-exit="fade 0.5"
        style="position:absolute;left:8%;bottom:10%;margin:0;color:#fff;font:800 96px 'Inter Variable',system-ui">{{title}}</h1>
""", head="""  <script type="importmap">{"imports":{"three":"/__hf/lib/three.module.js","three/addons/":"/__hf/lib/three/addons/"}}</script>""", duration=6, background="#05060a", scripts="""
<script type="module">
  import * as THREE from 'three';
  import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(1920, 1080, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05060a, 8, 22);
  const camera = new THREE.PerspectiveCamera(35, 1920 / 1080, 0.1, 100);
  const group = new THREE.Group();
  scene.add(group);
  const colors = [0x22d3ee, 0xa78bfa, 0xf472b6, 0xfacc15];
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.9, 0.9, 4, 0.12), new THREE.MeshStandardMaterial({ color: colors[i % 4], roughness: 0.35, metalness: 0.2 }));
    const a = (i / 24) * Math.PI * 2;
    m.position.set(Math.cos(a) * 4, Math.sin(a * 3) * 0.8, Math.sin(a) * 4);
    group.add(m);
  }
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(5, 8, 6); scene.add(sun);
  hf.onFrame((t) => {
    group.rotation.y = t * 0.6;
    group.children.forEach((m, i) => { m.rotation.x = t + i; m.rotation.y = t * 1.3 + i; });
    camera.position.set(Math.sin(t * 0.25) * 10, 2.5 + Math.sin(t * 0.5), Math.cos(t * 0.25) * 10);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });
</script>"""),
}, TITLE, ["3d", "three"])

# ---------------------------------------------------------------- lottie
spin = (ROOT / "lottie-player" / "assets" / "registry" / "hf-spin.json").read_text()
template("lottie", "Lottie animation", "Lottie (Bodymovin) animation played frame-accurately with data-hf-lottie.", {
    "hyperframes.json": manifest(entry="index.html", output={"file": "renders/lottie.mp4"}),
    "assets/spin.json": spin,
    "index.html": page("""
    <div data-hf-lottie="assets/spin.json" data-loop data-start="0" style="position:absolute;left:50%;top:45%;width:560px;height:560px;translate:-50% -50%"></div>
    <h1 data-start="0.6" data-enter="fade-up 0.7" style="position:absolute;bottom:12%;width:100%;text-align:center;margin:0;color:#fff;font:800 84px 'Inter Variable',system-ui">{{title}}</h1>
""", head="""  <script src="/__hf/lib/lottie.js"></script>""", duration=6, background="#0f172a"),
}, TITLE, ["lottie"])

# ---------------------------------------------------------------- audio visualizer
music = pathlib.Path("/tmp/hfr-music.mp3")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
                "aevalsrc='0.55*sin(2*PI*55*t)*exp(-9*mod(t,0.5))+0.12*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*0.25*t))+0.1*sin(2*PI*277.2*t)*(0.6+0.4*sin(2*PI*0.5*t))+0.08*sin(2*PI*329.6*t)+0.05*(random(0)-0.5)*exp(-30*mod(t+0.25,0.5))':s=44100:d=8",
                "-ac", "2", "-c:a", "libmp3lame", "-b:a", "96k", str(music)], check=True)
template("audio-visualizer", "Audio visualizer", "Music with deterministic audio-reactive bars and a pulsing title (offline FFT).", {
    "hyperframes.json": manifest(entry="index.html", output={"file": "renders/visualizer.mp4"}),
    "assets/music.mp3": music.read_bytes(),
    "index.html": page("""
    <audio src="assets/music.mp3" data-start="0" data-volume="0.9" data-fade-out="1"></audio>
    <canvas data-hf-visualizer="circle" data-color="#22d3ee" style="position:absolute;left:50%;top:50%;width:900px;height:900px;translate:-50% -50%"></canvas>
    <canvas data-hf-visualizer="bars" data-color="#a78bfa" style="position:absolute;left:0;right:0;bottom:0;width:100%;height:220px;opacity:.7"></canvas>
    <h1 id="pulse" style="position:absolute;left:50%;top:50%;translate:-50% -50%;margin:0;color:#fff;font:900 96px 'Inter Variable',system-ui">{{title}}</h1>
""", duration=8, background="#05060a", extra=' data-audio-analysis="assets/music.mp3"', scripts="""
<script>
  const title = document.getElementById('pulse');
  hf.onFrame((t) => { title.style.scale = String(1 + hf.audio.level(t) * 0.25); });
</script>"""),
}, TITLE, ["audio", "music", "reactive"])

# ---------------------------------------------------------------- multi-scene
scene = lambda label, bg, enter: page(f"""
    <h1 data-start="0.2" data-enter="{enter}" style="position:absolute;inset:0;display:grid;place-items:center;margin:0;color:#fff;font:900 140px 'Inter Variable',system-ui">{label}</h1>
""", duration=3, background=bg)
template("multi-scene", "Multiple scenes with transitions", "Three scene files joined with FFmpeg xfade transitions plus a project-level music track.", {
    "hyperframes.json": json.dumps({"name": "{{title}}", "version": 1, "scenes": [
        {"src": "scenes/01-intro.html"},
        {"src": "scenes/02-middle.html", "transition": {"type": "circleopen", "duration": 0.8}},
        {"src": "scenes/03-end.html", "transition": {"type": "wave", "duration": 0.8}}],
        "audio": [{"src": "assets/music.mp3", "volume": 0.6, "fadeOut": 1.5, "loop": True, "role": "music"}],
        "output": {"file": "renders/scenes.mp4"}}, indent=2),
    "assets/music.mp3": music.read_bytes(),
    "scenes/01-intro.html": scene("{{title}}", "#1e1b4b", "zoom-in 0.8 out-back"),
    "scenes/02-middle.html": scene("Scene two", "#134e4a", "wipe-right 0.8"),
    "scenes/03-end.html": scene("The end", "#7f1d1d", "blur-in 0.8"),
}, TITLE, ["scenes", "transitions"])

# ---------------------------------------------------------------- tailwind
template("tailwind-promo", "Tailwind CSS v4 card", "Styling with Tailwind v4 utility classes compiled at serve/render time.", {
    "hyperframes.json": manifest(entry="index.html", output={"file": "renders/tailwind.mp4"}),
    "index.html": page("""
    <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-900"></div>
    <div data-start="0.3" data-enter="fade-up 0.8 out-expo" class="absolute inset-0 grid place-items-center">
      <div class="w-[1100px] rounded-[48px] bg-white/10 p-20 shadow-2xl ring-1 ring-white/20 backdrop-blur">
        <p class="text-brand text-3xl font-semibold uppercase tracking-[0.3em]">Tailwind v4</p>
        <h1 class="mt-6 text-8xl font-black tracking-tight text-white">{{title}}</h1>
        <p class="mt-8 text-4xl leading-snug text-white/70">Utility classes are scanned and compiled with the official Tailwind engine before every preview and render.</p>
        <div class="mt-12 flex gap-6">
          <span data-start="1.2" data-enter="pop 0.5" class="rounded-full bg-brand px-10 py-4 text-3xl font-bold text-slate-950">Deterministic</span>
          <span data-start="1.5" data-enter="pop 0.5" class="rounded-full bg-white px-10 py-4 text-3xl font-bold text-slate-950">Offline</span>
        </div>
      </div>
    </div>
""", head="""  <style data-hf-tailwind>
    @import "tailwindcss";
    @theme { --color-brand: #22d3ee; --font-sans: "Inter Variable", system-ui, sans-serif; }
  </style>""", duration=5),
}, TITLE, ["tailwind", "css"])

# ---------------------------------------------------------------- anime.js
template("anime-showcase", "Anime.js showcase", "Anime.js v4 timeline (registered with hf.register) with stagger and SVG drawing.", {
    "hyperframes.json": manifest(entry="index.html", output={"file": "renders/anime.mp4"}),
    "index.html": page("""
    <div class="row">
      <div class="sq"></div><div class="sq"></div><div class="sq"></div><div class="sq"></div><div class="sq"></div><div class="sq"></div>
    </div>
    <svg viewBox="0 0 600 200" style="position:absolute;left:50%;top:62%;width:900px;translate:-50% 0">
      <path id="wave" d="M10 100 C 110 0, 190 200, 300 100 S 490 0, 590 100" fill="none" stroke="#f472b6" stroke-width="10" stroke-linecap="round"/>
    </svg>
    <h1 data-start="2.5" data-enter="fade-up 0.6" style="position:absolute;bottom:8%;width:100%;text-align:center;margin:0;color:#fff;font:800 80px 'Inter Variable',system-ui">{{title}}</h1>
""", head="""  <script src="/__hf/lib/anime.js"></script>
  <style>
    .row{position:absolute;top:28%;left:0;right:0;display:flex;justify-content:center;gap:40px}
    .sq{width:120px;height:120px;border-radius:24px;background:#22d3ee}
  </style>""", duration=6, background="#111827", scripts="""
<script>
  const { createTimeline, stagger, svg } = anime;
  const tl = createTimeline({ autoplay: false, defaults: { ease: 'outExpo' } });
  tl.add('.sq', { y: [-300, 0], rotate: [-90, 0], opacity: [0, 1], duration: 900, delay: stagger(90) })
    .add(svg.createDrawable('#wave'), { draw: ['0 0', '0 1'], duration: 1600, ease: 'inOutSine' }, 600)
    .add('.sq', { scale: [1, 0.6, 1], backgroundColor: '#a78bfa', duration: 1200, delay: stagger(80, { from: 'center' }) }, 2200);
  hf.register(tl);
</script>"""),
}, TITLE, ["anime"])

print("templates written to", ROOT)
