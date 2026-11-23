/** HIGHFLY P5.0.2 — Android-only controlled A/B frame budget test.
 * Never runs during normal gameplay. User must open ?hffpsaudit=1.
 * Temporary test scenes are restored after each 4 s stage; no source assets
 * or resolution are changed and every normal-play visual is preserved.
 */
const STAGES=['reference','shadows','volumetrics','bloom','taa','reference-check'];
const duration=4500,settle=700;
export function installP502AutoProfiler(pipe,options={}){
 const win=options.win??globalThis.window,doc=options.doc??globalThis.document;
 const q=new URLSearchParams(options.search??win?.location?.search??'');
 if(q.get('hffpsaudit')!=='1')return {enabled:false,dispose(){}};
 const now=()=>options.now?.()??globalThis.performance.now();
 // Capture final, applied graphics settings when the player enters the
 // benchmark, not while game settings are still initializing.
 const original={};
 const capture=()=>{
  original.shadows=pipe.shadows?.enabled;
  original.volumetrics=pipe.volumetrics?.enabled;
  original.taa=pipe.taa?.enabled;
  original.bloomRender=pipe.bloom?.render;
  original.bloomStrength=pipe.bloomStrength;
 };
 const results=[];
 let index=-1,started=now(),frameTimes=[],stageEnd=0,settledAt=0,active=true,finished=false;
 let panel=null;
 if(doc?.body){
  panel=doc.createElement('div');panel.id='hf-p502-fpsaudit';
  panel.style.cssText='position:fixed;left:4%;top:3%;z-index:999999;background:#080b24ef;color:#fff;border:2px solid #9dd7ff;border-radius:8px;padding:10px 14px;max-width:90vw;white-space:pre-wrap;font:12px/1.35 monospace;pointer-events:none';
  panel.textContent='HIGHFLY · PRUEBA DE FPS\nMantené quieta la cámara. Se desactivan efectos brevemente y se restauran automáticamente.';
  doc.body.appendChild(panel);
 }
 const setLabel=(t)=>{if(panel)panel.textContent=t};
 const restore=()=>{
  if(pipe.shadows)pipe.shadows.enabled=original.shadows;
  if(pipe.volumetrics)pipe.volumetrics.enabled=original.volumetrics;
  if(pipe.taa){pipe.taa.enabled=original.taa;pipe.taa.reset=true;}
  if(pipe.bloom&&original.bloomRender)pipe.bloom.render=original.bloomRender;
  pipe.bloomStrength=original.bloomStrength;
 };
 const enable=(name)=>{
  restore();
  if(name==='shadows'&&pipe.shadows)pipe.shadows.enabled=false;
  if(name==='volumetrics'&&pipe.volumetrics)pipe.volumetrics.enabled=false;
  if(name==='taa'&&pipe.taa){pipe.taa.enabled=false;pipe.taa.reset=true;}
  if(name==='bloom'&&pipe.bloom){
   // Do not allocate any RT or resize: retain the original glow result
   // texture but skip its 11 GPU passes; bloom contribution is zero.
   pipe.bloomStrength=0;
   pipe.bloom.render=function(){return this.mips?.[this.mips.length-1]?.texture??null};
  }
 };
 function next(t){
  if(index<0)capture();
  index++;frameTimes=[];settledAt=t+settle;stageEnd=t+duration;
  if(index>=STAGES.length){restore();finished=true;active=false;
   const baseline=results.find(x=>x.name==='reference')?.medianFrameMs;
   const table=results.map(x=>({
    ...x,improvement:baseline&&x.medianFrameMs>0?Math.round((baseline/x.medianFrameMs-1)*100):0
   }));
   win.__hfP502Results={results:table,
    timestamp:new Date().toISOString()};
   setLabel('HIGHFLY · RESULTADOS MEDIDOS EN ESTE TELÉFONO\n'
      +table.map(x=>x.name.padEnd(17)+' '+x.fps+' FPS · '+x.medianFrameMs+'ms '+(x.improvement>=0?'+':'')+x.improvement+'%').join('\n')
      +'\nTodas las opciones restauradas. Capturá esta pantalla.');
   return;
  }
  enable(STAGES[index]);
  setLabel('HIGHFLY · PERFIL GPU\n'+(index+1)+'/'+STAGES.length+' '+STAGES[index]+'\nPrueba temporal: mantené la cámara quieta.');
 }
 let last=tickAt(),raf=0;
 function tickAt(){return now();}
 function tick(){
  if(!active)return;
  const t=tickAt(),dt=t-last;last=t;
  // Never benchmark the title screen or the loading animation. On a real
  // phone the meaningful comparison begins only after gameplay starts.
  if(index<0&&win?.__game?.state&&win.__game.state!=='playing'){
   started=t;
   if(active)raf=win.requestAnimationFrame(tick);
   return;
  }
  if(index<0){if(t-started>=2000)next(t);}
  else {
   if(t>=settledAt&&t<stageEnd&&dt>3&&dt<200)frameTimes.push(dt);
   if(t>=stageEnd){
    const sorted=frameTimes.slice().sort((a,b)=>a-b);
    const median=sorted.length?sorted[Math.floor(sorted.length*.5)]:0;
    const p90=sorted.length?sorted[Math.floor(sorted.length*.9)]:0;
    const x={name:STAGES[index],fps:median?Math.round(1000/median):0,
     medianFrameMs:Math.round(median*10)/10,p90FrameMs:Math.round(p90*10)/10,samples:sorted.length};
    results.push(x);next(t);
   }
  }
  if(active)raf=win.requestAnimationFrame(tick);
 }
 raf=win?.requestAnimationFrame?.(tick);
 return {enabled:true,get finished(){return finished},get results(){return results},dispose(){
  active=false;win?.cancelAnimationFrame?.(raf);if(index>=0)restore();panel?.remove();
 }};
}
