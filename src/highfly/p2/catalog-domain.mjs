/**
 * HIGHFLY P2 — isolated, PURE item catalogue/domain prototype.
 *
 * This module is deliberately NOT imported by game bootstrap or Premium UI.
 * It is a tested migration contract, not a deployed loot/marketplace service.
 * No browser/global storage, network, random generator, or engine dependency.
 */
export const RARITIES = Object.freeze(['Común','Poco común','Raro','Épico','Legendario','Mítico']);
export const GEAR_KINDS = Object.freeze(['weapon','shield','armor','accessory']);
export const ORIGINS = Object.freeze(['monster_drop','boss_drop','craft','quest_reward','event_reward','npc_shop','starter']);
const GEAR = new Set(GEAR_KINDS);
const fail = message => {throw new Error(message);};
const own = (o,key) => Object.prototype.hasOwnProperty.call(o,key);
const validIdentity = (v,name) => typeof v === 'string' && v.trim().length > 0 || fail(name+' requerido');
const safeCount = n => Number.isSafeInteger(n) && n >= 0;
const safeBonus = n => Number.isFinite(n) && n >= 0;

/** Validate P2 JSON manifest AND proposed recipe graph before future integration. */
export function validateP2(catalog,crafting) {
 if(catalog?.schema!=='highfly-master-catalog-p2-v1')fail('Catálogo P2 equivocado');
 if(catalog.character?.count!==1||catalog.character.classSystem!==false)fail('El Cazador debe ser único y universal');
 if(catalog.equipmentPolicy?.spawnEnhancement!==0||catalog.equipmentPolicy?.maxEnhancement!==9)fail('Todo equipo debe nacer +0');
 if(!Array.isArray(catalog.items)||catalog.items.length!==47)fail('Se esperan 47 plantillas P2');
 const items=new Map(),legacy=new Set();
 for(const item of catalog.items) {
  validIdentity(item.id,'ID de objeto');
  if(items.has(item.id))fail('ID duplicado: '+item.id);
  if(typeof item.nameEs!=='string'||!item.nameEs.trim())fail('Falta nombre español: '+item.id);
  if(!['weapon','shield','armor','accessory','material','consumable'].includes(item.kind))fail('Tipo de objeto no reconocido: '+item.id);
  const gear=GEAR.has(item.kind);
  if(gear !== !!item.equipment)fail('Equipo/ranura inconsistente: '+item.id);
  if(gear) {
   const e=item.equipment;
   if(e.enhancementAtCreation!==0||!e.instanceIdRequired)fail('Pieza sin garantía +0: '+item.id);
   if(JSON.stringify(e.rarityOnAcquisition)!==JSON.stringify(RARITIES))fail('Rareza no independiente: '+item.id);
   if(!Array.isArray(e.classRestrictions)||e.classRestrictions.length)fail('Restricción por clase prohibida: '+item.id);
   if(!e.baseStats||!Object.keys(e.baseStats).length||Object.values(e.baseStats).some(n=>!safeBonus(n)))fail('Stats base inválidas: '+item.id);
   if((item.kind==='armor'||item.kind==='accessory')&&e.appearance!=='STATS_ONLY_NO_3D')fail('La armadura NO modifica personaje 3D: '+item.id);
   if(item.stackMax!==1)fail('Equipamiento futuro no puede apilar sin identidad: '+item.id);
   if(!e.slot&&!item.flags?.requiresSlotDecision)fail('Ranura sin resolver: '+item.id);
  }
  if(item.icon?.generatedAsset!==false)fail('Icono no autorizado: '+item.id);
  if(item.status==='V36_EXISTING')legacy.add(item.id);
  items.set(item.id,item);
 }
 if(legacy.size!==19)fail('Hay que conservar los 19 IDs aprobados');
 if(crafting?.schema!=='HIGHFLY_P2_CRAFT_GRAPH_V1'||!Array.isArray(crafting.recipes))fail('Recetas P2 equivocadas');
 if(crafting.recipes.length!==32)fail('Se esperan 12 recetas heredadas +20 nuevas');
 const recipes=new Set();
 const professions=new Set(crafting.professions.map(x=>x.id));
 for(const recipe of crafting.recipes) {
  if(recipes.has(recipe.id))fail('Receta duplicada: '+recipe.id);
  recipes.add(recipe.id);
  if(!items.has(recipe.output?.templateId)||!Number.isSafeInteger(recipe.output.count)||recipe.output.count<1)fail('Salida de receta inválida: '+recipe.id);
  if(!professions.has(recipe.professionId))fail('Oficio inexistente: '+recipe.professionId);
  if(!Array.isArray(recipe.ingredients)||!recipe.ingredients.length)fail('Receta sin ingredientes: '+recipe.id);
  const used=new Set();
  for(const m of recipe.ingredients) {
   if(!items.has(m.templateId)||!Number.isSafeInteger(m.count)||m.count<1||used.has(m.templateId))fail('Material duplicado o inválido: '+recipe.id);
   used.add(m.templateId);
  }
  if(recipe.producesGearAtPlus0!==GEAR.has(items.get(recipe.output.templateId).kind))fail('Receta no garantiza +0: '+recipe.id);
  if(recipe.definesRarity!==false)fail('La receta nunca mejora el equipo: '+recipe.id);
 }
 if(crafting.recipes.filter(x=>x.status==='V36_EXISTING_DO_NOT_MUTATE').length!==12)fail('Se perdieron recetas aprobadas');
 return Object.freeze({valid:true,items:items.size,equipment:catalog.items.filter(x=>x.equipment).length,recipes:recipes.size,activeLegacy:legacy.size});
}

