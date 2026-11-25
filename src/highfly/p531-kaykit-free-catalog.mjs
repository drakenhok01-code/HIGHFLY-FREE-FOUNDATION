/* HIGHFLY P5.3.1 — complete official KayKit Medieval Hexagon FREE (CC0-1.0).
 * This is the original freely published pack, not privately owned SOURCE models.
 * Models stay in their own collection categories and preserve every available
 * colourway. Original terrain remains Unsung Vale; 'Hex' assets are optional props.
 */
const COLORS=['red','blue','green','yellow'];
const BUILDINGS='archeryrange barracks blacksmith castle church home_A home_B lumbermill market mine tavern tower_A tower_B tower_base tower_catapult watermill well windmill'.split(' ');
const NEUTRAL='building_bridge_A building_bridge_B building_destroyed building_dirt building_grain building_scaffolding building_stage_A building_stage_B building_stage_C fence_stone_straight fence_stone_straight_gate fence_wood_straight fence_wood_straight_gate projectile_catapult wall_corner_A_gate wall_corner_A_inside wall_corner_A_outside wall_corner_B_inside wall_corner_B_outside wall_straight wall_straight_gate'.split(' ');
const NATURE='cloud_big cloud_small hill_single_A hill_single_B hill_single_C hills_A hills_A_trees hills_B hills_B_trees hills_C hills_C_trees mountain_A mountain_A_grass mountain_A_grass_trees mountain_B mountain_B_grass mountain_B_grass_trees mountain_C mountain_C_grass mountain_C_grass_trees rock_single_A rock_single_B rock_single_C rock_single_D rock_single_E tree_single_A tree_single_A_cut tree_single_B tree_single_B_cut trees_A_cut trees_A_large trees_A_medium trees_A_small trees_B_cut trees_B_large trees_B_medium trees_B_small waterlily_A waterlily_B waterplant_A waterplant_B waterplant_C'.split(' ');
const PROPS='barrel bucket_arrows bucket_empty bucket_water crate_A_big crate_A_small crate_B_big crate_B_small crate_long_A crate_long_B crate_long_C crate_long_empty crate_open flag_blue flag_green flag_red flag_yellow ladder pallet resource_lumber resource_stone sack target tent weaponrack wheelbarrow'.split(' ');
const BASE='hex_grass hex_grass_bottom hex_grass_sloped_high hex_grass_sloped_low hex_water'.split(' ');
const COAST='A B C D E'.split(' ').map(x=>'hex_coast_'+x);
const RIVERS='A A_curvy B C D E F G H I J K L crossing_A crossing_B'.split(' ').map(x=>'hex_river_'+x);
const ROADS='A A_sloped_high A_sloped_low B C D E F G H I J K L M'.split(' ').map(x=>'hex_road_'+x);
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const nice=s=>s.replace(/^building_/,'').replace(/^hex_/,'').replaceAll('_',' ').replace(/\b[a-z]/g,m=>m.toUpperCase());
const legacyId=name=>{
 const v=name.replace(/^building_/,'').replace(/_red$/,'');
 return (!['tower_base','tower_catapult'].includes(v))?'kaykit-'+slug(v):'free-'+slug(name);
};
const s=(name,path,category,kind,w,d,icon,sub='',color='')=>{
 const id=(path.startsWith('buildings/red/')&&name.endsWith('_red'))?legacyId(name):'free-'+slug(name);
 return {id,label:nice(name)+(color?' · '+({red:'Rojo',blue:'Azul',green:'Verde',yellow:'Amarillo'}[color]):''),
  icon,cat:category,kind,w,d,freeModel:true,freePath:path+'.gltf',thumbName:slug(path),colour:color,sub,
  license:'CC0-1.0'};
};
const buildingDims={
 archeryrange:[16,13],barracks:[14,12],blacksmith:[12,12],castle:[23,23],church:[13,13],
 home_A:[10,9],home_B:[10,9],lumbermill:[14,12],market:[13,11],mine:[13,12],tavern:[13,12],
 tower_A:[8,8],tower_B:[8,8],tower_base:[8,8],tower_catapult:[10,10],watermill:[12,12],well:[6,6],windmill:[12,12]
};
const catalog=[];
for(const color of COLORS)for(const name of BUILDINGS){
 const [w,d]=buildingDims[name];
 catalog.push(s('building_'+name+'_'+color,'buildings/'+color+'/building_'+name+'_'+color,
 'KayKit FREE · Edificios','building',w,d,'🏠','Edificios completos',color));
}
for(const name of NEUTRAL){
 const structure=/bridge|wall_|fence_/.test(name),big=/stage|scaffolding|destroyed|grain|dirt/.test(name);
 const [w,d]=/wall_/.test(name)?[9,2]:/fence_/.test(name)?[5,.8]:/bridge/.test(name)?[13,5]:big?[8,8]:[2.5,2.5];
 catalog.push(s(name,'buildings/neutral/'+name,'KayKit FREE · Arquitectura',structure?'structure':'prop',w,d,structure?'🏰':'🧱','Murallas, puentes, puertas y estructuras'));
}
for(const name of NATURE){
 const tree=/tree/.test(name),water=/water/.test(name),mountain=/mountain|hills|hill/.test(name),cloud=/cloud/.test(name);
 const w=mountain?28:tree?(name.includes('large')?15:7):water?3:cloud?18:5;
 catalog.push(s(name,'decoration/nature/'+name,'KayKit FREE · Naturaleza','nature',w,w,tree?'🌳':water?'🌿':cloud?'☁️':'🪨','Decoración natural'));
}
for(const name of PROPS){
 const large=/tent|weaponrack|wheelbarrow|pallet/.test(name),size=large?4.3:1.8;
 catalog.push(s(name,'decoration/props/'+name,'KayKit FREE · Accesorios','prop',size,size,'🧰','Decoración y oficios'));
}
for(const [dir,names] of [['base',BASE],['coast',COAST],['rivers',RIVERS],['roads',ROADS],
 ['coast/waterless',COAST.map(x=>x+'_waterless')],['rivers/waterless',RIVERS.map(x=>x+'_waterless')]]){
 for(const name of names)catalog.push(s(name,'tiles/'+dir+'/'+name,'KayKit FREE · Hexágonos',
  'tile',4.2,4.2,'⬡','Piezas 3D sobre el relieve; no modifican Unsung'));
}
export const KAYKIT_FREE_ALL=Object.freeze(catalog);
export const KAYKIT_FREE_BY_ID=new Map(KAYKIT_FREE_ALL.map(x=>[x.id,x]));
export const KAYKIT_FREE_IDS=new Set(KAYKIT_FREE_ALL.map(x=>x.id));
export const KAYKIT_FREE_GROUPS=Object.freeze({
 buildings:KAYKIT_FREE_ALL.filter(x=>x.kind==='building').length,
 architecture:KAYKIT_FREE_ALL.filter(x=>x.cat==='KayKit FREE · Arquitectura').length,
 nature:KAYKIT_FREE_ALL.filter(x=>x.kind==='nature').length,
 props:KAYKIT_FREE_ALL.filter(x=>x.cat==='KayKit FREE · Accesorios').length,
 hex:KAYKIT_FREE_ALL.filter(x=>x.kind==='tile').length
});
if(KAYKIT_FREE_ALL.length!==221||KAYKIT_FREE_IDS.size!==221)throw Error('Incomplete official KayKit FREE catalog');
