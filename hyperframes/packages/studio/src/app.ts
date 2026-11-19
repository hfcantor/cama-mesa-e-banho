/**
 * HyperFrames Studio — single-page app talking to @hfr/studio-server.
 * Tabs: Editor (CodeMirror + live player), Timeline (drag/resize clips),
 * Media (uploads, probe, TTS, transcription), Validate (lint + inspect),
 * Render (jobs with live progress, outputs, share) and Registry.
 */
import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { html as htmlLang } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import '@hfr/player/element';
import type { HfPlayer } from '@hfr/player/element';

// ------------------------------------------------------------- helpers
type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown> & { class?: string; style?: string };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'class') e.className = String(v);
    else if (k in e && typeof v !== 'string') (e as unknown as Record<string, unknown>)[k] = v;
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return e;
}

async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  let body = init.body;
  if (init.json !== undefined) { headers['content-type'] = 'application/json'; body = JSON.stringify(init.json); }
  const res = await fetch(path, { ...init, headers, body });
  const text = await res.text();
  const data = text && (res.headers.get('content-type') ?? '').includes('json') ? JSON.parse(text) : text;
  if (!res.ok) throw new Error((data as { error?: string })?.error ?? (typeof data === 'string' ? data : res.statusText));
  return data as T;
}

function toast(msg: string, error = false) {
  let box = document.querySelector('.toast');
  if (!box) { box = el('div', { class: 'toast' }); document.body.append(box); }
  const t = el('div', { class: error ? 'err' : '' }, msg);
  box.append(t);
  setTimeout(() => t.remove(), error ? 8000 : 3500);
}

async function guard<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try { return await fn(); } catch (e) { toast((e as Error).message, true); return undefined; }
}

const fmtTime = (s: number | null) => (s === null || s === undefined ? '—' : `${s.toFixed(2)}s`);
const fmtSize = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

// --------------------------------------------------------------- types
interface ProjectSummary { id: string; name: string; scenes?: string[]; width?: number; height?: number; fps?: number; duration?: number | null; modified?: string; error?: string }
interface Asset { path: string; type: string | null; size: number; modified: number }
interface ProjectDetail extends ProjectSummary { manifest: Record<string, unknown>; files: Asset[] }
interface TimelineClip { id: string; autoId: boolean; name: string | null; kind: string; tag: string; src: string | null; raw: { start: string | null; duration: string | null; end: string | null; track: string | null }; enter: string | null; exit: string | null; start: number | null; end: number | null; duration: number | null; track: number; line: number | null }
interface Timeline { scene: string; scenes: string[]; config: { width: number; height: number; fps: number; duration: number | null }; error: string | null; clips: TimelineClip[] }
interface Job { id: string; projectId: string; status: string; output: string; progress: { phase: string; percent: number; frame?: number; totalFrames?: number; fps?: number; etaSeconds?: number } | null; error: string | null; result: { duration: number; size: number; width: number; height: number } | null; createdAt: string }
interface Template { name: string; title: string; description: string }
interface RegistryItem { name: string; type: string; title: string; description: string; tags?: string[]; params?: Record<string, { type: string; default: string | number | boolean; description?: string; options?: string[] }> }

const TABS = ['Editor', 'Timeline', 'Media', 'Validate', 'Render', 'Registry'] as const;
type Tab = (typeof TABS)[number];

const state = {
  projects: [] as ProjectSummary[],
  templates: [] as Template[],
  current: null as ProjectDetail | null,
  tab: 'Editor' as Tab,
  file: null as string | null,
  dirty: false,
  editor: null as EditorView | null,
  player: null as HfPlayer | null,
  timeline: null as Timeline | null,
  sceneIndex: 0,
  selectedClip: null as string | null,
  jobs: [] as Job[],
};

const app = document.getElementById('app')!;
const sidebar = el('aside', { class: 'sidebar' });
const main = el('section', { class: 'main' });
const tabsBar = el('nav', { class: 'tabs' });
const view = el('div', { class: 'view' });

// ------------------------------------------------------------- layout
function renderShell() {
  const sys = el('span', { class: 'muted', id: 'sys' });
  app.replaceChildren(el('div', { class: 'layout' },
    el('header', { class: 'topbar' }, el('div', { class: 'logo' }, el('b', {}, 'HyperFrames'), ' Studio'), el('span', { class: 'grow' }), sys),
    sidebar, main));
  main.replaceChildren(tabsBar, view);
  void api<{ ffmpeg: boolean }>('/api/system').then((s) => { sys.replaceChildren(el('span', { class: `status-dot ${s.ffmpeg ? 'ok' : 'bad'}` }), ` FFmpeg ${s.ffmpeg ? 'ready' : 'missing'}`); }).catch(() => {});
}

