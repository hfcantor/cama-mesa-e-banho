// Personagens — desenhados a partir da bíblia oficial (aparência e objetos de continuidade)
const CH = {
  rafael:  { skin:'#9b6b4b', shade:'#74492f', hair:'short',  hairC:'#151110', beard:'stubble', bw:13,
             shirt:'tee', shirtC:'#2b313a', fw:1.0, jaw:1.02, ph:0.3, eye:'#3a2416' },
  diego:   { skin:'#70492f', shade:'#4f3120', hair:'cap',    hairC:'#0f0c0b', capC:'#1d2a4a', bw:12, slit:true, chip:true,
             shirt:'jersey', shirtC:'#b3262b', stripe:'#f4f1ea', chain:'silver', fw:0.96, jaw:0.95, ph:1.1, eye:'#2b190f' },
  bruno:   { skin:'#b67f58', shade:'#8c5b3a', hair:'pomp',   hairC:'#2c1b12', glasses:true, bw:12, beard:'light',
             shirt:'tee', shirtC:'#ece8df', chain:'gold', fw:0.98, jaw:1.0, ph:2.0, eye:'#3b2414' },
  lucas:   { skin:'#a9774f', shade:'#835736', hair:'fringe', hairC:'#121010', bw:10,
             shirt:'polo', shirtC:'#cdd9de', strap:true, fw:0.93, jaw:0.92, ph:0.7, eye:'#2e1c10' },
  sandro:  { skin:'#8d5b3a', shade:'#663f26', hair:'bald',   hairC:'#8a847d', mustache:'#a9a49c', toothpick:true, bw:12, browC:'#6f6a64',
             shirt:'open', shirtC:'#2d7a6b', towel:true, fw:1.13, jaw:1.15, ph:1.7, eye:'#2b1a10' },
  marcelo: { skin:'#a87c5b', shade:'#7f573b', hair:'slick',  hairC:'#0c0b0b', beard:'full', beardC:'#141010', scar:true, bw:14,
             shirt:'button', shirtC:'#4b1823', broad:true, fw:1.05, jaw:1.06, ph:2.6, eye:'#1d120b' },
};

const EXPR = {
  //            brow in, brow out, lid, smile L, smile R
  neutral: { bi:0,   bo:0,  lid:.12, sl:0,   sr:0 },
  worried: { bi:-15, bo:7,  lid:.02, sl:-.3, sr:-.3 },
  serious: { bi:9,   bo:-3, lid:.22, sl:-.15,sr:-.15 },
  cold:    { bi:11,  bo:-5, lid:.36, sl:-.05,sr:.05 },
  smile:   { bi:-4,  bo:-6, lid:.28, sl:.75, sr:.75 },
  forced:  { bi:-13, bo:5,  lid:.1,  sl:.45, sr:.45 },
  smirk:   { bi:-2,  bo:-4, lid:.2,  sl:.05, sr:.7, raiseR:true },
  sad:     { bi:-11, bo:8,  lid:.3,  sl:-.35,sr:-.35 },
  soft:    { bi:-6,  bo:-1, lid:.2,  sl:.3,  sr:.3 },
};

