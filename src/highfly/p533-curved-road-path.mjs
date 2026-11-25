/**
 * HIGHFLY P5.3.3 · REAL curved cobblestone roads and plaza connections.
 * Reusable lightweight pure path math. Original Unsung ground is immutable.
 *
 * One path = one editable JSON object with knots, width and continuous edges;
 * not hundreds of disconnected flat 4m floor tiles.
 */
export const CURVED_ROAD_TYPE='road-curved-stone';
export const CURVED_ROAD_CATALOG=Object.freeze({
 id:CURVED_ROAD_TYPE,label:'Camino empedrado curvo · con bordes',cat:'Pisos',
 kind:'road',icon:'🛤️',w:6,d:6,license:'MIT · geometría HIGHFLY original',
 sub:'Trazá nodos: clic para empezar, clic para doblar y Enter para terminar'
});
export const isCurvedRoad=(o)=>o?.type===CURVED_ROAD_TYPE;
const finite=Number.isFinite;
export const ROAD_WIDTHS=[4,8,12];
export const roadWidth=o=>Math.max(3,Math.min(14,Number(o?.width)||6));
export function roadPathValid(o){
 if(!isCurvedRoad(o)||!Array.isArray(o.points)||o.points.length<2||o.points.length>24)
  return {ok:false,reason:'Se necesitan entre 2 y 24 nodos de camino'};
 if(o.points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(finite)||
   Math.max(Math.abs(p[0]),Math.abs(p[1]))>8080))
  return {ok:false,reason:'Nodo fuera del terreno original Unsung'};
 if(!finite(o.width)||o.width<3||o.width>14||!finite(o.x)||!finite(o.z))
  return {ok:false,reason:'Ancho o posición fuera del rango'};
 let length=0;
 for(let i=1;i<o.points.length;i++){
  const [a,b]=[o.points[i-1],o.points[i]];
  const d=Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(d<.65)return {ok:false,reason:'Uní los nodos separados por al menos 0,65 m'};
  length+=d;
 }
 if(length>600)return {ok:false,reason:'El camino supera 600 m. Creá varios tramos conectados'};
 return {ok:true,length};
}
function catmull(a,b,c,d,t){
 const t2=t*t,t3=t2*t;
 // Catmull–Rom uniform B-spline interpolation, maintaining end-point positions.
 return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
}
export function sampleCurvedRoad(points,spacing=.85){
 if(!Array.isArray(points)||points.length<2)return [];
 const out=[],ds=Math.max(.35,Math.min(2,spacing));
 let length=0,prev=null;
 for(let i=0;i<points.length-1;i++){
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
  const chord=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]);
  const steps=Math.min(250,Math.max(4,Math.ceil(chord/ds)));
  for(let j=0;j<=steps;j++){
   if(i>0&&j===0)continue;
   const t=j/steps;
   const x=catmull(p0[0],p1[0],p2[0],p3[0],t),
    z=catmull(p0[1],p1[1],p2[1],p3[1],t);
   if(prev)length+=Math.hypot(x-prev.x,z-prev.z);
   out.push({x,z,s:length});prev={x,z};
   if(out.length>850)break;
  }
  if(out.length>850)break;
 }
 for(let i=0;i<out.length;i++){
  const a=out[Math.max(0,i-1)],c=out[Math.min(out.length-1,i+1)];
  let dx=c.x-a.x,dz=c.z-a.z;const d=Math.max(.0001,Math.hypot(dx,dz));
  out[i].nx=-dz/d;out[i].nz=dx/d;out[i].tx=dx/d;out[i].tz=dz/d;
 }
 return out;
}
export function distanceToCurvedRoad(x,z,samples){
 let best=Infinity;
 for(let i=1;i<samples.length;i++){
  const a=samples[i-1],b=samples[i],dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
  const t=den>1e-8?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/den)):0;
  const d=(x-a.x-dx*t)**2+(z-a.z-dz*t)**2;
  if(d<best)best=d;
 }
 return Math.sqrt(best);
}
export function roadClearance(x,z,o,samples){
 return distanceToCurvedRoad(x,z,samples)<roadWidth(o)*.5+.6;
}
