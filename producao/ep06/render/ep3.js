// Episódio 3 — cenários e inserts novos
function bgHouseDark(t){
  let s = bgHouse(t,true);
  s += `<rect width="1080" height="1920" fill="#02040c" opacity=".55"/>`;
  s += `<path d="M 620 300 L 980 300 L 1080 1920 L 400 1920 Z" fill="#9db8ff" opacity=".05"/>`;
  return s;
}
function bgPort(t){
  let s = `<rect width="1080" height="1920" fill="url(#skyD)"/><circle cx="200" cy="230" r="80" fill="#fff6d8" opacity=".9"/>`;
  for (let i=0;i<3;i++) s += `<ellipse cx="${(300+i*340+t*10)%1300-100}" cy="${200+i*60}" rx="${120+i*20}" ry="30" fill="#fff" opacity=".75"/>`;
  s += `<path d="M 0 860 Q 200 820 400 850 Q 650 815 860 845 Q 980 830 1080 840 L 1080 900 L 0 900 Z" fill="#2f6b3c"/>`;
  s += `<rect y="890" width="1080" height="560" fill="#6f8f8a"/>`;
  for (let i=0;i<22;i++){ const y=905+i*24, x=R(i)*1080+Math.sin(t*1.2+i)*18; s += `<rect x="${x}" y="${y}" width="${80+R(i+3)*100}" height="4" rx="2" fill="#dfeee9" opacity=".45"/>`; }
  // barco regional de dois andares
  s += `<g transform="translate(${560+Math.sin(t*.8)*4},${1040+Math.sin(t*1.1)*3})">`;
  s += `<path d="M -420 60 L 420 60 L 360 150 L -380 150 Z" fill="#f4f1ea"/><rect x="-420" y="40" width="840" height="30" fill="#1f5fa8"/>`;
  s += `<rect x="-360" y="-110" width="680" height="150" fill="#f4f1ea"/><rect x="-300" y="-240" width="520" height="130" fill="#f4f1ea"/><rect x="-320" y="-260" width="560" height="24" fill="#1f5fa8"/><rect x="-380" y="-130" width="720" height="22" fill="#1f5fa8"/>`;
  for (let i=0;i<8;i++) s += `<rect x="${-330+i*80}" y="-80" width="50" height="60" fill="#8fb3c9"/>`;
  for (let i=0;i<6;i++) s += `<rect x="${-270+i*80}" y="-210" width="50" height="60" fill="#8fb3c9"/>`;
  s += `<text x="0" y="122" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#1f5fa8">SANTARÉM · TABOCAL</text>`;
  for (let i=0;i<5;i++) s += `<path d="M ${-250+i*110} -110 q 20 30 40 0" stroke="#e85d75" stroke-width="10" fill="none"/>`;
  s += `</g>`;
  // trapiche
  s += `<path d="M 0 1300 L 1080 1240 L 1080 1320 L 0 1400 Z" fill="#8a6a46"/>`;
  for (let i=0;i<12;i++) s += `<line x1="${i*95}" y1="${1300-i*5.5}" x2="${i*95+10}" y2="${1395-i*7}" stroke="#6e5236" stroke-width="5"/>`;
  for (let i=0;i<7;i++) s += `<rect x="${30+i*160}" y="${1380-i*9}" width="22" height="200" fill="#5a4129"/>`;
  s += `<rect y="1450" width="1080" height="470" fill="#b39572"/>`;
  return s;
}
function bgPharmacyIn(t){
  let s = `<rect width="1080" height="1920" fill="#eef3f0"/>`;
  s += `<rect x="40" y="200" width="1000" height="160" rx="12" fill="#1f8a5a"/><text x="540" y="305" text-anchor="middle" font-family="Inter" font-weight="900" font-size="80" fill="#fff">FARMÁCIA</text>`;
  const cols=['#e53935','#1e88e5','#fdd835','#43a047','#8e24aa','#fb8c00','#00acc1'];
  for (const y of [520,760,1000]){ s += `<rect x="40" y="${y+120}" width="1000" height="18" fill="#c9d3ce"/>`;
    for (let i=0;i<16;i++){ const h=60+R(i+y)*50; s += `<rect x="${60+i*61}" y="${y+120-h}" width="50" height="${h}" rx="4" fill="${cols[Math.floor(R(i*3+y)*7)]}"/><rect x="${66+i*61}" y="${y+130-h}" width="38" height="12" fill="#fff" opacity=".8"/>`; } }
  s += `<g transform="translate(900,470)"><rect x="-20" y="-60" width="40" height="120" fill="#3dff8a"/><rect x="-60" y="-20" width="120" height="40" fill="#3dff8a"/></g>`;
  s += `<rect y="1340" width="1080" height="80" fill="#cfd8dc"/><rect y="1420" width="1080" height="500" fill="#b0bec5"/>`;
  return s;
}
function shotDoorKnock(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="#06080f"/>`;
  const knocks=sh.knocks||[.2,.5,.8]; let k=0; for (const a of knocks) if (lt>a && lt<a+.12) k=Math.sin((lt-a)/.12*Math.PI);
  s += `<g transform="translate(${k*6},0)"><rect x="250" y="260" width="580" height="1420" fill="#2a1c12"/>`;
  for (let i=0;i<4;i++) s += `<rect x="${290+(i%2)*270}" y="${320+Math.floor(i/2)*620}" width="230" height="560" fill="none" stroke="#1a110a" stroke-width="10"/>`;
  s += `<circle cx="760" cy="980" r="18" fill="#8d7a5a"/></g>`;
  s += `<rect x="250" y="1680" width="580" height="10" fill="#ffcf8a" opacity=".9"/><path d="M 250 1690 L 830 1690 L 1000 1920 L 80 1920 Z" fill="#ffcf8a" opacity=".12"/>`;
  s += `<rect x="440" y="1680" width="70" height="10" fill="#000"/><rect x="560" y="1680" width="70" height="10" fill="#000"/>`;
  s += `<rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  return s;
}
function shotBoatArrive(sh, lt, B){
  const z=lerp(1.0,1.1,easeIO(lt/B.dur));
  let s = `<g transform="translate(540,1200) scale(${z}) translate(-540,-1200)">${bgPort(lt)}`;
  const p = clamp((lt-(sh.walkAt??2.5))/(B.dur-(sh.walkAt??2.5)),0,1);
  if (lt>(sh.walkAt??2.5)-.3){ const x=lerp(560,700,p), y=lerp(1110,1500,p), sc=lerp(.45,.85,p);
    s += femSil(x,y,sc,lt*6,{hair:'bob',col:'#173c2e',rim:'#fff6d8'});
    s += `<g transform="translate(${x+50*sc},${y-120*sc}) scale(${sc})"><rect x="0" y="0" width="70" height="110" rx="10" fill="#5a2d1e"/></g>`;
    s += `<rect x="${x-34*sc}" y="${y-560*sc}" width="${68*sc}" height="${18*sc}" rx="6" fill="#111"/>`; }
  s += `</g>`;
  return s;
}
function shotStreetDayWalk(sh, lt, B){
  let s = bgMarileneExt(lt);
  s += `<rect width="1080" height="1920" fill="#000" opacity=".05"/>`;
  const x=lerp(-60,520,clamp(lt/B.dur,0,1));
  s += `<ellipse cx="${x}" cy="1820" rx="80" ry="14" fill="#000" opacity=".25"/>` + femSil(x,1820,1.15,lt*6,{hair:'bob',col:'#1f4d3a'});
  s += `<g transform="translate(${x-150},${1820-230})"><rect x="0" y="0" width="90" height="130" rx="12" fill="#5a2d1e"/><rect x="40" y="-60" width="10" height="60" fill="#333"/><circle cx="20" cy="138" r="10" fill="#222"/><circle cx="70" cy="138" r="10" fill="#222"/></g>`;
  // olhares das janelas
  for (let i=0;i<3;i++){ const on = lt>.8+i*.6; if (on) s += `<g opacity=".9"><ellipse cx="${120+i*360}" cy="${1520}" rx="34" ry="42" fill="#1b1b1b"/><circle cx="${110+i*360}" cy="1512" r="5" fill="#fff"/><circle cx="${132+i*360}" cy="1512" r="5" fill="#fff"/></g>`; }
  return s;
}
function shotGallery(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgPharmacyIn(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".3"/>`;
  const img = `<rect x="-270" y="-560" width="540" height="1120" fill="#000"/><g transform="translate(0,-60) scale(.5) translate(-700,-1250)">${bgRiver(2)}${moto(700,1560,1.0)}${silhouette(690,1400,.62,0,{col:'#04060b'})}${femSil(560,1420,.62,0,{hair:'long',col:'#04060b'})}</g><rect x="-270" y="-560" width="540" height="110" fill="#000" opacity=".7"/><text x="-240" y="-490" font-family="Inter" font-weight="700" font-size="30" fill="#fff">‹  Fotos</text><text x="240" y="-490" text-anchor="end" font-family="Inter" font-size="24" fill="#bbb">Ontem 23:04</text>`;
  const z=lerp(1.0,1.2,easeIO(lt/B.dur));
  s += `<g transform="translate(540,900) scale(${z}) translate(-540,-900)">${phone(540,920,540,1120,-4,img,{id:'gl',back:handBack(CH.raimundinha.skin,CH.raimundinha.shade),front:handFront(CH.raimundinha.skin,CH.raimundinha.shade)})}</g>`;
  return s;
}
Object.assign(SHOTS, { door_knock:shotDoorKnock, boat_arrive:shotBoatArrive, street_day_walk:shotStreetDayWalk, gallery:shotGallery });
Object.assign(BG, { house_dark:bgHouseDark, port:bgPort, pharmacy_in:bgPharmacyIn });
Object.assign(RIM, { house_dark:'#9db8ff', port:'#fff6d8', pharmacy_in:'#ffffff' });
Object.assign(GRADE, { house_dark:['#1a2a55',.45], port:['#fff0d0',.06], pharmacy_in:['#e8fff2',.05] });
