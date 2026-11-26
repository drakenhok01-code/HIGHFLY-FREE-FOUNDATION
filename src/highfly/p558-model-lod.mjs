// P558 — shared per-model LOD index buffers. Original vertex attributes and
// nearby geometry stay untouched. Error-bounded decimation only for distant meshes.
import * as THREE from 'three';
import {MeshoptSimplifier} from 'meshoptimizer';
export async function createLODCache(){
 await MeshoptSimplifier.ready;
 const cache=new WeakMap(),owned=new Set();let originals=0,generated=0,sourceTriangles=0,lodTriangles=0;
 function levels(g){
  if(cache.has(g))return cache.get(g);
  const pos=g.getAttribute('position'),idx=g.getIndex(),count=idx?.count??pos?.count??0;
  let out=[g,g,g];originals++;sourceTriangles+=count/3;
  if(MeshoptSimplifier.supported&&pos&&count>=96&&!g.groups.length&&count%3===0){
   const positions=new Float32Array(pos.count*3),indices=new Uint32Array(count);
   for(let i=0;i<pos.count;i++){positions[i*3]=pos.getX(i);positions[i*3+1]=pos.getY(i);positions[i*3+2]=pos.getZ(i)}
   for(let i=0;i<count;i++)indices[i]=idx?idx.getX(i):i;
   const uv=g.getAttribute('uv'),normal=g.getAttribute('normal'),stride=(uv?2:0)+(normal?3:0);
   const attrs=new Float32Array(pos.count*stride),weights=[];
   if(uv)weights.push(0.7,0.7);if(normal)weights.push(.25,.25,.25);
   if(stride)for(let i=0;i<pos.count;i++){let k=i*stride;if(uv){attrs[k++]=uv.getX(i);attrs[k++]=uv.getY(i)}if(normal){attrs[k++]=normal.getX(i);attrs[k++]=normal.getY(i);attrs[k++]=normal.getZ(i)}}
   for(const [level,ratio,error] of [[1,.48,.018],[2,.18,.055]]){
    try{
     const target=Math.max(12,Math.floor(count*ratio/3)*3);
     const [simplified,err]=stride?MeshoptSimplifier.simplifyWithAttributes(indices,positions,3,attrs,stride,weights,null,target,error,['Permissive']):MeshoptSimplifier.simplify(indices,positions,3,target,error);
     if(simplified.length>=12&&simplified.length<count*.92&&err<=error*1.01){
      const geo=new THREE.BufferGeometry();for(const [name,attr] of Object.entries(g.attributes))geo.setAttribute(name,attr.clone());
      geo.setIndex(new THREE.BufferAttribute(simplified,1));geo.boundingBox=g.boundingBox?.clone()??null;geo.boundingSphere=g.boundingSphere?.clone()??null;
      if(!geo.boundingSphere)geo.computeBoundingSphere();owned.add(geo);out[level]=geo;generated++;
     }else out[level]=out[level-1];
    }catch(e){out[level]=out[level-1];console.warn('P558 simplifier fallback',e.message)}
   }
  }
  lodTriangles+=(out[2].index?.count??out[2].attributes.position.count)/3;
  cache.set(g,out);return out;
 }
 return {levels,metrics:()=>({originals,generated,sourceTriangles,lodTriangles}),dispose(){for(const g of owned)g.dispose();owned.clear()}};
}
export function lodLevel(distance,kind,previous=0){
 const near=kind==='landmark'?48:kind==='mid'?26:18,far=kind==='landmark'?105:kind==='mid'?58:34;
 const h=5;if(previous===0&&distance<near+h)return 0;if(previous===2&&distance>far-h)return 2;
 return distance<near?0:distance<far?1:2;
}
export function triangleCount(g){return (g.index?.count??g.attributes.position.count)/3}
