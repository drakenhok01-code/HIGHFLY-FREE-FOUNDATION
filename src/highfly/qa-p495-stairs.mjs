/** Physical QA with REAL original Unsung BVH stair geometry.
 * Runs on compiled .work/unsung; no fake stair height functions.
 */
import assert from 'node:assert/strict';
import {CollisionWorld} from '../game/collision.js';
import {Player} from '../game/player.js';
import {MeshBuilder,stairs} from '../world/arch/builder.js';
import {p495StairTread,p495OnActualStairs,p495StairTraverse} from './p495-stair-route.mjs';
import {allowCliffCapsule} from './wall-physics.mjs';
const H=(x,z)=>{
 const progress=Math.max(0,Math.min(56,-118-x))/56;
 // Terrain under the constructed flight is a smooth cliff face; the rendered
 // stone steps are the walkable surface.
 return progress*25.4-(.2+Math.sin(progress*15)*.2)*Math.sin(progress*Math.PI);
};
const terrain={heightAt:H};
const world=new CollisionWorld(terrain);
const builder=new MeshBuilder(),base=H(-118,-459)-.1;
builder.at(-118,base,-459,Math.PI,q=>stairs(q,56,25.4,9));
world.addGeometry(builder.build());
function tread(x){return p495StairTread(world,x,-459).y}
assert.ok(tread(-150)>tread(-140),'Stair rises toward Petal Court');
assert.equal(p495StairTread(world,-150,-480),null,'Stair corridor never spans adjacent cliffs');
assert.equal(p495StairTread(world,-150,-459,500),null,'High-altitude pass is never mislabeled as stairs');
const sample=world.floorBelow(-150,tread(-150)+1,-459,1.5);
assert.ok(Math.abs(sample-tread(-150))<.22,'BVH floor is stone tread not mountain height');
assert.equal(p495OnActualStairs(world,{x:-151,y:tread(-151),z:-459}),true);
assert.equal(p495StairTraverse(world,{x:-151,y:tread(-151),z:-459},{x:-151.08,y:tread(-151),z:-459}),true);
assert.equal(allowCliffCapsule(world,{x:-150,y:tread(-150),z:-459},{x:-150.05,y:tread(-150),z:-459}).ok,true);
function runTrip(start,end,speed,label){
 const p=new Player(world);
 p.spawn(start,tread(start)+.035,-459,0);
 p.grounded=true;p.coyote=.12;p.vel.y=0;
 const forward=Math.sign(end-start),dt=1/60;
 let frames=0,stalled=0,maxStall=0,blocked=0;
 const history=[];
 while(frames++<1000){
  const before=p.pos.x;
  p.vel.x=forward*speed;p.vel.z=0;
  p._integrate(dt);
  const diff=Math.abs(p.pos.x-before);
  if(diff<.001){stalled++;maxStall=Math.max(maxStall,stalled);}else stalled=0;
  if(!Number.isFinite(p.pos.y)||!Number.isFinite(p.pos.x))throw Error(label+' position NaN');
  if(Math.abs(p.pos.z+459)>3.7)throw Error(label+' exits stone staircase corridor');
  if(Math.abs(p.pos.y-tread(p.pos.x))>2.4)blocked++;
  if(frames%120===0)history.push({x:+p.pos.x.toFixed(2),y:+p.pos.y.toFixed(2),grounded:p.grounded});
  if((p.pos.x-end)*forward>=0)break;
 }
 const result={label,start,end,finalX:+p.pos.x.toFixed(2),finalY:+p.pos.y.toFixed(2),frames,maxStall,largeVerticalGaps:blocked,history};
 console.log('[P495 REAL UNSUNG BVH STAIR]',JSON.stringify(result));
 assert.ok((p.pos.x-end)*forward>=-.4,label+' cannot traverse complete flight');
 assert.ok(maxStall<65,label+' stopped by hidden terrain/cliff collision');
 assert.ok(blocked<35,label+' left the stone treads vertically');
 return result;
}
const up=runTrip(-120,-172,4.9,'up');
const down=runTrip(-172,-120,4.9,'down');
console.log('HIGHFLY P495 REAL BVH STAIR PASS',JSON.stringify({upFrames:up.frames,downFrames:down.frames}));
