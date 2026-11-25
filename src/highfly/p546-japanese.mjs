/* P546 Kagetsu: user-owned models loaded only from the original local ZIPs.
 * Measured GLB dimensions in metres. No binary assets in repository.
 */
import {validateSite} from './p544-guildhall-settlements.mjs';
import {candidateGrid,connectNativeRoad} from './p544-native-site-planner.mjs';
import {nativeTargets} from './p545-region-planner.mjs';
const C='LowPolyCastleTown_v1.0/GLB/',F='Feudal_Gardens_Props/';
const rows=[
 ['guild','shrine_hall',0,-10,4.4,5.2,0],['castle','castle_keep',0,-25,12,12,0],
 ['gate','torii_gate',0,21,5.4,.5,0],['shrine','pagoda',17,-18,4.8,4.8,0],
 ['store','storehouse_kura',-17,-18,5.6,4.73,0],
 ...[-17,17].flatMap(x=>[-5,8,20].map(z=>['house','machiya_house',x,z,8.8,9,x>0?-Math.PI/2:Math.PI/2])),
 ...[-5,5].flatMap(x=>[5,12].map(z=>['market','shop_stall',x,z,2.6,1.67,x>0?-Math.PI/2:Math.PI/2])),
 ['well','wooden_well',-6,-2,1.8,1.8,0],['garden','cherry_tree',8,-15,3.22,2.44,0],
 ['garden','cherry_tree',-8,-15,3.22,2.44,0],['garden','cherry_tree',8,19,3.22,2.44,0],['garden','cherry_tree',-8,19,3.22,2.44,0],
 ...[-3.5,3.5].flatMap(x=>[-6,0,7,16].map(z=>['lantern','stone_lantern',x,z,.78,.78,0])),
 ['market','rice_sacks',-7,5,1.14,.43,0],['market','sake_barrel',7,12,1,1.04,0],
 ['market','rickshaw',-7,14,1.26,2.42,0],
 ['shrine','statues_graves/ornament_kitsune',-3,-7,.6,.74,0],
 ['shrine','statues_graves/ornament_kitsune',3,-7,.6,.74,0],
 ['market','village_goods/sign_kosatsu',-5,17,1.1,.65,0],
 ['market','village_goods/farm_tawara',-7,9,1.2,.8,0],
 ['garden','lamps_lanterns/lantern_kasuga',10,-12,1.04,.93,0],
 ['garden','lamps_lanterns/lantern_kasuga',-10,-12,1.04,.93,0]
];
export const JAPAN_FILES=[...new Set(rows.map(r=>(r[1].includes('/')?F:C)+r[1]+'.glb'))];
export function planKagetsu({overview,sampleTerrain,isOccupied,existing=[]}){
 const hint={x:270,z:385},anchors=candidateGrid(overview,{step:12,limit:8000,prefer:hint,extent:980});
 const occupied=(x,z)=>isOccupied(x,z)||existing.some(p=>x>p.bounds.minX-8&&x<p.bounds.maxX+8&&z>p.bounds.minZ-8&&z<p.bounds.maxZ+8);
 let partial=null;
 for(const anchor of anchors){for(const yaw of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
  const world=(x,z)=>({x:anchor.x+x*Math.cos(yaw)+z*Math.sin(yaw),z:anchor.z-x*Math.sin(yaw)+z*Math.cos(yaw)});
  const lots=[],objects=[],roads=[],all=[];
  for(let i=0;i<rows.length;i++){const [role,name,x,z,w,d,turn]=rows[i],id='japonesa-'+i,c=world(x,z),rot=yaw+turn,rr=(a,b)=>({x:c.x+a*Math.cos(rot)+b*Math.sin(rot),z:c.z-a*Math.sin(rot)+b*Math.cos(rot)});
   const corners=[rr(-w/2,-d/2),rr(-w/2,d/2),rr(w/2,-d/2),rr(w/2,d/2)];all.push(...corners);lots.push({id,role:role==='guild'?'guild':'lot',tile:name,ground:'grass',corners,coastal:false});
   objects.push({id:id+'-0',lot:id,sourceId:'private-japan/'+name,privateFile:(name.includes('/')?F:C)+name+'.glb',...c,yOffset:0,yaw:rot,scale:1,surface:'land',license:'user-owned project-use; no asset redistribution'});
  }
  roads.push({id:'japonesa-main',material:'unsung-stone',width:4,points:[world(0,27),world(0,-6)]});
  for(const z of [-5,8,20])roads.push({id:'japonesa-res-'+z,material:'unsung-stone',width:3,points:[world(-11,z),world(11,z)]});
  const bounds={minX:Math.min(...all.map(p=>p.x)),maxX:Math.max(...all.map(p=>p.x)),minZ:Math.min(...all.map(p=>p.z)),maxZ:Math.max(...all.map(p=>p.z))};
  if(Math.max(...Object.values(bounds).map(Math.abs))>1015)continue;
  const plan={ok:true,id:'japonesa',name:'Kagetsu · Villa japonesa',anchor,yaw,metersPerUnit:1,lots,objects,roads,floraHints:[],blockers:[],pending:['Cargar los dos ZIP originales localmente','Verificar puertas y colisiones en el juego'],bounds,npc:[],quests:[],privateModels:true};
  if(!validateSite(plan,{sampleTerrain,isOccupied:occupied,step:2,maxLotRelief:1.1,maxRoadGrade:.22}).ok)continue;
  const link=connectNativeRoad(roads[0].points[0],nativeTargets(overview).concat(existing.flatMap(p=>p.connector?.points??[])).filter(p=>Math.hypot(p.x-anchor.x,p.z-anchor.z)<400),{sampleTerrain,isOccupied:occupied,maxNodes:8000,step:5});
  if(link){plan.connector={id:'japonesa-link',material:'unsung-dirt',width:3.2,points:link};plan.regionStatus='site-and-road-validated';return plan;}
  if(!partial){plan.regionStatus='partial-preview';partial=plan;}
 }}
 return partial??{ok:false,id:'japonesa',reason:'No terrain compatible with measured Japanese footprints'};
}
// ZIP reader: no uploads, accepts only original named model entries. Browser's
// native deflate-raw, no dependency; CRC checked by zip original asset provenance outside app.
export async function localJapanFiles(files){
 const need=new Set(JAPAN_FILES),out=new Map(),decoder=new TextDecoder();
 for(const file of files){
  const bytes=new Uint8Array(await file.arrayBuffer()),v=new DataView(bytes.buffer);
  let e=bytes.length-22;while(e>=Math.max(0,bytes.length-65557)&&v.getUint32(e,true)!==0x06054b50)e--;
  if(e<0||v.getUint32(e,true)!==0x06054b50)throw Error('ZIP central directory missing');
  let off=v.getUint32(e+16,true),count=v.getUint16(e+10,true);
  for(let n=0;n<count;n++){
   if(v.getUint32(off,true)!==0x02014b50)throw Error('Bad ZIP directory');
   const flags=v.getUint16(off+8,true),method=v.getUint16(off+10,true),packed=v.getUint32(off+20,true),size=v.getUint32(off+24,true),nl=v.getUint16(off+28,true),ex=v.getUint16(off+30,true),co=v.getUint16(off+32,true),local=v.getUint32(off+42,true);
   const name=decoder.decode(bytes.slice(off+46,off+46+nl));off+=46+nl+ex+co;
   if(!need.has(name))continue;
   if(flags&1||size>8000000||v.getUint32(local,true)!==0x04034b50)throw Error('Unsupported ZIP entry '+name);
   const start=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true),raw=bytes.slice(start,start+packed);
   let b;if(method===0)b=raw;else if(method===8)b=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());else throw Error('Compression unsupported');
   if(b.length!==size||new DataView(b.buffer).getUint32(0,true)!==0x46546c67)throw Error('Invalid GLB '+name);
   out.set(name,b.buffer);
  }
 }
 const missing=[...need].filter(n=>!out.has(n));if(missing.length)throw Error('Faltan '+missing.length+' modelos: cargá ambos ZIP originales.');
 return out;
}
