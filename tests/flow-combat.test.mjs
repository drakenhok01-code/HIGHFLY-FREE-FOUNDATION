import test from 'node:test';
import assert from 'node:assert/strict';
import {SECRET_FLOWS,directionFromAim,recordFlowStrike} from '../src/highfly/flow-combat.mjs';
test('Seven weapon-specific SECRET combos with exact directions and strict windows',()=>{
 assert.equal(Object.keys(SECRET_FLOWS).length,7);
 for(const [weapon,sequence] of Object.entries(SECRET_FLOWS)){
  let history=[],completed=false;
  for(let i=0;i<sequence.length;i++){
    const step=recordFlowStrike(history,.4+i*.47,sequence[i],weapon);
    completed=step.secret;history=step.history;
    assert.equal(step.accepted,true,weapon+' '+i);
    if(i<sequence.length-1)assert.equal(completed,false,weapon+' early');
  }
  assert.equal(completed,true,weapon+' secret triggers exactly on final step');
  assert.deepEqual(history,[],weapon+' secret clears buffer');
 }
});
test('Mistakes, timing failures, and plain ATK never unlock a hidden combo',()=>{
 let history=[];
 let x=recordFlowStrike(history,0,'right','sword');history=x.history;
 x=recordFlowStrike(history,.47,'up','sword');assert.equal(x.secret,false);assert.equal(x.accepted,false);
 history=x.history;
 x=recordFlowStrike(history,.9,'left','sword');assert.equal(x.secret,false);
 history=recordFlowStrike([],0,'right','sword').history;
 x=recordFlowStrike(history,2,'left','sword');assert.equal(x.accepted,false,'late input is not counted');
 x=recordFlowStrike(history,.05,'left','sword');assert.equal(x.accepted,false,'early input is not counted');
 assert.deepEqual(recordFlowStrike(history,.47,null,'sword').history,[],'unaimed ATK resets secret sequence');
});
test('Direction is chosen by ATK swipe, independent of running-stick coordinates',()=>{
 assert.equal(directionFromAim(null),null);
 assert.equal(directionFromAim({x:0,y:0}),null);
 assert.equal(directionFromAim({x:1,y:.1}),'right');
 assert.equal(directionFromAim({x:-.9,y:0}),'left');
 assert.equal(directionFromAim({x:.1,y:.95}),'up');
 assert.equal(directionFromAim({x:0,y:-1}),'down');
});
