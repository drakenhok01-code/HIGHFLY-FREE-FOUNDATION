/** HIGHFLY P5.0.0 — frame-phase profiler. Explicit-only ?hfphase=1.
 * Samples just ONE GPU stage per frame, asynchronously, to avoid nested
 * EXT_disjoint_timer_query_webgl2 calls / gl.finish / GPU stalls.
 * No change to render size, objects, shader quality, shadows or TAA.
 */
export function installP500StageProfiler(pipe,options={}){
 const win=options.win??globalThis.window;
 const doc=options.doc??globalThis.document;
 const perf=options.perf??globalThis.performance;
 const search=options.search??win?.location?.search??'';
 const params=new URLSearchParams(search);
 if(params.get('hfphase')!=='1')return {enabled:false,dispose(){}};
 const gl=pipe.renderer?.getContext?.();
 const ext=gl?.getExtension?.('EXT_disjoint_timer_query_webgl2')??null;
 const names=['sky','shadows','terrain-3d','water-3d','water-copy','depth-copy','volumetrics','fog','taa','bloom','tonemap'];
 const records=Object.fromEntries(names.map(name=>[name,{cpuMs:0,gpuMs:null,count:0,gpuSamples:0}]));
 const updates=[];
 let frameActive=false,stageTarget=null,busy=false,frameNumber=0,pending=[],lastPoll=0;
 const maxPending=4;
 function release(q){try{gl?.deleteQuery?.(q)}catch{}}
 function pollGpu(){
  if(!ext)return;
  try{
   if(gl.getParameter(ext.GPU_DISJOINT_EXT)){
    for(const entry of pending)release(entry.q);
    pending=[];return;
   }
   while(pending.length){
    const entry=pending[0];
    if(!gl.getQueryParameter(entry.q,gl.QUERY_RESULT_AVAILABLE))break;
    const ms=Number(gl.getQueryParameter(entry.q,gl.QUERY_RESULT))/1e6;
    const record=records[entry.name];
    if(Number.isFinite(ms)&&ms>=0&&ms<1000){
     record.gpuSamples++;
     record.gpuMs=record.gpuMs===null?ms:record.gpuMs*.72+ms*.28;
    }
    release(entry.q);pending.shift();
   }
  }catch{for(const entry of pending)release(entry.q);pending=[];}
 }
 function timed(name,fn,args,self){
  if(!frameActive)return fn.apply(self,args);
  const record=records[name];
  const t=perf.now();
  let q=null;
  if(ext&&!busy&&stageTarget===name&&pending.length<maxPending&&typeof gl?.createQuery==='function'){
   try{q=gl.createQuery();if(q){gl.beginQuery(ext.TIME_ELAPSED_EXT,q);busy=true;}}catch{if(q)release(q);q=null;busy=false;}
  }
  try{return fn.apply(self,args);}
  finally{
   record.count++;
   const dt=perf.now()-t;
   if(Number.isFinite(dt))record.cpuMs=record.count===1?dt:record.cpuMs*.91+dt*.09;
   if(q){
    try{gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push({name,q});}catch{release(q);}
    busy=false;
   }
  }
 }
 function wrap(object,key,name,predicate=null){
  const prev=object?.[key];
  if(typeof prev!=='function')return;
  const wrapped=function(...args){
   if(!predicate||predicate(args))return timed(name,prev,args,this);
   return prev.apply(this,args);
  };
  object[key]=wrapped;
  updates.push(()=>{if(object[key]===wrapped)object[key]=prev;});
 }
 wrap(pipe.sky,'update','sky');
 wrap(pipe.shadows,'update','shadows');
 wrap(pipe.copyPass,'render','water-copy');
 wrap(pipe.linDepthPass,'render','depth-copy');
 wrap(pipe.volumetrics,'render','volumetrics');
 wrap(pipe.fog,'render','fog');
 wrap(pipe.taa,'render','taa');
 wrap(pipe.bloom,'render','bloom');
 wrap(pipe.tonemap,'render','tonemap');
 wrap(pipe.renderer,'render','terrain-3d',args=>args[0]===pipe.scene);
 // The transparent scene is drawn separately, but nested FullscreenPass
 // calls do not accidentally start a second query.
 wrap(pipe.renderer,'render','water-3d',args=>args[0]===pipe.sceneT);
 const old=pipe.render;
 const frame=function(...args){
  const outer=frameActive;frameActive=true;
  stageTarget=names[frameNumber%names.length];
  frameNumber++;
  try{return old.apply(this,args);}
  finally{
   frameActive=outer;busy=false;
   if(frameNumber-lastPoll>=20){lastPoll=frameNumber;pollGpu();}
  }
 };
 pipe.render=frame;
 const stats={stages:records,querySupported:!!ext,get frames(){return frameNumber;},get gpuPending(){return pending.length;}};
 if(win)win.__hfP500Stages=stats;
 let panel=null,lastUi=0,rafActive=true;
 if(doc?.body){
  panel=doc.createElement('div');panel.id='hf-p500-stage-profiler';
  panel.style.cssText='position:fixed;top:42px;right:5px;max-width:43vw;z-index:99995;pointer-events:none;background:#0b1039e8;color:#fff;border:1px solid #b6aeef;border-radius:7px;padding:6px 8px;font:11px/1.35 monospace;white-space:pre';
  doc.body.appendChild(panel);
  const paint=()=>{
   if(!rafActive||!panel.isConnected)return;
   if(perf.now()-lastUi>700){
    lastUi=perf.now();
    const rows=names.map(n=>({n,...records[n]})).filter(x=>x.count).sort((a,b)=>(b.gpuMs??b.cpuMs)-(a.gpuMs??a.cpuMs));
    panel.textContent='HIGHFLY · PASADAS GPU'+(ext?'':' (CPU solamente)')+'\n'+
     rows.slice(0,7).map(x=>x.n.padEnd(13)+' '+(x.gpuMs===null?'—':x.gpuMs.toFixed(1)+'ms')+' GPU · '+x.cpuMs.toFixed(1)+'ms CPU').join('\n');
   }
   win.requestAnimationFrame?.(paint);
  };
  win?.requestAnimationFrame?.(paint);
 }
 return {enabled:true,stats,dispose(){
  rafActive=false;
  if(pipe.render===frame)pipe.render=old;
  for(const undo of updates.reverse())undo();
  for(const entry of pending)release(entry.q);
  pending=[];panel?.remove();
  if(win?.__hfP500Stages===stats)delete win.__hfP500Stages;
 }};
}
