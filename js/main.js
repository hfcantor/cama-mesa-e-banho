// E SE...? | HISTÓRIAS DO TABOCAL — inicialização, interface e laço de render.
import { Stage } from './render/stage.js';
import { Player } from './core/player.js';
import { buildTimeline } from './core/timeline.js';
import { loadNarration, loadDroppedFiles } from './core/narration.js';
import { Director } from './core/director.js';
import { MusicEngine } from './audio/music.js';
import { SpaceWorld } from './three/worlds/space.js';
import { VillageWorld } from './three/worlds/village.js';
import { OceanWorld } from './three/worlds/ocean.js';
import { LabWorld } from './three/worlds/lab.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const EP = (params.get('ep') || 'ep01').replace(/[^a-z0-9_-]/gi, '');
const QUALITY = Math.max(0.35, Math.min(1, parseFloat(params.get('q') || '0.75')));

const app = { narration: new Map(), timings: null, recording: false };
window.__tabocal = app;

const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));
function progress(k, text) { $('loadBar').style.width = `${Math.round(k * 100)}%`; $('loadText').textContent = text; }

async function boot() {
  try {
    progress(0.02, 'Carregando fontes…');
    await Promise.all([
      document.fonts.load('400 40px Anton'), document.fonts.load('900 40px Montserrat'),
      document.fonts.load('800 40px Montserrat'), document.fonts.load('700 40px Montserrat'),
    ]).catch(() => {});

    progress(0.06, 'Carregando episódio…');
    const episode = (await import(`../episodes/${EP}/episode.js`)).default;
    app.episode = episode;
    document.title = `${episode.titulo} | E SE...? — Histórias do Tabocal`;

    progress(0.1, 'Preparando o palco 3D…');
    await nextFrame();
    const stage = new Stage($('screen'), { quality: QUALITY, bloom: params.get('bloom') !== '0' });
    app.stage = stage;

    const shared = {};
    const worldDefs = [['space', SpaceWorld, 'Espaço: Terra e Lua'], ['village', VillageWorld, 'Vila do Tabocal'], ['ocean', OceanWorld, 'Litoral e marés'], ['lab', LabWorld, 'Observatório']];
    const needed = new Set(episode.scenes.map(s => s.world));
    const worlds = {};
    let i = 0;
    for (const [id, Cls, label] of worldDefs) {
      i++;
      if (!needed.has(id)) continue;
      progress(0.1 + 0.5 * (i / worldDefs.length), `Construindo cenário: ${label}…`);
      await nextFrame();
      worlds[id] = new Cls(shared);
    }
    app.worlds = worlds;

    // pré-compila shaders de cada mundo (evita travadas na primeira aparição)
    progress(0.65, 'Compilando shaders…');
    await nextFrame();
    for (const w of Object.values(worlds)) { stage.renderer.compile(w.scene, stage.camera); }

    const player = new Player();
    app.player = player;
    progress(0.72, 'Procurando arquivos de narração…');
    // decodificação precisa de um AudioContext; cria um temporário se necessário
    const decodeCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
    const { map, timings } = await loadNarration(decodeCtx, episode, (k, t) => progress(0.72 + 0.25 * k, `Procurando ${t}…`));
    app.narration = map; app.timings = timings;

    app.director = new Director(stage, worlds);
    app.music = new MusicEngine();
    rebuild();

    progress(1, 'Pronto!');
    await nextFrame();
    $('loader').classList.add('hidden');
    $('bigPlay').classList.remove('hidden');
    $('controls').classList.remove('hidden');
    setupUI();
    requestAnimationFrame(loop);
  } catch (e) {
    console.error(e);
    progress(1, 'Erro ao carregar: ' + e.message + (location.protocol === 'file:' ? ' — abra por um servidor local (veja o README).' : ''));
  }
}

