// Scan the actual pinned Guildhall engine; no screenshots or 3D required until finalists.
import {hexIsland,hexZones,hexWorld,kindOf,hexCentre,installTilePrefabs} from "../packages/world/src/hex/index.ts";
import {NATURE_CHOSEN} from "../packages/world/src/hex/index.ts";
const KINGDOM_PRESETS:Record<string,Record<string,number>>={
arvelia:{coast:.75,hills:3,rain:1.25,forest:.08,cliffs:.45,woods:.35,wild:.45,tree:1.1,pine:1.1},
puertaria:{coast:1.7,hills:5,rain:3,forest:0,cliffs:.25,woods:.1,wild:.1,tree:.65,pine:.65},
ferrondral:{coast:.85,hills:9,rain:.3,forest:0,cliffs:1.6,woods:.1,wild:.1,tree:.75,pine:.75,rock:1.4},
sylvaris:{coast:.85,hills:4,rain:1.4,forest:.42,cliffs:.65,woods:.85,wild:1.1,tree:1.6,pine:1.6},
valdoria:{coast:.6,hills:1,rain:1.7,forest:.025,cliffs:.2,woods:.15,wild:.2,tree:1,pine:1},
lumeria:{coast:1.05,hills:2,rain:1.25,forest:.025,cliffs:.35,woods:.15,wild:.2,tree:1,pine:1},
auralis:{coast:1.2,hills:6,rain:2.45,forest:.18,cliffs:.8,woods:.45,wild:.65,tree:1.35,pine:1.35},
valtheria:{coast:1.1,hills:7,rain:.65,forest:.025,cliffs:1.5,woods:.15,wild:.25,tree:1,pine:1}
};
const SIZES=[500,600,800,1000,1300];
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from "node:fs";
const start=Number(process.argv[2]??1),end=Number(process.argv[3]??500);
const selected=process.argv[4];
const profiles=Object.keys(KINGDOM_PRESETS).filter(t=>t!=="equilibrada"&&(!selected||selected===t));
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const target=(x:number,v:number)=>clamp(1-Math.abs(x-v)/Math.max(.01,v));
const primary:Record<string,string[]>={arvelia:["town"],puertaria:["harbour","fishing"],ferrondral:["mine"],sylvaris:["lumber"],valdoria:["farm"],lumeria:["market"],auralis:["monastery"],valtheria:["camp"]};
function geography(h:ReturnType<typeof hexIsland>){
 const g=h.grid,kinds=Array.from({length:g.size},(_,i)=>kindOf(h,i));
 const dry=(i:number)=>i>=0&&!["sea","shallows","lake","river","cliff","rock"].includes(kinds[i]!);
 const dist=(a:number,b:number)=>{const dq=g.q[a]!-g.q[b]!,dr=g.r[a]!-g.r[b]!;return (Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2};
 const town=h.sites.town[0]??0;let land=0,flat=0,central=0,high=0,rock=0,cliff=0,forest=0,shore=0,quay=0,mine=0,woodEdge=0,farm=0,falls=0,mouths=0,max=0,riverTiles=0,portNear=0,riverUrban=0,waterUrban=0,steep=0;
 for(let i=0;i<g.size;i++){
  const k=kinds[i]!,lev=h.level[i]!,ns=[...g.neighbours(i)].filter(j=>j>=0);
  if(k==="river"){riverTiles++;if(dist(i,town)<=12)riverUrban++;const j=h.down[i]!;if(j>=0&&h.level[i]!-h.level[j]!>=2)falls++}
  if(k==="rock")rock++;
  if(k==="cliff")cliff++;
  if(k==="forest")forest++;
  if(k==="sand")shore++;
  if(k==="sea"||k==="shallows")continue;
  land++;max=Math.max(max,lev);if(lev>=5)high++;
  if(!dry(i))continue;
  if(dist(i,town)<=12&&ns.some(j=>["river","lake","shallows"].includes(kinds[j]!)))waterUrban++;
  if(ns.some(j=>dry(j)&&Math.abs(h.level[j]!-lev)>2))steep++;
  const flatness=ns.filter(j=>dry(j)&&h.level[j]===lev).length/6;
  if(flatness>=.66){flat++;if(dist(i,town)<=8)central++}
  if(k==="sand"&&lev===0&&ns.filter(j=>kinds[j]==="shallows").length>=2){quay++;if(dist(i,town)<=16)portNear++}
  if(flatness>=.5&&ns.some(j=>kinds[j]==="rock"||kinds[j]==="cliff"))mine++;
  if(k!=="forest"&&flatness>=.5&&ns.some(j=>kinds[j]==="forest"))woodEdge++;
  if(["grass","meadow"].includes(k)&&lev<=2&&flatness>=.66)farm++;
 }
 for(const r of h.rivers){const i=r.tiles.at(-1);if(i!==undefined&&["sea","shallows","sand"].includes(kinds[i]!))mouths++}
 // Largest connected low flat terrain and forest; avoids selecting scattered tiny patches.
 const component=(predicate:(i:number)=>boolean)=>{const seen=new Uint8Array(g.size);let largest=0;for(let i=0;i<g.size;i++){if(seen[i]||!predicate(i))continue;seen[i]=1;const q=[i];for(let n=0;n<q.length;n++)for(const j of g.neighbours(q[n]!))if(j>=0&&!seen[j]&&predicate(j)){seen[j]=1;q.push(j)}largest=Math.max(largest,q.length)}return largest};
 const flatLand=component(i=>dry(i)&&h.level[i]!<=2&&[...g.neighbours(i)].filter(j=>j>=0&&dry(j)&&h.level[j]===h.level[i]).length>=4);
 const woods=component(i=>kinds[i]==="forest");
 return {land,flat,central,high,rock,cliff,forest,shore,quay,mine,woodEdge,farm,falls,mouths,max,riverTiles,portNear,flatLand,woods,riverUrban,waterUrban,steep,rivers:h.rivers.length,lake:h.lake.length};
}
type Geo=ReturnType<typeof geography>;
function score(t:string,m:Geo){
 const n=m.land||1, flat=clamp(m.flat/n/.5),central=clamp(m.central/95),high=clamp(m.high/n/.25),peak=clamp(m.max/12),river=clamp(m.rivers/7),quay=clamp(m.quay/35),mine=clamp(m.mine/55),woods=clamp(m.woods/n/.48),field=clamp(m.farm/n/.4),plain=clamp(m.flatLand/n/.35),port=clamp(m.portNear/18),cliffs=clamp(m.cliff/n/.10),falls=clamp(m.falls/5),lake=clamp(m.lake/20),edge=clamp(m.woodEdge/60),mouths=clamp(m.mouths/4);
 const scores:Record<string,number>={
  arvelia:.35*central+.30*plain+.15*flat+.1*river+.10*port,
  puertaria:.14*quay+.12*port+.14*clamp(m.rivers/12)+.22*clamp(m.riverUrban/50)+.16*clamp(m.waterUrban/85)+.12*flat+.10*(1-clamp(m.forest/n/.05)),
  ferrondral:.22*high+.18*peak+.30*mine+.15*flat+.08*(1-river)+.07*(1-clamp(m.forest/n/.05)),
  sylvaris:.40*woods+.20*edge+.15*lake+.15*river+.10*central,
  valdoria:.40*field+.28*plain+.15*river+.12*flat+.05*(1-high),
  lumeria:.30*central+.25*plain+.20*port+.15*flat+.10*river,
  auralis:.25*peak+.20*lake+.20*falls+.20*high+.15*flat,
  valtheria:.25*cliffs+.25*high+.20*peak+.20*central+.10*port
 };
 return 100*scores[t]!;
}
const tileDir=new URL("../data/tiles/",import.meta.url);
installTilePrefabs(readdirSync(tileDir).filter(f=>f.endsWith(".json")).map(f=>JSON.parse(readFileSync(new URL(f,tileDir),"utf8"))));
const output:any={range:[start,end],upstream:"ef56b1cdf247f8839bf7fbb289713b15dbacae8c",profiles:{}};
const mandatory=["adventurers-guild","tavern","smithy","chapel","market","warehouse","house"];
for(const theme of profiles){
 const profile=KINGDOM_PRESETS[theme]!;
 const list=[];
 for(const files of SIZES)for(let seed=start;seed<=end;seed++){
  const p={...profile,files},h=hexIsland({seed,...p}),m=geography(h);
  const preferred=theme==='puertaria'||theme==='valdoria'?850:theme==='ferrondral'||theme==='sylvaris'?750:700;
  const compact=1-Math.abs(files-preferred)/1000;
  const harmony=1-clamp(m.steep/m.land/.4);
  list.push({seed,files,geo:score(theme,m)*.88+6*compact+6*harmony,m});
 }
 list.sort((a,b)=>b.geo-a.geo||a.seed-b.seed);
 const finalists=[];
 const chosen=SIZES.flatMap(files=>list.filter(x=>x.files===files).slice(0,6));
 for(const x of chosen){
  const p={...profile,files:x.files};const nature={...NATURE_CHOSEN,woods:p.woods,wild:p.wild,tree:p.tree,pine:p.pine,rock:p.rock??1};
  const h=hexIsland({seed:x.seed,...p}),z=hexZones(h,{theme,wild:nature.wild}),w=hexWorld(h,z,{nature,regions:true});
  const tiles=new Map(w.tiles.map(t=>[t.i,t.prefab]));
  const town=z.zones.find(z=>z.kind==="town");
  const civic=mandatory.filter(id=>town?.tiles.some(i=>tiles.get(i)===id)).length;
  const thematic=z.zones.filter(z=>primary[theme]!.includes(z.kind)&&z.tiles.length>0);
  const thematicTiles=thematic.reduce((n,z)=>n+z.tiles.length,0);
  const counts:Record<string,number>={};for(const tile of w.tiles)if(tile.prefab)counts[tile.prefab]=(counts[tile.prefab]??0)+1;
  const count=(re:RegExp)=>w.pieces.filter(p=>re.test(p.piece)).length;
  const mines=count(/building-mine-/),rails=count(/kaykit-holiday\/.*(?:rail|track)/i),boats=count(/boat-row|ship-small/),trees=count(/(?:^|[\/_-])tree(?:[\/_-]|\d)/i);
  const docks=(counts.dock??0)+(counts["harbour-quay"]??0);const largeQuays=counts["harbour-quay"]??0;
  const fields=z.stats.fields,farms=(counts.farmstead??0)+(counts["farmstead-yard"]??0),bridges=w.bridges.length;
  const waterfront=town?.tiles.filter(i=>[...h.grid.neighbours(i)].some(j=>j>=0&&["river","lake","shallows"].includes(kindOf(h,j)))).length??0;
  const workshops=(counts.smithy??0)+(counts["smithy-works"]??0);
  const g=h.grid,dist=(a:number,b:number)=>{const dq=g.q[a]!-g.q[b]!,dr=g.r[a]!-g.r[b]!;return (Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2};
  const guild=town?.tiles.find(i=>tiles.get(i)==="adventurers-guild");
  const guildDistance=guild!==undefined&&town?dist(guild,town.tile):999;
  const civicDistance=town?mandatory.reduce((n,id)=>n+Math.min(15,...town.tiles.filter(i=>tiles.get(i)===id).map(i=>dist(i,town.tile))),0)/mandatory.length:15;
  const walls=w.pieces.filter(p=>p.piece==="kaykit-hexagon/wall-straight").length,towers=count(/building-tower-base/);
  const useNames=["field","orchard","pasture"]; const farmSet=new Set(w.tiles.filter(t=>useNames.includes(t.prefab??"")).map(t=>t.i));
  const totalAg=farmSet.size;let clusters=0,isolated=0,largestFarm=0;
  while(farmSet.size){const i=farmSet.values().next().value!;farmSet.delete(i);const q=[i];for(let n=0;n<q.length;n++)for(const j of g.neighbours(q[n]!))if(farmSet.delete(j))q.push(j);clusters++;if(q.length<3)isolated+=q.length;largestFarm=Math.max(largestFarm,q.length)}
  const dockTiles=w.tiles.filter(t=>t.prefab==="dock"||t.prefab==="harbour-quay");
  const sectors=new Set(dockTiles.map(t=>town?Math.floor((Math.atan2(t.z-(w.tiles.find(k=>k.i===town.tile)?.z??0),t.x-(w.tiles.find(k=>k.i===town.tile)?.x??0))+Math.PI)*3/Math.PI)%6:0)).size;
  const dryTiles=w.tiles.filter(t=>!["water"].includes(t.ground));const scale=1.82/(2.2*.47);
  const width=Math.round((Math.max(...dryTiles.map(t=>t.x))-Math.min(...dryTiles.map(t=>t.x))+6.2)*scale);
  const depth=Math.round((Math.max(...dryTiles.map(t=>t.z))-Math.min(...dryTiles.map(t=>t.z))+6.2)*scale);
  const actual=theme==="ferrondral"?mines:theme==="puertaria"?boats:theme==="valdoria"?fields:theme==="sylvaris"?(counts.lumber??0)+(counts.hunter??0):theme==="lumeria"?(counts.market??0)+(counts["market-square"]??0):theme==="auralis"?(counts.monastery??0)+(counts["monastery-compound"]??0):theme==="valtheria"?(counts.barracks??0)+(counts.archery??0)+(counts["training-arena"]??0):civic;
  const economy=theme==="ferrondral"?.55*clamp(mines/5)+.2*clamp(workshops/12)+.15*clamp(rails/Math.max(1,mines*2))+.1*(1-clamp(fields/30)):
    theme==="puertaria"?.15*target(boats,22)+.15*target(docks,12)+.15*clamp(largeQuays/2)+.25*clamp(waterfront/18)+.20*clamp(bridges/7)+.10*(1-clamp(trees/30)):
    theme==="valdoria"?.65*clamp(fields/150)+.35*clamp(farms/8):
    theme==="sylvaris"?.7*clamp(actual/8)+.3*clamp(x.m.woods/x.m.land/.5):
    theme==="arvelia"?clamp(thematicTiles/80):clamp(actual/8);
  const roadScore=clamp(z.roads.length/Math.max(1,z.zones.filter(x=>x.tiles.length>0).length-1));
  const usable=civic===mandatory.length&&guildDistance<=4&&thematic.length>0&&actual>0&&walls>=10&&(theme!=="ferrondral"||(mines>=2&&rails>=mines*2&&fields<=6&&trees<=80))&&(theme!=="puertaria"||(boats>=5&&docks>=3&&bridges>=3&&fields<=12&&trees<=40&&sectors>=2));
  const density=w.pieces.length/Math.max(1,x.m.land);const harmony=.35*target(density,theme==="valdoria"?9:theme==="sylvaris"?6:5)+.25*(1-clamp(x.m.steep/x.m.land/.5))+.25*clamp(walls/24)+.15*(1-clamp(isolated/8));const centerScore=.55*(1-clamp(guildDistance/7))+.45*(1-clamp(civicDistance/9));const urbanFill=clamp(z.stats.buildings/x.m.land/.15);const finalScore=.25*x.geo+30*economy+10*civic/mandatory.length+5*roadScore+15*harmony+10*centerScore+5*urbanFill;
  finalists.push({...x,score:Math.round((finalScore-(usable?0:35))*100)/100,civic,themeZones:thematic.length,themeTiles:thematicTiles,roads:z.roads.length,buildings:z.stats.buildings,pieces:w.pieces.length,actual,usable,counts,params:p,metrics:{mines,rails,boats,docks,largeQuays,trees,fields,farms,bridges,waterfront,workshops,density,walls,towers,guildDistance,civicDistance,totalAg,clusters,isolated,largestFarm,sectors,width,depth}});

 }
 finalists.sort((a,b)=>Number(b.usable)-Number(a.usable)||b.score-a.score||a.seed-b.seed);
 output.profiles[theme]={preset:profile,sizes:SIZES,scanned:list.length,finalists:finalists.slice(0,10)};
 console.log("SIZE_BEST",theme,JSON.stringify(SIZES.map(files=>finalists.find(f=>f.files===files))));
 console.log("BEST",theme,JSON.stringify(finalists.slice(0,10).map(({counts,...v})=>v)));
}
mkdirSync("seed-results",{recursive:true});
writeFileSync("seed-results/"+(selected??"all")+".json",JSON.stringify(output,null,2));