function renderSidebar() {
  const name = el('input', { placeholder: 'New project name' });
  const tpl = el('select', {}, ...state.templates.map((t) => el('option', { value: t.name, title: t.description }, t.title)));
  const create = el('button', {
    class: 'primary',
    onclick: () => guard(async () => {
      if (!name.value.trim()) throw new Error('enter a project name');
      const p = await api<ProjectSummary>('/api/projects', { method: 'POST', json: { name: name.value, template: tpl.value } });
      toast(`created ${p.name}`);
      await loadProjects();
      await openProject(p.id);
    }),
  }, 'Create');
  sidebar.replaceChildren(
    el('h3', {}, 'New project'), name, tpl, create,
    el('h3', {}, `Projects (${state.projects.length})`),
    ...state.projects.map((p) => el('div', { class: `project ${state.current?.id === p.id ? 'active' : ''}`, onclick: () => openProject(p.id) },
      p.name, el('small', {}, p.error ? `⚠ ${p.error}` : `${p.width}×${p.height} · ${p.fps}fps · ${p.duration ? `${p.duration}s` : 'auto'}`))),
  );
}

function renderTabs() {
  tabsBar.replaceChildren(...TABS.map((t) => el('button', { class: `tab ${state.tab === t ? 'active' : ''}`, onclick: () => { if (confirmLeave()) { state.tab = t; renderTabs(); renderView(); } } }, t)));
}

function confirmLeave(): boolean {
  return !state.dirty || confirm('Discard unsaved changes?');
}

async function loadProjects() {
  state.projects = await api<ProjectSummary[]>('/api/projects');
  renderSidebar();
}

async function openProject(id: string) {
  if (!confirmLeave()) return;
  state.current = await api<ProjectDetail>(`/api/projects/${id}`);
  state.file = state.current.scenes?.[0] ?? null;
  state.dirty = false;
  state.sceneIndex = 0;
  state.selectedClip = null;
  history.replaceState(null, '', `#${id}`);
  renderSidebar();
  renderTabs();
  renderView();
}

async function refreshProject() {
  if (!state.current) return;
  state.current = await api<ProjectDetail>(`/api/projects/${state.current.id}`);
}

function previewUrl(scene?: string) {
  const p = state.current!;
  return `/preview/${p.id}/${(scene ?? p.scenes?.[0] ?? 'index.html').split('/').map(encodeURIComponent).join('/')}`;
}

function makePlayer(scene?: string): HfPlayer {
  const p = el('hf-player', { controls: true, src: previewUrl(scene) }) as unknown as HfPlayer;
  state.player = p;
  return p;
}

function renderView() {
  state.editor?.destroy();
  state.editor = null;
  if (!state.current) {
    view.replaceChildren(el('div', { class: 'empty' }, 'Create or select a project on the left.'));
    return;
  }
  switch (state.tab) {
    case 'Editor': return renderEditor();
    case 'Timeline': return void renderTimeline();
    case 'Media': return void renderMedia();
    case 'Validate': return renderValidate();
    case 'Render': return void renderRender();
    case 'Registry': return void renderRegistry();
  }
}

// ------------------------------------------------------------- editor
const EDITABLE = /\.(html|css|js|mjs|json|md|txt|srt|vtt|svg)$/i;

