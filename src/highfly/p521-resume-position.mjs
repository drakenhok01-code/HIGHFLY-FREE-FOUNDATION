/** P521: resume EXACT last safe player position, not Unsung's spire checkpoint.
 * Death still uses the native spire checkpoint; the resume position is only
 * restored once, on reload, after story construction.
 * Does not change item/quest save keys or mutate map elevations.
 */
export const HIGHFLY_RESUME_KEY='highfly-unsung-resume-v1';
const finite=v=>typeof v==='number'&&Number.isFinite(v);
export function validResumePosition(pos,world){
 if(!pos||![pos.x,pos.y,pos.z,pos.yaw].every(finite))return false;
 if(Math.max(Math.abs(pos.x),Math.abs(pos.z))>7900||pos.y<-50||pos.y>3150)return false;
 if(!world?.floorBelow||!world?.groundHeight)return false;
 const floor=world.floorBelow(pos.x,pos.y+2.5,pos.z,11);
 if(!finite(floor)||Math.abs(floor-pos.y)>2.5)return false;
 const water=world.waterLevel?.(pos.x,pos.z);
 if(finite(water)&&pos.y<water+.05)return false;
 return true;
}
export function savedResume(storage=globalThis.localStorage){
 try{
  const raw=storage?.getItem(HIGHFLY_RESUME_KEY);
  if(!raw)return null;
  const data=JSON.parse(raw);
  return data?.v===1?data:null;
 }catch{return null;}
}
export function installHighflyResume(game,{storage=globalThis.localStorage,doc=globalThis.document,win=globalThis.window}={}){
 if(!game||game.__hfP521Resume)return game?.__hfP521Resume??null;
 const player=game.player;
 let disposed=false,last=0,lastSaved=null;
 const read=()=>savedResume(storage);
 function save(){
  if(disposed||game.cine||!['playing','paused','menu'].includes(game.state)||!player||
     player.state==='dead'||player.health<=0)return false;
  const pos={x:player.pos.x,y:player.pos.y,z:player.pos.z,yaw:player.yaw};
  if(!validResumePosition(pos,game.world))return false;
  const record={v:1,pos,at:Date.now()};
  try{storage?.setItem(HIGHFLY_RESUME_KEY,JSON.stringify(record));lastSaved=record;return true;}
  catch{return false;}
 }
 function restore(){
  if(disposed||!game.introSeen||game.cine)return false;
  const data=read();
  if(!data||!validResumePosition(data.pos,game.world))return false;
  const p=data.pos;
  player.spawn(p.x,p.y,p.z,p.yaw);
  game.rig?.snap?.(player);
  if(game.rig)game.rig.yaw=p.yaw;
  return true;
 }
 // Must be called after native Story constructor has initialized the player.
 const restored=restore();
 const nativeUpdate=game.update;
 game.update=function(dt){
  const result=nativeUpdate.call(this,dt);
  if(this.state==='playing'&&!this.cine&&!disposed){
   last+=(Number.isFinite(dt)&&dt>0?Math.min(dt,.1):0);
   if(last>=8){last=0;save();}
  }
  return result;
 };
 const onVisibility=()=>{if(doc?.visibilityState==='hidden')save();};
 const onPageHide=()=>save();
 doc?.addEventListener?.('visibilitychange',onVisibility);
 win?.addEventListener?.('pagehide',onPageHide);
 const nativePause=game.pause;
 game.pause=function(...args){save();return nativePause.apply(this,args);};
 const nativeToHome=game.toHome;
 game.toHome=function(...args){save();return nativeToHome.apply(this,args);};
 const api={key:HIGHFLY_RESUME_KEY,restored,save,restore,read,
  get lastSaved(){return lastSaved;},
  dispose(){
   disposed=true;game.update=nativeUpdate;game.pause=nativePause;game.toHome=nativeToHome;
   doc?.removeEventListener?.('visibilitychange',onVisibility);
   win?.removeEventListener?.('pagehide',onPageHide);
  }};
 game.__hfP521Resume=api;
 globalThis.__hfP521Resume=api;
 return api;
}
