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
 assert.equal(p.state,'hf_climb','releasing touch must KEEP the grip');
 p.update(1/60,input(['climb']),0);
 assert.equal(p.state,'move','second tap releases grip');
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
 assert.ok(p.pos.x<before.x,'screen-right joystick follows native Unsung negative-X basis');
 assert.ok(p.pos.y>before.y,'up stick climbs up');
 p.update(1/60,input(),0);
 assert.equal(p.state,'hf_climb','grip persists without hold');
 p.update(1/60,input(['climb']),0);
 assert.equal(p.state,'move','second tap detaches');
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

test('F0.11.4 rocky wall sweep follows wavering collision without phantom gravity',()=>{
 const rock={...ground,raycast(origin,dir,max){
   const d=.50+.14*Math.sin(origin.y*4);
   return origin.y<7.5?d:max;
 }};
 const p=player(rock);
 p.update(1/60,input(['climb']),0);
 assert.equal(p.state,'hf_climb');
 let before=p.pos.y,nonFinite=0;
 for(let i=0;i<190;i++){
  p.update(1/60,input([],[],0,1),0);
  if(!Number.isFinite(p.pos.y))nonFinite++;
 }
 assert.equal(nonFinite,0);
 assert.equal(p.state,'hf_climb','rock retains anchor across varying depths');
 assert.ok(p.pos.y>before+3.5,'climb gains real height');
 assert.ok(p.stamina<100,'stamina consumed while moving');
});
test('F0.11.4 climbing an untagged tree collider is allowed',()=>{
 const trunk={...ground,caps:new Float32Array([0,0,.58,0,6,.58,.35]),
  raycast(origin,dir,max){return origin.y<6?.47:max;}};
 const p=player(trunk);
 p.update(1/60,input(['climb']),0);
 assert.equal(p.state,'hf_climb');
 for(let i=0;i<70;i++)p.update(1/60,input([],[],0,1),0);
 assert.ok(p.pos.y>1.4,'tree physical trunk supports climbing');
});
test('F0.11.4 clipping blocked by terrain must freeze climb-arm walk input',()=>{
 const blocked={...ground,raycast:()=>.48,
  resolveCapsule(pos){pos.y=0;return true;}};
 const p=player(blocked);p.update(1/60,input(['climb']),0);
 assert.equal(p.state,'hf_climb');
 for(let i=0;i<10;i++)p.update(1/60,input([],[],0,1),0);
 assert.equal(p.pos.y,0);
 assert.equal(p._hfClimbInput.y,0,'limbs animate ACTUAL height not desired joystick');
});
test('F0.11.4 climbing is cancelled immediately by wall jump and never by joystick release',()=>{
 const wall={...ground,raycast:()=>.48},p=player(wall);
 p.update(1/60,input(['climb']),0);
 for(let i=0;i<80;i++)p.update(1/60,input(),0);
 assert.equal(p.state,'hf_climb');
 const y=p.pos.y;
 p.update(1/60,input(['jump']),0);
 assert.equal(p.state,'move');
 assert.ok(p.vel.y>5);
 assert.equal(p._hfDoubleUsed,true);
 assert.ok(p.pos.y>=y);
});
test('F0.11.5 original Unsung combo attacks with real movement, one physics capsule',()=>{
 const p=player(),start=p.pos.clone();
 p.update(1/60,input(['attack'],[],0,1),0);
 assert.equal(p.state,'attack');
 assert.equal(p.comboStep,0);
 for(let i=0;i<8;i++)p.update(1/60,input([],[],0,1),0);
 assert.ok(p.pos.z>start.z+.25,'attack while walking makes real forward progress');
 assert.ok(p._hfAttackTravelSpeed>.6,'attack movement computed from native collision');
 assert.equal(p._hfAttackSteering,true);
 assert.equal(p.attack.t,.46,'native Unsung combo time remains pinned');
 assert.equal(p.attack.hit[0],.14,'native damage window unchanged');
 for(let i=0;i<25;i++)p.update(1/60,input(),0);
 assert.ok(p.pos.z>start.z);
});
test('F0.11.5 stationary attack does not trigger fake running legs',()=>{
 const p=player();p.update(1/60,input(['attack']),0);
 assert.equal(p.state,'attack');assert.equal(p._hfAttackSteering,false);
 p.update(1/60,input(),0);
 assert.equal(p._hfAttackSteering,false);
 assert.equal(p.comboStep,0);
});
test('F0.11.5 moving attack stops at an obstacle without teleport',()=>{
 const wall={...ground,resolveCapsule(pos){
  if(pos.z>.44)pos.z=.44;
  if(pos.y<0)pos.y=0;
  return pos.y<=.00001;
 }};
 const p=player(wall);
 for(let i=0;i<20;i++)p.update(1/60,input(i===0?['attack']:[],[],0,1),0);
 assert.ok(p.pos.z<=.441,'native world capsule stops at wall');
 assert.equal(p.state,'attack');
});
test('F0.11.5 water buoyancy is finite and swim exits on dry/shallow shore',()=>{
 let dry=false;
 const water={...ground,waterLevel:()=>dry?-Infinity:3};
 const p=player(water);p.update(1/60,input(),0);
 assert.equal(p.state,'swim');
 for(let i=0;i<180;i++){
  p.update(1/60,input([],[],0,1),0);
  assert.ok(Number.isFinite(p.pos.y)&&Number.isFinite(p.vel.y));
 }
 assert.ok(p.pos.y>1&&p.pos.y<3,'player afloat, neither sinking nor flying');
 dry=true;
 for(let i=0;i<80&&p.state==='swim';i++)p.update(1/60,input(),0);
 assert.equal(p.state,'move','water exit returns locomotion');
});
test('F0.11.5 shallow water never enters swimming',()=>{
 const p=player({...ground,waterLevel:()=>.7});
 for(let i=0;i<30;i++)p.update(1/60,input([],[],0,1),0);
 assert.notEqual(p.state,'swim');
});