function renderEditor() {
  const p = state.current!;
  const files = p.files.filter((f) => EDITABLE.test(f.path));
  const host = el('div', { class: 'cm-host' });
  const saveBtn = el('button', { class: 'primary', disabled: true }, 'Save');
  const title = el('span', { class: 'mono grow' });
  const scene = p.scenes?.includes(state.file ?? '') ? state.file! : p.scenes?.[0];
  const player = makePlayer(scene);
  const save = () => guard(async () => {
    if (!state.file || !state.editor) return;
    await api(`/api/projects/${p.id}/files?path=${encodeURIComponent(state.file)}`, { method: 'PUT', json: { content: state.editor.state.doc.toString() } });
    state.dirty = false;
    saveBtn.disabled = true;
    toast(`saved ${state.file}`);
    if (p.scenes?.includes(state.file)) { if (player.getAttribute('src') !== previewUrl(state.file)) player.setAttribute('src', previewUrl(state.file)); else player.reload(); }
    else player.reload();
  });
  saveBtn.onclick = () => void save();
  const openFile = async (f: string) => {
    if (!confirmLeave()) return;
    const data = await guard(() => api<{ content: string }>(`/api/projects/${p.id}/files?path=${encodeURIComponent(f)}`));
    if (!data) return;
    state.file = f;
    state.dirty = false;
    saveBtn.disabled = true;
    title.textContent = f;
    list.querySelectorAll('.file').forEach((x) => x.classList.toggle('active', x.textContent === f));
    state.editor?.destroy();
    state.editor = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: data.content,
        extensions: [
          basicSetup, htmlLang(), oneDark, EditorView.lineWrapping,
          keymap.of([{ key: 'Mod-s', preventDefault: true, run: () => { void save(); return true; } }]),
          EditorView.updateListener.of((u) => { if (u.docChanged) { state.dirty = true; saveBtn.disabled = false; } }),
        ],
      }),
    });
    if (p.scenes?.includes(f) && player.getAttribute('src') !== previewUrl(f)) player.setAttribute('src', previewUrl(f));
  };
  const list = el('div', { class: 'files panel' }, el('h3', {}, 'Files'), ...files.map((f) => el('div', { class: 'file', onclick: () => void openFile(f.path) }, f.path)));
  view.replaceChildren(el('div', { class: 'editor-grid' },
    list,
    el('div', { style: 'display:flex;flex-direction:column;gap:8px;min-height:0' }, el('div', { class: 'row' }, title, el('span', { class: 'muted' }, 'Ctrl/⌘+S'), saveBtn), host),
    el('div', { class: 'preview-col' }, player, el('div', { class: 'muted' }, 'Preview runs the same runtime as the renderer (virtual time, seeded randomness).')),
  ));
  if (state.file) void openFile(state.file);
}

