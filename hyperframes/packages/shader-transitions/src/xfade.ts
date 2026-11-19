/**
 * Scene-level transitions applied by the producer with FFmpeg's `xfade` filter.
 * Built-in names map 1:1 to xfade transitions; "custom" ones are per-pixel
 * expressions evaluated by xfade (P goes from 1 to 0 during the transition,
 * A/B are the outgoing/incoming pixel values of the current plane).
 */

export const XFADE_BUILTIN = [
  'fade', 'wipeleft', 'wiperight', 'wipeup', 'wipedown', 'slideleft', 'slideright', 'slideup', 'slidedown',
  'circlecrop', 'rectcrop', 'distance', 'fadeblack', 'fadewhite', 'radial', 'smoothleft', 'smoothright',
  'smoothup', 'smoothdown', 'circleopen', 'circleclose', 'vertopen', 'vertclose', 'horzopen', 'horzclose',
  'dissolve', 'pixelize', 'diagtl', 'diagtr', 'diagbl', 'diagbr', 'hlslice', 'hrslice', 'vuslice', 'vdslice',
  'hblur', 'fadegrays', 'wipetl', 'wipetr', 'wipebl', 'wipebr', 'squeezeh', 'squeezev', 'zoomin',
  'fadefast', 'fadeslow', 'hlwind', 'hrwind', 'vuwind', 'vdwind', 'coverleft', 'coverright', 'coverup',
  'coverdown', 'revealleft', 'revealright', 'revealup', 'revealdown',
] as const;

export const XFADE_CUSTOM: Record<string, string> = {
  // wavy vertical wipe
  wave: "if(lt(X, W*(1-P)*1.2 - 0.1*W + 0.04*W*sin(Y/H*25)), B, A)",
  // venetian blinds
  blinds: "if(lt(mod(Y, H/10), (H/10)*(1-P)), B, A)",
  // checkerboard in two phases
  checker: "if(lt(P, if(eq(mod(floor(X/(W/8))+floor(Y/(H/8)),2),0),0.65,0.35)), B, A)",
  // diamond iris from the centre
  diamond: "if(lt(abs(X/W-0.5)+abs(Y/H-0.5), (1-P)*1.05), B, A)",
  // soft crossfade with a luma-like vertical gradient sweep
  sweep: "A*min(1,max(0,(Y/H - (1-P)*1.4 + 0.2)*5)) + B*(1-min(1,max(0,(Y/H - (1-P)*1.4 + 0.2)*5)))",
};

/** Aliases so the same names used in compositions work for scenes. */
const ALIASES: Record<string, string> = {
  crossfade: 'fade', 'fade-black': 'fadeblack', 'fade-white': 'fadewhite', 'wipe-left': 'wipeleft', 'wipe-right': 'wiperight',
  'wipe-up': 'wipeup', 'wipe-down': 'wipedown', 'slide-left': 'slideleft', 'slide-right': 'slideright', 'slide-up': 'slideup',
  'slide-down': 'slidedown', iris: 'circleopen', zoom: 'zoomin', blur: 'hblur',
};

export function listSceneTransitions(): string[] {
  return [...XFADE_BUILTIN, ...Object.keys(XFADE_CUSTOM), ...Object.keys(ALIASES)];
}

/** Returns the xfade option string for a transition name, e.g. "transition=wipeleft". */
export function xfadeOptions(name: string): string {
  const n = ALIASES[name] ?? name;
  if ((XFADE_BUILTIN as readonly string[]).includes(n)) return `transition=${n}`;
  const expr = XFADE_CUSTOM[n];
  if (expr) return `transition=custom:expr='${expr.replace(/'/g, "\\'").replace(/,/g, '\\,')}'`;
  throw new Error(`unknown scene transition "${name}". Available: ${listSceneTransitions().join(', ')}`);
}
