import test from 'node:test';
import assert from 'node:assert/strict';
import {QUESTS} from '../.work/unsung/src/game/quests.js';
test('F0.13 pinned narrative includes Spanish in real 18 quest chains without rewriting IDs',()=>{
 assert.equal(QUESTS.length,18);
 for(const q of QUESTS){
  assert.ok(q.offer.length&&q.wait.length&&q.done.length);
  assert.ok(!/^(Find |Reach |Clear |Set |Gather |Open |Break |Swim |Ring |Win |Answer )/.test(q.verb),
    q.id+' has an English objective: '+q.verb);
  assert.ok(!/^Do you |^You have |^I cannot |^I am drawing |^The archive /.test(q.offer[0]),
    q.id+' first dialogue is untranslated');
 }
});
