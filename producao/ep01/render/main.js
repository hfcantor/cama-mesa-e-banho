let S = null;
const FADES = { c1_phone:[.6,0], title:[.3,.35], c2_est:[.35,0], c4_rafael:[.5,0], c5_walk:[.6,0], c6_q:[.25,0], c6_end:[0,.8], c3_door:[0,0] };
const CAM = { push:[1.0,1.06,0,0], push_slow:[1.0,1.03,0,0], push_fast:[1.0,1.12,0,0], drift_l:[1.05,1.05,25,-25], drift_r:[1.05,1.05,-25,25], pull:[1.1,1.0,0,0] };

function defs(){
  let d = `<filter id="blurBg" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="9"/></filter>
  <linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050c"/><stop offset=".45" stop-color="#0a1230"/><stop offset=".62" stop-color="#1b2147"/><stop offset="1" stop-color="#14172a"/></linearGradient>
  <linearGradient id="roadN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121216"/><stop offset="1" stop-color="#2b241c"/></linearGradient>
  <radialGradient id="moonGlow"><stop offset="0" stop-color="#f3ecd5" stop-opacity=".35"/><stop offset="1" stop-color="#f3ecd5" stop-opacity="0"/></radialGradient>
  <radialGradient id="lampGlow"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".75"/><stop offset=".3" stop-color="#ffb35c" stop-opacity=".25"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
  <radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".9"/><stop offset=".35" stop-color="#ffb04a" stop-opacity=".25"/><stop offset="1" stop-color="#ffb04a" stop-opacity="0"/></radialGradient>
  <linearGradient id="wallB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2516"/><stop offset="1" stop-color="#22150b"/></linearGradient>
  <linearGradient id="doorWarm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf87"/><stop offset="1" stop-color="#d7853a"/></linearGradient>
  <linearGradient id="doorCold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4373"/><stop offset=".6" stop-color="#6d8fca"/><stop offset="1" stop-color="#a9c2ea"/></linearGradient>
  <linearGradient id="lockG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d2b4f"/><stop offset="1" stop-color="#4a1d3b"/></linearGradient>
  <linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9e2f2"/><stop offset=".5" stop-color="#5b7a95"/><stop offset="1" stop-color="#1c2a38"/></linearGradient>
  <linearGradient id="goldT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".55" stop-color="#e2b24c"/><stop offset="1" stop-color="#a8751f"/></linearGradient>
  <radialGradient id="ctaBg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#1a2233"/><stop offset="1" stop-color="#040506"/></radialGradient>
  <radialGradient id="screenGlow" cx=".5" cy=".46" r=".5"><stop offset="0" stop-color="#9fc1ff" stop-opacity=".22"/><stop offset="1" stop-color="#9fc1ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".7"/></radialGradient>
  <radialGradient id="vigWarm" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#1a0b00" stop-opacity="0"/><stop offset="1" stop-color="#1a0b00" stop-opacity=".65"/></radialGradient>
  <radialGradient id="vigCold" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#000514" stop-opacity="0"/><stop offset="1" stop-color="#000514" stop-opacity=".7"/></radialGradient>`;
  for (const id in CH) d += charDefs(id);
  return d;
}

function blinkAmt(id, t){
  const per = 3.3 + (id.length%3)*.7, off = id.charCodeAt(0)%7*.37;
  const x = (t+off)%per; return x<.15 ? Math.sin(x/.15*Math.PI) : 0;
}
function mouthAt(beat, speaker, t){
  for (const ln of beat.lines) if (ln.speaker===speaker && t>=ln.t0 && t<ln.t0+ln.dur){
    const i = Math.floor((t-ln.t0)*S.fps); return ln.mouth[Math.min(i, ln.mouth.length-1)]||0; }
  return 0;
}

function shotBust(sh, lt, B, t){
  const [z0,z1,x0,x1] = CAM[sh.cam||'push'], p = easeIO(clamp(lt/B.dur,0,1));
  const z = lerp(z0,z1,p), dx = lerp(x0,x1,p);
  const bgz = 1.08 + (z-1)*.4;
  let s = `<g transform="translate(${540-dx*.4},960) scale(${bgz}) translate(-540,-960)"><g filter="url(#blurBg)">${BG[sh.bg](t)}</g></g>`;
  const [gc,ga] = GRADE[sh.bg];
  s += `<rect width="1080" height="1920" fill="${gc}" opacity="${ga*.6}" style="mix-blend-mode:multiply"/>`;
  const m = mouthAt(B, sh.char, t);
  s += `<g transform="translate(${540+dx},1000) scale(${z*1.12}) translate(-540,-1000)">${charSVG(sh.char,{t:lt,mouth:m,expr:sh.expr,gaze:sh.gaze||0,rim:RIM[sh.bg],blink:blinkAmt(sh.char,t),uid:'b'})}`;
  if (false) s += `<g transform="translate(${180+Math.sin(lt*2)*6},1620) rotate(-15)"><rect x="-120" y="-60" width="240" height="320" rx="60" fill="${CH.rafael.skin}"/><rect x="-125" y="20" width="250" height="70" fill="#26272b"/><circle cx="0" cy="55" r="44" fill="#0f1115" stroke="#9aa0a6" stroke-width="6"/></g>`;
  s += `</g>`;
  s += `<rect width="1080" height="1920" fill="${gc}" opacity="${ga*.45}" style="mix-blend-mode:soft-light"/>`;
  return s;
}

