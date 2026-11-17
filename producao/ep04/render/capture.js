const { chromium } = require('playwright'); const fs=require('fs'), path=require('path'), {spawn}=require('child_process');
(async()=>{
  const [,, a, b, out] = process.argv; const A=+a, B=+b;
  const S = JSON.parse(fs.readFileSync(path.join(__dirname,'..','schedule.json')));
  const br = await chromium.launch(); const p = await br.newPage({viewport:{width:1080,height:1920}});
  p.on('pageerror', e=>console.log('ERR', e.message));
  await p.goto('file://'+path.join(__dirname,'index.html'));
  await p.evaluate(s=>{ S=s; makeGrain(); }, S);
  const ff = spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r','30',out]);
  ff.stderr.on('data',d=>process.stderr.write(d));
  const t0=Date.now();
  for (let f=A; f<B; f++){
    await p.evaluate(t=>render(t), f/30);
    const buf = await p.screenshot({type:'jpeg', quality:92});
    if (!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
    if ((f-A)%150===0) console.log(out, f, ((Date.now()-t0)/(f-A+1)).toFixed(0)+'ms/frame');
  }
  ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await br.close(); console.log('done', out);
})();
