/** Distinguish walkable built stairs from impassable natural cliffs.
 * The steep-terrain gate must not overwrite the actual walkable stair floor.
 */
export function blocksNaturalCliff({wasGrounded,run,g0,g1,y,floorHere,floorNext}){
 if(!wasGrounded||run<=1e-5||!Number.isFinite(g0)||!Number.isFinite(g1))return false;
 const onTerrain=y-g0<.5;
 if(!onTerrain||(g1-g0)/run<=1.25)return false;
 // If the BVH reports a separate built floor, don't treat the coarse
 // terrain slope under that floor as a collision wall.
 const hasBuiltSurface=(Number.isFinite(floorHere)&&Math.abs(floorHere-g0)>.28)||
   (Number.isFinite(floorNext)&&Math.abs(floorNext-g1)>.28);
 return !hasBuiltSurface;
}
