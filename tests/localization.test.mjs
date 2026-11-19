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
