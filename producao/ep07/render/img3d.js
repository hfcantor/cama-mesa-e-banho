// Personagens 3D (fichas enviadas pela produção)
const IMG3D = {"marcelo": {"w": 456, "h": 1278, "cx": 235.3}, "keliane": {"w": 430, "h": 1303, "cx": 233.0}, "raimundinha": {"w": 467, "h": 1287, "cx": 209.6}, "bruno": {"w": 474, "h": 1312, "cx": 257.3}, "diego": {"w": 485, "h": 1277, "cx": 264.0}, "sandro": {"w": 473, "h": 1304, "cx": 244.0}, "rafael": {"w": 469, "h": 1312, "cx": 247.0}, "jessica": {"w": 477, "h": 1312, "cx": 265.5}};
IMG3D.marilene = {"w": 488, "h": 1312, "cx": 264.9};
IMG3D.lucas = {"w": 451, "h": 1312, "cx": 225.6};
IMG3D.jessica_sun = IMG3D.jessica;
function img3dSrc(id){ return 'img/'+(id==='jessica_sun'?'jessica':id)+'.png'; }
// busto: altura total da figura FH, cabeça no topo em y0, centro da cabeça em x=540
function bust3d(id, o){
  const m = IMG3D[id], FH = (o.fh||2600), sc = FH/m.h, W = m.w*sc;
  const t=o.t||0, talk=o.mouth||0;
  const breath = Math.sin(t*1.6)*5, bob = talk*6*Math.abs(Math.sin(t*9)), tilt = Math.sin(t*0.7)*0.8 + talk*1.2*Math.sin(t*6.3);
  const x = 540 - m.cx*sc, y = (o.y0??420) + breath*0.5 - bob;
  const pulse = 1 + talk*0.006*Math.sin(t*18);
  return `<g transform="rotate(${tilt} 540 1500) translate(540 ${y}) scale(${pulse}) translate(-540 ${-y})"><image href="${img3dSrc(id)}" x="${x}" y="${y}" width="${W}" height="${FH}" preserveAspectRatio="none"/></g>`;
}
