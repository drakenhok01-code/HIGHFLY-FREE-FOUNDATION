/** HIGHFLY F0.8: exactly the GPU-skinning vertex shader of Unsung Hero.
 * KayKit CC0 texture atlas, same native camera, depth pass and skinning.
 * No second canvas, no CPU copy, no PBR light dependencies.
 */
import * as THREE from 'three';
import {HERO_VERT} from '../anim/hero.js';
const vertex=HERO_VERT
  .replace('out vec3 vWorld;','out vec2 vHFUV; out vec3 vWorld;')
  .replace('void main() {','void main() { vHFUV = uv;');
const fragment=[
'uniform sampler2D uDiffuse;',
'uniform float uFlash;',
'uniform float uRim;',
'in vec2 vHFUV;',
'in vec3 vWorld;',
'in vec3 vNormal;',
'in vec3 vRest;',
'void main(){',
'vec4 texel=texture(uDiffuse,vHFUV);',
'if(texel.a<0.08)discard;',
'vec3 n=normalize(vNormal);',
'float light=0.68+0.29*max(dot(n,normalize(vec3(0.4,0.9,0.35))),0.0);',
'vec3 color=texel.rgb*light+vec3(1.0,0.82,0.54)*uFlash;',
'float edge=pow(1.0-max(dot(n,normalize(cameraPosition-vWorld)),0.0),3.0);',
'color+=edge*uRim*vec3(0.5,0.35,0.16);',
'gl_FragColor=vec4(color,1.0);',
'}'
].join('\n');
export function createUniversalMaterial(material,flash,rim){
 if(!material?.map)throw Error('KayKit CC0 atlas texture missing');
 return new THREE.ShaderMaterial({
  vertexShader:vertex,fragmentShader:fragment,
  uniforms:{uDiffuse:{value:material.map},uFlash:flash,uRim:rim},
  side:THREE.DoubleSide,transparent:false,depthTest:true,depthWrite:true,
  toneMapped:false
 });
}
