// Episódio 9 — o número
function shotRingBackpack(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgBar(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".45"/>`;
  const z=lerp(1.0,1.25,easeIO(lt/B.dur)), vib = Math.sin(lt*170)*(Math.floor(lt*1.6)%2===0?6:0), glow=.35+.35*Math.abs(Math.sin(lt*4));
  s += `<g transform="translate(540,1150) scale(${z}) translate(-540,-1150)">`;
  s += `<rect x="200" y="1380" width="680" height="60" rx="10" fill="#5a3a20"/><rect x="230" y="1440" width="40" height="480" fill="#3a2414"/><rect x="810" y="1440" width="40" height="480" fill="#3a2414"/><rect x="230" y="900" width="40" height="500" fill="#3a2414"/>`;
  s += `<g transform="translate(${540+vib},1100)"><path d="M -230 280 L -250 -180 Q -240 -330 0 -340 Q 240 -330 250 -180 L 230 280 Z" fill="#111214"/><path d="M -170 40 L 170 40 L 160 260 L -160 260 Z" fill="#1b1c20"/><path d="M -170 40 L 170 40" stroke="#333" stroke-width="6"/><rect x="-20" y="-370" width="40" height="40" rx="10" fill="#111214"/>`;
  s += `<rect x="-90" y="90" width="180" height="120" rx="20" fill="#9fd3ff" opacity="${glow}" filter="url(#blurBg)"/><path d="M -60 -300 Q 0 -360 60 -300" stroke="#2a2b30" stroke-width="10" fill="none"/></g>`;
  for (let k=0;k<3;k++){ const r=((lt*1.4+k/3)%1); s += `<circle cx="540" cy="1250" r="${120+r*260}" fill="none" stroke="#9fd3ff" stroke-width="4" opacity="${(1-r)*.5}"/>`; }
  s += `</g><rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  return s;
}
function shotNextEp(sh, lt, B){
  const a=clamp(lt/.5,0,1), pulse=1+.03*Math.sin(lt*4);
  return `<rect width="1080" height="1920" fill="#030304"/><g opacity="${a}"><text x="540" y="860" text-anchor="middle" font-family="Inter" font-weight="800" font-size="46" letter-spacing="8" fill="#c9a24a">NO PRÓXIMO EPISÓDIO</text><g transform="translate(540,1000) scale(${pulse})"><text x="0" y="0" text-anchor="middle" font-family="Inter" font-weight="900" font-size="110" fill="url(#goldT)">O GRANDE</text><text x="0" y="120" text-anchor="middle" font-family="Inter" font-weight="900" font-size="110" fill="url(#goldT)">FINAL</text></g></g>`;
}
Object.assign(SHOTS, { ring_backpack:shotRingBackpack, next_ep:shotNextEp });
