const W=1080, H=1920;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const easeIO=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
function R(i){ const x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); }
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');

// ------------------------------------------------------------------ cenários
function bgNight(t){
  let s = `<rect width="1080" height="1920" fill="url(#skyN)"/>`;
  for (let i=0;i<130;i++){ const x=R(i)*1080, y=R(i+500)*1050, r=.8+R(i+900)*1.8, tw=.4+.6*Math.abs(Math.sin(t*(1+R(i+77)*2)+i)); s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${tw*.8}"/>`; }
  s += `<circle cx="820" cy="320" r="160" fill="url(#moonGlow)"/><circle cx="820" cy="320" r="46" fill="#f3ecd5"/><circle cx="806" cy="308" r="9" fill="#ddd3b8" opacity=".6"/><circle cx="836" cy="334" r="6" fill="#ddd3b8" opacity=".6"/>`;
  // palmeiras de açaí ao fundo
  for (let i=0;i<9;i++){ const x=40+i*130+R(i+40)*40, top=780+R(i+60)*140, sw=Math.sin(t*.6+i)*6;
    s += `<path d="M ${x} 1250 Q ${x+15} ${(1250+top)/2} ${x+sw} ${top}" stroke="#0b1121" stroke-width="7" fill="none"/>`;
    for (let k=0;k<7;k++){ const a=-Math.PI*.95+k*Math.PI*.95/6, L=95+R(i*7+k)*40; s+=`<path d="M ${x+sw} ${top} q ${Math.cos(a)*L*.6} ${Math.sin(a)*L*.4-20} ${Math.cos(a)*L} ${Math.sin(a)*L*.5+40}" stroke="#0b1121" stroke-width="10" fill="none" stroke-linecap="round"/>`; } }
  // casas de madeira
  const houses=[[-20,1040,300,250],[300,1080,250,200],[560,1020,280,260],[860,1070,260,220]];
  houses.forEach(([x,y,w,h],i)=>{
    s += `<path d="M ${x-15} ${y} L ${x+w/2} ${y-90} L ${x+w+15} ${y} Z" fill="#0a0e1a"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0e1424"/>`;
    for (let k=0;k<4;k++) s+=`<line x1="${x}" y1="${y+20+k*45}" x2="${x+w}" y2="${y+20+k*45}" stroke="#141b30" stroke-width="3"/>`;
    for (let k=0;k<3;k++) s+=`<rect x="${x+20+k*(w/3)}" y="${y+h}" width="10" height="70" fill="#0a0e1a"/>`;
    if (i!==1){ const wx=x+w*.3, on=.8+.2*Math.sin(t*3+i); s+=`<rect x="${wx}" y="${y+60}" width="60" height="70" fill="#f0b35a" opacity="${on}"/><rect x="${wx}" y="${y+60}" width="60" height="70" fill="none" stroke="#0a0e1a" stroke-width="6"/><line x1="${wx+30}" y1="${y+60}" x2="${wx+30}" y2="${y+130}" stroke="#0a0e1a" stroke-width="5"/><rect x="${wx-30}" y="${y+40}" width="120" height="110" fill="#f0b35a" opacity=".08"/>`; }
  });
  // fiação
  s += `<line x1="160" y1="560" x2="160" y2="1320" stroke="#0a0d17" stroke-width="16"/><path d="M -20 600 Q 300 680 1100 610" stroke="#0a0d17" stroke-width="3" fill="none"/><path d="M -20 640 Q 400 730 1100 660" stroke="#0a0d17" stroke-width="3" fill="none"/>`;
  // chão de terra
  s += `<rect y="1250" width="1080" height="670" fill="url(#roadN)"/>`;
  // poste com lâmpada
  const fl = .9+.1*Math.sin(t*23)*Math.sin(t*7);
  s += `<path d="M 300 1700 L 300 700 Q 300 660 360 660 L 420 660" stroke="#090b12" stroke-width="18" fill="none"/>`;
  s += `<circle cx="425" cy="680" r="320" fill="url(#lampGlow)" opacity="${fl}"/><path d="M 380 690 L 470 690 L 700 1700 L 120 1700 Z" fill="#ffb35c" opacity="${.07*fl}"/><ellipse cx="420" cy="1560" rx="380" ry="90" fill="#ffb35c" opacity="${.13*fl}"/>`;
  s += `<rect x="395" y="664" width="60" height="24" rx="6" fill="#1a1a1a"/><ellipse cx="425" cy="690" rx="24" ry="8" fill="#ffe2b0"/>`;
  return s;
}

function bgBar(t, o={}){
  let s = `<rect width="1080" height="1920" fill="url(#wallB)"/>`;
  for (let x=0;x<1080;x+=90) s += `<rect x="${x}" y="0" width="88" height="1920" fill="${R(x)>.5?'#3a2414':'#33200f'}" opacity=".7"/><line x1="${x}" y1="0" x2="${x}" y2="1920" stroke="#1d1209" stroke-width="5"/>`;
  // placa
  s += `<rect x="170" y="240" width="740" height="210" rx="10" fill="#1d3a2d" stroke="#c9a24a" stroke-width="8"/><text x="540" y="350" text-anchor="middle" font-family="Inter" font-weight="900" font-size="96" fill="#f4d36b" letter-spacing="2">BAR DO SANDRO</text><text x="540" y="412" text-anchor="middle" font-family="Inter" font-weight="700" font-size="40" fill="#efe4c6">Rua da Felicidade</text>`;
  // prateleiras com garrafas
  for (const sy of [700,1000]){
    s += `<rect x="60" y="${sy}" width="960" height="22" fill="#5c3b1f"/><rect x="60" y="${sy+22}" width="960" height="10" fill="#21130a"/>`;
    for (let i=0;i<15;i++){ const x=80+i*62+R(i+sy)*10, h=110+R(i*3+sy)*70, cols=['#6b3a12','#1f5131','#8a6a2a','#b9c7c5','#5a1f1f']; const c=cols[Math.floor(R(i+sy*2)*5)];
      s += `<rect x="${x}" y="${sy-h}" width="40" height="${h}" rx="9" fill="${c}" opacity=".95"/><rect x="${x+13}" y="${sy-h-30}" width="14" height="36" rx="4" fill="${c}"/><rect x="${x+7}" y="${sy-h+20}" width="7" height="${h-40}" rx="3" fill="#fff" opacity=".25"/><rect x="${x+4}" y="${sy-h*0.55}" width="32" height="34" fill="#efe2c2" opacity=".75"/>`; }
  }
  s += `<rect x="740" y="1100" width="250" height="140" rx="8" fill="#f2c230"/><text x="865" y="1165" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="#8a1b12">CERVEJA</text><text x="865" y="1212" text-anchor="middle" font-family="Inter" font-weight="900" font-size="38" fill="#8a1b12">GELADA</text>`;
  // balcão
  s += `<rect x="0" y="1380" width="1080" height="70" fill="#6e4524"/><rect x="0" y="1450" width="1080" height="470" fill="#3c2412"/>`;
  for (let x=0;x<1080;x+=120) s += `<line x1="${x}" y1="1450" x2="${x}" y2="1920" stroke="#2a180b" stroke-width="6"/>`;
  // varal de lâmpadas
  if (!o.day) for (const [y0,dy] of [[120,90],[560,70]]){
    s += `<path d="M -20 ${y0} Q 540 ${y0+dy*2} 1100 ${y0}" stroke="#120b05" stroke-width="4" fill="none"/>`;
    for (let i=0;i<9;i++){ const x=i*135+30, yy=y0+dy*2*(1-Math.pow((x-540)/560,2))*.5+20, f=.75+.25*Math.sin(t*2+i*1.7);
      s += `<circle cx="${x}" cy="${yy}" r="60" fill="url(#bulbGlow)" opacity="${f}"/><circle cx="${x}" cy="${yy}" r="11" fill="#ffe3a3"/>`; }
  }
  return s;
}

function bgBarExt(t){
  let s = `<rect width="1080" height="1920" fill="url(#skyN)"/>`;
  for (let i=0;i<60;i++) s+=`<circle cx="${R(i)*1080}" cy="${R(i+50)*360}" r="${1+R(i+9)*1.5}" fill="#fff" opacity="${.3+.5*Math.abs(Math.sin(t+i))}"/>`;
  s += `<path d="M -40 470 L 540 330 L 1120 470 Z" fill="#1b1e24"/><rect x="0" y="460" width="1080" height="1120" fill="#24484c"/>`;
  for (let y=470;y<1580;y+=48) s += `<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="#1b393c" stroke-width="5"/>`;
  // placa
  s += `<rect x="150" y="510" width="780" height="190" rx="8" fill="#8e1d1d" stroke="#f0c75a" stroke-width="6"/><text x="540" y="615" text-anchor="middle" font-family="Inter" font-weight="900" font-size="94" fill="#ffd966">BAR DO SANDRO</text><text x="540" y="672" text-anchor="middle" font-family="Inter" font-weight="700" font-size="38" fill="#fff1d0">Rua da Felicidade</text>`;
  // porta com luz
  s += `<rect x="560" y="780" width="330" height="800" fill="url(#doorWarm)"/><rect x="560" y="780" width="330" height="800" fill="none" stroke="#14292b" stroke-width="16"/>`;
  s += `<rect x="610" y="1050" width="70" height="200" rx="30" fill="#2a1508" opacity=".55"/><rect x="760" y="1100" width="60" height="180" rx="26" fill="#2a1508" opacity=".45"/>`;
  // janela
  s += `<rect x="130" y="860" width="300" height="240" fill="#f0b35a" opacity=".85"/><rect x="130" y="860" width="300" height="240" fill="none" stroke="#14292b" stroke-width="14"/><line x1="280" y1="860" x2="280" y2="1100" stroke="#14292b" stroke-width="10"/>`;
  // lâmpada pendurada e mariposas
  const f=.85+.15*Math.sin(t*17)*Math.sin(t*5);
  s += `<line x1="430" y1="460" x2="430" y2="740" stroke="#111" stroke-width="3"/><circle cx="430" cy="760" r="240" fill="url(#bulbGlow)" opacity="${f}"/><circle cx="430" cy="760" r="18" fill="#ffe7b5"/>`;
  for (let i=0;i<5;i++){ const a=t*(2+i*.4)+i*2; s+=`<circle cx="${430+Math.cos(a)*(40+i*12)}" cy="${760+Math.sin(a*1.3)*(30+i*8)}" r="3" fill="#ffe7b5" opacity=".8"/>`; }
  // chão + luz da porta
  s += `<rect y="1580" width="1080" height="340" fill="#231b14"/><path d="M 560 1580 L 890 1580 L 1080 1920 L 420 1920 Z" fill="#ffb35c" opacity=".16"/>`;
  // mesas de plástico
  s += plasticTable(220,1720)+plasticChair(80,1760)+plasticChair(360,1780);
  return s;
}
function plasticTable(x,y){ return `<ellipse cx="${x}" cy="${y-120}" rx="120" ry="28" fill="#c4231f"/><rect x="${x-100}" y="${y-120}" width="12" height="120" fill="#a01c19"/><rect x="${x+88}" y="${y-120}" width="12" height="120" fill="#a01c19"/><rect x="${x-30}" y="${y-190}" width="34" height="70" rx="6" fill="#6b3a12"/><rect x="${x+20}" y="${y-170}" width="34" height="50" rx="4" fill="#f7e7b0" opacity=".8"/>`; }
function plasticChair(x,y){ return `<rect x="${x-50}" y="${y-200}" width="100" height="90" rx="14" fill="#d12a24"/><rect x="${x-55}" y="${y-110}" width="110" height="18" rx="6" fill="#b52420"/><rect x="${x-48}" y="${y-92}" width="10" height="92" fill="#9e1f1b"/><rect x="${x+38}" y="${y-92}" width="10" height="92" fill="#9e1f1b"/>`; }

const BG = { night_street:bgNight, bar:bgBar, bar_ext:bgBarExt };
const RIM = { night_street:'#9db8ff', bar:'#ffb766', bar_ext:'#ffc27a' };
const GRADE = { night_street:['#20335f',.38], bar:['#ff9a3c',.12], bar_ext:['#2f4a7a',.22] };

// ------------------------------------------------------------------ peças de celular
function phone(x,y,w,h,rot,screen,opts={}){
  const r=48;
  return `<g transform="translate(${x},${y}) rotate(${rot})">${opts.back||''}
    <rect x="${-w/2-14}" y="${-h/2-14}" width="${w+28}" height="${h+28}" rx="${r+12}" fill="${opts.case||'#111'}"/>
    <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${r}" fill="#0b0d12"/>
    <clipPath id="scr${opts.id||''}"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${r}"/></clipPath>
    <g clip-path="url(#scr${opts.id||''})">${screen}</g>
    <rect x="-60" y="${-h/2+14}" width="120" height="30" rx="15" fill="#000"/>
    ${opts.front||''}
  </g>`;
}
function handBack(skin, shade, opts={}){
  let s = `<path d="M -70 1400 L -50 600 Q 70 560 210 600 L 250 1400 Z" fill="${shade}"/>`;
  s += `<path d="M -250 480 Q -300 660 -140 720 L 220 720 Q 330 640 300 470 L 300 280 L -250 280 Z" fill="${skin}"/>`;
  for (let i=0;i<4;i++) s += `<rect x="236" y="${-130+i*128}" width="104" height="104" rx="50" fill="${skin}"/><path d="M 300 ${-110+i*128} q 22 30 0 64" stroke="${shade}" stroke-width="5" fill="none" opacity=".55"/>`;
  if (opts.watch) s += `<rect x="-62" y="860" width="300" height="80" rx="10" fill="#26272b"/><circle cx="92" cy="900" r="56" fill="#0f1115" stroke="#9aa0a6" stroke-width="7"/><line x1="92" y1="900" x2="92" y2="862" stroke="#eee" stroke-width="5"/><line x1="92" y1="900" x2="120" y2="912" stroke="#eee" stroke-width="5"/>`;
  if (opts.grease) s += `<path d="M -120 650 q 40 -20 80 10" stroke="#1a1612" stroke-width="12" opacity=".4" fill="none" stroke-linecap="round"/><circle cx="160" cy="1040" r="16" fill="#1a1612" opacity=".35"/>`;
  return s;
}
function handFront(skin, shade){
  return `<path d="M -330 640 C -380 500 -350 300 -290 210 Q -255 175 -228 205 Q -250 300 -238 400 Q -226 500 -160 600 Z" fill="${skin}"/><path d="M -282 222 q 16 -12 34 2 l -6 40 q -16 -8 -30 -2 Z" fill="${light(skin,.25)}" opacity=".8"/><path d="M -320 600 C -350 480 -330 330 -290 250" stroke="${shade}" stroke-width="6" fill="none" opacity=".5"/>`;
}
function hand(){ return ''; }
function statusBar(clock='23:47'){ return `<text x="-215" y="-500" font-family="Inter" font-weight="700" font-size="30" fill="#fff">${clock}</text><rect x="150" y="-525" width="46" height="24" rx="6" fill="none" stroke="#fff" stroke-width="3"/><rect x="154" y="-521" width="30" height="16" rx="3" fill="#fff"/>`; }
function avatar(x,y,r,txt,col){ return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/><text x="${x}" y="${y+r*0.36}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="${r}" fill="#fff">${txt}</text>`; }
function bubble(x,y,w,text,out,meta,opts={}){
  const h = 96; const bx = out? 230-w : -230;
  return `<g opacity="${opts.op??1}"><rect x="${bx}" y="${y}" width="${w}" height="${h}" rx="26" fill="${out?'#1f6f54':'#262b33'}"/>
  <text x="${bx+26}" y="${y+58}" font-family="Inter" font-weight="${opts.italic?400:600}" font-style="${opts.italic?'italic':'normal'}" font-size="34" fill="${opts.italic?'#aab2bd':'#fff'}">${esc(text)}</text>
  ${meta?`<text x="${bx+w-16}" y="${y+h-14}" text-anchor="end" font-family="Inter" font-size="20" fill="${opts.metaC||'#cfd8dc'}">${meta}</text>`:''}</g>`;
}

// ------------------------------------------------------------------ inserts
function shotPhoneNotif(sh, lt, B){
  const shake = buzzShake(lt, sh.buzz||[.5,1.3]);
  let s = `<g filter="url(#blurBg)">${bgNight(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".35"/>`;
  const on = clamp((lt-(sh.onAt??.45))/.15,0,1);
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="url(#lockG)" opacity="${.25+.75*on}"/>`;
  scr += `<g opacity="${on}">${statusBar()}<text x="0" y="-300" text-anchor="middle" font-family="Inter" font-weight="300" font-size="150" fill="#fff">23:47</text><text x="0" y="-235" text-anchor="middle" font-family="Inter" font-weight="500" font-size="34" fill="#dfe6ee">Quinta-feira</text></g>`;
  const NA=sh.notifAt??.6; const ny = lerp(-200,-130,easeOut((lt-NA)/.35)), nop = clamp((lt-NA)/.25,0,1);
  scr += `<g opacity="${nop}"><rect x="-240" y="${ny}" width="480" height="190" rx="30" fill="#f2f4f7" opacity=".95"/>${avatar(-180,ny+62,32,'T','#455a64')}
    <text x="-130" y="${ny+52}" font-family="Inter" font-weight="800" font-size="32" fill="#111">Tibúrcio</text><text x="210" y="${ny+50}" text-anchor="end" font-family="Inter" font-size="24" fill="#666">agora</text>
    <text x="-215" y="${ny+125}" font-family="Inter" font-weight="600" font-size="31" fill="#222">40 mil. Até sexta.</text><text x="-215" y="${ny+165}" font-family="Inter" font-weight="600" font-size="31" fill="#222">Sem desculpa.</text></g>`;
  const zoom = lerp(1,1.12,easeIO(clamp(lt/B.dur,0,1)));
  s += `<g transform="translate(${540+shake},${980}) scale(${zoom}) translate(-540,-980)">${phone(540,880,540,1120,-5,scr,{id:'n',back:handBack(CH.diego.skin,CH.diego.shade),front:handFront(CH.diego.skin,CH.diego.shade)})}</g>`;
  s += `<rect width="1080" height="1920" fill="url(#screenGlow)" opacity="${.5*on}"/>`;
  return s;
}
function buzzShake(lt, starts){ for (const a of starts) if (lt>a && lt<a+.42) return Math.sin(lt*170)*7; return 0; }

function shotTablePhone(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="#4a2c16"/>`;
  for (let y=0;y<1920;y+=140) s += `<rect y="${y}" width="1080" height="136" fill="${R(y)>.5?'#56331a':'#4d2d15'}"/><line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="#2d1a0b" stroke-width="5"/>`;
  s += `<circle cx="210" cy="420" r="130" fill="#f2d27a" opacity=".85"/><circle cx="210" cy="420" r="130" fill="none" stroke="#fff" stroke-width="10" opacity=".5"/><circle cx="210" cy="420" r="96" fill="#fff6dc" opacity=".8"/>`;
  s += `<circle cx="880" cy="1560" r="120" fill="#f2d27a" opacity=".85"/><circle cx="880" cy="1560" r="88" fill="#fff6dc" opacity=".8"/><rect x="720" y="300" width="170" height="420" rx="40" fill="#6b3a12"/><rect x="760" y="230" width="90" height="90" rx="20" fill="#6b3a12"/><rect x="740" y="420" width="130" height="140" fill="#efe2c2"/>`;
  const shake = buzzShake(lt, sh.buzz||[.3,1.0]); const FA=sh.flipAt??1.75;
  const fl = clamp((lt-FA)/.25,0,1); const sx = Math.abs(Math.cos(fl*Math.PI)); const back = fl>.5;
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="#10141b"/>
    <rect x="-240" y="-280" width="480" height="210" rx="30" fill="#f2f4f7"/>${avatar(-180,-215,32,'K','#7b1fa2')}<text x="-130" y="-205" font-family="Inter" font-weight="800" font-size="31" fill="#111">Cliente Corrida</text>
    <text x="-215" y="-130" font-family="Inter" font-weight="600" font-size="31" fill="#222">Hoje no mesmo lugar?</text>`;
  const blur = `<g transform="translate(${540+shake},980) scale(${sx},1) translate(-540,-980)">`;
  if (!back) s += blur + phone(540,980,540,1120,8,scr,{id:'t'}) + `</g>`;
  else s += blur + `<g transform="translate(540,980) rotate(8)"><rect x="-284" y="-574" width="568" height="1148" rx="60" fill="#1b1d22"/><rect x="-220" y="-500" width="170" height="170" rx="40" fill="#2b2e35"/><circle cx="-175" cy="-455" r="32" fill="#0b0c0f"/><circle cx="-95" cy="-385" r="32" fill="#0b0c0f"/></g></g>`;
  if (lt>FA-.25 && lt<FA+.55) { const p=clamp((lt-FA+.25)/.4,0,1); s += `<g transform="translate(${lerp(1300,700,p)},${lerp(900,1000,p)})"><path d="M 0 -120 C 120 -140 400 -100 500 -60 L 500 140 C 360 160 120 160 0 120 Z" fill="${CH.bruno.skin}"/></g>`; }
  s += `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
  return s;
}

function shotChat(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgBar(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".3"/>`;
  const read = lt>(sh.readAt??1.2);
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="#0f141a"/><rect x="-270" y="-560" width="540" height="190" fill="#1a2129"/>${avatar(-170,-440,40,'K','#7b1fa2')}
   <text x="-112" y="-450" font-family="Inter" font-weight="800" font-size="36" fill="#fff">Keliane</text><text x="-112" y="-405" font-family="Inter" font-weight="600" font-size="26" fill="#4cd964">online</text>`;
  scr += bubble(0,-300,330,'Já tô saindo',false,'18:02');
  scr += bubble(0,-180,360,'Te amo, viu?',false,'18:02');
  scr += bubble(0,40,330,'Tá tudo bem?',true,'');
  scr += `<text x="${230-60}" y="122" text-anchor="end" font-family="Inter" font-size="20" fill="#cfd8dc">22:51</text>${ticks(205,116,read)}`;
  scr += `<text x="0" y="300" text-anchor="middle" font-family="Inter" font-weight="600" font-size="26" fill="#8a96a3" opacity="${read?1:0}">Visualizada</text>`;
  const zoom = lerp(1.02,1.12,easeIO(lt/B.dur));
  s += `<g transform="translate(540,980) scale(${zoom}) translate(-540,-980)">${phone(540,920,540,1120,4,scr,{id:'c',back:handBack(CH.rafael.skin,CH.rafael.shade,{watch:true,grease:true}),front:handFront(CH.rafael.skin,CH.rafael.shade)})}</g>`;
  return s;
}
function ticks(x,y,blue){ const c=blue?'#34b7f1':'#9aa5b1'; return `<path d="M ${x-26} ${y-10} l 8 9 l 14 -18" stroke="${c}" stroke-width="4" fill="none"/><path d="M ${x-14} ${y-10} l 8 9 l 14 -18" stroke="${c}" stroke-width="4" fill="none"/>`; }

function shotDoorway(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgBar(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".55"/>`;
  const OA=sh.openAt||0; const op = easeOut((lt-OA)/0.9);
  s += `<rect x="330" y="420" width="420" height="1180" fill="url(#doorCold)"/>`;
  s += `<path d="M 330 1600 L 750 1600 L 1080 1920 L 0 1920 Z" fill="#7fa1d8" opacity=".14"/>`;
  const p0 = clamp((lt-OA-.5)/(B.dur-OA-.5),0,1), p = sh.stopAt? Math.min(p0,sh.stopAt):p0, sc = lerp(1.25,1.85,easeIO(p));
  s += silhouette(540, 1600+(sh.stopAt?Math.min(p,sh.stopAt):p)*90, sc*(sh.who==='lucas'?.85:1), (sh.stopAt&&p>=sh.stopAt)?0:lt*5.5, {col:'#040507', broad:sh.who!=='lucas', hair:sh.who==='lucas'?null:'slick', backpack:sh.who==='lucas', rim:'#9db8ff'});
  // folha da porta
  s += `<path d="M 330 420 L ${330+420*(1-op)} ${420+30*op} L ${330+420*(1-op)} ${1600-30*op} L 330 1600 Z" fill="#2a1c12"/>`;
  s += `<rect x="300" y="390" width="480" height="1240" fill="none" stroke="#1a0f08" stroke-width="40"/>`;
  return s;
}

function shotWatch(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="${CH.diego.shirtC}"/>`;
  for (let x=-200;x<1300;x+=170) s += `<rect x="${x}" y="0" width="52" height="1920" fill="${CH.diego.stripe}" opacity=".85" transform="rotate(12 540 960)"/>`;
  s += `<path d="M 0 0 L 1080 0 L 1080 520 Q 540 640 0 560 Z" fill="#000" opacity=".45" filter="url(#blurBg)"/>`;
  s += `<path d="M 0 1300 Q 540 1150 1080 1400" stroke="#000" stroke-width="140" fill="none" opacity=".2"/>`;
  const pat = (a)=> lt>a && lt<a+.3 ? Math.sin((lt-a)/.3*Math.PI) : 0;
  const dy = -60*(pat(.45)+pat(.85)) + lerp(-260,0,easeOut(lt/.45));
  const sk = CH.marcelo.skin, sd = CH.marcelo.shade;
  s += `<g transform="translate(0,${dy})">`;
  s += `<path d="M 1300 -200 L 960 -200 L 560 760 L 900 900 Z" fill="${CH.marcelo.shirtC}"/>`;
  s += `<path d="M 560 760 L 900 900 L 860 1000 L 520 860 Z" fill="${sk}"/>`;
  s += `<path d="M 520 860 C 400 900 320 1020 330 1120 C 360 1200 520 1230 640 1180 L 860 1000 Z" fill="${sk}"/>`;
  for (let i=0;i<4;i++) s += `<path d="M ${360+i*70} ${1100+i*20} q -20 120 30 180" stroke="${sk}" stroke-width="64" fill="none" stroke-linecap="round"/><path d="M ${355+i*70} ${1180+i*20} q 2 30 14 50" stroke="${sd}" stroke-width="4" fill="none" opacity=".5"/>`;
  // relógio dourado
  s += `<g transform="rotate(23 720 830)"><rect x="610" y="770" width="230" height="120" rx="20" fill="#b8902f"/><circle cx="725" cy="830" r="88" fill="#d9b04a"/><circle cx="725" cy="830" r="70" fill="#141414"/>`;
  for (let k=0;k<12;k++){ const a=k*Math.PI/6; s+=`<line x1="${725+Math.cos(a)*58}" y1="${830+Math.sin(a)*58}" x2="${725+Math.cos(a)*66}" y2="${830+Math.sin(a)*66}" stroke="#d9b04a" stroke-width="4"/>`; }
  const sa = lt*6.28/1.0; s += `<line x1="725" y1="830" x2="${725+Math.cos(-1.2)*40}" y2="${830+Math.sin(-1.2)*40}" stroke="#eee" stroke-width="6"/><line x1="725" y1="830" x2="${725+Math.cos(sa)*58}" y2="${830+Math.sin(sa)*58}" stroke="#e53935" stroke-width="3"/>`;
  s += `<ellipse cx="700" cy="790" rx="40" ry="14" fill="#fff" opacity="${.25+.25*Math.sin(lt*4)}" transform="rotate(-30 700 790)"/></g>`;
  // anel no dedo mínimo
  s += `<rect x="560" y="1265" width="64" height="20" rx="8" fill="#d9b04a" transform="rotate(10 590 1275)"/></g>`;
  s += `<rect width="1080" height="1920" fill="url(#vigWarm)"/>`;
  return s;
}

function shotSplit(sh, lt, B, ctx){
  const half = (id, y0, gaze, gy, uid, look)=>{
    const vbw=470, vbh=418, z=lerp(1,1.06,lt/B.dur);
    return `<svg x="0" y="${y0}" width="1080" height="960" viewBox="${540-vbw/2/z} ${860-vbh/2/z} ${vbw/z} ${vbh/z}" preserveAspectRatio="xMidYMid slice"><g filter="url(#blurBg)">${BG.bar(lt)}</g>${charSVG(id,{t:lt,expr:look,gaze,gy,uid,rim:RIM.bar,blink:ctx.blink(id,lt)})}</svg>`;
  };
  const LA=sh.lookAt??.7; const g1 = lt<LA?0:lerp(0,.9,easeOut((lt-LA)/.3)), g2 = lt<LA+.2?-.2:lerp(-.2,sh.away?.9:-.9,easeOut((lt-LA-.2)/.3));
  const top=sh.top, bot=sh.bottom;
  const ex = { marcelo:'cold', lucas:'serious', diego:'forced', rafael:'serious', jessica:'teasing' };
  let s = half(top,0,g1,lt>LA?.6:0,'sa',ex[top]) + half(bot,960,g2,lt>LA+.2?-.6:0,'sb',ex[bot]);
  s += `<rect x="0" y="952" width="1080" height="16" fill="#000"/>`;
  return s;
}

function shotStreetWalk(sh, lt, B){
  let s = bgNight(lt);
  const x = lerp(140,760,lt/B.dur), near = Math.exp(-Math.pow((x-420)/260,2));
  const BZ=sh.buzzAt??1.2; const buzz = (lt>BZ&&lt<BZ+.4)||(lt>BZ+.6&&lt<BZ+1);
  s += `<ellipse cx="${x}" cy="1640" rx="90" ry="18" fill="#000" opacity=".5"/>`;
  s += silhouette(x,1660,.9,lt*6.2,{backpack:true, glow: buzz?'#9fd3ff':null, rim: near>.2?'#ffb35c':null});
  s += `<rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  return s;
}

function shotSecretPhone(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgNight(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".45"/>`;
  const typed = 'Ainda não.'; const TA=sh.typeAt??1.4, SA=sh.sentAt??2.2, DA=sh.delAt??4.1, IA=sh.inAt??.3; const n = Math.round(clamp((lt-TA)/(SA-TA-.05),0,1)*typed.length); const sent = lt>SA, del = lt>DA;
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="#0d1116"/><rect x="-270" y="-560" width="540" height="190" fill="#171d24"/>${avatar(-170,-440,40,'?','#5f6b78')}
    <text x="-112" y="-450" font-family="Inter" font-weight="800" font-size="31" fill="#fff">Número desconhecido</text><text x="-112" y="-405" font-family="Inter" font-weight="600" font-size="26" fill="#8a96a3">online</text>`;
  const inOp = clamp((lt-IA)/.2,0,1);
  if (!del){
    scr += bubble(0,-300,sh.msg?300:360,sh.msg||'Tu contou pra eles?',false,sh.msgTime||'23:58',{op:inOp});
    if (sent) scr += bubble(0,-170,250,'Ainda não.',true,'23:58',{op:clamp((lt-SA)/.15,0,1)});
  } else {
    const d = clamp((lt-DA)/.3,0,1);
    scr += bubble(0,-300,420,'Mensagem apagada',false,'',{italic:true,op:d});
    scr += bubble(0,-170,420,'Mensagem apagada',true,'',{italic:true,op:d});
  }
  scr += `<rect x="-250" y="420" width="400" height="80" rx="40" fill="#1e252e"/><text x="-220" y="472" font-family="Inter" font-weight="500" font-size="32" fill="${n?'#fff':'#6b7782'}">${n&&!sent?esc(typed.slice(0,n)):'Mensagem'}</text>${n&&!sent&&Math.floor(lt*3)%2?`<rect x="${-220+n*17}" y="440" width="3" height="40" fill="#4cd964"/>`:''}<circle cx="210" cy="460" r="40" fill="#1f6f54"/>`;
  const zoom = lerp(1.0,1.1,easeIO(lt/B.dur));
  s += `<g transform="translate(540,980) scale(${zoom}) translate(-540,-980)">${phone(540,900,540,1120,-3,scr,{id:'s',case:'#20331f',back:handBack(CH.lucas.skin,CH.lucas.shade),front:handFront(CH.lucas.skin,CH.lucas.shade)})}</g>`;
  s += `<rect width="1080" height="1920" fill="url(#screenGlow)" opacity=".35"/>`;
  return s;
}

function shotCalc(sh, lt, B){
  let s = `<g filter="url(#blurBg)">${bgNight(lt)}</g><rect width="1080" height="1920" fill="#000" opacity=".45"/>`;
  const digits=['4','40','400','4.000','40.000']; const CT=sh.typeAt??.3, CS=sh.step??.25; const k = clamp(Math.floor((lt-CT)/CS)+1,0,5); const val = k? digits[k-1]:'0';
  let scr = `<rect x="-270" y="-560" width="540" height="1120" fill="#000"/><text x="230" y="-160" text-anchor="end" font-family="Inter" font-weight="300" font-size="${k===5?120:110}" fill="${k===5?'#ff5a4f':'#fff'}">${val}</text>`;
  const keys=['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','',',','='];
  keys.forEach((kk,i)=>{ if(!kk) return; const cx=-195+(i%4)*130, cy=-20+Math.floor(i/4)*120, op=i%4===3?'#ff9f0a':(i<3?'#a5a5a5':'#333');
    s; scr += `<circle cx="${cx}" cy="${cy}" r="52" fill="${op}"/><text x="${cx}" y="${cy+16}" text-anchor="middle" font-family="Inter" font-size="44" fill="${i<3?'#000':'#fff'}">${kk}</text>`; });
  s += `<g transform="translate(540,980) scale(${lerp(1,1.08,lt/B.dur)}) translate(-540,-980)">${phone(540,900,540,1120,3,scr,{id:'k',back:handBack(CH.diego.skin,CH.diego.shade),front:handFront(CH.diego.skin,CH.diego.shade)})}</g>`;
  if (k===5) s += `<rect width="1080" height="1920" fill="#ff1a1a" opacity="${.12*clamp((lt-CT-CS*4)/.3,0,1)}"/>`;
  return s;
}

function shotEstablish(sh, lt, B){
  const z = lerp(1.0,1.07,easeIO(lt/B.dur));
  let s = `<g transform="translate(540,1000) scale(${z}) translate(-540,-1000)">${bgBarExt(lt)}</g><rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  const op = clamp((lt-.3)/.4,0,1)*clamp((B.dur-lt)/.3,0,1);
  s += `<g opacity="${op}"><rect x="60" y="1700" width="8" height="110" fill="#5dff3a"/><text x="90" y="1745" font-family="Inter" font-weight="900" font-size="44" fill="#fff">Bar do Sandro</text><text x="90" y="1795" font-family="Inter" font-weight="600" font-size="32" fill="#dfe6ee">Rua da Felicidade · Tabocal, Santarém (PA)</text></g>`;
  return s;
}

function shotTitle(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="#030304"/>`;
  for (let i=0;i<40;i++){ const y=1920-((lt*60*(.5+R(i)))+R(i+3)*1920)%1920; s+=`<circle cx="${R(i+8)*1080}" cy="${y}" r="${1+R(i+2)*3}" fill="#e8c46a" opacity="${.15+.25*R(i+5)}"/>`; }
  const a = clamp(lt/.6,0,1), fl = lt<.9 ? (R(Math.floor(lt*24))>.35?1:.25) : 1;
  s += `<g opacity="${a*fl}"><text x="540" y="860" text-anchor="middle" font-family="Inter" font-weight="900" font-size="150" letter-spacing="6" fill="url(#goldT)">SEGREDOS</text>
    <text x="540" y="975" text-anchor="middle" font-family="Inter" font-weight="800" font-size="76" letter-spacing="14" fill="#f3efe6">DO TABOCAL</text>
    <line x1="${540-260*a}" y1="1020" x2="${540+260*a}" y2="1020" stroke="#c9a24a" stroke-width="4"/></g>`;
  const b = clamp((lt-1.3)/.6,0,1);
  s += `<text x="540" y="1100" text-anchor="middle" font-family="Inter" font-style="italic" font-weight="500" font-size="44" fill="#d9d4c7" opacity="${b}">Todo mundo tem um segredo.</text>`;
  s += `<text x="540" y="1700" text-anchor="middle" font-family="Inter" font-weight="700" font-size="34" letter-spacing="4" fill="#9aa3ad" opacity="${clamp((lt-1.8)/.5,0,1)}">${sh.ep||'EPISÓDIO 1 · A CONTA CHEGOU'}</text>`;
  return s;
}
function shotCard(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="#030304"/>`;
  const words = sh.text.split(' '); let line1=sh.l1??words.slice(0,4).join(' '), line2=sh.l2??words.slice(4).join(' ');
  const a=clamp(lt/.5,0,1);
  s += `<g opacity="${a}" transform="translate(540,900) scale(${lerp(.94,1,easeOut(lt/.6))}) translate(-540,-900)"><text x="540" y="880" text-anchor="middle" font-family="Inter" font-weight="900" font-size="80" fill="#fff">${esc(line1)}</text><text x="540" y="980" text-anchor="middle" font-family="Inter" font-weight="900" font-size="80" fill="#5dff3a">${esc(line2)}</text></g>`;
  return s;
}
function shotCTA(sh, lt, B){
  let s = `<rect width="1080" height="1920" fill="url(#ctaBg)"/>`;
  for (let i=0;i<30;i++){ const y=1920-((lt*40*(.5+R(i)))+R(i+3)*1920)%1920; s+=`<circle cx="${R(i+8)*1080}" cy="${y}" r="${1+R(i+2)*3}" fill="#e8c46a" opacity="${.12+.2*R(i+5)}"/>`; }
  const a=easeOut(lt/.5);
  s += `<g opacity="${a}"><circle cx="540" cy="640" r="150" fill="#101318" stroke="#c9a24a" stroke-width="8"/><text x="540" y="625" text-anchor="middle" font-family="Inter" font-weight="900" font-size="64" fill="url(#goldT)">HISTÓRIAS</text><text x="540" y="690" text-anchor="middle" font-family="Inter" font-weight="800" font-size="34" letter-spacing="6" fill="#f3efe6">DO TABOCAL</text>
    <text x="540" y="890" text-anchor="middle" font-family="Inter" font-weight="900" font-size="58" fill="#fff">@historiasdotabocal</text></g>`;
  const LK=sh.likeAt??1.4, FL=sh.followAt??2.6; const like = lt>LK, follow = lt>FL, pop = t0=>1+.25*Math.sin(clamp((lt-t0)/.3,0,1)*Math.PI);
  s += `<g transform="translate(330,1080) scale(${like?pop(LK):1})"><rect x="-170" y="-70" width="340" height="140" rx="70" fill="${like?'#ff2d55':'#1b1f26'}" stroke="#ff2d55" stroke-width="5"/>${heart(-80,0,like?'#fff':'#ff2d55')}<text x="20" y="18" font-family="Inter" font-weight="800" font-size="46" fill="#fff">Curtir</text></g>`;
  s += `<g transform="translate(750,1080) scale(${follow?pop(FL):1})"><rect x="-170" y="-70" width="340" height="140" rx="70" fill="${follow?'#2b313a':'#5dff3a'}"/><text x="0" y="16" text-anchor="middle" font-family="Inter" font-weight="900" font-size="46" fill="${follow?'#fff':'#0a0a0a'}">${follow?'Seguindo ✓':'Seguir'}</text></g>`;
  const hx = lt<LK? lerp(700,330,easeOut(lt/LK)) : (lt<FL? lerp(330,750,easeOut((lt-LK)/(FL-LK))) : 750), hy = 1160 + (Math.abs(lt-LK)<.15||Math.abs(lt-FL)<.15? 20:0);
  s += `<g transform="translate(${hx},${hy})"><circle r="38" fill="#fff" opacity=".85"/><circle r="56" fill="none" stroke="#fff" stroke-width="4" opacity="${.5*(Math.abs(lt-LK)<.3||Math.abs(lt-FL)<.3)}"/></g>`;
  return s;
}
function heart(x,y,c){ return `<path transform="translate(${x},${y}) scale(1.6)" d="M 0 10 C -20 -6 -14 -22 0 -12 C 14 -22 20 -6 0 10 Z" fill="${c}"/>`; }
function shotContinua(sh, lt, B){
  const dots = '.'.repeat(1+Math.floor(lt*3)%3);
  return `<rect width="1080" height="1920" fill="#030304"/><text x="540" y="960" text-anchor="middle" font-family="Inter" font-weight="900" font-size="110" letter-spacing="8" fill="#fff" opacity="${clamp(lt/.4,0,1)}">CONTINUA${dots}</text><text x="540" y="1060" text-anchor="middle" font-family="Inter" font-weight="700" font-size="34" letter-spacing="10" fill="#c9a24a" opacity="${clamp((lt-.3)/.4,0,1)}">SEGREDOS DO TABOCAL</text>`;
}

function shotNightEst(sh, lt, B){
  const z = lerp(1.0,1.08,easeIO(lt/B.dur));
  let s = `<g transform="translate(540,1100) scale(${z}) translate(-540,-1100)">${bgNight(lt)}</g><rect width="1080" height="1920" fill="url(#vigCold)"/>`;
  const op = clamp((lt-.3)/.4,0,1);
  s += `<g opacity="${op}"><rect x="60" y="1700" width="8" height="110" fill="#5dff3a"/><text x="90" y="1745" font-family="Inter" font-weight="900" font-size="44" fill="#fff">Tabocal</text><text x="90" y="1795" font-family="Inter" font-weight="600" font-size="32" fill="#dfe6ee">${sh.sub||'Santarém (PA) · 23:47'}</text></g>`;
  return s;
}
const SHOTS = { night_establish:shotNightEst, phone_notif:shotPhoneNotif, table_phone:shotTablePhone, chat:shotChat, doorway:shotDoorway, watch:shotWatch,
  split_eyes:shotSplit, street_walk:shotStreetWalk, secret_phone:shotSecretPhone, calc:shotCalc, bar_establish:shotEstablish,
  title:shotTitle, card:shotCard, cta:shotCTA, continua:shotContinua };
