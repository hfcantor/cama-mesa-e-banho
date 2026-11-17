// Episódio 2 — cenários e inserts novos
// ------------------------------------------------------------------ cenários
function bgBarDay(t){
  let s = bgBar(t, {day:true});
  s += `<rect width="1080" height="1920" fill="#fff1d2" opacity=".10"/>`;
  s += `<path d="M 1080 120 L 1080 520 L 300 1920 L -100 1920 Z" fill="#fff4d6" opacity=".10"/><path d="M 1080 600 L 1080 760 L 600 1920 L 420 1920 Z" fill="#fff4d6" opacity=".07"/>`;
  return s;
}
function bgBarExtDay(t){
  let s = `<rect width="1080" height="1920" fill="url(#skyD)"/><circle cx="880" cy="200" r="70" fill="#fff6d8" opacity=".9"/>`;
  for (let i=0;i<3;i++) s += `<ellipse cx="${(200+i*330+t*8)%1300-100}" cy="${170+i*70}" rx="${110+i*20}" ry="30" fill="#fff" opacity=".7"/>`;
  s += `<path d="M -40 470 L 540 330 L 1120 470 Z" fill="#6d6f73"/><rect x="0" y="460" width="1080" height="1120" fill="#3f7a7f"/>`;
  for (let y=470;y<1580;y+=48) s += `<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="#346468" stroke-width="5"/>`;
  s += `<rect x="150" y="510" width="780" height="190" rx="8" fill="#a52a2a" stroke="#f0c75a" stroke-width="6"/><text x="540" y="615" text-anchor="middle" font-family="Inter" font-weight="900" font-size="94" fill="#ffd966">BAR DO SANDRO</text><text x="540" y="672" text-anchor="middle" font-family="Inter" font-weight="700" font-size="38" fill="#fff1d0">Rua da Felicidade</text>`;
  s += `<rect x="560" y="780" width="330" height="800" fill="#8c9196"/>`;
  for (let y=790;y<1580;y+=26) s += `<line x1="560" y1="${y}" x2="890" y2="${y}" stroke="#6f7479" stroke-width="5"/>`;
  s += `<rect x="560" y="780" width="330" height="800" fill="none" stroke="#2a4c4f" stroke-width="16"/><rect x="700" y="1540" width="50" height="22" rx="4" fill="#3b3f44"/>`;
  s += `<rect x="130" y="860" width="300" height="240" fill="#bcd9e8"/><rect x="130" y="860" width="300" height="240" fill="none" stroke="#2a4c4f" stroke-width="14"/><line x1="280" y1="860" x2="280" y2="1100" stroke="#2a4c4f" stroke-width="10"/>`;
  s += `<rect y="1580" width="1080" height="340" fill="#a88a66"/><ellipse cx="540" cy="1760" rx="700" ry="60" fill="#8f7454" opacity=".5"/>`;
  s += `<rect x="40" y="1520" width="220" height="40" fill="#c4231f" transform="rotate(-6 150 1540)"/>`;
  return s;
}
function bgHouse(t, night){
  let s = `<rect width="1080" height="1920" fill="${night?'#3c5a52':'#9cc9b6'}"/>`;
  for (let x=0;x<1080;x+=80) s += `<line x1="${x}" y1="0" x2="${x}" y2="1920" stroke="${night?'#2f4943':'#86b5a1'}" stroke-width="5"/>`;
  // janela
  s += `<rect x="620" y="300" width="360" height="460" fill="${night?'#0b1430':'#bfe6ff'}"/>`;
  if (night) s += `<circle cx="880" cy="400" r="30" fill="#f3ecd5"/>`; else s += `<circle cx="900" cy="380" r="50" fill="#fff6c8"/>`;
  s += `<rect x="620" y="300" width="360" height="460" fill="none" stroke="#f3efe6" stroke-width="18"/><line x1="800" y1="300" x2="800" y2="760" stroke="#f3efe6" stroke-width="12"/>`;
  s += `<path d="M 590 280 Q 640 520 600 790 L 660 790 Q 690 520 650 280 Z" fill="#e48aa0"/><path d="M 1010 280 Q 960 520 1000 790 L 940 790 Q 910 520 950 280 Z" fill="#e48aa0"/>`;
  // espelho e plaquinha
  s += `<circle cx="250" cy="430" r="150" fill="#d8e6ea" stroke="#d4a74a" stroke-width="16"/><path d="M 170 370 L 220 330" stroke="#fff" stroke-width="10" opacity=".7"/>`;
  s += `<rect x="130" y="640" width="250" height="90" rx="14" fill="#fff"/><text x="255" y="698" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#d64f7a">Kel Unhas</text>`;
  // prateleira de esmaltes
  s += `<rect x="80" y="980" width="560" height="20" fill="#f3efe6"/>`;
  const cols=['#d62f4b','#f2a1c0','#7b2a8c','#e8b84a','#2f6ed1','#151515','#ff7a59','#c2185b'];
  for (let i=0;i<8;i++) s += `<rect x="${100+i*66}" y="920" width="40" height="60" rx="8" fill="${cols[i]}"/><rect x="${110+i*66}" y="895" width="20" height="28" rx="4" fill="#222"/>`;
  // samambaia
  s += `<path d="M 900 960 L 960 960 L 950 1060 L 910 1060 Z" fill="#b5653a"/>`;
  for (let k=0;k<9;k++){ const a=-Math.PI+k*Math.PI/8; s += `<path d="M 930 960 q ${Math.cos(a)*80} ${Math.sin(a)*60-40} ${Math.cos(a)*150} ${Math.sin(a)*60+60}" stroke="#2f7d3c" stroke-width="16" fill="none" stroke-linecap="round"/>`; }
  s += `<rect y="1350" width="1080" height="570" fill="${night?'#4a3424':'#c99a6b'}"/>`;
  if (night) s += `<rect width="1080" height="1920" fill="#06102a" opacity=".35"/><circle cx="300" cy="200" r="260" fill="url(#bulbGlow)" opacity=".7"/>`;
  return s;
}
function bgMarilene(t){
  let s = `<rect width="1080" height="1920" fill="#2c5c86"/>`;
  for (let y=0;y<1920;y+=60) s += `<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="#244e73" stroke-width="4"/>`;
  // bandeirinhas
  for (const y0 of [130,250]){ s += `<path d="M -20 ${y0} Q 540 ${y0+90} 1100 ${y0}" stroke="#1a1a1a" stroke-width="3" fill="none"/>`;
    const fc=['#e53935','#fdd835','#43a047','#1e88e5','#fb8c00','#8e24aa'];
    for (let i=0;i<14;i++){ const x=i*80, y=y0+90*(1-Math.pow((x-540)/560,2))*.5+4, sw=Math.sin(t*2+i)*4; s += `<path d="M ${x} ${y} L ${x+50} ${y} L ${x+25+sw} ${y+50} Z" fill="${fc[i%6]}"/>`; } }
  s += `<rect x="150" y="330" width="780" height="200" rx="10" fill="#f5c518" stroke="#1d1d1d" stroke-width="8"/><text x="540" y="430" text-anchor="middle" font-family="Inter" font-weight="900" font-size="84" fill="#1f3f63">BAR DA MARILENE</text><text x="540" y="492" text-anchor="middle" font-family="Inter" font-weight="700" font-size="38" fill="#1f3f63">Rua do Sossego</text>`;
  // geladeira
  s += `<rect x="60" y="640" width="300" height="720" rx="20" fill="#f2f2f2"/><rect x="60" y="640" width="300" height="140" rx="20" fill="#d32f2f"/><text x="210" y="728" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" fill="#fff">GELADA</text><rect x="85" y="810" width="250" height="520" rx="10" fill="#cfe8f2"/>`;
  for (let r=0;r<4;r++) for (let i=0;i<5;i++) s += `<rect x="${100+i*46}" y="${830+r*125}" width="30" height="100" rx="8" fill="${r%2?'#6b3a12':'#1f5131'}"/>`;
  // TV
  s += `<rect x="640" y="640" width="360" height="230" rx="10" fill="#111"/><rect x="655" y="655" width="330" height="200" fill="#2f8f3e"/><line x1="820" y1="655" x2="820" y2="855" stroke="#fff" stroke-width="3"/><circle cx="820" cy="755" r="40" fill="none" stroke="#fff" stroke-width="3"/><circle cx="${720+Math.sin(t*1.5)*60}" cy="${760+Math.cos(t*2)*40}" r="6" fill="#fff"/>`;
  s += `<rect x="690" y="960" width="200" height="240" fill="#fff"/><text x="790" y="1000" text-anchor="middle" font-family="Inter" font-weight="900" font-size="28" fill="#c62828">NOVEMBRO</text>`;
  for (let r=0;r<4;r++) for (let i=0;i<5;i++) s += `<rect x="${705+i*36}" y="${1020+r*42}" width="26" height="30" fill="#eee"/>`;
  s += `<rect x="0" y="1380" width="1080" height="70" fill="#8a5a2c"/><rect x="0" y="1450" width="1080" height="470" fill="#5b3a1d"/>`;
  return s;
}
function bgGarage(t){
  let s = `<rect width="1080" height="1920" fill="#7c7f84"/>`;
  for (let y=0;y<1920;y+=120) s += `<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="#6f7277" stroke-width="3"/>`;
  s += `<rect x="120" y="230" width="840" height="150" rx="8" fill="#1f2a37"/><text x="540" y="320" text-anchor="middle" font-family="Inter" font-weight="900" font-size="64" fill="#ffb300">OFICINA DO JUVENAL</text><text x="540" y="362" text-anchor="middle" font-family="Inter" font-weight="700" font-size="30" fill="#e0e0e0">CONSERTO DE MOTOS</text>`;
  // painel de ferramentas
  s += `<rect x="80" y="460" width="560" height="420" fill="#c9a77c"/>`;
  for (let r=0;r<8;r++) for (let i=0;i<12;i++) s += `<circle cx="${105+i*45}" cy="${485+r*50}" r="4" fill="#8b6c45"/>`;
  for (let i=0;i<6;i++) s += `<g transform="translate(${130+i*85},560) rotate(${i*8-20})"><rect x="-9" y="0" width="18" height="190" rx="6" fill="#9ea7ad"/><circle cx="0" cy="0" r="24" fill="none" stroke="#9ea7ad" stroke-width="14"/></g>`;
  // porta de enrolar aberta com luz
  s += `<rect x="700" y="420" width="380" height="1000" fill="#fff4d6"/><rect x="700" y="420" width="380" height="120" fill="#5d6166"/>`;
  for (let y=430;y<540;y+=20) s += `<line x1="700" y1="${y}" x2="1080" y2="${y}" stroke="#4a4e52" stroke-width="4"/>`;
  s += `<rect x="760" y="900" width="320" height="520" fill="#a5c8d8" opacity=".6"/>`;
  // pneus
  for (let i=0;i<3;i++) s += `<ellipse cx="200" cy="${1230-i*70}" rx="150" ry="45" fill="#1b1b1b"/><ellipse cx="200" cy="${1230-i*70}" rx="70" ry="20" fill="#555"/>`;
  s += `<rect x="440" y="1080" width="160" height="300" rx="20" fill="#2c5f9e"/><rect x="440" y="1120" width="160" height="16" fill="#1f4a7a"/>`;
  s += `<rect y="1400" width="1080" height="520" fill="#55585c"/><ellipse cx="380" cy="1600" rx="160" ry="30" fill="#2b2b2b" opacity=".6"/>`;
  return s;
}
function bgRiver(t){
  let s = `<rect width="1080" height="1920" fill="url(#skyN)"/>`;
  for (let i=0;i<90;i++) s += `<circle cx="${R(i)*1080}" cy="${R(i+300)*900}" r="${.8+R(i+70)*1.6}" fill="#fff" opacity="${.3+.6*Math.abs(Math.sin(t+i))}"/>`;
  s += `<circle cx="260" cy="330" r="150" fill="url(#moonGlow)"/><circle cx="260" cy="330" r="44" fill="#f3ecd5"/>`;
  s += `<path d="M 0 1010 Q 120 960 260 990 Q 420 950 560 985 Q 720 945 880 980 Q 980 960 1080 975 L 1080 1060 L 0 1060 Z" fill="#070b16"/>`;
  s += `<rect y="1050" width="1080" height="420" fill="#0b1a33"/>`;
  for (let i=0;i<26;i++){ const y=1070+i*15, w=40+R(i)*120, x=260-w/2+Math.sin(t*1.5+i)*20; s += `<rect x="${x}" y="${y}" width="${w}" height="4" rx="2" fill="#f3ecd5" opacity="${.5-i*.016}"/>`; }
  for (let i=0;i<14;i++){ const y=1080+R(i+5)*360, x=R(i+9)*1080+Math.sin(t+i)*10; s += `<rect x="${x}" y="${y}" width="${60+R(i)*80}" height="3" fill="#2f4a7a" opacity=".6"/>`; }
  // barco regional e trapiche
  s += `<path d="M 600 1120 L 960 1120 L 920 1170 L 640 1170 Z" fill="#05070d"/><rect x="680" y="1060" width="200" height="60" fill="#05070d"/><rect x="700" y="1075" width="30" height="20" fill="#f0b35a" opacity=".8"/>`;
  s += `<path d="M -20 1400 L 520 1300 L 520 1320 L -20 1430 Z" fill="#1e1712"/>`;
  for (let i=0;i<6;i++) s += `<rect x="${20+i*90}" y="${1390-i*18}" width="14" height="${160}" fill="#140f0b"/>`;
  // margem e mangueira
  s += `<path d="M 0 1470 Q 540 1420 1080 1470 L 1080 1920 L 0 1920 Z" fill="#1a1510"/>`;
  s += `<rect x="800" y="900" width="60" height="600" fill="#05070b"/>`;
  for (let i=0;i<9;i++) s += `<circle cx="${700+R(i+3)*300}" cy="${760+R(i+4)*220}" r="${110+R(i)*40}" fill="#05070b"/>`;
  s += `<line x1="140" y1="1470" x2="140" y2="760" stroke="#05070b" stroke-width="12"/><circle cx="160" cy="770" r="200" fill="url(#lampGlow)" opacity=".5"/><ellipse cx="160" cy="1560" rx="240" ry="50" fill="#ffb35c" opacity=".08"/>`;
  return s;
}
function bgPharmacy(t){
  let s = bgNight(t);
  s += `<rect x="80" y="760" width="700" height="760" fill="#e8ece9"/><rect x="80" y="760" width="700" height="140" fill="#1f8a5a"/><text x="430" y="855" text-anchor="middle" font-family="Inter" font-weight="900" font-size="76" fill="#fff">FARMÁCIA</text>`;
  const g=.75+.25*Math.sin(t*6);
  s += `<g transform="translate(860,820)"><rect x="-30" y="-90" width="60" height="180" fill="#3dff8a" opacity="${g}"/><rect x="-90" y="-30" width="180" height="60" fill="#3dff8a" opacity="${g}"/><circle r="200" fill="#3dff8a" opacity="${.12*g}"/></g>`;
  s += `<rect x="160" y="980" width="540" height="540" fill="#bfc6c2"/>`;
  for (let y=990;y<1250;y+=24) s += `<line x1="160" y1="${y}" x2="700" y2="${y}" stroke="#a3aaa6" stroke-width="5"/>`;
  s += `<rect x="160" y="1250" width="540" height="270" fill="#fff7d6" opacity=".9"/>`;
  return s;
}

