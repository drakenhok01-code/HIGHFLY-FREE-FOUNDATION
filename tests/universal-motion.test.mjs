import test from 'node:test';
import assert from 'node:assert/strict';
import {Player} from '../.work/unsung/src/game/player.js';
import {installHighflyDash} from '../.work/unsung/src/game/highfly-dash.mjs';
import {installHighflyUniversalMotion,probeHighflyWall,workTarget,ACTIONS,MOTION}
 from '../.work/unsung/src/highfly/universal-motion.mjs';
import {WEAPON_MODES,weaponMode,WEAPON_ANIMATIONS}
 from '../.work/unsung/src/highfly/universal-gear.mjs';

const ground={
 waterLevel:()=>-1e7,groundHeight:()=>0,floorBelow:()=>0,
 resolveCapsule(p){if(p.y<0){p.y=0;return true;}return p.y<=.00001}
};
const input=(pressed=[],held=[],x=0,y=0)=>({
 move:{x,y},pressed:new Set(pressed),held:new Set(held),look:{x:0,y:0}
});
function player(world=ground){
 const p=new Player(world);installHighflyDash(p);installHighflyUniversalMotion(p);
 p.spawn(0,0,0);p.grounded=true;return p;
}
test('Universal identity: 1 player, 1 capsule, no class switching',()=>{
 const p=player();
 assert.equal(p._hfUniversalInstalled,true);
 assert.equal(p._highflyDashInstalled,true);
 assert.equal(p.state,'move');assert.equal(p.health,p.healthMax);
});
test('Second jump: initial native jump + one extra 7.05 m/s impulse, NOT a third jump',()=>{
 const p=player();
 p.update(1/60,input(['jump']),0);
 assert.equal(p.grounded,false);
 for(let i=0;i<11;i++)p.update(1/60,input(),0);
 assert.ok(p.airTime>=MOTION.minAirBeforeSecond);
 const stamina=p.stamina;
 p.update(1/60,input(['jump']),0);
 assert.ok(p._hfDoubleUsed,'second jump consumed');
 assert.ok(p.vel.y>6.3,'second upward impulse real');
 assert.ok(p.stamina<stamina,'extra jump costs stamina');
 const vy=p.vel.y;
 p.update(1/60,input(['jump']),0);
 assert.ok(p.vel.y<vy+0.01,'third press cannot reset velocity upward');
});
test('Double jump unavailable from cliff falls and while swimming',()=>{
 const p=player();p.grounded=false;p.pos.y=2;p.airTime=.3;
 p.update(1/60,input(['jump']),0);
 assert.equal(p._hfDoubleUsed,false);
 const water={...ground,waterLevel:()=>3};
 const swimmer=player(water);swimmer.update(1/60,input(['jump']),0);
 assert.equal(swimmer.state,'swim');
 assert.equal(swimmer._hfDoubleUsed,false);
});
test('Conservative wall probe: only close collidable wall enables climbing',()=>{
 const wall={...ground,raycast(origin,dir,max){return .48;}};
 const p=player(wall);
 const hit=probeHighflyWall(p);
 assert.ok(hit?.headBlocked&&!hit.ledge);
 p.update(1/60,input(['climb'],['climb']),0);
 assert.equal(p.state,'hf_climb');
 const start=p.pos.y;
 for(let i=0;i<12;i++)p.update(1/60,input([],['climb'],0,1),0);
 assert.ok(p.pos.y>start+.25,'body climbs up using collision probe and stamina');
 p.update(1/60,input(),0);
 assert.equal(p.state,'move','releasing climb cancels safely');
});
test('Low wall with unobstructed head produces mantle, not wall phasing',()=>{
 const ledge={...ground,
  raycast(origin,dir,max){return origin.y<1.5?.48:max;},
  floorBelow(x,y,z){return .74;}
 };
 const p=player(ledge);
 const check=probeHighflyWall(p);
 assert.equal(check?.ledge,true);assert.ok(check.rise<1.22);
 p.update(1/60,input(['climb'],['climb']),0);
 assert.equal(p.state,'hf_mantle');
 for(let i=0;i<27;i++)p.update(1/60,input(),0);
 assert.equal(p.state,'move');
 assert.ok(p.pos.y>.7,'mantle ended on top of ledge');
});
test('Sit and emotes are mutually exclusive with combat; ATK interrupts them',()=>{
 const p=player();
 p.update(1/60,input(['sit']),0);
 assert.equal(p.state,'hf_action');assert.equal(p._hfAction.name,'sit');
 p.update(1/60,input(['attack']),0);
 assert.equal(p.state,'attack','existing Unsung ATK cancels sitting');
 assert.equal(p.comboStep,0,'original combo 1 remains available');
});
test('Work interactions are only contextual previews; never invent ore or loot',()=>{
 const p=player({...ground,raycast:()=>1.2});
 assert.equal(workTarget(p,'chop'),null);
 assert.equal(workTarget(p,'mine')?.kind,'solid-surface-not-ore');
 p.update(1/60,input(['mine']),0);
 assert.equal(p._hfAction.name,'mine');
 assert.equal(p._hfAction.target?.kind,'solid-surface-not-ore');
 assert.equal(p.inventory,undefined);
});
test('Equipment animation groups support original, two-handed, dual, shield and fists',()=>{
 assert.equal(WEAPON_MODES.length,7);
 assert.deepEqual(WEAPON_MODES.map(x=>x.id),['sword','greatsword','dual','shield','unarmed','spear','staff']);
 for(const [id,clips] of Object.entries(WEAPON_ANIMATIONS))assert.equal(clips.length,3,id);
 const p=player();p.update(1/60,input(['equip']),0);
 assert.equal(p._hfGearCycle,1);
 p.update(1/60,input(['equip']),0);assert.equal(p._hfGearCycle,2);
 assert.equal(weaponMode(4).id,'unarmed');assert.equal(weaponMode(5).style,'spear');assert.equal(weaponMode(6).style,'staff');
});
test('No roll/dash state collision with double jump, climb or social action',()=>{
 const p=player();
 p.update(1/60,input(['dodge']),0);
 assert.equal(p.state,'roll');const start=p.pos.y;
 p.update(1/60,input(['jump','climb','equip']),0);
 assert.equal(p.state,'roll');assert.equal(p._hfDoubleUsed,false);
 assert.equal(p._hfGearCycle,0);
 assert.ok(p.pos.y>=start);
});

