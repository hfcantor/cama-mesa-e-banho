/**
 * Browser build (served at /__hf/lib/shader-transitions.js).
 *
 *   <canvas data-hf-shader="ripple" data-from="#imgA" data-to="#videoB"
 *           data-start="3" data-duration="1.2" data-ease="in-out-cubic"></canvas>
 *
 * The canvas is a timed clip; progress follows the composition time through
 * window.hf.onFrame, so the transition is deterministic in renders. Sources
 * can be <img>, <video>, <canvas> or a frame <img> injected by the runtime.
 */
import { GLSL_TRANSITIONS, VERTEX_SHADER, fragmentShader } from './glsl.ts';

type Source = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

export interface ShaderTransition {
  render(progress: number): void;
  dispose(): void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`shader compile error: ${gl.getShaderInfoLog(sh)}`);
  return sh;
}

export function createShaderTransition(canvas: HTMLCanvasElement, from: () => Source, to: () => Source, name: string): ShaderTransition {
  const body = GLSL_TRANSITIONS[name];
  if (!body) throw new Error(`unknown shader transition "${name}". Available: ${Object.keys(GLSL_TRANSITIONS).join(', ')}`);
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL is not available');
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragmentShader(body)));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`shader link error: ${gl.getProgramInfoLog(prog)}`);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const textures = [gl.createTexture()!, gl.createTexture()!];
  for (const t of textures) {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  const upload = (unit: number, src: Source) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, textures[unit]!);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  };
  return {
    render(progress: number) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      upload(0, from());
      upload(1, to());
      gl.uniform1i(gl.getUniformLocation(prog, 'from'), 0);
      gl.uniform1i(gl.getUniformLocation(prog, 'to'), 1);
      gl.uniform1f(gl.getUniformLocation(prog, 'progress'), Math.max(0, Math.min(1, progress)));
      gl.uniform1f(gl.getUniformLocation(prog, 'ratio'), canvas.width / canvas.height);
      const loc = gl.getAttribLocation(prog, 'pos');
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteProgram(prog);
    },
  };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface HfLike { onFrame(cb: (t: number) => void): void; describe(): { clips: Array<{ id: string; start: number; duration: number }> }; ready: Promise<void> }

/** Resolves a selector to the element actually displaying pixels (video → runtime frame <img>). */
function sourceFor(sel: string): () => Source {
  return () => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`shader transition source ${sel} not found`);
    if (el instanceof HTMLVideoElement && el.style.display === 'none') {
      const img = el.nextElementSibling;
      if (img instanceof HTMLImageElement && img.hasAttribute('data-hf-video-frame')) return img;
    }
    return el as Source;
  };
}

function autoBind() {
  const hf = (window as unknown as { hf?: HfLike }).hf;
  if (!hf) return;
  void hf.ready.then(() => {
    const clips = hf.describe().clips;
    document.querySelectorAll<HTMLCanvasElement>('canvas[data-hf-shader]').forEach((canvas, i) => {
      const d = canvas.dataset;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width) || 1280;
      canvas.height = Math.round(rect.height) || 720;
      const clip = clips.find((c) => c.id === (canvas.id || '')) ?? null;
      const start = clip?.start ?? Number(d.start ?? 0);
      const duration = clip?.duration ?? Number(d.duration ?? 1);
      try {
        const tr = createShaderTransition(canvas, sourceFor(d.from!), sourceFor(d.to!), d.hfShader || 'fade');
        hf.onFrame((t) => {
          if (t < start || t >= start + duration) return;
          const p = (t - start) / Math.max(1e-6, duration);
          tr.render(d.ease === 'linear' ? p : easeInOut(p));
        });
      } catch (e) {
        console.error(`[shader ${i}]`, e);
      }
    });
  });
}

(window as unknown as { HFShaderTransitions: unknown }).HFShaderTransitions = { createShaderTransition, transitions: Object.keys(GLSL_TRANSITIONS) };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoBind);
else autoBind();
