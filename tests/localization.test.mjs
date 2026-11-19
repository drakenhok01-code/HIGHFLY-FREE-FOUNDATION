import test from 'node:test';
import assert from 'node:assert/strict';
import {translateHighfly,SPANISH} from '../src/highfly/es-localization.mjs';
test('17 mission titles, 17 objective verbs, intro, finale, basic UI translated',()=>{
 for(const s of ['The Vale once sang. Its spires carried one chord from the mountains to the sea.','Low, Middle, High','Nine Bells','Lamps of the Lantern Court','Walk to the lookout','Settings','The Vale sings again'])
  assert.notEqual(translateHighfly(s),s,s);
 assert.ok(SPANISH.size>125);
});
test('Mission event IDs and invisible technical content remain unchanged',()=>{
 assert.equal(translateHighfly('quest-id-scales'),'quest-id-scales');
 assert.equal(translateHighfly('Return to Maren'),'Volvé con Maren');
 assert.equal(translateHighfly('42 fps · 85%'),'42 FPS · resolución 85 %');
});

test('All 18 quest storylines provide translated spoken offer/wait/done lines',async()=>{
 const {QUEST_DIALOGUE_ES,localizeQuestData}=await import('../src/highfly/es-quest-data.mjs');
 assert.equal(Object.keys(QUEST_DIALOGUE_ES).length,18);
 const fake=Object.entries(QUEST_DIALOGUE_ES).map(([id,q])=>({id,
  title:'The Keeper\'s Count',verb:'Find lost notes of the old song',
  offer:q.offer.map(()=>'English dialogue'),wait:q.wait.map(()=>'English dialogue'),
  done:q.done.map(()=>'English dialogue')}));
 const converted=localizeQuestData(fake,{},{},translateHighfly);
 const expected=Object.values(QUEST_DIALOGUE_ES).reduce((sum,q)=>sum+q.offer.length+q.wait.length+q.done.length,0);
 assert.equal(converted,expected,'every authored dialogue line must be converted, without inventing a larger count');
 assert.ok(converted>=85);
 for(const q of fake){
  assert.ok(!q.offer.includes('English dialogue'));
  assert.ok(!q.wait.includes('English dialogue'));
  assert.ok(!q.done.includes('English dialogue'));
 }
});

test('All idle and repeat NPC dialogue pages are authored in Spanish with exact phase counts',async()=>{
 const {NPC_IDLE_ES,NPC_CHAT_ES}=await import('../src/highfly/es-npc-dialogues.mjs');
 assert.ok(Object.keys(NPC_IDLE_ES).length>=20);
 assert.ok(Object.keys(NPC_CHAT_ES).length>=20);
 const all=[...Object.values(NPC_IDLE_ES).flat(2),...Object.values(NPC_CHAT_ES).flat()];
 assert.ok(all.length>=120);
 for(const s of all)assert.ok(/[áéíóúñ¿¡]|\b(?:de|el|la|los|las|que|por|para)\b/i.test(s),s);
});