// ------------------------------------------------------------------ silhuetas extras
function femSil(x,y,sc,ph,o={}){
  const col=o.col||'#05070c', legA=Math.sin(ph)*.35, bob=Math.abs(Math.cos(ph))*-5;
  let s=`<g transform="translate(${x},${y+bob*sc}) scale(${o.flip?-sc:sc},${sc})">`;
  const leg=(a,dx)=>`<g transform="rotate(${a*57} ${dx} -200)"><rect x="${dx-13}" y="-205" width="26" height="205" rx="11" fill="${col}"/></g>`;
  s += leg(legA,-12)+leg(-legA,12);
  s += `<path d="M -70 -200 L 70 -200 L 40 -440 L -40 -440 Z" fill="${col}"/><rect x="-62" y="-445" width="124" height="40" rx="18" fill="${col}"/>`;
  s += `<rect x="-11" y="-490" width="22" height="30" fill="${col}"/><ellipse cx="0" cy="-535" rx="38" ry="47" fill="${col}"/>`;
  if (o.hair==='long') s += `<path d="M -42 -560 Q -60 -470 -50 -400 L 50 -400 Q 60 -470 42 -560 Z" fill="${col}"/>`;
  if (o.hair==='bob') s += `<path d="M -44 -565 Q -54 -500 -44 -480 L 44 -480 Q 54 -500 44 -565 Z" fill="${col}"/>`;
  if (o.hair==='bun') s += `<circle cx="0" cy="-600" r="34" fill="${col}"/>`;
  if (o.bag) s += `<rect x="40" y="-380" width="60" height="70" rx="10" fill="${col}"/><line x1="-30" y1="-445" x2="60" y2="-380" stroke="${col}" stroke-width="6"/>`;
  if (o.rim) s += `<ellipse cx="0" cy="-535" rx="38" ry="47" fill="none" stroke="${o.rim}" stroke-width="4" opacity=".6"/>`;
  return s+`</g>`;
}
function moto(x,y,sc,o={}){
  const col=o.col||'#04060b';
  let s=`<g transform="translate(${x},${y}) scale(${sc})">`;
  s += `<circle cx="-170" cy="-70" r="70" fill="none" stroke="${col}" stroke-width="22"/><circle cx="170" cy="-70" r="70" fill="none" stroke="${col}" stroke-width="22"/>`;
  s += `<path d="M -170 -70 L -60 -150 L 90 -150 L 170 -70 L 120 -70 L 60 -110 L -40 -110 Z" fill="${col}"/><path d="M -90 -150 L -20 -190 L 110 -190 L 120 -150 Z" fill="${col}"/>`;
  s += `<path d="M 90 -150 L 140 -250 L 180 -250" stroke="${col}" stroke-width="16" fill="none"/>`;
  if (o.rim) s += `<path d="M -90 -150 L -20 -190 L 110 -190" stroke="${o.rim}" stroke-width="4" fill="none" opacity=".6"/>`;
  return s+`</g>`;
}

