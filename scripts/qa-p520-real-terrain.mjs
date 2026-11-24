/** P5.2.0 ACTUAL 16-BIT UNSUNG TERRAIN AUDIT (no WebGL required).
 * Decode the same frozen world/core_h.bin + world/region_h.bin as runtime
 * and reuse the exact Unsung heightAt bilinear blending. No random map guesses.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {planP520Settlements} from '../src/highfly/p520-settlement-plan.mjs';
import {HUNT_MOBS} from '../src/highfly/p49-hunt-data.mjs';

const ROOT=process.cwd(),worldRoot=path.join(ROOT,'.work/unsung/public/world');
const meta=JSON.parse(fs.readFileSync(path.join(worldRoot,'world.json'),'utf8'));
const {POOLS,WORLD}=await import('../.work/unsung/src/world/layout.js');
function load(name,m){
 const buf=zlib.gunzipSync(fs.readFileSync(path.join(worldRoot,name)));
 if(buf.byteLength!==m.res*m.res*2)throw Error('Invalid frozen world grid '+name);
 const out=new Float32Array(m.res*m.res),k=(m.max-m.min)/65535;
 for(let i=0;i<out.length;i++)out[i]=m.min+buf.readUInt16LE(i*2)*k;
 return out;
}
const core=load('core_h.bin',meta.core),region=load('region_h.bin',meta.region);
function sample(data,m,x,z){
 const {res,size}=m,fx=(x/size+.5)*res-.5,fz=(z/size+.5)*res-.5;
 const ix=Math.max(0,Math.min(res-2,Math.floor(fx))),iz=Math.max(0,Math.min(res-2,Math.floor(fz)));
 const tx=Math.max(0,Math.min(1,fx-ix)),tz=Math.max(0,Math.min(1,fz-iz)),o=iz*res+ix;
 return (data[o]*(1-tx)+data[o+1]*tx)*(1-tz)+(data[o+res]*(1-tx)+data[o+res+1]*tx)*tz;
}
const heightAt=(x,z)=>{
 const e=Math.max(Math.abs(x),Math.abs(z))/(meta.core.size*.5);
 const hr=e<.9?0:sample(region,meta.region,x,z);
 if(e>=.985)return hr;
 const hc=sample(core,meta.core,x,z);
 if(e<=.9)return hc;
 const t=(e-.9)/.085,w=1-t*t*(3-2*t);
 return hr+(hc-hr)*w;
};
const world={
 groundHeight:heightAt,
 waterLevel(x,z){
  const g=heightAt(x,z);
  for(const p of POOLS){
   const dx=x-p.x,dz=z-p.z;
   if(dx*dx+dz*dz<p.r*p.r&&g<p.level)return p.level;
  }
  return g<WORLD.waterLevel?WORLD.waterLevel:-Infinity;
 }
};
function validLand(x,z){
 const y=heightAt(x,z);
 const w=world.waterLevel(x,z);
 if(!Number.isFinite(y)||(Number.isFinite(w)&&w>=y-.3))return null;
 const slope=Math.abs(heightAt(x+2,z)-y)+Math.abs(heightAt(x,z+2)-y);
 return slope<=8?{x,z,y}:null;
}
// Reproduce the existing hunt's actual coastline scan instead of inventing a port.
function crabCoast(){
 const offsets=[[9,0],[-9,0],[0,9],[0,-9],[16,0],[-16,0],[0,16],[0,-16]];
 let best=null,score=Infinity;
 for(let x=180;x<=1240;x+=24)for(let z=-620;z<=610;z+=24){
  const dry=validLand(x,z);
  if(!dry||dry.y>28||dry.y<.25)continue;
  let sea=false;
  for(const [dx,dz] of offsets){
   const wx=x+dx,wz=z+dz;
   if(heightAt(wx,wz)<-.25&&Math.abs(world.waterLevel(wx,wz))<.01){sea=true;break;}
  }
  if(!sea)continue;
  const value=Math.abs(x-740)*.018+Math.abs(z+85)*.012+dry.y*.065;
  if(value<score){score=value;best=dry;}
 }
 return best;
}
const hunts={spots:{
 wolf:{point:validLand(HUNT_MOBS.wolf.anchor.x,HUNT_MOBS.wolf.anchor.z)},
 boar:{point:validLand(HUNT_MOBS.boar.anchor.x,HUNT_MOBS.boar.anchor.z)},
 crab:{point:crabCoast()}
}};
const plan=planP520Settlements(world,hunts);
const output={
 type:'P520_REAL_UNSUNG_WORLD_TERRAIN_AUDIT',
 frozenUnsungCommit:JSON.parse(fs.readFileSync('foundation.config.json','utf8')).unsungCommit,
 grid:'2048x2048 core + 2048x2048 region (original 16-bit)',
 regions:plan.regions,
 structures:plan.placed.map(p=>({id:p.id,label:p.label,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2),grade:+p.grade.toFixed(2)})),
 resourceNodes:plan.resources.map(p=>({id:p.id,kind:p.kind,x:+p.x.toFixed(2),y:+p.y.toFixed(2),z:+p.z.toFixed(2)})),
 huntSpots:Object.fromEntries(Object.entries(hunts.spots).map(([k,v])=>[k,v.point])),
 skipped:plan.skipped,
 requiredAndroidQA:'PENDING',actualFps:'NOT_MEASURED',noTerrainModification:true
};
fs.writeFileSync('P520_WORLD_LAYOUT_AUDIT.json',JSON.stringify(output,null,2));
fs.mkdirSync('dist',{recursive:true});
fs.copyFileSync('P520_WORLD_LAYOUT_AUDIT.json','dist/P520_WORLD_LAYOUT_AUDIT.json');
console.log('[HIGHFLY P520 ACTUAL WORLD AUDIT]',JSON.stringify({
 cities:plan.regions,structures:plan.placed.length,resources:plan.resources.length,skipped:plan.skipped,
 huntSpots:output.huntSpots
},null,2));
