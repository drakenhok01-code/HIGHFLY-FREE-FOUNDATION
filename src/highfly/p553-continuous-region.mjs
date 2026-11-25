/* P553 editor-only replacement of hex surfaces by a single continuous native mesh.
 * Source buildings, roads and bridges retain X/Z. Replant exact source tree positions
 * with local Unsung species; recycle native trees in the apron.
 */
import * as THREE from 'three';
import {nativeUnsungFlora} from './p531-unsung-flora.mjs';
import {makeRegionSampler,treeId,shrubId,sourceScaleAudit} from './p553-region-sampler.mjs';
const species=['ember','blossom','elder','cypress','green'],kinds=[0,0,0,1,1,2,2,3,3,4,4,4];
const hash=(x,z)=>{const n=Math.sin(x*12.9898+z*78.233)*43758.5453;return n-Math.floor(n)};
const lerp=(a,b,t)=>a+(b-a)*t;
function mesh(pos,idx,mat,soil){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(soil)g.setAttribute('aRegionSoil',new THREE.Float32BufferAttribute(soil,1));if(idx)g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();const o=new THREE.Mesh(g,mat);o.userData.owned=true;return o}
function farHeight(e,x,z){const s=64,a=Math.floor(x/s)*s,b=Math.floor(z/s)*s,u=(x-a)/s,v=(z-b)/s;const h=e(a,b),i=e(a+s,b),j=e(a,b+s),k=e(a+s,b+s);return (u+v<=1?h+(i-h)*u+(j-h)*v:k+(j-k)*(1-u)+(i-k)*(1-v))-.7}
export function makeContinuousRegion(nativeVisuals,elevation,overview){
 const native=nativeVisuals.material,pristine=native.fragmentShader;
 const terrain=native.clone(),road=native.clone();
 for(const m of [terrain,road])for(const k of ['uUnsungAlbedo','uUnsungDetail','uNativePath'])m.uniforms[k]={value:native.uniforms[k].value};
 const token='float path=texture(uNativePath,vWorld.xz/2048.0+0.5).r;';
 if(!pristine.includes(token))throw Error('Native shader changed');
 terrain.vertexShader=terrain.vertexShader.replace('out vec3 vWorld;','in float aRegionSoil; out float vRegionSoil; out vec3 vWorld;').replace('vWorld=world.xyz;','vRegionSoil=aRegionSoil; vWorld=world.xyz;');
 terrain.fragmentShader=pristine.replace('in vec3 vWorld;','in float vRegionSoil; in vec3 vWorld;').replace(token,'float path=vRegionSoil;');
 road.fragmentShader=pristine.replace(token,'float path=1.0;');
 for(const m of [terrain,road]){m.side=THREE.DoubleSide;m.needsUpdate=true}
 native.uniforms.uP55Bounds={value:new THREE.Vector4()};native.uniforms.uP55Clip={value:0};
 native.fragmentShader=pristine.replace('in vec3 vWorld;','uniform vec4 uP55Bounds; uniform float uP55Clip; in vec3 vWorld;').replace('void main(){','void main(){if(uP55Clip>0.5&&vWorld.x>uP55Bounds.x&&vWorld.x<uP55Bounds.y&&vWorld.z>uP55Bounds.z&&vWorld.z<uP55Bounds.w) discard;');
 native.needsUpdate=true;
 let active=null;
 function clear(){active=null;native.uniforms.uP55Clip.value=0;globalThis.__hfP546Cleared=()=>false;}
 function activate(p){active=p.bounds;native.uniforms.uP55Bounds.value.set(active.minX,active.maxX,active.minZ,active.maxZ);native.uniforms.uP55Clip.value=1;globalThis.__hfP546Cleared=(x,z)=>!!active&&x>active.minX&&x<active.maxX&&z>active.minZ&&z<active.maxZ;}
 const waterMat=new THREE.MeshLambertMaterial({color:0x36858e,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
 function build(d,p,assets){
  const sampler=makeRegionSampler(d,p,(x,z)=>farHeight(elevation,x,z)),group=new THREE.Group(),b=p.bounds,S=p.scale;
  const nx=Math.ceil((b.maxX-b.minX)/1.8),nz=Math.ceil((b.maxZ-b.minZ)/1.8),pos=[],soil=[],idx=[],wet=[],water=[];
  // One shared regular grid, continuous normals and native grass/soil texture.
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=lerp(b.minX,b.maxX,i/nx),z=lerp(b.minZ,b.maxZ,j/nz),q=sampler.sample(x,z);pos.push(x,q.y,z);soil.push(q.soil);wet.push({x,z,y:q.level,f:Math.min((q.water-.48)*3,q.level-q.y-.015)});}
  function clipWater(a,b,c){const input=[wet[a],wet[b],wet[c]],out=[];for(let i=0;i<3;i++){const a=input[i],b=input[(i+1)%3];if(a.f>0)out.push(a);if((a.f>0)!==(b.f>0)){const t=a.f/(a.f-b.f);out.push({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),y:lerp(a.y,b.y,t)})}}for(let i=1;i<out.length-1;i++)for(const v of [out[0],out[i],out[i+1]])water.push(v.x,v.y,v.z);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;idx.push(a,c,b,b,c,d);clipWater(a,c,b);clipWater(b,c,d);}
  group.add(mesh(pos,idx,terrain,soil));if(water.length)group.add(mesh(water,null,waterMat));
  const path=[];for(let i=0;i<d.paths.length;i+=3){const x=p.x+d.paths[i]*S,z=p.z+d.paths[i+2]*S,q=sampler.sample(x,z),y=p.base+d.paths[i+1]*S;path.push(x,q.water>.65?y:q.y+.055,z)}
  if(path.length)group.add(mesh(path,null,road));
  // Local species mix based on actual Unsung trees around this site.
  const nearby=(overview?.trees??[]).filter(t=>t[0]>b.minX-150&&t[0]<b.maxX+150&&t[1]>b.minZ-150&&t[1]<b.maxZ+150);
  const mix=nearby.map(t=>species[kinds[t[3]]??4]);if(!mix.length)mix.push('green','cypress','elder');
  const plant=[],keys=new Set(),add=(x,z,y,h,name,rot,source)=>{const key=Math.round(x*4)+','+Math.round(z*4);if(keys.has(key))return;keys.add(key);plant.push({x,z,y,h,name,rot,source})};
  for(const q of d.pieces){if(!treeId(q.piece)&&!shrubId(q.piece))continue;const x=p.x+q.x*S,z=p.z+q.z*S,at=sampler.sample(x,z),a=assets.get(q.piece),h=(a?.size?.[1]??3)*(q.scale??1)*S;
   // Preserve tree coordinates and source height; choose slimmer local species for conifers.
   const name=shrubId(q.piece)?'shrub':/tree-(?:2|4)-/.test(q.piece)?'cypress':mix[Math.floor(hash(x,z)*mix.length)];
   add(x,z,at.y,h,name,q.rot??0,'guildhall');
  }
  // Recycle native tree positions in the exterior, not the developed core.
  for(const t of nearby){const [x,z,s,kind]=t;if(x<=b.minX||x>=b.maxX||z<=b.minZ||z>=b.maxZ)continue;const q=sampler.sample(x,z);if(q.inside||q.water>.15||q.y<.5)continue;
   add(x,z,q.y,[14,8,19,19,13][kinds[kind]??4]*s,species[kinds[kind]??4],hash(x,z)*6.283,'native-recycled');
  }
  // Sparse gaps in the transition: native tree species, no trees on water/roads.
  const occupied=new Set(plant.map(t=>Math.floor(t.x/9)+','+Math.floor(t.z/9)));
  for(let x=b.minX+6;x<b.maxX-6;x+=11)for(let z=b.minZ+6;z<b.maxZ-6;z+=11){const xx=x+hash(x,z)*6-3,zz=z+hash(z,x)*6-3,q=sampler.sample(xx,zz);if(q.inside||q.transition<.18||q.water>.12||q.y<.7||occupied.has(Math.floor(xx/9)+','+Math.floor(zz/9))||hash(xx,zz)>.52)continue;
   const slope=Math.hypot(sampler.sample(xx+2,zz).y-q.y,sampler.sample(xx,zz+2).y-q.y)/2;if(slope>.5)continue;
   const name=mix[Math.floor(hash(zz,xx)*mix.length)];add(xx,zz,q.y,7+hash(xx+1,zz)*6,name,hash(xx,zz)*6.283,'native-added');occupied.add(Math.floor(xx/9)+','+Math.floor(zz/9));
  }
  // Chunked shared instance batches. Frustum culling works per 100m sector.
  const batches=new Map();for(const t of plant){const key=t.name+'/'+Math.floor(t.x/100)+'/'+Math.floor(t.z/100);if(!batches.has(key))batches.set(key,[]);batches.get(key).push(t)}
  const dummy=new THREE.Object3D(),size=new THREE.Vector3();
  for(const list of batches.values()){const model=nativeUnsungFlora('unsung-tree-'+list[0].name),box=new THREE.Box3().setFromObject(model);box.getSize(size);
   for(const child of model.children){const m=new THREE.InstancedMesh(child.geometry,child.material,list.length);for(let i=0;i<list.length;i++){const t=list[i],s=t.h/Math.max(.1,size.y);dummy.position.set(t.x,t.y-box.min.y*s,t.z);dummy.rotation.set(0,t.rot,0);dummy.scale.setScalar(s);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)}m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();group.add(m)}
  }
  return {group,sampler,stats:{...sourceScaleAudit(d,assets),replaced:plant.filter(t=>t.source==='guildhall').length,recycled:plant.filter(t=>t.source==='native-recycled').length,added:plant.filter(t=>t.source==='native-added').length,gridVertices:pos.length/3}};
 }
 return {activate,clear,build};
}
