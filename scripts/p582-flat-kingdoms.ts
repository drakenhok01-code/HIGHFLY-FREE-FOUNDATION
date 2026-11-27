// P582 Compact Kingdoms: pinned original generator, not hand-selected screenshots.
import fs from 'node:fs';
import {hexIsland,kindOf} from '../guildhall/packages/world/src/hex/island.ts';
import {hexZones,useOf} from '../guildhall/packages/world/src/hex/zones.ts';
import {hexWorld} from '../guildhall/packages/world/src/hex/world.ts';
import {installTilePrefabs,HEX_TILE_SIZE} from '../guildhall/packages/world/src/hex/tiles.ts';
import {NATURE_CHOSEN} from '../guildhall/packages/world/src/hex/nature.ts';
import {hexWalk} from '../guildhall/packages/world/src/hex/walk.ts';
import {lifePlaces,planFolk,workTiles,lifePose} from '../guildhall/packages/world/src/hex/life.ts';
const dir='guildhall/data/tiles',prefabs=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(dir+'/'+f,'utf8')));
installTilePrefabs(prefabs);
const families={
 guild:/^castle$|^great-hall$|^castle-ward$/,
 housing:/^house(?:-|$)|^cottage|^townhouse|^homestead/,
 tavern:/^tavern/,smithy:/^smithy/,market:/^market|townhouse-shop/,
 storage:/^storehouse|^warehouse|^castle-stores/,
 chapel:/^chapel|^monastery/,graveyard:/^graveyard/,
 farm:/^farmstead|^field|^orchard|^pasture|^cottage-veg/,
 mill:/^windmill|^watermill/,lumber:/^lumber/,
 mine:/^mine/,hunter:/^hunter/,stables:/^castle-stables|^shepherd/,
 barracks:/^barracks/,training:/^archery|^training-arena|^castle-drill/,
 well:/^well-square|^castle-well/,harbour:/^dock|^harbour-quay|^quay|^boathouse/,
 lighthouse:/^lighthouse/,forest:/^woods|^pines/,rock:/^rocky/,ruins:/^ruins/
};
const required=Object.keys(families);
const themes={sylvaris:['lumber','forest','hunter'],arvelia:['guild','housing','market','tavern','chapel'],puertaria:['harbour','lighthouse','storage'],valdoria:['farm','mill','stables'],auralis:['guild','chapel','training','well'],lumeria:['market','storage','housing'],ferrondral:['mine','smithy','rock'],valtheria:['barracks','training','guild','stables']};
const make=(c)=>{const h=hexIsland({seed:c.seed,files:c.files,coast:c.coast,hills:c.hills,rain:c.rain,forest:c.forest}),nature={...NATURE_CHOSEN,woods:c.woods,wild:c.wild,tree:c.tree,pine:c.pine??c.tree,...(c.rock===undefined?{}:{rock:c.rock})},z=hexZones(h,{wild:nature.wild}),w=hexWorld(h,z,{step:c.step,nature});return {h,z,w}};
const config=(seed,files)=>({seed,files,coast:.85,hills:0,step:.2,rain:1.8,forest:.12,woods:.35,wild:.5,tree:1});
const url=(c,city)=>'https://guildhall.codestz.dev/town/'+c.seed+'?'+new URLSearchParams({...Object.fromEntries(Object.entries(c).filter(([k,v])=>k!=='seed'&&v!==undefined).map(([k,v])=>[k,String(v)])),pine:String(c.pine??c.tree),life:'1',hour:'13',name:city}).toString();
const score=(c,{h,z,w})=>{
 const count=Object.fromEntries(Object.entries(families).map(([name,re])=>[name,Object.entries(w.stats.prefabs).reduce((n,[id,v])=>n+(re.test(id)?Number(v):0),0)]));
 const missing=required.filter(k=>!count[k]),walls=w.pieces.filter(p=>/^kaykit-hexagon\/wall-/.test(p.piece)).length;
 const dry=w.tiles.filter(t=>t.ground!=='water'),ys=dry.map(t=>t.top),span=Math.max(...ys)-Math.min(...ys);
 const mouths=h.rivers.filter(r=>['sea','shallows'].includes(kindOf(h,r.tiles.at(-1)))).length;
 const boats=w.pieces.filter(p=>/boat|ship|canoe/.test(p.piece)).length;
 const roads=z.roads.length,land=h.stats.land;
 const total=required.length-missing.length;
 const base=total*100+(z.tier>=2&&walls>0?140:0)+(w.board?30:0)+(w.graveyard?30:0)+(mouths?65:0)+(boats?25:0)-w.stairs.length*5-Math.max(0,w.bridges.length-3)*4-span*15-land*.045;
 return {config:c,coverage:total,required:required.length,missing,counts:count,walls,tier:z.tier,board:!!w.board,graveyard:!!w.graveyard,land,buildings:z.stats.buildings,pieces:w.pieces.length,stairs:w.stairs.length,bridges:w.bridges.length,rivers:h.rivers.length,mouths,boats,roads,span,base};
};

