/** HIGHFLY F0 fog adapter: world geometry and shader source stay original. */
export const FOG_KEY='highfly-free-fog-v1';
export function fogLevel(raw,fallback=0.35){
 const n=Number(raw);
 return raw!==null && raw!=='' && Number.isFinite(n)?Math.max(0,Math.min(1,n)):fallback;
}
export function installHighflyFog(pipe,storage=globalThis.localStorage){
 if(!pipe?.fog?.haze || !pipe?.fog?.mist)throw Error('Original Unsung FogPass unavailable');
 const haze=pipe.fog.haze.x,mist=pipe.fog.mist.x;
 let raw=null;try{raw=storage?.getItem(FOG_KEY)??null}catch{}
 let value=fogLevel(raw);
 function set(v){
   value=fogLevel(v);pipe.fog.haze.x=haze*value;pipe.fog.mist.x=mist*value;
   try{storage?.setItem(FOG_KEY,String(value))}catch{}
   return value;
 }
 set(value);
 return {get value(){return value},set};
}
