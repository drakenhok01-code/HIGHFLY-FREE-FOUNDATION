/** HIGHFLY P5.0.4: S23 full-resolution HDR-bandwidth laboratory.
 * ?hfcompact=1 only: use renderable packed RGB11F/G11F/B10F HDR
 * for high-traffic scene/fog/refraction/TAA textures (4 B/pixel vs 8 B).
 * Same 3D and output resolution. Precision differs slightly from FP16,
 * so this mode must pass visual A/B on the real phone before enabling.
 * Every unsupported context retains the original RGBA16F pipeline.
 */
import * as THREE from 'three';
export function selectP504HdrFormat(renderer,search='',Three=THREE){
 const q=new URLSearchParams(search||'');
 if(q.get('hfcompact')!=='1'||q.get('hffastcopy')==='1')
   return {enabled:false,reason:'reference'};
 const gl=renderer?.getContext?.();
 if(!gl||!gl.getExtension?.('EXT_color_buffer_float') ||
    Three.UnsignedInt101111Type==null||Three.RGBFormat==null)
   return {enabled:false,reason:'unsupported'};
 let probe=null;
 try{
  probe=new Three.WebGLRenderTarget(4,4,{
   type:Three.UnsignedInt101111Type,format:Three.RGBFormat,
   depthBuffer:false,stencilBuffer:false,generateMipmaps:false,
   minFilter:Three.LinearFilter,magFilter:Three.LinearFilter,
  });
  renderer.initRenderTarget(probe);
  renderer.setRenderTarget(probe);
  const valid=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  renderer.setRenderTarget(null);probe.dispose();
  if(!valid)return {enabled:false,reason:'incomplete-fbo'};
  return {enabled:true,reason:'packed-rgb-hdr',
   options:{type:Three.UnsignedInt101111Type,format:Three.RGBFormat}};
 }catch(e){
  try{renderer.setRenderTarget(null)}catch{}
  try{probe?.dispose()}catch{}
  return {enabled:false,reason:'gpu-probe-error'};
 }
}
export function projectedP504Bandwidth(width,height,fullResSurfaces=5){
 const pixels=Math.max(0,Math.floor(width))*Math.max(0,Math.floor(height));
 const originals=pixels*fullResSurfaces*8;
 const compact=pixels*fullResSurfaces*4;
 return {pixels,originalBytes:originals,packedBytes:compact,
   savedBytes:originals-compact,savedPercent:50};
}
