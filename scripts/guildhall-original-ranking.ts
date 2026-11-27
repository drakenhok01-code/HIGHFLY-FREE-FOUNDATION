// Scan the actual pinned Guildhall engine; no screenshots or 3D required until finalists.
import {hexIsland,hexZones,hexWorld,kindOf,hexCentre,installTilePrefabs} from "../packages/world/src/hex/index.ts";
import {NATURE_CHOSEN} from "../packages/world/src/hex/index.ts";
const KINGDOM_PRESETS:Record<string,Record<string,number>>={
arvelia:{coast:.75,hills:3,rain:1.25,forest:.08,woods:.35,wild:.45,tree:1.1,pine:1.1},
puertaria:{coast:1.7,hills:5,rain:3,forest:0,woods:.1,wild:.1,tree:.65,pine:.65},
ferrondral:{coast:.85,hills:9,rain:.3,forest:0,woods:.1,wild:.1,tree:.75,pine:.75,rock:1.4},
sylvaris:{coast:.85,hills:4,rain:1.4,forest:.42,woods:.85,wild:1.1,tree:1.6,pine:1.6},
valdoria:{coast:.6,hills:1,rain:1.7,forest:.025,woods:.15,wild:.2,tree:1,pine:1},
lumeria:{coast:1.05,hills:2,rain:1.25,forest:.025,woods:.15,wild:.2,tree:1,pine:1},
auralis:{coast:1.2,hills:6,rain:2.45,forest:.18,woods:.45,wild:.65,tree:1.35,pine:1.35},
valtheria:{coast:1.1,hills:7,rain:.65,forest:.025,woods:.15,wild:.25,tree:1,pine:1}
};
const SIZES=[600,1000,2000,3000,4000,8000];
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
const seeds=[...new Set([...Array.from({length:end-start+1},(_,i)=>i+start),253,308,258,352,3,123,448,90,183,331,196,16,430,218,370,381,317,18,457,82,69,166])];
for(const theme of profiles){
 const profile=KINGDOM_PRESETS[theme]!;
 const list=[];
 for(const files of SIZES)for(const seed of seeds){
 const h=hexIsland({seed,files,coast:profile.coast,hills:profile.hills,rain:profile.rain,forest:profile.forest}),m=geography(h);
 list.push({seed,files,geo:score(theme,m),m});
 }
 list.sort((a,b)=>b.geo-a.geo||a.seed-b.seed);
 const finalists=[];
 for(const x of SIZES.flatMap(files=>list.filter(x=>x.files===files).slice(0,4))){
 const p={...profile,files:x.files},nature={...NATURE_CHOSEN,woods:p.woods,wild:p.wild,tree:p.tree,pine:p.pine,rock:p.rock??1};
 const h=hexIsland({seed:x.seed,files:p.files,coast:p.coast,hills:p.hills,rain:p.rain,forest:p.forest}),z=hexZones(h,{wild:nature.wild}),w=hexWorld(h,z,{nature,regions:true});
 const counts:Record<string,number>={};for(const t of w.tiles)if(t.prefab)counts[t.prefab]=(counts[t.prefab]??0)+1;
 const has=(re:RegExp)=>Object.keys(counts).some(k=>re.test(k));
 const n=(re:RegExp)=>Object.entries(counts).reduce((a,[k,v])=>a+(re.test(k)?v:0),0);
 const pc=(re:RegExp)=>w.pieces.filter(p=>re.test(p.piece)).length;
 const categories=[/^(house|cottage|townhouse)/,/^tavern/,/^smithy/,/^chapel$|^monastery/,/^market/,/^warehouse$|^storehouse$/, /^great-hall$|^castle$/, /^dock|^harbour-quay/, /^mine$/, /^lumber|^hunter/, /^field|^farmstead|^orchard/, /^barracks|^archery|^training-arena/, /^windmill|^watermill/, /^graveyard/];
 const variety=categories.filter(has).length;
 const hall=n(/^great-hall$/),walls=pc(/\/wall-straight/),towers=pc(/building-tower-base/),boats=pc(/boat-row|ship-small/),docks=n(/^dock$|^harbour-quay$/),quays=n(/^harbour-quay$/),trees=pc(/(?:^|[\/_-])tree(?:[\/_-]|\d)/i),mines=n(/^mine$/),fields=n(/^field$/),farms=n(/^farmstead/),lumber=n(/^lumber$|^hunter$/),markets=n(/^market/),temples=n(/^monastery|^chapel$/),military=n(/^barracks|^archery|^training-arena/),bridges=w.bridges.length;
 const town=z.zones.find(q=>q.kind==="town"),central=town?town.tiles.length:0;
 const g=h.grid, t=w.tiles.find(q=>q.i===town?.tile),sectors=new Set(w.tiles.filter(q=>q.prefab==="dock"||q.prefab==="harbour-quay").map(q=>Math.floor((Math.atan2(q.z-(t?.z??0),q.x-(t?.x??0))+Math.PI)*3/Math.PI)%6)).size;
 const ag=new Set(w.tiles.filter(t=>["field","orchard","pasture"].includes(t.prefab??"")).map(t=>t.i));let isolated=0;
 while(ag.size){const i=ag.values().next().value!;ag.delete(i);const q=[i];for(let j=0;j<q.length;j++)for(const k of g.neighbours(q[j]!))if(ag.delete(k))q.push(k);if(q.length<3)isolated+=q.length;}
 const econ:Record<string,number>={arvelia:.5*clamp(central/90)+.5*clamp(markets/5),puertaria:.22*clamp(boats/20)+.23*clamp(sectors/4)+.2*clamp(quays/2)+.2*clamp(bridges/8)+.15*(1-clamp(trees/600)),ferrondral:.65*clamp(mines/2)+.2*clamp(x.m.mine/50)+.15*(1-clamp(trees/500)),sylvaris:.6*clamp(lumber/5)+.4*clamp(x.m.woods/x.m.land/.4),valdoria:.6*clamp(fields/100)+.4*clamp(farms/6),lumeria:.7*clamp(markets/8)+.3*clamp(central/80),auralis:.55*clamp(temples/4)+.25*clamp(x.m.falls/6)+.2*clamp(bridges/6),valtheria:.5*clamp(military/5)+.3*clamp(towers/8)+.2*clamp(walls/30)};
 const fit=.6*clamp(variety/14)+.25*clamp(z.stats.buildings/100)+.15*(1-clamp(isolated/40));
 const full=.55*Number(hall>0)+.3*clamp(walls/24)+.15*clamp(towers/5);
 const compact=1-clamp(Math.max(0,x.files-3000)/7000);
 const total=.23*x.geo+30*econ[theme]!+25*fit+17*full+5*compact;
 finalists.push({seed:x.seed,files:x.files,score:Math.round(total*100)/100,geo:x.geo,params:p,metrics:{variety,hall,walls,towers,boats,docks,quays,trees,mines,fields,farms,lumber,markets,temples,military,bridges,sectors,isolated,central,buildings:z.stats.buildings,pieces:w.pieces.length,rivers:x.m.rivers,falls:x.m.falls,forest:x.m.forest,tier:z.tier},counts});
 }
 finalists.sort((a,b)=>b.score-a.score||a.seed-b.seed);
 console.log("NATIVE_BEST",theme,JSON.stringify(finalists.slice(0,5)));
 console.log("NATIVE_SIZES",theme,JSON.stringify(SIZES.map(files=>finalists.find(f=>f.files===files))));
 mkdirSync("seed-results",{recursive:true});writeFileSync("seed-results/"+theme+".json",JSON.stringify({theme,scanned:list.length,finalists},null,2));
}