function rebuild() {
  const tl = buildTimeline(app.episode, app.narration);
  app.timeline = tl;
  app.music.setPlan(tl.scenes.map(s => ({ start: s.start, end: s.end, ...(s.def.music || {}) })));
  const wasT = app.player.time ? (app.player.timeline ? app.player.time() : 0) : 0;
  app.player.setContent(tl, app.music);
  app.director.setTimeline(tl);
  if (app.player.state !== 'idle') app.player.seek(Math.min(wasT, tl.duration - 0.1));
  renderStatus();
}

// ---------------- laço principal ----------------
let lastNow = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - lastNow) / 1000);
  lastNow = now;
  const p = app.player;
  const t = p.timeline ? p.time() : 0;
  const playing = p.state === 'playing';
  app.director.frame(t, playing ? dt : 0);
  updateUI(t);
  requestAnimationFrame(loop);
}

// Renderização determinística para testes/miniaturas: simula `warm` segundos antes de t
app.renderAt = async (t, warm = 1.5) => {
  app.player.pausedAt = t; if (app.player.state === 'idle') app.player.state = 'paused';
  app.director.invalidate();
  const steps = Math.ceil(warm * 30);
  for (let k = steps; k >= 0; k--) app.director.frame(Math.max(0, t - k / 30), k === steps ? 0 : 1 / 30);
};

// ---------------- interface ----------------
function fmt(s) { s = Math.max(0, s); return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

let idleTimer = 0;
function setupUI() {
  const p = app.player;
  const toggle = async () => {
    if (p.state === 'playing') await p.pause(); else await p.play();
    $('bigPlay').classList.toggle('hidden', p.state === 'playing');
  };
  $('bigPlay').onclick = toggle;
  $('btnPlay').onclick = toggle;
  $('screen').onclick = toggle;
  $('btnRestart').onclick = async () => { app.director.invalidate(); await p.restart(); $('bigPlay').classList.add('hidden'); };
  $('btnFull').onclick = () => { const f = $('frame'); document.fullscreenElement ? document.exitFullscreen() : f.requestFullscreen && f.requestFullscreen(); };
  $('seek').onclick = (e) => {
    const r = $('seek').getBoundingClientRect();
    app.director.invalidate();
    p.seek(((e.clientX - r.left) / r.width) * app.timeline.duration);
  };
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggle(); }
    if (e.code === 'KeyR') $('btnRestart').onclick();
  });
  p.onEnded = () => { $('bigPlay').classList.remove('hidden'); if (app.recording) stopRecording(); };
  $('frame').addEventListener('pointermove', () => { $('controls').classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => p.state === 'playing' && $('controls').classList.add('idle'), 2200); });
  $('btnRec').onclick = () => (app.recording ? stopRecording() : startRecording());
  $('btnWav').onclick = async () => { $('btnWav').textContent = '…'; await app.exportWav(); $('btnWav').textContent = '♪ WAV'; };

  // arrastar e soltar narração
  let dragDepth = 0;
  window.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; $('drop').classList.remove('hidden'); });
  window.addEventListener('dragleave', () => { if (--dragDepth <= 0) $('drop').classList.add('hidden'); });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    e.preventDefault(); dragDepth = 0; $('drop').classList.add('hidden');
    const ac = p.init();
    const { added, timings } = await loadDroppedFiles(ac, e.dataTransfer.files, app.narration, app.timings);
    app.timings = timings;
    if (added.length || timings) rebuild();
  });
  $('status').onclick = () => $('status').classList.toggle('collapsed');
}

function updateUI(t) {
  const d = app.timeline.duration;
  $('seekFill').style.width = `${(t / d) * 100}%`;
  $('time').textContent = `${fmt(t)} / ${fmt(d)}`;
  $('playIcon').setAttribute('d', app.player.state === 'playing' ? 'M6 5h4v14H6zm8 0h4v14h-4z' : 'M8 5v14l11-7z');
}

