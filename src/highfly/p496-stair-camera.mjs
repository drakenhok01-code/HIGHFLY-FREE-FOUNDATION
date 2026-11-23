/** HIGHFLY P4.9.6: reduce terrain-vs-BVH height discontinuities at the
 * Petal/Cantor built staircase without teleporting or changing collision. */
import {p495OnActualStairs} from './p495-stair-route.mjs';
const finite=Number.isFinite;
export function cameraNearRealStairs(world,player){
 return !!player&&p495OnActualStairs(world,player);
}
export function stairAwareCameraFloor(world,player,cameraPos){
 const ground=world?.groundHeight?.(cameraPos.x,cameraPos.z);
 const fallback=finite(ground)?ground+.54:-Infinity;
 if(!cameraNearRealStairs(world,player))return fallback;
 // During stair traversal the underlying heightfield can be far above the
 // stone steps. Prefer the actual solid BVH under the camera, when found.
 const native=world?.floorBelow?.(cameraPos.x,cameraPos.y+1.8,cameraPos.z,5.0);
 return finite(native)?native+.36:fallback;
}
export function stabilizedStairCameraY(previous,requested,dt,onStairs){
 if(!onStairs||!finite(previous)||!finite(requested))return requested;
 const speed=7.5,limit=Math.max(.07,Math.min(.45,speed*Math.max(0,Math.min(.06,dt||0))));
 return previous+Math.max(-limit,Math.min(limit,requested-previous));
}