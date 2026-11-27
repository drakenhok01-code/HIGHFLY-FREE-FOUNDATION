// Native population exporter: exact P575 geography/seed, upstream walk graph and 24h plans.
import fs from 'node:fs';
import path from 'node:path';
import {hexIsland} from '../guildhall/packages/world/src/hex/island.ts';
import {hexZones} from '../guildhall/packages/world/src/hex/zones.ts';
import {hexWorld,LEVEL_STEP} from '../guildhall/packages/world/src/hex/world.ts';
import {installTilePrefabs} from '../guildhall/packages/world/src/hex/tiles.ts';
import {NATURE_CHOSEN} from '../guildhall/packages/world/src/hex/nature.ts';
import {hexWalk} from '../guildhall/packages/world/src/hex/walk.ts';
import {lifePlaces,planFolk,workTiles,lifePose} from '../guildhall/packages/world/src/hex/life.ts';
import {planStocks,routineSample,routineClock} from '../guildhall/packages/world/src/hex/routines.ts';
const root=process.cwd(),up=path.join(root,'guildhall/data'),out=path.join(root,'dist/highfly/living-p580');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(name,v)=>fs.writeFileSync(path.join(out,name),JSON.stringify(v));
fs.mkdirSync(out,{recursive:true});
installTilePrefabs(fs.readdirSync(up+'/tiles').filter(f=>f.endsWith('.json')).map(f=>read(up+'/tiles/'+f)));
const recipes=Object.fromEntries(fs.readdirSync(up+'/npcs').filter(f=>f.endsWith('.json')).map(f=>{const r=read(up+'/npcs/'+f);return [r.id,r]}));
write('recipes.json',recipes);
const selected=[
 {seed:1,city:"sylvaris",sourceSeed:352,files:3000,coast:.85,hills:4,rain:1.4,forest:.42,woods:.85,wild:1.1,tree:1.6,pine:1.6},
 {seed:2,city:"arvelia",sourceSeed:3,files:8000,coast:.75,hills:3,rain:1.25,forest:.08,woods:.35,wild:.45,tree:1.1,pine:1.1},
 {seed:3,city:"puertaria",sourceSeed:258,files:3000,coast:1.7,hills:5,rain:3,forest:0,woods:.1,wild:.1,tree:.65,pine:.65},
 {seed:4,city:"valdoria",sourceSeed:67,files:3000,coast:.6,hills:1,rain:1.7,forest:.025,woods:.15,wild:.2,tree:1,pine:1},
 {seed:5,city:"auralis",sourceSeed:33,files:8000,coast:1.2,hills:6,rain:2.45,forest:.18,woods:.45,wild:.65,tree:1.35,pine:1.35},
 {seed:6,city:"lumeria",sourceSeed:60,files:3000,coast:1.05,hills:2,rain:1.25,forest:.025,woods:.15,wild:.2,tree:1,pine:1},
 {seed:7,city:"ferrondral",sourceSeed:34,files:4000,coast:.85,hills:9,rain:.3,forest:0,woods:.1,wild:.1,tree:.75,pine:.75,rock:1.4},
 {seed:8,city:"valtheria",sourceSeed:16,files:3000,coast:1.1,hills:7,rain:.65,forest:.025,woods:.15,wild:.25,tree:1,pine:1}
];
const report=[];
for(const p of selected){
 const {seed,sourceSeed,city,files,coast,hills,rain,forest,...n}=p,nature={...NATURE_CHOSEN,...n};
 const h=hexIsland({seed:sourceSeed,files,coast,hills,rain,forest}),z=hexZones(h,{wild:nature.wild}),w=hexWorld(h,z,{step:LEVEL_STEP,nature,regions:true});
 const exact=read('dist/highfly/regions-p575/island-'+seed+'.json');
 if(exact.sourceSeed!==sourceSeed||w.pieces.length!==exact.pieces.length||w.tiles.length!==exact.tiles.length)throw Error('P575 native generation mismatch '+city);
 const graph=hexWalk(h,z,w,{reach:workTiles(h,z)}),places=lifePlaces(h,z,w,graph,{heroSpots:3});
 const folk=planFolk(h,z,w,graph,{seed:sourceSeed,pace:144,places,secPerHour:180});
 if(!folk.length||new Set(folk.map(f=>f.id)).size!==folk.length)throw Error('Invalid population '+city);
 const roles={},props=new Set(),clips=new Set(),routines=new Set();let walks=0,stays=0,indoors=0,work=0;
 for(const f of folk){
  if(!recipes[f.role]||!f.day.length)throw Error('Unknown role or empty day '+f.role);
  roles[f.role]=(roles[f.role]??0)+1;
  if(f.prop)props.add(f.prop);
  for(const step of f.day){if(step.kind==='walk'){walks++;if(step.carry)props.add(step.carry);if(step.pts.length!==step.times.length||step.pts.length<2)throw Error('Invalid walk '+city)}else{stays++;if(step.indoors)indoors++;if(step.act==='work')work++;if(step.clip)clips.add(step.clip);if(step.prop)props.add(step.prop);if(step.routine){routines.add(step.routine.id);for(let t=0;t<90;t+=.5){const sample=routineSample(step.routine,t);clips.add(sample.clip);for(const q of sample.props)if(q)props.add(q);if(sample.carry)props.add(sample.carry)}}}
  }
  for(let hour=0;hour<24;hour+=.25){const pose=lifePose(f.day,hour,24);if(!pose.at.every(Number.isFinite)||!Number.isFinite(pose.facing))throw Error('Invalid native pose '+city)}
 }
 const stocks=planStocks(folk);
 const summary={seed,sourceSeed,city,files,population:folk.length,roles,walks,stays,indoors,work,stocks:stocks.length,nodes:graph.nodes.length,edges:graph.edges.length,routines:[...routines].sort(),props:[...props].sort(),clips:[...clips].sort()};
 write('region-'+seed+'.json',{schema:'hf-guildhall-life-v1',sourceCommit:'ef56b1cdf247f8839bf7fbb289713b15dbacae8c',seed,sourceSeed,city,folk,stocks,summary});
 report.push(summary);console.log('HF580_POPULATION '+JSON.stringify(summary));
}
write('index.json',{schema:1,sourceCommit:'ef56b1cdf247f8839bf7fbb289713b15dbacae8c',regions:report,population:report.reduce((n,r)=>n+r.population,0)});