// ------------------------------------------------------------------ inserts
function shotEnvelopeFloor(sh, lt, B){
  const z=lerp(1,1.25,easeIO(clamp(lt/B.dur,0,1))), rv=clamp((lt-(sh.revealAt??1))/.6,0,1);
  let s = `<g transform="translate(540,1200) scale(${z}) translate(-540,-1200)">`;
  s += `<rect width="1080" height="1920" fill="#2b1a0e"/>`;
  for (let i=0;i<14;i++){ const x0=540+(i-7)*300; s += `<path d="M ${540+(i-7)*30} 700 L ${x0} 1920" stroke="#1d1108" stroke-width="5"/>`; }
  s += `<path d="M 0 700 L 1080 700 L 1080 1920 L 0 1920 Z" fill="#5a3a20" opacity=".55"/>`;
  s += `<rect x="-100" y="0" width="1280" height="520" fill="#1a0f07"/><rect x="-100" y="500" width="1280" height="40" fill="#3a2414"/>`;
  s += `<rect x="120" y="520" width="50" height="800" fill="#2a180b"/><rect x="910" y="520" width="50" height="800" fill="#2a180b"/>`;
  s += `<path d="M 1080 300 L 1080 600 L 520 1920 L 150 1920 Z" fill="#fff1c9" opacity="${.06+.12*rv}"/>`;
  s += `<g transform="translate(560,1260) rotate(-8)"><rect x="-150" y="-95" width="300" height="190" rx="6" fill="#efe3c4"/><path d="M -150 -95 L 0 20 L 150 -95" stroke="#cbb88f" stroke-width="5" fill="none"/><rect x="-150" y="-95" width="300" height="190" rx="6" fill="#fff6d8" opacity="${.35*rv}"/></g>`;
  s += `</g><rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
  return s;
}
function shotEnvelopePick(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgBarDay(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".25"/>`;
  const up = easeIO(clamp((lt-.3)/1.2,0,1));
  const sk=CH.sandro.skin, sd=CH.sandro.shade;
  s += `<g transform="translate(540,${lerp(1250,900,up)}) rotate(${lerp(-8,4,up)})"><rect x="-220" y="-140" width="440" height="280" rx="8" fill="#efe3c4"/><path d="M -220 -140 L 0 30 L 220 -140" stroke="#cbb88f" stroke-width="7" fill="none"/>`;
  s += `<path d="M 160 -40 C 260 -60 380 0 420 120 L 520 420 L 300 520 L 180 160 Z" fill="${sk}"/><path d="M 170 -50 q 60 -40 110 10 l -40 40 q -40 -30 -70 -10 Z" fill="${sk}"/>`;
  for (let i=0;i<3;i++) s += `<rect x="${110+i*10}" y="${30+i*55}" width="120" height="44" rx="22" fill="${sk}"/><path d="M ${120+i*10} ${52+i*55} l 20 0" stroke="${sd}" stroke-width="4"/>`;
  s += `</g>`;
  return s;
}
function shotDrawer(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="#3a2414"/>`;
  for (let y=0;y<1920;y+=140) s += `<rect y="${y}" width="1080" height="134" fill="${R(y)>.5?'#4a2e17':'#432913'}"/>`;
  const close = sh.still?0:easeIO(clamp((lt-(sh.closeAt??1.0))/.5,0,1)), slide=sh.still?1:easeOut(clamp(lt/.6,0,1));
  const dy = lerp(0,-520,close);
  s += `<g transform="translate(0,${dy})"><rect x="140" y="760" width="800" height="760" fill="#24150a"/><rect x="160" y="780" width="760" height="720" fill="#1a0f06"/>`;
  s += `<rect x="220" y="1250" width="200" height="140" rx="6" fill="#e8e1cf"/><circle cx="700" cy="1400" r="26" fill="#b8902f"/><circle cx="760" cy="1420" r="22" fill="#9e9e9e"/><rect x="560" y="1200" width="180" height="40" rx="18" fill="#7a7a7a" transform="rotate(25 650 1220)"/>`;
  s += `<g transform="translate(${lerp(900,540,slide)},${lerp(900,1050,slide)}) rotate(${lerp(20,-4,slide)})"><rect x="-200" y="-125" width="400" height="250" rx="6" fill="#efe3c4"/><path d="M -200 -125 L 0 30 L 200 -125" stroke="#cbb88f" stroke-width="6" fill="none"/></g>`;
  s += `<rect x="140" y="1520" width="800" height="200" fill="#6b4322"/><rect x="480" y="1590" width="120" height="40" rx="12" fill="#c9a24a"/></g>`;
  s += `<rect x="100" y="${1520+dy}" width="880" height="${400-dy}" fill="#4a2e17"/><rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
  return s;
}
function shotNails(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="#f3e7ea"/>`;
  for (let i=0;i<30;i++) s += `<circle cx="${R(i)*1080}" cy="${R(i+40)*1920}" r="40" fill="#f9d6df" opacity=".6"/>`;
  s += `<rect x="60" y="560" width="960" height="900" rx="40" fill="#ffffff"/>`;
  const cols=['#d62f4b','#f2a1c0','#7b2a8c','#e8b84a','#2f6ed1'];
  cols.forEach((c,i)=> s += `<rect x="${120+i*80}" y="420" width="56" height="90" rx="12" fill="${c}"/><rect x="${133+i*80}" y="380" width="30" height="44" rx="6" fill="#222"/>`);
  const rk=CH.raimundinha.skin, kk=CH.keliane.skin;
  // mão da cliente
  s += `<path d="M -40 1180 C 200 1120 380 1090 520 1080 L 560 1180 C 380 1220 200 1260 -40 1320 Z" fill="${rk}"/>`;
  for (let i=0;i<4;i++){ const fx=520+i*8, fy=1000+i*55; s += `<rect x="${fx}" y="${fy}" width="180" height="48" rx="24" fill="${rk}"/><rect x="${fx+130}" y="${fy+6}" width="40" height="36" rx="12" fill="${i<2?'#d62f4b':'#e8c3b8'}"/>`; }
  // mão da manicure com pincel
  const bx = 700+Math.sin(lt*3)*14;
  s += `<path d="M 1120 760 C 960 800 860 860 ${bx+80} 960 L ${bx+160} 1040 C 980 980 1060 920 1120 900 Z" fill="${kk}"/><rect x="${bx-20}" y="980" width="170" height="14" rx="7" fill="#222" transform="rotate(-30 ${bx} 990)"/>`;
  // celular sobre a mesa
  const on = lt>(sh.buzzAt??3), shake=buzzShake(lt,[sh.buzzAt??3]);
  s += `<g transform="translate(${300+shake},${1600}) rotate(-12)"><rect x="-130" y="-230" width="260" height="460" rx="34" fill="#111"/><rect x="-118" y="-218" width="236" height="436" rx="26" fill="${on?'#2a2f45':'#05060a'}"/>`;
  if (on) s += `<rect x="-105" y="-150" width="210" height="80" rx="14" fill="#f2f4f7" opacity=".95"/><circle cx="-75" cy="-110" r="18" fill="#c2185b"/><rect x="-48" y="-125" width="120" height="12" rx="6" fill="#999"/><rect x="-48" y="-102" width="80" height="10" rx="5" fill="#bbb"/>`;
  s += `</g>`;
  return s;
}
function shotPhoneName(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgHouse(lt,false)}</g><rect width="1080" height="1920" fill="#000" opacity=".25"/>`;
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="url(#lockG)"/>${statusBar('16:12')}<text x="0" y="-300" text-anchor="middle" font-family="Inter" font-weight="300" font-size="150" fill="#fff">16:12</text><text x="0" y="-235" text-anchor="middle" font-family="Inter" font-weight="500" font-size="34" fill="#dfe6ee">Sexta-feira</text>`;
  scr += `<rect x="-240" y="-160" width="480" height="190" rx="30" fill="#f2f4f7" opacity=".96"/>${avatar(-180,-98,32,'V','#c2185b')}<text x="-130" y="-108" font-family="Inter" font-weight="800" font-size="32" fill="#111">Cliente Val</text><text x="210" y="-110" text-anchor="end" font-family="Inter" font-size="24" fill="#666">agora</text>`;
  scr += `<text x="-215" y="-35" font-family="Inter" font-weight="600" font-size="31" fill="#222">Hoje 23h.</text><text x="-215" y="5" font-family="Inter" font-weight="600" font-size="31" fill="#222">No mesmo lugar?</text>`;
  const z = lerp(1.0,1.25,easeIO(clamp(lt/B.dur,0,1)));
  s += `<g transform="translate(540,780) scale(${z}) translate(-540,-780)">${phone(540,900,540,1120,6,scr,{id:'pn'})}</g>`;
  // reflexo dos óculos da Raimundinha no topo
  s += `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
  return s;
}
function shotFacade(sh, lt, B){
  const z = lerp(1.0,1.07,easeIO(lt/B.dur));
  const bg = sh.place==='marilene' ? bgMarileneExt : (sh.place==='bar_day'? bgBarExtDay : bgGarageExt);
  let s = `<g transform="translate(540,1000) scale(${z}) translate(-540,-1000)">${bg(lt)}</g>`;
  const op = clamp((lt-.2)/.4,0,1);
  if (sh.tag) s += `<g opacity="${op}"><rect x="60" y="1700" width="8" height="110" fill="#5dff3a"/><text x="90" y="1745" font-family="Inter" font-weight="900" font-size="44" fill="#fff" stroke="#000" stroke-width="6" paint-order="stroke">${esc(sh.tag)}</text><text x="90" y="1795" font-family="Inter" font-weight="600" font-size="32" fill="#fff" stroke="#000" stroke-width="5" paint-order="stroke">${esc(sh.sub||'')}</text></g>`;
  return s;
}
function bgMarileneExt(t){
  let s = `<rect width="1080" height="1920" fill="url(#skyD)"/>`;
  s += `<path d="M -40 470 L 540 330 L 1120 470 Z" fill="#7a3b2b"/><rect x="0" y="460" width="1080" height="1120" fill="#e9d6a6"/>`;
  s += `<rect x="130" y="520" width="820" height="200" rx="10" fill="#f5c518" stroke="#1d1d1d" stroke-width="8"/><text x="540" y="625" text-anchor="middle" font-family="Inter" font-weight="900" font-size="80" fill="#1f3f63">BAR DA MARILENE</text><text x="540" y="685" text-anchor="middle" font-family="Inter" font-weight="700" font-size="38" fill="#1f3f63">Rua do Sossego</text>`;
  s += `<rect x="380" y="800" width="320" height="780" fill="#2c5c86"/><rect x="420" y="860" width="240" height="420" fill="#173a5c"/>`;
  for (let i=0;i<10;i++){ const x=i*110, sw=Math.sin(t*2+i)*4, fc=['#e53935','#fdd835','#43a047','#1e88e5','#fb8c00'][i%5]; s += `<path d="M ${x} 760 L ${x+60} 760 L ${x+30+sw} 820 Z" fill="${fc}"/>`; }
  s += `<path d="M -10 760 L 1090 760" stroke="#333" stroke-width="3"/>`;
  s += `<rect y="1580" width="1080" height="340" fill="#b39572"/>` + plasticTable(180,1760) + plasticChair(820,1780);
  return s;
}
function bgGarageExt(t){ return bgGarage(t); }

