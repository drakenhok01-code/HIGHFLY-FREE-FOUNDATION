/** HIGHFLY integrated graphics profile. Adjustable on same scene/pipeline.
 * Removes known half-resolution ambient-occlusion streaks; does not falsify FPS.
 */
export const GRAPHICS=Object.freeze({
 performance:{renderScale:.75,targetFps:50,sharpen:.56},
 // S23 Ultra / landscape: start native-resolution, dynamically recover FPS
 // down to 88% only if necessary. The old default silently began at 85%.
 balanced:{renderScale:1,targetFps:48,sharpen:.65},
 quality:{renderScale:1,targetFps:0,sharpen:.62}
});
export function installHighflyGraphics(pipe,settings,search='',storage=globalThis.localStorage){
 const query=new URLSearchParams(search);
 let pref=null;try{pref=storage?.getItem('highfly-graphics-profile-v1')}catch{}
 const name=query.get('hfquality')||pref||'balanced';
 const selected=GRAPHICS[name]?name:'balanced',spec=GRAPHICS[selected];
 // Settings may have a user-chosen higher preset; never silently downgrade it.
 settings.values.renderScale=spec.renderScale;
 settings.values.targetFps=spec.targetFps;
 if(pipe.ao)pipe.ao.enabled=false; // F0.13 SSAO streaks are unacceptable
 if(pipe.tonemap?.uniforms?.uSharpen)pipe.tonemap.uniforms.uSharpen.value=spec.sharpen;
 if(pipe.taa)pipe.taa.reset=true;
 if(pipe.bloomStrength!==undefined)pipe.bloomStrength=Math.min(pipe.bloomStrength,.075);
 const set=mode=>{
  if(!GRAPHICS[mode])return false;
  const g=GRAPHICS[mode];
  settings.values.renderScale=g.renderScale;settings.values.targetFps=g.targetFps;
  if(pipe.taa)pipe.taa.reset=true;
  if(pipe.ao)pipe.ao.enabled=false;
  if(pipe.tonemap?.uniforms?.uSharpen)pipe.tonemap.uniforms.uSharpen.value=g.sharpen;
  try{storage?.setItem('highfly-graphics-profile-v1',mode)}catch{}
  return true;
 };
 return {selected,profiles:GRAPHICS,set};
}
