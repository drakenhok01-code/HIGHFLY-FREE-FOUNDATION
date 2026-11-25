/* P545: native geography search priorities, coastal separation and verified preview plans. */
import {SOURCE_TILES,SETTLEMENTS} from './p544-guildhall-settlements.mjs';
import {SCALE_REFERENCE,findSettlementSite,candidateGrid,connectNativeRoad} from './p544-native-site-planner.mjs';
export const REGION_HINTS={arvelia:{x:-519,z:-70},pesquero:{x:1114.7,z:438.2},puerto:{x:1011.1,z:-228.6},agricola:{x:-700,z:-310},forestal:{x:-700,z:360},minero:{x:520,z:570},artesanal:{x:-360,z:-400},arcano:{x:60,z:-400},fortaleza:{x:560,z:-440},ruinas:{x:-820,z:500},santuario:{x:136,z:546},cazadores:{x:-390,z:420},montana:{x:500,z:440},frontera:{x:-900,z:-150}};
const hypot=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),inside=(p,x,z,pad=0)=>x>p.bounds.minX-pad&&x<p.bounds.maxX+pad&&z>p.bounds.minZ-pad&&z<p.bounds.maxZ+pad;
export function nativeTargets(overview){return (overview.routes??[]).flatMap(line=>line.flatMap(([x,z],i)=>{if(!i)return [{x,z}];const [a,b]=line[i-1],n=Math.max(1,Math.ceil(Math.hypot(x-a,z-b)/5));return Array.from({length:n},(_,j)=>({x:a+(x-a)*(j+1)/n,z:b+(z-b)*(j+1)/n}))}))}
export function searchRegion(id,{overview,assetLookup,sampleTerrain,isOccupied,existing=[],prefer=REGION_HINTS[id]}){
 const theme=SETTLEMENTS.find(p=>p.id===id);if(!theme||id==='japonesa')return {ok:false,id,reason:'reserved theme'};
 const coastal=theme.coastal,extent=coastal?1360:1015;
 const grid=candidateGrid(overview,{step:coastal?12:16,limit:14000,prefer,extent:coastal?1300:980});
 // Keep search local to preferred coastal areas; on land rank by requested regional theme, allow fallback.
 let anchors=coastal?grid.filter(p=>hypot(p,prefer)<270&&sampleTerrain(p.x,p.z).height<32):grid;
 const plan=findSettlementSite(id,{assetLookup,sampleTerrain,isOccupied,anchors,existing,maxCandidates:coastal?18000:28000,landOnly:coastal,maxExtent:extent});
 if(!plan.ok)return plan;
 const targets=nativeTargets(overview).concat(existing.flatMap(p=>p.connector?.points??[]));
 const occupied=(x,z)=>isOccupied(x,z)||existing.some(p=>inside(p,x,z))||plan.lots.some(l=>{const xs=l.corners.map(p=>p.x),zs=l.corners.map(p=>p.z);return x>Math.min(...xs)&&x<Math.max(...xs)&&z>Math.min(...zs)&&z<Math.max(...zs)});
 for(const start of [plan.roads[0].points[0],plan.roads[0].points.at(-1)]){
  const link=connectNativeRoad(start,targets,{sampleTerrain,isOccupied:occupied,maxNodes:60000,maxExtent:extent});
  if(link){plan.connector={id:id+'-native-link',material:'unsung-dirt',width:3.2,points:link};break}
 }
 if(!plan.connector)return {...plan,ok:false,reason:'parcela encontrada; sin ruta validada al camino nativo'};
 if(coastal){
  const docks=attachDock(plan,{sampleTerrain,isOccupied,assetLookup,occupied,maxExtent:extent});
  if(!docks)return {...plan,ok:false,reason:'parcela terrestre localizada; falta muelle y acceso seguro'};
  plan.objects.push(...docks.objects);plan.roads.push(docks.road);
  plan.dock=docks.meta;
  plan.pending.push('Completar muelles adicionales y validar colisiones de cubierta; no se importó el hexágono ni el puerto prefabricado entero.');
 }
 return plan;
}
function attachDock(plan,{sampleTerrain,isOccupied,assetLookup,occupied,maxExtent}){
 const S=SCALE_REFERENCE.factor,tile=SOURCE_TILES.find(t=>t.id===(plan.id==='puerto'?'dock-ship':'dock-boats'));
 if(!tile)return null;
 const mid={x:(plan.bounds.minX+plan.bounds.maxX)/2,z:(plan.bounds.minZ+plan.bounds.maxZ)/2},candidates=[];
 const targets=[plan.roads[0].points[0],plan.roads[0].points.at(-1),...plan.connector.points];
 for(let x=mid.x-130;x<=mid.x+130;x+=3)for(let z=mid.z-130;z<=mid.z+130;z+=3){const p={x,z};if(Math.max(Math.abs(x),Math.abs(z))>maxExtent-8||hypot(p,mid)>130||inside(plan,x,z,3)||isOccupied(x,z))continue;const h=sampleTerrain(x,z);if(h.water||h.height-h.waterHeight>2.2)continue;
 for(let i=0;i<16;i++){const yaw=i*Math.PI/8,dx=Math.sin(yaw),dz=Math.cos(yaw),at=(a,b)=>({x:x+Math.cos(yaw)*a*S+Math.sin(yaw)*b*S,z:z-Math.sin(yaw)*a*S+Math.cos(yaw)*b*S});
 // Positive local z is the shore-side end of these dock compositions.
 const center={x:x-dx*3.2*S,z:z-dz*3.2*S};const land={x:x+dx*1.6,z:z+dz*1.6};if(sampleTerrain(land.x,land.z).water||occupied(land.x,land.z))continue;
 const objs=[];let ok=true;for(let k=0;k<tile.pieces.length;k++){const q=tile.pieces[k],a=assetLookup(q.piece);if(!a){ok=false;break}const pos=at(q.x,q.z-3.2),h=sampleTerrain(pos.x,pos.z);const boat=/boat|ship|canoe/.test(q.piece);if((boat&&!h.water)||isOccupied(pos.x,pos.z)){ok=false;break}objs.push({id:plan.id+'-dock-'+k,lot:plan.id+'-dock',sourceId:q.piece,model:a.uri,license:a.license,...pos,yOffset:(q.y??0)*S,y:h.waterHeight+(q.y??0)*S,yaw:q.rot+yaw,tilt:q.tilt??null,scale:q.scale*S,swatchMap:q.swatchMap??null,sourceTransform:q,surface:boat?'water':'shore'});}
 if(ok&&sampleTerrain(center.x,center.z).water)candidates.push({land,center,objs,score:hypot(land,mid)});
 }}
 candidates.sort((a,b)=>a.score-b.score);
 for(const c of candidates.slice(0,40)){const route=connectNativeRoad(c.land,targets,{sampleTerrain,isOccupied:occupied,maxNodes:15000,maxExtent});if(route)return {objects:c.objs,road:{id:plan.id+'-dock-access',material:'unsung-dirt',width:3.2,points:route},meta:{x:c.center.x,z:c.center.z,land:c.land,tile:tile.id}}}
 return null;
}
