// Experimental Guildhall adapter, executed from a clean pinned upstream checkout.
// No changes to production or Unsung terrain. MIT upstream attribution retained.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const here = import.meta.dirname;
const cfg = JSON.parse(fs.readFileSync(path.join(here,'presets.json'),'utf8'));
const upstream = path.resolve(process.argv[2] ?? 'guildhall-upstream');
const out = path.resolve(process.argv[3] ?? 'thematic-output');
const count = Number(process.env.HF_SEEDS ?? cfg.seeds);
if(!Number.isInteger(count)||count<1||count>1000)throw Error('Invalid seed count');
const sha=execFileSync('git',['-C',upstream,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sha!==cfg.upstream)throw Error('Wrong upstream commit: '+sha);
const hex=path.join(upstream,'packages/world/src/hex');
const target=path.join(hex,'world.ts');
const original=fs.readFileSync(target,'utf8');
let source=original;
function replaceOnce(a,b){
  if(source.split(a).length!==2)throw Error('Upstream source drift: '+a.slice(0,80));
  source=source.replace(a,b);
}
replaceOnce('const TOWN_HEART =', 'let hfTheme: { buildings: string[]; scenes: string[] } | null = null\nexport function setHFTheme(theme: typeof hfTheme) { hfTheme = theme }\nexport let hfWallPieces = 0\nconst TOWN_HEART =');
replaceOnce('  const STEP = opts.step ?? LEVEL_STEP','  hfWallPieces = 0\n  const STEP = opts.step ?? LEVEL_STEP');
replaceOnce('    const list =\n      zone?.kind !== "town"', '    const baseList =\n      zone?.kind !== "town"');
replaceOnce('    return { list, at: Math.floor(hash2(seed + 5, g.q[i]!, g.r[i]!) * list.length) % list.length }', `    const list = hfTheme && zone?.kind === "town" ? hfTheme.buildings : baseList
    if (!hfTheme) return { list, at: Math.floor(hash2(seed + 5, g.q[i]!, g.r[i]!) * list.length) % list.length }
    const counts = new Map<string, number>()
    for (const k of built.values()) counts.set(k, (counts.get(k) ?? 0) + 1)
    const ordered = [...new Set(list)].sort((a,b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0) || list.indexOf(a)-list.indexOf(b))
    const least = counts.get(ordered[0]!) ?? 0
    const tied = ordered.filter(k => (counts.get(k) ?? 0) === least)
    const first = tied[Math.floor(hash2(seed + 5, g.q[i]!, g.r[i]!) * tied.length) % tied.length]!
    return { list: [first, ...ordered.filter(k => k !== first)], at: 0 }`);
replaceOnce('for (const scene of PLACE_SCENES[zone.kind] ?? []) {','for (const scene of (hfTheme && zone.kind === "town" ? hfTheme.scenes : PLACE_SCENES[zone.kind]) ?? []) {');
replaceOnce('    pieces.push(...wall.pieces)','    hfWallPieces = wall.pieces.length\n    pieces.push(...wall.pieces)');
fs.mkdirSync(out,{recursive:true});
const load=(file)=>import(pathToFileURL(path.join(hex,file)).href);
try {
 fs.writeFileSync(target,source);
 const [{hexIsland},{hexZones},worldModule,tilesModule]=await Promise.all([load('island.ts'),load('zones.ts'),load('world.ts'),load('tiles.ts')]);
 const {hexWorld,setHFTheme}=worldModule;
 const {installTilePrefabs,tilePrefab,tilePrefabs}=tilesModule;
 const catalogPath=path.join(upstream,'data/tiles');
 const catalog=fs.readdirSync(catalogPath).filter(x=>x.endsWith('.json')).map(x=>JSON.parse(fs.readFileSync(path.join(catalogPath,x),'utf8'))).filter(x=>x.id&&Array.isArray(x.pieces));
 if(catalog.length<50)throw Error('Incomplete authored catalog '+catalog.length);
 installTilePrefabs(catalog);
 fs.writeFileSync(path.join(out,'catalog-audit.json'),JSON.stringify(tilePrefabs().map(p=>({id:p.id,group:p.group,ground:p.ground,pieces:p.pieces.length,spots:p.spots?.length??0,footprint:p.footprint??[],variants:p.variants??[]})),null,2));
 const report=[];
 const themeScenes = (p)=>[...new Set(['town-hall-plaza','tavern-garden',...p.requiredScenes.filter(x=>!['harbour-quay','monastery-compound','farmstead-yard'].includes(x))])];
 function routeGraph(z){
  const adj=z.zones.map(()=>[]);
  for(const r of z.roads){if(r.tiles.length){adj[r.a]?.push(r.b);adj[r.b]?.push(r.a);}}
  const seen=new Set([0]),queue=[0];
  for(let i=0;i<queue.length;i++)for(const n of adj[queue[i]]??[])if(!seen.has(n)){seen.add(n);queue.push(n);}
  return seen.size===z.zones.length;
 }
 for(const p of cfg.profiles){
  for(const id of [...p.buildings,...p.requiredScenes,...themeScenes(p)])if(!tilePrefab(id))throw Error('Missing prefab '+p.id+': '+id);
  setHFTheme({buildings:p.buildings,scenes:themeScenes(p)});
  const places=[{id:p.id+'-capital',label:p.label,kind:'town',capital:true,files:40},...p.districts.map((kind,i)=>({id:p.id+'-'+i,label:kind,kind,files:20}))];
  let best=null,bestScore=-Infinity;const candidates=[];
  for(let seed=1;seed<=count;seed++){
   try{
    const h=hexIsland({seed,files:p.files,hills:cfg.hills,forest:p.forest});
    const z=hexZones(h,{agents:cfg.agents,places});
    const w=hexWorld(h,z,{agents:cfg.agents,regions:false});
    const hist=w.stats.prefabs;
    const found=p.requiredScenes.filter(id=>(hist[id]??0)>0);
    const missing=p.requiredScenes.filter(id=>!found.includes(id));
    const uniqueModels=new Set(w.pieces.map(x=>x.piece)).size;
    const thematicTiles=w.tiles.filter(t=>t.prefab&&p.buildings.includes(t.prefab)).length;
    const finite=w.pieces.every(q=>[q.x,q.y,q.z,q.rot,q.scale].every(Number.isFinite));
    const wall=worldModule.hfWallPieces;
    const roadConnected=routeGraph(z);
    const requiredDistricts=p.districts.filter((k,i,a)=>a.indexOf(k)===i);
    const missingDistricts=requiredDistricts.filter(k=>!z.zones.some(zz=>zz.kind===k&&zz.place));
    const guild=!!z.castle&&z.tier>=cfg.minimumCastleTier&&wall>0&&!!w.board;
    const valid=guild&&roadConnected&&finite&&missing.length===0&&missingDistricts.length===0;
    const buildings=z.stats.buildings, diversity=Object.keys(hist).length;
    const score=30*(found.length/Math.max(1,p.requiredScenes.length))+25*Math.min(uniqueModels/160,1)+20*Math.min(buildings/90,1)+15*Number(roadConnected)+10*Math.min(thematicTiles/35,1);
    const stats={seed,valid,score:+score.toFixed(3),guild,wall,roadConnected,finite,missing,missingDistricts,buildings,diversity,uniqueModels,thematicTiles,pieces:w.pieces.length,stairs:w.stairs.length,bridges:w.bridges.length};
    candidates.push(stats);
    if(valid&&score>bestScore){
      bestScore=score;
      const activitySpots=w.tiles.flatMap(t=>{
       const prefab=t.prefab?tilePrefab(t.prefab):null;
       return (prefab?.spots??[]).map(s=>{const x=t.mirror?-s.x:s.x;const c=Math.cos(t.rot),n=Math.sin(t.rot);return {...s,tile:t.i,x:t.x+x*c+s.z*n,z:t.z-x*n+s.z*c,y:t.top+(s.y??0),facing:t.rot+(t.mirror?-s.facing:s.facing)}});
      });
      best={profile:p.id,label:p.label,seed,upstream:sha,status:'native layout candidate; terrain projection and runtime QA pending',needsArt:p.needsArt,stats,entities:w.pieces,tiles:w.tiles,doorways:w.doorways,paths:w.paths,bridges:w.bridges,stairs:w.stairs,decks:w.decks,board:w.board,activitySpots,roadGraph:z.roads,zones:z.zones.map(({kind,tile,tiles,buildings,place})=>({kind,tile,tiles,buildings,place})),prefabCounts:hist};
    }
   }catch(e){candidates.push({seed,valid:false,error:String(e)});}
  }
  candidates.sort((a,b)=>Number(b.valid)-Number(a.valid)||(b.score??-1)-(a.score??-1)||a.seed-b.seed);
  if(best)fs.writeFileSync(path.join(out,p.id+'.json'),JSON.stringify(best));
  report.push({id:p.id,label:p.label,tested:candidates.length,valid:candidates.filter(c=>c.valid).length,winner:best?.stats??null,needsArt:p.needsArt,candidates});
  console.log(p.id,'tested',candidates.length,'valid',report.at(-1).valid,'winner',best?.seed??'NONE');
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({upstream:sha,authoredPrefabs:catalog.length,tested:report.reduce((n,r)=>n+r.tested,0),winners:report.filter(r=>r.winner).length,profiles:report},null,2));
 if(report.some(r=>!r.winner))process.exitCode=2;
} finally { fs.writeFileSync(target,original); }
