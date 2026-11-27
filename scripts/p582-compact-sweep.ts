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
const shard=Number(process.env.SHARD??0),start=1+shard*100,end=start+99,rows=[],errors=[];
for(let seed=start;seed<=end;seed++)for(const files of [1000,1400]){
 const c=config(seed,files);
 try{rows.push(score(c,make(c)))}catch(e){errors.push({seed,files,error:String(e)})}
 if(seed%20===0&&files===1400)console.log('HF582_SWEEP_PROGRESS',shard,seed,rows.length,errors.length);
}
fs.mkdirSync('compact',{recursive:true});
fs.writeFileSync('compact/shard-'+shard+'.json',JSON.stringify({rows,errors}));
console.log('HF582_SWEEP',JSON.stringify({shard,start,end,attempts:200,valid:rows.length,errors:errors.length,top:[...rows].sort((a,b)=>b.base-a.base).slice(0,3)}));
