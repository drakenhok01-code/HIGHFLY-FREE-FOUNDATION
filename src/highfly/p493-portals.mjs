/** Pure original Three.js ornaments for MIT Unsung string pylons.
 * Flight, tuning, collision and travel remain controlled by Unsung.
 * 2 lightweight rings near the player; no external mesh/license dependencies.
 */
import * as THREE from 'three';
export function installHighflyPortals(game){
 if(!game?.strings?.nodes||!game?.pipe?.sceneT)return null;
 const stage=game.pipe.sceneT,geo=new THREE.TorusGeometry(1,0.06,8,40),items=[];
 const outer=new THREE.MeshBasicMaterial({color:0xad7bfa,transparent:true,opacity:.81,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const inner=new THREE.MeshBasicMaterial({color:0x7dfaff,transparent:true,opacity:.62,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 for(const node of Object.values(game.strings.nodes)){
  const root=new THREE.Group();root.name='HIGHFLY_P493_PORTAL_'+node.id;
  root.position.set(node.x,node.y+2.85,node.z);
  const a=new THREE.Mesh(geo,outer),b=new THREE.Mesh(geo,inner);
  a.scale.set(1.7,2.1,1);b.scale.set(1.35,1.72,1);
  b.rotation.y=.24;root.add(a,b);root.visible=false;
  stage.add(root);items.push({root,node,a,b});
 }
 const prev=game.update;game.update=function(dt){
  const result=prev.call(this,dt),p=game.player?.pos;
  for(const {root,node,a,b} of items){
   const active=!!p&&Math.hypot(p.x-node.x,p.z-node.z)<115;
   const unlocked=game.strings?.links?.some(link=>
    (link.a===node.id||link.b===node.id)&&game.strings.awake(link));
   root.visible=active&&unlocked&&!game.cine;
   if(root.visible){a.rotation.z+=Math.max(0,dt)*.13;b.rotation.z-=Math.max(0,dt)*.16;}
  }
  return result;
 };
 const api={count:items.length,get visible(){return items.filter(i=>i.root.visible).length},
  dispose(){game.update=prev;for(const i of items)i.root.removeFromParent();geo.dispose();outer.dispose();inner.dispose();}};
 game.__highflyPortals=api;return api;
}
