/** HIGHFLY F0.13 optional 3D workshop.
 * Enable with ?hfworkshop=1. Primitive MIT-compatible THREE meshes; no SOURCE.
 * Virtual tools and seed are granted ONLY in this explicitly opted-in test yard.
 */
import * as THREE from 'three';
export const YARD_STATIONS=Object.freeze([
 {id:'hf-tree',kind:'tree',dx:-3,dz:2,charges:4},
 {id:'hf-ore',kind:'ore',dx:-1,dz:3,charges:4},
 {id:'hf-fish',kind:'fishSpot',dx:1,dz:3,charges:3},
 {id:'hf-plot',kind:'soil',dx:3,dz:2,phase:'empty',growSeconds:8},
 {id:'hf-furnace',kind:'furnace',dx:-2,dz:5},
 {id:'hf-forge',kind:'forge',dx:2,dz:5}
]);
export function installProfessionYard(game,pipe){
 if(!game?.player||!game.world||!pipe?.scene)throw Error('Yard needs real Player, world and scene');
 const group=new THREE.Group();group.name='HIGHFLY_3D_PROFESSION_TRAINING_YARD';
 const origin=game.player.pos.clone(),world=game.world;
 const pts=YARD_STATIONS.map(s=>{
   const x=origin.x+s.dx,z=origin.z+s.dz;
   const floor=world.floorBelow(x,origin.y+6,z,15);
   return {...s,x,z,y:Number.isFinite(floor)?floor:origin.y,available:true};
 });
 const painted=(g,color)=>new THREE.Mesh(g,new THREE.MeshBasicMaterial({
  color,side:THREE.DoubleSide,depthWrite:true}));
 function add(mesh,node,x=0,y=0,z=0){mesh.position.set(node.x+x,node.y+y,node.z+z);group.add(mesh);return mesh;}
 for(const node of pts){
  const base=add(painted(new THREE.CylinderGeometry(.82,.82,.06,10),0x756070),node,0,.04);
  base.name='HF_WORKSTATION_'+node.kind;
  const ring=add(painted(new THREE.TorusGeometry(.82,.035,5,24),0x9f83f1),node,0,.09);
  ring.rotation.x=Math.PI/2;
  if(node.kind==='tree'){
   add(painted(new THREE.CylinderGeometry(.13,.18,1.35,6),0x7d5b37),node,0,.8);
   add(painted(new THREE.ConeGeometry(.7,1.48,7),0x488c61),node,0,1.78);
  }
  if(node.kind==='ore'){
   const ore=add(painted(new THREE.IcosahedronGeometry(.65,0),0x627d9e),node,0,.70);ore.rotation.y=.3;
   add(painted(new THREE.OctahedronGeometry(.25,0),0x8bd1ff),node,.26,.83,.12);
  }
  if(node.kind==='fishSpot'){
   const water=add(painted(new THREE.CylinderGeometry(.73,.73,.13,16),0x287f9c),node,0,.15);
   water.scale.y=.4;add(painted(new THREE.ConeGeometry(.12,.24,6),0xf7c767),node,0,.31);
  }
  if(node.kind==='soil'){
   add(painted(new THREE.BoxGeometry(1.24,.13,.85),0x705036),node,0,.17);
   for(let n=0;n<3;n++)add(painted(new THREE.ConeGeometry(.07,.24,5),0x68b56d),node,
     -.35+n*.35,.30);
  }
  if(node.kind==='furnace'){
   add(painted(new THREE.CylinderGeometry(.5,.55,1,8),0x796a7c),node,0,.62);
   add(painted(new THREE.CylinderGeometry(.25,.25,.07,8),0xf69a41),node,0,1.14);
  }
  if(node.kind==='forge'){
   add(painted(new THREE.BoxGeometry(1.1,.25,.56),0x777f98),node,0,.92);
   add(painted(new THREE.BoxGeometry(.28,.7,.24),0x5f6176),node,0,.53);
  }
 }
 world.highflyInteractables=[...(world.highflyInteractables??[]),...pts];
 pipe.scene.add(group);
 const state=game.player._hfProfession;
 if(state){
  for(const tool of ['axe','pickaxe','rod','hoe','watering_can','hammer'])state.tools.add(tool);
  state.inventory.seed=Math.max(state.inventory.seed??0,4);
  game.player._hfProfessionSave?.();
 }
 return {group,stations:pts,origin,toolsGranted:true,scene:pipe.scene,
  dispose(){pipe.scene.remove(group);group.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});
   world.highflyInteractables=world.highflyInteractables.filter(n=>!pts.includes(n));}};
}
