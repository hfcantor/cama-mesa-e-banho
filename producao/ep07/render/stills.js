const { chromium } = require('playwright'); const fs=require('fs'), path=require('path');
(async()=>{
  const S = JSON.parse(fs.readFileSync(path.join(__dirname,'..','schedule.json')));
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1080,height:1920}});
  p.on('pageerror', e=>console.log('ERR', e.message)); p.on('console', m=>{ if(m.type()==='error') console.log('CONSOLE', m.text()); });
  await p.goto('file://'+path.join(__dirname,'index.html'));
  await p.evaluate(s=>{ S=s; makeGrain(); }, S);
  await p.evaluate(async()=>{ await Promise.all(Object.keys(IMG3D).map(k=>{ const im=new Image(); im.src=img3dSrc(k); return im.decode(); })); });
  const out = process.argv[2]||'stills'; fs.mkdirSync(out,{recursive:true});
  const ids = process.argv[3] ? process.argv[3].split(',') : null;
  for (const bt of S.beats){ if (ids && !ids.includes(bt.id)) continue;
    const frac = parseFloat(process.argv[4]||'0.6'); const t = bt.t0 + bt.dur*frac;
    const t0=Date.now(); await p.evaluate(t=>render(t), t);
    await p.screenshot({path:`${out}/${bt.id}.jpg`, type:'jpeg', quality:80}); console.log(bt.id, Date.now()-t0,'ms'); }
  await b.close();
})();
