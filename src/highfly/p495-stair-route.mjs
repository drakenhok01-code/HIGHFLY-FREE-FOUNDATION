/** HIGHFLY P4.9.5: exact, source-derived walkway for Unsung's stair
 * linking Petal Court to Cantor's Rise. Original:
 * Sites._major(): b.at(-118,H(-118,-459)-.1,-459,Math.PI);
 * stairs(q, 56,25.4,9). Neither imaginary bridges nor teleportation.
 * Only switches off TERRAIN-HEIGHTFIELD overrides where this real staircase
 * owns a BVH walkable tread. The capsule/BVH is never bypassed.
 */
export const P495_STAIR=Object.freeze({id:'petal-cantor',x:-118,z:-459,
 run:56,rise:25.4,width:9,treadRise:0.17,yOffset:-.1});
const finite=Number.isFinite;
export function p495StairTread(world,x,z,yFrom=Infinity){
 if(!world||!finite(x)||!finite(z))return null;
 const regional=finite(yFrom)?world.hfRegionWalkway?.({x,y:yFrom,z}):null;if(regional?.kind==='stairs')return {id:'regional-stairs',x,z,y:regional.y};
 const s=P495_STAIR;
 // The flight points toward world -X; centreline fixed in the native site.
 const along=s.x-x,cross=z-s.z;
 if(along<-.06||along>s.run+.06||Math.abs(cross)>s.width/2-.37)return null;
 const h=world.terrain?.heightAt?.(s.x,s.z)??world.groundHeight?.(s.x,s.z);
 if(!finite(h))return null;
 const n=Math.max(1,Math.round(s.rise/s.treadRise)),tr=s.run/n,rs=s.rise/n;
 const i=Math.max(0,Math.min(n-1,Math.floor(Math.max(0,along)/tr)));
 const y=h+s.yOffset+(i+1)*rs;
 // Reject a location far above or below the actual staircase, including
 // a low tunnel or a jump over the flight.
 if(finite(yFrom)&&Math.abs(yFrom-y)>2.0)return null;
 return {id:s.id,x,z,y,along,cross,step:i,n,run:s.run};
}
export function p495OnActualStairs(world,point){
 if(!point)return false;
 const tread=p495StairTread(world,point.x,point.z,point.y);
 return !!tread&&Math.abs(point.y-tread.y)<.95;
}
export function p495StairTraverse(world,a,b){
 if(!a||!b)return false;
 const p=p495StairTread(world,a.x,a.z,a.y),
       q=p495StairTread(world,b.x,b.z,b.y);
 return !!p&&!!q&&p.id===q.id&&Math.abs(a.y-p.y)<.95&&Math.abs(b.y-q.y)<1.15;
}
