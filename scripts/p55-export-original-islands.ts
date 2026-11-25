// HIGHFLY P5.5: immutable original Guildhall region exports. No NPCs.
// Build from pinned upstream checkout; authored 83 prefabs, original generator, exact transforms.
import fs from 'node:fs';
import path from 'node:path';
import {hexIsland,kindOf} from '../../guildhall/packages/world/src/hex/island.ts';
import {hexZones} from '../../guildhall/packages/world/src/hex/zones.ts';
import {hexWorld,LEVEL_STEP} from '../../guildhall/packages/world/src/hex/world.ts';
import {installTilePrefabs,HEX_TILE_SIZE} from '../../guildhall/packages/world/src/hex/tiles.ts';
import {hexGroundMesh} from '../../guildhall/packages/world/src/hex/ground.ts';
import {hexStructures} from '../../guildhall/packages/world/src/hex/structures.ts';
import {NATURE_CHOSEN} from '../../guildhall/packages/world/src/hex/nature.ts';
const root=process.cwd(),out=path.join(root,'dist/HIGHFLY-FREE-FOUNDATION/preview-p55/highfly/regions');
fs.mkdirSync(out,{recursive:true});
const dir=path.join(root,'guildhall/data/tiles');
const tiles=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
installTilePrefabs(tiles);
const palette={top:{grass:[112,156,64],soil:[150,112,70],dirt:[196,160,108],paved:[196,186,166],sand:[232,210,150],rock:[150,140,128],cliff:[140,128,112],water:[150,128,92]},side:{rock:[118,110,100],cliff:[118,110,100],sand:[178,144,98],water:[90,120,140]},sideLand:[122,90,60],slope:[232,210,150]};
const all=[],ids=new Set(),json=(name,obj)=>fs.writeFileSync(path.join(out,name),JSON.stringify(obj));
for(let seed=1;seed<=8;seed++){
 const h=hexIsland({seed,files:30000}),z=hexZones(h,{wild:NATURE_CHOSEN.wild}),w=hexWorld(h,z,{step:LEVEL_STEP,nature:NATURE_CHOSEN,regions:true});
 const pools=w.tiles.filter(t=>t.ground==='water'&&t.top-.14>-.05),pooled=new Set(pools.map(t=>t.i));
 const sunk={...w,tiles:w.tiles.map(t=>pooled.has(t.i)?{...t,top:t.top-.55}:t)};
 const ground=hexGroundMesh(h,sunk,palette),structures=hexStructures(w,seed);
 const land=w.tiles.filter(t=>t.ground!=='water');
 const bounds={minX:Math.min(...land.map(t=>t.x))-HEX_TILE_SIZE,maxX:Math.max(...land.map(t=>t.x))+HEX_TILE_SIZE,minZ:Math.min(...land.map(t=>t.z))-HEX_TILE_SIZE,maxZ:Math.max(...land.map(t=>t.z))+HEX_TILE_SIZE};
 const pieces=w.pieces;pieces.forEach(p=>ids.add(p.piece));
 const region={schema:'hf-original-guildhall-region-v1',sourceCommit:'ef56b1cdf247f8839bf7fbb289713b15dbacae8c',seed,files:30000,step:LEVEL_STEP,scale:1.82/(2.2*.47),tileRadius:HEX_TILE_SIZE,bounds,tiles:w.tiles.map(t=>({...t,q:h.grid.q[t.i],r:h.grid.r[t.i],kind:kindOf(h,t.i)})),pieces,paths:w.paths,stairs:w.stairs,bridges:w.bridges,decks:w.decks,doorways:w.doorways,board:w.board,zones:z.zones,roads:z.roads,rivers:h.rivers,pools:pools.map(t=>({x:t.x,z:t.z,y:t.top-.14,i:t.i})),ground:{position:Array.from(ground.position),color:Array.from(ground.color)},structures:{position:Array.from(structures.position),color:Array.from(structures.color)},stats:{land:h.stats.land,tiles:w.tiles.length,pieces:pieces.length,buildings:z.stats.buildings,fields:z.stats.fields,roadTiles:z.stats.roadTiles,bridges:w.bridges.length,rivers:h.rivers.length,waterTiles:pools.length,wheat:pieces.filter(p=>/wheat/.test(p.piece)).length,boats:pieces.filter(p=>/boat|ship|canoe/.test(p.piece)).length,uniqueModels:new Set(pieces.map(p=>p.piece)).size},npc:[]};
 json('island-'+seed+'.json',region);
 const summary={seed,bounds,scale:region.scale,stats:region.stats};all.push(summary);console.log('HF55_ISLAND '+JSON.stringify(summary));
}
json('source-index.json',{schema:'hf-original-guildhall-index-v1',sourceCommit:'ef56b1cdf247f8839bf7fbb289713b15dbacae8c',sourcePrefabs:tiles.length,regions:all,requiredModels:[...ids].sort()});
