/** HIGHFLY F0.4: real directional DASH with braking to idle / current steering.
 * Unsung Player and its collision integrator remain authoritative. ONE capsule.
 */
export const DASH={time:.24,speed:15.5,cooldown:.78,cost:16,iframes:[.035,.18]};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function dashExitTarget(input,camYaw,grounded=true){
 const x=input?.move?.x??0,y=input?.move?.y??0;
 const len=Math.min(1,Math.hypot(x,y));
 if(len<.07)return {x:0,z:0,speed:0};
 const fx=Math.sin(camYaw),fz=Math.cos(camYaw);
 const norm=Math.hypot(x,y)||1;
 const top=input?.held?.has('sprint')&&grounded?7.8:len>.55?5.2:1.7;
 return {x:(fx*y-fz*x)/norm,z:(fz*y+fx*x)/norm,speed:top*len};
}
export function installHighflyDash(player){
 if(player._highflyDashInstalled)return player;
 player._highflyDashInstalled=true;player._hfDashCd=0;player._hfAirDashSpent=false;
 const original=player.update.bind(player);
 player.update=function(dt,input,camYaw=0){
  const step=clamp(dt,0,.06);
  this._hfDashCd=Math.max(0,this._hfDashCd-step);
  if(this.grounded&&this.state!=='hf_dash')this._hfAirDashSpent=false;
  if(this.state==='hf_dash'){
   this.stateTime+=step;
   this.invulnerable=Math.max(0,this.invulnerable-step);
   if(this.stateTime>=DASH.iframes[0]&&this.stateTime<DASH.iframes[1])
    this.invulnerable=Math.max(this.invulnerable,step+.001);
   const t=clamp(this.stateTime/DASH.time,0,1);
   const braking=t<.52?1:Math.pow(clamp((1-t)/.48,0,1),1.7);
   const target=dashExitTarget(input,camYaw,this.grounded);
   // Explicitly fade the dash impulse and blend toward the player's CURRENT stick.
   // A released stick means target speed is ZERO. No residual skate momentum.
   this.vel.x=this._hfDashDir.x*DASH.speed*braking+target.x*target.speed*(1-braking);
   this.vel.z=this._hfDashDir.z*DASH.speed*braking+target.z*target.speed*(1-braking);
   this._integrate(step);
   if(t>=1){
    this.vel.x=target.x*target.speed;this.vel.z=target.z*target.speed;
    this.speed=Math.hypot(this.vel.x,this.vel.z);
    this.setState('move');this.emit('hfDashEnd');
   }
   return;
  }
  const allowed=this.state==='move'||(this.state==='attack'&&this.stateTime>.18);
  if(allowed&&input?.pressed?.has('dash')&&this._hfDashCd<=0&&
   this.stamina>=DASH.cost&&(this.grounded||!this._hfAirDashSpent)){
   const target=dashExitTarget(input,camYaw,this.grounded);
   const dx=target.speed>0?target.x:Math.sin(this.yaw);
   const dz=target.speed>0?target.z:Math.cos(this.yaw);
   if(!this.spend(DASH.cost))return original(dt,input,camYaw);
   if(!this.grounded)this._hfAirDashSpent=true;
   this._hfDashDir={x:dx,z:dz};this._hfDashCd=DASH.cooldown;
   // A DASH cancels a prior swing explicitly; it never runs both full-body actions.
   this.attack=null;this.comboStep=-1;this.attackQueued=false;
   this.sprinting=false;this.setState('hf_dash');
   this.yaw=Math.atan2(dx,dz);
   this.vel.x=dx*DASH.speed;this.vel.z=dz*DASH.speed;
   this.emit('hfDashStart',{direction:this._hfDashDir});
   this._integrate(step);
   return;
  }
  return original(dt,input,camYaw);
 };
 return player;
}