function chunks(words){
  const out=[]; let cur=[];
  for (const w of words){
    const len=[...cur.map(x=>x.w), w.w].join(' ').length;
    if (cur.length && (cur.length>=3 || len>16)){ out.push(cur); cur=[]; }
    cur.push(w);
    if (/[.,!?…]$/.test(w.w)){ out.push(cur); cur=[]; }
  }
  if (cur.length) out.push(cur); return out;
}
function captions(t, beat){
  let ln=null;
  for (const b of S.beats) for (const l of b.lines) if (t>=l.t0-.05 && t<l.t0+l.dur+.2) ln=l;
  if (!ln) return '';
  const lt = t-ln.t0, ch = chunks(ln.words);
  let ci = ch.findIndex(c=>lt < c[c.length-1].b); if (ci<0) ci = ch.length-1;
  const c = ch[ci], start = c[0].a, pop = 1+.08*(1-clamp((lt-start)/.09,0,1));
  const y = ['bust'].includes(beat.shot.type) ? 1395 : 1690;
  let tsp = c.map(w=>{ const on = lt>=w.a && lt<w.b+.05; return `<tspan fill="${on?'#5dff3a':'#ffffff'}">${esc(w.w)}</tspan>`; }).join('<tspan> </tspan>');
  return `<g transform="translate(540,${y}) scale(${pop})"><text x="0" y="0" text-anchor="middle" font-family="Inter" font-weight="900" font-size="72" stroke="#000" xml:space="preserve" stroke-width="14" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${tsp}</text></g>`;
}

function render(t){
  let B = S.beats[S.beats.length-1];
  for (const b of S.beats) if (t>=b.t0 && t<b.t0+b.dur){ B=b; break; }
  const lt = t-B.t0, sh=B.shot;
  let body = sh.type==='bust' ? shotBust(sh,lt,B,t) : SHOTS[sh.type](sh,lt,B,{blink:blinkAmt});
  // tremor no impacto final
  if (B.id==='c5_diego' && lt>B.dur-.25) body = `<g transform="translate(${Math.sin(t*90)*8},${Math.cos(t*70)*6})">${body}</g>`;
  let s = `<defs>${defs()}</defs>${body}`;
  if (!['title','card','cta','continua'].includes(sh.type)) {
    s += `<rect width="1080" height="1920" fill="url(#vig)"/>`;
    s += `<text x="44" y="92" font-family="Inter" font-weight="900" font-size="30" letter-spacing="3" fill="#fff" opacity=".7">SEGREDOS DO TABOCAL</text><text x="1036" y="92" text-anchor="end" font-family="Inter" font-weight="800" font-size="30" fill="#5dff3a" opacity=".85">EP. 1</text>`;
  }
  s += captions(t,B);
  // grão
  s += `<image href="${GRAIN[Math.floor(t*30)%GRAIN.length]}" x="0" y="0" width="1080" height="1920" opacity=".07" style="mix-blend-mode:overlay" preserveAspectRatio="none"/>`;
  const [fi,fo] = FADES[B.id]||[0,0]; let blk = 0;
  if (fi && lt<fi) blk = 1-lt/fi; if (fo && lt>B.dur-fo) blk = Math.max(blk,(lt-(B.dur-fo))/fo);
  if (blk>0) s += `<rect width="1080" height="1920" fill="#000" opacity="${clamp(blk,0,1)}"/>`;
  document.getElementById('stage').innerHTML = s;
}

const GRAIN = [];
function makeGrain(){
  for (let k=0;k<4;k++){ const c=document.createElement('canvas'); c.width=360; c.height=640; const g=c.getContext('2d'); const im=g.createImageData(360,640);
    for (let i=0;i<im.data.length;i+=4){ const v=Math.random()*255; im.data[i]=im.data[i+1]=im.data[i+2]=v; im.data[i+3]=255; }
    g.putImageData(im,0,0); GRAIN.push(c.toDataURL('image/png')); }
}
