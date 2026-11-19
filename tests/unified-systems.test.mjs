import test from 'node:test';
import assert from 'node:assert/strict';
import {attackPhase,targetForHand,directionalArms,planDirectionalStroke} from '../src/highfly/directional-rig.mjs';
import {GRAPHICS,installHighflyGraphics} from '../src/highfly/visual-profile.mjs';
import {oxygenMax,oxygenRate,oxygenRemainingSeconds} from '../src/highfly/oxygen-progression.mjs';
import {terrainGradient,allowTerrainTraverse,wallRunEligible,terrainWallContact,allowCliffCapsule} from '../src/highfly/wall-physics.mjs';
test('True stroke starts on chosen side and ENDS on the opposite, not a reused right-side animation',()=>{
 const right=planDirectionalStroke('onehand','right',0);
 assert.ok(right.at(0).right.x>.45&&right.at(.46).right.x<-.45);
 const left=planDirectionalStroke('onehand','left',0);
 assert.ok(left.at(0).right.x<-.45&&left.at(.46).right.x>.45);
 const up=planDirectionalStroke('onehand','up',0);
 assert.ok(up.at(0).right.y<.85&&up.at(.46).right.y>1.7);
 const down=planDirectionalStroke('onehand','down',0);
 assert.ok(down.at(0).right.y>1.65&&down.at(.46).right.y<.9);
});
test('Dual arms: first/second isolated, third X cross on two different hands',()=>{
 assert.deepEqual(directionalArms('dual','left',0),['left']);
 assert.deepEqual(directionalArms('dual','right',1),['right']);
 assert.deepEqual(directionalArms('dual','left',2),['left','right']);
 const x=planDirectionalStroke('dual','right',2);
 assert.ok(x.at(0).left.x<0&&x.at(.46).left.x>0);
 assert.ok(x.at(0).right.x>0&&x.at(.46).right.x<0);
 assert.ok(x.at(0).left.y<x.at(.46).left.y);
 assert.ok(x.at(0).right.y>x.at(.46).right.y);
});
test('Combat phase bounded and deterministic regardless FPS',()=>{
 for(const t of [-1,0,.05,.15,.23,.45,2])assert.ok(attackPhase(t,.46)>=0&&attackPhase(t,.46)<=1);
 assert.deepEqual(targetForHand('left',.3),targetForHand('left',.3));
});
test('Renderer keeps disabled SSAO and three query-selectable resolution profiles',()=>{
 const pipe={ao:{enabled:true},tonemap:{uniforms:{uSharpen:{value:0}}},bloomStrength:.2};
 const settings={values:{renderScale:.63,targetFps:50}};
 const r=installHighflyGraphics(pipe,settings,'?hfquality=quality',{getItem:()=>null,setItem(){}});
 assert.equal(r.selected,'quality');assert.equal(settings.values.renderScale,1);
 assert.equal(pipe.ao.enabled,false);assert.equal(r.set('performance'),true);
 assert.equal(settings.values.renderScale,.7);assert.equal(r.set('bogus'),false);
 assert.equal(Object.keys(GRAPHICS).length,3);
});
test('Oxygen starts ~32s; progresses with levels and approved fitness points only',()=>{
 assert.equal(oxygenMax(1,0),100);assert.ok(oxygenMax(20,10)>oxygenMax(1));
 assert.ok(oxygenRate(true,false)<0&&oxygenRate(false,false)>0);
 assert.ok(Math.abs(oxygenRemainingSeconds(100)-32)<.01);
 assert.ok(oxygenMax(100,100)<=190);
});
test('60deg cliff blocks heightfield penetration while slopes remain walkable',()=>{
 const flat={groundHeight:()=>0},steep={groundHeight:(x,z)=>Math.max(0,z)*Math.tan(Math.PI/3)};
 const mild={groundHeight:(x,z)=>Math.max(0,z)*.36};
 assert.equal(allowTerrainTraverse(flat,{x:0,z:0},{x:0,z:1}).ok,true);
 assert.equal(allowTerrainTraverse(mild,{x:0,z:0},{x:0,z:1}).ok,true);
 assert.equal(allowTerrainTraverse(steep,{x:0,z:0},{x:0,z:1}).ok,false);
 assert.ok(terrainGradient(steep,0,1).slope>1.5);
});
test('Wall run only intentional sprint+forward airborne alongside solid wall',()=>{
 const held=new Set(['sprint']),contact={distance:.5},move={y:1};
 assert.equal(wallRunEligible({grounded:false,stamina:20,held,move,contact,speed:3}),true);
 assert.equal(wallRunEligible({grounded:true,stamina:20,held,move,contact,speed:3}),false);
 assert.equal(wallRunEligible({grounded:false,stamina:5,held,move,contact,speed:3}),false);
 assert.equal(wallRunEligible({grounded:false,stamina:20,held,move,contact:null,speed:3}),false);
});

test('F0.13.1: a physical cliff face is detectable by the same grip/wallrun camera proxy',()=>{
 const cliff={groundHeight:(x,z)=>Math.max(0,z)*1.8},flat={groundHeight:()=>0};
 const p={x:0,y:0,z:0},dir={x:0,z:1};
 const hit=terrainWallContact(cliff,p,dir,1.1,.72);
 assert.ok(hit,'wallrun and grip must detect a high-gradient rock face even without a BVH hit');
 assert.ok(hit.distance>=.1&&hit.distance<=1.1);
 assert.equal(terrainWallContact(flat,p,dir,1.1,.72),null);
 assert.equal(allowCliffCapsule(cliff,p,{x:0,y:.1,z:.6}).ok,false);
 assert.equal(allowCliffCapsule(flat,p,{x:0,y:.1,z:.6}).ok,true);
});

test('F0.13.1 viewport-safe HUD anchors preserve right/bottom physical placement and 70% opacity',async()=>{
 const {captureAnchor,positionFromAnchor}=await import('../src/highfly/hud-editor.mjs');
 const r={left:780,top:310,right:850,bottom:380,width:70,height:70};
 const original=captureAnchor(r,915,412,1,.7);
 const same=positionFromAnchor(original,915,412,70,70);
 assert.ok(Math.abs(same.left-780)<1&&Math.abs(same.top-310)<1);
 assert.equal(same.opacity,.7);
 const resized=positionFromAnchor(original,850,362,70,70);
 assert.ok(resized.left>=0&&resized.top>=0);
 assert.ok(resized.left+70<=850&&resized.top+70<=362);
});