// ----------------------------------------------------------- timeline
async function renderTimeline() {
  const p = state.current!;
  const tl = await guard(() => api<Timeline>(`/api/projects/${p.id}/timeline?scene=${state.sceneIndex}`));
  if (!tl) return;
  state.timeline = tl;
  const fps = tl.config.fps;
  const total = Math.max(tl.config.duration ?? 0, ...tl.clips.map((c) => c.end ?? 0), 1);
  const player = makePlayer(tl.scene);
  const sceneSel = el('select', { onchange: (e: Event) => { state.sceneIndex = Number((e.target as HTMLSelectElement).value); void renderTimeline(); } },
    ...tl.scenes.map((s, i) => el('option', { value: String(i), selected: i === state.sceneIndex }, s)));
  const zoomInput = el('input', { type: 'range', min: '20', max: '400', value: String(Number(localStorage.getItem('hfr-zoom') ?? 80)) });
  const container = el('div', { class: 'timeline panel' });
  const inspector = el('div', { class: 'panel' });
  const draw = () => {
    const pps = Number(zoomInput.value); // pixels per second
    try { localStorage.setItem('hfr-zoom', zoomInput.value); } catch { /* storage unavailable */ }
    const width = Math.ceil(total * pps) + 40;
    const ruler = el('div', { class: 'ruler', style: `width:${width}px`, onclick: (e: MouseEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); player.seek((e.clientX - r.left) / pps); } });
    const step = pps > 150 ? 0.5 : pps > 60 ? 1 : pps > 30 ? 2 : 5;
    for (let t = 0; t <= total + 1e-6; t += step) ruler.append(el('i', { style: `left:${t * pps}px` }), el('span', { style: `left:${t * pps}px` }, `${t}s`));
    const tracks = [...new Set(tl.clips.map((c) => c.track))].sort((a, b) => a - b);
    const rows = tracks.map((track) => {
      // stack overlapping clips of the same track into sub-rows so none is hidden
      const clips = tl.clips.filter((x) => x.track === track && x.start !== null && x.duration !== null).sort((a, b) => a.start! - b.start!);
      const laneEnds: number[] = [];
      const placed = clips.map((c) => {
        let row = laneEnds.findIndex((end) => end <= c.start! + 1e-6);
        if (row < 0) { row = laneEnds.length; laneEnds.push(0); }
        laneEnds[row] = c.end!;
        return { c, row };
      });
      const lane = el('div', { class: 'track-lane', style: `width:${width}px;height:${Math.max(1, laneEnds.length) * 32 + 4}px` });
      for (const { c, row } of placed) {
        const handle = el('span', { class: 'handle' });
        const box = el('div', { class: `clip k-${c.kind} ${state.selectedClip === c.id ? 'selected' : ''}`, title: `${c.id} · ${c.kind} · ${fmtTime(c.start)} → ${fmtTime(c.end)}${c.line ? ` · line ${c.line}` : ''}`, style: `top:${4 + row * 32}px;left:${c.start! * pps}px;width:${Math.max(6, c.duration! * pps)}px` }, c.name ?? c.id, handle);
        box.addEventListener('pointerdown', (e) => startDrag(e, c, box, pps, e.target === handle ? 'resize' : 'move'));
        box.addEventListener('click', () => { state.selectedClip = c.id; drawInspector(); container.querySelectorAll('.clip').forEach((x) => x.classList.toggle('selected', x === box)); });
        lane.append(box);
      }
      return el('div', { class: 'track' }, el('div', { class: 'track-label' }, `track ${track}`), lane);
    });
    const playhead = el('div', { class: 'playhead', style: 'left:140px' });
    container.replaceChildren(ruler, ...rows, playhead);
    player.addEventListener('timeupdate', (e) => { playhead.style.left = `${140 + (e as CustomEvent<{ time: number }>).detail.time * pps}px`; });
  };
  const snap = (t: number) => Math.round(t * fps) / fps;
  const startDrag = (e: PointerEvent, c: TimelineClip, box: HTMLElement, pps: number, mode: 'move' | 'resize') => {
    if (c.raw.start && !/^-?[\d.]+(s|ms|f)?$/.test(c.raw.start.trim()) && mode === 'move') { toast(`"${c.id}" starts relative to another clip (${c.raw.start}); edit it in the inspector`, true); return; }
    e.preventDefault();
    const x0 = e.clientX;
    const start0 = c.start!, dur0 = c.duration!;
    let start = start0, dur = dur0;
    box.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dt = (ev.clientX - x0) / pps;
      if (mode === 'move') { start = Math.max(0, snap(start0 + dt)); box.style.left = `${start * pps}px`; }
      else { dur = Math.max(1 / fps, snap(dur0 + dt)); box.style.width = `${dur * pps}px`; }
    };
    const up = () => {
      box.removeEventListener('pointermove', move);
      box.removeEventListener('pointerup', up);
      if (start === start0 && dur === dur0) return;
      const changes: Record<string, string | null> = mode === 'move' ? { 'data-start': String(+start.toFixed(4)) } : { 'data-duration': String(+dur.toFixed(4)), 'data-end': null };
      void patchClip(c.id, changes);
    };
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerup', up);
  };
  const patchClip = (clipId: string, changes: Record<string, string | null>) => guard(async () => {
    await api(`/api/projects/${p.id}/clips`, { method: 'PATCH', json: { file: tl.scene, clipId, changes } });
    toast(`updated ${clipId}`);
    await renderTimeline();
  });
  const drawInspector = () => {
    const c = tl.clips.find((x) => x.id === state.selectedClip);
    if (!c) { inspector.replaceChildren(el('div', { class: 'muted' }, 'Select a clip to edit its timing and transitions. Drag clips to move them, drag the right edge to change duration (snaps to frames).')); return; }
    const fields: Array<[string, string, string | null]> = [
      ['data-start', 'start', c.raw.start], ['data-duration', 'duration', c.raw.duration], ['data-end', 'end', c.raw.end],
      ['data-track', 'track', c.raw.track], ['data-enter', 'enter preset', c.enter], ['data-exit', 'exit preset', c.exit],
    ];
    const inputs = fields.map(([attr, label, value]) => [attr, el('input', { value: value ?? '', placeholder: label === 'start' ? '0 | 1.5s | 45f | intro.end + 0.2' : label.includes('preset') ? 'fade-up 0.6 out-cubic' : '' })] as const);
    inspector.replaceChildren(
      el('h2', {}, `${c.name ?? c.id} `, el('span', { class: 'tag' }, c.kind), c.autoId ? el('span', { class: 'tag', title: 'no id attribute: edits target it by position' }, 'auto id') : null),
      el('div', { class: 'muted' }, `resolved: ${fmtTime(c.start)} → ${fmtTime(c.end)} (${fmtTime(c.duration)})${c.src ? ` · ${c.src}` : ''}${c.line ? ` · line ${c.line}` : ''}`),
      el('div', { class: 'inspector-grid', style: 'margin-top:10px' }, ...inputs.map(([attr, input], i) => el('label', {}, fields[i]![1], input))),
      el('div', { class: 'row', style: 'margin-top:10px' },
        el('button', { class: 'primary', onclick: () => void patchClip(c.id, Object.fromEntries(inputs.map(([a, i]) => [a, i.value.trim() === '' ? null : i.value.trim()]))) }, 'Apply'),
        el('button', { onclick: () => player.seek(c.start ?? 0) }, 'Seek to clip')),
    );
  };
  zoomInput.oninput = draw;
  view.replaceChildren(
    el('div', { class: 'row', style: 'margin-bottom:10px' }, el('b', {}, 'Scene'), sceneSel, el('span', { class: 'muted' }, `${tl.config.width}×${tl.config.height} · ${fps} fps · ${fmtTime(tl.config.duration)}`), el('span', { class: 'grow' }), 'zoom', zoomInput),
    tl.error ? el('div', { class: 'issue error' }, tl.error) : '',
    el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,36%);gap:12px;align-items:start' },
      el('div', { style: 'display:grid;gap:12px;min-width:0' }, el('div', { style: 'overflow:auto' }, container), inspector),
      player),
  );
  draw();
  drawInspector();
}