function shotFlashback(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="#2a2016"/>`;
  s += `<rect x="640" y="260" width="300" height="900" fill="#e9d8b0" opacity=".5"/>`;
  s += silhouette(790,1150,.9,0,{col:'#1a140e'});
  s += `<rect x="0" y="1150" width="1080" height="770" fill="#3a2d20"/>`;
  const give = easeIO(clamp((lt-(sh.giveAt??3))/1.0,0,1));
  const ck=CH.diego.skin;
  s += `<path d="M -60 1300 C 120 1260 260 1250 360 1260 L 380 1380 C 260 1400 120 1420 -60 1460 Z" fill="${ck}"/>`;
  s += `<g transform="translate(400,1300)"><rect x="-40" y="-60" width="230" height="120" rx="10" fill="#7fb38a"/><rect x="-30" y="-50" width="210" height="100" fill="#9fcca7"/><text x="75" y="15" text-anchor="middle" font-family="Inter" font-weight="900" font-size="40" fill="#4b7a55">R$</text></g>`;
  s += `<g transform="translate(${lerp(1200,640,give)},${lerp(1180,1290,give)})"><rect x="-40" y="-60" width="230" height="120" rx="10" fill="#7fb38a" opacity="${give}"/><path d="M 120 -40 C 260 -60 420 -40 520 -20 L 520 120 C 420 120 260 110 120 80 Z" fill="#1e1b19"/><rect x="40" y="-30" width="120" height="90" rx="30" fill="#a07b5b"/></g>`;
  s += `<rect width="1080" height="1920" fill="#704214" opacity=".35" style="mix-blend-mode:color"/>`;
  s += `<rect width="1080" height="1920" fill="#000" opacity="${.08+.06*R(Math.floor(lt*12))}"/>`;
  for (let i=0;i<3;i++){ const x=R(Math.floor(lt*8)+i)*1080; s += `<line x1="${x}" y1="0" x2="${x}" y2="1920" stroke="#fff" stroke-width="2" opacity=".15"/>`; }
  s += `<text x="540" y="200" text-anchor="middle" font-family="Inter" font-weight="800" font-size="44" letter-spacing="8" fill="#f3e2c0" opacity=".85">MESES ANTES</text>`;
  s += `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
  return s;
}
function shotChatIn(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgGarage(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".45"/>`;
  const arrive = lt>(sh.msgAt??2.9);
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="#0f141a"/><rect x="-270" y="-560" width="540" height="190" fill="#1a2129"/>${avatar(-170,-440,40,'K','#7b1fa2')}<text x="-112" y="-450" font-family="Inter" font-weight="800" font-size="36" fill="#fff">Keliane</text><text x="-112" y="-405" font-family="Inter" font-weight="600" font-size="26" fill="#4cd964">${arrive?'online':'digitando...'}</text>`;
  scr += bubble(0,-300,330,'Tá tudo bem?',true,'21:40');
  if (!arrive){ const d=Math.floor(lt*3)%3; scr += `<rect x="-230" y="-170" width="140" height="70" rx="26" fill="#262b33"/>${[0,1,2].map(i=>`<circle cx="${-190+i*30}" cy="-135" r="9" fill="#cfd8dc" opacity="${i===d?1:.4}"/>`).join('')}`; }
  else { scr += bubble(0,-170,360,'Amor, hoje não dá.',false,'21:42'); scr += bubble(0,-50,420,'Tenho cliente até tarde',false,'21:42'); }
  s += `<g transform="translate(540,980) scale(${lerp(1,1.08,lt/B.dur)}) translate(-540,-980)">${phone(540,920,540,1120,4,scr,{id:'ci',back:handBack(CH.rafael.skin,CH.rafael.shade,{watch:true,grease:true}),front:handFront(CH.rafael.skin,CH.rafael.shade)})}</g>`;
  return s;
}
function shotPharmacyExit(sh, lt, B){
  let s = bgPharmacy(lt);
  const x = lerp(430,900,clamp(lt/B.dur,0,1));
  s += `<ellipse cx="${x}" cy="1620" rx="70" ry="14" fill="#000" opacity=".5"/>` + femSil(x,1620,.95,lt*6,{hair:'bun',bag:true,rim:'#3dff8a'});
  s += `<rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  return s;
}
function shotRiverMoto(sh, lt, B){
  const z = lerp(1.3,1.5,easeIO(clamp(lt/B.dur,0,1)));
  let s = `<g transform="translate(700,1400) scale(${z}) translate(-700,-1400)">${bgRiver(lt)}`;
  s += moto(700,1560,1.0,{rim:'#9db8ff'});
  s += silhouette(690,1400,.62,0,{col:'#04060b',rim:'#9db8ff'});
  s += `<rect x="655" y="1030" width="70" height="16" rx="6" fill="#9db8ff" opacity="${.5+.4*Math.sin(lt*3)}"/>`;
  const k0=sh.kelAt??4.6, p=clamp((lt-k0)/1.2,0,1), up=clamp((lt-k0-1.2)/.5,0,1);
  if (lt>k0-.2){ const kx=lerp(1150,560,easeOut(p)), ky=lerp(1600,1420,up);
    s += femSil(kx,ky,.62,p<1?lt*6:0,{hair:'long',col:'#04060b',rim:'#c9a0ff'}); }
  s += `</g><rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  return s;
}
function shotPhotoCam(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgRiver(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".4"/>`;
  const vf = `<rect x="-270" y="-560" width="540" height="1120" fill="#000"/><g transform="scale(.5) translate(-700,-1250)">${bgRiver(lt)}${moto(700,1560,1.0)}${silhouette(690,1400,.62,0,{col:'#04060b'})}${femSil(560,1420,.62,0,{hair:'long',col:'#04060b'})}</g>`
   + `<rect x="-90" y="-60" width="180" height="180" fill="none" stroke="#ffd60a" stroke-width="4"/><rect x="-270" y="380" width="540" height="180" fill="#000" opacity=".7"/><circle cx="0" cy="470" r="56" fill="#fff"/><circle cx="0" cy="470" r="46" fill="none" stroke="#000" stroke-width="4"/><text x="0" y="-490" text-anchor="middle" font-family="Inter" font-weight="700" font-size="26" fill="#ffd60a">FOTO</text>`;
  const shot = lt>(sh.snapAt??1.4);
  s += `<g transform="translate(540,980) scale(${lerp(1,1.06,lt/B.dur)}) translate(-540,-980)">${phone(540,920,540,1120,-3,vf,{id:'pc',back:handBack(CH.raimundinha.skin,CH.raimundinha.shade),front:handFront(CH.raimundinha.skin,CH.raimundinha.shade)})}</g>`;
  if (shot){ const f=clamp(1-(lt-(sh.snapAt??1.4))/.35,0,1); s += `<rect width="1080" height="1920" fill="#fff" opacity="${f*.9}"/>`; }
  return s;
}
Object.assign(SHOTS, { envelope_floor:shotEnvelopeFloor, envelope_pick:shotEnvelopePick, drawer:shotDrawer, nails:shotNails, phone_name:shotPhoneName,
  facade:shotFacade, flashback:shotFlashback, chat_in:shotChatIn, pharmacy_exit:shotPharmacyExit, river_moto:shotRiverMoto, photo_cam:shotPhotoCam });
Object.assign(BG, { bar_day:bgBarDay, house:t=>bgHouse(t,false), house_night:t=>bgHouse(t,true), marilene:bgMarilene, garage:bgGarage, river:bgRiver });
Object.assign(RIM, { bar_day:'#ffe2b0', house:'#fff3e0', house_night:'#ffc27a', marilene:'#ffe08a', garage:'#fff4d6', river:'#9db8ff' });
Object.assign(GRADE, { bar_day:['#ffd59a',.08], house:['#ffe6ee',.06], house_night:['#2f4a7a',.25], marilene:['#ffd27a',.1], garage:['#ffe7c0',.08], river:['#20335f',.4] });
