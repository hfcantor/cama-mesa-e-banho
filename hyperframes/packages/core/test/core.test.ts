import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTimeValue, resolveTimings, TimingError, findTrackOverlaps, frameCount, formatClock,
  evaluateEffects, parseTransitionSpec, parseKeyframes, sampleKeyframes, kenBurnsKeyframes, stateToCss,
  groupWords, pageAt, distributeWords, wordVisual, getEasing, cubicBezier,
  parseComposition, editClipAttributes, safeJoin, sceneOffsets, validateManifest, particlesAt, randomAt,
} from '@hfr/core';

test('parseTimeValue handles units and clock formats', () => {
  assert.equal(parseTimeValue('2'), 2);
  assert.equal(parseTimeValue('2.5s'), 2.5);
  assert.equal(parseTimeValue('500ms'), 0.5);
  assert.equal(parseTimeValue('90f', 30), 3);
  assert.equal(parseTimeValue('1.5m'), 90);
  assert.equal(parseTimeValue('01:02.5'), 62.5);
  assert.equal(parseTimeValue('1:00:00'), 3600);
  assert.equal(parseTimeValue('intro.end'), null);
  assert.equal(formatClock(62.5), '01:02.500');
});

test('resolveTimings supports references, prev, end and media durations', () => {
  const t = resolveTimings([
    { id: 'a', start: '0', duration: '2' },
    { id: 'b', start: 'a.end + 0.5', duration: '1' },
    { id: 'c', start: 'prev.start', end: '6' },
    { id: 'm', start: '1', mediaDuration: 10, mediaStart: 4 },
    { id: 'z', start: 'b' },
  ], { fps: 30, compositionDuration: 8 });
  assert.deepEqual(t.map((x) => [x.id, x.start, x.end]), [['a', 0, 2], ['b', 2.5, 3.5], ['c', 2.5, 6], ['m', 1, 7], ['z', 3.5, 8]]);
});

test('resolveTimings rejects cycles, unknown refs, negative durations', () => {
  assert.throws(() => resolveTimings([{ id: 'a', start: 'b.end', duration: '1' }, { id: 'b', start: 'a.end', duration: '1' }]), TimingError);
  assert.throws(() => resolveTimings([{ id: 'a', start: 'nope.end', duration: '1' }]), /unknown reference/);
  assert.throws(() => resolveTimings([{ id: 'a', start: '2', end: '1' }]), /negative/);
  assert.throws(() => resolveTimings([{ id: 'a', start: '0' }]), /cannot determine duration/);
});

test('track overlaps and frame counts', () => {
  const t = resolveTimings([{ id: 'a', start: '0', duration: '2', track: '1' }, { id: 'b', start: '1', duration: '2', track: '1' }, { id: 'c', start: '1', duration: '2', track: '2' }]);
  assert.equal(findTrackOverlaps(t).length, 1);
  assert.equal(frameCount(2, 30), 60);
  assert.equal(frameCount(0.01, 30), 1);
});

