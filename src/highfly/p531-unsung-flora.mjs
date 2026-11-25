/** P531 — exact Unsung Vale procedural tree generator, MIT.
 * Shares real species, seeds, branch geometry and leaf cards from Unsung treegen.
 * Leaves use editor-safe simplified material; geometry matches the original
 * forest procedural generator instead of a generic cone/box placeholder.
 */
import * as THREE from 'three';
import {generateTree,buildWood,buildLeaves} from '../world/flora/treegen.js';
export const UNSUNG_FLORA=[
 {id:'unsung-tree-ember',label:'Arce carmesí original',species:'ember',w:12,d:12,icon:'🍁',kind:'nature'},
 {id:'unsung-tree-blossom',label:'Cerezo rosa original',species:'blossom',w:10,d:10,icon:'🌸',kind:'nature'},
 {id:'unsung-tree-elder',label:'Árbol lila original',species:'elder',w:12,d:12,icon:'🌳',kind:'nature'},
 {id:'unsung-tree-cypress',label:'Ciprés original',species:'cypress',w:5,d:5,icon:'🌲',kind:'nature'},
 {id:'unsung-tree-green',label:'Árbol verde original',species:'green',w:12,d:12,icon:'🌳',kind:'nature'},
 {id:'unsung-tree-shrub',label:'Arbusto original',species:'shrub',w:3,d:3,icon:'🌿',kind:'nature'}
];
export const UNSUNG_FLORA_BY_ID=new Map(UNSUNG_FLORA.map(x=>[x.id,x]));
const foliageColors={ember:0xc45950,blossom:0xf4a7cd,elder:0xc9b6ed,cypress:0x3d685d,green:0x74a56c,shrub:0x79a26c};
const cache=new Map();
function makeGeometry(data){
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(data.position,3));
 if(data.normal?.length===data.position.length)g.setAttribute('normal',new THREE.BufferAttribute(data.normal,3));
 if(data.uv?.length===data.position.length/3*2)g.setAttribute('uv',new THREE.BufferAttribute(data.uv,2));
 g.setIndex(new THREE.BufferAttribute(data.index,1));g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function makeLeafTexture(){
 const n=64,d=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=(x+.5-n/2)/(n/2),v=(y+.5-n/2)/(n/2);
  // Undulating multi-lobed canopy cards, transparent in the empty corners.
  const a=Math.atan2(v,u),r=Math.hypot(u,v),radius=.79+.09*Math.cos(5*a)+.06*Math.sin(3*a);
  const i=(y*n+x)*4,val=r<radius?255:0;
  d[i]=255;d[i+1]=255;d[i+2]=255;d[i+3]=val;
 }
 const t=new THREE.DataTexture(d,n,n,THREE.RGBAFormat);
 t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
let leafTex;
export function nativeUnsungFlora(speciesId){
 const a=UNSUNG_FLORA_BY_ID.get(speciesId);if(!a)throw Error('Unknown native Unsung species '+speciesId);
 if(cache.has(speciesId))return cache.get(speciesId);
 const tree=generateTree(a.species,27),wood=buildWood(tree,a.species==='shrub'?1:2,[8,6,4,3]);
 const leaves=buildLeaves(tree,a.species==='shrub'?.6:.28,1.55);
 const group=new THREE.Group();group.name=speciesId;
 const trunk=new THREE.Mesh(makeGeometry(wood),new THREE.MeshLambertMaterial({color:0x78604f,side:THREE.DoubleSide}));
 trunk.name='unsung_original_branch_mesh';group.add(trunk);
 leafTex??=makeLeafTexture();
 const canopy=new THREE.Mesh(makeGeometry(leaves),new THREE.MeshLambertMaterial({
  color:foliageColors[a.species],map:leafTex,side:THREE.DoubleSide,alphaTest:.35,depthWrite:true
 }));
 canopy.name='unsung_original_leaf_cards';group.add(canopy);
 cache.set(speciesId,group);return group;
}
