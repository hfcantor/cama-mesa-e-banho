/**
 * GLSL (WebGL 1) transition shaders. Each body defines
 *   vec4 transition(vec2 uv)
 * with access to getFromColor(uv), getToColor(uv), progress (0→1) and ratio (w/h).
 * The interface is the de-facto standard popularised by gl-transitions, but
 * the shaders below are written for this project.
 */

export const GLSL_TRANSITIONS: Record<string, string> = {
  fade: `vec4 transition(vec2 uv){ return mix(getFromColor(uv), getToColor(uv), progress); }`,

  wipeLeft: `vec4 transition(vec2 uv){ float e = smoothstep(progress - 0.02, progress + 0.02, 1.0 - uv.x);
    return mix(getToColor(uv), getFromColor(uv), e); }`,

  circle: `vec4 transition(vec2 uv){ vec2 p = (uv - 0.5) * vec2(ratio, 1.0);
    float r = progress * length(vec2(ratio, 1.0)) * 0.5 * 1.05;
    float e = smoothstep(r - 0.01, r + 0.01, length(p));
    return mix(getToColor(uv), getFromColor(uv), e); }`,

  crossZoom: `vec4 transition(vec2 uv){
    float s = sin(progress * 3.14159265);
    vec2 c = vec2(0.5);
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 12; i++) {
      float k = float(i) / 11.0;
      vec2 off = (uv - c) * (1.0 - s * 0.25 * k);
      acc += mix(getFromColor(c + off), getToColor(c + off), smoothstep(0.35, 0.65, progress));
    }
    return acc / 12.0; }`,

  pixelize: `vec4 transition(vec2 uv){
    float d = min(progress, 1.0 - progress);
    float steps = max(1.0, floor(d * 2.0 * 60.0));
    vec2 sq = vec2(steps * ratio, steps);
    vec2 p = steps > 1.0 ? (floor(uv * sq) + 0.5) / sq : uv;
    return mix(getFromColor(p), getToColor(p), smoothstep(0.45, 0.55, progress)); }`,

  ripple: `vec4 transition(vec2 uv){
    vec2 dir = uv - 0.5;
    float dist = length(dir);
    float wave = sin(dist * 40.0 - progress * 30.0) * 0.03 * (1.0 - progress) * progress * 4.0;
    vec2 off = dist > 0.0 ? dir / dist * wave : vec2(0.0);
    return mix(getFromColor(uv + off), getToColor(uv + off), smoothstep(0.2, 0.8, progress)); }`,

  dissolve: `float rnd(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
    vec4 transition(vec2 uv){ float n = rnd(floor(uv * vec2(160.0 * ratio, 160.0)));
    return n < progress ? getToColor(uv) : getFromColor(uv); }`,

  swirl: `vec4 transition(vec2 uv){
    vec2 p = uv - 0.5;
    float r = length(p);
    float a = (1.0 - smoothstep(0.0, 0.6, r)) * sin(progress * 3.14159265) * 6.0;
    float s = sin(a), c = cos(a);
    vec2 q = vec2(p.x * c - p.y * s, p.x * s + p.y * c) + 0.5;
    return mix(getFromColor(q), getToColor(q), smoothstep(0.3, 0.7, progress)); }`,

  directionalBlur: `vec4 transition(vec2 uv){
    float s = sin(progress * 3.14159265) * 0.12;
    vec4 a = vec4(0.0);
    for (int i = 0; i < 10; i++) {
      float k = (float(i) / 9.0 - 0.5) * s;
      a += mix(getFromColor(uv + vec2(k, 0.0)), getToColor(uv + vec2(k, 0.0)), progress);
    }
    return a / 10.0; }`,
};

export const VERTEX_SHADER = `attribute vec2 pos; varying vec2 vUv;
void main(){ vUv = pos * 0.5 + 0.5; gl_Position = vec4(pos, 0.0, 1.0); }`;

export function fragmentShader(body: string): string {
  return `precision highp float;
varying vec2 vUv;
uniform sampler2D from; uniform sampler2D to;
uniform float progress; uniform float ratio;
vec4 getFromColor(vec2 uv){ return texture2D(from, vec2(uv.x, 1.0 - uv.y)); }
vec4 getToColor(vec2 uv){ return texture2D(to, vec2(uv.x, 1.0 - uv.y)); }
${body}
void main(){ gl_FragColor = transition(vUv); }`;
}
