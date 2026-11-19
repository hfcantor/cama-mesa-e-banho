import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { addItemToComposition, fillTemplate, instantiateTemplate, loadRegistry, resolveParams, searchRegistry } from '@hfr/registry';
import { parseComposition } from '@hfr/core';

test('built-in registry loads blocks and templates', async () => {
  const items = await loadRegistry();
  assert.ok(items.filter((i) => i.type === 'template').length >= 9);
  assert.ok(items.filter((i) => i.type !== 'template').length >= 15);
  assert.ok(searchRegistry(items, 'gsap').length >= 3);
});

test('params are validated and escaped', async () => {
  const lt = (await loadRegistry()).find((i) => i.name === 'lower-third')!;
  assert.throws(() => resolveParams(lt, { start: 'abc' }), /number/);
  assert.throws(() => resolveParams(lt, { nope: '1' }), /unknown param/);
  assert.equal(fillTemplate('<b>{{title}}</b> {{uid}}', { title: '<script>"x"' }, 'u1'), '<b>&lt;script&gt;&quot;x&quot;</b> u1');
});

test('template instantiation + block insertion produce a valid composition', async () => {
  const items = await loadRegistry();
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hfr-reg-'));
  await instantiateTemplate(items.find((i) => i.name === 'blank')!, dir, { title: 'Test <&>' });
  const before = parseComposition(await readFile(path.join(dir, 'index.html'), 'utf8'));
  const r = await addItemToComposition(dir, 'index.html', items.find((i) => i.name === 'logo-reveal')!, { start: '1' });
  assert.deepEqual(r.copied, ['assets/registry/hf-logo.svg']);
  await stat(path.join(dir, 'assets/registry/hf-logo.svg'));
  await addItemToComposition(dir, 'index.html', items.find((i) => i.name === 'lower-third')!, {});
  await addItemToComposition(dir, 'index.html', items.find((i) => i.name === 'lower-third')!, { title: 'Second' });
  const html = await readFile(path.join(dir, 'index.html'), 'utf8');
  const after = parseComposition(html);
  assert.equal(after.clips.length, before.clips.length + 3);
  assert.equal(html.match(/\/__hf\/lib\/gsap\.js/g)?.length, 1, 'library added once');
  assert.equal(html.match(/data-hf-registry="lower-third"/g)?.length, 1, 'head styles added once');
  assert.match(html, /Test &lt;&amp;&gt;/);
  await writeFile(path.join(dir, 'x.html'), '<html><body>no root</body></html>');
  await assert.rejects(addItemToComposition(dir, 'x.html', items.find((i) => i.name === 'title-card')!, {}), /no \[data-composition\]/);
});
