/**
 * HIGHFLY P543: original Unsung terrain surface materials, localized to
 * conforming walkable tiles. Explicit GLSL3 program, native TextureForge 9-layer
 * array, and robust warm/green fallback (never a flat black cuboid).
 * No external textures, no restricted assets; the native game shader owns atlas.
 */
export function makeNaturalSurfaceMaterial(THREE,nativeMaterial,type){
 const atlas=nativeMaterial?.uniforms?.uUnsungAlbedo?.value;
 if(!atlas)return null;
 const dirt=type==='floor-earth';
 const vertexShader=[
  'out vec3 vGroundPos;','out vec3 vGroundNormal;',
  'void main(){vec4 w=modelMatrix*vec4(position,1.0);',
  'vGroundPos=w.xyz;vGroundNormal=normalize(mat3(modelMatrix)*normal);',
  'gl_Position=projectionMatrix*viewMatrix*w;}'
 ].join('\n');
 // Layers are exactly from Unsung's original TERRAIN_MATERIALS + TextureForge.
 // Native dirt = layers 1 and 4, native grass = layers 0 and 8.
 const fragmentShader=[
  'precision highp float;','precision highp sampler2DArray;',
  'uniform sampler2DArray uUnsungAlbedo;',
  'in vec3 vGroundPos;in vec3 vGroundNormal;out vec4 outColor;',
  'vec3 nativeLayer(float i,float width){return texture(uUnsungAlbedo,vec3(vGroundPos.xz/width,i)).rgb;}',
  'void main(){',
  'vec3 N=normalize(vGroundNormal);if(N.y<0.0)N=-N;',
  'vec3 grass=nativeLayer(0.0,2.6);',
  'vec3 farGrass=nativeLayer(8.0,46.0);',
  'vec3 soil=nativeLayer(1.0,3.2);',
  'vec3 stone=nativeLayer(4.0,2.2);',
  dirt?'vec3 nativeColor=mix(soil,stone,0.22);':'vec3 nativeColor=mix(grass,farGrass,smoothstep(14.0,100.0,length(vGroundPos.xz-cameraPosition.xz)));',
  dirt?'vec3 safeTint=vec3(0.45,0.34,0.24);':'vec3 safeTint=vec3(0.24,0.39,0.18);',
  // Prevent broken/empty atlas layers from ever drawing absolute black.
  'vec3 col=mix(safeTint,nativeColor,clamp(dot(nativeColor,vec3(0.333))*3.0,0.48,1.0));',
  'float light=0.78+0.24*max(0.0,dot(N,normalize(vec3(.36,.89,.28))));',
  'outColor=vec4(max(col*light,vec3(0.12)),1.0);',
  '}'
 ].join('\n');
 const material=new THREE.ShaderMaterial({
  name:'HIGHFLY_P543_TRUE_UNSUNG_'+(dirt?'SOIL':'GRASS')+'_NO_BLACK_TILES',
  glslVersion:THREE.GLSL3,
  vertexShader,fragmentShader,
  uniforms:{uUnsungAlbedo:{value:atlas}},
  side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,
  polygonOffsetUnits:-2
 });
 material.userData.nativeUnsung=true;
 material.userData.sourceLayer=dirt?1:0;
 return material;
}
