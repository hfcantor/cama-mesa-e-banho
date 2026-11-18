// Exportação quadro a quadro em MP4 (WebCodecs + mp4-muxer).
// Cada quadro é renderizado no instante exato (30 qps) e o áudio vem da
// mixagem offline. O resultado não depende da velocidade do aparelho:
// vídeo liso, duração completa e áudio sempre presente.
import { Muxer, ArrayBufferTarget } from '../../vendor/mp4-muxer.mjs';
import { Player } from './player.js';

const FPS = 30;
const SR = 48000;

export function canExportMp4() {
  return typeof window.VideoEncoder === 'function' && typeof window.VideoFrame === 'function';
}

async function pickVideo(w, h) {
  const opts = [
    ['avc', 'avc1.640028'], ['avc', 'avc1.4d0028'], ['avc', 'avc1.42002a'],
    ['vp9', 'vp09.00.40.08'], ['av1', 'av01.0.08M.08'],
  ];
  for (const [mux, codec] of opts) {
    const cfg = { codec, width: w, height: h, bitrate: 10_000_000, framerate: FPS, latencyMode: 'quality' };
    if (mux === 'avc') cfg.avc = { format: 'avc' };
    try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) return { mux, cfg }; } catch { /* tenta o próximo */ }
  }
  return null;
}

async function pickAudio() {
  if (typeof window.AudioEncoder !== 'function') return null;
  for (const [mux, codec] of [['aac', 'mp4a.40.2'], ['opus', 'opus']]) {
    const cfg = { codec, sampleRate: SR, numberOfChannels: 2, bitrate: 192_000 };
    try { if ((await AudioEncoder.isConfigSupported(cfg)).supported) return { mux, cfg }; } catch { /* */ }
  }
  return null;
}

/**
 * @param app       estado global (stage, director, timeline, music)
 * @param onProgress (fração 0..1, texto)
 * @param isCancelled () => boolean
 * @returns { blob, video: codec, audio: codec|null }
 */
export async function exportMp4(app, onProgress, isCancelled = () => false) {
  const { stage, director, timeline: tl } = app;
  const W = stage.out.width, H = stage.out.height;
  const v = await pickVideo(W, H);
  if (!v) throw new Error('Este navegador não tem codificador de vídeo compatível (use Chrome ou Edge atualizados).');
  const a = await pickAudio();

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: v.mux, width: W, height: H, frameRate: FPS },
    audio: a ? { codec: a.mux, numberOfChannels: 2, sampleRate: SR } : undefined,
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  });
  let err = null;
  const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { err = e; } });
  venc.configure(v.cfg);

  // 1) áudio: mixagem completa offline (narração + trilha + efeitos)
  onProgress(0, 'Mixando o áudio…');
  if (a) {
    const buf = await Player.renderOffline(tl, app.music, SR);
    const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { err = e; } });
    aenc.configure(a.cfg);
    const L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
    const total = Math.min(buf.length, Math.ceil(tl.duration * SR));
    const N = 1024;
    for (let i = 0; i < total; i += N) {
      const n = Math.min(N, total - i);
      const data = new Float32Array(n * 2);
      data.set(L.subarray(i, i + n), 0); data.set(R.subarray(i, i + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / SR) * 1e6), data });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush(); aenc.close();
  }

  // 2) vídeo: renderiza cada quadro no tempo exato
  const prevQ = stage.quality, prevBloom = stage.bloomOn;
  stage.setQuality(1);
  stage.bloomOn = stage.bloomWanted;
  stage.exporting = true;
  director.invalidate();
  const frames = Math.ceil(tl.duration * FPS);
  const t0 = performance.now();
  try {
    for (let i = 0; i < frames; i++) {
      if (isCancelled()) throw new Error('cancelado');
      if (err) throw err;
      const t = i / FPS;
      director.frame(t, i === 0 ? 0 : 1 / FPS);
      const vf = new VideoFrame(stage.out, { timestamp: Math.round(t * 1e6), duration: Math.round(1e6 / FPS) });
      venc.encode(vf, { keyFrame: i % (FPS * 2) === 0 });
      vf.close();
      while (venc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4));
      if (i % 5 === 0) {
        const el = (performance.now() - t0) / 1000, k = (i + 1) / frames;
        const rest = el / k - el;
        onProgress(0.03 + 0.95 * k, `Renderizando quadro ${i + 1} de ${frames} — faltam ~${Math.ceil(rest)} s`);
        await new Promise(r => setTimeout(r, 0));
      }
    }
    onProgress(0.99, 'Finalizando o arquivo…');
    await venc.flush();
    if (err) throw err;
  } finally {
    venc.state !== 'closed' && venc.close();
    stage.exporting = false;
    stage.setQuality(prevQ);
    stage.bloomOn = prevBloom;
    director.invalidate();
  }
  muxer.finalize();
  return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), video: v.cfg.codec, audio: a ? a.cfg.codec : null, frames };
}
