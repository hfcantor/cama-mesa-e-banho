/**
 * Remotion → HyperFrames converter (static analysis with the TypeScript compiler API).
 *
 * Supported (converted exactly):
 *   <Composition id component durationInFrames fps width height>, <AbsoluteFill>,
 *   <Sequence from durationInFrames layout>, <Series>/<Series.Sequence durationInFrames offset>,
 *   <Img>, <Audio>, <Video>/<OffthreadVideo> (startFrom/trimBefore, volume, muted), staticFile(),
 *   static style objects, className, string/number props of local components,
 *   `interpolate(frame, [..], [..], {extrapolate*, easing})` and `spring({frame, fps, config, delay})`
 *   used in style.opacity / style.transform (translateX/Y, scale, rotate) → data-keyframes.
 * Approximated: easing functions other than linear/bezier/standard curves, extrapolation "extend".
 * Not supported (reported with line numbers): React state/effects, data fetching, delayRender,
 *   dynamic expressions in text, arrays rendered with .map(), conditional rendering, @remotion/* packages
 *   other than the core, calculateMetadata, input props schemas.
 */
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { cubicBezier, easings, type EasingFn, type Keyframe } from '@hfr/core';
import { escapeAttr, escapeHtml, htmlDocument } from './util.ts';

export interface ConversionNote { level: 'converted' | 'approximated' | 'unsupported'; message: string; file: string; line: number }

export interface RemotionConversion {
  dir: string;
  composition: { id: string; width: number; height: number; fps: number; durationInFrames: number };
  notes: ConversionNote[];
  assets: string[];
}

interface SourceCtx { file: string; sf: ts.SourceFile }

interface AnimVar { samples: Array<{ frame: number; value: number }>; kind: 'interpolate' | 'spring' }

interface Scope {
  ctx: SourceCtx;
  fps: number;
  /** Absolute start (s) and duration (s) of the enclosing sequence. */
  seqStart: number;
  seqDuration: number;
  props: Map<string, string | number>;
  consts: Map<string, string | number>;
  anims: Map<string, AnimVar>;
  frameVar: string | null;
}

const EXT = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];

async function exists(p: string) { return stat(p).then((s) => s.isFile(), () => false); }

async function resolveModule(from: string, spec: string): Promise<string | null> {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), spec);
  if (await exists(base)) return base;
  for (const e of EXT) if (await exists(base + e)) return base + e;
  return null;
}

/** Simulates a damped spring (same parameters as Remotion's spring()). */
export function simulateSpring(o: { fps: number; mass?: number; damping?: number; stiffness?: number; overshootClamping?: boolean; from?: number; to?: number; delay?: number; maxFrames?: number }): Array<{ frame: number; value: number }> {
  const m = o.mass ?? 1, c = o.damping ?? 10, k = o.stiffness ?? 100, from = o.from ?? 0, to = o.to ?? 1, delay = o.delay ?? 0;
  const out: Array<{ frame: number; value: number }> = [{ frame: 0, value: from }];
  if (delay > 0) out.push({ frame: delay, value: from });
  let x = from, v = 0;
  const steps = 20, dt = 1 / o.fps / steps;
  for (let f = 1; f <= (o.maxFrames ?? o.fps * 10); f++) {
    for (let s = 0; s < steps; s++) {
      const a = (-k * (x - to) - c * v) / m;
      v += a * dt;
      x += v * dt;
    }
    let val = x;
    if (o.overshootClamping) val = from < to ? Math.min(val, to) : Math.max(val, to);
    out.push({ frame: f + delay, value: val });
    if (Math.abs(x - to) < 1e-3 * Math.abs(to - from || 1) && Math.abs(v) < 1e-3) { out.push({ frame: f + delay + 1, value: to }); break; }
  }
  return out;
}

function lineOf(ctx: SourceCtx, node: ts.Node): number {
  return ctx.sf.getLineAndCharacterOfPosition(node.getStart(ctx.sf)).line + 1;
}

