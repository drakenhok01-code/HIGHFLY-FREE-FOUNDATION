// P565: reuse the native runtime shader and live lighting uniforms. Only replace
// the native heightfield vertex placement with actual regional geometry.
import * as THREE from 'three';
const replace=(s,a,b)=>{if(!s.includes(a))throw Error('P565 shader anchor '+a);return s.replace(a,b)};
export function nativeRegionMaterials(terrain,water){
 const native=terrain.material;
 let frag=replace(native.fragmentShader,'in vec3 vWorld;','in vec3 vWorld; in float vRegionSoil; in vec3 vRegionNormal;');
 frag=replace(frag,'float steeper = smoothstep(0.1, 0.34, N.y - Ng.y);','N = normalize(vRegionNormal); nm.a = 1.0 - smoothstep(0.43,0.84,N.y); nm.b=0.5; aoM=1.0; float steeper = smoothstep(0.1, 0.34, N.y - Ng.y);');
 frag=replace(frag,'float path = cw > 0.0 ? texture(uPathTex, xz / CORE_SIZE + 0.5).r * cw * (1.0 - cliff) : 0.0;','float path = vRegionSoil * (1.0 - cliff);');
 const vert='in float aRegionSoil; out float vRegionSoil; out vec3 vRegionNormal; out vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; vRegionNormal=normalize(mat3(modelMatrix)*normal); vRegionSoil=aRegionSoil; gl_Position=projectionMatrix*viewMatrix*w;}';
 const empty=new THREE.DataTexture(new Uint8Array([0]),1,1,THREE.RedFormat);empty.needsUpdate=true;const pathTex={value:empty},pathBounds={value:new THREE.Vector4()},pathOn={value:0};const gfrag=frag.replace('in vec3 vWorld;','uniform sampler2D uHFPath; uniform vec4 uHFPathBounds; uniform float uHFPathOn; in vec3 vWorld;').replace('float path = vRegionSoil * (1.0 - cliff);','vec2 pathUV=(xz-uHFPathBounds.xy)/max(uHFPathBounds.zw,vec2(1.0)); float trail=uHFPathOn>0.5?texture(uHFPath,clamp(pathUV,0.0,1.0)).r:0.0; float path=max(vRegionSoil*0.55,smoothstep(0.06,0.95,trail))*(1.0-cliff);');const ground=new THREE.ShaderMaterial({vertexShader:vert,fragmentShader:gfrag,defines:{...native.defines},uniforms:{...native.uniforms,uHFPath:pathTex,uHFPathBounds:pathBounds,uHFPathOn:pathOn},side:THREE.DoubleSide});
 ground.name='P565_NATIVE_UNSUNG_REGION';
 const road=ground.clone();road.uniforms=ground.uniforms;road.vertexShader=vert.replace('vRegionSoil=aRegionSoil;','vRegionSoil=1.0;');road.fragmentShader=replace(frag,'float path = vRegionSoil * (1.0 - cliff);','float path = 0.88 * (1.0 - cliff);');road.polygonOffset=true;road.polygonOffsetFactor=-1;road.polygonOffsetUnits=-1;road.name='P565_NATIVE_UNSUNG_ROAD';
 return {ground,road,water:water.material,setPaths(mask,b){if(pathTex.value!==empty)pathTex.value.dispose();pathTex.value=empty;pathOn.value=0;if(!mask)return;const t=new THREE.DataTexture(mask.buf,mask.w,mask.h,THREE.RedFormat);t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;pathTex.value=t;pathBounds.value.set(b.minX,b.minZ,b.maxX-b.minX,b.maxZ-b.minZ);pathOn.value=1}};
}
