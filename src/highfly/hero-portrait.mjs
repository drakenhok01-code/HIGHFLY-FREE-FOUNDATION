/** HIGHFLY F0.14.2 - TRUE live player portrait.
 * Renders the ORIGINAL in-world actor with the existing Three/WebGL renderer.
 * No cloned model, extra WebGL context, or separate game Player. The scene
 * uses an opt-in camera layer so world/terrain are never drawn into portrait.
 */
import * as THREE from 'three';

export const PORTRAIT_LAYER=28;
const cache=new WeakMap();
function stageRenderer(renderer,w,h){
 let state=cache.get(renderer);
 if(state?.w===w&&state?.h===h)return state;
 state?.target?.dispose();
 state={target:new THREE.WebGLRenderTarget(w,h,{depthBuffer:true,stencilBuffer:false}),
   pixels:new Uint8Array(w*h*4),flipped:new Uint8ClampedArray(w*h*4),w,h};
 cache.set(renderer,state);
 return state;
}
export function paintLiveHero(game,canvas,turn=0){
 const actor=game?.hero?.actor;
 const pipe=game?.pipe;
 const renderer=pipe?.renderer;
 if(!actor||!pipe?.scene||!renderer||!canvas?.getContext)return {ok:false,reason:'El modelo 3D todavía está cargando'};
 const rect=canvas.getBoundingClientRect();
 if(rect.width<30||rect.height<30)return {ok:false,reason:'Panel 3D sin tamaño'};
 const w=Math.max(96,Math.min(420,Math.round(rect.width*1.35)));
 const h=Math.max(128,Math.min(500,Math.round(rect.height*1.35)));
 const state=stageRenderer(renderer,w,h);
 const camera=new THREE.PerspectiveCamera(34,w/h,.1,22);
 camera.layers.set(PORTRAIT_LAYER);
 const position=actor.getWorldPosition(new THREE.Vector3());
 const yaw=(Number(game.player?.yaw)||0)+turn;
 const target=position.clone().add(new THREE.Vector3(0,1.04,0));
 const distance=3.7;
 camera.position.set(position.x+Math.sin(yaw)*distance,position.y+1.04+0.18,position.z+Math.cos(yaw)*distance);
 camera.lookAt(target);camera.updateMatrixWorld();
 actor.updateMatrixWorld(true);
 // Layer enable preserves layer 0, so the real world game render is unchanged.
 actor.traverse(node=>node.layers.enable(PORTRAIT_LAYER));
 const previousTarget=renderer.getRenderTarget();
 const previousAutoClear=renderer.autoClear;
 const previousColor=renderer.getClearColor(new THREE.Color()).clone();
 const previousAlpha=renderer.getClearAlpha();
 const prevViewport=renderer.getViewport(new THREE.Vector4()).clone();
 const prevScissor=renderer.getScissor(new THREE.Vector4()).clone();
 const prevScissorTest=renderer.getScissorTest();
 try{
  renderer.autoClear=true;
  renderer.setRenderTarget(state.target);
  renderer.setViewport(0,0,w,h);
  renderer.setScissorTest(false);
  renderer.setClearColor(0x06031a,0);
  renderer.clear(true,true,true);
  renderer.render(pipe.scene,camera);
  renderer.readRenderTargetPixels(state.target,0,0,w,h,state.pixels);
  const stride=w*4;
  for(let y=0;y<h;y++)state.flipped.set(state.pixels.subarray((h-1-y)*stride,(h-y)*stride),y*stride);
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('Canvas 2D unavailable');
  ctx.putImageData(new ImageData(state.flipped,w,h),0,0);
  // Do not fake an image: ensure the actual GPU portrait has opaque pixels.
  let pixels=0;
  for(let i=3;i<state.flipped.length;i+=20)if(state.flipped[i]>16)pixels++;
  return {ok:pixels>12,pixels,actor:actor.name,rendererReused:true,width:w,height:h,
    reason:pixels>12?'':'El actor no produjo píxeles visibles'};
 }catch(err){
  console.error('[HIGHFLY 3D PORTRAIT]',err);
  return {ok:false,reason:String(err?.message??err)};
 }finally{
  renderer.setRenderTarget(previousTarget);
  renderer.setViewport(prevViewport);
  renderer.setScissor(prevScissor);
  renderer.setScissorTest(prevScissorTest);
  renderer.setClearColor(previousColor,previousAlpha);
  renderer.autoClear=previousAutoClear;
 }
}
