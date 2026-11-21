const { chromium } = require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
  p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+path.join(__dirname,'index.html'));
  await p.evaluate(()=>{ S={fps:30,total:10,ep:'EP. 7',beats:[]}; makeGrain(); });
  await p.evaluate(async()=>{ await Promise.all(Object.keys(IMG3D).map(k=>{ const im=new Image(); im.src=img3dSrc(k); return im.decode(); })); });
  for (const [id,bg] of [['rafael','house'],['keliane','house'],['bruno','bar'],['sandro','bar'],['jessica','port'],['diego','port']]){
    await p.evaluate(([id,bg])=>{ const B={t0:0,dur:4,lines:[],shot:{type:'bust',char:id,bg,cam:'push'}}; document.getElementById('stage').innerHTML=`<defs>${defs()}</defs>`+shotBust(B.shot,2,B,2); },[id,bg]);
    await p.screenshot({path:`../t3d_${id}.jpg`,type:'jpeg',quality:80});
  }
  await b.close();
})();
