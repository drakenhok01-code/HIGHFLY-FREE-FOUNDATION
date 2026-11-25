/**
 * HIGHFLY P5.3.6 · World Forge 4.4 native visual parity.
 * REAL, PINNED MIT UNSUNG MATERIALS, generated from its own terrainMaterials.js
 * with its exact TextureForge. Not a flat cartographic "relief" color map.
 * Water is STATIC with shoreline-dependent actual heightfield depth: NO WAVES,
 * NO screen-space reflection, NO native Fullscreen pipeline.
 * Grass uses Unsung's 3-blade source geometry as one near-field instanced mesh.
 * Native five-species leaf material comes from the ORIGINAL baked leaf atlas.
 * No SOURCE files; the read-only original world heights and buildings remain.
 */
import * as THREE from 'three';
import {TextureForge} from '../engine/forge.js';
import {TERRAIN_MATERIALS} from '../world/terrainMaterials.js';
import {bakeLeafAtlas} from '../world/flora/leafAtlas.js';

const VX=[
 'out vec3 vWorld;', 'out vec3 vN;',
 'void main() {',
 ' vec4 world=modelMatrix*vec4(position,1.0);',
 ' vWorld=world.xyz;vN=normalize(mat3(modelMatrix)*normal);',
 ' gl_Position=projectionMatrix*viewMatrix*world;',
 '}'
].join('\n');
const FR=[
 'precision highp float;',
 'precision highp sampler2DArray;',
 'uniform sampler2DArray uUnsungAlbedo;',
 'uniform sampler2DArray uUnsungDetail;',
 'uniform sampler2D uNativePath;',
 'in vec3 vWorld;', 'in vec3 vN;',
 'out vec4 outColor;',
 'vec3 layer(float idx,float metres){return texture(uUnsungAlbedo,vec3(vWorld.xz/metres,idx)).rgb;}',
 'float sat(float a){return clamp(a,0.0,1.0);}',
 'void main(){',
 ' vec3 N=normalize(vN);if(N.y<0.0)N=-N;',
 ' float h=vWorld.y;',
 ' vec3 green=layer(0.0,2.6);',
 ' vec3 farGreen=layer(8.0,46.0);',
 ' float visualDistance=length(vWorld.xz-cameraPosition.xz);',
 ' green=mix(green,farGreen,smoothstep(14.0,100.0,visualDistance));',
 ' vec3 earth=layer(1.0,3.2);',
 ' vec3 stony=layer(4.0,2.2);',
 ' vec3 moss=layer(3.0,3.4);',
 ' vec3 litter=layer(5.0,2.8);',
 ' vec3 snow=layer(6.0,6.0);',
 ' vec3 cliffNear=layer(2.0,3.1);',
 ' vec3 cliffFar=layer(7.0,74.0);',
 ' float cliff=1.0-smoothstep(0.43,0.78,N.y);',
 ' float shore=(1.0-smoothstep(0.3,3.2,h))*(1.0-cliff);',
 ' float snowy=smoothstep(1000.0,1450.0,h);',
 ' float path=texture(uNativePath,vWorld.xz/2048.0+0.5).r;',
 ' path*=1.0-smoothstep(0.5,0.85,cliff);',
 ' float naturalSoil=(1.0-smoothstep(0.73,0.96,N.y))*0.40;',
 ' vec3 col=mix(green,mix(earth,stony,0.22),sat(max(path*0.94,naturalSoil)));',
 ' col=mix(col,litter,smoothstep(0.52,0.80,fract(sin(dot(vWorld.xz,vec2(0.017,0.013)))*1582.423))*0.12);',
 ' col=mix(col,stony,shore);',
 ' col=mix(col,moss,cliff*0.13);',
 ' col=mix(col,cliffNear*cliffFar*2.1,cliff*0.94);',
 ' col=mix(col,snow,snowy*(1.0-cliff*0.7));',
 ' vec4 bump=texture(uUnsungDetail,vec3(vWorld.xz/2.6,0.0));',
 ' float detail=sat(0.82+0.26*(bump.r+bump.g));',
 ' vec3 sun=normalize(vec3(0.36,0.89,0.28));',
 ' float light=0.76+0.30*max(0.0,dot(N,sun));',
 ' col*=light*detail;',
 ' outColor=vec4(col,1.0);',
 '}'
].join('\n');

