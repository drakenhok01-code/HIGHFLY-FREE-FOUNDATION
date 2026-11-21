/**
 * HIGHFLY P3.0 — pure view model: rareza, +0 and the ten equip slots.
 * Does NOT modify game runtime, saves, original icons, loot or crafting.
 * All visual assets are resolved from P2.2 manifest at integration time.
 */
import {RARITIES, projectedGearStats, projectedEquippedBonuses} from '../p2/catalog-domain.mjs';

const labels=['Común','Poco común','Raro','Épico','Legendario','Mítico'];
const names=['comun','poco-comun','raro','epico','legendario','mitico'];
const tones=['#A9B2C2','#56D99B','#55B0FF','#BD7DFF','#F6C75B','#FF658A'];
export const RARITY_THEMES=Object.freeze(Object.fromEntries(labels.map((label,i)=>[label,Object.freeze({
 name:label,token:names[i],color:tones[i],level:i,
 ringClass:'hf-p3-rarity-'+names[i]
})])));
if(JSON.stringify(RARITIES)!==JSON.stringify(labels))throw Error('P3 rarezas fuera de sincronía con el catálogo P2');

export const SLOT_LABELS=Object.freeze({
 helmet:'Casco',chest:'Pechera',gloves:'Guantes',right_hand:'Mano derecha',
 necklace:'Collar',shoulders:'Hombros',pants:'Pantalón',boots:'Botas',
 left_hand:'Mano izquierda',ring:'Anillo'
});

export const EQUIPMENT_KINDS=Object.freeze(['weapon','shield','armor','accessory']);
const isGear=item=>EQUIPMENT_KINDS.includes(item?.kind);
const safePlus=n=>Number.isSafeInteger(n)&&n>=0&&n<=9;
function validateInstance(template,instance) {
 if(!instance)return;
 if(!isGear(template)||instance.templateId!==template.id)throw Error('Instancia/plantilla incorrecta');
 if(!safePlus(instance.plus))throw Error('Mejora incompatible con +0…+9');
 if(!RARITIES.includes(instance.rarity))throw Error('Rareza desconocida');
}

/** One icon, unchanged artwork, rarity OUTSIDE the baked-in gold border. */
export function iconView(template,instance=null,bindings=null) {
 if(!template?.id||!template.nameEs)throw Error('Plantilla P2 inválida');
 validateInstance(template,instance);
 const gear=isGear(template);
 const rarity=gear?(instance?.rarity??'Común'):(template.fixedRarityForNonEquipment??'Común');
 const theme=RARITY_THEMES[rarity];
 if(!theme)throw Error('Rareza P2 no reconocida: '+rarity);
 const binding=bindings?.items?.find(x=>x.id===template.id);
 if(!binding)throw Error('Falta ruta visual P2.2 para '+template.id);
 const plus=gear?(instance?.plus??0):null;
 const stats=gear&&instance?projectedGearStats(template,instance):null;
 return Object.freeze({
  templateId:template.id,name:template.nameEs,kind:template.kind,
  iconPath:binding.runtimeIconPath,sourceStatus:binding.artStatus,
  rarity,rarityToken:theme.token,rarityClass:theme.ringClass,rarityColor:theme.color,
  plus,plusLabel:plus===null?'':'+'+plus,
  accessibleLabel:template.nameEs+' · '+rarity+(gear?' +'+plus:''),
  stats,slot:template.equipment?.slot??null,
  mayEquip:!!template.equipment?.slot&&!template.flags?.requiresSlotDecision,
  virtualTemplatePreview:instance===null,
  armorMeshChanged:false
 });
}

/** The P3 bag is a catalog preview, NOT proof an item exists in save or drops. */
export function previewCatalogBag(catalog,bindings,{kind=null,search='',rarity='Común'}={}) {
 if(!catalog?.items||catalog.items.length!==47)throw Error('Se necesita catálogo P2 de 47');
 if(kind&&!['weapon','shield','armor','accessory','material','consumable'].includes(kind))throw Error('Filtro inválido');
 if(!RARITIES.includes(rarity))throw Error('Rareza de demostración inválida');
 const query=String(search).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 return catalog.items
  .filter(x=>(!kind||x.kind===kind)&&(x.nameEs+' '+x.id).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').includes(query))
  .map(x=>{
   const simulated=isGear(x)?{templateId:x.id,rarity,plus:0}:null;
   return iconView(x,simulated,bindings);
  });
}

/** Preview only; rejects the amulet until its actual slot is decided in P4. */
export function previewEquipment(slots,slotIds) {
 if(!Array.isArray(slots)||!Array.isArray(slotIds)||slotIds.length!==10)throw Error('Deben existir 10 ranuras');
 const usedSlots=new Set();
 for(const x of slots){
  if(!SLOT_LABELS[x.slot]||!slotIds.includes(x.slot)||usedSlots.has(x.slot))throw Error('Ranura inválida o duplicada');
  usedSlots.add(x.slot);
  if(x.template?.flags?.requiresSlotDecision||!x.template?.equipment?.slot)throw Error('Ranura del objeto sin decidir');
 }
 const bonuses=projectedEquippedBonuses(slots);
 return Object.freeze({slots:slotIds.map(id=>Object.freeze({id,label:SLOT_LABELS[id],filled:usedSlots.has(id)})),bonuses,displayOnly:true});
}
