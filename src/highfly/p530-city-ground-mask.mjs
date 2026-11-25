/** World Forge P530 · GPU vegetation exclusion mask.
 * 2048m original Unsung core mapped to 1024 R8 pixels (2 m/pixel).
 * Clears grass/flowers only under new approved paved roads and footprints,
 * leaves the original procedural terrain/vegetation everywhere else unchanged.
 * No per-frame CPU work. Result uploaded once to both native grass shaders.
 */
export function buildWorldForgeCityMask(objects,bounds,{resolution=1024,worldSize=2048}={}){
 if(!Number.isInteger(resolution)||resolution<8||resolution>2048||worldSize<=0)throw Error('Invalid city mask size');
 const mask=new Uint8Array(resolution*resolution),origin=worldSize/2,step=worldSize/resolution;
 let surfaces=0,painted=0;
 for(const o of objects||[]){
  const dims=bounds[o.type];
  if(!dims||!Number.isFinite(o.x)||!Number.isFinite(o.z)||!Number.isFinite(o.scale)||o.scale<=0)continue;
  if(!o.type.startsWith('floor-')&&!o.clearTrees)continue;
  // Flora is meant to remain around decorations, but not on roads or house foundations.
  const [w,d]=dims.map(n=>n*o.scale),c=Math.cos(o.yaw||0),s=Math.sin(o.yaw||0);
  const radius=Math.hypot(w,d)*.5+1.1,px=x=>Math.floor((x+origin)/step);
  const minX=Math.max(0,px(o.x-radius)),maxX=Math.min(resolution-1,px(o.x+radius));
  const minZ=Math.max(0,px(o.z-radius)),maxZ=Math.min(resolution-1,px(o.z+radius));
  if(minX>maxX||minZ>maxZ)continue;
  surfaces++;
  const margin=o.type.startsWith('floor-') ? .28 : .12;
  for(let iz=minZ;iz<=maxZ;iz++){
   const z=(iz+.5)*step-origin,rz=z-o.z;
   for(let ix=minX;ix<=maxX;ix++){
    const x=(ix+.5)*step-origin,rx=x-o.x;
    const lx=rx*c+rz*s,lz=-rx*s+rz*c;
    if(Math.abs(lx)<=w*.5+margin&&Math.abs(lz)<=d*.5+margin){
     const pos=iz*resolution+ix;if(!mask[pos])painted++;mask[pos]=255;
    }
   }
  }
 }
 return {mask,resolution,worldSize,surfaces,painted};
}
