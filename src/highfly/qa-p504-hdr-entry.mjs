/** Real WebGL2 HDR texture pipeline A/B, never a mock renderer. */
import * as THREE from 'three';
import {selectP504HdrFormat} from './p504-hdr-options.mjs';
import {BloomPass} from '../engine/post.js';
const stats={ready:false,packed:false,reason:'',meanAbsRGB:null,maxAbsRGB:null,missingPixels:null,width:320,height:180};
window.__hfP504VisualQA=stats;
let renderer=null;
try{
 const canvas=document.querySelector('#view');
 renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(1);renderer.setSize(320,180,false);
 renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
 const opts=selectP504HdrFormat(renderer,'?hfcompact=1');
 stats.packed=opts.enabled;stats.reason=opts.reason;
 if(opts.enabled){
  const W=320,H=180;
  const vertex='in vec3 position; out vec2 uv; void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1.0);}';
  const picture=`precision highp float; in vec2 uv; layout(location=0) out vec4 outColor;
   void main(){vec3 rgb=vec3(uv.x*7.0+0.01,uv.y*4.0+0.015,
    sin(uv.x*36.7+uv.y*21.3)*.35+.5);outColor=vec4(rgb,1.0);}`;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,10);
  camera.position.z=1;camera.lookAt(0,0,0);
  const plane=new THREE.PlaneGeometry(2,2);
  const mesh=new THREE.Mesh(plane,new THREE.RawShaderMaterial({glslVersion:THREE.GLSL3,vertexShader:vertex,fragmentShader:picture,depthTest:false,depthWrite:false}));
  scene.add(mesh);
  const reference=new THREE.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false,type:THREE.HalfFloatType,format:THREE.RGBAFormat});
  const packed=new THREE.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false,...opts.options});
  renderer.setRenderTarget(reference);renderer.clear();renderer.render(scene,camera);
  renderer.setRenderTarget(packed);renderer.clear();renderer.render(scene,camera);
  const show=new THREE.RawShaderMaterial({glslVersion:THREE.GLSL3,vertexShader:vertex,
   fragmentShader:`precision highp float;in vec2 uv;uniform sampler2D tex;layout(location=0) out vec4 outColor;
    void main(){vec3 c=max(texture(tex,uv).rgb,vec3(0.0));outColor=vec4(c/(vec3(1.0)+c),1.0);}`,
   uniforms:{tex:{value:null}},depthTest:false,depthWrite:false});
  mesh.material=show;
  const screen=new THREE.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false,type:THREE.UnsignedByteType,format:THREE.RGBAFormat});
  function snap(rt){
   show.uniforms.tex.value=rt.texture;renderer.setRenderTarget(screen);renderer.clear();renderer.render(scene,camera);
   const pixels=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(screen,0,0,W,H,pixels);return pixels;
  }
  const a=snap(reference),bb=snap(packed);
  let sum=0,max=0,count=0,missing=0;
  for(let i=0;i<a.length;i+=4){
   for(let j=0;j<3;j++){const d=Math.abs(a[i+j]-bb[i+j]);sum+=d;max=Math.max(max,d);count++;}
   if(bb[i]===0&&bb[i+1]===0&&bb[i+2]===0)missing++;
  }
  stats.meanAbsRGB=Math.round(sum/count*1000)/1000;stats.maxAbsRGB=max;stats.missingPixels=missing;
  // P505: test the ACTUAL imported Unsung bloom shader and its complete
  // six-down/five-up chain in RGBA16F vs RGB11F. Compare the display-tonemapped
  // pixel outputs; never infer visual equality from format flags.
  const bloomOriginal=new BloomPass(),bloomPacked=new BloomPass();
  bloomPacked._hfCompactHdr=opts.options;
  bloomOriginal.setSize(W,H);bloomPacked.setSize(W,H);
  const texOriginal=bloomOriginal.render(renderer,packed.texture);
  const texPacked=bloomPacked.render(renderer,packed.texture);
  const bloomA=snap({texture:texOriginal}),bloomB=snap({texture:texPacked});
  let bloomSum=0,bloomMax=0,bloomCount=0,bloomMissing=0;
  for(let i=0;i<bloomA.length;i+=4){
   for(let j=0;j<3;j++){const d=Math.abs(bloomA[i+j]-bloomB[i+j]);
    bloomSum+=d;bloomMax=Math.max(bloomMax,d);bloomCount++;}
   if(bloomB[i]===0&&bloomB[i+1]===0&&bloomB[i+2]===0) bloomMissing++;
  }
  stats.bloomMeanAbsRGB=Math.round(bloomSum/bloomCount*1000)/1000;
  stats.bloomMaxAbsRGB=bloomMax;stats.bloomMissingPixels=bloomMissing;
  stats.bloomPackedFormat=bloomPacked.mips.every(t=>t.texture.type===THREE.UnsignedInt101111Type);
  for(const pass of [bloomOriginal,bloomPacked]){
   pass.mips?.forEach(t=>t.dispose());pass.ups?.forEach(t=>t.dispose());
   pass.down.dispose();pass.up.dispose();
  }

  screen.dispose();reference.dispose();packed.dispose();show.dispose();plane.dispose();
 }
 stats.ready=true;
}catch(error){stats.error=String(error);stats.ready=true;}
finally{document.querySelector('#stats').textContent=JSON.stringify(stats,null,2);renderer?.dispose();}
