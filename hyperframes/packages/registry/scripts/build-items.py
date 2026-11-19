#!/usr/bin/env python3
"""Writes the built-in registry blocks (item.json + snippet/head files).

Run from the repository root:  python3 packages/registry/scripts/build-items.py
The generated files are committed; this script documents how they were made.
"""
import json
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent / "items"

FONT = '<link rel="stylesheet" href="/__hf/fonts/inter/index.css">'


def item(name, meta, snippet, head=None, files=None):
    d = ROOT / name
    d.mkdir(parents=True, exist_ok=True)
    meta = {"name": name, **meta, "snippet": "snippet.html"}
    if head:
        meta["head"] = "head.html"
        (d / "head.html").write_text(head.strip() + "\n")
    if files:
        meta["files"] = files
    (d / "snippet.html").write_text(snippet.strip() + "\n")
    (d / "item.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")


p = lambda t, d, desc, **kw: {"type": t, "default": d, "description": desc, **kw}

item("lower-third", {
    "type": "block", "title": "Lower third", "tags": ["text", "gsap", "name"],
    "description": "Name/role caption with an accent bar, animated with a GSAP timeline.",
    "requires": ["gsap"],
    "params": {"title": p("string", "Ada Lovelace", "main line"), "subtitle": p("string", "Mathematician", "second line"),
               "start": p("number", 1, "start (s)"), "duration": p("number", 4, "duration (s)"), "accent": p("color", "#ffcc00", "bar colour")},
}, """
<div id="lt-{{uid}}" class="hf-lower-third" data-name="Lower third" data-start="{{start}}" data-duration="{{duration}}" data-track="10" style="--lt-accent: {{accent}}">
  <div class="hf-lt-bar"></div>
  <div class="hf-lt-text"><div class="hf-lt-title">{{title}}</div><div class="hf-lt-subtitle">{{subtitle}}</div></div>
</div>
<script>
  (() => {
    const root = document.getElementById('lt-{{uid}}');
    const d = Number(root.dataset.duration);
    const tl = gsap.timeline({ paused: true });
    tl.from(root.querySelector('.hf-lt-bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.5, ease: 'power3.out' })
      .from(root.querySelectorAll('.hf-lt-title, .hf-lt-subtitle'), { xPercent: -20, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, 0.2)
      .to(root, { opacity: 0, x: -40, duration: 0.4, ease: 'power2.in' }, Math.max(0.8, d - 0.4));
    hf.register(tl, { start: 'lt-{{uid}}' });
  })();
</script>
""", FONT + """
<style>
.hf-lower-third{position:absolute;left:6%;bottom:12%;display:flex;gap:24px;align-items:stretch;font-family:"Inter Variable",system-ui,sans-serif;color:#fff}
.hf-lt-bar{width:10px;border-radius:6px;background:var(--lt-accent)}
.hf-lt-title{font-size:56px;font-weight:800;letter-spacing:-.02em;line-height:1.05;text-shadow:0 4px 24px rgba(0,0,0,.45)}
.hf-lt-subtitle{font-size:32px;font-weight:500;opacity:.85;margin-top:6px}
</style>
""")

item("title-card", {
    "type": "block", "title": "Title card", "tags": ["text", "intro", "presets"],
    "description": "Full-frame title + subtitle using declarative enter/exit presets (no JS).",
    "params": {"title": p("string", "Your big idea", "title"), "subtitle": p("string", "A subtitle that explains it", "subtitle"),
               "start": p("number", 0, "start (s)"), "duration": p("number", 4, "duration (s)"),
               "background": p("string", "linear-gradient(135deg,#0f172a,#312e81)", "CSS background")},
}, """
<section id="title-{{uid}}" class="hf-title-card" data-name="Title card" data-start="{{start}}" data-duration="{{duration}}" data-exit="fade 0.5" data-track="1" style="background: {{background}}">
  <h1 id="title-{{uid}}-h" data-start="title-{{uid}}.start + 0.15" data-end="title-{{uid}}.end" data-enter="fade-up 0.9 out-expo">{{title}}</h1>
  <p id="title-{{uid}}-p" data-start="title-{{uid}}.start + 0.5" data-end="title-{{uid}}.end" data-enter="blur-in 0.8">{{subtitle}}</p>
</section>
""", FONT + """
<style>
.hf-title-card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:"Inter Variable",system-ui,sans-serif;color:#fff;padding:0 8%}
.hf-title-card h1{margin:0;font-size:120px;font-weight:850;letter-spacing:-.04em;line-height:1}
.hf-title-card p{margin:28px 0 0;font-size:40px;font-weight:450;opacity:.8}
</style>
""")