test('F0.11.6 hold ATK chains multiple REAL Unsung 1-2-3 strikes without blocking movement',()=>{
 const p=player(),startZ=p.pos.z;
 for(let frame=0;frame<230;frame++)p.update(1/60,input([],['attack'],0,1),0);
 const swings=(p.events??[]).filter(e=>e.type==='swing');
 assert.ok(swings.length>=5,'a held attack must continue for multiple combo cycles: '+swings.length);
 assert.deepEqual(swings.slice(0,3).map(e=>e.index),[0,1,2],'original three-step combo preserved');
 assert.ok(p.pos.z>startZ+2.2,'actor travels while sustaining repeated strikes');
 assert.equal(p._hfUniversalInstalled,true,'one player controller');
});
test('F0.11.6 BUCEAR descends under surface without passing through the seabed and resurfaces',()=>{
 const w={...ground,waterLevel:()=>3};
 const p=player(w);
 for(let i=0;i<210;i++)p.update(1/60,input(),0);
 assert.equal(p.state,'swim');
 const top=p.pos.y;
 p.update(1/60,input(['dive']),0);
 assert.equal(p._hfDive,true);
 for(let i=0;i<95;i++)p.update(1/60,input(),0);
 assert.ok(p.pos.y<top-.40,'diving produces real downward motion');
 assert.ok(p.pos.y>=.68-1e-3,'diving never enters terrain floor');
 p.update(1/60,input(['dive']),0);
 assert.equal(p._hfDive,false);
 for(let i=0;i<150;i++)p.update(1/60,input(),0);
 assert.ok(p.pos.y>top-.30,'buoyancy returns swimmer near surface');
});
test('F0.11.6 waterline near a wall can activate climbing without standing up',()=>{
 const w={...ground,waterLevel:()=>3,raycast:()=>.48};
 const p=player(w);p.update(1/60,input(),0);assert.equal(p.state,'swim');
 p.update(1/60,input(['climb']),0);
 assert.equal(p.state,'hf_climb');
});

