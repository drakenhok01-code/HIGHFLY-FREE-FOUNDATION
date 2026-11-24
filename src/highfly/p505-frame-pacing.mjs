/** HIGHFLY P5.0.5 — opt-in frame-pacing diagnosis on the real Android RAF loop.
 * `?hfpace=1` measures start-to-start interval of the actual native
 * Pipeline.render call, plus CPU submission time. No graphics, resolution,
 * visibility, simulation scheduling, game state or shadow setting changes.
 * If WebGL timer query is unavailable, don't invent "GPU time".
 */
export function installP505FramePacing(pipe,options={}){
 const win=options.win??globalThis.window,doc=options.doc??globalThis.document;
 const query=new URLSearchParams(options.search??win?.location?.search??'');
 if(query.get('hfpace')!=='1')return {enabled:false,dispose(){}};
 const perf=options.perf??globalThis.performance;
 const MAX=360;
 const samples=[],cpuSamples=[];
 const stats={ready:false,frames:0,fps:0,medianMs:0,p90Ms:0,p99Ms:0,medianCpuMs:0,meanFps:0,p99Fps:0,steady50:false,steady60:false,
  over20Percent:0,over33Percent:0,gapCount:0,sampleCount:0,
  // Chrome hides EXT_disjoint_timer_query on many S23 devices.
  gpuMs:null,gpuAvailable:false
 };
 const median=(list,p=.5)=>list.length?list[Math.min(list.length-1,Math.floor(p*(list.length-1)))]:0;
 const sorted=(values)=>values.slice().sort((a,b)=>a-b);
 const sample=(a,v)=>{if(!Number.isFinite(v)||v<0||v>1000)return;
  a.push(v);if(a.length>MAX)a.shift();};
 let lastFrame=0,prevPaint=0,active=true,panel=null;
 const old=pipe.render;
 function update(){
  const a=sorted(samples),b=sorted(cpuSamples);
  const m=median(a);
  stats.ready=a.length>24;
  stats.fps=m?Math.round(1000/m):0;
  stats.medianMs=Math.round(m*10)/10;
  const totalMs=a.reduce((acc,x)=>acc+x,0);
  stats.meanFps=totalMs?Math.round(1000*a.length/totalMs):0;
  stats.p99Fps=median(a,.99)>0?Math.round(1000/median(a,.99)):0;
  stats.steady50=a.length>=120&&a.every(ms=>ms<=20);
  stats.steady60=a.length>=120&&a.every(ms=>ms<=1000/60+0.5);
  stats.p90Ms=Math.round(median(a,.9)*10)/10;
  stats.p99Ms=Math.round(median(a,.99)*10)/10;
  stats.medianCpuMs=Math.round(median(b)*10)/10;
  stats.over20Percent=a.length?Math.round(100*a.filter(v=>v>20).length/a.length):0;
  stats.over33Percent=a.length?Math.round(100*a.filter(v=>v>33).length/a.length):0;
  stats.sampleCount=a.length;
  stats.gapCount=a.filter(v=>v>40).length;
 }
 function wrapped(...args){
  const before=perf.now();
  const inPlay=win?.__game?.state==='playing';
  if(inPlay&&lastFrame){sample(samples,before-lastFrame);}
  if(inPlay)lastFrame=before;
  else lastFrame=0;
  try{return old.apply(this,args);}
  finally{
   if(inPlay){
    stats.frames++;
    sample(cpuSamples,perf.now()-before);
    const t=perf.now();
    if(t-prevPaint>800){
     prevPaint=t;update();
     if(panel){
      const q=stats;
      panel.textContent='HIGHFLY · RITMO REAL ANDROID\n'+
       q.fps+' FPS mediana · '+q.meanFps+' FPS promedio\n'+
       '1% LOW '+q.p99Fps+' FPS · '+(q.steady60?'60 ESTABLE':q.steady50?'50 ESTABLE':'SIN 50 SOSTENIDOS')+'\n'+
       'p90 '+q.p90Ms+' ms | p99 '+q.p99Ms+' ms\n'+
       'Render CPU '+q.medianCpuMs+' ms\n'+
       'Frames >20ms '+q.over20Percent+'% | >33ms '+q.over33Percent+'%\n'+
       'GPU: sin temporizador disponible\n'+
       'Misma resolución y calidad · '+q.sampleCount+' muestras';
     }
    }
   }
  }
 }
 pipe.render=wrapped;
 if(win)win.__hfP505Pacing=stats;
 if(doc?.body){
  panel=doc.createElement('div');panel.id='hf-p505-pacing';
  panel.style.cssText='position:fixed;left:6px;top:44px;z-index:99995;pointer-events:none;white-space:pre;background:#0b103ae8;color:#f4f8ff;border:1px solid #8a96d2;border-radius:7px;padding:7px 9px;font:11px/1.35 monospace;max-width:45vw';
  panel.textContent='HIGHFLY · MIDIENDO CADENCIA...';
  doc.body.appendChild(panel);
 }
 return {enabled:true,stats,dispose(){
  if(pipe.render===wrapped)pipe.render=old;
  panel?.remove();if(win?.__hfP505Pacing===stats)delete win.__hfP505Pacing;
 }};
}
