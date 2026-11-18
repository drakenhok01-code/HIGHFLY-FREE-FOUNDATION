/** HIGHFLY F0.3: independent directional DASH on top of original Unsung Player.
 * Deliberately reuse Player._integrate so slopes, world colliders and ground resolution survive.
 * Visuals are separate: KayKit's CC0 Dodge_Forward clip.
 */
export const DASH={time:.24,speed:15.5,cooldown:.78,cost:16,iframes:[.035,.18]};
export function installHighflyDash(player){
 if(player._highflyDashInstalled)return player;
 player._highflyDashInstalled=true;
 player._hfDashCd=0;player._hfAirDashSpent=false;
 const original=player.update.bind(player);
 player.update=function(dt,input,camYaw){
  const step=Math.max(0,Math.min(dt,.06));
  this._hfDashCd=Math.max(0,this._hfDashCd-step);
  if(this.grounded&&this.state!=='hf_dash')this._hfAirDashSpent=false;
  if(this.state==='hf_dash'){
   this.stateTime+=step;
   this.invulnerable=Math.max(0,this.invulnerable-step);
   // Damage immunity is confined to the center of DASH; no permanent invulnerability.
   if(this.stateTime>=DASH.iframes[0]&&this.stateTime<DASH.iframes[1])this.invulnerable=Math.max(this.invulnerable,step+.001);
   const decel=1-.20*Math.min(1,this.stateTime/DASH.time);
   this.vel.x=this._hfDashDir.x*DASH.speed*decel;
   this.vel.z=this._hfDashDir.z*DASH.speed*decel;
   this._integrate(step); // Original Unsung capsule, terrain, buildings and colliders.
   if(this.stateTime>=DASH.time){this.setState('move');this.emit('hfDashEnd');}
   return;
  }
  const allowed=this.state==='move'||(this.state==='attack'&&this.stateTime>.18);
  if(allowed&&input?.pressed?.has('dash')&&this._hfDashCd<=0&&this.stamina>=DASH.cost&&
    (this.grounded||!this._hfAirDashSpent)){
   const x=input.move?.x??0,y=input.move?.y??0,fx=Math.sin(camYaw),fz=Math.cos(camYaw);
   let dx=fx*y-fz*x,dz=fz*y+fx*x;
   const length=Math.hypot(dx,dz);
   if(length>.07){dx/=length;dz/=length;}
   else {dx=Math.sin(this.yaw);dz=Math.cos(this.yaw);}
   if(!this.grounded)this._hfAirDashSpent=true;
   if(!this.spend(DASH.cost))return original(dt,input,camYaw);
   this._hfDashDir={x:dx,z:dz};
   this._hfDashCd=DASH.cooldown;
   this.attack=null;this.comboStep=-1;this.attackQueued=false;
   this.sprinting=false;this.setState('hf_dash');
   this.yaw=Math.atan2(dx,dz);
   this.vel.x=dx*DASH.speed;this.vel.z=dz*DASH.speed;
   this.emit('hfDashStart',{direction:this._hfDashDir});
   // One physics substep immediately; do not also run the original update this frame.
   this._integrate(step);
   return;
  }
  return original(dt,input,camYaw);
 };
 return player;
}
