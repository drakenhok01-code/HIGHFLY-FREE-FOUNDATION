import test from 'node:test';
import assert from 'node:assert/strict';
import {QUEST_ART_IDS,questArtData,questArtwork} from '../src/highfly/quest-art.mjs';
import {SKILL_ICON_IDS,skillIcon} from '../src/highfly/premium-skill-art.mjs';
import {premiumArt} from '../src/highfly/premium-assets.mjs';
import {ITEM_DEFS} from '../src/highfly/rpg-core.mjs';
import {EXTRA_ICON_IDS} from '../src/highfly/premium-extra-art.mjs';

test('F0.14.9 every original Unsung quest has distinct ID-keyed static illustration',()=>{
 const required=['scales','amber','kept','nine','answer','vellum2','count2','names','rings',
  'vellum','count','seeds','stair','voices','lamps','water','debt','windfall'];
 assert.equal(QUEST_ART_IDS.length,19,'18 native quests and one main route');
 for(const id of ['primary',...required]){
  assert.ok(QUEST_ART_IDS.includes(id),'missing mission art '+id);
  const q=questArtData(id);
  assert.equal(q.id,id);
  assert.ok(q.alt.length>12);
  assert.ok(q.subject.length>=3);
  const picture=questArtwork(id);
  assert.ok(picture.includes('data-hf-quest-art="'+id+'"'));
  assert.ok(picture.includes('role="img"'));
  assert.ok(picture.includes('hf-rpg-quest-scenery'));
  assert.ok(!picture.includes('hf-rpg-quest-emblem'),'Geometric emblem should not obscure the approved painting');
  assert.ok(picture.includes(q.alt),'alt should identify the actual mission artwork');
 }
 assert.equal(new Set(required.map(id=>questArtData(id).alt)).size,required.length);
 assert.equal(questArtData('unknown').id,'primary','Unknown quest IDs use a safe fall-back');
});
test('F0.14.9 every real item has a centred premium icon, no generic fallback',()=>{
 for(const item of Object.values(ITEM_DEFS)){
  assert.ok(premiumArt(item.icon),item.id+' uses missing premium icon '+item.icon);
 }
 assert.ok(EXTRA_ICON_IDS.includes('fish'));
 assert.ok(EXTRA_ICON_IDS.includes('ingot'));
 assert.ok(EXTRA_ICON_IDS.includes('expansion'));
 const mana=premiumArt('mana');
 assert.match(mana,/hf-rpg-potion-approved/);
});
test('F0.14.9 real abilities use different SVG gradients and centred icon art',()=>{
 assert.equal(SKILL_ICON_IDS.length,6);
 for(const id of SKILL_ICON_IDS){
  const svg=skillIcon(id);
  assert.match(svg,new RegExp('id="hfSkillFill-'+id+'"'));
  assert.match(svg,new RegExp('url\\(#hfSkillFill-'+id+'\\)'));
  assert.ok(svg.includes('viewBox="0 0 100 100"'));
  assert.ok(svg.includes('<path')||svg.includes('<ellipse')||svg.includes('<circle'));
 }
 assert.ok(!skillIcon('attack').includes('hfSkillFill-roll'));
 assert.notEqual(skillIcon('dash'),skillIcon('roll'));
});
