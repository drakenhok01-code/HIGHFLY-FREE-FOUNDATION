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
const make=(c)=>{const h=hexIsland({seed:c.seed,files:c.files,coast:c.coast,hills:c.hills,rain:c.rain,forest:c.forest}),nature={...NATURE_CHOSEN,woods:c.woods,wild:c.wild,tree:c.tree,pine:c.tree},z=hexZones(h,{wild:nature.wild}),w=hexWorld(h,z,{step:c.step,nature});return {h,z,w}};
const config=(seed,files)=>({seed,files,coast:.85,hills:0,step:.2,rain:1.8,forest:.12,woods:.35,wild:.5,tree:1});
const url=(c,city)=>'https://guildhall.codestz.dev/town/'+c.seed+'?'+new URLSearchParams({...Object.fromEntries(Object.entries(c).filter(([k])=>k!=='seed').map(([k,v])=>[k,String(v)])),pine:String(c.tree),life:'1',hour:'13',name:city}).toString();
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
if(process.env.HF582_RANK==='1'){
 const rows=fs.readdirSync('compact').filter(f=>/^shard-\d+\.json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync('compact/'+f,'utf8')).rows);
 const used=new Set(),winners=[],details=[];
 const eligible=rows.filter(r=>r.tier>=2&&r.walls>0&&r.board&&r.graveyard&&r.counts.harbour>0&&r.mouths>0);
 for(const [city,focus] of Object.entries(themes)){
  const ordered=eligible.filter(r=>!used.has(r.config.seed)).map(r=>({...r,rank:r.base+focus.reduce((n,k)=>n+(r.counts[k]?45+Math.min(6,r.counts[k])*5:0),0)})).sort((a,b)=>b.rank-a.rank||a.config.files-b.config.files||a.config.seed-b.config.seed);
  let winner=null;
  for(const row of ordered.slice(0,12))try{
   const {h,z,w}=make(row.config),graph=hexWalk(h,z,w,{reach:workTiles(h,z)}),places=lifePlaces(h,z,w,graph,{heroSpots:3});
   const folk=planFolk(h,z,w,graph,{seed:row.config.seed,pace:144,places,secPerHour:180});
   const hearts=graph.hearts.filter(n=>n>=0),connected=hearts.length>0&&hearts.length===z.zones.length&&hearts.every(n=>graph.route(hearts[0],n)!==null);
   const poses=folk.length>0&&folk.every(f=>f.day.length>0&&[0,6,9,13,18,22].every(hour=>lifePose(f.day,hour,24).at.every(Number.isFinite)));
   details.push({city,seed:row.config.seed,files:row.config.files,connected,poses,population:folk.length});
   if(!connected||!poses)continue;
   const roles={};for(const f of folk)roles[f.role]=(roles[f.role]??0)+1;
   winner={city,...row,population:folk.length,roles,connected,poses,url:url(row.config,city)};break;
  }catch(e){details.push({city,seed:row.config.seed,error:String(e)})}
  if(winner){used.add(winner.config.seed);winners.push(winner);console.log('HF582_WINNER '+JSON.stringify(winner))}else console.warn('HF582_NO_WINNER '+city);
 }
 const result={sourceCommit:'ef56b1cdf247f8839bf7fbb289713b15dbacae8c',attempts:800,valid:rows.length,eligible:eligible.length,required,winners,details};
 fs.writeFileSync('compact/results.json',JSON.stringify(result,null,2));
 const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 fs.writeFileSync('compact/index.html','<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HIGHFLY Compact Kingdoms</title><style>body{background:#151120;color:#efe4cb;font:16px system-ui;margin:24px}main{max-width:1000px;margin:auto}article{border:1px solid #66517f;border-radius:12px;padding:18px;margin:12px 0}a{color:#d2b9ff}small{color:#b9aecb}</style><main><h1>HIGHFLY · Compact Kingdoms</h1><p>'+rows.length+' configuraciones válidas de 800 intentos. '+eligible.length+' candidatas con requisitos mínimos. La lista indica servicios faltantes y no sustituye una prueba física en Unsung.</p>'+winners.map(w=>'<article><h2>'+esc(w.city)+'</h2><p>Semilla '+w.config.seed+' · files '+w.config.files+' · '+w.coverage+'/'+w.required+' familias · '+w.land+' casillas · '+w.population+' habitantes · '+w.stairs+' escaleras · '+w.bridges+' puentes</p><p>Faltantes: '+esc(w.missing.join(', ')||'ninguno')+'</p><a href="'+esc(w.url)+'">Abrir isla original 3D en Guildhall</a></article>').join('')+'<p><small>Los mapas son del generador original. La integración plana personalizada, faros de HIGHFLY y validación Android son posteriores.</small></p></main></html>');
 console.log('HF582_RESULT '+JSON.stringify({valid:rows.length,eligible:eligible.length,winners:winners.length,allComplete:winners.filter(w=>w.missing.length===0).length}));
 if(winners.length!==8)process.exitCode=1;
}else{
const shard=Number(process.env.SHARD??0),start=1+shard*100,end=start+99,rows=[],errors=[];
for(let seed=start;seed<=end;seed++)for(const files of [1000,1400]){
 const c=config(seed,files);
 try{rows.push(score(c,make(c)))}catch(e){errors.push({seed,files,error:String(e)})}
 if(seed%20===0&&files===1400)console.log('HF582_SWEEP_PROGRESS',shard,seed,rows.length,errors.length);
}
fs.mkdirSync('compact',{recursive:true});
fs.writeFileSync('compact/shard-'+shard+'.json',JSON.stringify({rows,errors}));
console.log('HF582_SWEEP',JSON.stringify({shard,start,end,attempts:200,valid:rows.length,errors:errors.length,top:[...rows].sort((a,b)=>b.base-a.base).slice(0,3)}));

}
