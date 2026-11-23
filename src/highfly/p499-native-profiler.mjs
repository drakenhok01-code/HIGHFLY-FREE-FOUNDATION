/** HIGHFLY P4.9.9 — zero-stall GPU/CPU frame telemetry for S23 Ultra.
 * Timer queries are asynchronous. Do not gl.finish(), wait for query results,
 * force reflows, touch scene contents or change any visual properties.
 */
export function installP499GpuDiagnostics(pipe, options={}){
 const win=options.win??window;
 const doc=options.doc??document;
 const perf=options.perf??performance;
 const q=new URLSearchParams(options.search??win.location?.search??'');
 // The existing P498 corner panel displays actual FPS already. A second
 // performance panel is explicit-only to avoid covering the top-right radar.
 const debug=q.has('hfperfdebug');
 // Profiling is NOT part of normal play. P499 installed a GPU timer even
 // with its panel hidden. On Android, query setup and readbacks add work.
 if(!debug&&q.get('hfphase')!=='1'&&q.get('hfperf')!=='measure')return {enabled:false,dispose(){}};

 const gl=pipe.renderer?.getContext?.();
 // Avoid nested GPU timer queries: ?hfphase=1 uses the detailed profiler.
 const ext=q.get('hfphase')==='1'?null:gl?.getExtension?.('EXT_disjoint_timer_query_webgl2');
 let frames=0, last=perf.now(), smoothed=0, currentGpuMs=null, gpuQueries=[], sampleCounter=0, draws=0;
 const maxQueries=4;
 const stats={fps:0,frameMs:0,cpuRenderMs:0,gpuMs:null,drawCalls:0,triangles:0,querySupported:!!ext,history:[]};
 const original=pipe.render;
 function pollGpu(){
  if(!ext||!gl.getQueryParameter)return;
  if(gl.getParameter?.(ext.GPU_DISJOINT_EXT)){
   for(const o of gpuQueries)gl.deleteQuery(o);
   gpuQueries=[];return;
  }
  // Only result AVAILABLE polls; never a synchronous WebGL readback.
  while(gpuQueries.length){
   const query=gpuQueries[0];
   if(!gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE))break;
   const ns=gl.getQueryParameter(query,gl.QUERY_RESULT);
   currentGpuMs=ns/1e6;stats.gpuMs=Math.round(currentGpuMs*10)/10;
   gl.deleteQuery(query);gpuQueries.shift();
  }
 }
 function render(...args){
  const now=perf.now(),dt=now-last;last=now;
  if(dt>0&&dt<300){
   const instant=1000/dt;
   // The wall-clock fps includes simulation, world updates and browser scheduling.
   smoothed=smoothed?smoothed*.90+instant*.10:instant;
   stats.fps=Math.round(smoothed);
   stats.frameMs=Math.round(dt*10)/10;
  }
  const timed=!!ext&&typeof gl.createQuery==='function'&&gpuQueries.length<maxQueries&&sampleCounter++%45===0;
  let query=null;
  if(timed){
   try{query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query)}catch{if(query)try{gl.deleteQuery(query)}catch{}query=null;}
  }
  const began=perf.now();
  try{return original.apply(this,args);}
  finally{
   stats.cpuRenderMs=Math.round((perf.now()-began)*10)/10;
   if(query){try{gl.endQuery(ext.TIME_ELAPSED_EXT);gpuQueries.push(query)}catch{try{gl.deleteQuery(query)}catch{}}}
   frames++;
   if(frames%20===0){
    pollGpu();
    stats.drawCalls=pipe.renderer?.info?.render?.calls??0;
    stats.triangles=pipe.renderer?.info?.render?.triangles??0;
   }
  }
 }
 pipe.render=render;
 win.__hfGpuStats=stats;
 let panel=null,lastPanel=0;
 if(debug){
  panel=doc.createElement('div');panel.id='hf-p499-perf';
  panel.style.cssText='position:fixed;right:8px;top:12px;z-index:99998;white-space:pre;pointer-events:none;background:#071122e5;border:1px solid #8deaf0;border-radius:7px;color:white;font:12px/1.35 monospace;padding:6px 8px;max-width:40vw';
  panel.textContent='HIGHFLY S23 GPU · INICIANDO';
  doc.body?.appendChild(panel);
  const repaint=()=>{
   if(!panel.isConnected)return;
   if(perf.now()-lastPanel>500){
    lastPanel=perf.now();
    panel.textContent='S23 NATIVE · '+stats.fps+' FPS'+
      '\\nCPU render '+stats.cpuRenderMs+' ms | GPU '+(stats.gpuMs??'N/D')+' ms'+
      '\\n'+stats.drawCalls+' draws · '+Math.round(stats.triangles/1000)+'k tri';
   }
   win.requestAnimationFrame?.(repaint);
  };
  win.requestAnimationFrame?.(repaint);
 }
 return {stats,dispose(){
  if(pipe.render===render)pipe.render=original;
  panel?.remove();
  for(const q of gpuQueries)try{gl.deleteQuery(q)}catch{}
  gpuQueries=[];if(win.__hfGpuStats===stats)delete win.__hfGpuStats;
 }};
}