// -------------------------------------------------------------- media
async function renderMedia() {
  const p = state.current!;
  await refreshProject();
  const files = state.current!.files;
  const info = el('pre', { class: 'mono panel', style: 'white-space:pre-wrap;max-height:260px;overflow:auto;display:none' });
  const drop = el('div', { class: 'dropzone' }, 'Drop images, video, audio, fonts, Lottie JSON or captions here — or ', el('input', { type: 'file', multiple: true, onchange: (e: Event) => void upload([...((e.target as HTMLInputElement).files ?? [])]) }));
  const bar = el('div', { class: 'progress', style: 'display:none;margin-top:8px' }, el('div', { style: 'width:0%' }));
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); void upload([...(e.dataTransfer?.files ?? [])]); });
  const upload = async (list: File[]) => {
    for (const f of list) {
      bar.style.display = '';
      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/projects/${p.id}/media?name=${encodeURIComponent(f.name)}`);
        xhr.upload.onprogress = (e) => { (bar.firstElementChild as HTMLElement).style.width = `${(e.loaded / e.total) * 100}%`; };
        xhr.onload = () => { if (xhr.status >= 300) toast(JSON.parse(xhr.responseText || '{}').error ?? `upload failed (${xhr.status})`, true); else toast(`uploaded ${f.name}`); resolve(); };
        xhr.onerror = () => { toast(`upload failed: ${f.name}`, true); resolve(); };
        xhr.send(f);
      });
    }
    bar.style.display = 'none';
    void renderMedia();
  };
  const snippet = (f: Asset) => {
    switch (f.type) {
      case 'image': return `<img src="${f.path}" data-start="0" data-duration="3" data-enter="fade 0.5" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;
      case 'video': return `<video src="${f.path}" data-start="0" muted style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>`;
      case 'audio': return `<audio src="${f.path}" data-start="0" data-volume="0.8"></audio>`;
      case 'captions': return `<div data-hf-captions="${f.path}" data-style="karaoke"></div>`;
      case 'font': return `@font-face{font-family:"${f.path.split('/').pop()!.replace(/\.[^.]+$/, '')}";src:url("${f.path}")}`;
      default: return f.path.endsWith('.json') ? `<div data-hf-lottie="${f.path}" data-start="0" style="width:400px;height:400px"></div>` : f.path;
    }
  };
  const rows = files.map((f) => el('tr', {},
    el('td', { class: 'mono' }, f.path), el('td', {}, f.type ?? '—'), el('td', {}, fmtSize(f.size)),
    el('td', { class: 'row' },
      ['image', 'video', 'audio'].includes(f.type ?? '') ? el('button', { onclick: () => guard(async () => { info.style.display = ''; info.textContent = JSON.stringify(await api(`/api/projects/${p.id}/media/probe?path=${encodeURIComponent(f.path)}`), null, 2); }) }, 'Probe') : null,
      el('button', { onclick: () => guard(async () => { await navigator.clipboard.writeText(snippet(f)); toast('HTML snippet copied'); }) }, 'Copy snippet'),
      f.type === 'audio' ? el('button', { onclick: () => guard(async () => { const r = await api<{ captions: string; provider: string }>(`/api/projects/${p.id}/transcribe`, { method: 'POST', json: { path: f.path } }); toast(`captions → ${r.captions} (${r.provider})`); void renderMedia(); }) }, 'Transcribe') : null,
      f.path === 'hyperframes.json' ? null : el('button', { class: 'danger', onclick: () => guard(async () => { if (!confirm(`Delete ${f.path}?`)) return; await api(`/api/projects/${p.id}/media?path=${encodeURIComponent(f.path)}`, { method: 'DELETE' }); void renderMedia(); }) }, 'Delete'))));
  // TTS
  const ttsText = el('textarea', { rows: 3, placeholder: 'Narration text…', style: 'width:100%' });
  const ttsProvider = el('select', {}, ...['', 'espeak', 'elevenlabs', 'openai', 'command'].map((v) => el('option', { value: v }, v || 'auto')));
  const ttsVoice = el('input', { placeholder: 'voice (e.g. pt-br, alloy, voice id)' });
  const ttsLang = el('input', { placeholder: 'language (e.g. pt-BR)' });
  const ttsBtn = el('button', { class: 'primary', onclick: () => guard(async () => {
    ttsBtn.disabled = true;
    try {
      const r = await api<{ audio: string; captions: string; duration: number; provider: string; timing: string }>(`/api/projects/${p.id}/tts`, { method: 'POST', json: { text: ttsText.value, provider: ttsProvider.value || undefined, voice: ttsVoice.value || undefined, language: ttsLang.value || undefined } });
      toast(`${r.audio} (${r.duration.toFixed(1)}s, ${r.provider}, timings: ${r.timing})\n${r.captions}`);
      void renderMedia();
    } finally { ttsBtn.disabled = false; }
  }) }, 'Generate narration + captions');
  view.replaceChildren(
    el('div', { style: 'display:grid;gap:12px' },
      el('div', { class: 'panel' }, el('h2', {}, 'Upload'), drop, bar),
      el('div', { class: 'panel' }, el('h2', {}, `Assets (${files.length})`), el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, 'path'), el('th', {}, 'type'), el('th', {}, 'size'), el('th', {}, ''))), el('tbody', {}, ...rows)), info),
      el('div', { class: 'panel' }, el('h2', {}, 'Text to speech'), ttsText, el('div', { class: 'row', style: 'margin-top:8px' }, ttsProvider, ttsVoice, ttsLang, ttsBtn),
        el('div', { class: 'muted', style: 'margin-top:6px' }, 'Creates assets/narration-*.mp3 and a word-timed captions JSON (use it with data-hf-captions).'))),
  );
}

