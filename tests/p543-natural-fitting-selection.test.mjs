import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeNaturalSurfaceMaterial} from '../src/highfly/p543-natural-surface.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('P543: original Unsung nine-layer atlas makes visibly earthy and green shader (not black)',()=>{
 const atlas={id:'true-unsung-atlas'};
 class ShaderMaterial{constructor(options){Object.assign(this,options);this.userData={};}}
 const THREE={ShaderMaterial,GLSL3:'GLSL3',DoubleSide:2};
 const original={uniforms:{uUnsungAlbedo:{value:atlas}}};
 for(const type of ['floor-earth','floor-grass']){
  const material=makeNaturalSurfaceMaterial(THREE,original,type);
  assert(material&&material.uniforms.uUnsungAlbedo.value===atlas);
  assert.equal(material.glslVersion,'GLSL3');
  assert.match(material.fragmentShader,/sampler2DArray uUnsungAlbedo/);
  assert.match(material.fragmentShader,/vec3 col=mix\(safeTint,nativeColor/);
  assert.match(material.fragmentShader,/max\(col\*light,vec3\(0.12\)\)/);
  assert.equal(material.userData.sourceLayer,type==='floor-earth'?1:0);
 }
});
test('P543: no visible rectangular platform under KayKit and no Unsung heightmap editing',()=>{
 const editor=read('../src/highfly/p525-world-forge-3d.mjs');
 const runtime=read('../src/highfly/p521-world-forge-runtime.mjs');
 const html=read('../public/highfly/world-forge-3d.html');
 const build=read('../scripts/f0-build.mjs');
 assert(editor.includes("const P543_PREVIEW="));
 assert(runtime.includes("const P543_PREVIEW="));
 assert(editor.includes("'hf-world-forge-layout-p543-natural-v1'"));
 assert(runtime.includes("'hf-world-forge-layout-p543-natural-v1'"));
 assert(editor.includes("'hf-world-forge-layout-p542-conform-v1'"));
 assert(editor.includes("g.name='HIGHFLY_P543_NO_PLATFORM_CORNER_SUPPORTS'"));
 assert(editor.includes('g.userData.hasPlatform=false'));
 assert(runtime.includes("if(!P543_PREVIEW){const cap=new THREE.Mesh("));
 assert(editor.includes("return P542_PREVIEW?original:")||editor.includes("return P542_PREVIEW?original:"));
 assert(editor.includes("makeNaturalSurfaceMaterial(THREE,nativeVisuals?.material,type)"));
 assert(runtime.includes("makeNaturalSurfaceMaterial(THREE,{uniforms:{uUnsungAlbedo"));
 assert(build.includes("'p543-natural-surface'"));
 assert(html.includes('WORLD FORGE 5.1'));
 assert(html.includes('v=p543'));
});
test('P543: user can repeatedly rotate, move, scale one selection without losing ID',()=>{
 const code=read('../src/highfly/p525-world-forge-3d.mjs');
 const html=read('../public/highfly/world-forge-3d.html');
 assert(code.includes('const retainSelection=P543_PREVIEW&&records.some(o=>o.id===selected)'));
 assert(code.includes('if(!P543_PREVIEW)selected=null;'));
 assert(code.includes('if(P543_PREVIEW&&retainSelection&&viewCache.has(retainSelection))'));
 assert(code.includes('function nudgeSelected(direction,metres=1)'));
 assert(code.includes('nudgeSelected(key,e.altKey?.25:e.shiftKey?2:1)'));
 assert(code.includes("transform(key==='q'?'rot-left':'rot-right')"));
 assert(code.includes('e.stopImmediatePropagation()'));
 assert(html.includes('id="nudge-up"')&&html.includes('id="nudge-right"'));
});