test('F0.12 native attack locomotion has real speed under repeated combos, not 40 percent',()=>{
 const p=player();
 for(let i=0;i<120;i++)p.update(1/60,input([],['attack'],0,1),0);
 assert.ok(p.pos.z>7.0,'two seconds of moving+ATK must cover meaningful distance');
 assert.ok(p._hfAttackTravelSpeed>4,'attack controller follows real run movement');
 assert.ok(p.stamina<99,'F0.12.2 visible ENERGY expense for real attacks');
 assert.ok(p.stamina>70,'2 seconds of flowing attack should not instantly deplete ENERGY');
});
test('F0.12 directional attack uses real damage descriptor, secret only on exact order',()=>{
 const p=player();
 const inputs=[
  {x:1,y:0},{x:-1,y:0},{x:0,y:1}
 ];
 let found=false;
 for(const v of inputs){
  // Start a new chained swing only after the previous native hit completes.
  let turns=0;
  while(p.state==='attack'&&turns++<90)p.update(1/60,input(),0);
  const cmd=input(['attack'],[],0,0);cmd.highflyAbilityAim={attack:v};
  p.update(1/60,cmd,0);
  for(let n=0;n<26;n++)p.update(1/60,input(),0);
  if(p.events.some(e=>e.type==='highflySecretCombo'))found=true;
 }
 assert.equal(found,true,'registered ordered 3-slash secret');
 assert.ok(p.events.some(e=>e.type==='highflyFlowStrike'&&e.bonus>.05));
});
test('F0.12 oxygen depleted only when head is underwater, no fake drain on dry land',()=>{
 const p=player();
 for(let i=0;i<600;i++)p.update(1/60,input(),0);
 assert.equal(p._hfOxygen,100,'air oxygen stays full');
 const swim=player({...ground,waterLevel:()=>4});
 for(let i=0;i<130;i++)swim.update(1/60,input(),0);
 swim.update(1/60,input(['dive']),0);
 for(let i=0;i<100;i++)swim.update(1/60,input(),0);
 assert.ok(swim._hfOxygen<100,'underwater head consumes oxygen');
 swim.update(1/60,input(['dive']),0);
 for(let i=0;i<120;i++)swim.update(1/60,input(),0);
 assert.ok(swim._hfOxygen>70,'resurfacing regenerates oxygen');
});
test('F0.12 underwater pitch makes directional depth changes and never penetrates seabed',()=>{
 const p=player({...ground,waterLevel:()=>4,floorBelow:()=>0});
 for(let i=0;i<210;i++)p.update(1/60,input(),0); // establish real native surface buoyancy first
 assert.equal(p.state,'swim');
 p.update(1/60,input(['dive']),0);
 for(let i=0;i<65;i++)p.update(1/60,input(),0);
 assert.equal(p._hfDive,true);
 const baseline=p.pos.y;
 p._hfCameraPitch=-.7;
 for(let i=0;i<40;i++)p.update(1/60,input([],[],0,1),0);
 assert.ok(p.pos.y<baseline-.3,'forward stick plus down camera descends');
 const low=p.pos.y;
 p._hfCameraPitch=.7;
 for(let i=0;i<40;i++)p.update(1/60,input([],[],0,1),0);
 assert.ok(p.pos.y>low+.3,'forward stick plus up camera ascends');
 assert.ok(p.pos.y>=.7-1e-5,'seabed clamp');
});

test('F0.12.2 attacking NEVER turns a 60-degree wall into a free mountain climb',()=>{
 const slope=Math.tan(Math.PI/3);
 const w={...ground,
  groundHeight:(x,z)=>Math.max(0,z)*slope,
  floorBelow:(x,y,z)=>Math.max(0,z)*slope,
  resolveCapsule(p){const h=Math.max(0,p.z)*slope;
   if(p.y<h){p.y=h;return true;}return Math.abs(p.y-h)<.0001}
 };
 const p=player(w);
 for(let k=0;k<180;k++)p.update(1/60,input([],['attack'],0,1),0);
 assert.ok(p.pos.y<.20,'attacking at steep slope must not elevate player');
 assert.ok(p.pos.z<.25,'no stair stepping into a high rock wall');
 assert.ok(p.events.some(e=>e.type==='highflySteepAttackBlocked'));
});
test('F0.12.2 normal attacks use ENERGY in small per-hit amounts, not zero or drain-all',()=>{
 const p=player();
 const start=p.stamina;
 p.update(1/60,input(['attack']),0);
 assert.equal(p.state,'attack');assert.equal(start-p.stamina,3,'first normal attack costs 3 energy');
 p.update(1/60,input([],['attack']),0);
 assert.ok(p.stamina<start,'holding continues to use small costs');
});
test('F0.12.2 oxygen lasts about 50 seconds submerged and regenerates over 6.25 seconds',()=>{
 const p=player({...ground,waterLevel:()=>6,floorBelow:()=>0});
 p.pos.y=4;p._hfDive=true;
 // Force submerged swim at a fixed depth; avoid synthetic floor buoyancy drift.
 let seconds=0;
 while(seconds<10){p._hfDive=true;p._hfDiveEntering=false;
   p.pos.y=3.5;p.setState('swim');p.update(1/60,input(),0);
   seconds+=1/60;
 }
 assert.ok(p._hfOxygen>60,'10 s submerged must leave most O2 intact: '+p._hfOxygen);
 p._hfDive=false;
 for(let i=0;i<420;i++){p._hfDive=false;p.pos.y=5;
   p.setState('swim');p.update(1/60,input(),0);}
 assert.ok(p._hfOxygen>99,'surface recovery should fill oxygen in seconds');
});
