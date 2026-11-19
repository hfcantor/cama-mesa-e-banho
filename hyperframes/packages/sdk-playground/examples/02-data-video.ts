/** Data-driven video: one animated bar per record, GSAP timeline registered for seeking. */
import { Composition, h } from '@hfr/sdk';

const data = [
  { label: 'Brasil', value: 214 },
  { label: 'México', value: 128 },
  { label: 'Colômbia', value: 52 },
  { label: 'Argentina', value: 46 },
  { label: 'Peru', value: 34 },
];
const max = Math.max(...data.map((d) => d.value));

const comp = new Composition({ name: 'data', width: 1280, height: 720, duration: 5, background: '#0f172a' }).use('gsap');
comp.add(h('h2', { start: 0, enter: 'fade-down 0.6', style: { position: 'absolute', left: 80, top: 50, margin: 0, color: '#fff', fontSize: 48 } }, 'População (milhões)'));
data.forEach((d, i) => {
  comp.add(h('div', { class: 'row', style: { position: 'absolute', left: 80, top: 160 + i * 100, width: 1120, height: 70, display: 'flex', alignItems: 'center', gap: 20 } },
    h('span', { style: { width: 200, color: '#cbd5e1', fontSize: 30 } }, d.label),
    h('div', { class: 'bar', style: { height: 54, width: (d.value / max) * 760, background: `hsl(${190 + i * 25} 85% 60%)`, borderRadius: 10, transformOrigin: '0 50%' } }),
    h('b', { class: 'num', style: { color: '#fff', fontSize: 30 } }, String(d.value))));
});
comp.script(`
  const tl = gsap.timeline({ paused: true });
  tl.from('.bar', { scaleX: 0, duration: 1, ease: 'power3.out', stagger: 0.15 }, 0.4)
    .from('.num', { opacity: 0, x: -20, duration: 0.4, stagger: 0.15 }, 0.9);
  hf.register(tl);
`);
const r = await comp.render('out/02-data.mp4', { quality: 'draft' });
console.log(`${r.output} ${r.duration}s`);
