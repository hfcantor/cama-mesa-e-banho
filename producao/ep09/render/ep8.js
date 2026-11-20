// Episódio 8 — mochila preta
CH.lucas_nb = Object.assign({}, CH.lucas, { strap:false, key:'lucas_nb' });
function shotAlleyTwo(sh, lt, B){
  const z=lerp(1.15,1.3,easeIO(lt/B.dur));
  let s = `<g transform="translate(540,1500) scale(${z}) translate(-540,-1500)">${bgMarileneExt(lt)}<rect width="1080" height="1920" fill="#06102a" opacity=".62"/>`;
  s += `<circle cx="540" cy="760" r="300" fill="url(#bulbGlow)" opacity=".5"/>`;
  s += femSil(400,1820,1.0,0,{hair:'bob',col:'#05070c',rim:'#ffcf8a'});
  s += silhouette(680,1830,1.0,0,{col:'#05070c',rim:'#ffcf8a'});
  // mochila vista de costas
  s += `<rect x="${680-62}" y="${1830-455}" width="124" height="170" rx="26" fill="#000"/><rect x="${680-40}" y="${1830-395}" width="80" height="50" rx="10" fill="#141414"/><path d="M ${680-50} ${1830-455} q -10 -30 0 -40 M ${680+50} ${1830-455} q 10 -30 0 -40" stroke="#000" stroke-width="12" fill="none"/>`;
  s += `</g>`;
  s += `<rect width="1080" height="1920" fill="#704214" opacity=".25" style="mix-blend-mode:color"/><text x="540" y="200" text-anchor="middle" font-family="Inter" font-weight="800" font-size="44" letter-spacing="8" fill="#f3e2c0" opacity=".85">SEMANA PASSADA</text>`;
  return s + `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
}
Object.assign(SHOTS, { alley_two:shotAlleyTwo });