const originals={
 sylvaris:{seed:352,files:3000,coast:.85,hills:4,rain:1.4,forest:.42,woods:.85,wild:1.1,tree:1.6,pine:1.6},
 arvelia:{seed:3,files:8000,coast:.75,hills:3,rain:1.25,forest:.08,woods:.35,wild:.45,tree:1.1,pine:1.1},
 puertaria:{seed:258,files:3000,coast:1.7,hills:5,rain:3,forest:0,woods:.1,wild:.1,tree:.65,pine:.65},
 valdoria:{seed:67,files:3000,coast:.6,hills:1,rain:1.7,forest:.025,woods:.15,wild:.2,tree:1,pine:1},
 auralis:{seed:33,files:8000,coast:1.2,hills:6,rain:2.45,forest:.18,woods:.45,wild:.65,tree:1.35,pine:1.35},
 lumeria:{seed:60,files:3000,coast:1.05,hills:2,rain:1.25,forest:.025,woods:.15,wild:.2,tree:1,pine:1},
 ferrondral:{seed:34,files:4000,coast:.85,hills:9,rain:.3,forest:0,woods:.1,wild:.1,tree:.75,pine:.75,rock:1.4},
 valtheria:{seed:16,files:3000,coast:1.1,hills:7,rain:.65,forest:.025,woods:.15,wild:.25,tree:1,pine:1}
};
const compactSeeds={sylvaris:241,arvelia:283,puertaria:322,valdoria:163,auralis:210,lumeria:71,ferrondral:392,valtheria:363};
const essential={sylvaris:['forest','lumber','hunter'],arvelia:['guild','housing','market','tavern'],puertaria:['harbour','lighthouse','storage'],valdoria:['farm','mill','stables'],auralis:['guild','chapel','market','training'],lumeria:['market','storage','chapel'],ferrondral:['mine','smithy','rock'],valtheria:['barracks','training','guild']};
const city=process.env.CITY;
if(!city||!originals[city])throw Error('CITY required');
const original={...originals[city],step:.2},flat={...original,hills:0};
const assess=(c)=>{
 const world=make(c),r=score(c,world);
 const focusMissing=essential[city].filter(k=>!r.counts[k]);
 const minimum=r.tier>=2&&r.walls>0&&r.board&&r.graveyard&&r.counts.harbour>0&&r.mouths>0;
 const rank=r.base+themes[city].reduce((n,k)=>n+(r.counts[k]?60+Math.min(8,r.counts[k])*5:0),0)-focusMissing.length*600-r.stairs*12-r.span*60;
 return {...r,focusMissing,minimum,rank,url:url(c,city)};
};
const verify=(row)=>{
 const {h,z,w}=make(row.config),graph=hexWalk(h,z,w,{reach:workTiles(h,z)}),places=lifePlaces(h,z,w,graph,{heroSpots:3});
 const folk=planFolk(h,z,w,graph,{seed:row.config.seed,pace:144,places,secPerHour:180});
 const hearts=graph.hearts.filter(n=>n>=0);
 const connected=hearts.length>0&&hearts.length===z.zones.length&&hearts.every(n=>graph.route(hearts[0],n)!==null);
 const poses=folk.length>0&&folk.every(f=>f.day.length>0&&[0,6,9,13,18,22].every(hour=>lifePose(f.day,hour,24).at.every(Number.isFinite)));
 const roles={};for(const f of folk)roles[f.role]=(roles[f.role]??0)+1;
 return {...row,connected,poses,population:folk.length,roles};
};
const rows=[],errors=[],seeds=[...new Set([original.seed,compactSeeds[city],...Array.from({length:48},(_,i)=>i+1)])];
let baseline=null,sameSeedFlat=null;
try{baseline=assess(original)}catch(e){errors.push({baseline:String(e)})}
for(const seed of seeds){
 try{const row=assess({...flat,seed});rows.push(row);if(seed===original.seed)sameSeedFlat=row}catch(e){errors.push({seed,error:String(e)})}
}
const ranked=rows.filter(r=>r.minimum).sort((a,b)=>b.rank-a.rank||a.config.seed-b.config.seed);
const candidates=[],checks=[];
for(const row of ranked.slice(0,16)){
 try{const result=verify(row);checks.push({seed:row.config.seed,connected:result.connected,poses:result.poses});if(result.connected&&result.poses)candidates.push(result);if(candidates.length===3)break}catch(e){checks.push({seed:row.config.seed,error:String(e)})}
}
if(sameSeedFlat)try{sameSeedFlat=verify(sameSeedFlat)}catch(e){errors.push({sameSeedFlat:String(e)})}
const winner=candidates[0]??null;
const result={city,attempts:seeds.length,valid:rows.length,eligible:ranked.length,baseline,sameSeedFlat,winner,alternatives:candidates.slice(1),checks,errors,rows};
fs.mkdirSync('flat',{recursive:true});
fs.writeFileSync('flat/'+city+'.json',JSON.stringify(result,null,2));
console.log('HF582_FLAT_RESULT '+JSON.stringify({...result,rows:undefined}));
if(!winner)process.exitCode=1;