/** One NEW item instance. Calling code MUST provide a fresh collision-free instanceId. */
export function spawnGear(template,options={}) {
 if(!GEAR.has(template?.kind)||!template.equipment)fail('El objeto no es equipable');
 if(own(options,'plus')||own(options,'enhancement')||own(options,'levelUpgrade'))fail('Ningún loot/fabricación/recompensa acepta +N en creación');
 const {instanceId,ownerId,rarity='Común',origin='monster_drop'}=options;
 validIdentity(instanceId,'instanceId');
 validIdentity(ownerId,'ownerId');
 if(!RARITIES.includes(rarity))fail('Rareza desconocida');
 if(!ORIGINS.includes(origin))fail('Origen de objeto inválido');
 if(template.equipment.enhancementAtCreation!==0)fail('La plantilla no garantiza +0');
 return Object.freeze({
  instanceId,templateId:template.id,ownerId,
  rarity,plus:0,origin,
  statRoll:null,craftedBy:origin==='craft'?ownerId:null
 });
}

/** Same numerical formula as v3.6 itemization, with new attribute keys supported. */
export function projectedGearStats(template,instance) {
 if(!template?.equipment||instance?.templateId!==template.id)fail('Instancia/plantilla incompatible');
 if(!Number.isInteger(instance.plus)||instance.plus<0||instance.plus>9)fail('Mejora fuera de rango');
 const rank=RARITIES.indexOf(instance.rarity);
 if(rank<0)fail('Rareza inválida');
 const factor=1+rank*.12+instance.plus*.035;
 return Object.fromEntries(Object.entries(template.equipment.baseStats).map(([key,n])=>[key,+(n*factor).toFixed(2)]));
}

/** Preview equipment bonuses only; UI/combat integration happens in P4. */
export function projectedEquippedBonuses(pairs) {
 if(!Array.isArray(pairs))fail('Las ranuras deben ser una lista');
 const used=new Set(),bonuses={};
 for(const {slot,template,instance} of pairs) {
  validIdentity(slot,'ranura');
  if(used.has(instance?.instanceId))fail('La misma pieza no puede equiparse dos veces');
  if(!template?.equipment?.compatibleSlots?.includes(slot))fail('Ranura incompatible con '+template?.id);
  used.add(instance.instanceId);
  for(const [stat,n] of Object.entries(projectedGearStats(template,instance)))bonuses[stat]=+( (bonuses[stat]??0)+n ).toFixed(2);
 }
 return bonuses;
}

/** Read-only preview. Generic legacy ore is NOT usable in the four new smelting recipes. */
export function previewRecipe(recipe,inventory) {
 if(!recipe?.ingredients||!inventory||typeof inventory!=='object')fail('Receta o inventario inválidos');
 const missing=[];
 for(const {templateId,count} of recipe.ingredients) {
  const available=inventory[templateId]??0;
  if(!safeCount(available))fail('Cantidad de inventario inválida: '+templateId);
  if(available<count)missing.push({templateId,need:count,have:available});
 }
 return {canCraft:missing.length===0,missing,outputId:recipe.output.templateId,outputCount:recipe.output.count,gearStartsPlus:recipe.producesGearAtPlus0?0:null};
}

/** Preview of an eventual marketplace move. NOT authenticated server trade. */
export function previewTransferInstance(instance,fromOwner,toOwner) {
 validIdentity(fromOwner,'vendedor');
 validIdentity(toOwner,'comprador');
 if(fromOwner===toOwner)fail('Vendedor y comprador son idénticos');
 if(instance?.ownerId!==fromOwner||!instance.instanceId||!instance.templateId)fail('El vendedor no posee este ejemplar');
 if(!RARITIES.includes(instance.rarity)||!Number.isInteger(instance.plus)||instance.plus<0||instance.plus>9)fail('Objeto manipulado');
 return Object.freeze({...instance,ownerId:toOwner}); // same exact instanceId / rarity / plus / stats
}
