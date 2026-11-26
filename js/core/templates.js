// Plano padrão dos episódios "E se você nunca lavasse…?": 16 falas, ~45 planos.
// Cada episódio só informa os textos (tags, placas, ícones), onde fica o tecido em foco
// e os posições dos ácaros; o resto (ritmo, carimbos, LED, CTA, rebobinar, checklist,
// pergunta final) é igual, no estilo dos vídeos de referência.

const C = (a, la, fa, b, lb, fb) => [{ u: 0, pos: a, look: la, fov: fa }, { u: 1, pos: b, look: lb ?? la, fov: fb ?? fa }];
const add = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];

// câmeras geradas a partir do tecido em foco: f = centro [x,y,z], r = tamanho (m)
export function focusCams(f, r, { h = 0.5 } = {}) {
  const P = (d, hh) => [f[0], f[1] + hh, f[2] + d];
  return {
    item: C(P(r * 3.4, r * 3.4 * h), f, 46, P(r * 2.8, r * 2.8 * h), f, 42),
    itemClose: C(P(r * 2.2, r * 2.2 * h), f, 38, P(r * 1.8, r * 1.8 * h), f, 32),
    macro: C(P(r * 1.5, r * 1.5 * h), f, 30, P(r * 1.15, r * 1.15 * h), f, 22),
    crowd: C([f[0] + r * 0.6, f[1] + r * 2.6, f[2] + r * 2.4], f, 42, [f[0] + r * 0.3, f[1] + r * 2.2, f[2] + r * 1.9], f, 38),
  };
}
// câmeras dos ácaros-herói em torno de um ponto
export function heroCams(spot, sign) {
  const look = add(spot, [0.05, 0.14, 0]);
  const o = {
    hero: C(add(spot, [0, 0.5, 1.0]), look, 38, add(spot, [0.1, 0.42, 0.8]), look, 32),
    heroSide: C(add(spot, [1.0, 0.45, 0.5]), look, 42, add(spot, [0.8, 0.4, 0.4]), look, 36),
  };
  if (sign) o.sign = C(add(spot, [0, 0.5, 1.0]), look, 44, add(sign, [0, -0.2, 1.1]), sign, 40);
  return o;
}

// câmeras do rosto do Tito de pé, a partir da posição da cabeça
export function faceCams(head, dist = 2.0) {
  return {
    face: C(add(head, [0, 0.25, dist]), head, 40, add(head, [0, 0.15, dist * 0.8]), head, 34),
    faceFar: C(add(head, [0.9, 0.3, dist * 1.15]), head, 44, add(head, [0.7, 0.25, dist]), head, 40),
  };
}

