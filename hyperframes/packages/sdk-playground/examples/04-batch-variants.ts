/** Renders personalised variants sharing one Chromium instance (batch / templated video). */
import { Composition, h, launchBrowser } from '@hfr/sdk';

const people = ['Ana', 'Bruno', 'Carla'];
const browser = await launchBrowser();
try {
  for (const name of people) {
    const comp = new Composition({ name: `welcome-${name.toLowerCase()}`, width: 960, height: 540, duration: 3, background: '#052e16' });
    comp.add(h('h1', { start: 0.1, enter: 'pop 0.6', style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', margin: 0, color: '#bbf7d0', fontSize: 90 } }, `Olá, ${name}!`));
    comp.particles('confetti', { count: 90, seed: name.length * 7 });
    const r = await comp.render(`out/04-${name.toLowerCase()}.mp4`, { browser, quality: 'draft' });
    console.log(`${r.output} ${r.timings.totalMs} ms`);
  }
} finally {
  await browser.close();
}
