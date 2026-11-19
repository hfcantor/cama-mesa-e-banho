/**
 * Narration + synced captions. Uses the first available TTS provider
 * (ElevenLabs/OpenAI when keys are set, otherwise espeak-ng or HFR_TTS_COMMAND).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { Composition, buildNarration, h } from '@hfr/sdk';

const dir = 'out/03-narrated.hfproject';
await mkdir(dir, { recursive: true });
const n = await buildNarration(
  [{ text: 'Every frame of this video is a web page.' }, { text: 'The captions follow the voice, word by word.' }],
  { outDir: `${dir}/assets/vo`, language: 'en' },
);
await writeFile(`${dir}/captions.json`, JSON.stringify(n.document));

const comp = new Composition({ name: 'narrated', width: 1080, height: 1920, duration: Math.ceil(n.duration + 1), background: '#111827' });
comp
  .add(h('div', { start: 0, kenburns: 'in 0.1', style: { position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#1e3a8a,#9333ea)' } }))
  .audio('assets/vo/narration.mp3', { start: 0 })
  .captions('captions.json', { captionStyle: 'pop', position: 'center', maxWords: 3, style: { fontSize: 96, fontWeight: 900 } });
await comp.write(dir);
const r = await comp.render('out/03-narrated.mp4', { projectDir: dir, quality: 'draft' });
console.log(`${r.output} ${r.duration}s, provider ${n.provider}, timings ${n.lines.map((l) => l.timing).join('/')}`);