item("kinetic-text", {
    "type": "block", "title": "Kinetic text", "tags": ["text", "gsap", "typography"],
    "description": "Words fly in one by one (GSAP stagger) and leave together.",
    "requires": ["gsap"],
    "params": {"text": p("string", "Make every frame count", "sentence"), "start": p("number", 0, "start (s)"),
               "duration": p("number", 3, "duration (s)"), "color": p("color", "#ffffff", "text colour")},
}, """
<div id="kt-{{uid}}" class="hf-kinetic" data-name="Kinetic text" data-start="{{start}}" data-duration="{{duration}}" style="color: {{color}}">{{text}}</div>
<script>
  (() => {
    const el = document.getElementById('kt-{{uid}}');
    const words = el.textContent.trim().split(/\\s+/);
    el.textContent = '';
    for (const w of words) { const s = document.createElement('span'); s.textContent = w; el.append(s, ' '); }
    const spans = el.querySelectorAll('span');
    const d = Number(el.dataset.duration);
    const tl = gsap.timeline({ paused: true });
    tl.from(spans, { y: 120, rotate: 8, opacity: 0, duration: 0.7, ease: 'back.out(1.7)', stagger: 0.08 })
      .to(spans, { y: -80, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.03 }, Math.max(1, d - 0.6));
    hf.register(tl, { start: 'kt-{{uid}}' });
  })();
</script>
""", FONT + """
<style>
.hf-kinetic{position:absolute;inset:0;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:0 .3em;padding:0 10%;font:900 110px/1.05 "Inter Variable",system-ui,sans-serif;letter-spacing:-.03em;text-align:center}
.hf-kinetic span{display:inline-block}
</style>
""")

item("counter", {
    "type": "block", "title": "Number counter", "tags": ["data", "numbers"],
    "description": "Counts from one number to another with easing (deterministic, via hf.onFrame).",
    "params": {"from": p("number", 0, "start value"), "to": p("number", 12500, "end value"), "prefix": p("string", "", "text before"),
               "suffix": p("string", "+", "text after"), "label": p("string", "happy customers", "caption"),
               "locale": p("string", "en-US", "number formatting locale"), "start": p("number", 0, "start (s)"), "duration": p("number", 3, "duration (s)")},
}, """
<div id="counter-{{uid}}" class="hf-counter" data-name="Counter" data-start="{{start}}" data-duration="{{duration}}" data-enter="pop 0.5" data-from="{{from}}" data-to="{{to}}" data-prefix="{{prefix}}" data-suffix="{{suffix}}" data-locale="{{locale}}">
  <div class="hf-counter-value">{{from}}</div>
  <div class="hf-counter-label">{{label}}</div>
</div>
<script>
  (() => {
    const el = document.getElementById('counter-{{uid}}');
    const out = el.querySelector('.hf-counter-value');
    const d = el.dataset;
    const from = Number(d.from), to = Number(d.to);
    const fmt = new Intl.NumberFormat(d.locale || 'en-US');
    hf.onFrame((t) => {
      const start = Number(d.start), dur = Math.max(0.1, Number(d.duration) - 0.6);
      const p = Math.min(1, Math.max(0, (t - start) / dur));
      const e = 1 - Math.pow(1 - p, 4);
      out.textContent = d.prefix + fmt.format(Math.round(from + (to - from) * e)) + d.suffix;
    });
  })();
</script>
""", FONT + """
<style>
.hf-counter{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:"Inter Variable",system-ui,sans-serif;color:#fff}
.hf-counter-value{font-size:180px;font-weight:900;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.hf-counter-label{font-size:40px;opacity:.75;margin-top:8px}
</style>
""")