// ----------------------------------------------------------- validate
function renderValidate() {
  const p = state.current!;
  const out = el('div', {});
  const lintBtn = el('button', { class: 'primary', onclick: () => guard(async () => {
    out.replaceChildren(el('div', { class: 'muted' }, 'linting…'));
    const r = await api<{ issues: Array<{ rule: string; severity: string; message: string; file: string; line?: number; fix?: string }>; counts: Record<string, number> }>(`/api/projects/${p.id}/lint`, { method: 'POST', json: {} });
    out.replaceChildren(el('h2', {}, `Lint: ${r.counts.error} error(s), ${r.counts.warning} warning(s), ${r.counts.info} info`),
      ...(r.issues.length ? r.issues.map((i) => el('div', { class: `issue ${i.severity}` }, el('b', {}, `${i.file}${i.line ? `:${i.line}` : ''} `), i.message, ' ', el('code', { class: 'muted' }, i.rule), i.fix ? el('div', { class: 'muted' }, `fix: ${i.fix}`) : null)) : [el('div', { class: 'issue info' }, '✓ no issues')]));
  }) }, 'Run lint');
  const inspectBtn = el('button', { onclick: () => guard(async () => {
    out.replaceChildren(el('div', { class: 'muted' }, 'rendering sample frames in headless Chromium…'));
    const r = await api<{ text: string; counts: Record<string, number> }>(`/api/projects/${p.id}/inspect`, { method: 'POST', json: { samples: 6 } });
    out.replaceChildren(el('h2', {}, `Inspect: ${r.counts.error} error(s), ${r.counts.warning} warning(s)`), el('pre', { class: 'mono panel', style: 'white-space:pre-wrap' }, r.text));
  }) }, 'Run inspector');
  view.replaceChildren(el('div', { class: 'row', style: 'margin-bottom:12px' }, lintBtn, inspectBtn, el('span', { class: 'muted' }, 'Lint is static (HTML/CSS/JS/timing/assets/media); the inspector loads the composition and checks runtime errors, fonts, blank frames and determinism.')), out);
}

