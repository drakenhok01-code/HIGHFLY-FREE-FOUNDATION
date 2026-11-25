/* World Forge 4.0 · authentic Unsung editor geometry.
 * Reconstructs each exact native MeshBuilder prefab exported at build time,
 * in a lightweight editor-safe vertex-colour material. RPG uses Unsung native shaders.
 */
import * as THREE from 'three';
const COLORS=[0xa4a1a0,0xd6d4cb,0xe8bd75,0x92798f,0xb2a79b,0xaaa1a5,0x84b6bf,0x514b53];
const sharedMaterial=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
let promise=null;
export async function loadUnsungOriginalCatalog(resolveUrl){
 if(!promise)promise=Promise.all([
  fetch(resolveUrl('unsung-original-prefabs.json')).then(x=>{if(!x.ok)throw Error('Unsung prefab manifest '+x.status);return x.json();}),
  fetch(resolveUrl('unsung-original-prefabs.bin')).then(x=>{if(!x.ok)throw Error('Unsung model buffer '+x.status);return x.arrayBuffer();})
 ]).then(([meta,data])=>{
  if(meta.schema!==1||meta.models?.length<10||data.byteLength!==meta.byteLength)throw Error('Unsung original prefab archive incomplete');
  return {meta,data,cache:new Map()};
 }).catch(err=>{promise=null;throw err});
 return promise;
}
export async function loadUnsungOriginal(type,resolveUrl){
 const {meta,data,cache}=await loadUnsungOriginalCatalog(resolveUrl);
 if(cache.has(type))return cache.get(type);
 const spec=meta.models.find(x=>x.id===type);if(!spec)throw Error('Unsung original not exported: '+type);
 const field=(name,cls)=>{
  const f=spec.fields[name];if(!f||f.offset<0||f.length<0||f.offset+f.length>data.byteLength)throw Error('Original Unsung fields corrupted '+name);
  return new cls(data.slice(f.offset,f.offset+f.length));
 };
 const pos=field('position',Float32Array),norm=field('normal',Float32Array),
 mats=field('material',Uint8Array),index=field('index',Uint32Array);
 if(pos.length!==spec.vertices*3||norm.length!==pos.length||mats.length!==spec.vertices||
    index.length!==spec.triangles*3)throw Error('Original Unsung geometry mismatch '+type);
 const color=new Uint8Array(spec.vertices*3);
 for(let i=0;i<spec.vertices;i++){
  const c=new THREE.Color(COLORS[mats[i]]??COLORS[0]);
  color[i*3]=Math.round(c.r*255);color[i*3+1]=Math.round(c.g*255);color[i*3+2]=Math.round(c.b*255);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 geo.setAttribute('normal',new THREE.BufferAttribute(norm,3));
 geo.setAttribute('color',new THREE.BufferAttribute(color,3,true));
 geo.setIndex(new THREE.BufferAttribute(index,1));
 geo.computeBoundingBox();geo.computeBoundingSphere();
 const mesh=new THREE.Mesh(geo,sharedMaterial);
 const group=new THREE.Group();group.name=type;group.add(mesh);
 cache.set(type,group);return group;
}
