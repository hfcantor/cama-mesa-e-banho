import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { alignToRegions, charsToWords, espeak, synthesize } from '@hfr/voice';

test('alignToRegions skips silences and keeps order', () => {
  const words = alignToRegions(['aa', 'bb', 'cc', 'dd'], [{ start: 0, end: 1 }, { start: 2, end: 3 }]);
  assert.equal(words.length, 4);
  assert.equal(words[0]!.start, 0);
  assert.equal(words[2]!.start, 2); // third word starts after the pause
  assert.equal(words[3]!.end, 3);
  for (const w of words) assert.ok(!(w.start > 1 && w.start < 2), `${w.text} starts inside the silence`);
});

test('charsToWords converts ElevenLabs character alignment', () => {
  const chars = 'Oi tudo'.split('');
  const w = charsToWords({ characters: chars, character_start_times_seconds: chars.map((_, i) => i * 0.1), character_end_times_seconds: chars.map((_, i) => i * 0.1 + 0.1) });
  assert.deepEqual(w.map((x) => [x.text, Math.round(x.start * 10), Math.round(x.end * 10)]), [['Oi', 0, 2], ['tudo', 3, 7]]);
});

test('espeak-ng synthesis with aligned word timings (skipped when not installed)', async (t) => {
  if (!(await espeak.available()).ok) { t.skip('espeak-ng not installed'); return; }
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hfr-tts-'));
  const r = await synthesize({ text: 'one two three', out: path.join(dir, 'a.wav'), provider: 'espeak', voice: 'en' });
  assert.equal(r.words.length, 3);
  assert.ok(r.duration > 0.5);
  assert.ok(r.words[2]!.end <= r.duration + 0.01);
});