// ------------------------------------------------------------- render
let jobStreams = new Map<string, EventSource>();

async function renderRender() {
  const p = state.current!;
  const format = el('select', {}, ...['mp4', 'webm', 'mov', 'gif'].map((f) => el('option', { value: f }, f.toUpperCase())));
  const quality = el('select', {}, ...['draft', 'standard', 'high'].map((q) => el('option', { value: q, selected: q === 'standard' }, q)));
  const resolution = el('select', {}, el('option', { value: '' }, 'composition size'), ...['720p', '1080p', '1440p', '4k', 'vertical-1080', 'square-1080'].map((r) => el('option', { value: r }, r)));
  const fps = el('input', { type: 'number', min: '1', max: '120', placeholder: 'fps (auto)', style: 'width:110px' });
  const workers = el('input', { type: 'number', min: '1', max: '16', placeholder: 'workers (auto)', style: 'width:130px' });
  const jobsBox = el('div', { style: 'display:grid;gap:8px' });
  const outputs = el('div', {});
  const start = el('button', { class: 'primary', onclick: () => guard(async () => {
    const job = await api<Job>(`/api/projects/${p.id}/renders`, { method: 'POST', json: { format: format.value, quality: quality.value, resolution: resolution.value || undefined, fps: fps.value ? Number(fps.value) : undefined, workers: workers.value ? Number(workers.value) : undefined } });
    toast('render queued');
    watchJob(job);
  }) }, 'Render');
  const drawJob = (j: Job) => {
    const id = `job-${j.id}`;
    let box = document.getElementById(id);
    if (!box) { box = el('div', { id, class: 'panel' }); jobsBox.prepend(box); }
    const pct = j.status === 'done' ? 100 : j.progress?.percent ?? 0;
    box.replaceChildren(
      el('div', { class: 'row' }, el('b', {}, j.output), el('span', { class: 'tag' }, j.status), el('span', { class: 'grow' }),
        j.status === 'running' || j.status === 'queued' ? el('button', { class: 'danger', onclick: () => guard(() => api(`/api/renders/${j.id}/cancel`, { method: 'POST', json: {} })) }, 'Cancel') : null),
      el('div', { class: 'progress', style: 'margin:8px 0' }, el('div', { style: `width:${pct}%` })),
      el('div', { class: 'muted' }, j.error ? `✗ ${j.error}` : j.result ? `✓ ${j.result.width}×${j.result.height} · ${j.result.duration.toFixed(2)}s · ${fmtSize(j.result.size)}` : j.progress ? `${j.progress.phase} ${j.progress.frame ?? ''}${j.progress.totalFrames ? `/${j.progress.totalFrames}` : ''} ${j.progress.fps ? `· ${j.progress.fps} fps` : ''} ${j.progress.etaSeconds !== undefined ? `· eta ${j.progress.etaSeconds}s` : ''}` : 'waiting…'),
    );
    if (j.status === 'done') void drawOutputs();
  };
  const watchJob = (j: Job) => {
    drawJob(j);
    if (jobStreams.has(j.id) || ['done', 'failed', 'cancelled'].includes(j.status)) return;
    const es = new EventSource(`/api/renders/${j.id}/events`);
    jobStreams.set(j.id, es);
    es.addEventListener('update', (e) => {
      const job = JSON.parse((e as MessageEvent).data) as Job;
      drawJob(job);
      if (['done', 'failed', 'cancelled'].includes(job.status)) { es.close(); jobStreams.delete(job.id); }
    });
  };
  const drawOutputs = async () => {
    const list = await api<Array<{ file: string; size: number; modified: string; url: string }>>(`/api/projects/${p.id}/outputs`);
    outputs.replaceChildren(el('h2', {}, `Outputs (${list.length})`), ...list.map((o) => el('div', { class: 'card', style: 'margin-bottom:10px' },
      o.file.endsWith('.gif') ? el('img', { src: o.url, style: 'max-width:100%' }) : el('video', { class: 'output', src: o.url, controls: true, preload: 'metadata' }),
      el('div', { class: 'row' }, el('span', { class: 'mono grow' }, `${o.file} · ${fmtSize(o.size)}`),
        el('a', { href: `${o.url}?download=1` }, el('button', {}, 'Download')),
        el('button', { onclick: () => guard(async () => { const r = await api<{ url: string }>(`/api/projects/${p.id}/share`, { method: 'POST', json: { file: o.file, includeProject: true } }); toast('share page created'); window.open(r.url, '_blank'); }) }, 'Share page')))));
  };
  view.replaceChildren(el('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:start' },
    el('div', { style: 'display:grid;gap:12px' },
      el('div', { class: 'panel' }, el('h2', {}, 'Render settings'), el('div', { class: 'row' }, format, quality, resolution, fps, workers, start),
        el('div', { class: 'muted', style: 'margin-top:8px' }, 'Frames are captured in headless Chromium and encoded with FFmpeg (H.264/AAC, VP9/Opus, ProRes 422 HQ or GIF). Lint errors do not block Studio renders; check the Validate tab.')),
      jobsBox),
    el('div', { class: 'panel' }, outputs)));
  state.jobs = (await api<Job[]>('/api/renders')).filter((j) => j.projectId === p.id);
  for (const j of state.jobs.slice().reverse()) watchJob(j);
  await drawOutputs();
}