test('Sitting/lying keeps its pose until interrupted; not a 3-second timer',()=>{
 const p=player();
 p.update(1/60,input(['sit']),0);
 assert.equal(p.state,'hf_action');
 for(let i=0;i<250;i++)p.update(1/60,input(),0);
 assert.equal(p.state,'hf_action','seated pose must persist');
 assert.equal(p._hfAction.name,'sit');
 p.update(1/60,input(['attack']),0);
 assert.equal(p.state,'attack','ATK cancels sitting and retains Unsung combo');
 for(let i=0;i<60;i++)p.update(1/60,input(),0);
 assert.equal(p.state,'move','native combat recovery returns to locomotion');
 p.update(1/60,input(['lie']),0);
 assert.equal(p.state,'hf_action');
 for(let i=0;i<250;i++)p.update(1/60,input(),0);
 assert.equal(p.state,'hf_action','lying pose must persist');
 p.update(1/60,input(['dodge']),0);
 assert.equal(p.state,'roll','Unsung original roll cancels lying');
});

test('F0.10 emergency DASH: 5s cooldown and zero energy cost',()=>{
 const p=player(),before=p.stamina;
 p.update(1/60,input(['dash']),0);
 assert.equal(p.state,'hf_dash');assert.equal(p.stamina,before);
 assert.ok(p._hfDashCd>4.9);
 for(let i=0;i<18;i++)p.update(1/60,input(),0);
 assert.equal(p.state,'move');
 const remaining=p._hfDashCd;
 p.update(1/60,input(['dash']),0);
 assert.equal(p.state,'move');assert.ok(p._hfDashCd<remaining);
});
test('F0.10 ROLL costs 12 and chooses visual direction',()=>{
 const p=player(),before=p.stamina;
 p.update(1/60,input(['dodge'],[],0,-1),0);
 assert.equal(p.state,'roll');assert.equal(before-p.stamina,12);
 assert.equal(p._hfRollVisual,'backward');
});

