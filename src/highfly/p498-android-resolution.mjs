/** HIGHFLY P4.9.8 — Android physical framebuffer lab.
 * Unsung's own pipeline sizes its AA / bloom / depth / fog targets in setSize.
 * Resize ONE existing pipeline to actual drawing pixels; don't setPixelRatio(DPR)
 * and double-scale the final canvas. No second renderer or scene.
 */
const MIN = 1;
const MODES=Object.freeze({css:1,mid:1.5,sharp:2,native:Infinity});
export const ANDROID_PIXEL_MODES=MODES;
export function physicalFrameSize(cssWidth,cssHeight,dpr=1,mode='mid',limits={}){
 const cssW=Math.max(2,Math.round(Number(cssWidth)||2));
 const cssH=Math.max(2,Math.round(Number(cssHeight)||2));
 const ratio=Math.max(1,Math.min(4,Number(dpr)||1));
 const goal=Object.hasOwn(MODES,mode)?MODES[mode]:MODES.mid;
 const factor=Math.min(ratio,goal);
 const maxSize=Math.max(256,Number(limits.maxTextureSize)||8192,0);
 const maxPixels=Math.max(256*256,Number(limits.maxPixels)||3088*1440);
 const bound=Math.min(1,maxSize/(cssW*factor),maxSize/(cssH*factor),Math.sqrt(maxPixels/(cssW*cssH*factor*factor)));
 const w=Math.max(2,Math.floor(cssW*factor*bound));
 const h=Math.max(2,Math.floor(cssH*factor*bound));
 return {cssW,cssH,w,h,dpr:ratio,pixelFactor:w/cssW,mode,physicalWidth:Math.round(cssW*ratio),physicalHeight:Math.round(cssH*ratio),hardwareCapped:bound<.999};
}
export function installAndroidPhysicalResolution(pipe,opts={}){
 const canvas=pipe.renderer.domElement;
 const win=opts.win??window,doc=opts.doc??document;
 const query=new URLSearchParams(opts.search??win.location?.search??'');
 const storage=opts.storage??win.localStorage;
 let saved=null;try{saved=storage?.getItem('highfly-android-pixels-v1')}catch{}
 let mode=query.get('hfpx')||saved||'mid';
 if(!Object.hasOwn(MODES,mode))mode='mid';
 const gl=pipe.renderer.getContext?.(),maxTextureSize=gl?.getParameter?.(gl.MAX_TEXTURE_SIZE)||8192;
 const maxRenderbuffer=gl?.getParameter?.(gl.MAX_RENDERBUFFER_SIZE)||maxTextureSize;
 const limits={maxTextureSize:Math.min(maxTextureSize,maxRenderbuffer),maxPixels:3088*1440};
 let last=null,seq=0;
 // This wrapper runs only on actual layout change / explicit user selection.
 // Unsung can use one renderScale governor independently; use android profile
 // for pixel-perfect comparisons so it cannot lower internal scene resolution.
 const resize=()=>{
  const cssW=Math.max(2,Math.round(win.innerWidth||canvas.clientWidth||1280));
  const cssH=Math.max(2,Math.round(win.innerHeight||canvas.clientHeight||720));
  const x=physicalFrameSize(cssW,cssH,win.devicePixelRatio||1,mode,limits);
  if(!last||last.w!==x.w||last.h!==x.h){
   pipe.setSize(x.w,x.h);pipe.taa.reset=true;
   if(canvas.style){canvas.style.width=cssW+'px';canvas.style.height=cssH+'px';}
  }
  last=x;seq++;
  return measure();
 };
 const measure=()=>{
  const gl=pipe.renderer.getContext?.();
  return {mode,css:[last?.cssW??0,last?.cssH??0],
   dpr:last?.dpr??1,requestedPhysical:[last?.physicalWidth??0,last?.physicalHeight??0],
   drawingBuffer:[gl?.drawingBufferWidth??canvas.width,gl?.drawingBufferHeight??canvas.height],
   renderTargets:[pipe.rw,pipe.rh],taaTargets:pipe.taa?.history?.map(t=>[t.width,t.height])??[],
   scale:pipe.renderScale,hardwareCapped:last?.hardwareCapped??false,
   actualFactor:last?.pixelFactor??1,
   fps:Math.round(win.__gov?.fps??0),seq};
 };
 const set=(name)=>{
  if(!Object.hasOwn(MODES,name))return false;
  mode=name;try{storage?.setItem('highfly-android-pixels-v1',mode)}catch{}
  resize();return true;
 };
 win.addEventListener?.('resize',resize);
 const api={resize,measure,set,get mode(){return mode},limits,dispose(){win.removeEventListener?.('resize',resize)}};
 win.__hfAndroidPixels=api;
 resize();
 if(query.has('hfdebug')){
  const plate=doc.createElement('div');plate.id='hf-p498-frame-debug';
  plate.style.cssText='position:fixed;right:8px;bottom:8px;z-index:99999;pointer-events:none;white-space:pre;color:#fff;background:#111d;border:1px solid #8cb4e1;border-radius:6px;padding:7px;font:11px/1.4 monospace;max-width:42vw';
  doc.body.appendChild(plate);
  const refresh=()=>{const m=measure();plate.textContent='HIGHFLY ANDROID FRAMEBUFFER\n'+m.css.join('x')+' CSS @ DPR '+m.dpr+'\n'+m.drawingBuffer.join('x')+' frame | '+m.renderTargets.join('x')+' 3D\nScale '+Math.round(m.scale*100)+'% · '+m.mode+' · '+m.fps+' FPS';};
  let frames=0;
  const display=()=>{if(!plate.isConnected)return;if(!(frames++%40))refresh();win.requestAnimationFrame?.(display);};
  display();api.dispose=()=>{win.removeEventListener?.('resize',resize);plate.remove();};
 }
 return api;
}
