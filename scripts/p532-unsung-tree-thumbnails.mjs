/** Model-derived 128x128 previews from REAL Unsung Vale treegen branches and leaf
 * cluster positions. No static stock images or fake generic tree symbols.
 */
import fs from 'node:fs';
import path from 'node:path';
import {generateTree} from '../src/world/flora/treegen.js';
const ROOT=path.join(process.cwd(),'public/highfly/unsung-flora/thumbs');
fs.mkdirSync(ROOT,{recursive:true});
const items=[
 ['unsung-tree-ember','ember','#c4514b'],['unsung-tree-blossom','blossom','#e9a3c0'],
 ['unsung-tree-elder','elder','#bdafe2'],['unsung-tree-cypress','cypress','#496f62'],
 ['unsung-tree-green','green','#689b68'],['unsung-tree-shrub','shrub','#76a164']
];
for(const [id,species,color] of items){
 const tree=generateTree(species,27),size=128;
 const span=Math.max(tree.crownRadius*2.5,tree.height*.88);
 const scale=109/Math.max(.01,span);
 const project=p=>[64+(p[0]-p[2]*.43)*scale,122-(p[1]+(p[0]+p[2])*.16)*scale];
 const branch=tree.branches.filter(b=>b.pts?.length>1&&b.level<3);
 let body='';
 for(const b of branch){
  const pp=b.pts.map(project),r=Math.max(.48,b.radii[0]*scale*1.55);
  body+='<polyline points="'+pp.map(p=>p.map(x=>x.toFixed(2)).join(',')).join(' ')+
   '" fill="none" stroke="#6b5747" stroke-width="'+r.toFixed(2)+'" stroke-linecap="round" stroke-linejoin="round"/>';
 }
 const sorted=[...tree.cards].sort((a,b)=>(a.c[2]+a.c[0]*.3)-(b.c[2]+b.c[0]*.3));
 let n=0;
 for(let i=0;i<sorted.length;i+=Math.max(1,Math.floor(sorted.length/350))){
  const p=sorted[i],xy=project(p.c),r=Math.max(1.4,p.size*scale*.35);
  if(!xy.every(Number.isFinite))continue;
  body+='<ellipse cx="'+xy[0].toFixed(2)+'" cy="'+xy[1].toFixed(2)+
   '" rx="'+r.toFixed(2)+'" ry="'+Math.max(1.1,r*.76).toFixed(2)+
   '" fill="'+color+'" opacity="'+(.62+(n++%5)*.07).toFixed(2)+'"/>';
 }
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'+
  '<ellipse cx="64" cy="122" rx="30" ry="4" fill="#16121d" opacity=".35"/>'+body+'</svg>';
 fs.writeFileSync(path.join(ROOT,id+'.svg'),svg);
}
console.log('[P532 UNSUNG TREE ICONS]',items.length,'real procedural branching species');
