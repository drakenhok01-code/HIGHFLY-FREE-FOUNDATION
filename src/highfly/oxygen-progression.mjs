/** Character attributes may progress; real training NOT auto-verified here.
 * Training increments must come only from the future approved RPG Fitness ledger.
 * Never encourages practising physical breath-holding.
 */
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const OXYGEN_BASE_SECONDS=32;
export function oxygenMax(level=1,trainingPoints=0){
 const lv=clamp(Math.floor(Number(level)||1),1,100);
 const tr=clamp(Math.floor(Number(trainingPoints)||0),0,50);
 return 100+Math.min(70,(lv-1)*1.55)+Math.min(20,tr*1.5);
}
export function oxygenRate(underwater,sprinting){
 return underwater?-(sprinting?4.65:100/OXYGEN_BASE_SECONDS):17;
}
export function oxygenRemainingSeconds(oxygen,capacity=100,sprinting=false){
 return Math.max(0,oxygen)/(sprinting?4.65:100/OXYGEN_BASE_SECONDS);
}