// ----------------------------------------------------------- registry
async function renderRegistry() {
  const p = state.current!;
  const items = await api<RegistryItem[]>('/api/registry');
  const search = el('input', { placeholder: 'Search components…', style: 'width:280px' });
  const grid = el('div', { class: 'cards' });
  const draw = () => {
    const q = search.value.toLowerCase();
    grid.replaceChildren(...items.filter((i) => !q || `${i.name} ${i.title} ${i.description} ${(i.tags ?? []).join(' ')}`.toLowerCase().includes(q)).map((i) => {
      const inputs = Object.entries(i.params ?? {}).map(([k, d]) => [k, d.options ? el('select', {}, ...d.options.map((o) => el('option', { value: o, selected: o === String(d.default) }, o))) : el('input', { value: String(d.default), title: d.description ?? '' })] as const);
      const target = el('select', {}, ...(p.scenes ?? []).map((s) => el('option', { value: s }, s)));
      return el('div', { class: 'card' },
        el('div', { class: 'row' }, el('b', { class: 'grow' }, i.title), el('span', { class: 'tag' }, i.type)),
        el('div', { class: 'muted' }, i.description), el('div', {}, ...(i.tags ?? []).map((t) => el('span', { class: 'tag' }, t))),
        ...inputs.map(([k, inp]) => el('label', {}, k, inp)),
        el('div', { class: 'row' }, target, el('button', { class: 'primary', onclick: () => guard(async () => {
          const r = await api<{ file: string; copied: string[] }>(`/api/projects/${p.id}/registry`, { method: 'POST', json: { item: i.name, file: target.value, params: Object.fromEntries(inputs.map(([k, inp]) => [k, inp.value])) } });
          toast(`added ${i.name} to ${r.file}${r.copied.length ? ` (+${r.copied.length} file)` : ''}`);
          await refreshProject();
        }) }, 'Add')));
    }));
  };
  search.oninput = draw;
  view.replaceChildren(el('div', { class: 'row', style: 'margin-bottom:12px' }, search, el('span', { class: 'muted' }, `${items.length} blocks · inserted at the end of the composition root; required libraries are added to <head>`)), grid);
  draw();
}

// --------------------------------------------------------------- boot
window.addEventListener('beforeunload', (e) => { if (state.dirty) e.preventDefault(); });

async function boot() {
  renderShell();
  renderTabs();
  try {
    state.templates = await api<Template[]>('/api/templates');
    await loadProjects();
    const id = location.hash.slice(1);
    if (id && state.projects.some((p) => p.id === id)) await openProject(id);
    else renderView();
  } catch (e) {
    view.replaceChildren(el('div', { class: 'empty' }, `Cannot reach the Studio API: ${(e as Error).message}`));
  }
}

void boot();
