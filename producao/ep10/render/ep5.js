// Episódio 5 — pichação, casa alugada, porta
function paga(x,y,sc,prog,t){
  const L=['P','A','G','A']; let s=`<g transform="translate(${x},${y}) scale(${sc})">`;
  L.forEach((ch,i)=>{ const o=clamp(prog*4-i,0,1); if(!o) return;
    s += `<text x="${i*170}" y="0" font-family="Inter" font-weight="900" font-size="230" fill="#c4161c" opacity="${.92*o}" transform="rotate(${-4+i*2} ${i*170} 0)">${ch}</text>`;
    for (let k=0;k<3;k++){ const dx=i*170+30+k*45, len=40+R(i*7+k)*120*o; s += `<rect x="${dx}" y="${-10}" width="8" height="${len}" rx="4" fill="#c4161c" opacity="${.85*o}"/>`; } });
  return s+`</g>`;
}
function bgGaragePaga(t){ return bgGarage(t) + paga(90,700,1,1,t); }
function shotGraffiti(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="#8a8d91"/>`;
  for (let i=0;i<300;i++) s += `<circle cx="${R(i)*1080}" cy="${R(i+99)*1920}" r="${1+R(i+5)*3}" fill="#6f7277" opacity=".6"/>`;
  for (let y=0;y<1920;y+=160) s += `<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="#7a7d81" stroke-width="4"/>`;
  const prog = clamp((lt-(sh.revealAt??2))/1.0,0,1), z=lerp(1.0,1.15,easeIO(lt/B.dur));
  s += `<g transform="translate(540,960) scale(${z}) translate(-540,-960)">${paga(60,1080,1.55,sh.instant?1:prog,lt)}</g>`;
  s += `<g transform="translate(820,1700) rotate(70)"><rect x="-40" y="-110" width="80" height="220" rx="16" fill="#c4161c"/><rect x="-22" y="-140" width="44" height="34" rx="6" fill="#ddd"/></g><path d="M 600 1820 q 120 -30 260 10" stroke="#c4161c" stroke-width="16" fill="none" opacity=".6"/>`;
  s += `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
  return s;
}
function bgRental(t){
  let s = bgNight(t);
  s += `<rect width="1080" height="1920" fill="#000" opacity=".15"/>`;
  s += `<path d="M 120 760 L 540 520 L 960 760 Z" fill="#1d1a16"/><rect x="160" y="760" width="760" height="760" fill="#6e6440"/>`;
  for (let y=780;y<1520;y+=44) s += `<line x1="160" y1="${y}" x2="920" y2="${y}" stroke="#5b5234" stroke-width="5"/>`;
  s += `<rect x="220" y="900" width="170" height="200" fill="#0d1220"/><rect x="690" y="900" width="170" height="200" fill="#0d1220"/>`;
  s += `<line x1="540" y1="700" x2="540" y2="770" stroke="#111" stroke-width="3"/><circle cx="540" cy="790" r="200" fill="url(#bulbGlow)" opacity="${.8+.2*Math.sin(t*13)}"/><circle cx="540" cy="790" r="14" fill="#ffe3a3"/>`;
  s += `<rect y="1520" width="1080" height="400" fill="#1f1912"/><ellipse cx="540" cy="1560" rx="380" ry="50" fill="#ffcf8a" opacity=".1"/>`;
  return s;
}
function shotGroupDoor(sh, lt, B){
  const z=lerp(1.0,1.18,easeIO(clamp(lt/B.dur,0,1)));
  let s = `<g transform="translate(540,1200) scale(${z}) translate(-540,-1200)">${bgRental(lt)}`;
  const kn=sh.knockAt??3.9, op=easeOut(clamp((lt-(sh.openAt??5.6))/1.2,0,1)), app=clamp((lt-(sh.tibAt??7.2))/.6,0,1);
  s += `<rect x="440" y="1010" width="200" height="510" fill="#ffcf8a" opacity="${op}"/>`;
  if (app>0) s += `<g opacity="${app}">${silhouette(540,1520,.85,0,{col:'#040507',broad:true,hair:'slick',rim:'#ffcf8a'})}</g>`;
  s += `<path d="M 440 1010 L ${440+200*(1-op)} ${1010+20*op} L ${440+200*(1-op)} ${1520-20*op} L 440 1520 Z" fill="#3b2a1a"/><rect x="430" y="1000" width="220" height="530" fill="none" stroke="#2a1d10" stroke-width="16"/>`;
  s += `</g>`;
  // grupo de costas
  const walk = clamp(lt/(kn-.3),0,1), gy = lerp(2200,1980,easeOut(walk)), ph = walk<1? lt*5 : 0;
  const knockArm = (lt>kn && lt<kn+.9) ? Math.sin((lt-kn)*20)*.3 : 0;
  s += silhouette(250,gy+30,1.15,ph,{col:'#020306'}) + silhouette(830,gy+40,1.15,ph+1,{col:'#020306'});
  s += silhouette(400,gy,1.25,ph+2,{col:'#020306',backpack:true}) + silhouette(640,gy-10,1.25,ph+.5+knockArm,{col:'#020306'});
  s += `<path d="M 590 ${gy-10-740} Q 640 ${gy-10-790} 690 ${gy-10-740} Z" fill="#020306"/>`;
  return s + `<rect width="1080" height="1920" fill="url(#vigCold)"/>`;
}
Object.assign(SHOTS, { graffiti:shotGraffiti, group_door:shotGroupDoor });
Object.assign(BG, { garage_paga:bgGaragePaga, rental_night:bgRental });
Object.assign(RIM, { garage_paga:'#fff4d6', rental_night:'#ffcf8a' });
Object.assign(GRADE, { garage_paga:['#ffe7c0',.08], rental_night:['#20335f',.35] });
