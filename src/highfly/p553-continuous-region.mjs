import {thinRegionPlants} from './p559-vegetation-policy.mjs';
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
function mesh(pos,idx,mat,soil,depth){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(soil)g.setAttribute('aRegionSoil',new THREE.Float32BufferAttribute(soil,1));if(depth)g.setAttribute('aDepth',new THREE.Float32BufferAttribute(depth,1));if(idx)g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();const o=new THREE.Mesh(g,mat);o.userData.owned=true;return o}
function farHeight(e,x,z){const s=64,a=Math.floor(x/s)*s,b=Math.floor(z/s)*s,u=(x-a)/s,v=(z-b)/s;const h=e(a,b),i=e(a+s,b),j=e(a,b+s),k=e(a+s,b+s);return (u+v<=1?h+(i-h)*u+(j-h)*v:k+(j-k)*(1-u)+(i-k)*(1-v))-.7}
export function makeContinuousRegion(nativeVisuals,elevation,overview,nativeWater,nativeLeaves,options={}){
 const native=nativeVisuals.material,pristine=native.fragmentShader;
 let terrain=native.clone(),road=native.clone();
 for(const m of [terrain,road])for(const k of ['uUnsungAlbedo','uUnsungDetail','uNativePath'])m.uniforms[k]={value:native.uniforms[k].value};
 const token='float path=texture(uNativePath,vWorld.xz/2048.0+0.5).r;';
 if(!pristine.includes(token))throw Error('Native shader changed');
 terrain.vertexShader=terrain.vertexShader.replace('out vec3 vWorld;','in float aRegionSoil; out float vRegionSoil; out vec3 vWorld;').replace('vWorld=world.xyz;','vRegionSoil=aRegionSoil; vWorld=world.xyz;');
 terrain.fragmentShader=pristine.replace('in vec3 vWorld;','in float vRegionSoil; in vec3 vWorld;').replace(token,'float path=vRegionSoil;');
 road.fragmentShader=pristine.replace(token,'float path=1.0;');
 for(const m of [terrain,road]){m.side=THREE.DoubleSide;m.needsUpdate=true}
 if(options.nativeMaterials){terrain.dispose();road.dispose();terrain=options.nativeMaterials.ground;road=options.nativeMaterials.road;}
 native.uniforms.uP55Bounds={value:new THREE.Vector4()};native.uniforms.uP55Clip={value:0};
 native.fragmentShader=pristine.replace('in vec3 vWorld;','uniform vec4 uP55Bounds; uniform float uP55Clip; in vec3 vWorld;').replace('void main(){','void main(){if(uP55Clip>0.5&&vWorld.x>uP55Bounds.x&&vWorld.x<uP55Bounds.y&&vWorld.z>uP55Bounds.z&&vWorld.z<uP55Bounds.w) discard;');
 native.needsUpdate=true;
 const sea=nativeWater?.material;if(sea){sea.transparent=false;sea.depthWrite=true;sea.uniforms.uRegionClip={value:0};sea.uniforms.uRegionBounds={value:new THREE.Vector4()};sea.fragmentShader=sea.fragmentShader.replace('in vec3 vPosition;','uniform float uRegionClip; uniform vec4 uRegionBounds; in vec3 vPosition;').replace('void main(){','void main(){if(uRegionClip>0.5&&vPosition.x>uRegionBounds.x&&vPosition.x<uRegionBounds.y&&vPosition.z>uRegionBounds.z&&vPosition.z<uRegionBounds.w)discard;').replace('outColor=vec4(col,mix(0.56,0.91,deepK));','outColor=vec4(col,1.0);');sea.needsUpdate=true}
 let active=null;
 function clear(){active=null;native.uniforms.uP55Clip.value=0;if(sea)sea.uniforms.uRegionClip.value=0;globalThis.__hfP546Cleared=()=>false;}
 function activate(p){active=p.bounds;native.uniforms.uP55Bounds.value.set(active.minX,active.maxX,active.minZ,active.maxZ);native.uniforms.uP55Clip.value=1;if(sea){sea.uniforms.uRegionBounds.value.copy(native.uniforms.uP55Bounds.value);sea.uniforms.uRegionClip.value=1;}globalThis.__hfP546Cleared=(x,z)=>!!active&&x>active.minX&&x<active.maxX&&z>active.minZ&&z<active.maxZ;}
 const waterMat=options.nativeMaterials?.water??new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,side:THREE.DoubleSide,transparent:false,depthWrite:true,depthTest:true,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,vertexShader:'in float aDepth; out float vDepth; void main(){vDepth=aDepth;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'precision highp float; in float vDepth; out vec4 outColor; void main(){float d=max(0.0,vDepth);float k=smoothstep(1.2,30.0,d);vec3 c=mix(vec3(0.13,0.53,0.56),vec3(0.018,0.17,0.28),k);c=mix(c,vec3(0.50,0.77,0.69),(1.0-smoothstep(0.05,1.9,d))*0.5);outColor=vec4(c,1.0);}'});
 function* buildSteps(d,p,assets){
  const sampler=makeRegionSampler(d,p,options.nativeHeight??((x,z)=>farHeight(elevation,x,z))),group=new THREE.Group(),b=p.bounds,S=p.scale;
  const nx=Math.ceil((b.maxX-b.minX)/1.8),nz=Math.ceil((b.maxZ-b.minZ)/1.8),pos=[],soil=[],idx=[],wet=[],seaWet=[],water=[],depth=[],nativeSea=options.nativeMaterials?0:-.07;
  // One shared regular grid, continuous normals and native grass/soil texture.
  for(let j=0;j<=nz;j++){if(j%3===0)yield 'terrain';for(let i=0;i<=nx;i++){const x=lerp(b.minX,b.maxX,i/nx),z=lerp(b.minZ,b.maxZ,j/nz),q=sampler.sample(x,z);pos.push(x,q.y,z);soil.push(q.soil);const level=Math.max(nativeSea,q.level);wet.push({x,z,y:level,bed:q.y,f:Math.min((q.water-.30)*3,level-q.y-.025,level-nativeSea-.05)});seaWet.push({x,z,y:nativeSea,bed:q.y,f:nativeSea-q.y-.025});}}
  function clipWater(points,a,b,c){const input=[points[a],points[b],points[c]],out=[];for(let i=0;i<3;i++){const a=input[i],b=input[(i+1)%3];if(a.f>0)out.push(a);if((a.f>0)!==(b.f>0)){const t=a.f/(a.f-b.f);out.push({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),y:lerp(a.y,b.y,t),bed:lerp(a.bed,b.bed,t)})}}for(let i=1;i<out.length-1;i++)for(const v of [out[0],out[i],out[i+1]]){water.push(v.x,v.y+(options.nativeMaterials?0:.012),v.z);depth.push(Math.max(0,v.y-v.bed));}}
  for(let j=0;j<nz;j++){if(j%12===0)yield 'water';for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;idx.push(a,c,b,b,c,d);if(!options.nativeMaterials){clipWater(seaWet,a,c,b);clipWater(seaWet,b,c,d);}clipWater(wet,a,c,b);clipWater(wet,b,c,d);}}
  // Keep identical vertices and normals, but cull world-space surface tiles separately.
  // The editor still uses the complete mesh for overhead inspection.
  if(options.runtime){
   const full=mesh(pos,idx,terrain,soil),norm=full.geometry.getAttribute('normal').array,C=32;
   for(let j=0;j<nz;j+=C){yield 'terrain chunks';for(let i=0;i<nx;i+=C){
    const w=Math.min(C,nx-i),h=Math.min(C,nz-j),v=[],n=[],a=[],ix=[];
    for(let z=0;z<=h;z++)for(let x=0;x<=w;x++){const k=(j+z)*(nx+1)+i+x;v.push(pos[k*3],pos[k*3+1],pos[k*3+2]);n.push(norm[k*3],norm[k*3+1],norm[k*3+2]);a.push(soil[k]);}
    for(let z=0;z<h;z++)for(let x=0;x<w;x++){const k=z*(w+1)+x;ix.push(k,k+w+1,k+1,k+1,k+w+1,k+w+2)}
    const o=mesh(v,ix,terrain,a);o.geometry.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));group.add(o);
   }}full.geometry.dispose();
  }else group.add(mesh(pos,idx,terrain,soil));
  function addSurfaceTriangles(vertices,material,depths){
   if(!vertices.length)return;if(!options.runtime){group.add(mesh(vertices,null,material,null,depths));return}
   const chunks=new Map();for(let k=0;k<vertices.length;k+=9){const x=(vertices[k]+vertices[k+3]+vertices[k+6])/3,z=(vertices[k+2]+vertices[k+5]+vertices[k+8])/3,key=Math.floor(x/64)+','+Math.floor(z/64);let c=chunks.get(key);if(!c){c={v:[],d:[]};chunks.set(key,c)}for(let j=0;j<9;j++)c.v.push(vertices[k+j]);if(depths)for(let j=0;j<3;j++)c.d.push(depths[k/3+j])}
   for(const c of chunks.values()){const m=mesh(c.v,null,material,null,depths?c.d:null);if(material===waterMat&&options.nativeMaterials)m.userData.regionWater=true;group.add(m)}
  }
  addSurfaceTriangles(water,waterMat,depth);
  const path=[];const roadHeight=(x,z)=>{const u=Math.max(0,Math.min(nx-.00001,(x-b.minX)/(b.maxX-b.minX)*nx)),v=Math.max(0,Math.min(nz-.00001,(z-b.minZ)/(b.maxZ-b.minZ)*nz)),i=Math.floor(u),j=Math.floor(v),a=u-i,c=v-j,k=j*(nx+1)+i,h=n=>pos[n*3+1];return a+c<=1?h(k)+(h(k+1)-h(k))*a+(h(k+nx+1)-h(k))*c:h(k+nx+2)+(h(k+nx+1)-h(k+nx+2))*(1-a)+(h(k+1)-h(k+nx+2))*(1-c)};for(let i=0;i<d.paths.length;i+=3){const x=p.x+d.paths[i]*S,z=p.z+d.paths[i+2]*S,q=sampler.sample(x,z),y=p.base+d.paths[i+1]*S;const w=sampler.walkwayAt(d.paths[i],d.paths[i+2]);path.push(x,w||q.water>.30?y:roadHeight(x,z)+.022,z)}
  addSurfaceTriangles(path,road,null);
  // Local species mix based on actual Unsung trees around this site.
  const nearby=(overview?.trees??[]).filter(t=>t[0]>b.minX-150&&t[0]<b.maxX+150&&t[1]>b.minZ-150&&t[1]<b.maxZ+150);
  const counts=species.map((_,i)=>nearby.filter(t=>(kinds[t[3]]??4)===i).length),total=counts.reduce((a,b)=>a+b,0)||1;
 const baseline=[.12,.16,.12,.22,.38],weights=baseline.map((v,i)=>.55*v+.45*counts[i]/total),mix=[];
 for(let i=0;i<5;i++)for(let n=0;n<Math.max(1,Math.round(weights[i]*100));n++)mix.push(species[i]);
  const plant=[],keys=new Set(),add=(x,z,y,h,name,rot,source)=>{const key=Math.round(x*4)+','+Math.round(z*4);if(keys.has(key))return;keys.add(key);plant.push({x,z,y,h,name,rot,source})};
  let plantCursor=0;for(const q of d.pieces){if(++plantCursor%1000===0)yield 'vegetation';if(!treeId(q.piece)&&!shrubId(q.piece))continue;const x=p.x+q.x*S,z=p.z+q.z*S,at=sampler.sample(x,z),a=assets.get(q.piece),h=(a?.size?.[1]??3)*(q.scale??1)*S;
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
  const density=thinRegionPlants(plant,d,p);plant.splice(0,plant.length,...density.plants);
  // Chunked shared instance batches. Frustum culling works per 100m sector.
  if(!options.runtimeNativeForest){
  const batches=new Map();for(const t of plant){const key=t.name+'/'+Math.floor(t.x/100)+'/'+Math.floor(t.z/100);if(!batches.has(key))batches.set(key,[]);batches.get(key).push(t)}
  const dummy=new THREE.Object3D(),size=new THREE.Vector3();
  for(const list of batches.values()){yield 'tree batches';const model=nativeUnsungFlora('unsung-tree-'+list[0].name),box=new THREE.Box3().setFromObject(model);box.getSize(size);
   for(const child of model.children){const kind=species.indexOf(list[0].name),mat=child.name==='unsung_original_leaf_cards'&&kind>=0?nativeLeaves?.mats?.[kind]??child.material:child.material;const m=new THREE.InstancedMesh(child.geometry,mat,list.length);for(let i=0;i<list.length;i++){const t=list[i],s=t.h/Math.max(.1,size.y);dummy.position.set(t.x,t.y-box.min.y*s,t.z);dummy.rotation.set(0,t.rot,0);dummy.scale.setScalar(s);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)}m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();if(options.runtime){m.userData.regionVegetation=true;m.userData.regionRadius=list[0].name==='shrub'?85:190;}group.add(m)}
  }
  }
  const gridHeight=(x,z)=>{const u=(x-b.minX)/(b.maxX-b.minX)*nx,v=(z-b.minZ)/(b.maxZ-b.minZ)*nz;if(u<0||u>nx||v<0||v>nz)return elevation(x,z);const i=Math.min(nx-1,Math.floor(u)),j=Math.min(nz-1,Math.floor(v)),a=u-i,c=v-j,k=j*(nx+1)+i;const h=n=>pos[n*3+1];return a+c<=1?h(k)+(h(k+1)-h(k))*a+(h(k+nx+1)-h(k))*c:h(k+nx+2)+(h(k+nx+1)-h(k+nx+2))*(1-a)+(h(k+1)-h(k+nx+2))*(1-c)};
  const gridWater=(x,z)=>{const u=(x-b.minX)/(b.maxX-b.minX)*nx,v=(z-b.minZ)/(b.maxZ-b.minZ)*nz;if(u<0||u>nx||v<0||v>nz)return -Infinity;const i=Math.min(nx-1,Math.floor(u)),j=Math.min(nz-1,Math.floor(v)),a=u-i,c=v-j,k=j*(nx+1)+i;const interp=field=>a+c<=1?wet[k][field]+(wet[k+1][field]-wet[k][field])*a+(wet[k+nx+1][field]-wet[k][field])*c:wet[k+nx+2][field]+(wet[k+nx+1][field]-wet[k+nx+2][field])*(1-a)+(wet[k+1][field]-wet[k+nx+2][field])*(1-c);const h=gridHeight(x,z),level=interp('y');return interp('f')>0&&level>h+.025?level:h<nativeSea-.025?nativeSea:-Infinity};
  return {group,sampler,gridHeight,gridWater,grid:{nx,nz,pos,soil,wet,b},plants:plant,stats:{...sourceScaleAudit(d,assets),density:density.counts,replaced:plant.filter(t=>t.source==='guildhall').length,recycled:plant.filter(t=>t.source==='native-recycled').length,added:plant.filter(t=>t.source==='native-added').length,gridVertices:pos.length/3}};
 }
 function build(d,p,assets){const it=buildSteps(d,p,assets);let r;do{r=it.next()}while(!r.done);return r.value;}
 async function buildAsync(d,p,assets,onProgress=()=>{}){const it=buildSteps(d,p,assets);let r,last=performance.now();do{r=it.next();if(!r.done&&performance.now()-last>10){onProgress(r.value);await new Promise(resolve=>setTimeout(resolve,0));last=performance.now()}}while(!r.done);return r.value;}
 return {activate,clear,build,buildAsync};
}
