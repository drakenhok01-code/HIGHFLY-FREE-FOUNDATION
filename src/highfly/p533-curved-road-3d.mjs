/**
 * HIGHFLY P533 · premium curved cobbles with STONE EDGE on real Unsung ground.
 * One single textured continuous ribbon, no disjoint square road tiles or
 * cubic bases floating above grass. Identical mesh in editor and playable RPG.
 * Geometry is purely procedural original HIGHFLY artwork, MIT-compatible.
 */
import * as THREE from 'three';
import {sampleCurvedRoad,roadWidth,roadPathValid} from './p533-curved-road-path.mjs';
let cache=null;
export function cobbleMaterials(){
 if(cache)return cache;
 const c=document.createElement('canvas');c.width=c.height=512;
 const g=c.getContext('2d');
 g.fillStyle='#77746b';g.fillRect(0,0,512,512);
 const rnd=(n)=>{let h=Math.imul((n+191),374761393);h=(h^(h>>>13))>>>0;return (h%10000)/10000;};
 const rows=16,step=512/rows;
 for(let row=0;row<rows;row++){
  let x=(row%2?-.49:0)*step,index=0;
  while(x<520){
   const k=row*70+index++,length=step*(1.5+rnd(k)*1.2),left=x+1.3,top=row*step+1.2;
   const base=159+Math.floor(rnd(k+9)*53),r=Math.min(245,base+7),g0=Math.min(246,base+5),b=Math.max(95,base-3);
   g.fillStyle='rgb('+r+','+g0+','+b+')';
   g.beginPath();g.moveTo(left+3,top);g.lineTo(x+length-4,top+1);
   g.lineTo(x+length-1,top+step-5);g.lineTo(left+4,top+step-1);
   g.lineTo(left,top+step-5);g.closePath();g.fill();
   g.strokeStyle='rgba(33,38,34,.25)';g.lineWidth=1.4;g.stroke();
   g.fillStyle='rgba(253,248,222,.20)';g.fillRect(left+4,top+1,Math.max(2,length-11),1.3);
   x+=length;
  }
 }
 for(let i=0;i<4000;i++){
  const x=rnd(i*7+8)*512,y=rnd(i*11+19)*512,a=.025+rnd(i)*.065;
  g.fillStyle='rgba(48,49,44,'+a+')';g.fillRect(x,y,1.0,1.1);
 }
 const texture=new THREE.CanvasTexture(c);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.anisotropy=4;texture.needsUpdate=true;
 const paving=new THREE.MeshLambertMaterial({map:texture,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1});
 const rim=new THREE.MeshLambertMaterial({color:0xc4bba8,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
 const rimOuter=new THREE.MeshLambertMaterial({color:0x8e887e,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3});
 cache={paving,rim,rimOuter};return cache;
}
function strip(samples,road,offsetA,offsetB,sampler,{anchorX,anchorY,anchorZ,raise}){
 const vertices=[],uv=[],idx=[];
 for(let i=0;i<samples.length;i++){
  const s=samples[i];
  for(const lateral of [offsetA,offsetB]){
   const x=s.x+s.nx*lateral,z=s.z+s.nz*lateral;
   const y=sampler(x,z);
   vertices.push(x-anchorX,(Number.isFinite(y)?y:0)-anchorY+raise,z-anchorZ);
   // Global distance and lateral meters -> seamless 2.8m stone texture repeat,
   // including tight turns and between neighbouring road sections.
   uv.push(lateral/2.8,s.s/2.8);
  }
  if(i>0){const a=(i-1)*2,b=i*2;idx.push(a,b,a+1,b,b+1,a+1);}
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
export function makeCurvedCobblestone3D(road,heightAt,options={}){
 const check=roadPathValid(road);if(!check.ok)throw Error(check.reason);
 if(typeof heightAt!=='function')throw Error('Missing exact Unsung terrain sampler');
 const samples=sampleCurvedRoad(road.points,.72),w=roadWidth(road)*.5;
 const origin={anchorX:options.anchorX??0,anchorY:options.anchorY??0,anchorZ:options.anchorZ??0};
 const mats=cobbleMaterials(),root=new THREE.Group();root.name='HIGHFLY_CURVED_COBBLE_'+road.id;
 const bands=[
  [-w+.08,w-.08,.105,mats.paving,'empedrado continuo'],
  [-w-.23,-w+.14,.155,mats.rim,'bordillo de piedra izquierdo'],
  [w-.14,w+.23,.155,mats.rim,'bordillo de piedra derecho'],
  [-w-.33,-w-.18,.10,mats.rimOuter,'contorno izquierdo'],
  [w+.18,w+.33,.10,mats.rimOuter,'contorno derecho']
 ];
 for(const [left,right,raise,material,name] of bands){
  const mesh=new THREE.Mesh(strip(samples,road,left,right,heightAt,{...origin,raise}),material);
  mesh.name=name;mesh.receiveShadow=true;mesh.frustumCulled=true;mesh.userData.road=true;
  root.add(mesh);
 }
 root.userData.samples=samples;root.userData.roadWidth=roadWidth(road);
 return root;
}
export function disposeCurvedRoadGeometry(group){
 group?.traverse?.(x=>{if(x.isMesh&&x.userData.road)x.geometry?.dispose();});
}
