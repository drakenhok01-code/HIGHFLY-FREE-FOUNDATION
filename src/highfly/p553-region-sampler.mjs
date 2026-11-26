/* P553 continuous native terrain sampler. No hex surface is rendered.
 * Preserve tile heights at occupied centres; interpolate between centres.
 * Water beds and level remain source-derived; physical navigation not baked.
 */
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
export const REGION_THEMES={1:'Valle del sudeste',2:'Villa occidental',3:'Puerto oriental sur',4:'Gran región agrícola',5:'Altiplano del norte',6:'Puerto oriental norte',7:'Marca noroccidental',8:'Campos y fortalezas del sur'};
export const treeId=id=>/^(?:kaykit-forest\/tree-|kaykit-halloween\/tree-dead)/i.test(id);
export const shrubId=id=>/^kaykit-forest\/bush-/i.test(id);
export function makeRegionSampler(d,p,native){
 const R=d.tileRadius,S=p.scale,table=new Map(d.tiles.map(t=>[t.q+','+t.r,t]));
 const byIndex=new Map(d.tiles.map(t=>[t.i,t])),riverGrid=new Map(),walkGrid=new Map();
 const bucket=R*2,key=(x,z)=>Math.floor(x/bucket)+','+Math.floor(z/bucket);
 function register(grid,a,b,pad,value){for(let x=Math.floor((Math.min(a.x,b.x)-pad)/bucket);x<=Math.floor((Math.max(a.x,b.x)+pad)/bucket);x++)for(let z=Math.floor((Math.min(a.z,b.z)-pad)/bucket);z<=Math.floor((Math.max(a.z,b.z)+pad)/bucket);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(value)}}
 for(const river of d.rivers??[])for(let i=1;i<(river.tiles??[]).length;i++){const a=byIndex.get(river.tiles[i-1]),b=byIndex.get(river.tiles[i]);if(a?.ground==='water'&&b?.ground==='water')register(riverGrid,a,b,R,{a,b});}
 for(const w of [...(d.stairs??[]),...(d.bridges??[]).flatMap(b=>b.legs??[])]){if(![w.ax,w.az,w.ay,w.bx,w.bz,w.by,w.half].every(Number.isFinite))continue;register(walkGrid,{x:w.ax,z:w.az},{x:w.bx,z:w.bz},w.half+R*.2,w)}
 function segment(x,z,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,n=dx*dx+dz*dz,t=n?clamp(((x-ax)*dx+(z-az)*dz)/n,0,1):0;return {t,dist:Math.hypot(x-ax-dx*t,z-az-dz*t)}}
 function riverAt(x,z){let best=null;for(const {a,b} of riverGrid.get(key(x,z))??[]){const v=segment(x,z,a.x,a.z,b.x,b.z);if(!best||v.dist<best.dist){const level=t=>Math.max(-.05,t.top-.14);best={dist:v.dist,level:level(a)+(level(b)-level(a))*v.t}}}return best}
 function walkwayAt(x,z){let best=null;for(const w of walkGrid.get(key(x,z))??[]){const v=segment(x,z,w.ax,w.az,w.bx,w.bz);if(v.dist<=w.half+.12&&(!best||v.dist<best.dist))best={...v,w,y:w.ay+(w.by-w.ay)*v.t};}return best}
 const centre=(q,r)=>[Math.sqrt(3)*R*(q+r/2),1.5*R*r];
 function nearest(x,z){const q=Math.round((Math.sqrt(3)*x/3-z/3)/R),r=Math.round(2*z/(3*R));let best=null,dist=Infinity;for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const t=table.get((q+i)+','+(r+j));if(!t)continue;const dd=Math.hypot(t.x-x,t.z-z);if(dd<dist){best=t;dist=dd}}return {t:best,dist,q,r}}
 function source(x,z){
  const a=nearest(x,z),t=a.t;
  if(!t)return {height:-2.5,waterLevel:-.05,water:0,soil:0,coverage:0,t:null};
  let h=0,soil=0,water=0,wy=0,total=0;
  for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){const v=table.get((a.q+i)+','+(a.r+j));if(!v)continue;const dd=Math.hypot(v.x-x,v.z-z)/R;if(dd>2.1)continue;const k=Math.pow(Math.max(0,1-dd/2.1),3);const wet=v.ground==='water',level=v.top-.14>-.05?v.top-.14:-.05;h+=k*(wet?Math.min(v.top-.55,level-.38):v.top);soil+=k*(['soil','dirt','sand','paved'].includes(v.ground)?1:0);water+=wet?k:0;wy+=wet?k*level:0;total+=k;}
  const wet=t.ground==='water',level=t.top-.14>-.05?t.top-.14:-.05,top=wet?Math.min(t.top-.55,level-.38):t.top;
  const keep=1-smooth((a.dist/R-.36)/.48),mix=(a,b,k)=>a+(b-a)*k;
  return {height:mix(h/(total||1),top,keep),waterLevel:water?wy/water:level,water:mix(water/(total||1),wet?1:0,keep),soil:mix(soil/(total||1),['soil','dirt','sand','paved'].includes(t.ground)?1:0,keep),coverage:1-smooth((a.dist/R-1.02)/.58),t};
 }
 // Blend farther outside the island through an irregular, continuous apron.
 function sample(x,z){
  const lx=(x-p.x)/S,lz=(z-p.z)/S,q=source(lx,lz),b=p.bounds;
  const edge=Math.min(x-b.minX,b.maxX-x,z-b.minZ,b.maxZ-z);
  if(edge<=0)return {y:native(x,z),soil:0,water:0,level:-.07,inside:false,transition:0};
  let k=q.coverage;
  if(k<.999){const a=nearest(lx,lz);let dist=Infinity;
   // nearest tile on the perimeter, using bounded axial search (max 36m apron).
   const n=Math.ceil(p.transition/(R*S))+2;
   for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){const t=table.get((a.q+i)+','+(a.r+j));if(t)dist=Math.min(dist,Math.hypot(t.x-lx,t.z-lz)*S)}
   k=Math.max(k,.95*(1-smooth((dist-R*S*.8)/p.transition)));
  }
  k*=smooth(edge/9);
  let height=q.height,water=q.water*q.coverage,level=q.waterLevel;const rv=riverAt(lx,lz);if(rv&&rv.dist<R*.66){const w=1-smooth((rv.dist/R-.40)/.26);if(w>0){height=Math.min(height,height+(rv.level-.48-height)*w);water=Math.max(water,w);if(w>.3)level=rv.level;}}const walkway=walkwayAt(lx,lz);if(walkway?.w.kind==='stairs'&&walkway.t>.05&&walkway.t<.95&&water<.5){const w=1-smooth((walkway.dist-walkway.w.half*.7)/Math.max(.05,walkway.w.half*.3+.12));height=Math.min(height,height+(walkway.y-.17-height)*w);}
  const target=p.base+height*S,original=native(x,z),y=original+(target-original)*k;
  return {y,soil:q.soil*q.coverage,water,level:p.base+level*S,inside:q.coverage>.5,transition:k};
 }
 return {sample,source,nearest,riverAt,walkwayAt};
}
export function sourceScaleAudit(d,assets){
 const doors=(d.doorways??[]).map(x=>x.h??x.height).filter(x=>Number.isFinite(x)&&x>0).map(x=>x*d.scale).sort((a,b)=>a-b);
 const range=a=>a.length?{min:a[0],median:a[Math.floor(a.length/2)],max:a.at(-1)}:null;
 const widths=(d.doorways??[]).map(x=>x.w).filter(x=>Number.isFinite(x)&&x>0).map(x=>x*d.scale).sort((a,b)=>a-b);
 const trees=d.pieces.filter(q=>treeId(q.piece)),shrubs=d.pieces.filter(q=>shrubId(q.piece));
 const sizes=trees.map(q=>(assets.get(q.piece)?.size?.[1]??0)*(q.scale??1)*d.scale).filter(n=>n>0).sort((a,b)=>a-b);
 return {seed:d.seed,scale:d.scale,hero:1.82,doors:doors.length,doorHeights:range(doors),doorWidths:range(widths),doorsBelowHero:doors.filter(h=>h<1.82).length,trees:trees.length,shrubs:shrubs.length,treeHeights:range(sizes),originalPieces:d.pieces.length,retainedNonTrees:d.pieces.length-trees.length-shrubs.length};
}