export function std(o) {
  const T = o.tito || 'stand', t = o.tags, sp = o.spot, lv = o.lv || { s1: '1 SEMANA', s2: '1 MÊS', s3: '1 ANO', n1: 7, n2: 30, n3: 365 };
  const stampShake = (c) => Math.max(0, 1 - (c.lt - 0.1) * 5) * 0.05;
  const titoPose = T === 'lie' ? { sleep: 1, smile: 0.7 } : { smile: 0.8 };
  const hs = o.heroScale ?? 1;
  const H = (i, extra = {}) => [i, { pos: [sp[0] + (extra.dx || 0), sp[1], sp[2] + (extra.dz || 0)], ry: 0.15, mood: 'happy', ...extra, scale: (extra.scale ?? 1.4) * hs }];
  const door = o.door; // { x, z }
  const check = o.steps.map(s => ({ text: s.text, sub: s.sub, line: 'L14', word: s.word }));
  return {
    L01: [
      { open: 1, lvl: 'clean', cam: 'item', hud: [['open']] },
      { lvl: 'clean', cam: 'wide', tito: T, pose: titoPose, hud: [['led', 0, 0]] },
      { lvl: 'clean', cam: 'calendar', cal: [0, 1, 'DIA'], flip: [0, 1], tr: 'zoom' },
    ],
    L02: [
      { lvl: 'clean', cam: 'face', tito: T, pose: { surprise: 1, smile: 0 }, p: { sweat: 0.35 }, hud: [['thought', 'q', 780, 480]], tr: 'whip' },
      { lvl: 'clean', cam: 'room', tito: T, pose: titoPose, hud: [['tag', t.use[0], { dot: 'gold', sub: t.use[1], size: 46 }]], tr: 'zoom' },
    ],
    L03: [{ lvl: 1, cam: 'wide3', tito: T, pose: titoPose, a: { dirt: [0.05, 0.3], mites: [0, 0.2] }, shake: stampShake, tr: 'whip', hud: [['stamp', 'NÍVEL 1', lv.s1], ['led', 0, lv.n1]] }],
    L04: [
      { lvl: 1, cam: 'itemClose', tito: T === 'lie' ? 'lie' : null, pose: titoPose, p: { steamAmt: o.wet ? 0.8 : 0, sweat: T === 'lie' ? 1 : 0 }, hud: [['tag', t.a[0], { dot: 'blue', sub: t.a[1] }]] },
      { lvl: 1, cam: 'itemClose', p: { flakes: 1 }, hud: [['badge', 'CÂMERA LENTA 0,1x', 'slow'], ['tag', t.b[0], { dot: 'orange', sub: t.b[1], y: 640 }]] },
      { lvl: 1, cam: 'macro', p: { flakes: 1, dirt: 0.5 }, hud: [['lens']], tr: 'zoom' },
    ],
    L05: [
      { lvl: 1, cam: 'hero', p: { dirt: 0.5 }, h: [H(3, { scale: 1.5, mood: 'sly' })], tr: 'whip' },
      { lvl: 1, cam: 'heroSide', p: { dirt: 0.5, mites: 0.35, flakes: 0.5 }, h: [H(1, { dx: -0.1, scale: 1.3, mood: 'cheer' }), H(4, { dx: 0.15, dz: 0.1, scale: 1.3, mood: 'hungry' })], hud: [['thought', o.icons[0], 280, 540, { tail: 'right', scale: 0.8 }], ['thought', 'fork', 800, 520, { delay: 0.3, scale: 0.8 }]] },
      { lvl: 1, cam: 'crowd', p: { dirt: 0.5, flakes: 0.3 }, a: { mites: [0.05, 1] }, tr: 'zoom', hud: [['counter', t.germ, 10, 1000], ['fly', 7]] },
    ],
    L06: [{ lvl: 2, cam: 'wide2', tito: T === 'lie' ? null : null, a: { dirt: [0.5, 0.65] }, p: { mites: 0.6 }, shake: stampShake, tr: 'whip', hud: [['stamp', 'NÍVEL 2', lv.s2, { color: '#FF9A3D' }], ['led', lv.n1, lv.n2]] }],
    L07: [
      { lvl: 2, cam: 'hero', p: { kitchen: 1, mites: 0.3 }, h: [H(0, { scale: 1.4, mood: 'cheer' })], tr: 'whip' },
      { lvl: 2, cam: 'sign', p: { kitchen: 1, neon: 1, lamp: 0.4, mites: 0.3 }, h: [H(0, { scale: 1.2, mood: 'cheer' })] },
      { lvl: 2, cam: 'heroSide', p: { kitchen: 1, neon: 1, lamp: 0.4, mites: 0.5 }, h: [H(3, { dx: -0.25, ry: Math.PI / 2, scale: 1.1, mood: 'hungry' }), H(1, { dx: -0.05, ry: Math.PI / 2, scale: 1.1, mood: 'hungry' }), H(4, { dx: 0.15, ry: Math.PI / 2, scale: 1.1, mood: 'hungry' })] },
      { lvl: 2, cam: 'hero', p: { kitchen: 1, neon: 1, lamp: 0.5, mites: 0.4, shower: o.wet ? 1 : 0 }, h: [H(0, { scale: 1.3, mood: 'cheer', ry: 0.3 }), H(3, { dx: 0.3, scale: 1.2, ry: -0.5 })], tr: 'whip' },
    ],
    L08: [
      { lvl: 2, cam: 'itemClose', p: { stink: 1, mites: 0.5 }, hud: [['tag', t.s[0], { dot: 'green', sub: t.s[1] }]], tr: 'whip' },
      { lvl: 2, cam: 'face', tito: T === 'lie' ? 'lie' : 'stand', pose: { shake: 1, surprise: 0.3 }, p: { mites: 0.5 }, hud: [['tag', t.s[2], { dot: 'red', size: 56 }]] },
      { lvl: 2, cam: 'faceFar', tito: T === 'lie' ? 'lie' : 'stand', pose: { surprise: 1, scared: 0.6 }, p: { mites: 0.6 }, tr: 'flash', shake: (c) => Math.max(0, 1 - Math.max(0, c.lt - 0.2) * 2) * 0.09,
        fn: (w, c) => { if (c.lt > 0.2 && !w._f.puff) { w._f.puff = 1; w.puff(w.headPos, 120, 1.6); } w.state.dust = c.lt > 0.2 && c.lt < 1.2 ? 1 : 0; },
        hud: [['pop', 'ATCHIM!', 540, 420, { delay: 0.15 }], ['mark', 'no', 800, 620, 64], ['tag', t.s[3], { dot: 'red', x: 380, y: 620, size: 48 }]] },
    ],
    L09: [
      { lvl: 2, cam: 'tower', p: { mites: 0.9, mood: 0.45, dirt: 0.75 }, a: { city: [0, 1] }, tr: 'whip', hud: [['counter', t.germ, 1000, 100000, { step: 1000, pow: 1.5 }]] },
      { lvl: 2, cam: 'wide2', p: { mites: 1, mood: 0.5, dirt: 0.8, city: 1 }, hud: [['cta']] },
      { lvl: 2, cam: 'calendar', calRun: [30, 9], a: { mood: [0.55, 0.9], dirt: [0.8, 1] }, tr: 'zoom', hud: [['tint', [70, 130, 30], (c) => c.u * 0.6]] },
    ],
    L10: [
      { lvl: 3, cam: 'wide', tr: 'flash', shake: stampShake, p: { stink: 0.6 }, hud: [['tint', [60, 110, 20], 0.55], ['stamp', 'NÍVEL 3', lv.s3, { color: '#FF5A4D' }]] },
      { lvl: 3, cam: 'item', hud: [['tint', [60, 110, 20], 0.55], ['ledBig', lv.n2, lv.n3]], shake: 0.012 },
    ],
    L11: [
      { lvl: 3, cam: 'macro', tr: 'whip', hud: [['tint', [60, 110, 20], 0.5], ['tag', t.bad[0], { dot: 'green', size: 56, y: 640 }]] },
      { lvl: 3, cam: 'itemClose', p: { mites: 0.3 }, hud: [['tint', [60, 110, 20], 0.5], ['tag', t.bad[1], { dot: 'orange', size: 56, y: 640 }]] },
      { lvl: 3, cam: 'crowd', p: { miteScale: 1.0 }, tr: 'whip', hud: [['tint', [60, 110, 20], 0.5], ['badge', 'CÂMERA LENTA 0,05x', 'slow'], ['tag', t.bad[2], { dot: 'gold', size: 46, y: 640 }]] },
      { lvl: 3, cam: 'wide2', p: { stink: 1 }, hud: [['tint', [70, 130, 20], 0.7], ['tag', t.bad[3], { dot: 'green', size: 56, y: 640 }]] },
    ],
    L12: [
      { lvl: 3, cam: 'door', tr: 'whip', p: { doorOpen: 1 }, tito: [door.x, door.z, -Math.PI / 2], pose: { cover: 1, scared: 0.8 }, hud: [['tint', [70, 130, 20], 0.5]] },
      { lvl: 3, cam: 'doorWide', p: { doorOpen: 1 }, tito: [door.x, door.z, -Math.PI / 2], pose: { cover: 1, scared: 0.8 },
        fn: (w, c) => { const out = Math.max(0, Math.min(1, (c.lt - 0.15) / 1.0)); w.setTitoStanding(door.x + 0.5 * out, door.z, -Math.PI / 2); w.tito.pose.walk = out > 0 && out < 1 ? 1 : 0; w.state.doorOpen = 1 - Math.max(0, Math.min(1, (c.lt - 1.0) / 0.2)); },
        hud: [['tint', [70, 130, 20], 0.5], ['mark', 'no', 540, 620, 78]] },
    ],
    L13: [
      { lvl: 3, cam: 'wide', tr: 'glitch', a: { dirt: [1, 0.4], mold: [1, 0], mood: [1, 0], flies: [1, 0], stink: [1, 0], mites: [1, 0.2] }, hud: [['rewind'], ['badge', 'REBOBINANDO', 'rew'], ['tint', [70, 130, 20], (c) => 0.55 * (1 - c.u)]] },
      { lvl: 'bright', cam: 'itemClose', p: { dirt: 0.4, mites: 0.4 }, a: { fresh: [0, 1] }, tr: 'whip', h: [[2, { pos: [sp[0] + 0.15, sp[1], sp[2] + 0.1], ry: 1.2, scale: 1.3, mood: 'scared' }]], hud: [['badge', 'CÂMERA LENTA 0,1x', 'slow']] },
      { lvl: 'bright', cam: 'crowd', p: { dirt: 0.4, mites: 0.7, miteRun: 1, fresh: 1 }, a: { flee: [0, 1] },
        fn: (w, c) => { const f = w.state.flee; w.hero(2, { pos: [sp[0] + f * 3.4, 0.03 + (1 - f) * Math.max(0, sp[1] - 0.03), sp[2] + 0.1 - f * 0.3], ry: Math.PI / 2, scale: 1.4, mood: 'scared', run: 1 }); w.hero(3, { pos: [sp[0] - f * 3.2, 0.03 + (1 - f) * Math.max(0, sp[1] - 0.03), sp[2] + 0.1], ry: -Math.PI / 2, scale: 1.2, mood: 'scared', run: 1 }); } },
    ],
    L14: [
      { lvl: 'fresh', cam: 'item', tr: 'zoom', hud: [['checklist', check]] },
      { lvl: 'fresh', cam: 'calendar', cal: o.cal || [7, 14, 'SEMANAL'], flip: [0.2, 0.9], hud: [['checklist', check]], tr: 'zoom' },
      { lvl: 'fresh', cam: 'sunny', tr: 'whip', hud: [['checklist', check]] },
    ],
    L15: [
      { lvl: 'fresh', cam: 'sunny', p: { dust: 0.15 }, tr: 'whip', hud: [['mark', 'ok', 540, 600, 74], ['tag', t.good, { dot: 'green', y: 760, size: 52 }]] },
      { lvl: 'fresh', cam: o.goodCam || 'itemClose', tito: T === 'lie' ? 'lie' : 'stand', pose: T === 'lie' ? { sleep: 1, smile: 1 } : { smile: 1 }, p: { lamp: T === 'lie' ? 0.7 : 0.2, day: T === 'lie' ? 0 : 1, shower: o.wet ? 1 : 0, steamAmt: o.wet ? 0.5 : 0 },
        hud: [['thought', o.goodIcon || 'heart', 800, 520, { scale: 0.8 }], ...(T === 'lie' ? [['zzz', 560, 1060]] : [])] },
      { lvl: 'fresh', cam: 'stand', tito: 'stand', pose: { smile: 1 }, pa: { wave: [0, 1] }, tr: 'flash' },
    ],
    L16: [
      { lvl: 'fresh', cam: 'calendar', cal: ['?', '?', 'ÚLTIMA VEZ'], tr: 'whip', hud: [['thought', 'q', 540, 520], ['tag', 'QUANDO FOI A ÚLTIMA VEZ?', { dot: 'gold', y: 760, size: 40 }]] },
      { lvl: 'fresh', cam: 'stand', tito: 'stand', pose: { smile: 1 }, pa: { wave: [0, 1] }, tr: 'zoom', hud: [['chip', 'COMENTA AÍ 💬', { delay: 0.8 }]] },
    ],
  };
}