export async function convertRemotion(entry: string, o: { outDir: string; compositionId?: string; publicDir?: string }): Promise<RemotionConversion> {
  const notes: ConversionNote[] = [];
  const note = (level: ConversionNote['level'], ctx: SourceCtx, node: ts.Node, message: string) => notes.push({ level, message, file: path.relative(process.cwd(), ctx.file), line: lineOf(ctx, node) });
  const cache = new Map<string, SourceCtx>();
  const load = async (file: string): Promise<SourceCtx> => {
    const hit = cache.get(file);
    if (hit) return hit;
    const text = await readFile(file, 'utf8');
    const ctx = { file, sf: ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS) };
    cache.set(file, ctx);
    return ctx;
  };
  const entryFile = path.resolve(entry);
  const root = await load(entryFile);
  const publicDir = o.publicDir ?? (await findPublicDir(entryFile));
  const dir = path.resolve(o.outDir);
  await mkdir(dir, { recursive: true });
  const assets = new Set<string>();

  // ---------------------------------------------------------- helpers
  const literal = (e: ts.Expression | undefined, scope?: Partial<Scope>): string | number | null => {
    if (!e) return null;
    if (ts.isNumericLiteral(e)) return Number(e.text);
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
    if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.MinusToken) { const v = literal(e.operand, scope); return typeof v === 'number' ? -v : null; }
    if (ts.isParenthesizedExpression(e)) return literal(e.expression, scope);
    if (ts.isIdentifier(e)) return scope?.props?.get(e.text) ?? scope?.consts?.get(e.text) ?? null;
    if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'props') return scope?.props?.get(e.name.text) ?? null;
    if (ts.isBinaryExpression(e)) {
      const a = literal(e.left, scope), b = literal(e.right, scope);
      if (typeof a === 'number' && typeof b === 'number') {
        switch (e.operatorToken.kind) {
          case ts.SyntaxKind.PlusToken: return a + b;
          case ts.SyntaxKind.MinusToken: return a - b;
          case ts.SyntaxKind.AsteriskToken: return a * b;
          case ts.SyntaxKind.SlashToken: return a / b;
        }
      }
      if (e.operatorToken.kind === ts.SyntaxKind.PlusToken && a !== null && b !== null) return `${a}${b}`;
    }
    if (ts.isCallExpression(e) && ts.isIdentifier(e.expression) && e.expression.text === 'staticFile') {
      const f = literal(e.arguments[0], scope);
      if (typeof f === 'string') { assets.add(f.replace(/^\/+/, '')); return `public/${f.replace(/^\/+/, '')}`; }
    }
    return null;
  };
  const jsxAttr = (el: ts.JsxOpeningLikeElement, name: string): ts.Expression | undefined => {
    for (const p of el.attributes.properties) {
      if (ts.isJsxAttribute(p) && p.name.getText() === name) {
        if (!p.initializer) return ts.factory.createTrue();
        if (ts.isStringLiteral(p.initializer)) return p.initializer;
        if (ts.isJsxExpression(p.initializer)) return p.initializer.expression;
      }
    }
    return undefined;
  };
  const numArray = (e: ts.Expression | undefined, scope: Partial<Scope>): number[] | null => {
    if (!e || !ts.isArrayLiteralExpression(e)) return null;
    const vals = e.elements.map((x) => literal(x, scope));
    return vals.every((v) => typeof v === 'number') ? (vals as number[]) : null;
  };
  const easingFrom = (e: ts.Expression | undefined, ctx: SourceCtx): EasingFn | null => {
    if (!e) return null;
    const text = e.getText(ctx.sf).replace(/\s+/g, '');
    const bez = /^Easing\.bezier\(([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\)$/.exec(text);
    if (bez) return cubicBezier(Number(bez[1]), Number(bez[2]), Number(bez[3]), Number(bez[4]));
    const map: Record<string, string> = {
      'Easing.linear': 'linear', 'Easing.ease': 'in-out-quad', 'Easing.quad': 'in-quad', 'Easing.cubic': 'in-cubic', 'Easing.sin': 'in-sine', 'Easing.exp': 'in-expo',
      'Easing.in(Easing.ease)': 'in-quad', 'Easing.out(Easing.ease)': 'out-quad', 'Easing.inOut(Easing.ease)': 'in-out-quad',
      'Easing.in(Easing.quad)': 'in-quad', 'Easing.out(Easing.quad)': 'out-quad', 'Easing.inOut(Easing.quad)': 'in-out-quad',
      'Easing.in(Easing.cubic)': 'in-cubic', 'Easing.out(Easing.cubic)': 'out-cubic', 'Easing.inOut(Easing.cubic)': 'in-out-cubic',
      'Easing.in(Easing.exp)': 'in-expo', 'Easing.out(Easing.exp)': 'out-expo', 'Easing.inOut(Easing.exp)': 'in-out-expo',
      'Easing.in(Easing.sin)': 'in-sine', 'Easing.out(Easing.sin)': 'out-sine', 'Easing.inOut(Easing.sin)': 'in-out-sine',
      'Easing.out(Easing.back(1.70158))': 'out-back', 'Easing.bounce': 'out-bounce', 'Easing.elastic(1)': 'out-elastic',
    };
    const name = map[text];
    if (name) return easings[name]!;
    note('approximated', ctx, e, `easing ${text} is not recognised; using linear`);
    return null;
  };
  const objProp = (obj: ts.ObjectLiteralExpression, name: string) => {
    for (const p of obj.properties) if (ts.isPropertyAssignment(p) && p.name.getText() === name) return p.initializer;
    for (const p of obj.properties) if (ts.isShorthandPropertyAssignment(p) && p.name.text === name) return p.name;
    return undefined;
  };

  /** Turns `interpolate(...)` / `spring(...)` into frame samples. */
  const animFromCall = (call: ts.CallExpression, scope: Scope): AnimVar | null => {
    const callee = call.expression.getText(scope.ctx.sf);
    if (callee === 'spring') {
      const arg = call.arguments[0];
      if (!arg || !ts.isObjectLiteralExpression(arg)) return null;
      const cfg = objProp(arg, 'config');
      const num = (e: ts.Expression | undefined) => { const v = literal(e, scope); return typeof v === 'number' ? v : undefined; };
      const c = cfg && ts.isObjectLiteralExpression(cfg) ? cfg : undefined;
      const samples = simulateSpring({
        fps: scope.fps, delay: num(objProp(arg, 'delay')), from: num(objProp(arg, 'from')), to: num(objProp(arg, 'to')),
        mass: c ? num(objProp(c, 'mass')) : undefined, damping: c ? num(objProp(c, 'damping')) : undefined, stiffness: c ? num(objProp(c, 'stiffness')) : undefined,
        overshootClamping: c ? objProp(c, 'overshootClamping')?.kind === ts.SyntaxKind.TrueKeyword : undefined,
      });
      note('converted', scope.ctx, call, `spring() simulated into ${samples.length} keyframes`);
      return { kind: 'spring', samples };
    }
    if (callee === 'interpolate') {
      const [input, inR, outR, opts] = call.arguments;
      const ins = numArray(inR, scope), outs = numArray(outR, scope);
      if (!ins || !outs || ins.length !== outs.length) { note('unsupported', scope.ctx, call, 'interpolate() ranges must be numeric array literals of equal length'); return null; }
      let easing: EasingFn | null = null;
      let clampLeft = false, clampRight = false;
      if (opts && ts.isObjectLiteralExpression(opts)) {
        easing = easingFrom(objProp(opts, 'easing'), scope.ctx);
        clampLeft = literal(objProp(opts, 'extrapolateLeft'), scope) === 'clamp';
        clampRight = literal(objProp(opts, 'extrapolateRight'), scope) === 'clamp';
      }
      if (!clampLeft || !clampRight) note('approximated', scope.ctx, call, 'interpolate() without extrapolate "clamp" on both sides is clamped (values beyond the range are held)');
      const mapRange = (x: number) => {
        let i = 0;
        while (i < ins.length - 2 && x > ins[i + 1]!) i++;
        const a = ins[i]!, b = ins[i + 1]!;
        let p = b === a ? 1 : Math.min(1, Math.max(0, (x - a) / (b - a)));
        if (easing) p = easing(p);
        return outs[i]! + (outs[i + 1]! - outs[i]!) * p;
      };
      const src = input && ts.isIdentifier(input) ? input.text : input?.getText(scope.ctx.sf) ?? '';
      if (src === scope.frameVar) {
        const samples: Array<{ frame: number; value: number }> = [];
        for (let f = Math.floor(ins[0]!); f <= Math.ceil(ins[ins.length - 1]!); f++) samples.push({ frame: f, value: mapRange(f) });
        return { kind: 'interpolate', samples: easing ? samples : ins.map((f, i) => ({ frame: f, value: outs[i]! })) };
      }
      const base = scope.anims.get(src);
      if (base) return { kind: base.kind, samples: base.samples.map((s) => ({ frame: s.frame, value: mapRange(s.value) })) };
      note('unsupported', scope.ctx, call, `interpolate() input "${src}" is not the current frame or a known animated value`);
      return null;
    }
    return null;
  };

  /** Collects frame/config/const/animated variables declared in a component body. */
  const analyzeBody = (body: ts.Node, scope: Scope) => {
    const visit = (n: ts.Node) => {
      if (ts.isVariableDeclaration(n) && n.initializer) {
        const init = n.initializer;
        if (ts.isIdentifier(n.name)) {
          if (ts.isCallExpression(init) && init.expression.getText(scope.ctx.sf) === 'useCurrentFrame') scope.frameVar = n.name.text;
          else if (ts.isCallExpression(init)) {
            const a = animFromCall(init, scope);
            if (a) scope.anims.set(n.name.text, a);
            else if (/^use(State|Effect|Reducer|Memo|Callback|Ref)$/.test(init.expression.getText(scope.ctx.sf))) note('unsupported', scope.ctx, init, `${init.expression.getText(scope.ctx.sf)}() is not supported (compositions must be pure functions of time)`);
            else if (/delayRender|continueRender|fetch/.test(init.expression.getText(scope.ctx.sf))) note('unsupported', scope.ctx, init, `${init.expression.getText(scope.ctx.sf)}() (async data) is not supported`);
          } else {
            const v = literal(init, scope);
            if (v !== null) scope.consts.set(n.name.text, v);
          }
        } else if (ts.isObjectBindingPattern(n.name) && ts.isCallExpression(init) && init.expression.getText(scope.ctx.sf) === 'useVideoConfig') {
          for (const el of n.name.elements) {
            const key = (el.propertyName ?? el.name).getText(scope.ctx.sf);
            const local = el.name.getText(scope.ctx.sf);
            const val = { fps: scope.fps, width: comp.width, height: comp.height, durationInFrames: comp.durationInFrames }[key];
            if (val !== undefined) scope.consts.set(local, val);
          }
        }
      }
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ['useEffect', 'useState', 'delayRender'].includes(n.expression.text) && !ts.isVariableDeclaration(n.parent)) {
        note('unsupported', scope.ctx, n, `${n.expression.text}() is not supported`);
      }
      ts.forEachChild(n, visit);
    };
    visit(body);
  };

  // ------------------------------------------------------- style objects
  const CSS_UNITLESS = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flex', 'flexGrow', 'flexShrink', 'order', 'scale']);
  const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  const styleToCss = (obj: ts.ObjectLiteralExpression, scope: Scope, keyframes: Map<string, AnimVar>): string => {
    const decls: string[] = [];
    for (const p of obj.properties) {
      if (!ts.isPropertyAssignment(p) && !ts.isShorthandPropertyAssignment(p)) { note('unsupported', scope.ctx, p, 'spread in style objects is not supported'); continue; }
      const key = p.name.getText(scope.ctx.sf).replace(/^['"]|['"]$/g, '');
      const value = ts.isPropertyAssignment(p) ? p.initializer : p.name;
      const lit = literal(value, scope);
      if (lit !== null) { decls.push(`${kebab(key)}:${typeof lit === 'number' && !CSS_UNITLESS.has(key) ? `${lit}px` : lit}`); continue; }
      if (key === 'opacity' && ts.isIdentifier(value) && scope.anims.has(value.text)) { keyframes.set('opacity', scope.anims.get(value.text)!); continue; }
      if (key === 'transform' && (ts.isTemplateExpression(value) || ts.isNoSubstitutionTemplateLiteral(value))) {
        const text = value.getText(scope.ctx.sf).slice(1, -1);
        let rest = text;
        for (const m of text.matchAll(/(translateX|translateY|scale|rotate)\(\s*\$\{\s*([A-Za-z_]\w*)\s*\}\s*(px|deg)?\s*\)/g)) {
          const anim = scope.anims.get(m[2]!);
          if (!anim) continue;
          keyframes.set({ translateX: 'x', translateY: 'y', scale: 'scale', rotate: 'rotate' }[m[1]!]!, anim);
          rest = rest.replace(m[0], '');
        }
        if (/\$\{/.test(rest)) note('unsupported', scope.ctx, value, `transform parts not converted: ${rest.trim()}`);
        else if (rest.trim()) decls.push(`transform:${rest.trim()}`);
        continue;
      }
      note('unsupported', scope.ctx, value, `dynamic style "${key}: ${value.getText(scope.ctx.sf).slice(0, 60)}" is not converted`);
    }
    return decls.join(';');
  };

  const keyframesJson = (kf: Map<string, AnimVar>, fps: number): string | null => {
    if (!kf.size) return null;
    const frames = new Map<number, Keyframe>();
    for (const [prop, anim] of kf) {
      for (const s of anim.samples) {
        const k = frames.get(s.frame) ?? { t: Math.round((s.frame / fps) * 10000) / 10000, ease: 'linear' };
        (k as unknown as Record<string, number>)[prop] = Math.round(s.value * 10000) / 10000;
        frames.set(s.frame, k);
      }
    }
    return JSON.stringify([...frames.values()].sort((a, b) => a.t - b.t));
  };

  // --------------------------------------------------- component lookup
  const findComponent = async (ctx: SourceCtx, name: string): Promise<{ ctx: SourceCtx; fn: ts.FunctionLikeDeclaration } | null> => {
    let found: ts.FunctionLikeDeclaration | null = null;
    let importFrom: string | null = null;
    let importedName = name;
    ctx.sf.forEachChild((n) => {
      if (ts.isFunctionDeclaration(n) && n.name?.text === name) found = n;
      if (ts.isVariableStatement(n)) for (const d of n.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === name && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) found = d.initializer;
      }
      if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier) && n.importClause) {
        const nb = n.importClause.namedBindings;
        if (n.importClause.name?.text === name) { importFrom = n.moduleSpecifier.text; importedName = 'default'; }
        if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) if (el.name.text === name) { importFrom = n.moduleSpecifier.text; importedName = el.propertyName?.text ?? name; }
      }
    });
    if (found) return { ctx, fn: found };
    if (importFrom) {
      const file = await resolveModule(ctx.file, importFrom);
      if (!file) return null;
      const target = await load(file);
      if (importedName === 'default') {
        let def: string | null = null;
        let fn: ts.FunctionLikeDeclaration | null = null;
        target.sf.forEachChild((n) => {
          if (ts.isExportAssignment(n) && ts.isIdentifier(n.expression)) def = n.expression.text;
          if (ts.isFunctionDeclaration(n) && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) fn = n;
        });
        if (fn) return { ctx: target, fn };
        return def ? findComponent(target, def) : null;
      }
      return findComponent(target, importedName);
    }
    return null;
  };

  const returnedJsx = (fn: ts.FunctionLikeDeclaration): ts.JsxChild | ts.Expression | null => {
    const body = fn.body;
    if (!body) return null;
    if (!ts.isBlock(body)) return unwrap(body);
    let ret: ts.Expression | null = null;
    body.forEachChild((n) => { if (ts.isReturnStatement(n) && n.expression) ret = unwrap(n.expression); });
    return ret;
  };
  const unwrap = (e: ts.Expression): ts.Expression => (ts.isParenthesizedExpression(e) ? unwrap(e.expression) : e);

  // ------------------------------------------------------- JSX → HTML
  let clipCounter = 0;
  const renderComponent = async (ctx: SourceCtx, fn: ts.FunctionLikeDeclaration, scope: Scope): Promise<string> => {
    const inner: Scope = { ...scope, ctx, consts: new Map(scope.consts), anims: new Map(), frameVar: null };
    // destructured props: ({title, color}) => …
    const param = fn.parameters[0];
    if (param && ts.isObjectBindingPattern(param.name)) {
      for (const el of param.name.elements) {
        const key = (el.propertyName ?? el.name).getText(ctx.sf);
        const local = el.name.getText(ctx.sf);
        const v = scope.props.get(key) ?? literal(el.initializer, inner);
        if (v !== undefined && v !== null) inner.props.set(local, v);
      }
    }
    if (fn.body) analyzeBody(fn.body, inner);
    const jsx = returnedJsx(fn);
    if (!jsx) { note('unsupported', ctx, fn, 'component does not return JSX'); return ''; }
    return renderNode(jsx as ts.Node, inner);
  };

  const renderChildren = async (children: ts.NodeArray<ts.JsxChild>, scope: Scope): Promise<string> => {
    const out: string[] = [];
    for (const c of children) out.push(await renderNode(c, scope));
    return out.join('');
  };

  const renderNode = async (node: ts.Node, scope: Scope): Promise<string> => {
    if (ts.isJsxText(node)) {
      const t = node.text.replace(/\s+/g, ' ');
      return t.trim() ? escapeHtml(t) : '';
    }
    if (ts.isJsxExpression(node)) {
      if (!node.expression) return '';
      const v = literal(node.expression, scope);
      if (v !== null) return escapeHtml(String(v));
      if (ts.isJsxElement(node.expression) || ts.isJsxSelfClosingElement(node.expression) || ts.isJsxFragment(node.expression)) return renderNode(node.expression, scope);
      note('unsupported', scope.ctx, node, `expression {${node.expression.getText(scope.ctx.sf).slice(0, 60)}} is not converted`);
      return `<!-- unsupported: ${escapeHtml(node.expression.getText(scope.ctx.sf).slice(0, 80)).replace(/--/g, '- -')} -->`;
    }
    if (ts.isParenthesizedExpression(node)) return renderNode(node.expression, scope);
    if (ts.isJsxFragment(node)) return renderChildren(node.children, scope);
    if (!ts.isJsxElement(node) && !ts.isJsxSelfClosingElement(node)) {
      note('unsupported', scope.ctx, node, `${ts.SyntaxKind[node.kind]} is not converted`);
      return '';
    }
    const open = ts.isJsxElement(node) ? node.openingElement : node;
    const children = ts.isJsxElement(node) ? node.children : ts.factory.createNodeArray<ts.JsxChild>([]);
    const tag = open.tagName.getText(scope.ctx.sf);
    const num = (name: string) => { const v = literal(jsxAttr(open, name), scope); return typeof v === 'number' ? v : null; };
    const fps = scope.fps;

    // Sequences
    if (tag === 'Sequence' || tag === 'Series.Sequence') {
      const from = (tag === 'Sequence' ? num('from') ?? 0 : 0) / fps;
      const durF = num('durationInFrames');
      const start = scope.seqStart + from;
      const duration = durF !== null ? durF / fps : Math.max(0, scope.seqStart + scope.seqDuration - start);
      const id = `seq-${++clipCounter}`;
      const nameAttr = literal(jsxAttr(open, 'name'), scope);
      const layoutNone = literal(jsxAttr(open, 'layout'), scope) === 'none';
      const inner = await renderChildren(children, { ...scope, seqStart: start, seqDuration: duration });
      note('converted', scope.ctx, open, `${tag} → clip ${id} (${start.toFixed(2)}s, ${duration.toFixed(2)}s)`);
      return `<div id="${id}" data-name="${escapeAttr(String(nameAttr ?? tag))}" data-start="${round(start)}" data-duration="${round(duration)}" style="${layoutNone ? '' : 'position:absolute;inset:0;display:flex;flex-direction:column'}">${inner}</div>`;
    }
    if (tag === 'Series') {
      let t = scope.seqStart;
      const out: string[] = [];
      for (const c of children) {
        if (!ts.isJsxElement(c) && !ts.isJsxSelfClosingElement(c)) continue;
        const o2 = ts.isJsxElement(c) ? c.openingElement : c;
        const offset = literal(jsxAttr(o2, 'offset'), scope);
        if (typeof offset === 'number') t += offset / fps;
        const d = literal(jsxAttr(o2, 'durationInFrames'), scope);
        const dur = typeof d === 'number' ? d / fps : scope.seqStart + scope.seqDuration - t;
        out.push(await renderNode(c, { ...scope, seqStart: t, seqDuration: dur }));
        t += dur;
      }
      return out.join('');
    }
    // Media
    if (tag === 'Audio' || tag === 'Video' || tag === 'OffthreadVideo') {
      const src = literal(jsxAttr(open, 'src'), scope);
      if (typeof src !== 'string') { note('unsupported', scope.ctx, open, `${tag} src must be a string or staticFile()`); return ''; }
      const startFrom = num('startFrom') ?? num('trimBefore') ?? 0;
      const endAt = num('endAt') ?? num('trimAfter');
      const volume = num('volume');
      if (jsxAttr(open, 'volume') && volume === null) note('approximated', scope.ctx, open, 'volume callbacks are not converted (constant volume used)');
      const muted = jsxAttr(open, 'muted') !== undefined;
      const dur = endAt !== null ? (endAt - startFrom) / fps : null;
      const attrs = `src="${escapeAttr(src)}" data-start="${round(scope.seqStart)}"${dur !== null ? ` data-duration="${round(dur)}"` : ` data-end="${round(scope.seqStart + scope.seqDuration)}"`}${startFrom ? ` data-media-start="${round(startFrom / fps)}"` : ''}${volume !== null ? ` data-volume="${volume}"` : ''}${muted ? ' muted' : ''}`;
      note('converted', scope.ctx, open, `<${tag}> → <${tag === 'Audio' ? 'audio' : 'video'}>`);
      if (tag === 'Audio') return `<audio ${attrs}></audio>`;
      const style = jsxAttr(open, 'style');
      const css = style && ts.isObjectLiteralExpression(style) ? styleToCss(style, scope, new Map()) : 'width:100%;height:100%;object-fit:cover';
      return `<video ${attrs} style="${escapeAttr(css)}"></video>`;
    }
    // Elements
    const intrinsic = /^[a-z]/.test(tag) || tag === 'Img' || tag === 'AbsoluteFill';
    if (!intrinsic) {
      const comp = await findComponent(scope.ctx, tag);
      if (!comp) { note('unsupported', scope.ctx, open, `component <${tag}> could not be resolved (only local components are inlined)`); return `<!-- <${escapeHtml(tag)}> not converted -->`; }
      const props = new Map<string, string | number>();
      for (const p of open.attributes.properties) {
        if (!ts.isJsxAttribute(p)) { note('unsupported', scope.ctx, p, 'spread props are not supported'); continue; }
        const v = literal(jsxAttr(open, p.name.getText(scope.ctx.sf)), scope);
        if (v !== null) props.set(p.name.getText(scope.ctx.sf), v);
      }
      return renderComponent(comp.ctx, comp.fn, { ...scope, props, consts: new Map() });
    }
    const htmlTag = tag === 'Img' ? 'img' : tag === 'AbsoluteFill' ? 'div' : tag;
    const kf = new Map<string, AnimVar>();
    const attrs: string[] = [];
    let css = tag === 'AbsoluteFill' ? 'position:absolute;inset:0;display:flex;flex-direction:column' : '';
    for (const p of open.attributes.properties) {
      if (!ts.isJsxAttribute(p)) continue;
      const name = p.name.getText(scope.ctx.sf);
      const expr = jsxAttr(open, name);
      if (name === 'style' && expr && ts.isObjectLiteralExpression(expr)) { const c = styleToCss(expr, scope, kf); css = [css, c].filter(Boolean).join(';'); continue; }
      if (name === 'key' || name === 'ref') continue;
      const v = literal(expr, scope);
      if (v === null) { note('unsupported', scope.ctx, p, `attribute ${name} is dynamic and was dropped`); continue; }
      attrs.push(`${name === 'className' ? 'class' : name}="${escapeAttr(String(v))}"`);
    }
    const kfJson = keyframesJson(kf, fps);
    if (kfJson) {
      const id = `anim-${++clipCounter}`;
      attrs.unshift(`id="${id}"`);
      attrs.push(`data-start="${round(scope.seqStart)}"`, `data-duration="${round(scope.seqDuration)}"`, `data-keyframes='${kfJson}'`);
      if (kf.has('opacity')) css = css.split(';').filter((d) => !d.startsWith('opacity:')).join(';');
    }
    if (css) attrs.push(`style="${escapeAttr(css)}"`);
    const voidTag = ['img', 'br', 'hr', 'input'].includes(htmlTag);
    return voidTag ? `<${htmlTag} ${attrs.join(' ')}>` : `<${htmlTag}${attrs.length ? ' ' + attrs.join(' ') : ''}>${await renderChildren(children, scope)}</${htmlTag}>`;
  };

  // ------------------------------------------------- find <Composition>
  const comps: Array<{ ctx: SourceCtx; el: ts.JsxOpeningLikeElement }> = [];
  const visitAll = async (ctx: SourceCtx, seen = new Set<string>()) => {
    if (seen.has(ctx.file)) return;
    seen.add(ctx.file);
    const walk = (n: ts.Node) => {
      if ((ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) && n.tagName.getText(ctx.sf) === 'Composition') comps.push({ ctx, el: n });
      ts.forEachChild(n, walk);
    };
    walk(ctx.sf);
    if (comps.length) return;
    // follow relative imports (registerRoot(Root) → Root.tsx)
    for (const st of ctx.sf.statements) {
      if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) {
        const f = await resolveModule(ctx.file, st.moduleSpecifier.text);
        if (f) await visitAll(await load(f), seen);
        if (comps.length) return;
      }
    }
  };
  await visitAll(root);
  if (!comps.length) throw new Error('no <Composition> found (pass the file that calls registerRoot or defines the Root component)');
  const chosen = o.compositionId ? comps.find((c) => literal(jsxAttr(c.el, 'id')) === o.compositionId) : comps[0];
  if (!chosen) throw new Error(`composition "${o.compositionId}" not found (available: ${comps.map((c) => literal(jsxAttr(c.el, 'id'))).join(', ')})`);
  const fileConsts = new Map<string, string | number>();
  chosen.ctx.sf.forEachChild((n) => {
    if (ts.isVariableStatement(n)) for (const d of n.declarationList.declarations) if (ts.isIdentifier(d.name)) { const v = literal(d.initializer); if (v !== null) fileConsts.set(d.name.text, v); }
  });
  const read = (name: string, fallback?: number) => {
    const v = literal(jsxAttr(chosen.el, name), { consts: fileConsts });
    if (typeof v === 'number') return v;
    if (fallback !== undefined) return fallback;
    throw new Error(`<Composition> ${name} must be a number literal or a constant`);
  };
  const comp = {
    id: String(literal(jsxAttr(chosen.el, 'id'), { consts: fileConsts }) ?? 'Composition'),
    width: read('width'), height: read('height'), fps: read('fps', 30), durationInFrames: read('durationInFrames'),
  };
  const componentExpr = jsxAttr(chosen.el, 'component');
  if (!componentExpr || !ts.isIdentifier(componentExpr)) throw new Error('<Composition component={…}> must reference a component by name');
  const found = await findComponent(chosen.ctx, componentExpr.text);
  if (!found) throw new Error(`component ${componentExpr.text} not found`);
  const defaultProps = jsxAttr(chosen.el, 'defaultProps');
  const props = new Map<string, string | number>();
  if (defaultProps && ts.isObjectLiteralExpression(defaultProps)) for (const p of defaultProps.properties) {
    if (ts.isPropertyAssignment(p)) { const v = literal(p.initializer, { consts: fileConsts }); if (v !== null) props.set(p.name.getText(chosen.ctx.sf), v); }
  }
  const duration = comp.durationInFrames / comp.fps;
  const body = await renderComponent(found.ctx, found.fn, {
    ctx: found.ctx, fps: comp.fps, seqStart: 0, seqDuration: duration, props, consts: new Map(), anims: new Map(), frameVar: null,
  });

  // ---- assets from public/
  const copied: string[] = [];
  for (const a of assets) {
    if (!publicDir) { notes.push({ level: 'unsupported', message: `staticFile("${a}") but no public/ directory found`, file: entryFile, line: 0 }); continue; }
    const src = path.join(publicDir, a);
    const dest = path.join(dir, 'public', a);
    if (!(await exists(src))) { notes.push({ level: 'unsupported', message: `public/${a} not found`, file: entryFile, line: 0 }); continue; }
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(src, dest);
    copied.push(`public/${a}`);
  }
  const html = htmlDocument({
    title: comp.id, width: comp.width, height: comp.height, fps: comp.fps, duration, background: '#ffffff',
    head: '  <style>#stage{font-family:system-ui,sans-serif}</style>',
    body: `    <div style="position:absolute;inset:0">${body}</div>`,
  });
  await writeFile(path.join(dir, 'index.html'), html);
  await writeFile(path.join(dir, 'hyperframes.json'), JSON.stringify({ name: comp.id, entry: 'index.html', output: { file: `renders/${comp.id}.mp4` } }, null, 2) + '\n');
  const unique = notes.filter((n, i) => notes.findIndex((m) => m.message === n.message && m.line === n.line && m.file === n.file) === i);
  await writeFile(path.join(dir, 'conversion-report.md'), [
    `# Remotion → HyperFrames: ${comp.id}`, '',
    `${comp.width}x${comp.height} @ ${comp.fps} fps, ${comp.durationInFrames} frames (${duration.toFixed(2)} s)`, '',
    ...(['unsupported', 'approximated', 'converted'] as const).flatMap((lvl) => {
      const list = unique.filter((n) => n.level === lvl);
      return list.length ? [`## ${lvl} (${list.length})`, '', ...list.map((n) => `- ${n.file}:${n.line} — ${n.message}`), ''] : [];
    }),
  ].join('\n'));
  return { dir, composition: comp, notes: unique, assets: copied };
}

async function findPublicDir(from: string): Promise<string | null> {
  let d = path.dirname(from);
  for (let i = 0; i < 5; i++) {
    const p = path.join(d, 'public');
    if (await stat(p).then((s) => s.isDirectory(), () => false)) return p;
    d = path.dirname(d);
  }
  return null;
}

const round = (n: number) => Math.round(n * 1000) / 1000;