item("progress-bar", {
    "type": "block", "title": "Progress bar", "tags": ["ui", "timeline"],
    "description": "A bar that fills over the whole composition (or its own duration).",
    "params": {"color": p("color", "#22d3ee", "fill colour"), "height": p("number", 10, "bar height (px)"),
               "start": p("number", 0, "start (s)"), "duration": p("number", 10, "duration (s)")},
}, """
<div id="pb-{{uid}}" class="hf-progress" data-name="Progress bar" data-start="{{start}}" data-duration="{{duration}}" data-track="20" style="height: {{height}}px"><div style="background: {{color}}"></div></div>
<script>
  (() => {
    const el = document.getElementById('pb-{{uid}}');
    const fill = el.firstElementChild;
    hf.onFrame((t) => {
      const p = Math.min(1, Math.max(0, (t - Number(el.dataset.start)) / Number(el.dataset.duration)));
      fill.style.transform = `scaleX(${p})`;
    });
  })();
</script>
""", """
<style>
.hf-progress{position:absolute;left:0;right:0;bottom:0;background:rgba(255,255,255,.15)}
.hf-progress>div{height:100%;transform-origin:0 50%;transform:scaleX(0)}
</style>
""")

item("logo-reveal", {
    "type": "block", "title": "Logo reveal", "tags": ["brand", "mask", "intro"],
    "description": "Iris mask reveal of a logo image, with a soft exit.",
    "params": {"src": p("string", "assets/registry/hf-logo.svg", "logo image"), "start": p("number", 0, "start (s)"),
               "duration": p("number", 3, "duration (s)"), "width": p("number", 520, "logo width (px)")},
}, """
<img id="logo-{{uid}}" class="hf-logo" src="{{src}}" alt="" data-name="Logo" data-start="{{start}}" data-duration="{{duration}}" data-enter="iris 1 out-cubic" data-exit="fade 0.5" data-keyframes='[{"t":0,"scale":1.08},{"t":{{duration}},"scale":1,"ease":"out-cubic"}]' style="width: {{width}}px">
""", """
<style>.hf-logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}</style>
""", files=["assets/registry/hf-logo.svg"])

item("audio-bars", {
    "type": "block", "title": "Audio bars", "tags": ["audio", "visualizer", "reactive"],
    "description": "Bars that react to an audio file (offline FFT analysis, deterministic).",
    "params": {"src": p("string", "assets/music.mp3", "audio file to analyse"), "color": p("color", "#a78bfa", "bar colour"),
               "mode": p("enum", "bars", "bars or circle", options=["bars", "circle"]), "start": p("number", 0, "start (s)"), "duration": p("number", 10, "duration (s)")},
}, """
<canvas id="bars-{{uid}}" class="hf-audio-bars" data-name="Audio bars" data-start="{{start}}" data-duration="{{duration}}" data-hf-visualizer="{{mode}}" data-color="{{color}}"></canvas>
<script data-src="{{src}}">hf.delayReady(hf.audio.load(document.currentScript.dataset.src, 48));</script>
""", """
<style>.hf-audio-bars{position:absolute;left:10%;right:10%;bottom:10%;height:30%;width:80%}</style>
""")

item("particles", {
    "type": "block", "title": "Particles overlay", "tags": ["effects", "particles"],
    "description": "Seeded particle systems: snow, confetti, sparks, bubbles, stars, dust.",
    "params": {"preset": p("enum", "confetti", "particle preset", options=["snow", "confetti", "sparks", "bubbles", "stars", "dust"]),
               "count": p("number", 160, "particles"), "colors": p("string", "#ffd166,#ef476f,#06d6a0,#118ab2", "comma-separated colours"),
               "start": p("number", 0, "start (s)"), "duration": p("number", 5, "duration (s)")},
}, """
<canvas id="px-{{uid}}" data-name="Particles" data-hf-particles="{{preset}}" data-count="{{count}}" data-colors="{{colors}}" data-start="{{start}}" data-duration="{{duration}}" data-track="30" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
""")

