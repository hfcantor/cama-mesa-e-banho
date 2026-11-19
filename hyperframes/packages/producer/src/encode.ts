/** FFmpeg encoding settings per output format. */

export type OutputFormat = 'mp4' | 'webm' | 'mov' | 'gif';
export type Quality = 'draft' | 'standard' | 'high';

export interface EncodeSettings {
  video: string[];
  audio: string[] | null; // null = no audio stream for this format
  container: string[];
}

const CRF: Record<Quality, { h264: number; vp9: number; preset: string }> = {
  draft: { h264: 28, vp9: 40, preset: 'veryfast' },
  standard: { h264: 20, vp9: 32, preset: 'medium' },
  high: { h264: 16, vp9: 24, preset: 'slow' },
};

export function encodeSettings(format: OutputFormat, quality: Quality, o: { crf?: number; fps: number }): EncodeSettings {
  const q = CRF[quality];
  switch (format) {
    case 'mp4':
      return {
        video: ['-c:v', 'libx264', '-preset', q.preset, '-crf', String(o.crf ?? q.h264), '-pix_fmt', 'yuv420p', '-r', String(o.fps)],
        audio: ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000'],
        container: ['-movflags', '+faststart'],
      };
    case 'webm':
      return {
        video: ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(o.crf ?? q.vp9), '-row-mt', '1', '-deadline', quality === 'draft' ? 'realtime' : 'good', '-cpu-used', quality === 'high' ? '1' : '4', '-pix_fmt', 'yuv420p', '-r', String(o.fps)],
        audio: ['-c:a', 'libopus', '-b:a', '160k', '-ar', '48000'],
        container: [],
      };
    case 'mov':
      return {
        video: ['-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', '-vendor', 'apl0', '-r', String(o.fps)],
        audio: ['-c:a', 'pcm_s16le', '-ar', '48000'],
        container: [],
      };
    case 'gif':
      return { video: [], audio: null, container: ['-loop', '0'] };
  }
}

/** Intermediate ("mezzanine") encode used for segments/scenes before the final pass. */
export const MEZZANINE = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p'];

export function formatFromPath(file: string): OutputFormat | null {
  const ext = file.toLowerCase().split('.').pop();
  return ext === 'mp4' || ext === 'webm' || ext === 'mov' || ext === 'gif' ? ext : null;
}
