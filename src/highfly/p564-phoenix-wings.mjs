// Original HIGHFLY low-poly Phoenix wings. No imported paid assets.
// 2 draw calls, one mesh per wing, no particle systems or extra render passes.
import * as THREE from 'three';
export function createPhoenixWings(){
 const root=new THREE.Group();root.name='HIGHFLY_PHOENIX_WINGS';root.position.set(0,1.35,-.25);root.visible=false;
 const vertices=[],colors=[];
 const a=new THREE.Color(0xb77af2),b=new THREE.Color(0x7135b4),c=new THREE.Color(0xffcf72);
 function tri(p,q,r,ca,cb,cc){vertices.push(...p,...q,...r);for(const x of [ca,cb,cc])colors.push(x.r,x.g,x.b)}
 for(let i=0;i<8;i++){
  const t=i/7,x=.13+t*1.4,y=.05+Math.sin(t*2.2)*.48,z=-.08-t*.26;
  const base=[x,y,z],outer=[x+.5+t*.35,y+.13-t*.48,z-.25-t*.4],ridge=[x+.23,y+.12,z-.14],inner=[x+.07,y-.18,z-.08];
  tri(base,ridge,outer,a,a,c);tri(base,outer,inner,a,c,b);
 }
 tri([0,0,0],[1.58,.4,-.33],[.72,-.28,-.38],a,b,b);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeBoundingSphere();
 const m=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,toneMapped:false});
 const right=new THREE.Mesh(g,m),left=new THREE.Mesh(g,m);left.scale.x=-1;root.add(right,left);
 let blend=0;return {root,update(dt,active,time){blend=THREE.MathUtils.clamp(blend+(active?1:-1)*dt*8,0,1);root.visible=blend>.01;if(!root.visible)return;root.scale.setScalar(Math.max(.01,blend));const flap=Math.sin(time*4)*.07;right.rotation.z=.10+flap;left.rotation.z=-.10-flap;root.rotation.x=.15;}};
}
