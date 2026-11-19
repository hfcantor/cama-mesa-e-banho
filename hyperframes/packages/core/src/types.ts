/** Shared types of the composition model. */

export interface CompositionConfig {
  id: string | null;
  width: number;
  height: number;
  fps: number;
  /** Declared duration in seconds; null = derived from clips. */
  duration: number | null;
  background: string | null;
}

export const DEFAULT_CONFIG: CompositionConfig = {
  id: null, width: 1920, height: 1080, fps: 30, duration: null, background: null,
};

export const RESOLUTION_PRESETS: Record<string, { width: number; height: number }> = {
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '1440p': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
  'vertical-1080': { width: 1080, height: 1920 },
  'square-1080': { width: 1080, height: 1080 },
  'portrait-4x5': { width: 1080, height: 1350 },
};

export type ClipKind = 'element' | 'video' | 'audio' | 'image' | 'lottie' | 'captions' | 'particles';

export interface SourceLocation {
  line: number;
  col: number;
  startOffset: number;
  endOffset: number;
}

export interface ClipInfo {
  id: string;
  /** true when the id was generated (element has no id attribute). */
  autoId: boolean;
  tag: string;
  kind: ClipKind;
  name: string | null;
  start: string | null;
  duration: string | null;
  end: string | null;
  track: string | null;
  src: string | null;
  mediaStart: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
  enter: string | null;
  exit: string | null;
  keyframes: string | null;
  kenburns: string | null;
  location: SourceLocation | null;
}

export interface ScriptInfo {
  src: string | null;
  inline: string | null;
  type: string | null;
  location: SourceLocation | null;
}

export interface StyleInfo {
  content: string;
  tailwind: boolean;
  /** Offset of the content inside the file (for error positions). */
  location: SourceLocation | null;
  inlineAttribute: boolean;
}

export interface AssetRef {
  ref: string;
  attr: string;
  tag: string;
  location: SourceLocation | null;
}

export interface ParseIssue {
  code: string;
  message: string;
  line: number;
  col: number;
}

export type LibraryName = 'gsap' | 'anime' | 'lottie' | 'three' | 'tailwind';

export interface CompositionInfo {
  file: string | null;
  hasRoot: boolean;
  config: CompositionConfig;
  clips: ClipInfo[];
  scripts: ScriptInfo[];
  styles: StyleInfo[];
  assets: AssetRef[];
  libraries: LibraryName[];
  parseErrors: ParseIssue[];
}

/** Scene transition rendered by the producer (FFmpeg xfade). */
export interface SceneTransition {
  type: string;
  duration: number;
}

export interface SceneDef {
  src: string;
  /** Optional override; otherwise the composition duration is used. */
  duration?: number;
  transition?: SceneTransition;
}

export interface AudioTrackDef {
  src: string;
  start?: number;
  duration?: number;
  mediaStart?: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  /** Lower this track while others ("narration") play. */
  duckUnder?: string;
  role?: 'music' | 'narration' | 'sfx';
  id?: string;
}

export interface ProjectManifest {
  name: string;
  version?: number;
  width?: number;
  height?: number;
  fps?: number;
  /** Single-composition project. */
  entry?: string;
  /** Multi-scene project (rendered then joined with transitions). */
  scenes?: SceneDef[];
  audio?: AudioTrackDef[];
  captions?: { src: string; embed?: boolean; language?: string };
  output?: { file?: string; format?: 'mp4' | 'webm' | 'gif' | 'mov'; crf?: number };
}
