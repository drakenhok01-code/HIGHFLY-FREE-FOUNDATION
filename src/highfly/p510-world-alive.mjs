/** HIGHFLY P5.1.0 WORLD ALIVE.
 * Original zero-allocation astronomy: 45-minute solar clock, eight-day lunar
 * phases, visual eclipse and a stage-based terrain-shadow scheduler.
 * Inspired by the ideas of Tianjie5 / ClaudeCraft, not their restricted assets.
 *
 * SUN VISIBLE != SUN SHADOW: visible sun and moon move smoothly in the existing
 * sky shader; baked terrain/static shadows are prepared at solar keyframes.
 * No sky rebake on every clock tick; P507's lossless cache remains enabled.
 */
export const WORLD_DAY_MS = 45*60*1000;
export const LUNAR_DAYS = 8;
const TAU=Math.PI*2;
const PHASE_KEYS=Object.freeze([.25,.375,.50,.625,.75]);
const SQRT= Math.sqrt;
const n01=x=>((x%1)+1)%1;
export function solarVector(phase){
 const a=(n01(phase)-.25)*TAU;
 // East (+X) at sunrise, zenith near midday, West (-X) at sunset.
 const x=Math.cos(a),y=.88*Math.sin(a),z=.18;
 const inv=1/SQRT(x*x+y*y+z*z);
 return [x*inv,y*inv,z*inv];
}
export function lunarVector(phase){
 // Antiphase to sun. At sunset moon rises on the opposite horizon.
 const a=(n01(phase)-.25)*TAU+Math.PI;
 const x=Math.cos(a),y=.73*Math.sin(a),z=.28;
 const inv=1/SQRT(x*x+y*y+z*z);
 return [x*inv,y*inv,z*inv];
}
export function lunarPhase(worldDays){
 return n01(worldDays/LUNAR_DAYS+.5); // initially a full moon
}
export function shadowKey(phase){
 const p=n01(phase);
 if(p<.22||p>.78)return -1;
 let best=0,dist=Infinity;
 for(let i=0;i<PHASE_KEYS.length;i++){
   const d=Math.abs(p-PHASE_KEYS[i]);
   if(d<dist){best=i;dist=d;}
 }
 return best;
}
export function shadowVector(key){
 const p=PHASE_KEYS[Math.max(0,Math.min(PHASE_KEYS.length-1,key))];
 const sun=solarVector(p);
 const x=sun[0],y=Math.max(.17,sun[1]),z=sun[2];
 const inv=1/SQRT(x*x+y*y+z*z);
 return {x:x*inv,y:y*inv,z:z*inv};
}
export function installP510Astronomy(pipe,options={}){
 const uniforms=pipe?.skyPass?.uniforms;
 if(!uniforms?.uHFVisualSunDir||!uniforms?.uHFMoonDir||!uniforms?.uHFMoonPhase){
   return {enabled:false,reason:'P510 native sky shader uniforms unavailable'};
 }
 const win=options.win??globalThis.window;
 const now=options.now??(()=>globalThis.performance?.now?.()??0);
 let desiredShadow=-1,committedShadow=-1,requestedShadow=-1;
 let shadowUpdates=0,visualUpdates=0,skipShadows=false;
 let phaseOverride=null;
 const query=new URLSearchParams(options.search??win?.location?.search??'');
 if(query.get('hfshadows')==='fixed')skipShadows=true;
 const auroraAxis=uniforms.uHFAuroraAxis?.value;
 if(auroraAxis?.set) auroraAxis.set(.993,.12); // valley arch / startup view (east)
 function moonOverride(v){phaseOverride=v===null?null:((v%1)+1)%1;return phaseOverride;}
 function update({phase,mode='auto',eclipse=0,worldDays=0,nowMs=now()}){
  const sun=solarVector(phase);
  const alignment=mode==='eclipse'||eclipse>0.001;
  const moon=alignment?sun:lunarVector(phase);
  const moonAge=alignment?0:(phaseOverride??lunarPhase(worldDays));
  uniforms.uHFVisualSunDir.value.set(...sun);
  uniforms.uHFMoonDir.value.set(...moon);
  uniforms.uHFMoonPhase.value=moonAge;
  if(uniforms.uHFClock)uniforms.uHFClock.value=nowMs/1000;
  visualUpdates++;
  if(skipShadows)return;
  const t=options.terrain?.()??win?.__terrain;
  const key=mode==='eclipse'?2:shadowKey(phase);
  desiredShadow=key;
  if(!t?.hfStartSunBake||!t?.hfAdvanceSunBake)return;
  // Build the *next* paired terrain shadow maps offscreen. At most one tile
  // per six rendered frames; the current live maps are never overwritten.
  if(key>=0 && key!==committedShadow && key!==requestedShadow){
   if(t.hfStartSunBake(key,shadowVector(key)))requestedShadow=key;
  }
 }
 // Shadow staging is checked PER GAME FRAME, not only when the UI/clock
 // updates at 8 Hz. The baker itself limits work to one tile/12 frames.
 // This lets the 45-second x60 test exercise real angle transitions.
 const advanceShadow=()=>{
  if(skipShadows)return;
  const t=options.terrain?.()??win?.__terrain;
  if(!t?.hfAdvanceSunBake)return;
  const result=t.hfAdvanceSunBake(desiredShadow);
  if(result?.committed){committedShadow=result.key;requestedShadow=-1;shadowUpdates++;}
  else if(result?.aborted)requestedShadow=-1;
 };
 pipe.onBeforeScene.push(advanceShadow);
 const api={enabled:true,update,moonOverride,dispose(){
  const i=pipe.onBeforeScene.indexOf(advanceShadow);
  if(i>=0)pipe.onBeforeScene.splice(i,1);
 },
  get shadowKey(){return desiredShadow},
  get committedShadow(){return committedShadow},
  get shadowUpdates(){return shadowUpdates},
  get visualUpdates(){return visualUpdates},
  get moonPhase(){return phaseOverride},
  get shadowsEnabled(){return !skipShadows},
  get state(){return {desiredShadow,committedShadow,requestedShadow,shadowUpdates,visualUpdates,phaseOverride}}
 };
 if(win)win.__hfP510Astronomy=api;
 return api;
}