const WATERV=[
 'out vec3 vPosition;',
 'void main(){',
 ' vec4 p=modelMatrix*vec4(position,1.0);',
 ' vPosition=p.xyz;',
 ' gl_Position=projectionMatrix*viewMatrix*p;',
 '}'
].join('\n');
const WATERF=[
 'precision highp float;',
 'uniform sampler2D uCore,uRegion;',
 'uniform vec2 uCoreMinMax,uRegionMinMax;',
 'in vec3 vPosition;out vec4 outColor;',
 'float sampleHeight(sampler2D tex,vec2 uv,vec2 bounds){',
 ' vec4 p=texture(tex,clamp(uv,0.0,1.0));',
 ' float b0=floor(p.r*255.0+0.5),b1=floor(p.g*255.0+0.5);',
 ' return bounds.x+(b0*256.0+b1)/65535.0*(bounds.y-bounds.x);',
 '}',
 'void main(){',
 ' vec2 xz=vPosition.xz;',
 ' float hr=sampleHeight(uRegion,xz/16384.0+0.5,uRegionMinMax);',
 ' float hc=sampleHeight(uCore,xz/2048.0+0.5,uCoreMinMax);',
 ' float t=max(abs(xz.x),abs(xz.y))/1024.0;',
 ' float coreBlend=1.0-smoothstep(0.9,0.985,t);',
 ' float bed=mix(hr,hc,coreBlend);',
 ' float d=max(0.0,vPosition.y-bed);',
 ' vec3 turquoise=vec3(0.13,0.53,0.56),deep=vec3(0.018,0.17,0.28);',
 ' float deepK=smoothstep(1.2,30.0,d);',
 ' vec3 col=mix(turquoise,deep,deepK);',
 ' float shore=1.0-smoothstep(0.05,1.9,d);',
 ' col=mix(col,vec3(0.50,0.77,0.69),shore*0.5);',
 ' outColor=vec4(col,mix(0.56,0.91,deepK));',
 '}'
].join('\n');
const LEAFV=[
 'out vec2 vUv;', 'out float vLight;',
 'void main(){',
 ' vUv=uv;',
 ' vec4 q=instanceMatrix*vec4(position,1.0);',
 ' vec4 w=modelMatrix*q;',
 ' vec3 n=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);',
 ' vLight=0.66+0.35*max(0.0,dot(n,normalize(vec3(0.45,0.84,0.3))));',
 ' gl_Position=projectionMatrix*viewMatrix*w;',
 '}'
].join('\n');
const LEAFF=[
 'precision highp float;', 'precision highp sampler2DArray;',
 'in vec2 vUv;in float vLight;out vec4 outColor;',
 'uniform sampler2DArray uNativeLeafAtlas;', 'uniform float uLayer;',
 'void main(){',
 ' vec4 c=texture(uNativeLeafAtlas,vec3(vUv,uLayer));',
 ' if(c.a<0.37)discard;',
 ' outColor=vec4(c.rgb*vLight,1.0);',
 '}'
].join('\n');

