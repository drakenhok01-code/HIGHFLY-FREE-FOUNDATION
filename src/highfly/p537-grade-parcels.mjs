/**
 * HIGHFLY World Forge 4.5 — terrain-conforming building lots.
 * Shared by editor and RPG. The source heightfield is NEVER overwritten.
 * Instead: sample original ground under the entire rotated prefab, lift ONLY
 * the earth needed to meet the highest supporting point, then feather to the
 * original terrain at a compact apron. No artificial floating stone slab.
 * CPU deterministic, does not access Three.js or browser localStorage.
 * Original code, MIT; compatible with the original Unsung Vale MIT world.
 */
export const GROUND_FIT_VERSION='p537-grade-1';
const smooth=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const finite=Number.isFinite;
export function gradePlanFor(o,{w,d},heightAt,{apron=3,subdivisions=6,dynamicApron=false}={}){
 if(!o||!finite(o.x)||!finite(o.z)||!finite(o.yaw)||!finite(w)||!finite(d)||!finite(o.scale)||
  o.scale<=0||w<=0||d<=0||typeof heightAt!=='function')throw Error('Invalid rotated grade parcel');
 const W=w*o.scale,D=d*o.scale,c=Math.cos(o.yaw),s=Math.sin(o.yaw),values=[];
 const sample=(lx,lz)=>heightAt(o.x+lx*c-lz*s,o.z+lx*s+lz*c);
 for(let i=0;i<=subdivisions;i++)for(let j=0;j<=subdivisions;j++){
  const y=sample((i/subdivisions-.5)*W,(j/subdivisions-.5)*D);
  if(!finite(y))throw Error('Non-finite original terrain height');
  values.push(y);
 }
 // Always fill, never cut through the original collision heightfield:
 // this keeps the native game terrain from visibly poking through the lot.
 const groundMax=Math.max(...values),groundMin=Math.min(...values);
 return {id:o.id??'',x:o.x,z:o.z,yaw:o.yaw,w:W,d:D,
  y:groundMax,groundMin,slope:groundMax-groundMin,
   // P539: steep lots get a wider feathered EARTH ramp rather than a floating box.
   // Opt-in only: P537/P538 continue using the original compact 3m apron.
   apron:dynamicApron?Math.min(24,Math.max(3,3+(groundMax-groundMin)*.88)):Math.max(1.5,Math.min(6,apron)),
  c,s,source:'Unsung-original-heightfield'};
}
export function gradeHeightAt(x,z,base,plan){
 if(!finite(base)||!plan)return base;
 const dx=x-plan.x,dz=z-plan.z,
  lx=Math.abs(dx*plan.c+dz*plan.s)-plan.w*.5,
  lz=Math.abs(-dx*plan.s+dz*plan.c)-plan.d*.5;
 const outside=Math.hypot(Math.max(0,lx),Math.max(0,lz));
 if(outside>=plan.apron)return base;
 return base+Math.max(0,plan.y-base)*(1-smooth(outside/plan.apron));
}
export function gradeHeightForPlans(x,z,base,plans){
 let y=base;for(const p of plans)y=Math.max(y,gradeHeightAt(x,z,base,p));
 return y;
}
export function gradeCellKey(x,z,cell=32){return Math.floor(x/cell)+','+Math.floor(z/cell);}
export function indexGradePlans(plans,{cell=32}={}){
 const index=new Map();
 for(const p of plans){
  const r=Math.hypot(p.w,p.d)*.5+p.apron;
  for(let ix=Math.floor((p.x-r)/cell);ix<=Math.floor((p.x+r)/cell);ix++)
   for(let iz=Math.floor((p.z-r)/cell);iz<=Math.floor((p.z+r)/cell);iz++){
    const key=ix+','+iz,part=index.get(key)||[];part.push(p);index.set(key,part);
   }
 }
 return {index,cell};
}
export function fastGradeHeightAt(x,z,base,spatial){
 if(!spatial)return base;
 return gradeHeightForPlans(x,z,base,spatial.index.get(gradeCellKey(x,z,spatial.cell))||[]);
}
export function gradePatchGrid(plan,heightAt,{step=1,raise=.065}={}){
 const radiusX=plan.w*.5+plan.apron,radiusZ=plan.d*.5+plan.apron;
 const nx=Math.max(2,Math.ceil(radiusX*2/Math.max(.3,step)));
 const nz=Math.max(2,Math.ceil(radiusZ*2/Math.max(.3,step)));
 const vertices=[],uv=[],indices=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const lx=(i/nx-.5)*radiusX*2,lz=(j/nz-.5)*radiusZ*2,
   x=plan.x+lx*plan.c-lz*plan.s,z=plan.z+lx*plan.s+lz*plan.c;
  const h=gradeHeightAt(x,z,heightAt(x,z),plan);
  vertices.push(x,h+raise,z);
  uv.push(x/3.2,z/3.2);
  if(i<nx&&j<nz){
   const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
   indices.push(a,c,b,b,c,d);
  }
 }
 return {vertices,uv,indices,nx,nz};
}
