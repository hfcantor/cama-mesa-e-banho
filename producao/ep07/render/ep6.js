// Episódio 6 — envelope de dinheiro, trapiche, foto anônima
function shotCashCounter(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgPharmacyIn(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".2"/>`;
  s += `<rect y="1100" width="1080" height="820" fill="#dfe6e2"/><rect y="1100" width="1080" height="24" fill="#b9c4be"/>`;
  const slide = easeOut(clamp(lt/.9,0,1)), z=lerp(1,1.15,easeIO(lt/B.dur));
  s += `<g transform="translate(540,1400) scale(${z}) translate(-540,-1400)"><g transform="translate(${lerp(900,520,slide)},1420) rotate(-6)">`;
  s += `<rect x="-60" y="-200" width="260" height="120" rx="8" fill="#7fb38a" transform="rotate(-10)"/><rect x="-40" y="-190" width="260" height="120" rx="8" fill="#9fcca7" transform="rotate(-4)"/><text x="80" y="-110" font-family="Inter" font-weight="900" font-size="44" fill="#4b7a55" transform="rotate(-4)">R$ 100</text>`;
  s += `<rect x="-220" y="-120" width="440" height="280" rx="8" fill="#efe3c4"/><path d="M -220 -120 L 0 40 L 220 -120" stroke="#cbb88f" stroke-width="7" fill="none"/></g>`;
  s += `<path d="M 1200 1300 C 1000 1290 900 1330 ${lerp(1060,740,slide)} 1380 L ${lerp(1100,780,slide)} 1500 C 950 1480 1080 1470 1200 1480 Z" fill="${CH.bruno.skin}"/>`;
  s += `<path d="M 1100 1360 q 40 -20 80 0" stroke="#2c2c2c" stroke-width="5" fill="none"/></g>`;
  return s + `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
}
function shotPierMeet(sh, lt, B){
  const z=lerp(1.2,1.35,easeIO(lt/B.dur));
  let s = `<g transform="translate(400,1450) scale(${z}) translate(-400,-1450)">${bgRiver(lt)}`;
  s += `<rect width="1080" height="1920" fill="#000" opacity=".35"/>`;
  s += silhouette(330,1360,.6,0,{col:'#020306',backpack:true,rim:'#5f7fbf'});
  const p=clamp((lt-(sh.womanAt??3.5))/1.6,0,1);
  if (lt>(sh.womanAt??3.5)-.2) s += femSil(lerp(-40,190,easeOut(p)),1385,.58,p<1?lt*5:0,{hair:'bob',col:'#010204'});
  const tip = Math.abs(Math.sin(lt*1.3))*.4; s += `<circle cx="345" cy="1050" r="3" fill="#ff7a3a" opacity="${.3+tip}"/>`;
  s += `</g><rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  return s;
}
function shotPhotoMsg(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgHouseDark(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".5"/>`;
  const shake=buzzShake(lt,[0,.6]), ph = clamp((lt-(sh.photoAt??1.4))/.4,0,1);
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="#0d1116"/><rect x="-270" y="-560" width="540" height="190" fill="#171d24"/>${avatar(-170,-440,40,'?','#5f6b78')}<text x="-112" y="-450" font-family="Inter" font-weight="800" font-size="31" fill="#fff">Número desconhecido</text><text x="-112" y="-405" font-family="Inter" font-weight="600" font-size="26" fill="#8a96a3">00:00</text>`;
  scr += `<g opacity="${ph}"><rect x="-230" y="-330" width="400" height="560" rx="24" fill="#262b33"/><clipPath id="pmc"><rect x="-216" y="-316" width="372" height="500" rx="16"/></clipPath><g clip-path="url(#pmc)"><g transform="translate(-30,-60) scale(.42) translate(-700,-1250)">${bgRiver(2)}${moto(700,1560,1.0)}${silhouette(690,1400,.62,0,{col:'#04060b'})}${femSil(560,1420,.62,0,{hair:'long',col:'#04060b'})}</g></g><text x="150" y="212" text-anchor="end" font-family="Inter" font-size="20" fill="#cfd8dc">00:00</text></g>`;
  const z=lerp(1,1.2,easeIO(clamp((lt-1.6)/(B.dur-1.6),0,1)));
  s += `<g transform="translate(${540+shake},900) scale(${z}) translate(-540,-900)">${phone(540,920,540,1120,-3,scr,{id:'pm',back:handBack(CH.rafael.skin,CH.rafael.shade,{watch:true,grease:true}),front:handFront(CH.rafael.skin,CH.rafael.shade)})}</g>`;
  return s + `<rect width="1080" height="1920" fill="url(#screenGlow)" opacity=".4"/>`;
}
Object.assign(SHOTS, { cash_counter:shotCashCounter, pier_meet:shotPierMeet, photo_msg:shotPhotoMsg });
