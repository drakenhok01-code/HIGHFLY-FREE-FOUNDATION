/** HIGHFLY P522 - exact native world reference export.
 * Runs in pinned MIT Unsung checkout AFTER npm ci, BEFORE vite build.
 * Calls original Architecture.buildPlayable / buildFarCities and actual
 * Forest.prototype.populate with ORIGINAL paths, clearings & special trees.
 * Zero WebGL, GPU shadow/reflection baking, particles, combat, or terrain edits.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as THREE from 'three';
import {Architecture} from '../src/world/arch/sites.js';
import {Forest} from '../src/world/flora/forest.js';
import {WORLD,POOLS,buildMesas} from '../src/world/layout.js';

const root=process.cwd(), dir=path.join(root,'public','highfly');
fs.mkdirSync(dir,{recursive:true});
const meta=JSON.parse(fs.readFileSync(path.join(root,'public/world/world.json'),'utf8'));
function readGrid(name,m){
 const raw=zlib.gunzipSync(fs.readFileSync(path.join(root,'public/world',name)));
 if(raw.byteLength!==m.res*m.res*2)throw Error(name+' expected '+(m.res*m.res*2)+' bytes; got '+raw.byteLength);
 const a=new Float32Array(m.res*m.res),v=new DataView(raw.buffer,raw.byteOffset,raw.byteLength),k=(m.max-m.min)/65535;
 for(let i=0;i<a.length;i++)a[i]=m.min+v.getUint16(i*2,true)*k;
 return a;
}
const core=readGrid('core_h.bin',meta.core),region=readGrid('region_h.bin',meta.region);
function sample(data,m,x,z){
 const fx=(x/m.size+.5)*m.res-.5,fz=(z/m.size+.5)*m.res-.5;
 const ix=Math.max(0,Math.min(m.res-2,Math.floor(fx))),iz=Math.max(0,Math.min(m.res-2,Math.floor(fz)));
 const tx=Math.max(0,Math.min(1,fx-ix)),tz=Math.max(0,Math.min(1,fz-iz)),o=iz*m.res+ix;
 return (data[o]*(1-tx)+data[o+1]*tx)*(1-tz)+(data[o+m.res]*(1-tx)+data[o+m.res+1]*tx)*tz;
}
function heightAt(x,z){
 const e=Math.max(Math.abs(x),Math.abs(z))/(meta.core.size*.5);
 const hr=e<.9?0:sample(region,meta.region,x,z);
 if(e>=.985)return hr;
 const hc=sample(core,meta.core,x,z);
 if(e<=.9)return hc;
 const t=(e-.9)/.085,w=1-t*t*(3-2*t);
 return hr+(hc-hr)*w;
}
const tris=[];
const exactArchitectureMeshes=[];
let sitesMeshCount=0;
const architecture=Object.create(Architecture.prototype);
architecture.terrain={heightAt};
architecture.mesas=buildMesas();
architecture.quarters=[];
architecture.farSolids=[];
architecture.stats={meshes:0,tris:0};
architecture.material={uniforms:{uPlazas:{value:Array.from({length:20},()=>({set(){}}))}}};
architecture.add=function(builder){
 sitesMeshCount++;
 const geometry=builder.build();
 const p=geometry.attributes.position.array,n=geometry.attributes.normal.array,m=geometry.attributes.aMat.array,ii=geometry.index.array;
 // Original, unmodified MeshBuilder vertices/normals/material indices and faces.
 // Used in WORLD FORGE 3D only, without initiating expensive Unsung shaders.
 exactArchitectureMeshes.push({geometry});
 for(let k=0;k<ii.length;k+=3){
  const a=ii[k],b=ii[k+1],c=ii[k+2],ay=(n[a*3+1]+n[b*3+1]+n[c*3+1])/3;
  if(ay<.15)continue;
  const x0=p[a*3],z0=p[a*3+2],x1=p[b*3],z1=p[b*3+2],x2=p[c*3],z2=p[c*3+2];
  const area=Math.abs((x1-x0)*(z2-z0)-(x2-x0)*(z1-z0));
  if(area<.045)continue;
  const y=(p[a*3+1]+p[b*3+1]+p[c*3+1])/3;
  tris.push(x0,z0,x1,z1,x2,z2,y,m[a]);
 }
 return {geometry};
};
const source=fs.readFileSync(path.join(root,'src/main.js'),'utf8');
const startRoutes=source.indexOf('const routes = [');
const endRoutes=source.indexOf('];',startRoutes);
if(startRoutes<0||endRoutes<0)throw Error('Unsung original walking routes anchor missing');
const routeSource=source.slice(startRoutes+'const routes = '.length,endRoutes+1).replace(/\/\/[^\n]*/g,'').replace(/,\s*\]/g,']');
const routes=JSON.parse(routeSource);
architecture.buildFarCities();
const sites=architecture.buildPlayable();
const names=['ember','ember','ember','blossom','blossom','elder','elder','cypress','cypress','green','green','green'];
const forest={terrain:{heightAt},trees:[],variants:names.map(species=>({species})),_buildChunks(){}};
forest.populate=(...args)=>Forest.prototype.populate.apply(forest,args);
const begin=source.indexOf('const clear = [...POOLS.map');
const end=source.indexOf('forest.addGreatTree(',begin);
if(begin<0||end<0)throw Error('Unsung forest populate anchors missing');
// Original native source (commit pinned by HIGHFLY config) executes forest exclusion,
// sampling, procedural seed and hand-placed species. Not approximated random dots.
const nativeForestSource=source.slice(begin,end);
(new Function('POOLS','routes','sites','forest','hfWFClearTree',nativeForestSource))(POOLS,routes,sites,forest,()=>false);
const trees=forest.trees.map(t=>[
 +t.x.toFixed(2),+t.z.toFixed(2),+t.s.toFixed(3),t.v
]);
const overlay={
 schema:1,source:'Frozen MIT Unsung native architecture and forest instance generator',
 worldSeed:WORLD.seed,sourceCommit:process.env.HIGHFLY_UNSUNG_SHA||'pinned by HIGHFLY foundation.config.json',
 coreSize:meta.core.size,regionSize:meta.region.size,
 routes,
 pools:POOLS.map(p=>({id:p.id,x:p.x,z:p.z,r:p.r,level:p.level,out:p.out})),
 plazas:(sites.plazas||[]).map(p=>({x:p[0],z:p[1],r:p[2]})),
 floors:(sites.floors||[]).map(f=>({x:f.x,y:f.y,z:f.z,r:f.r||null,w:f.w||null,d:f.d||null,half:!!f.half})),
 outer:(sites.outer||[]).map(({id,x,z,r,away,style})=>({id,x,z,r,away,style})),
 lanterns:(sites.lanterns||[]).map(([x,y,z])=>({x,z})),
 spires:(sites.spires||[]).map(({id,x,z})=>({id,x,z})),
 spawn:{x:sites.spawn.x,z:sites.spawn.z},
 trees,
 structureTriangles:tris.length,
 structureMeshes:sitesMeshCount
};
const output=path.join(dir,'native-overview.json');
fs.writeFileSync(output,JSON.stringify(overlay));
const data=new Float32Array(tris);
fs.writeFileSync(path.join(dir,'native-architecture-triangles.bin'),Buffer.from(data.buffer));
// Native full 3D geometry streamed separately from CPU-only cartography.
// Each mesh retains its own bounding box so mobile can skip far meshes.
const parts=[],manifest={schema:1,source:'Exact original MIT Unsung MeshBuilder geometry (colors are lightweight editor approximations)',meshes:[],totalVertices:0,totalTriangles:0};
let bytes=0;
for(const {geometry} of exactArchitectureMeshes){
 const pos=geometry.attributes.position.array;
 const normals=geometry.attributes.normal.array;
 const mats=geometry.attributes.aMat.array;
 const index=geometry.index.array;
 const colors=Uint8Array.from(mats,x=>Math.max(0,Math.min(7,Math.round(x))));
 const indices=Uint32Array.from(index);
 const fields={};
 const chunks=[['position',Buffer.from(pos.buffer,pos.byteOffset,pos.byteLength)],
   ['normal',Buffer.from(normals.buffer,normals.byteOffset,normals.byteLength)],
   ['material',Buffer.from(colors.buffer,colors.byteOffset,colors.byteLength)],
   ['index',Buffer.from(indices.buffer,indices.byteOffset,indices.byteLength)]];
 for(const [name,chunk] of chunks){
  fields[name]={offset:bytes,length:chunk.byteLength};
  parts.push(chunk);bytes+=chunk.byteLength;
 }
 const box=geometry.boundingBox;
 manifest.meshes.push({
  vertices:pos.length/3,triangles:indices.length/3,
  bbox:[box.min.x,box.min.y,box.min.z,box.max.x,box.max.y,box.max.z],
  fields
 });
 manifest.totalVertices+=pos.length/3;manifest.totalTriangles+=indices.length/3;
}
manifest.byteLength=bytes;
fs.writeFileSync(path.join(dir,'native-architecture-3d.bin'),Buffer.concat(parts));
fs.writeFileSync(path.join(dir,'native-architecture-3d.json'),JSON.stringify(manifest));
console.log('[P525 FULL NATIVE 3D]',manifest.meshes.length,'exact meshes,',manifest.totalVertices,'vertices,',manifest.totalTriangles,'triangles,',bytes,'bytes');
console.log('[P522 NATIVE MAP]',{
 trees:trees.length,architectureMeshes:sitesMeshCount,projectedRoofTriangles:tris.length/8,
 routes:routes.length,plazas:overlay.plazas.length,pools:overlay.pools.length,
 outputBytes:fs.statSync(output).size
});