function hex2rgb(h){ h=h.replace('#',''); return [0,2,4].map(i=>parseInt(h.substr(i,2),16)); }
function rgb2hex(a){ return '#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function mixc(a,b,t){ const A=hex2rgb(a),B=hex2rgb(b); return rgb2hex(A.map((v,i)=>v+(B[i]-v)*t)); }
const light=(c,t)=>mixc(c,'#ffffff',t), dark=(c,t)=>mixc(c,'#000000',t);

function charDefs(id){
  const c=CH[id];
  return `<radialGradient id="sk_${id}" cx=".45" cy=".38" r=".75"><stop offset="0" stop-color="${light(c.skin,.12)}"/><stop offset=".6" stop-color="${c.skin}"/><stop offset="1" stop-color="${c.shade}"/></radialGradient>
  <linearGradient id="hf_${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.hairC}" stop-opacity=".55"/><stop offset=".22" stop-color="${c.hairC}"/><stop offset=".78" stop-color="${c.hairC}"/><stop offset="1" stop-color="${c.hairC}" stop-opacity=".55"/></linearGradient>
  <linearGradient id="sh_${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light(c.shirtC,.08)}"/><stop offset="1" stop-color="${dark(c.shirtC,.35)}"/></linearGradient>`;
}

function torso(id, c, u){
  const b = c.broad?1.1:1, L=540-420*b, R=540+420*b;
  const P = `M ${L-40} 1990 L ${L} 1450 C ${L+20} 1330 ${540-260*b} 1262 ${540-96} 1222 L ${540+96} 1222 C ${540+260*b} 1262 ${R-20} 1330 ${R} 1450 L ${R+40} 1990 Z`;
  let s = `<clipPath id="tc_${u}"><path d="${P}"/></clipPath><path d="${P}" fill="url(#sh_${id})"/>`;
  // dobras / sombra lateral
  s += `<g clip-path="url(#tc_${u})" opacity=".35"><path d="M ${L+60} 1500 Q ${L+120} 1700 ${L+90} 1990" stroke="#000" stroke-width="40" fill="none" opacity=".5"/><path d="M ${R-60} 1500 Q ${R-120} 1700 ${R-90} 1990" stroke="#000" stroke-width="40" fill="none" opacity=".5"/></g>`;
  if (c.shirt==='jersey'){
    s += `<g clip-path="url(#tc_${u})">`;
    for (let x=150;x<960;x+=118) s += `<rect x="${x}" y="1180" width="36" height="820" fill="${c.stripe}" opacity=".88"/>`;
    s += `<path d="M ${540-96} 1222 L 540 1330 L ${540+96} 1222" stroke="${c.stripe}" stroke-width="18" fill="none"/></g>`;
  }
  if (c.shirt==='open'){
    s += `<g clip-path="url(#tc_${u})" opacity=".55">`;
    for (let i=0;i<26;i++){ const x=120+((i*137)%820), y=1290+((i*251)%640); s+=flower(x,y,i); }
    s += `</g>`;
    s += `<path d="M ${540-96} 1222 L 540 1540 L ${540+96} 1222 Z" fill="${c.skin}"/>`;
    s += `<path d="M ${540-96} 1222 L 530 1540 L ${540-150} 1300 Z" fill="${dark(c.shirtC,.25)}"/><path d="M ${540+96} 1222 L 550 1540 L ${540+150} 1300 Z" fill="${dark(c.shirtC,.25)}"/>`;
    for (let i=0;i<9;i++) s += `<path d="M ${520+((i*23)%40)} ${1300+i*22} q 6 -8 12 0" stroke="${c.hairC}" stroke-width="2.5" fill="none" opacity=".7"/>`;
  }
  if (c.shirt==='button'){
    s += `<path d="M ${540-62} 1222 L 540 1335 L ${540+62} 1222 Z" fill="${c.skin}"/>`;
    s += `<path d="M ${540-100} 1212 L ${540-8} 1330 L ${540-58} 1352 L ${540-132} 1252 Z" fill="${dark(c.shirtC,.3)}"/><path d="M ${540+100} 1212 L ${540+8} 1330 L ${540+58} 1352 L ${540+132} 1252 Z" fill="${dark(c.shirtC,.3)}"/>`;
    s += `<line x1="540" y1="1335" x2="540" y2="1990" stroke="${dark(c.shirtC,.45)}" stroke-width="4"/>`;
    for (let y=1420;y<1990;y+=140) s += `<circle cx="552" cy="${y}" r="7" fill="${light(c.shirtC,.25)}"/>`;
  }
  if (c.shirt==='polo'){
    s += `<rect x="${540-16}" y="1235" width="32" height="150" fill="${dark(c.shirtC,.12)}"/><circle cx="540" cy="1290" r="6" fill="#fff"/><circle cx="540" cy="1345" r="6" fill="#fff"/>`;
  }
  return s;
}
function flower(x,y,i){
  const col = i%2? '#f6d25b':'#f4efe4'; let s='';
  for (let k=0;k<5;k++){ const a=k*1.2566+i; s+=`<ellipse cx="${x+Math.cos(a)*16}" cy="${y+Math.sin(a)*16}" rx="13" ry="8" transform="rotate(${a*57.3} ${x+Math.cos(a)*16} ${y+Math.sin(a)*16})" fill="${col}"/>`; }
  return s + `<circle cx="${x}" cy="${y}" r="6" fill="#e3693a"/>`;
}
function collarOver(id, c){
  let s='';
  if (c.shirt==='tee' || c.shirt==='jersey') s += `<path d="M ${540-96} 1220 Q 540 1296 ${540+96} 1220" stroke="${dark(c.shirtC,.3)}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  if (c.shirt==='polo') s += `<path d="M ${540-98} 1218 L ${540-22} 1300 L ${540-122} 1296 Z" fill="${light(c.shirtC,.2)}"/><path d="M ${540+98} 1218 L ${540+22} 1300 L ${540+122} 1296 Z" fill="${light(c.shirtC,.2)}"/>`;
  if (c.chain) { const col = c.chain==='gold'?'#e5b94b':'#d7dce0';
    s += `<path d="M ${540-80} 1236 Q 540 1352 ${540+80} 1236" stroke="${col}" stroke-width="6" fill="none"/>`;
    if (c.chain==='gold') s += `<circle cx="540" cy="1322" r="10" fill="${col}"/>`; }
  if (c.strap) s += `<path d="M 292 1302 Q 340 1282 392 1290 L 436 1990 L 340 1990 Z" fill="#1f2023"/><rect x="352" y="1520" width="56" height="34" rx="6" fill="#3a3b40"/>`;
  if (c.towel) s += `<path d="M 160 1360 Q 290 1262 430 1262 L 446 1330 Q 300 1335 205 1440 Z" fill="#efe9de"/><path d="M 210 1352 Q 310 1290 432 1290" stroke="#c0392b" stroke-width="7" fill="none"/><path d="M 196 1380 Q 300 1312 438 1310" stroke="#c0392b" stroke-width="5" fill="none"/>`;
  return s;
}

// o = {t, mouth, expr, gaze, gy, rim, uid}
function charSVG(id, o){
  const c = CH[id], e = EXPR[o.expr||'neutral'], fw=c.fw, Wf=170*fw, jw=c.jaw||1, t=o.t||0, u=o.uid||id;
  const breath = Math.sin(t*1.6+c.ph)*4;
  const talk = (o.mouth||0);
  const tilt = Math.sin(t*0.7+c.ph)*1.3 + talk*1.4*Math.sin(t*7.3+c.ph);
  const nod = talk*3*Math.sin(t*5.1);
  const rim = o.rim || '#ffb766';
  let s = '';
  s += `<g transform="translate(0,${breath})">${torso(id,c,u)}</g>`;
  s += `<g transform="translate(0,${breath*0.7+nod}) rotate(${tilt} 540 1160)">`;
  // pescoço
  s += `<path d="M ${540-60*fw} 980 L ${540-70*fw} 1240 Q 540 1282 ${540+70*fw} 1240 L ${540+60*fw} 980 Z" fill="${c.shade}"/>`;
  s += collarOver(id,c);
  s += `<ellipse cx="540" cy="1082" rx="${Wf*0.62}" ry="34" fill="#000" opacity=".28"/>`;
  // orelhas
  for (const sg of [-1,1]) s += `<ellipse cx="${540+sg*(Wf+4)}" cy="872" rx="24" ry="44" fill="${c.skin}"/><path d="M ${540+sg*(Wf+8)} 845 q ${sg*10} 25 0 52" stroke="${c.shade}" stroke-width="5" fill="none"/>`;
  // rosto
  const F = `M ${540-Wf} 830 C ${540-Wf} 600 ${540+Wf} 600 ${540+Wf} 830 C ${540+Wf} 948 ${540+Wf*0.72*jw} 1052 540 1080 C ${540-Wf*0.72*jw} 1052 ${540-Wf} 948 ${540-Wf} 830 Z`;
  s += `<clipPath id="fc_${u}"><path d="${F}"/></clipPath><path d="${F}" fill="url(#sk_${id})"/>`;
  s += `<path d="${F}" fill="none" stroke="${rim}" stroke-width="7" opacity=".28"/>`;
  // bochechas
  s += `<ellipse cx="${540-Wf*0.55}" cy="955" rx="40" ry="26" fill="#c2574a" opacity=".1"/><ellipse cx="${540+Wf*0.55}" cy="955" rx="40" ry="26" fill="#c2574a" opacity=".1"/>`;
  // barba
  if (c.beard==='stubble' || c.beard==='light' || c.beard==='full'){
    const op = c.beard==='full'?.93:(c.beard==='stubble'?.26:.12), bc=c.beardC||c.hairC, y0=c.beard==='full'?850:905;
    s += `<g clip-path="url(#fc_${u})"><path d="M ${540-Wf-5} ${y0} C ${540-Wf} 1010 ${540-Wf*0.62} 1090 540 1095 C ${540+Wf*0.62} 1090 ${540+Wf} 1010 ${540+Wf+5} ${y0} L ${540+Wf-28} ${y0+30} C ${540+60} 995 ${540+46} 972 540 972 C ${540-46} 972 ${540-60} 995 ${540-Wf+28} ${y0+30} Z" fill="${bc}" opacity="${op}"/>`;
    s += `<ellipse cx="540" cy="986" rx="56" ry="15" fill="${bc}" opacity="${op}"/></g>`;
  }
  // nariz
  s += `<path d="M ${540+5} 872 L ${540+8} 928" stroke="${light(c.skin,.25)}" stroke-width="6" opacity=".45" stroke-linecap="round"/>`;
  s += `<path d="M ${540-6} 880 Q ${540-14} 935 ${540-27} 950 Q ${540-12} 968 540 963 Q ${540+12} 968 ${540+27} 950" stroke="${c.shade}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  s += `<ellipse cx="${540-11}" cy="956" rx="6" ry="3.5" fill="#000" opacity=".35"/><ellipse cx="${540+11}" cy="956" rx="6" ry="3.5" fill="#000" opacity=".35"/>`;
  // boca
  s += mouthSVG(c, e, talk, u);
  if (c.mustache) {
    s += `<path d="M ${540-74} 1010 Q ${540-64} 972 540 976 Q ${540+64} 972 ${540+74} 1010 Q ${540+42} 996 540 999 Q ${540-42} 996 ${540-74} 1010 Z" fill="${c.mustache}"/>`;
    for (let i=-5;i<=5;i++) s += `<path d="M ${540+i*12} 982 l ${i*1.5} 15" stroke="${dark(c.mustache,.2)}" stroke-width="2"/>`;
  }
  if (c.beard==='full') s += `<path d="M ${540-58} 997 Q 540 968 ${540+58} 997 Q ${540+30} 990 540 990 Q ${540-30} 990 ${540-58} 997 Z" fill="${c.beardC}"/>`;
  if (c.toothpick){ const mw=44*fw; s += `<line x1="${540+mw-4}" y1="1012" x2="${540+mw+62}" y2="${994+Math.sin(t*2)*3}" stroke="#dcbc8a" stroke-width="5" stroke-linecap="round"/>`; }
  // olhos
  const blink = o.blink||0, cover = Math.max(blink, e.lid);
  for (const sg of [-1,1]){
    const x = 540+sg*66*fw, ey=862, gx=(o.gaze||0)*9, gy=(o.gy||0)*5;
    const A = `M ${x-29} ${ey} Q ${x} ${ey-21} ${x+29} ${ey} Q ${x} ${ey+16} ${x-29} ${ey} Z`;
    const lidY = 0.0 + (ey-10) + cover*20, ctrl = 2*lidY-(ey+1);
    s += `<clipPath id="ec_${u}_${sg}"><path d="${A}"/></clipPath><path d="${A}" fill="#efe7df"/>`;
    s += `<g clip-path="url(#ec_${u}_${sg})"><circle cx="${x+gx}" cy="${ey+1+gy}" r="13.5" fill="${c.eye}"/><circle cx="${x+gx}" cy="${ey+1+gy}" r="6.5" fill="#080504"/><circle cx="${x+gx-4}" cy="${ey-4+gy}" r="3.6" fill="#fff" opacity=".9"/>`;
    s += `<path d="M ${x-33} ${ey-32} L ${x+33} ${ey-32} L ${x+33} ${ey+1} Q ${x} ${ctrl} ${x-33} ${ey+1} Z" fill="${c.skin}"/>`;
    s += `<path d="M ${x-33} ${ey-32} L ${x+33} ${ey-32} L ${x+33} ${ey+1} Q ${x} ${ctrl} ${x-33} ${ey+1} Z" fill="#000" opacity=".12"/></g>`;
    s += `<path d="M ${x-30} ${ey+1} Q ${x} ${ctrl} ${x+30} ${ey+1}" stroke="#1d130e" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M ${x-26} ${ey-12-(1-cover)*2} Q ${x} ${ey-30} ${x+26} ${ey-12}" stroke="${c.shade}" stroke-width="2.5" fill="none" opacity=".6"/>`;
    s += `<path d="M ${x-22} ${ey+6} Q ${x} ${ey+15} ${x+22} ${ey+6}" stroke="${c.shade}" stroke-width="2.5" fill="none" opacity=".5"/>`;
    // sobrancelha
    const raise = (e.raiseR && sg===1) ? -12 : 0;
    const iy = 802+e.bi+raise, oy = 806+e.bo+raise, ix = 540+sg*34*fw, ox = 540+sg*108*fw;
    s += `<path d="M ${ix} ${iy} Q ${(ix+ox)/2} ${Math.min(iy,oy)-11} ${ox} ${oy}" stroke="${c.browC||c.hairC}" stroke-width="${c.bw}" fill="none" stroke-linecap="round"/>`;
    if (c.slit && sg===1) s += `<line x1="${540+82*fw}" y1="${790+e.bo}" x2="${540+76*fw}" y2="${816+e.bo}" stroke="${c.skin}" stroke-width="5"/>`;
    if (c.scar && sg===-1) s += `<path d="M ${540-86*fw} ${776} L ${540-76*fw} ${836}" stroke="${light(c.skin,.3)}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
  s += hairSVG(c, Wf, t);
  s += `</g>`;
  return s;
}

function mouthSVG(c, e, a, u){
  const fw=c.fw, mw=44*fw, my=1012, lip=dark(mixc(c.skin,'#9b3b3b',.35),.25);
  const lc = my - e.sl*11, rc = my - e.sr*11;
  const op = a<0.12 ? 0 : Math.min(1,(a-0.12)/0.8);
  let s='';
  if (op<=0.02){
    s += `<path d="M ${540-mw} ${lc} Q 540 ${my+5-(e.sl+e.sr)*3} ${540+mw} ${rc}" stroke="${lip}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M ${540-mw*0.55} ${my+14} Q 540 ${my+22} ${540+mw*0.55} ${my+14}" stroke="${c.shade}" stroke-width="7" fill="none" opacity=".4" stroke-linecap="round"/>`;
  } else {
    const m2=mw*(1-op*0.12), top=my-2-op*4, bot=my+8+op*30, mid=(lc+rc)/2;
    const P=`M ${540-m2} ${lc} Q 540 ${2*top-mid} ${540+m2} ${rc} Q 540 ${2*bot-mid} ${540-m2} ${lc} Z`;
    s += `<clipPath id="mc_${u}"><path d="${P}"/></clipPath><path d="${P}" fill="#2a0e0c"/>`;
    s += `<g clip-path="url(#mc_${u})"><rect x="${540-m2}" y="${top-14}" width="${m2*2}" height="${18+op*2}" fill="#f2ece2"/>`;
    if (c.chip) s += `<path d="M ${540+4} ${top+5+op*2} l 6 -7 l 6 7 Z" fill="#2a0e0c"/>`;
    s += `<ellipse cx="540" cy="${bot+4}" rx="${m2*0.6}" ry="${8+op*6}" fill="#a2504b"/></g>`;
    s += `<path d="${P}" stroke="${lip}" stroke-width="5" fill="none"/>`;
    s += `<path d="M ${540-m2*0.6} ${bot+10} Q 540 ${bot+18} ${540+m2*0.6} ${bot+10}" stroke="${c.shade}" stroke-width="6" fill="none" opacity=".35" stroke-linecap="round"/>`;
  }
  return s;
}

function hairSVG(c, Wf, t){
  const h=c.hairC; let s='';
  if (c.hair==='short' || c.hair==='slick' || c.hair==='fringe'){
    const hl = c.hair==='slick'?716:732;
    const P = `M ${540-Wf-3} 842 C ${540-Wf-10} 700 ${540-Wf*0.6} 626 540 624 C ${540+Wf*0.6} 626 ${540+Wf+10} 700 ${540+Wf+3} 842 L ${540+Wf-12} 842 C ${540+Wf-14} 792 ${540+Wf-30} 762 ${540+Wf*0.55} ${hl+12} Q ${540+40} ${hl-4} 540 ${hl+6} Q ${540-40} ${hl-4} ${540-Wf*0.55} ${hl+12} C ${540-Wf+30} 762 ${540-Wf+14} 792 ${540-Wf+12} 842 Z`;
    s += `<path d="${P}" fill="url(#hf_${c.key})"/>`;
    for (let i=0;i<22;i++){ const x=540-Wf*0.75+i*(Wf*1.5/21), y=650+Math.abs(i-10.5)*5; s += `<path d="M ${x} ${y+28} l ${(i%3-1)*4} -18" stroke="${light(h,.18)}" stroke-width="3" opacity=".5"/>`; }
    if (c.hair==='slick') for (let i=-3;i<=3;i++) s += `<path d="M ${540+i*40} ${hl+8} Q ${540+i*44} 664 ${540+i*30} 632" stroke="#46403d" stroke-width="3" fill="none" opacity=".6"/>`;
    if (c.hair==='fringe'){
      s += `<path d="M ${540-Wf+14} 790 C ${540-Wf+30} 720 ${540-40} 700 540 702 C ${540+70} 704 ${540+Wf-20} 740 ${540+Wf-8} 812 L ${540+Wf-24} 800 L ${540+Wf-40} 818 L ${540+Wf-58} 790 L ${540+40} 792 L ${540+10} 774 L ${540-40} 772 L ${540-80} 760 L ${540-Wf+40} 772 Z" fill="${h}"/>`;
      s += `<path d="M ${540-60} 730 Q 540 728 ${540+90} 770" stroke="#3a3533" stroke-width="3" fill="none" opacity=".7"/><path d="M ${540-20} 712 Q ${540+40} 715 ${540+110} 760" stroke="#3a3533" stroke-width="3" fill="none" opacity=".6"/>`;
    }
  }
  if (c.hair==='pomp'){
    s += `<path d="M ${540-Wf-4} 846 C ${540-Wf-14} 700 ${540-Wf*0.75} 598 ${540-30} 572 C ${540+40} 528 ${540+Wf+30} 590 ${540+Wf+4} 846 L ${540+Wf-6} 846 C ${540+Wf-12} 770 ${540+Wf*0.5} 728 540 726 C ${540-Wf*0.5} 728 ${540-Wf+12} 770 ${540-Wf+6} 846 Z" fill="${h}"/>`;
    s += `<path d="M ${540-60} 600 Q ${540+20} 556 ${540+110} 600" stroke="#5a3d2c" stroke-width="5" fill="none" opacity=".6"/><path d="M ${540-40} 625 Q ${540+30} 590 ${540+120} 630" stroke="#5a3d2c" stroke-width="4" fill="none" opacity=".5"/>`;
    s += `<rect x="${540-Wf-4}" y="760" width="18" height="100" fill="${c.skin}" opacity=".5"/><rect x="${540+Wf-14}" y="760" width="18" height="100" fill="${c.skin}" opacity=".5"/>`;
    if (c.glasses){
      s += `<g transform="rotate(-4 540 628)"><rect x="${540-118}" y="612" width="96" height="50" rx="20" fill="url(#mirror)" stroke="#caa24a" stroke-width="3"/><rect x="${540+12}" y="612" width="96" height="50" rx="20" fill="url(#mirror)" stroke="#caa24a" stroke-width="3"/><path d="M ${540-22} 628 Q ${540-5} 618 ${540+12} 628" stroke="#caa24a" stroke-width="4" fill="none"/></g>`;
    }
  }
  if (c.hair==='cap'){
    for (const sg of [-1,1]) for (let i=0;i<4;i++) s += `<circle cx="${540+sg*(Wf-10-(i%2)*10)}" cy="${790+i*16}" r="13" fill="${h}"/>`;
    s += `<path d="M ${540-Wf-16} 808 C ${540-Wf-18} 640 ${540-Wf*0.55} 580 540 578 C ${540+Wf*0.55} 580 ${540+Wf+18} 640 ${540+Wf+16} 808 Q 540 770 ${540-Wf-16} 808 Z" fill="${c.capC}"/>`;
    s += `<path d="M ${540-Wf-16} 808 Q 540 770 ${540+Wf+16} 808" stroke="${dark(c.capC,.4)}" stroke-width="10" fill="none"/>`;
    s += `<path d="M ${540-52} 792 Q 540 700 ${540+52} 792 Z" fill="${h}"/>`;
    for (let i=0;i<6;i++) s += `<circle cx="${540-34+i*14}" cy="${770-Math.sin(i/5*Math.PI)*24}" r="11" fill="#1d1715"/>`;
    s += `<rect x="${540-52}" y="776" width="104" height="14" rx="5" fill="${light(c.capC,.15)}"/><circle cx="${540-20}" cy="783" r="3" fill="#ddd"/><circle cx="${540}" cy="783" r="3" fill="#ddd"/><circle cx="${540+20}" cy="783" r="3" fill="#ddd"/>`;
    s += `<path d="M 540 580 L 540 700" stroke="${dark(c.capC,.35)}" stroke-width="3"/><path d="M ${540-Wf*0.5} 600 Q ${540-Wf*0.75} 700 ${540-Wf*0.85} 790" stroke="${dark(c.capC,.35)}" stroke-width="3" fill="none"/><path d="M ${540+Wf*0.5} 600 Q ${540+Wf*0.75} 700 ${540+Wf*0.85} 790" stroke="${dark(c.capC,.35)}" stroke-width="3" fill="none"/>`;
    s += `<circle cx="540" cy="582" r="10" fill="${light(c.capC,.1)}"/>`;
  }
  if (c.hair==='bald'){
    s += `<ellipse cx="${540-45}" cy="690" rx="70" ry="34" fill="#fff" opacity=".13" transform="rotate(-18 495 690)"/>`;
    for (const sg of [-1,1]) s += `<path d="M ${540+sg*(Wf+2)} 790 Q ${540+sg*(Wf+10)} 880 ${540+sg*(Wf-8)} 910 L ${540+sg*(Wf-16)} 820 Z" fill="${h}"/>`;
  }
  return s;
}

// silhueta de corpo inteiro (rua / porta)
function silhouette(x, y, sc, ph, opts={}){
  const legA = Math.sin(ph)*0.45, armA=-Math.sin(ph)*0.35, bob=Math.abs(Math.cos(ph))*-6;
  const col = opts.col||'#05070c', rim=opts.rim||null, broad=opts.broad?1.25:1;
  let s = `<g transform="translate(${x},${y+bob*sc}) scale(${sc})">`;
  const leg = (a, dx)=>`<g transform="rotate(${a*57} ${dx} -230)"><rect x="${dx-17}" y="-235" width="34" height="235" rx="14" fill="${col}"/><rect x="${dx-18}" y="-12" width="50" height="16" rx="8" fill="${col}"/></g>`;
  s += leg(legA,-14)+leg(-legA,14);
  s += `<path d="M ${-60*broad} -470 Q 0 -500 ${60*broad} -470 L ${48*broad} -225 L ${-48*broad} -225 Z" fill="${col}"/>`;
  const arm=(a,dx)=>`<g transform="rotate(${a*57} ${dx} -455)"><rect x="${dx-14}" y="-460" width="28" height="210" rx="13" fill="${col}"/></g>`;
  s += arm(armA,-62*broad)+arm(-armA,62*broad);
  if (opts.backpack) s += `<rect x="-78" y="-455" width="40" height="150" rx="14" fill="${col}"/><rect x="-74" y="-380" width="30" height="40" rx="6" fill="${opts.glow||col}"/>`;
  s += `<rect x="-13" y="-515" width="26" height="30" fill="${col}"/><ellipse cx="0" cy="-565" rx="44" ry="54" fill="${col}"/>`;
  if (opts.hair==='slick') s += `<path d="M -44 -570 Q 0 -640 44 -570" fill="${col}"/>`;
  if (rim) s += `<ellipse cx="0" cy="-565" rx="44" ry="54" fill="none" stroke="${rim}" stroke-width="4" opacity=".6"/><path d="M ${-60*broad} -470 Q 0 -500 ${60*broad} -470" stroke="${rim}" stroke-width="5" fill="none" opacity=".6"/>`;
  return s + `</g>`;
}

for (const k in CH) CH[k].key=k;
