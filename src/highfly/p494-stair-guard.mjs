/** HIGHFLY P4.9.4: safe downward step at real Unsung geometry.
 * Requires existing walkable lower floor, descending height <=0.72 m
 * AND a clear horizontal capsule waist ray. Never teleports across a wall.
 */
const safe=n=>Number.isFinite(n);
export function stairDownstep(world,from,to,radius=.3){
 if(!world||!from||!to||!safe(from.y))return null;
 const dx=to.x-from.x,dz=to.z-from.z,len=Math.hypot(dx,dz);
 if(!(len>.0001&&len<1.15)||typeof world.floorBelow!=='function')return null;
 const floor0=world.floorBelow(from.x,from.y+.45,from.z,1.5);
 const floor1=world.floorBelow(to.x,from.y+.45,to.z,1.5);
 if(!safe(floor0)||!safe(floor1))return null;
 const lower=floor0-floor1;
 if(lower<.13||lower>.72||Math.abs(floor0-from.y)>.35)return null;
 // A positive terrain cliff is not a descending stair.
 const terrain=world.groundHeight?.(to.x,to.z);
 if(safe(terrain)&&terrain>from.y+.12)return null;
 const ray=world.raycast?.({x:from.x,y:from.y+.92,z:from.z},
  {x:dx/len,y:0,z:dz/len},len+Math.max(.22,radius));
 if(safe(ray)&&ray<len+.08)return null;
 return {floor:floor1,step:lower};
}
