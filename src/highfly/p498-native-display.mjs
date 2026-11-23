/**
 * HIGHFLY P4.9.8 — WebGL physical-pixel display sizing for Android landscape.
 *
 * Unsung's standard renderer uses pixelRatio=1 and sends CSS pixels directly
 * to its setSize(): even renderScale=1 is usually below the S23 Ultra panel's
 * effective physical resolution. Resize the EXISTING renderer and every
 * display-sized framebuffer consistently; never introduce a second renderer.
 *
 * Deliberately caps by actual viewport/device DPR, WQHD+ pixel budget and GPU
 * limits. Does not promise those pixels will run at 60 FPS on real hardware.
 */
export const S23_ULTRA_MAX_PIXELS=3088*1440;

const finitePositive=(n,fallback)=>Number.isFinite(+n)&&+n>0?+n:fallback;
const positiveInt=(n,fallback)=>Math.max(2,Math.floor(finitePositive(n,fallback)));
export function highflyPhysicalDisplaySize(cssWidth,cssHeight,options={}){
 const cssW=positiveInt(cssWidth,1280),cssH=positiveInt(cssHeight,720);
 const mode=options.mode==='css'?'css':'native';
 const dpr=mode==='css'?1:Math.max(1,Math.min(5,finitePositive(options.dpr,1)));
 const maxPixels=positiveInt(options.maxPixels,S23_ULTRA_MAX_PIXELS);
 const maxTexture=positiveInt(options.maxTextureSize,16384);
 const maxBuffer=positiveInt(options.maxRenderbufferSize,16384);
 const maxSide=Math.min(maxTexture,maxBuffer);
 const requestedW=Math.max(2,Math.round(cssW*dpr)),requestedH=Math.max(2,Math.round(cssH*dpr));
 // No stretching: shrink BOTH dimensions by one uniform factor, when needed.
 const factor=Math.min(1,maxSide/requestedW,maxSide/requestedH,
   Math.sqrt(maxPixels/(requestedW*requestedH)));
 const width=Math.max(2,Math.floor(requestedW*factor));
 const height=Math.max(2,Math.floor(requestedH*factor));
 return {mode,cssW,cssH,dpr,width,height,requestedW,requestedH,
  factor,renderedDpr:width/cssW,pixels:width*height,
  capped:width!==requestedW||height!==requestedH};
}
export function highflyGetGpuLimit(renderer){
 try{
  const gl=renderer?.getContext?.();
  return {
   maxTextureSize:finitePositive(renderer?.capabilities?.maxTextureSize,16384),
   maxRenderbufferSize:gl?finitePositive(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),16384):16384,
  };
 }catch{return {maxTextureSize:16384,maxRenderbufferSize:16384};}
}
export function highflyDisplayReport(pipe,windowRef=globalThis){
 const canvas=pipe?.renderer?.domElement;
 const rect=canvas?.getBoundingClientRect?.();
 const cssW=rect?.width??canvas?.clientWidth??0,cssH=rect?.height??canvas?.clientHeight??0;
 const gl=pipe?.renderer?.getContext?.();
 const physical=highflyPhysicalDisplaySize(cssW,cssH,{
  dpr:windowRef?.devicePixelRatio,
  mode:pipe?.highflyDisplayMode??'native',
  ...highflyGetGpuLimit(pipe?.renderer),
 });
 const drawingW=gl?.drawingBufferWidth??canvas?.width??0;
 const drawingH=gl?.drawingBufferHeight??canvas?.height??0;
 const expectedSceneW=Math.max(2,Math.round(drawingW*(pipe?.renderScale??1)));
 const expectedSceneH=Math.max(2,Math.round(drawingH*(pipe?.renderScale??1)));
 return {
  css:[Math.round(cssW),Math.round(cssH)],dpr:windowRef?.devicePixelRatio??1,
  display:[pipe?.displayW??0,pipe?.displayH??0],
  drawingBuffer:[drawingW,drawingH],scene:[pipe?.rw??0,pipe?.rh??0],
  expectedScene:[expectedSceneW,expectedSceneH],
  taaHistory:pipe?.taa?.history?.map(t=>[t.width,t.height])??[],
  bloomFirst:pipe?.bloom?.mips?.[0]?[pipe.bloom.mips[0].width,pipe.bloom.mips[0].height]:null,
  renderScale:pipe?.renderScale??null,mode:pipe?.highflyDisplayMode??'native',
  taaEnabled:pipe?.taa?.enabled??null,
  physicalTarget:[physical.width,physical.height],
  physicalCoverage:drawingW&&drawingH?Number((drawingW*drawingH/
   Math.max(1,physical.width*physical.height)).toFixed(3)):0,
  synchronized:!!(drawingW&&drawingH&&pipe?.displayW===drawingW&&pipe?.displayH===drawingH&&
    pipe?.rw===expectedSceneW&&pipe?.rh===expectedSceneH&&
    (pipe?.taa?.history?.every(t=>t.width===drawingW&&t.height===drawingH)??false)),
 };
}
export function installHighflyDisplayDiagnostics(pipe,settings,search='',win=globalThis){
 const params=new URLSearchParams(search);
 const capture=()=>({...highflyDisplayReport(pipe,win),
  fps:win.__gov?.fps??null,quality:win.__hfGraphics?.selected??null,
  targetFps:settings?.values?.targetFps??null});
 if(win)win.__highflyNativeReport=capture;
 if(!params.has('hfdiag')||params.get('hfdiag')==='0'||!win.document)return {capture};
 const doc=win.document,el=doc.createElement('div');
 el.id='hf-p498-diagnostics';
 el.setAttribute('aria-label','HIGHFLY resolución WebGL');
 el.style.cssText='position:fixed;right:6px;top:4px;z-index:99991;pointer-events:none;white-space:pre;background:#090e20d9;color:#f3f4ff;border:1px solid #74e0ff;border-radius:7px;padding:6px 8px;font:600 11px/1.35 monospace;text-shadow:0 1px #000;max-width:48vw';
 const update=()=>{
  const d=capture(),pair=a=>a?.join('×')??'—';
  el.textContent='HIGHFLY / ANDROID NATIVE\nCSS '+pair(d.css)+'  DPR '+d.dpr+
   '\nFramebuffer '+pair(d.drawingBuffer)+' / '+pair(d.physicalTarget)+
   '\nScene '+pair(d.scene)+' · TAA '+String(d.taaEnabled)+
   '\nEscala '+d.renderScale+' · FPS '+(d.fps??'?')+
   '\nBuffers '+(d.synchronized?'SINCRONIZADOS':'REVISAR')+' · '+d.mode;
 };
 const show=()=>{if(!el.isConnected)doc.body?.appendChild(el);update();};
 if(doc.body)show();else doc.addEventListener('DOMContentLoaded',show,{once:true});
 const interval=win.setInterval?.(update,1600);
 return {capture,dispose(){if(interval)win.clearInterval?.(interval);el.remove();}};
}
