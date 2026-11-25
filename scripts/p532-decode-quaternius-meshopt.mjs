/** Decode EXT_meshopt_compression for actual GLB thumbnail geometry.
 * IMPORTANT: the *public* shipped GLBs stay the exact original hash-validated
 * Quaternius CC0 files; only temporary thumbnail input gets decoded.
 * This is necessary because their GLB bufferViews are intentionally compressed.
 */
import fs from 'node:fs';
import path from 'node:path';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {QUATERNIUS_CC0_ALL} from '../src/highfly/p532-quaternius-cc0-catalog.mjs';

const SRC=path.join(process.cwd(),'public/highfly/quaternius-cc0'),
 TEMP=path.join(process.cwd(),'tools/p532-decoded-quaternius');
await MeshoptDecoder.ready;
const pad=(n)=>((n+3)&~3);
function parse(buf){
 if(buf.toString('ascii',0,4)!=='glTF'||buf.readUInt32LE(4)!==2)throw Error('Invalid GLB');
 const chunks=[];for(let o=12;o+8<=buf.length;){
  const n=buf.readUInt32LE(o),type=buf.readUInt32LE(o+4);o+=8;
  chunks.push({type,bytes:buf.subarray(o,o+n)});o+=n;
 }
 const json=chunks.find(x=>x.type===0x4e4f534a),binary=chunks.find(x=>x.type===0x004e4942);
 if(!json||!binary)throw Error('Incomplete GLB');
 return {document:JSON.parse(json.bytes.toString('utf8').replace(/\0+$/,'')),binary:binary.bytes};
}
function assemble(doc,binary){
 const json=Buffer.from(JSON.stringify(doc));
 const jl=pad(json.length),bl=pad(binary.length),out=Buffer.alloc(12+8+jl+8+bl);
 out.write('glTF',0,'ascii');out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);
 out.writeUInt32LE(jl,12);out.writeUInt32LE(0x4e4f534a,16);
 json.copy(out,20);out.fill(0x20,20+json.length,20+jl);
 const offset=20+jl;out.writeUInt32LE(bl,offset);out.writeUInt32LE(0x004e4942,offset+4);
 binary.copy(out,offset+8);return out;
}
let compressed=0;
for(const a of QUATERNIUS_CC0_ALL){
 const relative=a.freePath.replace(/^quaternius-cc0\//,''),original=fs.readFileSync(path.join(SRC,relative));
 const {document:d,binary}=parse(original);
 const buffers=[];let cursor=0,number=0;
 for(const view of d.bufferViews||[]){
  const ext=view.extensions?.EXT_meshopt_compression;let raw;
  if(ext){
   const from=binary.subarray(ext.byteOffset||0,(ext.byteOffset||0)+ext.byteLength);
   raw=Buffer.from(await MeshoptDecoder.decodeGltfBufferAsync(ext.count,ext.byteStride,from,ext.mode,ext.filter));
   number++;
   view.byteStride=ext.byteStride;
   delete view.extensions.EXT_meshopt_compression;
   if(!Object.keys(view.extensions).length)delete view.extensions;
  }else{
   raw=Buffer.from(binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength));
  }
  const aligned=pad(cursor);if(aligned>cursor){buffers.push(Buffer.alloc(aligned-cursor));cursor=aligned;}
  view.byteOffset=cursor;view.byteLength=raw.length;view.buffer=0;
  buffers.push(raw);cursor+=raw.length;
 }
 const out=Buffer.concat(buffers);
 d.buffers=[{byteLength:out.length}];
 d.extensionsUsed=(d.extensionsUsed||[]).filter(v=>v!=='EXT_meshopt_compression');
 d.extensionsRequired=(d.extensionsRequired||[]).filter(v=>v!=='EXT_meshopt_compression');
 const destination=path.join(TEMP,relative);
 fs.mkdirSync(path.dirname(destination),{recursive:true});
 fs.writeFileSync(destination,assemble(d,out));compressed+=number;
}
if(compressed<20)throw Error('Quaternius sources did not have expected meshopt-compressed bufferViews: '+compressed);
console.log('[P532 DECODE GLB FOR THUMBNAILS]',QUATERNIUS_CC0_ALL.length,'original CC0 files,',compressed,'decoded meshopt bufferViews in ephemeral build folder; shipping GLBs unchanged');
