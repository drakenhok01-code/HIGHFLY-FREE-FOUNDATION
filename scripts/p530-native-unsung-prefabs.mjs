/* Runs inside the pinned, MIT-licensed Unsung checkout during full HIGHFLY build.
 * Exports EXACT original procedural kit geometry, per-vertex material indices, and
 * reliable bounds. No private SOURCE contents, no GPU, no duplicate renderer.
 */
import fs from 'node:fs';
import path from 'node:path';
import {MeshBuilder} from '../src/world/arch/builder.js';
import * as arch from '../src/world/arch/builder.js';
import * as kit from '../src/world/arch/kit.js';
import {UNSUNG_ORIGINAL_ASSETS,buildUnsungOriginal} from '../src/highfly/p530-unsung-original.mjs';

const dir=path.join(process.cwd(),'public','highfly');
fs.mkdirSync(dir,{recursive:true});
const parts=[],models=[],align=x=>Math.ceil(x/4)*4;
let length=0;
function push(name,data,fields){
 const buf=Buffer.from(data.buffer,data.byteOffset,data.byteLength);
 const padded=align(length)-length;if(padded){parts.push(Buffer.alloc(padded));length+=padded;}
 fields[name]={offset:length,length:buf.byteLength};
 parts.push(buf);length+=buf.byteLength;
}
for(const asset of UNSUNG_ORIGINAL_ASSETS){
 const builder=new MeshBuilder();buildUnsungOriginal(asset.id,builder,{kit,arch});
 if(builder.triCount<12)throw Error(asset.id+' has no authentic Unsung geometry');
 const geo=builder.build(),positions=geo.getAttribute('position').array,normals=geo.getAttribute('normal').array,rawM=geo.getAttribute('aMat').array;
 const values=Uint8Array.from(rawM,n=>Math.max(0,Math.min(7,Math.round(n))));
 const indices=Uint32Array.from(geo.index.array);
 const box=geo.boundingBox,center=[(box.min.x+box.max.x)*.5,box.min.y,(box.min.z+box.max.z)*.5];
 const fields={};
 push('position',positions,fields);push('normal',normals,fields);
 push('material',values,fields);push('index',indices,fields);
 models.push({...asset,fields,vertices:positions.length/3,triangles:indices.length/3,
  box:{min:box.min.toArray(),max:box.max.toArray(),center},
  actualSize:[box.max.x-box.min.x,box.max.y-box.min.y,box.max.z-box.min.z]});
 geo.dispose();
}
const meta={schema:1,license:'MIT',source:'Exact procedural functions in Unsung Vale src/world/arch/kit.js',
 sourceNote:'Original MeshBuilder output; editor uses a lightweight color palette, playable RPG uses original Unsung material shader',
 models,byteLength:length};
fs.writeFileSync(path.join(dir,'unsung-original-prefabs.json'),JSON.stringify(meta));
fs.writeFileSync(path.join(dir,'unsung-original-prefabs.bin'),Buffer.concat(parts,length));
console.log('[P530 AUTHENTIC UNSUNG CATALOG]',models.length,'reusable native models,',
 models.reduce((sum,m)=>sum+m.triangles,0),'original triangles',length,'bytes');
