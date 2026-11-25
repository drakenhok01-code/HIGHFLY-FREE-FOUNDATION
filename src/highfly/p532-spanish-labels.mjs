/** HIGHFLY World Forge P532 · complete Spanish display labels for public CC0
 * KayKit Medieval Hexagon (221 exact paths). Model IDs, hashes and source
 * filenames are never translated, only human-facing names and search labels.
 */
const COLORS={red:'rojo',blue:'azul',green:'verde',yellow:'amarillo'};
const BUILDING={
 archeryrange:'Campo de tiro',barracks:'Cuartel',blacksmith:'Herrería',castle:'Castillo',
 church:'Iglesia',home_A:'Casa A',home_B:'Casa B',lumbermill:'Aserradero',
 market:'Mercado',mine:'Entrada de mina',tavern:'Taberna',tower_A:'Torre de vigilancia A',
 tower_B:'Torre de vigilancia B',tower_base:'Base de torre',tower_catapult:'Torre con catapulta',
 watermill:'Molino de agua',well:'Pozo',windmill:'Molino de viento'
};
const NEUTRAL={
 building_bridge_A:'Puente de piedra A',building_bridge_B:'Puente de piedra B',
 building_destroyed:'Edificio en ruinas',building_dirt:'Construcción de tierra',
 building_grain:'Almacén de grano',building_scaffolding:'Andamiaje de obra',
 building_stage_A:'Plataforma A',building_stage_B:'Plataforma B',building_stage_C:'Plataforma C',
 fence_stone_straight:'Valla de piedra',fence_stone_straight_gate:'Puerta de valla de piedra',
 fence_wood_straight:'Valla de madera',fence_wood_straight_gate:'Puerta de valla de madera',
 projectile_catapult:'Proyectil de catapulta',
 wall_corner_A_gate:'Esquina de muralla A con puerta',wall_corner_A_inside:'Esquina de muralla A interior',
 wall_corner_A_outside:'Esquina de muralla A exterior',
 wall_corner_B_inside:'Esquina de muralla B interior',wall_corner_B_outside:'Esquina de muralla B exterior',
 wall_straight:'Tramo recto de muralla',wall_straight_gate:'Puerta principal de muralla'
};
const PROPS={
 barrel:'Barril',bucket_arrows:'Cubo con flechas',bucket_empty:'Cubo vacío',bucket_water:'Cubo con agua',
 crate_A_big:'Caja A grande',crate_A_small:'Caja A pequeña',
 crate_B_big:'Caja B grande',crate_B_small:'Caja B pequeña',
 crate_long_A:'Caja larga A',crate_long_B:'Caja larga B',crate_long_C:'Caja larga C',
 crate_long_empty:'Caja larga vacía',crate_open:'Caja abierta',
 flag_blue:'Bandera azul',flag_green:'Bandera verde',flag_red:'Bandera roja',flag_yellow:'Bandera amarilla',
 ladder:'Escalera de mano',pallet:'Tarima de madera',resource_lumber:'Madera para construcción',
 resource_stone:'Piedra para construcción',sack:'Saco',target:'Diana de tiro',tent:'Carpa de campaña',
 weaponrack:'Soporte de armas',wheelbarrow:'Carretilla'
};
const fill=s=>s.replace(/_/g,' ').replace(/\b[a-z]/g,m=>m.toUpperCase());
export function spanishFreeLabel(asset){
 if(!asset?.freePath)return asset?.label||'Objeto';
 const [kind,folder,name]=asset.freePath.replace(/\.gltf$/,'').split('/');
 if(kind==='buildings'&&folder!=='neutral'){
  const root=name.replace(/_(red|blue|green|yellow)$/,'');
  return (BUILDING[root]||fill(root))+' · '+(COLORS[folder]||folder);
 }
 if(kind==='buildings'&&folder==='neutral')return NEUTRAL[name]||fill(name);
 if(kind==='decoration'&&folder==='props')return PROPS[name]||fill(name);
 if(kind==='decoration'&&folder==='nature'){
  if(name==='cloud_big')return 'Nube grande';
  if(name==='cloud_small')return 'Nube pequeña';
  if(/^hill_single_/.test(name))return 'Loma '+name.split('_').at(-1);
  if(/^hills_/.test(name)){
   const p=name.split('_');return 'Colinas '+p[1]+(p.includes('trees')?' con árboles':'');
  }
  if(/^mountain_/.test(name)){
   const p=name.split('_');return 'Montaña '+p[1]+(p.includes('grass')?' con pasto':'')+(p.includes('trees')?' y árboles':'');
  }
  if(/^rock_single_/.test(name))return 'Roca individual '+name.split('_').at(-1);
  if(/^tree_single_/.test(name)){
   const p=name.split('_');return p.includes('cut')?'Tronco talado '+p[2]:'Árbol individual '+p[2];
  }
  if(/^trees_/.test(name)){
   const p=name.split('_');const variant=p.slice(2).join('_');
   return (variant==='cut'?'Árboles talados':variant==='large'?'Bosquecillo grande':
    variant==='medium'?'Bosquecillo mediano':'Bosquecillo pequeño')+' '+p[1];
  }
  if(/^waterlily_/.test(name))return 'Nenúfar '+name.split('_').at(-1);
  if(/^waterplant_/.test(name))return 'Planta acuática '+name.split('_').at(-1);
 }
 if(kind==='tiles'){
  const raw=asset.freePath.replace(/\.gltf$/,'').split('/');
  const group=raw[1],dry=raw.includes('waterless');
  const base=raw.at(-1).replace(/_waterless$/,'');
  if(group==='base'){
   const map={hex_grass:'Hexágono de césped',hex_grass_bottom:'Base de hexágono con césped',
    hex_grass_sloped_high:'Hexágono de césped en pendiente alta',
    hex_grass_sloped_low:'Hexágono de césped en pendiente baja',hex_water:'Hexágono de agua'};
   return map[base]||fill(base);
  }
  const suffix=base.replace(/^hex_(?:coast|river|road)_/,'');
  const pre=group==='coast'?'Costa hexagonal':group==='rivers'?'Río hexagonal':'Camino hexagonal';
  return pre+' '+(suffix==='crossing_A'?'cruce A':suffix==='crossing_B'?'cruce B':
    suffix.endsWith('_curvy')?suffix.replace('_curvy','')+' curvo':
    suffix.endsWith('_sloped_high')?suffix.replace('_sloped_high','')+' en pendiente alta':
    suffix.endsWith('_sloped_low')?suffix.replace('_sloped_low','')+' en pendiente baja':suffix)+
    (dry?' sin agua':'');
 }
 return asset.label||fill(name);
}
export function localizePublicAsset(asset){
 if(!asset?.freePath)return asset;
 return {...asset,label:spanishFreeLabel(asset),searchTags:[asset.label,asset.freePath,spanishFreeLabel(asset)].join(' ')};
}