item("karaoke-captions", {
    "type": "block", "title": "Karaoke captions", "tags": ["captions", "text", "narration"],
    "description": "Word-highlighted captions from SRT/VTT/JSON (styles: karaoke, pop, highlight, typewriter, bounce, plain).",
    "params": {"src": p("string", "captions.json", "captions file"), "style": p("enum", "highlight", "style", options=["karaoke", "pop", "highlight", "typewriter", "bounce", "plain"]),
               "position": p("enum", "bottom", "position", options=["top", "center", "bottom"]), "size": p("number", 64, "font size (px)"),
               "active": p("color", "#ffe14d", "active word colour"), "start": p("number", 0, "start (s)")},
}, """
<div id="cap-{{uid}}" data-name="Captions" data-hf-captions="{{src}}" data-style="{{style}}" data-position="{{position}}" data-start="{{start}}" data-track="40" style="font-size: {{size}}px; --hf-cap-active: {{active}}; --hf-cap-highlight-bg: {{active}}; font-family: 'Inter Variable', system-ui, sans-serif"></div>
""", FONT)

item("call-to-action", {
    "type": "block", "title": "Call to action", "tags": ["social", "cta"],
    "description": "Pill button with a pulse, e.g. 'Follow for more'.",
    "params": {"text": p("string", "Follow for more", "button text"), "color": p("color", "#ef4444", "button colour"),
               "start": p("number", 0, "start (s)"), "duration": p("number", 3, "duration (s)")},
}, """
<div id="cta-{{uid}}" class="hf-cta" data-name="CTA" data-start="{{start}}" data-duration="{{duration}}" data-enter="pop 0.6" data-exit="zoom-out 0.4"
  data-keyframes='[{"t":0.6,"scale":1},{"t":0.9,"scale":1.08},{"t":1.2,"scale":1},{"t":1.5,"scale":1.08},{"t":1.8,"scale":1}]'
  style="background: {{color}}">{{text}}</div>
""", FONT + """
<style>.hf-cta{position:absolute;left:50%;top:70%;translate:-50% 0;padding:28px 64px;border-radius:999px;color:#fff;font:800 56px/1 "Inter Variable",system-ui,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.35);white-space:nowrap}</style>
""")

item("quote-card", {
    "type": "block", "title": "Quote card", "tags": ["text", "testimonial"],
    "description": "Large quote with author, wipe-in reveal.",
    "params": {"quote": p("string", "Simplicity is the ultimate sophistication.", "quote"), "author": p("string", "Leonardo da Vinci", "author"),
               "start": p("number", 0, "start (s)"), "duration": p("number", 5, "duration (s)")},
}, """
<figure id="q-{{uid}}" class="hf-quote" data-name="Quote" data-start="{{start}}" data-duration="{{duration}}" data-enter="wipe-right 1.1 in-out-cubic" data-exit="fade 0.5">
  <blockquote>“{{quote}}”</blockquote>
  <figcaption>— {{author}}</figcaption>
</figure>
""", '<link rel="stylesheet" href="/__hf/fonts/playfair-display/index.css">' + FONT + """
<style>
.hf-quote{position:absolute;inset:12% 10%;margin:0;display:flex;flex-direction:column;justify-content:center;color:#fff}
.hf-quote blockquote{margin:0;font:600 84px/1.15 "Playfair Display Variable",Georgia,serif}
.hf-quote figcaption{margin-top:36px;font:500 36px "Inter Variable",system-ui,sans-serif;opacity:.75}
</style>
""")

item("kenburns-image", {
    "type": "block", "title": "Ken Burns image", "tags": ["image", "camera", "zoom", "pan"],
    "description": "Full-frame image with a slow camera move (in/out/left/right/up/down).",
    "params": {"src": p("string", "assets/registry/sample-a.jpg", "image"), "move": p("enum", "in", "camera move", options=["in", "out", "left", "right", "up", "down"]),
               "start": p("number", 0, "start (s)"), "duration": p("number", 5, "duration (s)")},
}, """
<img id="kb-{{uid}}" class="hf-kenburns" src="{{src}}" alt="" data-name="Image" data-start="{{start}}" data-duration="{{duration}}" data-kenburns="{{move}} 0.18" data-enter="fade 0.6" data-exit="fade 0.6">
""", """
<style>.hf-kenburns{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}</style>
""", files=["assets/registry/sample-a.jpg"])

