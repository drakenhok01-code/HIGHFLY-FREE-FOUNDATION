// Scan the actual pinned Guildhall engine; no screenshots or 3D required until finalists.
import {hexIsland,hexZones,hexWorld,kindOf,hexCentre,installTilePrefabs} from "../packages/world/src/hex/index.ts";
import {KINGDOM_PRESETS} from "../packages/ui/src/viewer/kingdom-presets.ts";
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
 const town=h.sites.town[0]??0;let land=0,flat=0,central=0,high=0,rock=0,cliff=0,forest=0,shore=0,quay=0,mine=0,woodEdge=0,farm=0,falls=0,mouths=0,max=0,riverTiles=0,portNear=0;
 for(let i=0;i<g.size;i++){
  const k=kinds[i]!,lev=h.level[i]!,ns=[...g.neighbours(i)].filter(j=>j>=0);
  if(k==="river"){riverTiles++;const j=h.down[i]!;if(j>=0&&h.level[i]!-h.level[j]!>=2)falls++}
  if(k==="rock")rock++;
  if(k==="cliff")cliff++;
  if(k==="forest")forest++;
  if(k==="sand")shore++;
  if(k==="sea"||k==="shallows")continue;
  land++;max=Math.max(max,lev);if(lev>=5)high++;
  if(!dry(i))continue;
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
 return {land,flat,central,high,rock,cliff,forest,shore,quay,mine,woodEdge,farm,falls,mouths,max,riverTiles,portNear,flatLand,woods,rivers:h.rivers.length,lake:h.lake.length};
}
type Geo=ReturnType<typeof geography>;
function score(t:string,m:Geo){
 const n=m.land||1, flat=clamp(m.flat/n/.5),central=clamp(m.central/95),high=clamp(m.high/n/.25),peak=clamp(m.max/12),river=clamp(m.rivers/7),quay=clamp(m.quay/35),mine=clamp(m.mine/55),woods=clamp(m.woods/n/.48),field=clamp(m.farm/n/.4),plain=clamp(m.flatLand/n/.35),port=clamp(m.portNear/18),cliffs=clamp(m.cliff/n/.10),falls=clamp(m.falls/5),lake=clamp(m.lake/20),edge=clamp(m.woodEdge/60),mouths=clamp(m.mouths/4);
 const scores:Record<string,number>={
  arvelia:.35*central+.30*plain+.15*flat+.1*river+.10*port,
  puertaria:.30*quay+.20*port+.20*river+.15*mouths+.15*flat,
  ferrondral:.27*high+.20*peak+.30*mine+.15*flat+.08*(1-river),
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
 const p=KINGDOM_PRESETS[theme]!;
 const list=[];
 for(let seed=start;seed<=end;seed++){
  const h=hexIsland({seed,...p}),m=geography(h);
  list.push({seed,geo:score(theme,m),m});
 }
 list.sort((a,b)=>b.geo-a.geo||a.seed-b.seed);
 const finalists=[];
 for(const x of list.slice(0,40)){
  const h=hexIsland({seed:x.seed,...p}),z=hexZones(h,{theme}),w=hexWorld(h,z);
  const tiles=new Map(w.tiles.map(t=>[t.i,t.prefab]));
  const town=z.zones.find(z=>z.kind==="town");
  const civic=mandatory.filter(id=>town?.tiles.some(i=>tiles.get(i)===id)).length;
  const thematic=z.zones.filter(z=>primary[theme]!.includes(z.kind)&&z.tiles.length>0);
  const thematicTiles=thematic.reduce((n,z)=>n+z.tiles.length,0);
  const maxLots=theme==="arvelia"?80:45;
  const themeScore=clamp(thematicTiles/maxLots);
  const roadScore=clamp(z.roads.length/Math.max(1,z.zones.filter(x=>x.tiles.length>0).length-1));
  // Prefer actual usable towns, not just a beautiful terrain.
  const finalScore=.65*x.geo+15*themeScore+12*civic/mandatory.length+8*roadScore;
  const counts:Record<string,number>={};for(const tile of w.tiles)if(tile.prefab)counts[tile.prefab]=(counts[tile.prefab]??0)+1;
  const actual=theme==="puertaria"?(counts.dock??0)+(counts["harbour-quay"]??0):theme==="ferrondral"?(counts.mine??0):theme==="valdoria"?(counts.field??0):theme==="sylvaris"?(counts.lumber??0):thematic.length;
  const usable= civic===mandatory.length&&thematic.length>0&&actual>0;
  finalists.push({...x,score:Math.round((finalScore-(usable?0:25))*100)/100,civic,themeZones:thematic.length,themeTiles:thematicTiles,roads:z.roads.length,buildings:z.stats.buildings,pieces:w.pieces.length,actual,usable,counts});
 }
 finalists.sort((a,b)=>b.score-a.score||a.seed-b.seed);
 output.profiles[theme]={preset:p,scanned:list.length,finalists:finalists.slice(0,10)};
 console.log("BEST",theme,JSON.stringify(finalists.slice(0,3).map(({counts,...v})=>v)));
}
mkdirSync("seed-results",{recursive:true});
writeFileSync("seed-results/"+(selected??"all")+".json",JSON.stringify(output,null,2));
