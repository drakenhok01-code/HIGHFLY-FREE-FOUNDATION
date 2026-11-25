/* HIGHFLY P5.4.4: settlement design + lossless source importer core.
 * Guildhall source compositions copyright Codestz, MIT; see docs/licenses/GUILDHALL-MIT.txt.
 * Upstream declares art CC0; verify each exact model before publishing.
 * This is not a runtime or editor integration. No NPCs or quests instantiated.
 */
import catalogA from './guildhall-p544/catalog-a.mjs';
import catalogB from './guildhall-p544/catalog-b.mjs';
import catalogC from './guildhall-p544/catalog-c.mjs';
import catalogD from './guildhall-p544/catalog-d.mjs';
import catalogE from './guildhall-p544/catalog-e.mjs';
import catalogF from './guildhall-p544/catalog-f.mjs';
export const SOURCE_TILES = [catalogA,catalogB,catalogC,catalogD,catalogE,catalogF].flat();
if(SOURCE_TILES.length!==83||new Set(SOURCE_TILES.map(t=>t.id)).size!==83)throw Error('Incomplete Guildhall catalog');
export const SOURCE_PROVENANCE = Object.fromEntries(SOURCE_TILES.map(t=>[t.id,{repository:'Codestz/guildhall',path:t.sourcePath,blob:t.sourceBlob}]));
export const SETTLEMENTS = [
 {
  "id": "arvelia",
  "name": "Ciudad de los Inicios",
  "terrain": "plaza/llanura",
  "parts": [
   "town-hall-plaza",
   "market-square",
   "tavern-yard",
   "townhouse-shop",
   "house-pair",
   "house-porch",
   "smithy-works",
   "market",
   "cottage-garden",
   "well-square",
   "townhouse-corner",
   "house-pair"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "muralla perimetral",
   "portones",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-stone",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "pesquero",
  "name": "Pueblo pesquero",
  "terrain": "orilla de lago",
  "parts": [
   "town-hall-plaza",
   "boathouse",
   "house-pair",
   "warehouse",
   "market-stalls",
   "tavern-garden",
   "cottage",
   "storehouse",
   "dock-boats",
   "quay"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "alinear muelles y botes a costa real",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": true,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "agricola",
  "name": "Aldea agrícola",
  "terrain": "pradera llana",
  "parts": [
   "town-hall-plaza",
   "farmstead-yard",
   "wheat-field",
   "wheat-field",
   "field",
   "pasture",
   "windmill",
   "farmstead",
   "homestead",
   "cottage-veg",
   "orchard",
   "market"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "forestal",
  "name": "Aldea forestal",
  "terrain": "claro de bosque",
  "parts": [
   "town-hall-plaza",
   "lumber",
   "cottage-garden",
   "warehouse",
   "hunter",
   "house-pair",
   "campsite",
   "storehouse",
   "lumber",
   "tavern"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "troncos y tala",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "minero",
  "name": "Pueblo minero",
  "terrain": "ladera rocosa",
  "parts": [
   "town-hall-plaza",
   "mine",
   "smithy-works",
   "warehouse",
   "storehouse",
   "house-pair",
   "rocky",
   "smithy-yard",
   "tavern"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "conectar minas a roca existente",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "artesanal",
  "name": "Pueblo artesanal",
  "terrain": "meseta suave",
  "parts": [
   "town-hall-plaza",
   "market",
   "smithy-works",
   "townhouse-shop",
   "market-stalls",
   "house-pair",
   "storehouse",
   "warehouse",
   "market-carts",
   "tavern-garden"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "talleres de textiles y cuero",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-stone",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "arcano",
  "name": "Pueblo arcano",
  "terrain": "lago elevado/cascada",
  "parts": [
   "great-hall",
   "chapel",
   "cottage-garden",
   "monastery-compound",
   "well-square",
   "house-pair",
   "market-stalls"
  ],
  "guildTile": "great-hall",
  "pending": [
   "torres arcanas y cristales compatibles",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-stone",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "fortaleza",
  "name": "Fortaleza militar",
  "terrain": "meseta elevada",
  "parts": [
   "town-hall-plaza",
   "castle",
   "castle-tower",
   "castle-drill",
   "castle-stables",
   "castle-stores",
   "training-arena",
   "archery-range",
   "castle-well",
   "house-pair"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "murallas y portones continuos",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "ruinas",
  "name": "Aldea de ruinas",
  "terrain": "zona aislada",
  "parts": [
   "town-hall-plaza",
   "cottage",
   "ruins",
   "graveyard-yard",
   "ruins",
   "chapel",
   "campsite"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "gremio intacto en acceso seguro",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "puerto",
  "name": "Puerto comercial",
  "terrain": "costa amplia",
  "parts": [
   "town-hall-plaza",
   "boathouse",
   "warehouse",
   "storehouse",
   "market-carts",
   "tavern-garden",
   "house-pair",
   "lighthouse",
   "dock-ship",
   "dock-boats",
   "harbour-quay",
   "quay"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "alinear muelles y botes a costa real",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": true,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "santuario",
  "name": "Santuario",
  "terrain": "colina tranquila",
  "parts": [
   "town-hall-plaza",
   "monastery-compound",
   "orchard",
   "well-square",
   "cottage-garden",
   "chapel",
   "cottage",
   "house-pair"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "jardines y templo adicional",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-stone",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "cazadores",
  "name": "Campamento de cazadores",
  "terrain": "borde de bosque",
  "parts": [
   "town-hall-plaza",
   "hunter",
   "campsite",
   "archery-range",
   "cottage",
   "warehouse",
   "shepherd",
   "tavern"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "carpas y fogatas",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "montana",
  "name": "Villa de montaña",
  "terrain": "meseta alta",
  "parts": [
   "town-hall-plaza",
   "watchtower",
   "house-porch",
   "cottage",
   "house-pair",
   "smithy-yard",
   "storehouse",
   "well-square"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "escalones y terrazas naturales",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 },
 {
  "id": "japonesa",
  "name": "Villa japonesa",
  "terrain": "valle junto al agua",
  "parts": [
   "town-hall-plaza",
   "cottage-garden",
   "house-pair",
   "market-square",
   "chapel"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "BLOQUEANTE: sustituir arquitectura europea por edificios japoneses CC0/MIT, torii y puentes; gremio japonés propio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "blocked-theme-assets"
 },
 {
  "id": "frontera",
  "name": "Puesto fronterizo",
  "terrain": "cruce de caminos",
  "parts": [
   "town-hall-plaza",
   "fort-tower",
   "barracks",
   "storehouse",
   "campsite",
   "house-pair",
   "archery",
   "market-stalls"
  ],
  "guildTile": "town-hall-plaza",
  "pending": [
   "empalizada y puerta",
   "cartel de gremio"
  ],
  "roadMaterial": "unsung-dirt",
  "coastal": false,
  "status": "draft-needs-asset-calibration",
  "catalogVersion": "guildhall-83-pinned",
  "design": "P546 directed thematic zoning"
 }
];
const TILES=new Map(SOURCE_TILES.map(t=>[t.id,t]));
// Derived HIGHFLY composition: use the exact Guildhall wheat GLB, not corn substitutes.
const wheat=TILES.get('farmstead-yard').pieces.find(p=>/crops-wheat-stage-b$/.test(p.piece));
if(!wheat)throw Error('Source wheat missing');
TILES.set('wheat-field',{id:'wheat-field',name:'Campo de trigo',ground:'soil',pieces:Array.from({length:63},(_,i)=>({...wheat,x:(i%9-4)*.67,z:(Math.floor(i/9)-3)*.78,rot:0,y:0,scale:wheat.scale??.6})),blockers:[],spots:[]});
const COASTAL_TILES=new Set(['dock','dock-boats','dock-ship','harbour-quay','quay','quay-b','boathouse','lighthouse']);
const PRESETS=new Map(SETTLEMENTS.map(t=>[t.id,t]));
const finite=(...n)=>n.every(Number.isFinite);
const rot=(x,z,a)=>[x*Math.cos(a)+z*Math.sin(a),-x*Math.sin(a)+z*Math.cos(a)];
const isTerrain=id=>/(^|\/)(?:hex[-_](grass|water|coast|river|road)|ground[-_](river|water|path))([-_]|$)/i.test(id);
const isFlora=id=>/(?:^|\/)(?:tree[-_]|trees[-_]|bush[-_]|grass[-_])/i.test(id);
export const ASSET_REQUIREMENTS=[...new Set(SOURCE_TILES.flatMap(t=>t.pieces.map(p=>p.piece)))].sort();
export function auditAssets(assetLookup, presetId) {
 const p=PRESETS.get(presetId); if(!p)throw Error('unknown preset');
 const required=[...new Set(p.parts.flatMap(id=>TILES.get(id).pieces.map(x=>x.piece)))];
 return required.filter(id=>!isTerrain(id)&&!isFlora(id)).map(id=>{
 const a=assetLookup(id);
 return {id,ok:!!a&&a.sourceId===id&&['CC0','CC0-1.0','MIT','BSD-2-Clause','BSD-3-Clause','Apache-2.0'].includes(a.license)&&finite(a.width,a.depth,a.height)&&Math.min(a.width,a.depth,a.height)>0,asset:a||null};
 });
}
export function calibrateScale({sourceDoorHeight,unsungDoorHeight,sourceCharacterHeight,unsungCharacterHeight,tolerance=.15}) {
 if(!finite(sourceDoorHeight,unsungDoorHeight,sourceCharacterHeight,unsungCharacterHeight)||Math.min(sourceDoorHeight,unsungDoorHeight,sourceCharacterHeight,unsungCharacterHeight)<=0)throw Error('measure both door and character before scaling');
 const d=unsungDoorHeight/sourceDoorHeight,c=unsungCharacterHeight/sourceCharacterHeight;
 if(Math.abs(d/c-1)>tolerance)throw Error('door and character scale disagree; inspect model calibration');
 return (d+c)/2;
}
function pieceBounds(p,a) {
 // Conservative circular envelope covers rotation and optional tilted pieces; exact bounds can refine.
 const s=p.scale??1,r=Math.hypot(a.width,a.depth,p.tilt?a.height:0)*s/2;
 return [p.x-r,p.z-r,p.x+r,p.z+r];
}
function tileBounds(tile,lookup) {
 const b=tile.pieces.filter(p=>!isTerrain(p.piece)&&!isFlora(p.piece)).map(p=>pieceBounds(p,lookup(p.piece)));
 if(!b.length){const p=tile.pieces.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.z));return p.length?[Math.min(-2.7,...p.map(p=>p.x-.7)),Math.min(-2.7,...p.map(p=>p.z-.7)),Math.max(2.7,...p.map(p=>p.x+.7)),Math.max(2.7,...p.map(p=>p.z+.7))]:[-2.7,-2.7,2.7,2.7];}
 return [Math.min(...b.map(x=>x[0])),Math.min(...b.map(x=>x[1])),Math.max(...b.map(x=>x[2])),Math.max(...b.map(x=>x[3]))];
}
export function buildSettlement(id,{assetLookup,metersPerUnit,gapMeters=2.5,roadWidth=3.5,anchor={x:0,z:0},yaw=0,seed=7,landOnly=false}={}){
 const preset=PRESETS.get(id);if(!preset)throw Error('unknown settlement');
 if(preset.status==='blocked-theme-assets')throw Error('Japanese architecture not verified; no European substitute permitted');
 if(typeof assetLookup!=='function'||!finite(metersPerUnit,gapMeters,roadWidth,anchor.x,anchor.z,yaw,seed)||metersPerUnit<=0||gapMeters<1||roadWidth<2)throw Error('missing real measured scale or invalid site');
 const missing=auditAssets(assetLookup,id).filter(x=>!x.ok);
 if(missing.length)return {ok:false,id,missing:missing.map(x=>x.id),reason:'exact assets missing, unlicensed or unmeasured; no substitution'};
 const g=gapMeters/metersPerUnit,half=roadWidth/metersPerUnit/2;
 const parts=preset.parts.map((t,i)=>({id:t,i})).filter(t=>!landOnly||!['dock','dock-boats','dock-ship','harbour-quay','quay','quay-b'].includes(t.id));
 // Deterministic ordering: keep guild first, dock lots on the same side.
 const rest=parts.slice(1);
 const rows=[ [parts[0]],[] ];
 for(const p of rest){if(COASTAL_TILES.has(p.id))rows[1].push(p);else rows[rows[0].length<=rows[1].length?0:1].push(p)}
 const lots=[],objects=[],roads=[],floraHints=[],blockers=[];
 let minX=Infinity,maxX=-Infinity;
 const world=(x,z)=>{const [dx,dz]=rot(x*metersPerUnit,z*metersPerUnit,yaw);return {x:anchor.x+dx,z:anchor.z+dz}};
 for(let side=0;side<2;side++){
 let x=0;
 for(const entry of rows[side]){
 const source=TILES.get(entry.id),t=side===1?{...source,pieces:source.pieces.map(p=>({...p,x:-p.x,z:-p.z,rot:(p.rot??0)+Math.PI})),blockers:[]}:source,b=tileBounds(t,assetLookup),ox=x-b[0],oz=side===0?-half-g-b[3]:half+g-b[1];
 const key=id+'-'+entry.i;
 const lot={id:key,tile:t.id,role:entry.i===0?'guild':'lot',ground:t.ground,sourceBounds:[ox+b[0],oz+b[1],ox+b[2],oz+b[3]],coastal:!landOnly&&COASTAL_TILES.has(t.id)};
 lots.push(lot);
 minX=Math.min(minX,ox+b[0]);maxX=Math.max(maxX,ox+b[2]);
 for(let i=0;i<t.pieces.length;i++){
 const p=t.pieces[i],pos=world(ox+p.x,oz+p.z);
 if(isTerrain(p.piece))continue;
 if(isFlora(p.piece)){floraHints.push({...pos,original:p.piece,policy:'native-unsung-only'});continue}
 const a=assetLookup(p.piece);
 objects.push({id:key+'-'+i,lot:key,sourceId:p.piece,model:a.uri,license:a.license,...pos,yOffset:(p.y??0)*metersPerUnit,yaw:(p.rot??0)+yaw,tilt:p.tilt??null,scale:(p.scale??1)*metersPerUnit,stretchX:p.stretchX??p.stretch??1,swatchMap:p.swatchMap??null,pin:p.pin??false,sourcePieceIndex:i,sourceTransform:{...p},surface:t.ground==='water'&&/boat|ship|canoe/i.test(p.piece)?'water':t.ground==='water'?'shore':'land'});
 }
 for(const b of t.blockers??[]){const p=b.of!==undefined?t.pieces[b.of]:b;if(p&&finite(p.x,p.z))blockers.push({lot:key,source:{...b},...world(ox+p.x,oz+p.z),radius:Number.isFinite(b.r)?b.r*metersPerUnit:null,objectId:b.of!==undefined?key+'-'+b.of:null})}
 const mid=ox+(b[0]+b[2])/2; roads.push({id:key+'-access',material:preset.roadMaterial,width:Math.min(roadWidth,2.5),points:[world(mid,0),world(mid,side===0?oz+b[3]:oz+b[1])],kind:'lot-access'});
 x+=b[2]-b[0]+g;
 }
 }
 roads.unshift({id:id+'-main',material:preset.roadMaterial,width:roadWidth,points:[world(minX-g,0),world(maxX+g,0)],kind:'main'});
 for(const lot of lots){const [a,b,c,d]=lot.sourceBounds;lot.corners=[[a,b],[a,d],[c,b],[c,d]].map(([x,z])=>world(x,z));}
 return {ok:true,schema:'hf-settlement-v2-draft',id,name:preset.name,seed,anchor,yaw,metersPerUnit,lots,objects,roads,floraHints,blockers,pending:[...preset.pending],themeDesign:'P546 directed, ordered lots; opposite facades face main street',npc:[],quests:[],terrainPolicy:'preserve-unsung; roads require native ground-conforming mesh; water remains native',status:'requires terrain and actual renderer validation; coastal layouts must be oriented to a real shoreline'};
}
export function validateSite(plan,{sampleTerrain,isOccupied=()=>false,maxLotRelief=1.25,maxRoadGrade=.12,step=1}={}){
 if(!plan?.ok||typeof sampleTerrain!=='function'||!finite(maxLotRelief,maxRoadGrade,step)||step<=0)throw Error('site validator requires a real native height sampler');
 const issues=[];
 const check=(p,kind,id)=>{const t=sampleTerrain(p.x,p.z);if(!t||!Number.isFinite(t.height)){issues.push({id,reason:'missing terrain data',...p});return null}if(isOccupied(p.x,p.z))issues.push({id,reason:'existing architecture or reserved space',...p});if(kind==='land'&&t.water)issues.push({id,reason:'land piece or path on water',...p});if(kind==='water'&&!t.water)issues.push({id,reason:'boat not on water',...p});return t};
 for(const lot of plan.lots){const [a,b,c,d]=lot.corners,hs=[];const nx=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/step)),nz=Math.max(1,Math.ceil(Math.hypot(c.x-a.x,c.z-a.z)/step));for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const p={x:a.x+(b.x-a.x)*i/nx+(c.x-a.x)*j/nz,z:a.z+(b.z-a.z)*i/nx+(c.z-a.z)*j/nz};const t=check(p,lot.coastal?'shore':'land',lot.id);if(t&&!t.water)hs.push(t.height)}if(hs.length&&Math.max(...hs)-Math.min(...hs)>maxLotRelief)issues.push({id:lot.id,reason:'lot slope too high; relocate rather than add floating slab'});}
 for(const o of plan.objects)check(o,o.surface,o.id);
 for(const road of plan.roads){for(let k=1;k<road.points.length;k++){const a=road.points[k-1],b=road.points[k],len=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(len/step));let last=null;for(let i=0;i<=n;i++){const t=check({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n},'land',road.id);if(t&&last&&len&&Math.abs(t.height-last.height)/(len/n)>maxRoadGrade)issues.push({id:road.id,reason:'road grade exceeds limit; reroute'});last=t}}}
 return {ok:issues.length===0,issues,needs:['verify door accessibility and model collisions','native path and shore mesh generation','render QA on editor and Android']};
}