item("three-orbit", {
    "type": "block", "title": "Three.js object", "tags": ["3d", "three", "webgl"],
    "description": "Lit 3D torus knot rendered with Three.js, driven by composition time.",
    "requires": ["three"],
    "params": {"color": p("color", "#7c3aed", "material colour"), "start": p("number", 0, "start (s)"), "duration": p("number", 6, "duration (s)")},
}, """
<canvas id="three-{{uid}}" class="hf-three" data-name="3D object" data-start="{{start}}" data-duration="{{duration}}" data-color="{{color}}"></canvas>
<script type="module">
  import * as THREE from 'three';
  const canvas = document.getElementById('three-{{uid}}');
  const w = canvas.clientWidth || 1920, h = canvas.clientHeight || 1080;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h, false);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.32, 220, 32), new THREE.MeshStandardMaterial({ color: canvas.dataset.color, metalness: 0.35, roughness: 0.3 }));
  scene.add(mesh, new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x22d3ee, 30); rim.position.set(-4, -2, 2); scene.add(rim);
  const start = Number(canvas.dataset.start);
  hf.onFrame((t) => {
    const local = Math.max(0, t - start);
    mesh.rotation.set(local * 0.5, local * 0.8, 0);
    camera.position.set(Math.sin(local * 0.3) * 1.5, 0.4, 6 - Math.min(local, 2) * 0.5);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });
</script>
""", """
<style>.hf-three{position:absolute;inset:0;width:100%;height:100%}</style>
""")

item("lottie-player", {
    "type": "block", "title": "Lottie animation", "tags": ["lottie", "vector", "animation"],
    "description": "Plays a Lottie (Bodymovin JSON) animation frame-accurately.",
    "requires": ["lottie"],
    "params": {"src": p("string", "assets/registry/hf-spin.json", "Lottie JSON"), "size": p("number", 480, "size (px)"),
               "start": p("number", 0, "start (s)"), "duration": p("number", 4, "duration (s)")},
}, """
<div id="lottie-{{uid}}" class="hf-lottie" data-name="Lottie" data-hf-lottie="{{src}}" data-loop data-start="{{start}}" data-duration="{{duration}}" style="width: {{size}}px; height: {{size}}px"></div>
""", """
<style>.hf-lottie{position:absolute;left:50%;top:50%;translate:-50% -50%}</style>
""", files=["assets/registry/hf-spin.json"])

item("shader-transition", {
    "type": "transition", "title": "Shader transition (WebGL)", "tags": ["transition", "shader", "webgl"],
    "description": "GLSL transition between two images/videos inside a composition.",
    "requires": ["shader-transitions"],
    "params": {"from": p("string", "assets/registry/sample-a.jpg", "outgoing image"), "to": p("string", "assets/registry/sample-b.jpg", "incoming image"),
               "shader": p("enum", "ripple", "shader", options=["fade", "wipeLeft", "circle", "crossZoom", "pixelize", "ripple", "dissolve", "swirl", "directionalBlur"]),
               "start": p("number", 0, "start (s)"), "duration": p("number", 1.5, "duration (s)")},
}, """
<div id="sx-{{uid}}" data-name="Shader transition" style="position:absolute;inset:0">
  <img id="sx-{{uid}}-a" src="{{from}}" alt="" style="display:none">
  <img id="sx-{{uid}}-b" src="{{to}}" alt="" style="display:none">
  <canvas id="sx-{{uid}}-c" data-hf-shader="{{shader}}" data-from="#sx-{{uid}}-a" data-to="#sx-{{uid}}-b" data-start="{{start}}" data-duration="{{duration}}" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
</div>
""", files=["assets/registry/sample-a.jpg", "assets/registry/sample-b.jpg"])

