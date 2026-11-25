/* P544: local KayKit SOURCE compatibility bridge.
 * No model binaries or ZIPs are uploaded. Raw SOURCE models are NOT the
 * recolored/normalized Guildhall GLBs. Exact names are candidates, not proof
 * of equal geometry, pivot, or palette. Never silently use a near match.
 */
import {ASSET_REQUIREMENTS} from './p544-guildhall-settlements.mjs';
import {loadPrivateSourceCatalog,readPrivateSourceGLB,importPrivateSourcePack} from './p529-private-source-import.mjs';
const PREFIX={'kaykit-hexagon':'medieval','kaykit-forest':'forest','kaykit-dungeon':'dungeon','kaykit-halloween':'halloween','kaykit-resources':'resources','kaykit-tools':'tools','kaykit-adventurers':'adventurers','kaykit-weapons':'weapons'};
export function sourceCandidateId(id){
 const [pack,slug,...rest]=String(id).split('/');
 if(rest.length||!PREFIX[pack]||!slug||!/^[a-z0-9-]+$/.test(slug))return null;
 return 'source-'+PREFIX[pack]+'-'+slug;
}
export function auditPrivateSource(catalog=loadPrivateSourceCatalog()){
 const byId=new Map(catalog.map(x=>[x.id,x]));
 const report=ASSET_REQUIREMENTS.map(sourceId=>{
  const candidate=sourceCandidateId(sourceId),local=candidate?byId.get(candidate):null;
  const status=!candidate?'external-pack':!local?'missing-private':'needs-geometry-pivot-palette-check';
  return {sourceId,candidate,localId:local?.id??null,status};
 });
 return {required:report.length,matched:report.filter(x=>x.localId).length,external:report.filter(x=>x.status==='external-pack').length,missing:report.filter(x=>x.status==='missing-private').length,report,readyForGame:false};
}
export async function importAndAuditPrivateSource(file,progress){
 const catalog=await importPrivateSourcePack(file,progress);
 return auditPrivateSource(catalog);
}
export async function readCandidate(sourceId,report=auditPrivateSource()){
 const row=report.report.find(x=>x.sourceId===sourceId);
 if(!row?.localId)throw Error('No exact-name SOURCE candidate: '+sourceId);
 const bytes=await readPrivateSourceGLB(row.localId);
 if(bytes.byteLength<20||new DataView(bytes).getUint32(0,true)!==0x46546c67)throw Error('Invalid local GLB');
 return {sourceId,localId:row.localId,bytes,requiresNormalization:true};
}
// Geometry measurements must be provided by actual GLTFLoader/Box3, not the
// approximate width/height fields of the old SOURCE editor manifest.
export function compareCandidateGeometry(rawSize,normalizedSize,{tolerance=.03}={}){
 if(![rawSize,normalizedSize].every(a=>Array.isArray(a)&&a.length===3&&a.every(n=>Number.isFinite(n)&&n>0)))throw Error('Measured dimensions required');
 const ratios=normalizedSize.map((n,i)=>n/rawSize[i]),scale=ratios.reduce((a,b)=>a+b,0)/3;
 const consistent=ratios.every(n=>Math.abs(n/scale-1)<=tolerance);
 return {consistent,scale,ratios,requiresPivotAndPaletteVerification:true};
}
