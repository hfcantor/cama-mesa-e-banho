// Episódio 4 — recibo, ligação, beira do rio
function shotReceipt(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${(sh.bgn?BG[sh.bgn]:(sh.night?bgBar:bgBarDay))(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".45"/>`;
  const z = lerp(1.0, sh.zoomName?1.35:1.12, easeIO(clamp(lt/B.dur,0,1)));
  const R0 = sh.rev||[0,0,0,0,0], show=i=>sh.all?1:clamp((lt-R0[i])/.35,0,1);
  let p = `<rect x="-330" y="-420" width="660" height="840" fill="#f6efdc"/><path d="M -330 420 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 l 30 16 l 30 -16 L 330 420" fill="#f6efdc"/>`;
  p += `<text x="0" y="-320" text-anchor="middle" font-family="DejaVu Serif" font-weight="700" font-size="58" fill="#1d1d1d" opacity="${show(0)}">RECIBO</text><line x1="-260" y1="-290" x2="260" y2="-290" stroke="#555" stroke-width="3" opacity="${show(0)}"/>`;
  const line=(i,y,a,b,hl)=>`<g opacity="${show(i)}">${hl?`<rect x="-280" y="${y-44}" width="560" height="66" fill="#ffe36b" opacity="${hl}"/>`:''}<text x="-260" y="${y}" font-family="DejaVu Serif" font-size="30" fill="#555">${a}</text><text x="-260" y="${y+40}" font-family="DejaVu Sans Mono" font-weight="700" font-size="38" fill="#1a2a6c">${b}</text></g>`;
  const hl = sh.zoomName? clamp((lt-.6)/.4,0,1)*.8 : 0;
  p += line(1,-200,'Referente a:','Venda de barco de frete');
  p += line(2,-80,'Valor:','R$ 40.000,00');
  p += line(3,40,'Vendedor:','J. K. Monteiro',hl);
  p += line(4,160,'Contato:','(93) 9 8___-__17');
  p += `<path d="M -120 330 q 40 -60 80 0 t 80 0 t 60 -10" stroke="#1a2a6c" stroke-width="4" fill="none" opacity="${show(3)}"/>`;
  s += `<g transform="translate(540,${sh.zoomName?900:960}) scale(${z}) rotate(-3) translate(0,${sh.zoomName?-40*z:0})">${p}</g>`;
  s += `<path d="M 0 1920 L 0 1500 C 120 1440 260 1460 300 1560 L 340 1920 Z" fill="${CH.sandro.skin}"/><rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
  return s;
}
function shotCall(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${(sh.bgn?BG[sh.bgn]:bgBarDay)(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".4"/>`;
  const ended = lt>(sh.endAt??3);
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="${ended?'#2a0d0d':'#0f1a14'}"/>${avatar(0,-260,90,'?','#5f6b78')}
   <text x="0" y="-110" text-anchor="middle" font-family="Inter" font-weight="800" font-size="44" fill="#fff">(93) 9 8___-__17</text>
   <text x="0" y="-50" text-anchor="middle" font-family="Inter" font-weight="600" font-size="32" fill="${ended?'#ff6b6b':'#9fe2b5'}">${sh.label?sh.label+' 00:'+String(Math.floor(lt)+12).padStart(2,'0'):(ended?'Chamada encerrada':'Chamando'+'.'.repeat(1+Math.floor(lt*2)%3))}</text>
   ${sh.speaker?'<rect x="-200" y="230" width="400" height="60" rx="30" fill="#2e7d32"/><text x="0" y="272" text-anchor="middle" font-family="Inter" font-weight="800" font-size="30" fill="#fff">VIVA-VOZ</text>':''}<circle cx="0" cy="380" r="70" fill="#e53935"/><rect x="-36" y="368" width="72" height="24" rx="12" fill="#fff"/>`;
  if (!ended) for (let k=0;k<3;k++){ const r=(lt*120+k*60)%180; s; scr += `<circle cx="0" cy="-260" r="${90+r}" fill="none" stroke="#9fe2b5" stroke-width="3" opacity="${.5-r/360}"/>`; }
  s += `<g transform="translate(540,960) scale(${lerp(1,1.08,lt/B.dur)}) translate(-540,-960)">${phone(540,920,540,1120,-2,scr,{id:'cl',back:handBack(CH[sh.hand||'sandro'].skin,CH[sh.hand||'sandro'].shade),front:handFront(CH[sh.hand||'sandro'].skin,CH[sh.hand||'sandro'].shade)})}</g>`;
  return s;
}
function shotRiverTwo(sh, lt, B){
  const z=lerp(1.25,1.4,easeIO(lt/B.dur));
  let s = `<g transform="translate(540,1450) scale(${z}) translate(-540,-1450)">${bgRiver(lt)}`;
  s += silhouette(430,1560,.62,0,{col:'#04060b',rim:'#9db8ff'});
  s += `<path d="M 386 1180 Q 430 1150 474 1180 L 474 1190 L 386 1190 Z" fill="#04060b"/>`;
  s += femSil(640,1560,.62,0,{hair:'bob',col:'#04060b',rim:'#9db8ff',flip:true});
  s += `</g><rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  return s;
}
Object.assign(SHOTS, { receipt:shotReceipt, call:shotCall, river_two:shotRiverTwo });