item("bar-chart", {
    "type": "block", "title": "Animated bar chart", "tags": ["data", "chart", "gsap"],
    "description": "Bars grow with a stagger; values and labels are parameters.",
    "requires": ["gsap"],
    "params": {"values": p("string", "42,68,55,91", "comma-separated values"), "labels": p("string", "Q1,Q2,Q3,Q4", "comma-separated labels"),
               "color": p("color", "#38bdf8", "bar colour"), "title": p("string", "Revenue growth", "chart title"),
               "start": p("number", 0, "start (s)"), "duration": p("number", 5, "duration (s)")},
}, """
<div id="chart-{{uid}}" class="hf-chart" data-name="Bar chart" data-start="{{start}}" data-duration="{{duration}}" data-enter="fade 0.4" data-exit="fade 0.4" data-values="{{values}}" data-labels="{{labels}}" style="--bar: {{color}}">
  <h2>{{title}}</h2><div class="hf-chart-bars"></div>
</div>
<script>
  (() => {
    const root = document.getElementById('chart-{{uid}}');
    const values = root.dataset.values.split(',').map(Number);
    const labels = root.dataset.labels.split(',');
    const max = Math.max(...values);
    const box = root.querySelector('.hf-chart-bars');
    values.forEach((v, i) => {
      const col = document.createElement('div');
      col.className = 'hf-chart-col';
      col.innerHTML = '<span class="v"></span><div class="b"></div><span class="l"></span>';
      col.querySelector('.v').textContent = v;
      col.querySelector('.l').textContent = labels[i] ?? '';
      col.querySelector('.b').style.height = (v / max) * 100 + '%';
      box.append(col);
    });
    const tl = gsap.timeline({ paused: true });
    tl.from(box.querySelectorAll('.b'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'power3.out', stagger: 0.15 }, 0.3)
      .from(box.querySelectorAll('.v'), { opacity: 0, y: 20, duration: 0.4, stagger: 0.15 }, 0.8);
    hf.register(tl, { start: 'chart-{{uid}}' });
  })();
</script>
""", FONT + """
<style>
.hf-chart{position:absolute;inset:10% 12%;display:flex;flex-direction:column;font-family:"Inter Variable",system-ui,sans-serif;color:#fff}
.hf-chart h2{margin:0 0 40px;font-size:64px;font-weight:800}
.hf-chart-bars{flex:1;display:flex;gap:4%;align-items:flex-end}
.hf-chart-col{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:12px}
.hf-chart-col .b{width:100%;background:var(--bar);border-radius:14px 14px 4px 4px}
.hf-chart-col .v{font-size:40px;font-weight:800}
.hf-chart-col .l{font-size:30px;opacity:.7}
</style>
""")

item("anime-grid", {
    "type": "block", "title": "Anime.js dot grid", "tags": ["anime", "pattern", "background"],
    "description": "Grid of dots animated with Anime.js v4 stagger from the centre.",
    "requires": ["anime"],
    "params": {"color": p("color", "#f472b6", "dot colour"), "start": p("number", 0, "start (s)"), "duration": p("number", 4, "duration (s)")},
}, """
<div id="grid-{{uid}}" class="hf-grid" data-name="Dot grid" data-start="{{start}}" data-duration="{{duration}}" style="--dot: {{color}}"></div>
<script>
  (() => {
    const root = document.getElementById('grid-{{uid}}');
    const cols = 16, rows = 9;
    for (let i = 0; i < cols * rows; i++) root.append(document.createElement('i'));
    const { animate, stagger } = anime;
    const a = animate(root.querySelectorAll('i'), {
      scale: [{ to: 1.8, duration: 500 }, { to: 1, duration: 700 }],
      opacity: [{ to: 1, duration: 400 }, { to: 0.35, duration: 800 }],
      delay: stagger(60, { grid: [cols, rows], from: 'center' }),
      ease: 'inOutQuad',
      autoplay: false,
    });
    hf.register(a, { start: 'grid-{{uid}}' });
  })();
</script>
""", """
<style>
.hf-grid{position:absolute;inset:8%;display:grid;grid-template-columns:repeat(16,1fr);grid-template-rows:repeat(9,1fr);place-items:center}
.hf-grid i{width:22px;height:22px;border-radius:50%;background:var(--dot);opacity:.35;display:block}
</style>
""")

print("items written to", ROOT)
