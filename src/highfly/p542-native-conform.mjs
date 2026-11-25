/**
 * HIGHFLY P5.4.2 — native terrain conforming geometry for freehand construction.
 * Nothing in here writes or raises the Unsung heightfield.
 * Retains world coordinates and yaw in the original schema-1 edit layout.
 */
const finite=Number.isFinite;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const NATIVE_CONFORM_VERSION='p542-native-1';

/** Dense quads placed at the ACTUAL source terrain/plaza elevation.
 * root.position=(o.x, anchorY, o.z); positions are stored relative to root.
 */
export function conformingTileGrid(o,{w,d},heightAt,{anchorY=0,divisions=10,raise=.16}={}){
 if(!o||![o.x,o.z,o.yaw,o.scale,w,d,anchorY].every(finite)||
    w<=0||d<=0||o.scale<=0||typeof heightAt!=='function')
  throw Error('Conforming tile input invalid');
 const n=clamp(Math.round(divisions),4,32);
 const radX=w*o.scale*.5,radZ=d*o.scale*.5;
 const c=Math.cos(o.yaw),s=Math.sin(o.yaw),pos=[],uv=[],index=[];
 let lo=Infinity,hi=-Infinity;
 for(let iz=0;iz<=n;iz++)for(let ix=0;ix<=n;ix++){
  const lx=(ix/n*2-1)*radX,lz=(iz/n*2-1)*radZ;
  const gx=o.x+lx*c-lz*s,gz=o.z+lx*s+lz*c;
  const ground=heightAt(gx,gz);
  if(!finite(ground))throw Error('Unsung source height is not finite');
  const y=ground-anchorY+raise;
  lo=Math.min(lo,ground);hi=Math.max(hi,ground);
  pos.push(lx,y,lz);
  uv.push(gx/4,gz/4);
 }
 for(let iz=0;iz<n;iz++)for(let ix=0;ix<n;ix++){
  const j=iz*(n+1)+ix;
  // Both editor and RPG use consistent winding and no gaps between cells.
  index.push(j,j+n+1,j+1,j+1,j+n+1,j+n+2);
 }
 return {position:pos,uv,index,divisions:n,minimum:lo,maximum:hi,
  count:n*n*2,anchorY,raise,terrainSource:'UNSUNG_ORIGINAL'};
}

/** A rigid authored KayKit building stays level, but its base and supports
 * extend DOWN to its existing ground at 9 contact positions. This is a model
 * adaptation, NOT terrain flattening, a false floating slab, or a source edit.
 */
export function buildingSupportPlan(o,{w,d},heightAt,{clearance=.05,topOverride=null}={}){
 if(!o||![o.x,o.z,o.yaw,o.scale,w,d].every(finite)||typeof heightAt!=='function')
  throw Error('Building support invalid');
 const c=Math.cos(o.yaw),s=Math.sin(o.yaw),rw=w*o.scale*.46,rd=d*o.scale*.46;
 const pts=[];
 for(const z of [-rd,0,rd])for(const x of [-rw,0,rw]){
  const gx=o.x+x*c-z*s,gz=o.z+x*s+z*c,ground=heightAt(gx,gz);
  if(!finite(ground))throw Error('Nonfinite building ground');
  pts.push({x,z,gx,gz,ground});
 }
 const top=Math.max(...pts.map(p=>p.ground))+clearance;
 const baseTop=finite(topOverride)?Math.max(top,topOverride):top;
 const minimum=Math.min(...pts.map(p=>p.ground));
 return {top:baseTop,minimum,relief:baseTop-minimum,positions:pts.map(p=>({...p,
  // Local support column spans between source ground and the level structural base.
  height:Math.max(0,baseTop-p.ground),centerY:(p.ground+baseTop)*.5-baseTop})),source:'UNSUNG_ORIGINAL',deformsTerrain:false};
}
