/** Rebuild the EXACT original Petal stair + P501 stone apron in the real
 * Unsung MeshBuilder and MeshBVH collision engine. Tests both directions and
 * ensures the apron is an actual solid, not a HUD decal over the water.
 */
import assert from 'node:assert/strict';
import {MeshBuilder,stairs,M} from '../world/arch/builder.js';
import {CollisionWorld} from '../game/collision.js';
import {Player} from '../game/player.js';
const y0=200,bx=-118,bz=-459,run=56,rise=25.4,width=9;
const terrain={heightAt:()=>y0-7};
const world=new CollisionWorld(terrain),builder=new MeshBuilder();
builder.at(bx,y0-.1,bz,Math.PI,q=>{
 stairs(q,run,rise,width);
 q.mat_(M.PAVING).box(-6.6,-1.05,-4.5,7.1,1.17,9,'-y');
});
const geometry=builder.build();
world.addGeometry(geometry);
const sample=(x,z=-459)=>world.floorBelow(x,y0+1,z,8);
for(const x of [-111.55,-112,-113,-114,-115,-116,-117,-117.75]){
 const foot=sample(x);
 assert.ok(Math.abs(foot-(y0+.02))<.15,'stone apron missing at '+x+' y='+foot);
}
assert.ok(Math.abs(sample(-118.1)-(y0+.07))<.17,'native first stone tread still walkable');
assert.ok(sample(-120)>y0+.3,'upper treads not removed');
assert.equal(sample(-114,-466),y0-7,'apron does not cover neighbouring terrain outside 9m stone width');
assert.ok(geometry.getAttribute('aMat'),'native original textured material index missing');
const player=new Player(world);player.spawn(-112.5,y0+.025,-459,Math.PI);
player.grounded=true;player.coyote=.12;player.vel.y=0;
let steps=0,stall=0;
while(steps++<280&&player.pos.x> -118.2){
 const before=player.pos.x;
 player.vel.x=-3.3;player.vel.z=0;player._integrate(1/60);
 if(Math.abs(player.pos.x-before)<.001)stall++;
}
assert.ok(stall<30,'player stalls approaching sealed stair landing');
assert.ok(player.pos.x<-118,'approach could not reach stone steps');
console.log('[HIGHFLY P501 ORIGINAL STAIR + SOLID APRON PASS]',JSON.stringify({triangles:geometry.index.count/3,finalX:player.pos.x,stalled:stall,steps}));
