/* P544 bridge for the native Unsung editor. No schema-1 lossy conversion.
 * The renderer must supply verified GLBs, native terrain + water sampler, and native occupancy.
 * Draft plan does not mutate terrain, inventory, NPC or main game.
 */
import {buildSettlement,validateSite,calibrateScale,SETTLEMENTS} from './p544-guildhall-settlements.mjs';
export function verifiedAssetLookup(audit,baseURL){
 if(audit?.schema!=='hf-guildhall-assets-v1'||!Array.isArray(audit.assets))throw Error('Invalid asset audit');
 const map=new Map();
 for(const a of audit.assets){
  if(a.uri!=='pieces/'+a.sourceId+'.glb'||!/^([a-z0-9-]+)\/([a-z0-9-]+)$/.test(a.sourceId)||!a.hash)throw Error('Invalid asset reference');
  map.set(a.sourceId,{...a,uri:new URL(a.uri,baseURL).href});
 }
 return id=>map.get(id);
}
export function prepareSettlement({id,audit,baseURL,calibration,anchor,yaw=0,seed=7,sampleTerrain,isOccupied,gapMeters=2.5,roadWidth=3.5}){
 if(typeof sampleTerrain!=='function'||typeof isOccupied!=='function')throw Error('Native height/water and occupancy callbacks required');
 const assetLookup=verifiedAssetLookup(audit,baseURL);
 const metersPerUnit=calibrateScale(calibration);
 const plan=buildSettlement(id,{assetLookup,metersPerUnit,anchor,yaw,seed,gapMeters,roadWidth});
 if(!plan.ok)return plan;
 const checked=validateSite(plan,{sampleTerrain,isOccupied});
 if(!checked.ok)return {ok:false,id,issues:checked.issues,reason:'Unsafe native terrain; no objects written'};
 const lots=new Map(plan.lots.map(l=>[l.id,l]));
 const terrain=(x,z)=>{const t=sampleTerrain(x,z);if(!t||!Number.isFinite(t.height))throw Error('Missing height data');return t};
 const objects=[];
 // Stacked objects must retain a shared lot datum, not resample ground individually.
 const datum=new Map();
 for(const l of plan.lots){
  const x=l.corners.reduce((n,p)=>n+p.x,0)/4,z=l.corners.reduce((n,p)=>n+p.z,0)/4;
  datum.set(l.id,terrain(x,z).height);
 }
 for(const o of plan.objects){
  const a=assetLookup(o.sourceId),t=terrain(o.x,o.z);
  const stacked=Math.abs(o.yOffset)>1e-6||o.tilt!==null;
  if(stacked&&lots.get(o.lot).coastal)throw Error('Coastal stack requires explicit quay/sea support datum');
  const base=o.surface==='water'?t.waterHeight:o.surface==='shore'?t.deckHeight:stacked?datum.get(o.lot):t.height;
  if(!Number.isFinite(base))throw Error('Native water/deck support missing for '+o.sourceId);
  objects.push({...o,y:base+o.yOffset,width:a.width*o.scale,depth:a.depth*o.scale,height:a.height*o.scale});
 }
 return {...plan,objects,siteValidation:checked,calibration,readyForPreview:true,readyForGame:false,notice:'Native paths, exact color swatches, stacked support, door access and collision meshes still require runtime QA'};
}
// Rasterize dirt paths directly into the existing Unsung path mask. Never replace the old path pixels.
// Stone paths remain a separate native paving layer, not a dirt substitution.
export function mergeDirtPathMask(original,roads,{resolution=1024,worldSize=2048}={}){
 if(!(original instanceof Uint8Array)||original.length!==resolution*resolution||!Number.isFinite(worldSize)||worldSize<=0)throw Error('Invalid native path mask');
 const output=new Uint8Array(original),toP=n=>(n/worldSize+.5)*resolution;
 for(const road of roads){
  if(road.material!=='unsung-dirt')continue;
  const radius=road.width*resolution/worldSize/2;
  if(!(radius>0)||!Array.isArray(road.points)||road.points.length<2)throw Error('Invalid road');
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i],ax=toP(a.x),az=toP(a.z),bx=toP(b.x),bz=toP(b.z);
   if(![ax,az,bx,bz].every(Number.isFinite)||[ax,az,bx,bz].some(v=>v<radius||v>resolution-radius))throw Error('Road outside native path mask; use region-specific mask');
   const dx=bx-ax,dz=bz-az,d2=dx*dx+dz*dz;
   for(let z=Math.max(0,Math.floor(Math.min(az,bz)-radius-1));z<=Math.min(resolution-1,Math.ceil(Math.max(az,bz)+radius+1));z++)
    for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-radius-1));x<=Math.min(resolution-1,Math.ceil(Math.max(ax,bx)+radius+1));x++){
     const t=d2?Math.max(0,Math.min(1,((x+.5-ax)*dx+(z+.5-az)*dz)/d2)):0;
     const d=Math.hypot(x+.5-ax-dx*t,z+.5-az-dz*t);
     const v=Math.round(255*Math.max(0,Math.min(1,radius+.5-d)));
     const k=z*resolution+x;output[k]=Math.max(output[k],v);
    }
  }
 }
 return output;
}
// Explicitly versioned JSON for copy/paste between the standalone generator and World Forge.
export function serializeDraft(plan){
 if(!plan?.ok||!plan.readyForPreview||plan.readyForGame!==false)throw Error('Only validated draft plans can be exported');
 return JSON.stringify({schema:'hf-settlement-transfer-v1',world:'unsung-vale',plan},null,2);
}
export function readDraft(text){
 const d=JSON.parse(text);
 if(d?.schema!=='hf-settlement-transfer-v1'||d.world!=='unsung-vale'||!SETTLEMENTS.some(x=>x.id===d.plan?.id))throw Error('Unsupported settlement transfer');
 // Never trust imported coordinates or audit; regenerate and validate against current terrain.
 return {id:d.plan.id,anchor:d.plan.anchor,yaw:d.plan.yaw,seed:d.plan.seed,calibration:d.plan.calibration};
}
