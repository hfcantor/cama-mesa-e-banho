/** FFprobe wrapper with a normalised result. */
import { stat } from 'node:fs/promises';
import { FFPROBE, run } from './exec.ts';

export interface VideoStreamInfo {
  codec: string;
  width: number;
  height: number;
  fps: number | null;
  frames: number | null;
  pixFmt: string | null;
  hasAlpha: boolean;
  rotation: number;
}

export interface AudioStreamInfo {
  codec: string;
  sampleRate: number;
  channels: number;
}

export interface MediaInfo {
  file: string;
  size: number;
  format: string;
  duration: number | null;
  bitRate: number | null;
  video: VideoStreamInfo | null;
  audio: AudioStreamInfo | null;
  /** still image (single frame, image codec) */
  isImage: boolean;
  subtitles: number;
  tags: Record<string, string>;
}

function rate(r: string | undefined): number | null {
  if (!r || r === '0/0') return null;
  const [a, b] = r.split('/').map(Number);
  if (!a || !b) return null;
  return a / b;
}

const IMAGE_CODECS = new Set(['png', 'mjpeg', 'webp', 'gif', 'bmp', 'tiff', 'jpegls', 'svg', 'avif']);

interface ProbeStream {
  codec_type: string; codec_name: string; width?: number; height?: number; avg_frame_rate?: string; r_frame_rate?: string;
  nb_frames?: string; pix_fmt?: string; sample_rate?: string; channels?: number; duration?: string;
  side_data_list?: Array<{ rotation?: number }>; tags?: Record<string, string>; disposition?: Record<string, number>;
}

const cache = new Map<string, { mtime: number; info: MediaInfo }>();

export async function probe(file: string): Promise<MediaInfo> {
  const st = await stat(file);
  const hit = cache.get(file);
  if (hit && hit.mtime === st.mtimeMs) return hit.info;
  const { stdout } = await run(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]);
  const data = JSON.parse(stdout) as { format?: { format_name?: string; duration?: string; bit_rate?: string; tags?: Record<string, string> }; streams?: ProbeStream[] };
  const streams = data.streams ?? [];
  const v = streams.find((s) => s.codec_type === 'video' && !s.disposition?.attached_pic);
  const a = streams.find((s) => s.codec_type === 'audio');
  const fmt = data.format ?? {};
  const isImage = !!v && IMAGE_CODECS.has(v.codec_name) && (!fmt.duration || Number(fmt.duration) < 0.05 || /image2|_pipe|png|webp/.test(fmt.format_name ?? '')) && !a;
  const duration = fmt.duration ? Number(fmt.duration) : v?.duration ? Number(v.duration) : null;
  const info: MediaInfo = {
    file,
    size: st.size,
    format: fmt.format_name ?? 'unknown',
    duration: isImage ? null : duration,
    bitRate: fmt.bit_rate ? Number(fmt.bit_rate) : null,
    video: v
      ? {
          codec: v.codec_name,
          width: v.width ?? 0,
          height: v.height ?? 0,
          fps: rate(v.avg_frame_rate) ?? rate(v.r_frame_rate),
          frames: v.nb_frames ? Number(v.nb_frames) : null,
          pixFmt: v.pix_fmt ?? null,
          hasAlpha: /yuva|rgba|argb|bgra|abgr|ya8|gbrap/.test(v.pix_fmt ?? '') || v.tags?.alpha_mode === '1',
          rotation: v.side_data_list?.find((s) => typeof s.rotation === 'number')?.rotation ?? Number(v.tags?.rotate ?? 0),
        }
      : null,
    audio: a ? { codec: a.codec_name, sampleRate: Number(a.sample_rate ?? 0), channels: a.channels ?? 0 } : null,
    isImage,
    subtitles: streams.filter((s) => s.codec_type === 'subtitle').length,
    tags: fmt.tags ?? {},
  };
  cache.set(file, { mtime: st.mtimeMs, info });
  return info;
}
