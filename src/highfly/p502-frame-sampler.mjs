/** HIGHFLY P5.0.2: CPU frame-path diagnosis for Android WebGL.
 * Runs ONLY with ?hfcpuprof=1; sampling is not installed during normal play.
 * CPU render time excludes async GPU completion; report that separately.
 */
export function installP502FrameSampler(game,pipe,opts={}){
 const win=opts.win??globalThis.window;
 const doc=opts.doc??globalThis.document;
 const perf=opts.perf??globalThis.performance;
 const args=new URLSearchParams(opts.search??win?.location?.search??'');
 if(args.get('hfcpuprof')!=='1')return {enabled:false,dispose(){}};
 const origGame=game.update,origPipe=pipe.render;
 const stats={fps:0,frameMs:0,gameMs:0,renderMs:0,otherOrGpuMs:0,p95Frame:0,frames:0,maximumFrame:0,visible:true};
 let tick=perf.now(),windowTimes=[],smooth=0,lastUi=0,panel=null,active=true;
 const avg=(prev,newValue)=>prev?prev*.85+newValue*.15:newValue;
 game.update=function(...args){
  const t=perf.now();try{return origGame.apply(this,args)}
  finally{stats.gameMs=avg(stats.gameMs,perf.now()-t)}
 };
 pipe.render=function(...args){
  const t=perf.now();try{return origPipe.apply(this,args)}
  finally{stats.renderMs=avg(stats.renderMs,perf.now()-t)}
 };
 const frame=()=>{
  if(!active)return;
  const now=perf.now(),dt=now-tick;tick=now;
  if(dt>0&&dt<250){
   smooth=avg(smooth,1000/dt);
   stats.fps=Math.round(smooth);
   stats.frameMs=avg(stats.frameMs,dt);
   stats.maximumFrame=Math.max(stats.maximumFrame,dt);
   windowTimes.push(dt);if(windowTimes.length>90)windowTimes.shift();
   const sorted=windowTimes.slice().sort((a,b)=>a-b);
   stats.p95Frame=sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]||0;
   stats.otherOrGpuMs=Math.max(0,stats.frameMs-stats.gameMs-stats.renderMs);
   stats.frames++;
  }
  if(panel?.isConnected&&now-lastUi>500){
   lastUi=now;
   panel.textContent=
     'HIGHFLY P502 CPU FRAME · '+stats.fps+' FPS'+
     '\nframe '+stats.frameMs.toFixed(1)+'ms | p95 '+stats.p95Frame.toFixed(1)+'ms'+
     '\nRPG/sim '+stats.gameMs.toFixed(1)+'ms · draw CPU '+stats.renderMs.toFixed(1)+'ms'+
     '\nGPU/navegador/espera ≤ '+stats.otherOrGpuMs.toFixed(1)+'ms'+
     '\n(estimación; no representa tiempo GPU medido)';
  }
  win?.requestAnimationFrame?.(frame);
 };
 if(doc?.body&&doc.createElement){
  panel=doc.createElement('div');panel.id='hf-p502-cpu-frame';
  panel.style.cssText='position:fixed;left:50%;top:5px;transform:translateX(-50%);z-index:99994;pointer-events:none;padding:6px 9px;border:1px solid #8af;border-radius:6px;background:#10152deb;color:#fff;font:11px/1.35 monospace;white-space:pre;max-width:50vw';
  doc.body.appendChild(panel);
 }
 win?.requestAnimationFrame?.(frame);
 if(win)win.__hfP502CpuStats=stats;
 return {enabled:true,stats,dispose(){
  active=false;panel?.remove();
  if(game.update!==origGame)game.update=origGame;
  if(pipe.render!==origPipe)pipe.render=origPipe;
  if(win?.__hfP502CpuStats===stats)delete win.__hfP502CpuStats;
 }};
}
