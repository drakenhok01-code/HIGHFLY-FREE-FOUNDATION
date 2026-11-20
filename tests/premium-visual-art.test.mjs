import assert from 'node:assert/strict';
import {test} from 'node:test';
import {premiumVectorArt,PREMIUM_VECTOR_IDS} from '../src/highfly/premium-vector-art.mjs';
import {questIllustration,QUEST_ART_KEYS} from '../src/highfly/premium-quest-illustrations.mjs';
const items=['hp_potion','mp_potion','herb','ore','wood','fish','ingot','blade_blank','seed','bag_upgrade','training_sword','training_shield','training_greatsword'];
const professions=['recoleccion','mineria','tala','pesca','cocina','alquimia','fundicion','forja'];
const slots=['helmet','chest','gloves','right_hand','necklace','shoulders','pants','boots','left_hand','ring'];
test('13 item IDs render dedicated scalable SVG artwork with no baked menu frame',()=>{
 for(const id of items){const s=premiumVectorArt('item_'+id);assert.ok(s?.startsWith('<svg '),id);assert.ok(s.includes('viewBox="0 0 100 100"'),id);assert.ok(s.includes('data-hf-art-id="item_'+id+'"'),id);assert.equal(s.includes('background-size:500%'),false,id);}
});
test('8 profession IDs and 10 empty equipment slots have distinct assets',()=>{
 for(const id of professions)assert.ok(premiumVectorArt('profession_'+id),id);
 for(const id of slots)assert.ok(premiumVectorArt('slot_'+id),id);
 assert.ok(PREMIUM_VECTOR_IDS.length>=31);
});
test('19 real quest keys yield different semantic illustrations with no fake UI',()=>{
 assert.equal(QUEST_ART_KEYS.length,19);
 const all=QUEST_ART_KEYS.map(k=>questIllustration(k,k));
 assert.equal(new Set(all).size,19);
 for(const x of all){assert.ok(x.startsWith('<svg '));assert.ok(x.includes('role="img"'));assert.equal(x.includes('OBJETIVO ·'),false);}
});
test('quest title is escaped safely in the accessible scene label',()=>{
 const result=questIllustration('names','test "<script>&');
 assert.ok(!result.includes('"<script>'));
 assert.ok(result.includes('&lt;script>'));
});