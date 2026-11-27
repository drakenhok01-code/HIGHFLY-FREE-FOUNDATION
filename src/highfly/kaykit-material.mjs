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
'uniform vec3 uHFAppearanceTint;',
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
'vec3 key=normalize(vec3(0.48,0.92,0.34));vec3 fill=normalize(vec3(-0.62,0.42,-0.45));',
'float ndl=max(dot(n,key),0.0),bounce=max(dot(n,fill),0.0);',
'float light=0.52+0.38*ndl+0.10*bounce;',
'vec3 color=texel.rgb*uHFAppearanceTint*light+vec3(1.0,0.82,0.54)*uFlash;',
'vec3 view=normalize(cameraPosition-vWorld);',
'float spec=pow(max(dot(reflect(-key,n),view),0.0),28.0)*.11;',
'color+=vec3(.87,.93,1.0)*spec;',
'float edge=pow(1.0-max(dot(n,view),0.0),3.0);',
'color+=edge*(uRim*.7+.10)*vec3(0.66,0.54,0.82);',
'gl_FragColor=vec4(color,1.0);',
'}'
].join('\n');
export function createUniversalMaterial(material,flash,rim){
 if(!material?.map)throw Error('KayKit CC0 atlas texture missing');
 return new THREE.ShaderMaterial({
  vertexShader:vertex,fragmentShader:fragment,
  uniforms:{uDiffuse:{value:material.map},uHFAppearanceTint:{value:new THREE.Color(0xffffff)},uFlash:flash,uRim:rim},
  side:THREE.DoubleSide,transparent:false,depthTest:true,depthWrite:true,
  toneMapped:false
 });
}
