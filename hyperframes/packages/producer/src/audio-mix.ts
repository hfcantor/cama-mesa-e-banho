/**
 * Builds the FFmpeg audio graph that mixes every audio source of a render:
 * <audio> clips, un-muted <video> clips and manifest-level tracks (music,
 * narration, SFX) with trims, offsets, volume, fades, loops and ducking.
 */

export interface MixTrack {
  id: string;
  file: string; // absolute path
  /** Start on the output timeline (s). */
  start: number;
  /** Length on the output timeline (s). */
  duration: number;
  mediaStart: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
  role?: 'music' | 'narration' | 'sfx';
  /** Duck this track while tracks of the given role play. */
  duckUnder?: string;
}

export interface MixGraph {
  inputs: string[]; // ffmpeg input args
  filter: string;
  outLabel: string;
}

const f = (n: number) => Number(n.toFixed(6)).toString();

/**
 * @param firstInputIndex index of the first audio input in the final ffmpeg command
 */
export function buildAudioMix(tracks: MixTrack[], total: number, firstInputIndex: number): MixGraph | null {
  const usable = tracks.filter((t) => t.duration > 0 && t.start < total && t.volume > 0);
  if (!usable.length) return null;
  const inputs: string[] = [];
  const chains: string[] = [];
  const labels: Array<{ label: string; t: MixTrack }> = [];
  usable.forEach((t, i) => {
    if (t.loop) inputs.push('-stream_loop', '-1');
    inputs.push('-i', t.file);
    const k = firstInputIndex + i;
    const dur = Math.min(t.duration, total - t.start);
    const parts = [
      `aresample=48000`,
      `aformat=sample_fmts=fltp:channel_layouts=stereo`,
      `atrim=start=${f(t.mediaStart)}:duration=${f(dur)}`,
      `asetpts=PTS-STARTPTS`,
      `volume=${f(t.volume)}`,
    ];
    if (t.fadeIn > 0) parts.push(`afade=t=in:st=0:d=${f(Math.min(t.fadeIn, dur))}`);
    if (t.fadeOut > 0) parts.push(`afade=t=out:st=${f(Math.max(0, dur - t.fadeOut))}:d=${f(Math.min(t.fadeOut, dur))}`);
    const delay = Math.round(t.start * 1000);
    if (delay > 0) parts.push(`adelay=${delay}:all=1`);
    const label = `a${i}`;
    chains.push(`[${k}:a]${parts.join(',')}[${label}]`);
    labels.push({ label, t });
  });

  // Ducking: tracks with duckUnder=<role> are compressed by a sidechain made of that role's tracks.
  const ducked = labels.filter((l) => l.t.duckUnder);
  const finalLabels: string[] = [];
  const consumedBySidechain = new Map<string, string[]>(); // role -> copies
  for (const role of new Set(ducked.map((d) => d.t.duckUnder!))) {
    const keys = labels.filter((l) => l.t.role === role);
    if (!keys.length) continue;
    const users = ducked.filter((d) => d.t.duckUnder === role).length;
    // each key track is split: one copy for the mix, one per sidechain user
    const busParts: string[] = [];
    keys.forEach((k, j) => {
      const outs = [`${k.label}m`, `${k.label}s`];
      chains.push(`[${k.label}]asplit=2[${outs[0]}][${outs[1]}]`);
      k.label = outs[0]!;
      busParts.push(`[${outs[1]}]`);
      void j;
    });
    const bus = `bus_${role}`;
    chains.push(`${busParts.join('')}amix=inputs=${busParts.length}:normalize=0:duration=longest,apad=whole_dur=${f(total)}${users > 1 ? `,asplit=${users}${Array.from({ length: users }, (_, u) => `[${bus}${u}]`).join('')}` : `[${bus}0]`}`);
    consumedBySidechain.set(role, Array.from({ length: users }, (_, u) => `${bus}${u}`));
  }
  for (const l of labels) {
    if (l.t.duckUnder && consumedBySidechain.get(l.t.duckUnder)?.length) {
      const sc = consumedBySidechain.get(l.t.duckUnder)!.shift()!;
      const out = `${l.label}d`;
      chains.push(`[${l.label}][${sc}]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=500:makeup=1[${out}]`);
      finalLabels.push(out);
    } else {
      finalLabels.push(l.label);
    }
  }
  const outLabel = 'aout';
  chains.push(
    `${finalLabels.map((l) => `[${l}]`).join('')}amix=inputs=${finalLabels.length}:normalize=0:duration=longest:dropout_transition=0,` +
      `apad=whole_dur=${f(total)},atrim=duration=${f(total)},alimiter=limit=0.98:level=disabled[${outLabel}]`,
  );
  return { inputs, filter: chains.join(';'), outLabel };
}
