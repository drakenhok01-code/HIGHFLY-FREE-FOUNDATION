import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collectHighflyRadarTargets,radarProject} from '../src/highfly/p492-radar.mjs';

const read=path=>fs.readFileSync(path,'utf8');
test('P492 retains original Unsung NPC/quest engine; KayKit only changes their visual',()=>{
 const build=read('scripts/f0-build.mjs');
 const people=read('src/highfly/p492-kaykit-people.mjs');
 assert.match(build,/p492-kaykit-people\.mjs/);
 assert.match(build,/installHighflyKayKitPeople\(game\)/);
 assert.match(people,/game\.people\.list/);
 assert.match(people,/cloneSkeleton\(gltf\.scene\)/);
 assert.match(people,/n\.root\.add\(holder\)/);
 assert.match(people,/for\(const mesh of a\.n\.meshes\)mesh\.visible=false/);
 assert.doesNotMatch(people,/\.questSave\s*=|\.quests\.state\s*=/);
});
test('P492 radar tracks real quest givers, live spots and story spires',()=>{
 const p={x:0,z:0};
 assert.deepEqual(radarProject(p,{x:145,z:0}).x,83);
 assert.equal(radarProject(p,{x:290,z:0}).edge,true);
 const hunts={spots:{wolf:{point:{x:10,z:20},npc:{x:0,z:30}},
   crab:{point:{x:150,z:25},npc:{x:140,z:28}}},
  missions:{wolf:{npc:'Sera',title:'Lobos',count:3},
   crab:{npc:'Mira',title:'Cangrejos',count:3}},
  state:{missions:{wolf:{status:'active',count:1},crab:{status:'ready',count:3}}}};
 const game={__highflyHunts:hunts,quests:{active:[],state:{}},
  people:{get:()=>null},spires:[{id:'petal',x:250,z:200,tuned:false,name:'Pétalos'}]};
 const targets=collectHighflyRadarTargets(game);
 assert.equal(targets.length,3);
 assert.deepEqual(targets.find(t=>t.id==='hunt:wolf').x,10);
 assert.deepEqual(targets.find(t=>t.id==='hunt:crab').x,140);
 assert.equal(targets.find(t=>t.id==='story:petal').kind,'story');
});
test('P492 camera controls are backed by native sensitivity and invertY settings',()=>{
 const menu=read('src/highfly/premium-rpg.mjs');
 const touch=read('src/highfly/mobile-touch.mjs');
 assert.match(menu,/__hfNativeSettings\.set\('sensitivity',n\)/);
 assert.match(menu,/settings\.set\('invertY',next\)/);
 assert.match(menu,/__hfApplySettings\?\.\(\)/);
 assert.match(touch,/installHighflyRadar\(input,t\)/);
 assert.match(touch,/t\.radar\?\.update\(\)/);
 const build=read('scripts/f0-build.mjs');
 assert.match(build,/window\.__hfNativeSettings=settings/);
});
test('P492 routes native menus through HIGHFLY but keeps original quest giver IDs',()=>{
 const menu=read('src/highfly/premium-rpg.mjs');
 assert.match(menu,/openFromNative:tab=>open\(tab,true\)/);
 assert.match(menu,/d\.menu==='bench'\?'forja'/);
 assert.match(menu,/game\.buy\?\.\(b\.dataset\.hfNativeUpgrade\)/);
 assert.match(menu,/d\.menu==='journal'\?'misiones'/);
 assert.match(menu,/game\.closeMenu\(\)/);
});