function renderStatus() {
  const ep = app.episode, tl = app.timeline;
  const total = ep.lines.length, have = app.narration.size;
  const withWords = [...app.narration.values()].filter(e => e.words).length;
  const cells = ep.lines.map(l => `<span class="${app.narration.has(l.id) ? 'ok' : ''}" title="${l.text.replace(/"/g, '&quot;')}">${l.id}</span>`).join('');
  $('status').innerHTML = `
    <h3>E SE...? · ${ep.id.toUpperCase()} — ${ep.titulo}</h3>
    <div>Duração: <b>${fmt(tl.duration)}</b> (${tl.duration.toFixed(1)} s) · 1080×1920 · 9:16</div>
    <div>Roteiro: <b class="${ep.roteiroStatus === 'aprovado' ? 'ok' : 'warn'}">${ep.roteiroStatus}</b></div>
    <h3 style="margin-top:12px">Narração: <span class="${have === total ? 'ok' : 'warn'}">${have}/${total} trechos</span></h3>
    <div class="lines">${cells}</div>
    ${have === 0 ? `<div class="warn">⚠ Nenhum arquivo de narração encontrado. O vídeo roda em <b>modo pré-visualização</b>: legendas e cenas usam tempos estimados pelo roteiro e <b>não há voz</b>.</div>` : ''}
    ${have > 0 && have < total ? `<div class="warn">⚠ Trechos ausentes usam tempo estimado (sem voz).</div>` : ''}
    ${have > 0 ? `<div>Sincronia: início/fim da fala detectados na forma de onda de cada arquivo. ${withWords ? `<span class="ok">${withWords} trecho(s) com tempo por palavra (timings.json).</span>` : 'Sem timings.json: palavras distribuídas por sílabas dentro do tempo real de cada trecho.'}</div>` : ''}
    <ul>
      <li>Grave as falas em <code>audio/${ep.id}/narracao/L01.mp3</code> … <code>L${String(total).padStart(2, '0')}.mp3</code></li>
      <li>ou arraste os arquivos para o vídeo</li>
      <li>Trilha e efeitos: sintetizados ao vivo (originais)</li>
    </ul>`;
}

// ---------------- exportar áudio (WAV) ----------------
function wavBlob(buf) {
  const ch = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length;
  const dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, ch, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * ch * 2, true);
  dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i])); dv.setInt16(o, v * 0x7fff, true); o += 2; }
  return new Blob([dv], { type: 'audio/wav' });
}
app.renderMix = () => Player.renderOffline(app.timeline, app.music);
app.exportWav = async () => {
  const buf = await app.renderMix();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(wavBlob(buf));
  a.download = `E-SE-${app.episode.id}-audio.wav`;
  a.click();
};

// ---------------- gravação ----------------
let rec = null, chunks = [];
async function startRecording() {
  const p = app.player;
  if (app.narration.size < app.episode.lines.length && !confirm(`Atenção: faltam ${app.episode.lines.length - app.narration.size} trechos de narração. O vídeo gravado ficará sem voz nesses trechos. Gravar mesmo assim?`)) return;
  if (!window.MediaRecorder || !$('screen').captureStream) { alert('Este navegador não suporta gravação de canvas.'); return; }
  p.init();
  const stream = $('screen').captureStream(30);
  if (p.recordDest) p.recordDest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
  const types = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  const mime = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
  rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 192_000 });
  chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `E-SE-${app.episode.id}-historias-do-tabocal.${(rec.mimeType || '').includes('mp4') ? 'mp4' : 'webm'}`;
    a.click();
  };
  app.prevQuality = app.stage.quality;
  app.stage.setQuality(1);
  app.recording = true;
  $('btnRec').classList.add('on'); $('btnRec').textContent = '■ Parar';
  $('recBadge').classList.remove('hidden');
  app.director.invalidate();
  await p.restart();
  $('bigPlay').classList.add('hidden');
  rec.start(500);
}
function stopRecording() {
  app.recording = false;
  if (rec && rec.state !== 'inactive') rec.stop();
  app.stage.setQuality(app.prevQuality || QUALITY);
  $('btnRec').classList.remove('on'); $('btnRec').textContent = '● Gravar';
  $('recBadge').classList.add('hidden');
}

boot();
