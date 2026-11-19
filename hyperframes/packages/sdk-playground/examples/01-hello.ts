/** Builds a composition in code and renders it. Run: node examples/01-hello.ts */
import { Composition, h } from '@hfr/sdk';

const comp = new Composition({ name: 'hello', width: 1280, height: 720, fps: 30, duration: 4, background: '#0b1020' });

comp
  .particles('stars', { count: 120, colors: ['#ffffff', '#a78bfa'] })
  .add(
    h('h1', {
      start: 0.2, duration: 3.6, enter: 'fade-up 0.8 out-expo', exit: 'blur-in 0.5',
      style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', margin: 0, color: '#fff', fontSize: 110, fontWeight: 900, letterSpacing: '-0.04em' },
    }, 'Hello, frames'),
    h('p', {
      start: 0.9, end: 3.8, enter: 'fade 0.6',
      style: { position: 'absolute', bottom: 120, width: '100%', textAlign: 'center', color: '#a5b4fc', fontSize: 36, margin: 0 },
    }, 'built with @hfr/sdk'),
  );

const r = await comp.render('out/01-hello.mp4', { quality: 'draft' });
console.log(`${r.output} ${r.width}x${r.height} ${r.duration}s in ${r.timings.totalMs} ms`);
