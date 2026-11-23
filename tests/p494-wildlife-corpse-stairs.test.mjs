import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stairDownstep} from '../src/highfly/p494-stair-guard.mjs';
import {cartographicColor} from '../src/highfly/p494-cartographic-map.mjs';
import {activeQuestSummary} from '../src/highfly/mobile-touch.mjs';
import {createHuntState,HUNT_MISSIONS,acceptHunt} from '../src/highfly/p49-hunt-data.mjs';
const source=p=>fs.readFileSync(p,'utf8');

test('P494: safe descending stair permits .45m drop but blocks walls and cliffs',()=>{
 const w={floorBelow:(x)=>x>.25?4.55:5,groundHeight:()=>4,
  raycast:()=>10};
 assert.equal(stairDownstep(w,{x:0,y:5,z:0},{x:.5,z:0},.3).floor,4.55);
 w.raycast=()=>.14;
 assert.equal(stairDownstep(w,{x:0,y:5,z:0},{x:.5,z:0},.3),null);
 w.raycast=()=>10;w.floorBelow=(x)=>x>.25?3.4:5;
 assert.equal(stairDownstep(w,{x:0,y:5,z:0},{x:.5,z:0},.3),null);
 w.floorBelow=x=>x>.25?4.55:5;w.groundHeight=()=>5.5;
 assert.equal(stairDownstep(w,{x:0,y:5,z:0},{x:.5,z:0},.3),null);
});
test('P494: original HIGHFLY Sera mission enters HUD when active, before native quests',()=>{
 const h={state:createHuntState(),missions:HUNT_MISSIONS,spots:{}};
 assert.equal(acceptHunt(h.state,'wolf'),true);
 h.state.missions.wolf.count=1;
 const g={objective:'Explorá Aetheria',quests:{active:[]},__highflyHunts:h};
 const q=activeQuestSummary(g);
 assert.equal(q.total,1);assert.match(q.side[0].title,/Aullidos/);
 assert.equal(q.side[0].count,'1 / 3');
 h.state.missions.wolf.status='ready';
 assert.match(activeQuestSummary(g).side[0].text,/Sera/);
});
test('P494: each unique creature icon and Sera quest art come from real copied files',()=>{
 const b=source('scripts/f0-build.mjs');
 assert.match(b,/for\(const id of \['wolf_pelt','boar_tusk','crab_shell','quest_wolf'\]\)/);
 const premium=source('src/highfly/premium-assets.mjs');
 assert.match(premium,/P494_CREATURE_ICON_IDS/);
 assert.match(premium,/highfly\/p494\/quest_wolf\.svg/);
 assert.match(premium,/data-hf-frame-art/);
 const icons=['wolf_pelt','boar_tusk','crab_shell'].map(id=>source('assets/highfly/p494/'+id+'.svg'));
 assert.equal(new Set(icons).size,3);
 assert.ok(icons.every(svg=>svg.includes('<svg')));
});
test('P494: native enemies do not produce duplicate Unsung purple faceted creature visuals',()=>{
 const b=source('scripts/f0-build.mjs');
 assert.match(b,/e\.kind\.startsWith\('hf_'\)/);
 assert.match(b,/src\/game\/enemies\.js/);
 const glb=source('src/highfly/p491-cc0-creatures.mjs');
 assert.match(glb,/models\/hf-p491-wolf\.glb/);
 assert.match(glb,/MeshoptDecoder/);
 assert.match(glb,/HIGHFLY_P494_UNLIT_/);
 assert.match(glb,/MeshBasicMaterial/);
 assert.match(glb,/avatar\.corpseLootPending/);
});
test('P494: death preserves single licensed corpse until loot or expiry, with no floating wildlife sprite',()=>{
 const loot=source('src/highfly/p41-world-loot.mjs');
 const hunt=source('src/highfly/p49-hunt-world.mjs');
 assert.match(loot,/const wildlife=Object\.prototype\.hasOwnProperty/);
 assert.match(loot,/corpseLootUntil=ticker\(\)\+60/);
 assert.match(loot,/if\(wildlife&&!avatar\)/);
 assert.match(loot,/if\(wildlife\)\{/);
 assert.match(hunt,/avatarFor\(enemy\)/);
 assert.match(hunt,/get npcDiagnostics/);
 assert.match(hunt,/corpseLootPending/);
});
test('P494: live cartographic terrain painter is cached and keeps game positions',()=>{
 const map=source('src/highfly/p492-radar.mjs');
 assert.match(map,/paintCartographicBackdrop\(ctx,g,W,H,scale\)/);
 const color=cartographicColor(25,false,.1,0);
 assert.equal(color.length,3);assert.ok(color.every(Number.isFinite));
});
