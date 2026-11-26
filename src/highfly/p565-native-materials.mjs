// P565: reuse the native runtime shader and live lighting uniforms. Only replace
// the native heightfield vertex placement with actual regional geometry.
import * as THREE from 'three';
const replace=(s,a,b)=>{if(!s.includes(a))throw Error('P565 shader anchor '+a);return s.replace(a,b)};
export function nativeRegionMaterials(terrain,water){
 const fallback=new THREE.DataTexture(new Uint8Array(1),1,1,THREE.RedFormat);fallback.needsUpdate=true;const roadMaskUniform={value:fallback},roadBounds={value:new THREE.Vector4(0,0,1,1)},roadEnabled={value:0};
 const native=terrain.material;
 let frag=replace(native.fragmentShader,'in vec3 vWorld;','in vec3 vWorld; in float vRegionSoil; in vec3 vRegionNormal; uniform sampler2D uHFDirtMask; uniform vec4 uHFDirtBounds; uniform float uHFDirtEnabled;');
 frag=replace(frag,'float steeper = smoothstep(0.1, 0.34, N.y - Ng.y);','N = normalize(vRegionNormal); nm.a = 1.0 - smoothstep(0.43,0.84,N.y); nm.b=0.5; aoM=1.0; float steeper = smoothstep(0.1, 0.34, N.y - Ng.y);');
 frag=replace(frag,'float path = cw > 0.0 ? texture(uPathTex, xz / CORE_SIZE + 0.5).r * cw * (1.0 - cliff) : 0.0;','vec2 hfRoadUV=(xz-uHFDirtBounds.xy)/uHFDirtBounds.zw; float hfDirt=uHFDirtEnabled>0.5&&all(greaterThanEqual(hfRoadUV,vec2(0.0)))&&all(lessThanEqual(hfRoadUV,vec2(1.0)))?texture(uHFDirtMask,hfRoadUV).r:0.0; float path = max(vRegionSoil,hfDirt) * (1.0 - cliff);');
 const vert='in float aRegionSoil; out float vRegionSoil; out vec3 vRegionNormal; out vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; vRegionNormal=normalize(mat3(modelMatrix)*normal); vRegionSoil=aRegionSoil; gl_Position=projectionMatrix*viewMatrix*w;}';
 const ground=new THREE.ShaderMaterial({vertexShader:vert,fragmentShader:frag,defines:{...native.defines},uniforms:{...native.uniforms,uHFDirtMask:roadMaskUniform,uHFDirtBounds:roadBounds,uHFDirtEnabled:roadEnabled},side:THREE.DoubleSide});
 ground.name='P565_NATIVE_UNSUNG_REGION';
 const road=ground.clone();road.uniforms=ground.uniforms;road.vertexShader=vert.replace('vRegionSoil=aRegionSoil;','vRegionSoil=1.0;');road.fragmentShader=replace(frag,'path * flat_ * 0.62','path * flat_ * 0.16');road.name='P565_NATIVE_UNSUNG_ROAD';
 return {ground,road,water:water.material,setRoadMask(tex,b){roadMaskUniform.value=tex??fallback;if(b)roadBounds.value.copy(b);roadEnabled.value=tex?1:0}};
}