test('F0.11 sitting or lying cancels from actual left-stick movement',()=>{
 const p=player();p.update(1/60,input(['sit']),0);
 assert.equal(p.state,'hf_action');
 p.update(1/60,input([],[],.56,0),0);
 assert.equal(p.state,'move');
 p.update(1/60,input(['lie']),0);
 assert.equal(p.state,'hf_action');
 p.update(1/60,input([],[],0,.6),0);
 assert.equal(p.state,'move');
});

test('F0.11.2 jump into valid wall -> attach in air, hold without teleport',()=>{
 const wall={...ground,raycast(origin,dir,max){return origin.x<1.8&&origin.x>-1.8?.48:max;}};
 const p=player(wall);
 p.update(1/60,input(['jump']),0);
 assert.equal(p.grounded,false);
 p.update(1/60,input(['climb'],['climb']),0);
 assert.equal(p.state,'hf_climb');
 const before=p.pos.clone();
 for(let i=0;i<25;i++)p.update(1/60,input([],['climb']),0);
 assert.equal(p.state,'hf_climb','no arbitrary three-second timer');
 assert.ok(p.pos.distanceTo(before)<.12,'holding a wall keeps a stable anchor');
 p.update(1/60,input([],['climb'],.6,.7),0);
 assert.ok(p.pos.x>before.x,'climbing left/right moves laterally');
 assert.ok(p.pos.y>before.y,'up stick climbs up');
 p.update(1/60,input(),0);
 assert.equal(p.state,'move','release means detach');
});
test('F0.11.2 wall jump exits climbing and carries launch velocity',()=>{
 const wall={...ground,raycast:()=>.48};
 const p=player(wall);
 p.update(1/60,input(['climb'],['climb']),0);
 assert.equal(p.state,'hf_climb');
 p.update(1/60,input(['jump'],['climb']),0);
 assert.equal(p.state,'move');assert.ok(p.vel.y>5);
 assert.equal(p._hfDoubleUsed,true,'wall jump cannot grant unintended third jump');
});

test('F0.11.3 circle TAP dash follows hero yaw, not moving left stick or camera',()=>{
 const p=player();p.yaw=Math.PI/2; // hero facing +world X, camera forward +world Z
 const command=input(['dash'],[],0,1);
 command.highflyAbilityAim={dash:null};
 p.update(1/60,command,0);
 assert.equal(p.state,'hf_dash');
 assert.ok(p._hfDashDir.x>.98&&Math.abs(p._hfDashDir.z)<.03);
});
test('F0.11.3 circle TAP roll uses hero facing with running left thumb',()=>{
 const p=player();p.yaw=Math.PI/2;
 const command=input(['dodge'],[],0,1);
 command.highflyAbilityAim={dodge:null};
 p.update(1/60,command,0);
 assert.equal(p.state,'roll');
 assert.ok(p.rollDir.x>.98&&Math.abs(p.rollDir.z)<.03);
 assert.equal(p._hfRollVisual,'forward');
});
test('F0.11.3 independent ability dragging still overrides hero facing',()=>{
 const p=player();p.yaw=Math.PI/2;
 const command=input(['dash'],[],0,1);
 command.highflyAbilityAim={dash:{x:0,y:-1}};
 p.update(1/60,command,0);
 assert.equal(p.state,'hf_dash');
 assert.ok(p._hfDashDir.z<-.98,'drag backward toward camera');
});