const R=1024,SIZE=2048;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function originalUnsungPathMask(overview,{resolution=R,worldSize=SIZE}={}){
 const mask=new Uint8Array(resolution*resolution),toP=n=>(n/worldSize+.5)*resolution;
 const add=(x0,z0,x1,z1,r=6)=>{
  const a=toP(x0),b=toP(z0),c=toP(x1),d=toP(z1),rad=r/worldSize*resolution;
  const minX=clamp(Math.floor(Math.min(a,c)-rad-1),0,resolution-1),maxX=clamp(Math.ceil(Math.max(a,c)+rad+1),0,resolution-1);
  const minZ=clamp(Math.floor(Math.min(b,d)-rad-1),0,resolution-1),maxZ=clamp(Math.ceil(Math.max(b,d)+rad+1),0,resolution-1);
  const dx=c-a,dz=d-b,norm=dx*dx+dz*dz;
  for(let y=minZ;y<=maxZ;y++)for(let x=minX;x<=maxX;x++){
   const t=norm>0?clamp(((x+.5-a)*dx+(y+.5-b)*dz)/norm,0,1):0;
   const distance=Math.hypot(x+.5-a-dx*t,y+.5-b-dz*t);
   const k=clamp((rad+1-distance)/2,0,1);
   const v=Math.round(k*255),pos=y*resolution+x;if(v>mask[pos])mask[pos]=v;
  }
 };
 for(const path of overview?.routes||[])for(let i=1;i<path.length;i++)
  add(path[i-1][0],path[i-1][1],path[i][0],path[i][1],6);
 return mask;
}
function maskTexture(data,res){
 const tex=new THREE.DataTexture(data,res,res,THREE.RedFormat,THREE.UnsignedByteType);
 tex.minFilter=tex.magFilter=THREE.LinearFilter;tex.needsUpdate=true;return tex;
}
export function nativeEditorTerrainMaterial(renderer,overview,{qualityHigh=true}={}){
 // Exact shaders and exact procedural 9-layer game materials; only editor
 // blending/lighting is simplified to keep building mode responsive.
 const layers=new TextureForge(renderer).bake(TERRAIN_MATERIALS,qualityHigh?512:256);
 const pathPixels=originalUnsungPathMask(overview),nativePaths=maskTexture(pathPixels,R);
 const material=new THREE.ShaderMaterial({
  glslVersion:THREE.GLSL3,
  vertexShader:VX,fragmentShader:FR,side:THREE.DoubleSide,
  uniforms:{uUnsungAlbedo:{value:layers.a},uUnsungDetail:{value:layers.b},uNativePath:{value:nativePaths}}
 });
 material.name='HIGHFLY_P536_EXACT_UNSUNG_TEXTUREFORGE_LAYERS';
 return {material,pathPixels,dispose(){material.dispose();nativePaths.dispose();for(const rt of layers.targets)rt.dispose();}};
}
export async function nativeEditorStaticDepthWater(meta,resolveUrl){
 const loader=new THREE.TextureLoader();
 const files=await Promise.all(['core','region'].map(name=>loader.loadAsync(resolveUrl('native-terrain-'+name+'.png'))));
 files.forEach(f=>{f.colorSpace=THREE.NoColorSpace;f.minFilter=f.magFilter=THREE.NearestFilter;f.generateMipmaps=false;});
 const material=new THREE.ShaderMaterial({
  glslVersion:THREE.GLSL3,vertexShader:WATERV,fragmentShader:WATERF,
  transparent:true,depthWrite:false,side:THREE.DoubleSide,
  uniforms:{
   uCore:{value:files[0]},uRegion:{value:files[1]},
   uCoreMinMax:{value:new THREE.Vector2(meta.core.min,meta.core.max)},
   uRegionMinMax:{value:new THREE.Vector2(meta.region.min,meta.region.max)}
  }
 });
 material.name='HIGHFLY_P536_STATIC_NATIVE_HEIGHT_DEPTH_NO_WAVES_NO_REFLECTIONS';
 return {material,dispose(){material.dispose();files.forEach(f=>f.dispose());}};
}
function bladeGeometry(){
 // Exact THREE BLADE COORDINATES of original MIT Unsung GroundCover.
 const pos=[],idx=[];
 for(let b=0;b<3;b++){
  const o=b*5;
  pos.push(-1,0,b, 1,0,b, -1,.58,b, 1,.58,b, 0,1,b);
  idx.push(o,o+1,o+2,o+1,o+3,o+2,o+2,o+3,o+4);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
 return geo;
}
export function nativeEditorOriginalGrass({scene,elevation,overview,pathPixels,qualityHigh=()=>true,records=()=>[]}){
 const countMax=20000,blade=new THREE.InstancedMesh(bladeGeometry(),
  new THREE.MeshLambertMaterial({color:0xbed4a3,side:THREE.DoubleSide}),countMax);
 blade.name='HIGHFLY_P536_UNSUNG_ORIGINAL_TRIPLE_BLADE_GROUND_COVER';
 blade.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 blade.frustumCulled=false;scene.add(blade);
 const dummy=new THREE.Object3D(),rgb=new THREE.Color();
 let last=[Infinity,Infinity],lastQuality=null,redraws=0;
 function noGrass(x,z,y){
  if(y<.7)return true;
  if(Math.abs(x)>1000||Math.abs(z)>1000)return false;
  const ix=Math.floor((x/SIZE+.5)*R),iz=Math.floor((z/SIZE+.5)*R);
  if(ix>=0&&iz>=0&&ix<R&&iz<R&&pathPixels[iz*R+ix]>48)return true;
  for(const pool of overview?.pools||[])if(Math.hypot(x-pool.x,z-pool.z)<pool.r+2&&y<pool.level+.5)return true;
  for(const obj of records()){
   if(obj.type?.startsWith('npc-'))continue;
   if(!(obj.type?.startsWith('floor-')||obj.clearTrees))continue;
   const c=Math.cos(obj.yaw||0),s=Math.sin(obj.yaw||0),dx=x-obj.x,dz=z-obj.z;
   const w=(obj.type?.startsWith('floor-')?4:11)*(obj.scale||1);
   if(Math.abs(dx*c+dz*s)<w*.55&&Math.abs(-dx*s+dz*c)<w*.55)return true;
  }
  return false;
 }
 function update(x,z,force=false){
  const high=!!qualityHigh();
  if(!force&&high===lastQuality&&Math.hypot(x-last[0],z-last[1])<34)return false;
  last=[x,z];lastQuality=high;
  const max=high?16500:6500,rad=high?118:83;
  let seed=((Math.floor(x)*60493)^(Math.floor(z)*19213)^0x5e15a131)>>>0;
  const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  let n=0;const maxAttempts=max*2;
  for(let i=0;i<maxAttempts&&n<max;i++){
   const xx=x+(rnd()-.5)*rad*2,zz=z+(rnd()-.5)*rad*2,yy=elevation(xx,zz);
   if(noGrass(xx,zz,yy))continue;
   const k=0.46+rnd()*0.45;
   dummy.position.set(xx,yy-.05,zz);dummy.rotation.set(0,rnd()*Math.PI*2,0);
   dummy.scale.set(k*.75,k*(0.65+rnd()*.35),k*.75);dummy.updateMatrix();
   blade.setMatrixAt(n,dummy.matrix);
   rgb.setRGB(.76+rnd()*.14,.88+rnd()*.11,.56+rnd()*.16);
   blade.setColorAt(n,rgb);n++;
  }
  blade.count=n;blade.instanceMatrix.needsUpdate=true;
  if(blade.instanceColor)blade.instanceColor.needsUpdate=true;
  redraws++;return true;
 }
 return {mesh:blade,update,get redraws(){return redraws},dispose(){scene.remove(blade);blade.geometry.dispose();blade.material.dispose();}};
}
export function nativeEditorOriginalLeaves(renderer,treeGroup,{qualityHigh=true}={}){
 // Original game-generated SDF leaf/blossom atlas, NOT a generic flat canopy.
 const atlas=bakeLeafAtlas(renderer,qualityHigh?192:128),mats=[];
 for(let kind=0;kind<5;kind++){
  const lod=treeGroup?.userData?.lods?.[kind];if(!lod)continue;
  const mat=new THREE.ShaderMaterial({
   glslVersion:THREE.GLSL3,vertexShader:LEAFV,fragmentShader:LEAFF,side:THREE.DoubleSide,
   uniforms:{uNativeLeafAtlas:{value:atlas.a},uLayer:{value:kind}}
  });
  mat.name='HIGHFLY_P536_ORIGINAL_UNSUNG_LEAF_ATLAS_'+kind;
  lod.nearLeaves.material=mat;mats.push(mat);
 }
 return {atlas,mats,dispose(){mats.forEach(mat=>mat.dispose());}};
}
