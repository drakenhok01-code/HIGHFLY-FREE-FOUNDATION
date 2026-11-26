// P557: use Unsung's existing native forest variants, LOD buffers and baked impostor atlas.
// No additional GPU atlas or editor full-geometry forest. Keep every source position.
import * as THREE from 'three';
export function mountRegionForest(forest,plants){
 if(!forest?.variants?.length||!forest.impQuad||!forest.impMaterial||!forest.chunks)throw Error('Native forest LOD unavailable');
 const byName=new Map();forest.variants.forEach((v,i)=>{if(!byName.has(v.species))byName.set(v.species,[]);byName.get(v.species).push(i)});
 const added=new Set(),shrubs=new Set(),touched=new Set(),blocks=new Map(),meshes=[];
 const C=forest.chunkSize??128,rand=(x,z)=>{const n=Math.sin(x*12.9898+z*78.233)*43758.5453;return n-Math.floor(n)};
 for(const t of plants){
  if(t.name==='shrub'&&forest.shrubCells){const k=rand(t.x,t.z)<.65?0:rand(t.z,t.x)<.55?1:2;forest.addShrubAt(t.x,t.y,t.z,t.h/2,k);continue}
  const list=byName.get(t.name)??byName.get('green'),v=list[Math.floor(rand(t.x,t.z)*list.length)],variant=forest.variants[v];
  const row={x:t.x,y:t.y,z:t.z,s:t.h/Math.max(.1,variant.tree.height),yaw:t.rot,seed:rand(t.z,t.x),v};
  added.add(row);forest.trees.push(row);const cx=Math.floor(row.x/C),cz=Math.floor(row.z/C),key=cx+','+cz;let cell=forest.chunks.get(key);if(!cell){cell={cx,cz,list:[]};forest.chunks.set(key,cell)}cell.list.push(row);touched.add(key);
  const k=Math.floor(row.x/128)+','+Math.floor(row.z/128);if(!blocks.has(k))blocks.set(k,[]);blocks.get(k).push(row);
 }
 // Native shrubs are recorded after insertion so removal won't affect existing shrubs.
 const positions=new Set(plants.filter(t=>t.name==='shrub').map(t=>t.x+','+t.z));
 for(const [key,cell] of forest.shrubCells??[])for(const t of cell)if(positions.has(t.x+','+t.z))shrubs.add(t);
 for(const list of blocks.values()){
  const a=new Float32Array(list.length*4),b=new Float32Array(list.length*4),box=new THREE.Box3();
  list.forEach((t,i)=>{const v=forest.variants[t.v];a.set([t.x,t.y,t.z,t.s],i*4);b.set([t.yaw,t.seed,t.v,v.size],i*4);box.expandByPoint(new THREE.Vector3(t.x,t.y,t.z));box.expandByPoint(new THREE.Vector3(t.x,t.y+v.size*t.s,t.z))});
  const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',forest.impQuad.getAttribute('position'));g.setIndex(forest.impQuad.getIndex());g.setAttribute('iTree',new THREE.InstancedBufferAttribute(a,4));g.setAttribute('iParam',new THREE.InstancedBufferAttribute(b,4));g.instanceCount=list.length;g.boundingSphere=box.getBoundingSphere(new THREE.Sphere());g.boundingSphere.radius+=30;
  const m=new THREE.Mesh(g,forest.impMaterial);m.matrixAutoUpdate=false;m.updateMatrixWorld(true);forest.group.add(m);meshes.push(m);
 }
 forest._listPos=null;
 return {trees:added.size,shrubs:shrubs.size,impostorBlocks:meshes.length,dispose(){
  forest.trees=forest.trees.filter(t=>!added.has(t));
  for(const k of touched){const c=forest.chunks.get(k);if(c){c.list=c.list.filter(t=>!added.has(t));if(!c.list.length)forest.chunks.delete(k)}}
  for(const [k,c] of forest.shrubCells??[]){const a=c.filter(t=>!shrubs.has(t));if(a.length)forest.shrubCells.set(k,a);else forest.shrubCells.delete(k)}
  for(const m of meshes){m.removeFromParent();m.geometry.dispose()}forest._listPos=null;
 }};
}
