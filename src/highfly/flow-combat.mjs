/** HIGHFLY F0.12 FLOW: explicit per-weapon hidden sequences.
 * Only deliberate directional inputs in the correct order/time count.
 * Movement joystick does NOT choose the weapon slash.
 */
export const SECRET_FLOWS=Object.freeze({
 sword:['right','left','up'],
 greatsword:['down','right','up'],
 dual:['left','right','up'],
 shield:['right','down','left'],
 unarmed:['left','right','down'],
 spear:['up','up','right'],
 staff:['right','up','left']
});
export function directionFromAim(a){
 if(!a||!Number.isFinite(a.x)||!Number.isFinite(a.y)||Math.hypot(a.x,a.y)<.50)return null;
 return Math.abs(a.x)>Math.abs(a.y)?(a.x>0?'right':'left'):(a.y>0?'up':'down');
}
/** Return a new history. No random accidental combos, no 10K arbitrary paths.
 * Each successive directional SWING must follow within .18–1.25s.
 */
export function recordFlowStrike(history,now,dir,weapon='sword'){
 const pattern=SECRET_FLOWS[weapon]??SECRET_FLOWS.sword;
 if(!dir)return {history:[],accepted:false,secret:false};
 const h=Array.isArray(history)?history:[];
 const last=h[h.length-1];
 const gap=last?now-last.time:0;
 const keep=last&&last.weapon===weapon&&gap>=.18&&gap<=1.25?h:[];
 const next=pattern[keep.length];
 const accepted=dir===next;
 const candidate=accepted?[...keep,{dir,time:now,weapon}]:
   dir===pattern[0]?[{dir,time:now,weapon}]:[];
 const secret=candidate.length===pattern.length;
 return {history:secret?[]:candidate,accepted:candidate.length>0,secret};
}