test('effects: presets, keyframes, ken burns', () => {
  const enter = parseTransitionSpec('fade-up 1 linear')!;
  assert.deepEqual([enter.preset, enter.duration, enter.easing], ['fade-up', 1, 'linear']);
  assert.equal(parseTransitionSpec('explode 1'), null);
  const ctx = { width: 1920, height: 1080 };
  const at0 = evaluateEffects({ enter }, 0, 5, ctx);
  const atHalf = evaluateEffects({ enter }, 0.5, 5, ctx);
  const at1 = evaluateEffects({ enter }, 1, 5, ctx);
  assert.equal(at0.opacity, 0);
  assert.equal(atHalf.opacity, 0.5);
  assert.equal(at1.opacity, 1);
  assert.equal(at1.y, 0);
  const exit = parseTransitionSpec('fade 1 linear')!;
  assert.equal(evaluateEffects({ exit }, 4.5, 5, ctx).opacity, 0.5);
  const kfs = parseKeyframes('[{"t":0,"scale":1},{"t":2,"scale":2,"ease":"linear"}]')!;
  assert.equal(sampleKeyframes(kfs, 1).scale, 1.5);
  assert.equal(sampleKeyframes(kfs, 5).scale, 2);
  assert.equal(kenBurnsKeyframes('out 0.2', 4)[0]!.scale, 1.2);
  assert.match(stateToCss(evaluateEffects({ enter: parseTransitionSpec('iris 1 linear') }, 0.5, 5, ctx))['clip-path']!, /^circle\(/);
});

test('easing curves are bounded and cubic-bezier matches linear', () => {
  for (const n of ['out-cubic', 'in-out-expo', 'out-bounce', 'linear']) {
    assert.equal(Math.round(getEasing(n)(0) * 1000), 0);
    assert.equal(Math.round(getEasing(n)(1) * 1000), 1000);
  }
  const lin = cubicBezier(0, 0, 1, 1);
  assert.ok(Math.abs(lin(0.37) - 0.37) < 1e-4);
});

test('captions: grouping, lookup, styles', () => {
  const words = distributeWords('one two three four five six seven. eight', 0, 4);
  assert.equal(words.length, 8);
  assert.ok(words.every((w, i) => i === 0 || w.start >= words[i - 1]!.end - 1e-9));
  const pages = groupWords(words, { maxWords: 3 });
  assert.ok(pages.length >= 3);
  assert.equal(pageAt(pages, 0)?.words[0]?.text, 'one');
  assert.equal(pageAt(pages, 99), null);
  assert.equal(wordVisual('pop', { text: 'x', start: 1, end: 2 }, 0.5).visible, false);
  assert.equal(wordVisual('karaoke', { text: 'x', start: 1, end: 2 }, 1.5).fill, 0.5);
});

const HTML = `<!doctype html><html><head><style>.a{color:red}</style></head><body>
<div data-composition data-width="1280" data-height="720" data-fps="25" data-duration="6">
  <h1 id="title"   data-start="0" data-duration="2" class="x">Hi</h1>
  <img src="a.png" data-start="title.end">
  <audio src="m.mp3" data-volume="0.5" data-fade-out="1"></audio>
  <div data-hf-captions="c.json"></div>
</div><script src="/__hf/lib/gsap.js"></script><script>gsap.to('#title',{x:1})</script></body></html>`;

test('parseComposition reads config, clips, assets and libraries', () => {
  const c = parseComposition(HTML);
  assert.equal(c.hasRoot, true);
  assert.deepEqual([c.config.width, c.config.height, c.config.fps, c.config.duration], [1280, 720, 25, 6]);
  assert.deepEqual(c.clips.map((x) => [x.id, x.kind]), [['title', 'element'], ['clip-1', 'image'], ['clip-2', 'audio'], ['clip-3', 'captions']]);
  assert.equal(c.clips[2]!.volume, 0.5);
  assert.equal(c.clips[2]!.fadeOut, 1);
  assert.deepEqual(c.assets.map((a) => a.ref).sort(), ['/__hf/lib/gsap.js', 'a.png', 'c.json', 'm.mp3'].sort());
  assert.deepEqual(c.libraries, ['gsap']);
});

test('editClipAttributes changes only the targeted attributes', () => {
  const out = editClipAttributes(HTML, 'title', { 'data-start': '1.5', 'data-track': '3', class: null });
  assert.match(out, /<h1 id="title"   data-start="1\.5" data-duration="2" data-track="3">Hi<\/h1>/);
  assert.equal(out.replace(/<h1[^>]*>/, ''), HTML.replace(/<h1[^>]*>/, ''));
  const auto = editClipAttributes(HTML, 'clip-1', { 'data-duration': '3' });
  assert.match(auto, /<img src="a\.png" data-start="title\.end" data-duration="3">/);
  assert.throws(() => editClipAttributes(HTML, 'missing', { a: 'b' }), /not found/);
  assert.throws(() => editClipAttributes(HTML, 'title', { 'on click': 'x' }), /invalid attribute/);
});

test('safeJoin refuses traversal', () => {
  assert.equal(safeJoin('/p', 'a/b.html'), '/p/a/b.html');
  assert.throws(() => safeJoin('/p', '../etc/passwd'));
  assert.throws(() => safeJoin('/p', 'a/../../x'));
  assert.equal(safeJoin('/p', '/abs.png'), '/p/abs.png');
});

test('manifest validation and scene offsets', () => {
  assert.throws(() => validateManifest({ name: 'x', scenes: [{ src: 'a.html', transition: { type: 'fade', duration: 1 } }] }), /scenes\[0\]/);
  assert.throws(() => validateManifest({ name: 'x', entry: 'a', scenes: [{ src: 'b' }] }), /either/);
  assert.equal(validateManifest({ name: 'ok', width: 100 }).name, 'ok');
  assert.deepEqual(sceneOffsets([3, 3, 3], [undefined, 1, 0.5]), { offsets: [0, 2, 4.5], total: 7.5 });
});

test('particles and random are deterministic', () => {
  const o = { preset: 'confetti' as const, count: 5, width: 100, height: 100, seed: 3, colors: ['#fff'], speed: 1 };
  assert.deepEqual(particlesAt(o, 1.25), particlesAt(o, 1.25));
  assert.notDeepEqual(particlesAt(o, 1.25), particlesAt(o, 1.3));
  assert.equal(randomAt(1, 2), randomAt(1, 2));
});
