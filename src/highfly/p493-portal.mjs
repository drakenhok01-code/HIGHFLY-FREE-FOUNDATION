/** Highfly P4.9.3: original CC0-free procedural cosmetic pylon aura.
 * Does not change the original Unsung's collision, travel nodes or quests.
 */
import * as THREE from 'three';
export function installP493PortalVisuals(game){
 const nodes=Object.values(game?.strings?.nodes??{});
 const stage=game?.pipe?.scene;if(!stage||!nodes.length)return null;
 const actors=[],geo=new THREE.TorusGeometry(1.18,.085,8,60);
 const inner=new THREE.TorusGeometry(.93,.024,6,60);
 const violet=new THREE.MeshBasicMaterial({color:0x9c56ff,transparent:true,opacity:.64,depthWrite:false,blending:THREE.AdditiveBlending});
 const cyan=new THREE.MeshBasicMaterial({color:0x74eef6,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending});
 for(const n of nodes){
  const group=new THREE.Group();group.name='HIGHFLY_PORTAL_AURA_'+n.id;
  group.position.set(n.x,n.y+3.1,n.z);group.rotation.y=.25;
  const a=new THREE.Mesh(geo,violet),c=new THREE.Mesh(inner,cyan);
  group.add(a,c);stage.add(group);
  actors.push({n,group,a,c});
 }
 let count=0,prior=game.update,active=true;
 game.update=function(dt){
  const v=prior.call(this,dt);if(!active)return v;
  count+=Math.max(0,Number(dt)||0);
  for(const p of actors){
   const power=p.n.u?.uPower?.value??0;
   p.group.visible=power>.15;
   if(!p.group.visible)continue;
   p.a.rotation.z=count*.21;p.c.rotation.z=-count*.33;
   const pulse=1+Math.sin(count*2+p.n.x)*.06;
   p.group.scale.setScalar(pulse);
  }
  return v;
 };
 const api={count:actors.length,dispose(){active=false;game.update=prior;
   for(const o of actors)o.group.removeFromParent();
   geo.dispose();inner.dispose();violet.dispose();cyan.dispose();
 }};
 game.__highflyPortalVisuals=api;return api;
}
