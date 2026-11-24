/** HIGHFLY P5.0.9 — original MIT-friendly world clock adapted to Unsung.
 * Design inspiration: Tianjie5 sun/moon/aurora; ClaudeCraft pure 45-min clock.
 * Native Unsung sky pass, shaders and P507 cache remain; NO extra renderer.
 * Visual day/night grade is reversible. Fixed sun direction preserves terrain
 * shadow atlas and avoids an expensive new static-map bake each animation frame.
 */
import {installP510Astronomy} from './p510-world-alive.mjs';
import {eventPreview} from './p511-sky-events.mjs';
export const DAY_MS=45*60*1000;
export const PHASES=Object.freeze(['amanecer','dia','atardecer','noche']);
export const GRADE=Object.freeze({
 amanecer:Object.freeze([1,0,0,0]),
 dia:Object.freeze([0,1,0,0]),
 atardecer:Object.freeze([0,0,1,0]),
 noche:Object.freeze([0,0,0,1])
});
export function phaseAt(timeMs,origin=0){
 const t=(Number(timeMs)-origin)/DAY_MS;
 return ((t%1)+1)%1;
}
export function phaseGrade(phase){
 const p=((Number(phase)%1)+1)%1;
 const q=p*4;
 const index=Math.floor(q);
 const fraction=q-index;
 const sm=fraction*fraction*(3-2*fraction);
 const values=[GRADE.noche,GRADE.amanecer,GRADE.dia,GRADE.atardecer,GRADE.noche];
 return values[index].map((v,j)=>v*(1-sm)+values[index+1][j]*sm);
}
export function installP508WorldClock(pipe,options={}){
 const win=options.win??globalThis.window,doc=options.doc??globalThis.document;
 if(!pipe?.skyPass?.uniforms?.uHFGrade||!pipe?.tonemap?.uniforms?.uHFGrade){
   return {enabled:false,reason:'Native shader uniforms are absent'};
 }
 const search=new URLSearchParams(options.search??win?.location?.search??'');
 let mode=search.get('hftime')||'atardecer';
 if(mode!=='auto'&&mode!=='eclipse'&&!PHASES.includes(mode))mode='atardecer';
 // Aurora defaults to scheduled rare events; force/off are QA overrides.
 let auroraOverride=search.get('hfaurora')==='1'?true:search.get('hfaurora')==='0'?false:'auto',playing=true;
 let activeAurora=0,activeEclipse=0,lastEvent=null;
 let clockStart=options.now?.()??globalThis.performance?.now?.()??0;
 let speed=search.get('hffast')==='1'?60:1,clockOffset=0;
 // P513 manual eclipse is a MOVING solar day, starting just before the grand arch peak.
 let eclipseStart=clockStart,eclipseOffset=0;
 let phaseNow=.75;
 let moonIndex=0;
 let lastSync=-Infinity,draws=0;
 const baseSun=pipe.sky.sunColor.clone();
 const grade=pipe.skyPass.uniforms.uHFGrade.value;
 const tonemapGrade=pipe.tonemap.uniforms.uHFGrade.value;
 const rt=()=>options.now?.()??globalThis.performance?.now?.()??0;
 const astronomy=installP510Astronomy(pipe,{now:rt,win,search:options.search,terrain:()=>win?.__terrain});
 const lunarStates=[null,0,.25,.5,.75];
 const update=()=>{
   if(!playing)return;
   const now=rt();
   if(now-lastSync<125)return;
   lastSync=now;
   const elapsed=(now-clockStart)*speed+clockOffset;
   const eclipseElapsed=(now-eclipseStart)*speed+eclipseOffset;
   // P514 eclipse day: 45 real/game minutes of daylight from sunrise to
   // sunset. The sun and aligned moon keep travelling, without a noon cutoff.
   const eclipseProgress=Math.max(0,Math.min(1,eclipseElapsed/DAY_MS));
   phaseNow=mode==='auto'?phaseAt(elapsed+DAY_MS*.75):
     mode==='eclipse'?.25+.5*eclipseProgress:
     ({amanecer:.25,dia:.5,atardecer:.75,noche:0})[mode];
   const active=mode==='auto'||mode==='eclipse'?phaseGrade(phaseNow):GRADE[mode];
   grade.set(active[0],active[1],active[2],active[3]);
   tonemapGrade.copy(grade);
   lastEvent=eventPreview(mode,elapsed/DAY_MS,phaseNow,auroraOverride);
   activeAurora=lastEvent.aurora;
   activeEclipse=lastEvent.eclipse;
   pipe.skyPass.uniforms.uHFAurora.value=activeAurora;
   if(pipe.skyPass.uniforms.uHFEclipse)pipe.skyPass.uniforms.uHFEclipse.value=activeEclipse;
   if(pipe.tonemap.uniforms.uHFEclipse)pipe.tonemap.uniforms.uHFEclipse.value=activeEclipse;
   pipe.skyPass.uniforms.uHFClock.value=now/1000;
   if(astronomy.enabled)astronomy.update({
     phase:phaseNow,mode,eclipse:activeEclipse,
     worldDays:mode==='auto'?(elapsed/DAY_MS):0,
     nowMs:now
   });
   // Change intensity, never sun direction: original precomputed terrain
   // and static shadows remain aligned in all four phases.
   pipe.sky.sunColor.copy(baseSun).multiplyScalar((1-0.86*active[3]+0.08*active[1])*(1-0.70*activeEclipse));
   if(eventLabel){
     const name=activeEclipse>.01?'🌑 Eclipse especial':activeAurora>.01?'✨ Aurora boreal':'🌙 Cielo normal';
     const desc=name+' · Luna y estrellas habitualmente; eventos raros.';
     if(eventLabel.textContent!==desc)eventLabel.textContent=desc;
   }
   draws++;
 };
 const select=(next)=>{
   if(next!=='auto'&&next!=='eclipse'&&!PHASES.includes(next))return false;
   if(next==='auto'&&mode!=='auto'){clockStart=rt();clockOffset=0;}
   if(next==='eclipse'){eclipseStart=rt();eclipseOffset=0;} // also replay event
   mode=next;lastSync=-Infinity;update();syncButtons();return true;
 };
 const setAurora=(value)=>{
   auroraOverride=value==='auto'?'auto':!!value;
   lastSync=-Infinity;update();syncButtons();return auroraOverride;
 };
 const setSpeed=(value)=>{
   const now=rt();
   clockOffset+=(now-clockStart)*speed;clockStart=now;
   eclipseOffset+=(now-eclipseStart)*speed;eclipseStart=now;
   speed=value===60?60:1;lastSync=-Infinity;update();syncButtons();return speed;
 };
 const setMoon=(value)=>{
   if(astronomy.enabled)astronomy.moonOverride(value);lastSync=-Infinity;update();syncButtons();return value;
 };
 const api={enabled:true,select,setAurora,setSpeed,setMoon,update,dispose,
  get speed(){return speed},get astronomy(){return astronomy},get phase(){return phaseNow},
  get mode(){return mode},get aurora(){return activeAurora>0},get eclipse(){return activeEclipse>0},
  get event(){return lastEvent},get auroraSetting(){return auroraOverride},
  get grade(){return [grade.x,grade.y,grade.z,grade.w]},
  get updates(){return draws}
 };
 pipe.onBeforeScene.push(update);
 let panel=null,root=null,buttons=[],toggle=null,fastButton=null,lunarButton=null,eventLabel=null;
 function syncButtons(){
  for(const item of buttons){
   const selected=item.value===mode;
   item.node.setAttribute('aria-pressed',String(selected));
   item.node.style.background=selected?'#4d367e':'#17162fcf';
   item.node.style.borderColor=selected?'#d9b866':'#63618e';
  }
  if(toggle){
    toggle.textContent='✨ Aurora: '+(auroraOverride==='auto'?'evento raro':auroraOverride?'FORZAR':'apagada');
    toggle.setAttribute('aria-pressed',String(activeAurora>0));
  }
  if(fastButton)fastButton.textContent=speed===60?'⏩ Ciclo x60 ✓':'⏱ Ciclo normal';
  if(lunarButton)lunarButton.textContent='🌕 Luna: '+['Auto','Nueva','Creciente','Llena','Menguante'][moonIndex];
 }
 if(doc?.body){
  root=doc.createElement('div');root.id='hf-p508-climate';
  root.style.cssText='position:fixed;top:6px;right:6px;z-index:99996;color:#f7f1ff;font:12px/1.3 system-ui,sans-serif;pointer-events:auto;max-width:260px';
  const open=doc.createElement('button');
  open.type='button';open.textContent='☀ CLIMA';
  open.style.cssText='padding:6px 10px;border:1px solid #e0c074;border-radius:18px;background:#151329e8;color:#f6e7ff;font-weight:700;box-shadow:0 2px 9px #08061299';
  open.setAttribute('aria-label','Abrir selector de hora y aurora');
  panel=doc.createElement('div');
  panel.style.cssText='display:none;margin-top:5px;padding:9px;background:#0e0c20f2;border:1px solid #7a60a8;border-radius:12px;box-shadow:0 4px 16px #0009;max-height:70vh;overflow:auto';
  const label=doc.createElement('div');label.textContent='HIGHFLY · CIELO VIVO';
  label.style.cssText='font-weight:800;color:#edd6ff;margin-bottom:7px';panel.appendChild(label);
  const row=doc.createElement('div');
  row.style.cssText='display:flex;flex-wrap:wrap;gap:5px';
  const opts=[['amanecer','🌅 Amanecer'],['dia','☀ Día'],['atardecer','🌇 Atardecer'],['noche','🌙 Noche'],['eclipse','🌑 Eclipse'],['auto','⏱ Auto 45m']];
  for(const [value,title] of opts){
    const node=doc.createElement('button');
    node.type='button';node.textContent=title;
    node.style.cssText='padding:6px;border:1px solid #6e6594;border-radius:9px;background:#17162fcf;color:white;font:11px system-ui';
    node.addEventListener('click',()=>select(value));row.appendChild(node);buttons.push({value,node});
  }
  panel.appendChild(row);
  fastButton=doc.createElement('button');fastButton.type='button';
  fastButton.style.cssText='margin-top:6px;padding:6px 9px;border-radius:9px;background:#31265dcc;color:#fff;border:1px solid #a18edb;font:11px system-ui';
  fastButton.addEventListener('click',()=>setSpeed(speed===60?1:60));
  panel.appendChild(fastButton);
  lunarButton=doc.createElement('button');lunarButton.type='button';
  lunarButton.style.cssText='margin:6px 0 0 5px;padding:6px 9px;border-radius:9px;background:#31265dcc;color:#fff;border:1px solid #a18edb;font:11px system-ui';
  lunarButton.addEventListener('click',()=>{moonIndex=(moonIndex+1)%lunarStates.length;setMoon(lunarStates[moonIndex]);});
  panel.appendChild(lunarButton);
  toggle=doc.createElement('button');toggle.type='button';
  toggle.style.cssText='margin-top:7px;padding:6px 9px;border-radius:9px;background:#184d4ee8;color:#e3ffff;border:1px solid #60c9b2;font:11px system-ui';
  toggle.addEventListener('click',()=>setAurora(auroraOverride==='auto'?true:auroraOverride===true?false:'auto'));
  panel.appendChild(toggle);
  eventLabel=doc.createElement('div');
  eventLabel.style.cssText='font-size:10px;color:#a3e7e5;margin-top:5px';
  panel.appendChild(eventLabel);
  const note=doc.createElement('div');note.textContent='P5.1.4: luna nítida del tamaño del sol; Eclipse = 45 min de amanecer a atardecer. FPS: diagnóstico oculto/mini/completo.';
  note.style.cssText='font-size:10px;color:#c9c2d9;margin-top:6px';panel.appendChild(note);
  open.addEventListener('click',()=>{panel.style.display=panel.style.display==='none'?'block':'none';open.setAttribute('aria-expanded',String(panel.style.display!=='none'));});
  root.append(open,panel);doc.body.appendChild(root);syncButtons();
 }
 update();
 function dispose(){
  playing=false;const i=pipe.onBeforeScene.indexOf(update);if(i>=0)pipe.onBeforeScene.splice(i,1);
  pipe.sky.sunColor.copy(baseSun);
  grade.set(0,0,1,0);tonemapGrade.copy(grade);
  root?.remove();
 }
 if(win){win.__hfP508Climate=api;win.__hfP510Climate=api;}
 return api;
}
