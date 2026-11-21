// Episódio 10 — grande final
function shotCashBag(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgBar(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".45"/>`;
  const up=easeOut(clamp(lt/1.4,0,1)), z=lerp(1,1.15,easeIO(lt/B.dur));
  s += `<g transform="translate(540,1200) scale(${z}) translate(-540,-1200)">`;
  s += `<path d="M 260 1920 L 240 1380 Q 250 1240 540 1230 Q 830 1240 840 1380 L 820 1920 Z" fill="#111214"/><path d="M 300 1380 Q 540 1330 780 1380" stroke="#2a2b30" stroke-width="14" fill="none"/>`;
  s += `<g transform="translate(540,${lerp(1420,1020,up)}) rotate(${lerp(8,-3,up)})">`;
  for (let i=0;i<4;i++) s += `<rect x="-200" y="${-60-i*26}" width="400" height="150" rx="10" fill="${i%2?'#7fb38a':'#8fc49a'}" stroke="#4b7a55" stroke-width="3"/>`;
  s += `<rect x="-200" y="-140" width="400" height="44" fill="#d9c27a"/><text x="0" y="-108" text-anchor="middle" font-family="Inter" font-weight="900" font-size="30" fill="#5a4a1a">R$ 30.000</text>`;
  s += `<path d="M -200 20 C -330 40 -380 140 -360 260 L -200 260 Z" fill="${CH.lucas.skin}"/><path d="M 200 20 C 330 40 380 140 360 260 L 200 260 Z" fill="${CH.lucas.skin}"/></g>`;
  s += `</g>`;
  return s + `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
}
function shotToast(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgBarDay(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".15"/>`;
  const hit = sh.hitAt??1.2, p = easeIO(clamp(lt/hit,0,1)), bounce = lt>hit? Math.sin(clamp((lt-hit)/.3,0,1)*Math.PI)*14 : 0;
  const glass=(x,y,rot,skin,sleeve)=>`<g transform="translate(${x},${y}) rotate(${rot})"><path d="M -70 -200 L 70 -200 L 56 120 L -56 120 Z" fill="#f2c94c" opacity=".9"/><path d="M -70 -200 L 70 -200 L 66 -150 L -66 -150 Z" fill="#fffbe9"/><path d="M -70 -200 L 70 -200 L 56 120 L -56 120 Z" fill="none" stroke="#fff" stroke-width="5" opacity=".6"/><rect x="-46" y="-120" width="10" height="200" fill="#fff" opacity=".35"/><path d="M -80 0 C -150 20 -170 120 -150 260 L 60 280 L 70 40 Z" fill="${skin}"/><rect x="-170" y="250" width="240" height="400" fill="${sleeve}"/></g>`;
  s += glass(lerp(250,430,p)-bounce,1100,lerp(-20,-8,p),CH.sandro.skin,CH.sandro.shirtC);
  s += glass(lerp(830,650,p)+bounce,1110,lerp(20,8,p),CH.marilene.skin,'#f0e2c4');
  if (lt>hit && lt<hit+.5){ const f=1-(lt-hit)/.5; for(let i=0;i<10;i++){ const a=i*.63; s+=`<circle cx="${540+Math.cos(a)*120*(1-f+.2)}" cy="${930+Math.sin(a)*90*(1-f+.2)}" r="${8*f+2}" fill="#fff8d6" opacity="${f}"/>`; } }
  return s + `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
}
function shotBoatLeave(sh, lt, B){
  const p=easeIO(clamp(lt/B.dur,0,1));
  let s = `<g>${bgPort(lt).replace(/<g transform="translate\\(([^,]+),([^)]+)\\)">/, (m,a,b)=>`<g transform="translate(${560+p*260},${1040-p*30}) scale(${1-p*.35})">`)}</g>`;
  s += `<rect width="1080" height="1920" fill="#ffb36b" opacity=".12"/>`;
  return s;
}
function shotSeasonEnd(sh, lt, B){
  const a=clamp(lt/.5,0,1);
  return `<rect width="1080" height="1920" fill="#030304"/><g opacity="${a}"><text x="540" y="900" text-anchor="middle" font-family="Inter" font-weight="900" font-size="96" fill="url(#goldT)">FIM DA</text><text x="540" y="1010" text-anchor="middle" font-family="Inter" font-weight="900" font-size="96" fill="url(#goldT)">1ª TEMPORADA</text><line x1="${540-260*a}" y1="1060" x2="${540+260*a}" y2="1060" stroke="#c9a24a" stroke-width="4"/><text x="540" y="1130" text-anchor="middle" font-family="Inter" font-style="italic" font-weight="500" font-size="40" fill="#d9d4c7">Segredos do Tabocal</text></g>`;
}
Object.assign(SHOTS, { cash_bag:shotCashBag, toast:shotToast, boat_leave:shotBoatLeave, season_end:shotSeasonEnd });
