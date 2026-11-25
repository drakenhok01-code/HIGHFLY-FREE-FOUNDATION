import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {EASTBROOK_LAND_SPECS,EASTBROOK_NPCS,buildEastbrookLand,EASTBROOK_MISSIONS} from '../src/highfly/p538-eastbrook-land.mjs';
import {readArveliaQuests,speakArveliaNpc} from '../src/highfly/p538-arvelia-quests.mjs';
const flat=()=>({ok:true,y:35});
test('Arvelia: land-only, no harbor, only free assets, deterministic ids',()=>{
 const result=buildEastbrookLand({canPlace:flat});
 assert.equal(result.complete,true);
 assert.equal(result.major,6);
 assert(result.objects.some(o=>o.highflyNpc==='sera'));
 assert(result.objects.some(o=>o.highflyNpc==='borin'));
 assert(result.objects.some(o=>o.highflyNpc==='galdren'));
 assert(result.objects.some(o=>o.highflyNpc==='mila'));
 assert.equal(new Set(result.objects.map(o=>o.id)).size,result.objects.length);
 assert(result.objects.every(o=>o.y===35&&o.clearTrees===false));
 assert(result.objects.every(o=>Math.hypot(o.x+512,o.z+70)<=115));
 assert(result.objects.every(o=>!/(port|quay|dock|muelle|barco|ship)/i.test(o.type+' '+o.highflyRole)));
 assert.equal(EASTBROOK_LAND_SPECS.filter(o=>o.source).length,5);
 assert.equal(EASTBROOK_NPCS.length,4);
 assert(EASTBROOK_MISSIONS.length>=2);
});
test('Arvelia: empty map unchanged on obstacle/terrain failure',()=>{
 const invalid=buildEastbrookLand({canPlace:()=>({ok:false})});
 assert.equal(invalid.complete,false);assert.deepEqual(invalid.objects,[]);
 assert.match(invalid.reason,/no se hizo ningún cambio/i);
});
test('Arvelia: existing buildings and nearby obstacles are preserved',()=>{
 const before={id:'preexisting',type:'kaykit-tavern',x:-460,z:-110,y:32,yaw:0,scale:1};
 const plan=buildEastbrookLand({existing:[before],canPlace:flat,blockedAt:(x,z)=>false});
 assert.equal(before.x,-460);
 assert(!plan.objects.some(x=>x.id===before.id));
 if(plan.complete)for(const o of plan.objects.filter(o=>!o.type.startsWith('npc-')))
  assert(Math.hypot(o.x-before.x,o.z-before.z)>8);
});
test('Arvelia: no duplication when branch is reloaded',()=>{
 const one=buildEastbrookLand({canPlace:flat});
 const two=buildEastbrookLand({canPlace:flat,existing:one.objects});
 assert.equal(two.duplicate,true);
 assert.deepEqual(two.objects,[]);
});
test('Arvelia: two playable dialogue errands persist and advance',()=>{
 const state=readArveliaQuests({getItem:()=>null});
 let result=speakArveliaNpc('borin',state);
 assert.equal(result.changed,false);
 result=speakArveliaNpc('sera',state);
 assert.equal(result.state.mission,0);assert.equal(result.state.step,1);
 result=speakArveliaNpc('borin',result.state);
 assert.equal(result.state.step,2);
 result=speakArveliaNpc('sera',result.state);
 assert.equal(result.state.mission,1);
 assert(result.state.completed.includes('primer-encargo'));
 result=speakArveliaNpc('galdren',result.state);
 result=speakArveliaNpc('mila',result.state);
 result=speakArveliaNpc('galdren',result.state);
 assert.equal(result.state.mission,2);
 assert(result.state.completed.includes('caminos'));
});
test('Arvelia: build/editor/RPG compatibility and isolated P538 layout key',()=>{
 const build=readFileSync(new URL('../scripts/f0-build.mjs',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../src/highfly/p525-world-forge-3d.mjs',import.meta.url),'utf8');
 const runtime=readFileSync(new URL('../src/highfly/p521-world-forge-runtime.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/highfly/world-forge-3d.html',import.meta.url),'utf8');
 assert(build.includes("'p538-eastbrook-land','p538-arvelia-quests'"));
 assert(editor.includes('loadEastbrookLand({auto:true})'));
 assert(runtime.includes('buildEastbrookLand('));
 assert(runtime.includes('installArveliaQuests('));
 assert(editor.includes("'hf-world-forge-layout-p538-v1'"));
 assert(runtime.includes("'hf-world-forge-layout-p538-v1'"));
 assert(html.includes('id="pilot-eastbrook"'));
 assert(/v=p53[89]/.test(html));
});
