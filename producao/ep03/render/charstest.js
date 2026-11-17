const { chromium } = require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
  p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+path.join(__dirname,'index.html'));
  await p.evaluate(()=>{ S={fps:30,total:10,beats:[]}; makeGrain(); });
  const list = process.argv.slice(3);
  for (const spec of list){ const [id,bg,expr,mouth]=spec.split(':');
    await p.evaluate(([id,bg,expr,mouth])=>{ const B={t0:0,dur:4,lines:[],shot:{type:'bust',char:id,bg,expr,cam:'push'}};
      document.getElementById('stage').innerHTML = `<defs>${defs()}</defs>`+shotBust(B.shot,2,B,2).replace('mouth:0','');
      if (+mouth) document.getElementById('stage').innerHTML = `<defs>${defs()}</defs>`+(()=>{ const sh=B.shot; return shotBust(sh,2,{...B,lines:[{speaker:id,t0:0,dur:4,mouth:Array(200).fill(+mouth)}]},2); })();
    },[id,bg,expr,mouth||'0']);
    await p.screenshot({path:`${process.argv[2]}/${spec.replace(/:/g,'_')}.jpg`,type:'jpeg',quality:80});
  }
  await b.close();
})();
