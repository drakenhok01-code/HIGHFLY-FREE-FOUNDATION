/** HIGHFLY P5.0.3: lossless GPU copy of the opaque HDR texture.
 * Replaces an HDR full-screen draw by an equivalent WebGL2 GPU-side copy.
 * Exact same pixel dimensions and RGBA16F format. Experimental opt-in
 * ?hffastcopy=1 until verified on Adreno 740 against reference.
 */
export function installP503OpaqueCopy(pipe,opts={}){
 const search=opts.search??globalThis.location?.search??'';
 const q=new URLSearchParams(search);
 if(q.get('hffastcopy')!=='1')return {enabled:false,dispose(){}};
 const copy=pipe?.copyPass,renderer=pipe?.renderer;
 if(!copy||typeof copy.render!=='function'||!renderer||typeof renderer.copyTextureToTexture!=='function'||typeof renderer.initRenderTarget!=='function')return {enabled:false,dispose(){}};
 const old=copy.render;
 let enabled=true,used=0,failed=0;
 const initialized=new WeakSet();
 const wrapped=function(r,target){
  if(!enabled||r!==renderer||target!==pipe.rtOpaque||
     copy.uniforms?.uTex?.value!==pipe.rtScene?.texture||
     target.width!==pipe.rtScene?.width||target.height!==pipe.rtScene?.height){
   return old.call(this,r,target);
  }
  try{
   // Resize creates new targets. Initialize only once per target to avoid
   // reallocation/driver stalls while playing.
   if(!initialized.has(target)){r.initRenderTarget(target);initialized.add(target);}
   // Three.js r187 uses copyTexSubImage2D from the source FBO. As opposed
   // to a shader it copies the same HDR texels without a sampling pass.
   r.copyTextureToTexture(pipe.rtScene.texture,target.texture);
   used++;
   return undefined;
  }catch(error){
   enabled=false;failed++;
   opts.onFailure?.(error);
   return old.call(this,r,target);
  }
 };
 copy.render=wrapped;
 const api={enabled:true,get active(){return enabled},get used(){return used},get failed(){return failed},
  dispose(){if(copy.render===wrapped)copy.render=old;enabled=false;}};
 return api;
}
