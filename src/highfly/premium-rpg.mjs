import {highflyRemoveItem,nearHighflyMerchant,itemSalePrice} from './p493-item-transactions.mjs';
import './p493-interaction.css';
/** HIGHFLY F0.14 premium RPG windows.
 * DOM/CSS and original SVG art: NOT a screenshot pasted onto Unsung.
 * Read ONE real Player; render over existing Three.js canvas (no second renderer).
 * Premium Android menu enabled by default. Approved backups remain untouched.
 */
import './premium-rpg.css';
import './premium-f0148-v2.css';
import './premium-f0148-v3.css';
import './premium-f0148-v3-1-polish.css';
import './premium-f0148-v3-2-clean.css';
import './premium-f0148-user-icons.css';
import './phoenix-brand.css';
import './phoenix-v36-polish.css';
import './premium-p41.css';
import './premium-p42.css';
import './premium-p43.css';
import './premium-p44.css';
import './premium-p45.css';
import './premium-p46.css';
import './premium-p47.css';
import './p570-premium.css';
import {paintLiveHero} from './hero-portrait.mjs';
import {skillIcon} from './premium-skill-art.mjs';
import {EQUIP_SLOTS,EQUIP_ITEM_DEFS,equippedMode,equipmentBonuses,equipFromBag,unequipToBag} from './rpg-equipment.mjs';
import {premiumArt,assetUrl,questArtUrl,professionIcon,officialLogoUrl} from './premium-assets.mjs';
import {originalMapSnapshot,currentMapLandmarks} from './premium-map.mjs';
import {ITEM_DEFS,RECIPES,loadRpgState,saveRpgState,inventoryRows,bagSlots,MAX_BAG_SLOTS,occupiedInventorySlots,distinctInventoryItems,consumeBagUpgrade,spendPotion,canCraft,craftPotion,ownedMaterialCount,attributeBreakdown,liveSkillRows,assignSkillSlot,clearSkillSlot,skillReady} from './rpg-core.mjs';

import {HUNT_ORDER,HUNT_MISSIONS,xpRequired} from './p49-hunt-data.mjs';
import {installP41WorldLoot} from './p41-world-loot.mjs';
import {weaponMode,WEAPON_MODES} from './universal-gear.mjs';
import {gearTraitAt,enhanceGear,traitLabel,enhancedStats} from './rpg-itemization.mjs';
import {translateHighfly} from './es-localization.mjs';
import {describeSystemIntent} from './system-dialog.mjs';

const PHOENIX='<svg class="hf-rpg-logo-bird" viewBox="0 0 110 100" aria-hidden="true"><defs><linearGradient id="hfPhoenix" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff5d6"/><stop offset=".4" stop-color="#d5a3ff"/><stop offset="1" stop-color="#9944f5"/></linearGradient></defs><path d="M54 22q-12 12-9 28Q22 38 9 10q0 31 29 53Q18 59 2 41q4 32 39 34l12 17 11-17Q101 73 109 41 90 57 71 63q28-22 29-53Q86 37 63 50q2-16-9-28z" fill="url(#hfPhoenix)" stroke="#f7d8ff" stroke-width="1.8"/><path d="M55 8l7 13-7 12-7-12z" fill="#ffeec4"/><path d="M55 43l9 14-9 22-9-22z" fill="#160828" stroke="#ffd4ff" stroke-width="1.4"/></svg>';
const NAV=[
 ['personaje','♙','Personaje'],['atributos','▥','Atributos'],
 ['bolsa','▣','Bolsa'],['habilidades','✦','Habilidades'],
 ['oficios','⚒','Oficios'],['forja','⚗','Forja'],
 ['misiones','☷','Misiones'],['mapa','◇','Mapa'],['opciones','⚙','Opciones']
];
const safe=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const numeric=n=>Number.isFinite(Number(n))?Math.floor(Number(n)).toLocaleString('es-AR'):'0';
const pct=(a,b)=>b>0?Math.min(100,Math.max(0,100*a/b)):0;
const slot=(meta,equipped,selected=false,gearTraits=null)=>{
 const id=equipped?.[meta.id],item=id?ITEM_DEFS[id]:null,trait=gearTraits?.equipped?.[meta.id];
 return '<button type="button" data-hf-equip-slot="'+meta.id+'" data-hf-rarity="'+safe(trait?.rarity??'')+'" class="hf-rpg-equip-slot '+(id?'is-active':'is-empty')+(selected?' is-selected':'')+'" aria-label="'+safe(meta.label)+' '+safe(item?.name??'vacío')+'">'+
 '<span class="hf-rpg-slot-art">'+art(id?'item_'+id:'slot_'+meta.id,false,trait?.rarity??item?.rarity??'Común')+'</span><span><small>'+safe(meta.label)+'</small><b>'+safe(item?traitLabel(item.name,trait):'Vacío')+'</b></span>'+
 '<span class="hf-rpg-equip-more">›</span></button>';
};
const menuLink=(tab,icon,label,selected=false)=>'<button type="button" class="hf-rpg-side-link '+(selected?'is-selected':'')+'" data-hf-tab="'+tab+'"><span>'+icon+'</span>'+safe(label)+'</button>';

function art(id='stone',large=false,rarity=null){
 const effectiveRarity=rarity??(id.startsWith('item_')?ITEM_DEFS[id.slice(5)]?.rarity:'Común')??'Común';
 const premium=premiumArt(id,large,effectiveRarity);if(premium)return premium;
 // Premium originals from approved asset board; vector fallback for unillustrated assets.
 let interior='';
 if(id==='health'||id==='mana'){
  const red=id==='health';
  const hue=red?'#ff416d':'#3d9cff',lite=red?'#ffc0c6':'#c2f8ff',deep=red?'#6d0835':'#10306c';
  // Resolution-independent original vector painting: crisp at 256, 512 or 4K.
  // Multilayer metallic stopper, double glass highlight and magical liquid shine.
  const brew=red?'hfRpgRuby':'hfRpgAzure';
  interior='<defs>'+
   '<linearGradient id="hfRpgGilt" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7cf"/><stop offset=".27" stop-color="#bb8750"/><stop offset=".52" stop-color="#ffe5a7"/><stop offset=".77" stop-color="#a76a3d"/><stop offset="1" stop-color="#ffe7ab"/></linearGradient>'+
   '<linearGradient id="hfRpgGlass" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#e5ffff" stop-opacity=".38"/><stop offset=".32" stop-color="#8de0f3" stop-opacity=".10"/><stop offset=".74" stop-color="#d2ceff" stop-opacity=".22"/><stop offset="1" stop-color="#faf6ff" stop-opacity=".61"/></linearGradient>'+
   '<linearGradient id="'+brew+'" x1=".2" y1=".1" x2=".8" y2="1"><stop stop-color="'+lite+'"/><stop offset=".22" stop-color="'+hue+'"/><stop offset=".63" stop-color="'+deep+'"/><stop offset="1" stop-color="'+hue+'"/></linearGradient>'+
   '</defs>'+
   '<path d="M38 8h24l3 8-3 9H38l-3-9z" fill="url(#hfRpgGilt)" stroke="#ffeac0" stroke-width="2"/>'+
   '<path d="M39 8h22M38 15h24M38 23h24" stroke="#7c4b41" stroke-width="1.3" opacity=".85"/>'+
   '<path d="M32 25h36v7l-8 9 17 29c8 15 0 26-27 27C23 96 15 85 23 70l17-29-8-9z" fill="#11152b" stroke="url(#hfRpgGilt)" stroke-width="3"/>'+
   '<path d="M31 29h38l-8 13 14 27c9 17-7 25-25 25S16 86 25 69l14-27z" fill="url(#hfRpgGlass)" opacity=".85"/>'+
   '<path d="M29 68l15-24h13l14 24c10 17-1 23-21 23S19 85 29 68z" fill="url(#'+brew+')" stroke="'+lite+'" stroke-width="1.8"/>'+
   '<path d="M31 72q8-12 19-9 9 3 19-3" fill="none" stroke="'+lite+'" stroke-width="2" opacity=".7"/>'+
   '<path d="M33 48C23 67 16 82 27 86" stroke="white" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/>'+
   '<path d="M61 46q16 20 17 32" stroke="#fff0fb" stroke-width="2.5" fill="none" opacity=".68" stroke-linecap="round"/>'+
   '<path d="M47 48l6 10-6 9-6-9z" fill="'+lite+'" stroke="white" stroke-width="1.1"/>'+
   '<circle cx="37" cy="75" r="2.5" fill="white" opacity=".82"/><circle cx="61" cy="75" r="1.9" fill="'+lite+'"/>'+
   '<path d="M77 37v11M72 42h11M21 45v8M17 49h8" stroke="'+lite+'" stroke-width="2" stroke-linecap="round" opacity=".82"/>'+
   '<path d="M36 26h28" stroke="#fff7ce" stroke-width="2" opacity=".85"/>';
 }else if(id==='weapon'||id==='blade'){
  interior='<path d="M70 11L48 67l-13 6 6-14 22-51z" fill="#59bafb" stroke="#d3f9ff" stroke-width="3"/><path d="M51 66L26 77" stroke="#e3b86d" stroke-width="8" stroke-linecap="round"/><path d="M32 68l17 17M23 77l14 14" stroke="#ffd997" stroke-width="5"/><path d="M19 93l12-10" stroke="#eed2ab" stroke-width="5"/>';
 }else if(id==='herb'){
  interior='<path d="M50 90V28" stroke="#e4c07b" stroke-width="5"/><path d="M50 65Q7 70 18 32q32-1 32 33M51 57q46-4 30-44Q47 19 51 57M50 82q-32 4-31-19 27-9 31 19" fill="#3abb80" stroke="#b5ffd6" stroke-width="3"/>';
 }else if(id==='ore'||id==='ingot'){
  interior='<path d="M18 72l14-36 29-15 22 22-9 41-38 6z" fill="#4473c9" stroke="#acf3ff" stroke-width="4"/><path d="M32 36l26 14-22 40M58 50l25-7M58 50l16 34" fill="none" stroke="#e7fbff" stroke-width="3"/>';
 }else if(id==='wood'){
  interior='<path d="M16 45q35-23 68 0v25q-34 22-68 0z" fill="#76442a" stroke="#d5a36a" stroke-width="4"/><ellipse cx="16" cy="58" rx="12" ry="22" fill="#b8834d" stroke="#e7c188" stroke-width="3"/><ellipse cx="16" cy="58" rx="5" ry="11" fill="none" stroke="#724125" stroke-width="2"/>';
 }else if(id==='fish'){
  interior='<path d="M20 52q34-38 58 0-24 38-58 0l-13-16v32z" fill="#4bb7d0" stroke="#ddfcff" stroke-width="4"/><circle cx="65" cy="47" r="4" fill="#12375b"/>';
 }else if(id==='shield'){
  interior='<path d="M50 8l31 14-6 42-25 28-25-28-6-42z" fill="#344876" stroke="#e7c780" stroke-width="5"/><path d="M50 17v62M27 39h46" stroke="#82d8ff" stroke-width="6"/>';
 }else if(id==='ring'){
  interior='<circle cx="50" cy="56" r="25" fill="none" stroke="#f5c47d" stroke-width="12"/><path d="M50 10L70 33 50 55 30 33z" fill="#b471ff" stroke="#f7d0ff" stroke-width="4"/>';
 }else{
  interior='<path d="M50 7L83 39 67 88 28 88 15 41z" fill="#7f52cc" stroke="#d6b7ff" stroke-width="4"/><path d="M50 7v81M15 41h68" stroke="#eff0ff" stroke-width="3"/>';
 }
 return '<svg class="hf-rpg-art'+(large?' is-large':'')+'" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="hfrpgGlow"><stop stop-color="#e8e2ff" stop-opacity=".3"/><stop offset="1" stop-color="#3d176c" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="52" r="46" fill="url(#hfrpgGlow)"/>'+interior+'</svg>';
}
function tile(id,count,selected,trait=null,stackIndex=0,selectedIndex=0,variantIndices=[]){
 const def=ITEM_DEFS[id],icon='item_'+id;
 const gear=def?.kind==='Equipamiento'||def?.kind==='Accesorios';
 const selectedThis=selected===id&&(variantIndices.length?variantIndices.includes(selectedIndex):stackIndex===selectedIndex);
 return '<button type="button" class="hf-rpg-item '+(selectedThis?'is-selected':'')+'" data-hf-stack-index="'+stackIndex+'" data-hf-item="'+safe(id)+'" data-hf-rarity="'+safe(trait?.rarity??def?.rarity??'')+'" aria-label="'+safe(def?.name||id)+'">' +art(icon,false,trait?.rarity??def?.rarity??'Común')+(!gear||count>1?'<b>x'+numeric(count)+'</b>':'')+'</button>';
}
function resourceRow(key,label,pCurrent,pMax){
 return '<div class="hf-rpg-meter"><span>'+label+'</span><div class="hf-rpg-track"><i class="'+key+'" style="width:'+pct(pCurrent,pMax).toFixed(1)+'%"></i></div><b>'+numeric(pCurrent)+' / '+numeric(pMax)+'</b></div>';
}
function title(s,sub=''){return '<div class="hf-rpg-heading"><span class="hf-rpg-sigil">✧</span><div><h2>'+safe(s)+'</h2>'+(sub?'<small>'+safe(sub)+'</small>':'')+'</div><i></i></div>';}
function panel(inner,cls=''){return '<section class="hf-rpg-panel '+cls+'">'+inner+'</section>';}
function button(label,attrs='',cls=''){return '<button type="button" class="hf-rpg-button '+cls+'" '+attrs+'>'+label+'</button>';}
function blank(text){return '<div class="hf-rpg-muted">'+safe(text)+'</div>';}
function itemCount(id,prof,bag){return ITEM_DEFS[id] ? ownedMaterialCount(id,prof.inventory,bag):0;}

export function installPremiumRpgUI(game,{search=globalThis.location?.search??''}={}){
 if(typeof document==='undefined'||new URLSearchParams(search).get('hfrpg')==='0')return null;
 const root=document.createElement('div');
 root.id='hf-rpg';root.hidden=true;
 document.body.appendChild(root);
 const bag=loadRpgState();
 const local={scrollSaved:{},selectedGearIndex:0,tab:'personaje',category:'Todo',selected:'hp_potion',recipe:'hp_potion',selectedQuest:'primary',selectedSkill:'attack',selectedEquipSlot:null,confirmUnequip:null,pickEquipItem:null,pickSkill:null,selectedProfession:'Recolección',questScroll:0,mapZoom:1,system:null,toast:'',opened:false,heroTurn:0};
 root.style.setProperty('--hf-spritesheet','url("'+assetUrl('highfly-icons')+'")');
 root.style.setProperty('--hf-hero-art','url("'+assetUrl('premium/character_sanctuary')+'")');
 root.style.setProperty('--hf-map-art','url("'+assetUrl('world-petal')+'")');
 root.style.setProperty('--hf-potion-art','url("'+assetUrl('approved-potions')+'")');
 root.style.setProperty('--hf-forge-scene','url("'+assetUrl('premium/forge_workshop')+'")');
  root.style.setProperty('--hf-panel-ornament','url("'+assetUrl('premium/ui_gold_corners')+'")');
  root.style.setProperty('--hf-wave-art','url("'+assetUrl('premium/ui_silk_waves')+'")');
  root.style.setProperty('--hf-crest','url("'+assetUrl('premium/ui_phoenix_crest')+'")');
  root.style.setProperty('--hf-skill-vista','url("'+assetUrl('premium/quest_primary')+'")');
 const p=()=>game.player,prof=()=>p()?._hfProfession??{inventory:{},tools:new Set()};
 const allItems=()=>inventoryRows(bag,prof().inventory);
 const attrs=()=>attributeBreakdown(p()?._hfLevel??1,p()?._hfTrainingScore??0,bonuses());
 const bonuses=()=>equipmentBonuses(bag.equipped,bag.gearTraits);
 const syncEquipment=()=>{
  if(!p())return;
  const index=equippedMode(bag.equipped);p()._hfGearCycle=index;p()._hfEquipmentLocked=true;
  try{game.hero?.equip?.(index)}catch(err){console.warn('[HIGHFLY EQUIPO] Hero pending',err)}
 };
 const syncSkills=()=>game.input?.highflyTouch?.setSkillBindings?.(bag.skillSlots);
 const health=()=>({value:p()?.health??0,max:p()?.healthMax??100});
 const mana=()=>({value:p()?._hfMana??0,max:p()?._hfManaMax??100});
 const weapon=()=>weaponMode(equippedMode(bag.equipped));
 const message=(s)=>{local.toast=String(s);render();};
 const save=()=>saveRpgState(bag);
  // Real enemy kills now create physical loot; mobile USAR collects it.
  installP41WorldLoot(game,bag,prof,()=>{if(local.opened)render();});
 const systemLayer=()=>{
  const m=local.system;if(!m)return '';
  const busy=m.phase==='working',complete=m.phase==='result',choice=m.phase==='choose';
  const heading=complete?(m.success?'ACCIÓN COMPLETADA':'ACCIÓN NO COMPLETADA'):
   busy?'FABRICACIÓN EN CURSO':m.title;
  const description=complete?m.outcome:busy?'Canalizando la energía de la forja…':m.description;
  const details=Array.isArray(m.details)&&!complete&&!busy?
   '<div class="hf-system-details">'+m.details.map(d=>'<div><span>'+safe(d.label)+'</span><b>'+safe(d.value)+'</b></div>').join('')+'</div>':'';
  const selector=m.type==='equipment-choice'?'<div class="hf-p42-equipment-actions">'+
  button('⚒ MEJORAR +1','data-hf-system-gear="upgrade"')+
  (m.plus===9?button('✦ ASCENDER','data-hf-system-gear="ascend"'):'')+
  button('↶ DESEQUIPAR','data-hf-system-gear="unequip"')+'</div>':
  choice?'<div class="hf-system-choice-list">'+m.slots.map(d=>
   '<button type="button" data-hf-system-slot="'+safe(d.id)+'">'+safe(d.label)+'</button>').join('')+'</div>':'';
  const actions=busy?'<div class="hf-system-loading"><div class="hf-system-progress"><i></i></div><small>PROCESO PHOENIX · RECETA REAL</small></div>':
   complete?'<div class="hf-system-actions">'+button('ACEPTAR','data-hf-system="dismiss" data-hf-system-focus','is-primary')+
      (m.success&&m.type==='craft'?button('VER EN BOLSA','data-hf-system="bag"'):'')+'</div>':
   m.type==='equipment-choice'?'<div class="hf-system-actions">'+button('CERRAR','data-hf-system="cancel"','is-primary')+'</div>':
   '<div class="hf-system-actions">'+button('CANCELAR','data-hf-system="cancel"')+
     (!choice?button('SÍ, '+safe(m.verb),'data-hf-system="confirm" data-hf-system-focus','is-primary'):'')+'</div>';
  return '<div class="hf-system-shade" data-stage="'+safe(m.phase)+'"><section class="hf-system-card" role="alertdialog" aria-modal="true" aria-label="Mensaje del Sistema HIGHFLY">'+
   '<div class="hf-system-topline"><span>✦ SISTEMA PHOENIX</span><small>REGISTRO DE EXISTENCIA</small></div>'+
   '<div class="hf-system-icon">'+art(m.icon??'weapon',false)+'</div>'+
   '<h3>'+safe(heading)+'</h3><p class="hf-system-description">'+safe(description??'')+'</p>'+details+selector+actions+
   '<div class="hf-system-bottomline">EL FUTURO TODAVÍA NO HA SIDO ESCRITO</div></section></div>';
 };
 function showSystem(type,payload={}){
  const intent=describeSystemIntent(type,payload,bag,prof().inventory,p());
  if(!intent.ok){local.system={type,phase:'result',success:false,outcome:intent.reason};render();return false;}
  local.system={...intent,phase:type==='equip-choose'?'choose':'confirm'};
  render();return true;
 }
 function systemConfirm(){
  const m=local.system;
  if(!m||m.phase!=='confirm')return;
  if(m.type==='craft'){
   const updated=describeSystemIntent('craft',{recipeId:m.recipeId},bag,prof().inventory,p());
   if(!updated.ok){local.system={...m,phase:'result',success:false,outcome:updated.reason};render();return;}
   m.phase='working';render();
   // Visual progress is a short presentation; real inventory is mutated ONLY
   // at completion after revalidation, once. The user can't double confirm.
   setTimeout(()=>{
    if(!local.opened||local.system!==m||m.phase!=='working')return;
    const result=craftPotion(m.recipeId,prof(),bag);
    if(result.ok){save();p()?._hfProfessionSave?.();}
    local.system={...m,phase:'result',success:result.ok,
     outcome:result.ok?'¡Conseguiste '+result.count+' × '+ITEM_DEFS[result.id].name+'! El objeto ya está en tu Bolsa.':result.reason};
    render();
   },850);
   return;
  }
  let result={ok:false,reason:'Acción no compatible'};
  if(m.type==='p493-item-transaction'){
   const result=highflyRemoveItem(bag,prof().inventory,{id:m.id,count:1,variantIndex:m.variantIndex,
    sell:m.selling,merchant:nearHighflyMerchant(game)});
   if(result.ok){save();p()?._hfProfessionSave?.();local.selected=m.id;}
   local.system=null;message(result.ok?(m.selling?'Vendido por '+result.price+' monedas: ':'Descartado: ')+result.name:result.reason);
   return;
  }
  if(m.type==='equip'){result=equipFromBag(bag,m.slotId,m.itemId,m.variantIndex??0,prof().inventory,ITEM_DEFS);if(result.ok){save();syncEquipment();local.pickEquipItem=null;}}
  else if(m.type==='gear-upgrade'){result=enhanceGear(bag,{place:m.place,id:m.id,index:m.index},m.kind);if(result.ok)save();}
   else if(m.type==='unequip'){result=unequipToBag(bag,m.slotId,prof().inventory,ITEM_DEFS);if(result.ok){save();syncEquipment();local.confirmUnequip=null;}}
  else if(m.type==='assign-skill'){result=assignSkillSlot(bag,m.slotIndex,m.skillId,p());if(result.ok){save();syncSkills();local.pickSkill=null;}}
  else if(m.type==='expand'){result=consumeBagUpgrade(bag);if(result.ok)save();}
  let output=result.reason;
  if(result.ok){
   if(m.type==='gear-upgrade')output='¡'+(m.kind==='ascend'?'Nueva calidad '+result.trait.rarity:'Mejora +'+result.trait.plus+' completada')+'!';
    else if(m.type==='equip')output='¡'+ITEM_DEFS[m.itemId].name+' equipado correctamente!';
   else if(m.type==='unequip')output='¡Objeto devuelto a tu Bolsa!';
   else if(m.type==='assign-skill')output='¡Habilidad asignada a la ranura '+(m.slotIndex+1)+'!';
   else if(m.type==='expand')output='¡Tu Bolsa ahora tiene '+result.slots+' espacios!';
   else output='Acción completada';
  }
  local.system={...m,phase:'result',success:result.ok,outcome:output};render();
 }
 const preview=()=>{
  return panel('<div class="hf-rpg-character-title">✧ CAZADOR UNIVERSAL <small>NIVEL '+numeric(attrs().level)+'</small></div>'+
   '<div class="hf-rpg-hero-stage" aria-label="Vista 3D del personaje actual">'+
   '<div class="hf-rpg-stage-halo"></div><div class="hf-rpg-stage-arch" aria-hidden="true">'+PHOENIX+'</div><canvas class="hf-rpg-hero-canvas" data-hf-hero aria-label="Retrato 3D vivo del personaje"></canvas>'+
   '<div class="hf-rpg-stage-ring"></div><div class="hf-rpg-hero-loading" data-hf-hero-status>Cargando personaje 3D…</div>'+
   '</div>',
   'hf-rpg-hero-panel');
 };
 function character(){
  const eq=bag.equipped;
  return '<div class="hf-rpg-character-layout hf-p42-character">'+
   panel(title('Equipo','Tocá una pieza para abrir el Sistema')+
    '<div class="hf-rpg-slot-list">'+EQUIP_SLOTS.slice(0,5).map(x=>slot(x,eq,local.selectedEquipSlot===x.id,bag.gearTraits)).join('')+'</div>','hf-rpg-left-panel')+
   preview()+
   panel(title('Equipamiento','Protección y accesorios')+
    '<div class="hf-rpg-slot-list">'+EQUIP_SLOTS.slice(5).map(x=>slot(x,eq,local.selectedEquipSlot===x.id,bag.gearTraits)).join('')+'</div>','hf-rpg-right-panel')+'</div>';
 }
 function refreshPortrait(){
  if(local.tab!=='personaje'||!local.opened)return;
  const canvas=root.querySelector('[data-hf-hero]'),status=root.querySelector('[data-hf-hero-status]');
  if(!canvas||!canvas.isConnected)return;
  canvas.dataset.p43Turn=String(local.heroTurn); // inspectable orientation, no visible debug UI
  const result=paintLiveHero(game,canvas,local.heroTurn);
  if(status){status.textContent=result.ok?'':result.reason||'No se pudo mostrar el personaje';
   status.hidden=!!result.ok;status.dataset.ready=String(result.ok);}
  if(!result.ok&&!game.hero?.actor){
   const count=Number(canvas.dataset.retry||0);
   if(count<24){canvas.dataset.retry=String(count+1);setTimeout(()=>{
    if(local.opened&&local.tab==='personaje'&&canvas.isConnected)refreshPortrait();
   },500);}
  }
 }
 function attributes(){
  const a=attrs(),rows=a.rows.map(r=>'<div class="hf-rpg-stat-row"><span><b>'+r.id+'</b> <small>'+safe(r.name)+'</small></span>'+
    '<span>'+numeric(r.level+r.training)+'</span><span class="is-green">+'+numeric(r.equipment)+'</span><strong>'+numeric(r.total)+'</strong></div>').join('');
  const derived=[['HP máximo',health().max],['Maná máximo',mana().max],['Energía máxima',p()?.staminaMax],
   ['Ataque físico',p()?.power?'×'+Number(p().power).toFixed(2):'—'],['Ataque mágico',bonuses().magicalAttack??0],
   ['Defensa de equipo',bonuses().defense??0],['Crítico',p()?._hfCritical??'—'],['Esquiva',p()?._hfEvasion??'—']];
  return '<div class="hf-rpg-two hf-p42-attributes">'+panel(title('Atributos','Nivel '+a.level+' · Valores del Cazador')+
   '<div class="hf-rpg-stat-head"><span>ATRIBUTO</span><span>BASE</span><span>EQUIPO</span><span>TOTAL</span></div>'+rows,'hf-rpg-left-panel')+
   panel(title('Estadísticas derivadas','Combate y recursos')+
   '<div class="hf-rpg-stats-aside">'+derived.map(([k,v])=>'<div><span>'+safe(k)+'</span><b>'+safe(v??'—')+'</b></div>').join('')+'</div>','hf-rpg-right-panel')+'</div>';
 }
 function bagView(){
  const categories=['Todo','Consumibles','Materiales','Equipamiento','Accesorios','Otros'];
  const rows=allItems().filter(o=>local.category==='Todo'||o.kind===local.category||
    local.category==='Otros'&&o.kind==='Especial');
  const owned=rows.find(x=>x.id===local.selected&&x.variantIndices?.includes(local.selectedGearIndex))||rows.find(x=>x.id===local.selected)||rows[0]||null;
  const chosen=owned?ITEM_DEFS[owned.id]:null;
  const count=chosen?itemCount(chosen.id,prof(),bag):0;
   const variants=EQUIP_ITEM_DEFS[chosen?.id]?bag.gearTraits?.bag?.[chosen.id]??[]:[];
   const groups=chosen&&variants.length?rows.filter(x=>x.id===chosen.id&&x.variantIndices?.length):[];
   const variantIndex=owned?.variantIndices?.includes(local.selectedGearIndex)?local.selectedGearIndex:owned?.variantIndex??0;
   if(chosen){local.selected=chosen.id;local.selectedGearIndex=variantIndex;}
   const trait=variants[variantIndex]??null;
   const qualities=trait?'<div class="hf-rpg-quality" data-hf-rarity="'+safe(trait.rarity)+'"><b>'+safe(trait.rarity)+'</b><strong>+'+trait.plus+'</strong></div>'+
     (groups.length>1?'<div class="hf-rpg-variants">'+groups.map(row=>{const i=row.variantIndex,t=variants[i];return '<button type="button" class="'+(row.variantIndices.includes(variantIndex)?'is-selected':'')+'" data-hf-gear-index="'+i+'">'+safe(t?.rarity??chosen.rarity)+' +'+(t?.plus??0)+' · x'+row.count+'</button>'}).join('')+'</div>':'')+
     '<div class="hf-rpg-mini-actions">'+button('MEJORAR +1','data-hf-action="gear:upgrade:bag:'+chosen.id+':'+variantIndex+'"')+
     (trait.plus===9?button('ASCENDER','data-hf-action="gear:ascend:bag:'+chosen.id+':'+variantIndex+'"'):'')+'</div>':'';
  const categoryIcons={Todo:'◈',Consumibles:'⚗',Materiales:'❖',Equipamiento:'⚔',Accesorios:'◇',Otros:'✧'};
  const choices=chosen&&EQUIP_ITEM_DEFS[chosen.id]?
   button('✧ EQUIPAR','data-hf-action="pick-equip:'+chosen.id+'"','is-primary'):
   chosen?.kind==='Consumibles'?button('✧ USAR','data-hf-action="use:'+safe(chosen.id)+'"','is-primary'):
   chosen?.id==='bag_upgrade'?button('✧ EXPANDIR BOLSA','data-hf-action="expand"','is-primary'):
   blank('Este material se utiliza en Fabricación.');
  return '<div class="hf-rpg-three">'+panel(title('Bolsa','Categorías')+
    categories.map(cat=>menuLink('bag:'+cat,categoryIcons[cat],cat,local.category===cat)).join('')+
    '<div class="hf-rpg-space">OBJETOS DISTINTOS <strong>'+distinctInventoryItems(bag,prof().inventory)+'</strong></div>'+ 
    '<div class="hf-rpg-mini-actions">'+button('ABRIR EQUIPO','data-hf-tab="personaje"')+
    button('✧ EXPANDIR '+(bag.items.bag_upgrade??0),'data-hf-action="expand" '+((bag.items.bag_upgrade??0)>0?'':'disabled'),'is-primary')+'</div>'+
    '<small class="hf-rpg-bag-capacity">Capacidad '+bag.slots+' / 72 · Monedas '+(bag.coins??0)+' · Los sellos se fabrican en Forja.</small>','hf-rpg-left-panel')+
   panel(title('Inventario','6 columnas · rareza por marco')+
    '<div class="hf-rpg-grid" data-hf-bag-capacity="'+bag.slots+'">'+bagSlots(rows,bag.slots).map((o,i)=>o?tile(o.id,o.count,chosen?.id,gearTraitAt(bag,'bag',o.id,o.variantIndex),o.variantIndex,local.selectedGearIndex,o.variantIndices):
     '<div class="hf-rpg-empty-slot" aria-label="Espacio de bolsa vacío '+(i+1)+'"><span>✧</span></div>').join('')+'</div>'+
    '<div class="hf-rpg-inventory-counter">'+occupiedInventorySlots(bag,prof().inventory)+' / '+bag.slots+' ESPACIOS OCUPADOS</div>')+
   panel(title('Detalle del objeto',chosen?.rarity??'Sin selección')+
    (chosen?'<div class="hf-rpg-detail-art" data-hf-rarity="'+safe(trait?.rarity??chosen.rarity)+'">'+art('item_'+chosen.id,true,trait?.rarity??chosen.rarity)+'</div><h3>'+safe(chosen.name)+'</h3>'+
      '<div class="hf-rpg-tag">'+safe(chosen.kind)+' · Tenés '+numeric(count)+'</div>'+qualities+
      '<p class="hf-rpg-info">'+safe(chosen.description)+'</p>'+
      (chosen.stats?'<p class="hf-rpg-info">Atributos: '+safe(Object.entries(chosen.stats).map(([k,v])=>k+' +'+v).join(' · '))+'</p>':'')+
      choices+'<div class="hf-p493-bag-actions">'+
        button('DESCARTAR','data-hf-action="discard:'+safe(chosen.id)+'"')+
        button('VENDER','data-hf-action="sell:'+safe(chosen.id)+'" '+(nearHighflyMerchant(game)?'':'disabled'))+
        '<small>Venta: '+itemSalePrice(chosen,trait?.rarity??chosen.rarity)+' monedas · solo con Odo (lutier). Descartar requiere confirmación.</small></div>':
       blank('No hay objetos en esta categoría.')),'hf-rpg-right-panel')+'</div>';
 }
 function skills(){
  const list=liveSkillRows(p()),chosen=list.find(s=>s.id===local.selectedSkill)||list[0];
  const equippedIndex=bag.skillSlots.indexOf(chosen?.id);
  const choose=local.pickSkill===chosen?.id;
  const skillSlots=bag.skillSlots.map((id,i)=>{
   const row=list.find(x=>x.id===id);
   return '<button class="hf-rpg-skill-equip-slot '+(id?'is-equipped':'is-empty')+'" type="button" data-hf-skill-slot="'+i+'" aria-label="Ranura de habilidad '+(i+1)+'">'+
    '<span class="hf-rpg-skill-number">'+(i+1)+'</span>'+(id?skillIcon(id):'<span class="hf-rpg-equip-placeholder">+</span>')+
    '<small>'+safe(row?.label??'Libre')+'</small></button>';
  }).join('');
  return '<div class="hf-rpg-two">'+panel(title('Habilidades','Catálogo · '+list.filter(s=>s.available).length+' disponibles')+
   '<div class="hf-rpg-skill-list">'+list.map(s=>
    '<button type="button" data-hf-skill="'+safe(s.id)+'" class="hf-rpg-skill '+(!s.available?'is-locked ':'')+(chosen?.id===s.id?'is-selected':'')+'">'+
    '<span class="hf-rpg-skill-glyph">'+skillIcon(s.id)+'</span>'+
    '<div><b>'+safe(s.label)+'</b><small>'+safe(s.kind)+' · '+safe(s.cost)+'</small></div>'+
    '<em>'+(s.available?'DISPONIBLE':'BLOQUEADA')+'</em></button>').join('')+'</div>')+
   panel(title(chosen?.label??'Habilidad',chosen?.available?'DISPONIBLE':'BLOQUEADA')+
    '<div class="hf-rpg-skill-feature"><span>'+skillIcon(chosen?.id,true)+'</span>'+
    '<p>'+safe(chosen?.desc??'')+'</p></div>'+
    '<div class="hf-rpg-tag">'+safe(chosen?.kind??'')+' · '+safe(chosen?.cost??'')+'</div>'+
    '<div class="hf-rpg-subtitle">ASIGNACIÓN DE HABILIDAD</div>'+
    '<p class="hf-rpg-info hf-p45-skill-guide">Elegí una ranura (1–6) para equipar. Las habilidades bloqueadas no se pueden usar.</p>'+
    '<div class="hf-rpg-skill-slots">'+skillSlots+'</div>'+
    '<div class="hf-rpg-mini-actions">'+(equippedIndex>=0?
     button('DESEQUIPAR DE RANURA '+(equippedIndex+1),'data-hf-action="clear-skill:'+equippedIndex+'"'):
     button(choose?'TOCÁ UNA RANURA ↑':'EQUIPAR','data-hf-action="choose-skill" '+(chosen?.available?'':'disabled'),'is-primary'))+
    '</div>','hf-rpg-right-panel hf-p45-skill-detail')+'</div>';
 }
 function professions(){
  const jobs=[
   {id:'Recolección',desc:'Plantas, raíces y semillas',resource:'herb',ready:true},
   {id:'Minería',desc:'Minerales y vetas',resource:'ore',ready:true},
   {id:'Tala',desc:'Maderas y troncos',resource:'wood',ready:true},
   {id:'Pesca',desc:'Capturas en el agua',resource:'fish',ready:true},
   {id:'Cocina',desc:'Alimentos y recetas',resource:'fish',ready:false},
   {id:'Alquimia',desc:'Pociones y elixires',resource:'herb',ready:true},
   {id:'Fundición',desc:'Metalurgia y lingotes',resource:'ingot',ready:true},
   {id:'Forja',desc:'Armas y equipamiento',resource:'blade_blank',ready:true},
   {id:'Marroquinería',desc:'Bolsas y trabajos en cuero',resource:'leather',ready:false,mark:'◈'},
   {id:'Sastrería',desc:'Prendas y confección',resource:'leather',ready:false,mark:'✂'},
   {id:'Joyería',desc:'Anillos y collares',resource:'ingot_gold',ready:false,mark:'◇'},
   {id:'Ingeniería',desc:'Mecanismos y herramientas',resource:'ingot_steel',ready:false,mark:'⚙'},
   {id:'Encantamiento',desc:'Magia en equipamiento',resource:'ore_mithril',ready:false,mark:'✧'},
   {id:'Inscripción',desc:'Runas y escrituras',resource:'wood',ready:false,mark:'✎'},
   {id:'Desuello',desc:'Pieles y materiales de criaturas',resource:'leather',ready:false,mark:'✥'}
  ];
  const profession=prof(),selected=jobs.find(j=>j.id===local.selectedProfession)??jobs[0];
  const owned=ownedMaterialCount(selected.resource,profession.inventory,bag);
  const picture=(job,large=false)=>art(professionIcon(job.id),large);
  return '<div class="hf-rpg-two hf-p42-professions">'+panel(title('Oficios','15 disciplinas · iconos exclusivos')+
   '<div class="hf-rpg-prof-grid">'+jobs.map(job=>
    '<button type="button" class="hf-rpg-prof-card '+(job.id===selected.id?'is-selected':'')+'" data-hf-prof="'+safe(job.id)+'">'+
    '<span class="hf-rpg-prof-icon hf-p42-prof-frame">'+picture(job)+'</span><div><b>'+job.id+'</b>'+
    '<small>'+safe(job.desc)+'</small><span class="hf-rpg-prof-chip">'+(job.ready?'DISPONIBLE':'PRÓXIMAMENTE')+'</span></div>'+
    '<span class="hf-rpg-prof-chevron">›</span></button>').join('')+'</div>','hf-rpg-left-panel')+
   panel(title(selected.id,'Ficha de oficio HIGHFLY')+
    '<div class="hf-rpg-prof-feature"><span class="hf-rpg-prof-feature-art hf-p42-prof-frame">'+picture(selected,true)+'</span>'+
    '<div><b>'+safe(selected.id)+'</b><small>'+safe(selected.desc)+'</small></div></div>'+
    '<div class="hf-rpg-stat-panel"><b>Estado</b><strong>'+(selected.ready?'DISPONIBLE':'PRÓXIMAMENTE')+'</strong></div>'+
    '<div class="hf-rpg-stat-panel"><b>Materiales asociados</b><strong>'+numeric(owned)+'</strong></div>'+
    '<div class="hf-rpg-stat-panel"><b>Acciones completadas</b><strong>'+numeric(profession.completed??0)+'</strong></div>'+
    '<div class="hf-rpg-stat-panel"><b>Herramientas</b><strong>'+numeric(profession.tools?.size??0)+'</strong></div>'+ '<p class="hf-p47-prof-note">'+[['axe','Hacha'],['pickaxe','Pico'],['rod','Caña'],['hoe','Azada'],['watering_can','Regadera'],['sickle','Hoz'],['knife','Cuchillo'],['hammer','Martillo'],['saw','Serrucho']].map(([k,n])=>(profession.tools?.has(k)?'✓ ':'✗ ')+n+' básico +0').join(' · ')+'</p>'+
    '<p class="hf-p47-prof-note">'+(selected.ready?
      'Profesión habilitada. Consultá sus recetas y recursos en Fabricación.':
      'Oficio en preparación: aún no dispone de recetas ni acciones propias. Su icono ya está integrado.')+'</p>'+
    '<div class="hf-rpg-mini-actions">'+(selected.ready?
     button('VER RECETAS','data-hf-tab="forja"','is-primary'):
     '<span class="hf-p47-prof-pending">RECETAS PENDIENTES</span>')+'</div>','hf-rpg-right-panel')+'</div>';
 }
 function nativeBenchControls(){
  if(!local.nativeBench)return '';
  const cost=game.benchCost??100,pv=game.player?.up??{},xp=Math.max(0,game.xp??0);
  return '<div class="hf-p492-native-bench"><b>MEJORAS DEL LUTIER · HISTORIA ORIGINAL</b>'+
   '<small>Resonancia del Valle '+xp+' · Próxima mejora '+cost+'. Independiente de la EXP HIGHFLY.</small>'+
   '<div>'+[['blade','ESPADA'],['health','VIDA'],['stamina','ENERGÍA']].map(([id,name])=>
    '<button type="button" data-hf-native-upgrade="'+id+'" '+(xp<cost||pv[id]>=8?'disabled':'')+'>'+name+' '+(pv[id]??0)+'/8</button>').join('')+'</div></div>';
 }
 function forge(){
  const recipe=RECIPES[local.recipe]||RECIPES.hp_potion,ok=canCraft(local.recipe,prof().inventory,bag);
  const recipes=Object.entries(RECIPES).filter(([recipeId])=>!['ingot_copper','ingot_iron','ingot_silver','ingot_gold'].includes(recipeId)).map(([recipeId,r])=>
   '<button type="button" data-hf-recipe="'+recipeId+'" data-hf-forge-item="'+r.item+'" class="hf-rpg-recipe '+(recipeId===local.recipe?'is-selected':'')+'">'+
   art('item_'+r.item)+'<b>'+safe(r.name)+'</b></button>').join('');
  const ingredients=Object.entries(recipe.ingredients).map(([id,n])=>
   '<div class="hf-rpg-ingredient">'+art('item_'+id)+
   '<b>'+safe(ITEM_DEFS[id].name)+'</b><span class="'+(ownedMaterialCount(id,prof().inventory,bag)<n?'is-red':'is-green')+'">'+
   numeric(ownedMaterialCount(id,prof().inventory,bag))+' / '+n+'</span></div>').join('');
  return '<div class="hf-rpg-forge-layout">'+
   panel(title('Fabricación','Elegí la receta que querés crear')+
    '<div class="hf-rpg-forge-recipes">'+recipes+'</div>'+
    '<div class="hf-rpg-forge-tip">La fabricación utiliza recursos reales. El inventario completo está en Bolsa.</div>',
    'hf-rpg-forge-list')+
   panel('<div class="hf-rpg-forge-workshop" data-hf-forge-working="'+(local.system?.type==='craft'&&local.system?.phase==='working'?'true':'false')+'">'+
    title(recipe.name,recipe.profession+' · Estación de creación')+
    '<div class="hf-p47-forge-channel" aria-hidden="true"><i></i></div>'+
    '<div class="hf-rpg-forge-preview"><div class="hf-rpg-forge-result-art">'+art('item_'+recipe.item,true)+'</div>'+
    '<div><h3>'+safe(recipe.name)+'</h3><p>'+safe(ITEM_DEFS[recipe.item].description)+'</p><small>Resultado · x'+recipe.count+'</small></div></div>'+
    '<div class="hf-rpg-forge-materials"><div class="hf-rpg-subtitle">RECETA · MATERIALES NECESARIOS</div>'+
    '<div class="hf-rpg-ingredients">'+ingredients+'</div></div>'+
    '<div class="hf-rpg-forge-actions">'+button(ok.ok?'⚒ INICIAR FABRICACIÓN':'FALTAN MATERIALES',
    'data-hf-action="craft:'+local.recipe+'" '+(ok.ok?'':'disabled'),'is-primary')+
    button('ABRIR BOLSA','data-hf-tab="bolsa"')+'</div>'+nativeBenchControls()+
   '</div>','hf-rpg-forge-main')+'</div>';
 }
 function questDetails(){
  const l=(globalThis.__hfLivingWorld?.summary()??[]).find(q=>'living:'+q.id===local.selectedQuest);if(l)return '<div class="hf-rpg-quest-detail">'+title(l.title,'ARVELIA · '+safe(l.name))+'<p class="hf-rpg-info">'+safe(l.text)+'</p><div class="hf-rpg-quest-detail-foot"><b>'+l.progress+' / '+l.count+'</b><span>'+l.reward+' monedas · hablá con '+safe(l.name)+' para aceptar o entregar.</span></div></div>';
  // P4.9 standalone hunt missions coexist with Unsung quests. They share
  // the journal, not the original quest engine's internal state machine.
  const huntKey=HUNT_ORDER.find(id=>HUNT_MISSIONS[id].id===local.selectedQuest);
  const hunt=game.__highflyHunts;
  if(huntKey&&hunt){
   const q=HUNT_MISSIONS[huntKey],m=hunt.progress(huntKey);
   const text=m.status==='available'?'Buscá a '+q.npc+' para aceptar esta misión.':
    m.status==='ready'?'¡Completada! Regresá con '+q.npc+' para recibir la recompensa.':
    m.status==='done'?'Encargo completado. '+q.thanks:q.progress;
   return '<div class="hf-rpg-quest-detail">'+title(q.title,'HIGHFLY · LA LLAMA SIN NOMBRE')+
    '<p class="hf-rpg-info">'+safe(text)+'</p>'+
    '<div class="hf-rpg-quest-art"><img alt="Encargo de '+safe(q.npc)+'" src="'+questArtUrl(q.id,q.title)+'" loading="eager" draggable="false"/></div>'+
    '<div class="hf-rpg-quest-detail-foot"><b>OBJETIVO · '+m.count+' / '+q.count+
    '</b><span>Al entregar: '+q.bonusXp+' EXP y una poción. Tu botín de monstruos se recoge con USAR.</span></div></div>';
  }
  const rows=game.quests?.active??[],objective=translateHighfly(game.objective||'Explorá el mundo');
  const selected=rows.find(q=>q.id===local.selectedQuest)??null;
  const name=selected?translateHighfly(selected.title):objective;
  const goal=selected?translateHighfly(selected.verb):objective;
  const state=selected?game.quests?.state?.[selected.id]:null;
  const progress=selected?game.quests?.progress?.(selected):null;
  const progressText=state?.s==='ready'?'LISTA PARA ENTREGAR':progress?.length>=2?progress[0]+' / '+progress[1]:'OBJETIVO PRINCIPAL';
  return '<div class="hf-rpg-quest-detail">'+title(name,'REGISTRO DE AETHERIA')+
   '<p class="hf-rpg-info">'+safe(goal)+'</p>'+
   '<div class="hf-rpg-quest-art"><img alt="Escena de misión: '+safe(name)+'" src="'+questArtUrl(selected?.id,name)+'" loading="eager" draggable="false"/></div>'+
   '<div class="hf-rpg-quest-detail-foot"><b>OBJETIVO · '+safe(progressText)+'</b><span>Las recompensas se obtienen al completar la misión del juego.</span></div>'+
   '</div>';
 }
 function quests(){
  const livingRows=(globalThis.__hfLivingWorld?.summary()??[]).map(q=>'<button type="button" data-hf-quest="living:'+safe(q.id)+'" class="hf-rpg-quest-row"><b>✦ ARVELIA · '+safe(q.title)+'</b><small>'+safe(q.name)+'</small><span>'+safe(q.status==='available'?'DISPONIBLE':q.status==='done'?'COMPLETADA':q.progress+' / '+q.count)+'</span></button>').join('');
  const rows=game.quests?.active??[],objective=translateHighfly(game.objective||'Explorá el mundo');
  const hunt=game.__highflyHunts,hs=hunt?.state;
  const huntRows=hs?HUNT_ORDER.map(id=>{
   const q=HUNT_MISSIONS[id],m=hs.missions[id],selected=local.selectedQuest===q.id;
   const status=m.status==='available'?'HABLÁ CON '+q.npc:
    m.status==='ready'?'ENTREGAR A '+q.npc:m.status==='done'?'COMPLETADA':m.count+' / '+q.count;
   return '<button type="button" data-hf-quest="'+q.id+'" class="hf-rpg-quest-row '+(selected?'is-selected':'')+
    '"><b>✦ CAZA · '+safe(q.title)+'</b><small>'+safe(q.npc+' · '+q.role)+
    '</small><span>'+safe(status)+'</span></button>';
  }).join(''):'';
  const huntLevel=hs?'<div class="hf-rpg-subtitle">HIGHFLY · NIVEL '+hs.level+' · EXP '+hs.xp+' / '+xpRequired(hs.level)+'</div>':'';
  return '<div class="hf-rpg-quest-layout">'+panel(title('Misiones','Principal · Secundarias · Profesiones')+
   '<div class="hf-rpg-subtitle">SEGUIMIENTO · '+rows.length+' ACTIVAS</div>'+
   '<div class="hf-rpg-quest-list">'+
   '<button type="button" data-hf-quest="primary" class="hf-rpg-quest-row '+(local.selectedQuest==='primary'?'is-selected':'')+'"><b>✦ HISTORIA · '+safe(objective)+'</b><small>Objetivo principal del Valle</small></button>'+
   rows.map(q=>{const st=game.quests?.state?.[q.id],v=game.quests?.progress?.(q);return '<button type="button" data-hf-quest="'+safe(q.id)+'" class="hf-rpg-quest-row '+(local.selectedQuest===q.id?'is-selected':'')+'"><b>'+safe(translateHighfly(q.title))+'</b><small>'+safe(translateHighfly(q.verb))+'</small><span>'+safe(st?.s==='ready'?'ENTREGAR':v?.length>=2?v[0]+' / '+v[1]:'ACTIVA')+'</span></button>';}).join('') +huntLevel+huntRows+livingRows+
   '</div>','hf-rpg-quest-left')+
   panel(questDetails(),'hf-rpg-quest-right')+'</div>';
 }
 function map(){
  const native=originalMapSnapshot(game);
  const locations=currentMapLandmarks(game);
  const visual=native?'<img class="hf-rpg-map-native" alt="Mapa nativo real con terreno, posición y objetivos" src="'+native+'"/>':
   '<div class="hf-rpg-map-art" role="img" aria-label="Ilustración de la región de Aetheria"></div>';
  return '<div class="hf-rpg-map-layout">'+panel(title('Mapa del Mundo',native?'Terreno y marcadores reales':'Atlas de Aetheria · Vista ilustrativa')+
   '<div class="hf-rpg-map-display"><div class="hf-rpg-map-zoom" style="transform:scale('+local.mapZoom.toFixed(2)+')">'+visual+'</div><div class="hf-rpg-map-controls">'+button('+','data-hf-action="zoom:in" aria-label="Ampliar mapa"')+button('−','data-hf-action="zoom:out" aria-label="Alejar mapa"')+button('⌖','data-hf-action="zoom:reset" aria-label="Restablecer mapa"')+'</div></div>'+
   '<small class="hf-rpg-map-caveat">'+(native?'Mapa original del juego · Tu posición y objetivos están marcados.':'Vista ilustrativa. Conseguí el mapa en la misión del Cartógrafo para acceder a los datos del mundo.')+'</small>','hf-rpg-map-main')+
   panel(title('Leyenda','Ubicaciones descubiertas')+
    '<div class="hf-rpg-legend"><div>◈ Tu posición</div><div>✧ Objetivo principal</div><div>✦ Misiones activas</div><div>◇ Lugares descubiertos</div></div>'+
    (locations.length?'<div class="hf-rpg-subtitle">AGUJAS DEL VALLE</div>'+locations.map(l=>'<div class="hf-rpg-material-row"><span>'+safe(translateHighfly(l.name))+'</span><b>'+(l.unlocked?'DESPIERTA':'CERRADA')+'</b></div>').join(''):blank('Explorá el Valle y descubrí sus lugares.')),'hf-rpg-map-aside')+'</div>';
 }
 function options(){
  const settings=globalThis.__hfNativeSettings;
  const sensitivity=Math.max(.3,Math.min(2.5,Number(settings?.get('sensitivity')??game.input?.sensitivity??1)));
  const invert=!!(settings?.get('invertY')??game.input?.invertY);
  return panel(title('Opciones','Gráficos y controles del cazador')+
    '<div class="hf-rpg-options"><div><b>Calidad gráfica</b><small>Los ajustes usan el sistema real HIGHFLY.</small></div>'+
    '<div class="hf-rpg-mini-actions">'+button('FLUIDO','data-hf-graphics="performance"')+button('BALANCE','data-hf-graphics="balanced"')+button('NÍTIDO','data-hf-graphics="quality"')+'</div></div>'+
    '<div class="hf-rpg-rule"></div><div class="hf-p492-camera-options"><b>CÁMARA TÁCTIL</b>'+
    '<label for="hf-p492-sens">Sensibilidad · <output data-hf-sens-value>'+Math.round(sensitivity*100)+'%</output></label>'+
    '<input id="hf-p492-sens" type="range" min="0.3" max="2.5" step="0.05" value="'+sensitivity.toFixed(2)+'" data-hf-camera-sensitivity aria-label="Sensibilidad de cámara"/>'+
    '<button type="button" data-hf-camera-invert aria-pressed="'+invert+'">Invertir cámara vertical: '+(invert?'SÍ':'NO')+'</button>'+
    '<small>Guardado automático. Afecta la cámara real de Unsung y el tacto de HIGHFLY.</small></div>'+
    '<div class="hf-rpg-rule"></div><div class="hf-rpg-options hf-climate-settings"><div><b>🌌 MUNDO Y CLIMA</b><small>Fenómenos del cielo, luna, ciclo de 45 minutos y herramientas de prueba. No se muestran en el HUD.</small></div>'+ 
    '<div data-hf-climate-controls aria-label="Ajustes del mundo y clima"></div></div>'+ 
    '<div class="hf-rpg-rule"></div><div class="hf-rpg-options"><div><b>🌍 WORLD FORGE · EDITOR</b><small>Editá edificios, caminos, faroles y NPC sin cargar el combate. Los cambios se guardan por dispositivo y pueden exportarse a JSON.</small></div>'+
    '<a class="hf-world-forge-link" href="'+import.meta.env.BASE_URL+'highfly/world-forge.html">ABRIR EDITOR</a></div>'+
    '<div class="hf-rpg-rule"></div>'+button('✧ EDITAR HUD 3.1','data-hf-action="edit-hud"','is-primary')+
    '<div class="hf-rpg-mini-actions">'+button('VOLVER AL JUEGO','data-hf-action="close"','is-primary')+'</div>');
 }
 const bodies={personaje:character,atributos:attributes,bolsa:bagView,habilidades:skills,oficios:professions,forja:forge,misiones:quests,mapa:map,opciones:options};
 function render(){
  if(!local.opened)return;
  if(local.tab==='misiones')local.questScroll=root.querySelector('.hf-rpg-quest-list')?.scrollTop??local.questScroll;
  const body=bodies[local.tab]||character;
  root.innerHTML='<div class="hf-rpg-fade"></div><div class="hf-rpg-shell" role="dialog" aria-label="Menú del sistema HIGHFLY">'+
   '<header class="hf-rpg-top"><div class="hf-rpg-logo hf-rpg-brand" aria-label="HIGHFLY RPG FITNESS"><img class="hf-rpg-approved-logo hf-rpg-brand-mark" src="'+officialLogoUrl()+'" alt="HIGHFLY RPG FITNESS" draggable="false"/><span class="hf-rpg-brand-text"><strong>HIGHFLY</strong><small>RPG FITNESS</small></span></div>'+
   '<nav class="hf-rpg-nav" aria-label="Pestañas del RPG">'+NAV.map(([id,icon,name])=>'<button data-hf-tab="'+id+'" type="button" class="'+(id===local.tab?'is-active':'')+'"><img class="hf-rpg-nav-icon hf-user-nav-icon" alt="" aria-hidden="true" src="'+assetUrl('user-icons/navigation/'+id)+'"/><span>'+name+'</span></button>').join('')+'</nav>'+
   '<button class="hf-rpg-close" type="button" data-hf-action="close" aria-label="Cerrar menú">×</button></header>'+
   '<div class="hf-rpg-content'+(local.tab==='opciones'?' hf-rpg-options-scroll':'')+'">'+body()+'</div>'+ (local.toast?'<div class="hf-p41-toast" role="status" aria-live="polite">'+safe(local.toast)+'</div>':'')+
   '<footer class="hf-rpg-footer" aria-hidden="true"></footer></div>'+systemLayer();
  // P515: existing CLIMA controls are real, not a duplicated settings mock.
  if(local.tab==='opciones')globalThis.__hfP508Climate?.mountControls?.(root.querySelector('[data-hf-climate-controls]'));
  // Restore scroll state across selection/render updates. No inaccessible
  // information at the end of bag/forge/skills panels.
  const scrollTargets={
    bolsa:['.hf-rpg-grid','.hf-rpg-three>.hf-rpg-panel:first-child','.hf-rpg-three>.hf-rpg-panel:last-child'],
    habilidades:['.hf-rpg-skill-list','.hf-rpg-two>.hf-rpg-panel:last-child'],
    oficios:['.hf-rpg-prof-grid','.hf-p42-professions>.hf-rpg-panel:first-child','.hf-p42-professions>.hf-rpg-panel:last-child'],
    forja:['.hf-rpg-forge-recipes','.hf-rpg-forge-main'],
    misiones:['.hf-rpg-quest-list','.hf-rpg-quest-right'],
    opciones:['.hf-rpg-content.hf-rpg-options-scroll','.hf-rpg-options-scroll>.hf-rpg-panel']
  };
  for(const selector of scrollTargets[local.tab]??[]){
   const el=root.querySelector(selector);
   if(el)el.scrollTop=local.scrollSaved[local.tab+selector]??0;
  }
  if(local.system)requestAnimationFrame(()=>root.querySelector('[data-hf-system-focus]')?.focus({preventScroll:true}));
  if(local.tab==='personaje')requestAnimationFrame(()=>refreshPortrait());
  if(local.tab==='misiones'){const list=root.querySelector('.hf-rpg-quest-list');if(list)list.scrollTop=local.questScroll;}
 }
 function open(tab='personaje',fromNative=false){
  if(local.opened){local.tab=tab;render();return true;}
  if(fromNative){
   if(game.state!=='menu')return false;
   game.menu='hero'; // Native state retained for close(); quest and bench progress are unchanged.
  }else{
   if(game.state!=='playing'||game.people?.talk||game.cine)return false;
   game.openMenu('hero');
   if(game.state!=='menu')return false;
  }
  local.opened=true;local.tab=bodies[tab]?tab:'personaje';root.hidden=false;
  if((fromNative||tab==='misiones'||tab==='mapa')&&bodies[tab])local.tab=tab;
  syncEquipment();syncSkills();
  document.body.classList.add('hf-rpg-is-open');
  render();return true;
 }
 function close(){
  if(!local.opened||local.system?.phase==='working')return;
  if(local.system){local.system=null;render();return;}
  local.opened=false;local.tab='personaje';root.hidden=true;local.nativeBench=false;root.innerHTML='';document.body.classList.remove('hf-rpg-is-open');
  local.toast='';
  if(game.state==='menu'&&game.menu==='hero')game.closeMenu();
 }
 const api={open,openFromNative:tab=>open(tab,true),close,toggle:()=>local.opened?close():open(),render,livingAward(amount){bag.coins=(bag.coins??0)+Math.max(0,Math.floor(amount));save();return true},livingTrade(id,price,buy){const inv=prof().inventory;if(!['seed','wood','ore_copper','ore_iron','ore_silver'].includes(id)||!Number.isFinite(price)||price<1)return false;if(buy){if((bag.coins??0)<price)return false;bag.coins-=price;inv[id]=(inv[id]??0)+1}else{if((inv[id]??0)<1)return false;inv[id]--;bag.coins=(bag.coins??0)+price}save();p()?._hfProfessionSave?.();return true},
  get opened(){return local.opened},get state(){return bag}};
 // Reuse Unsung's native map/journal/bench command, but present the HIGHFLY
 // menu instead of a second, conflicting legacy UI. Quest rules are untouched.
 game.on?.((type,d)=>{
  if(type!=='state'||d?.state!=='menu'||d.menu==='hero'||local.opened)return;
  local.nativeBench=d.menu==='bench';
  const tab=d.menu==='bench'?'forja':d.menu==='map'?'mapa':
   d.menu==='journal'?'misiones':'personaje';
  api.openFromNative(tab);
 });
 // P4.3: real 3D portrait yaw through Android touch / mouse drag.
 // Only repaint the existing original actor in its shared WebGL renderer.
 let portraitDrag=null,portraitRaf=0;
 root.addEventListener('pointerdown',e=>{
  const stage=e.target?.closest?.('.hf-rpg-hero-stage');
  if(!stage||!local.opened||local.tab!=='personaje')return;
  portraitDrag={id:e.pointerId,x:e.clientX};
  stage.setPointerCapture?.(e.pointerId);
  e.preventDefault();
 });
 root.addEventListener('pointermove',e=>{
  if(!portraitDrag||e.pointerId!==portraitDrag.id)return;
  const step=e.clientX-portraitDrag.x;
  portraitDrag.x=e.clientX;
  if(!Number.isFinite(step))return;
  local.heroTurn-=step*.014;
  if(!portraitRaf){
   portraitRaf=requestAnimationFrame(()=>{
    portraitRaf=0;
    if(local.opened&&local.tab==='personaje')refreshPortrait();
   });
  }
  e.preventDefault();
 });
 const endPortraitDrag=e=>{
  if(portraitDrag?.id!==e.pointerId)return;
  portraitDrag=null;
 };
 root.addEventListener('pointerup',endPortraitDrag);
 root.addEventListener('pointercancel',endPortraitDrag);

 root.addEventListener('scroll',e=>{
  const selectors={
   bolsa:['.hf-rpg-grid','.hf-rpg-three>.hf-rpg-panel:first-child','.hf-rpg-three>.hf-rpg-panel:last-child'],
   habilidades:['.hf-rpg-skill-list','.hf-rpg-two>.hf-rpg-panel:last-child'],
   oficios:['.hf-rpg-prof-grid','.hf-p42-professions>.hf-rpg-panel:first-child','.hf-p42-professions>.hf-rpg-panel:last-child'],
   forja:['.hf-rpg-forge-recipes','.hf-rpg-forge-main'],
   misiones:['.hf-rpg-quest-list','.hf-rpg-quest-right']
  };
  for(const selector of selectors[local.tab]??[]){
   if(e.target?.matches?.(selector))local.scrollSaved[local.tab+selector]=e.target.scrollTop;
  }
 },true);

 root.addEventListener('input',e=>{
  const slider=e.target?.closest?.('[data-hf-camera-sensitivity]');
  if(!slider)return;
  const n=Math.max(.3,Math.min(2.5,Number(slider.value)||1));
  root.querySelector('[data-hf-sens-value]')?.replaceChildren(document.createTextNode(Math.round(n*100)+'%'));
  if(globalThis.__hfNativeSettings){globalThis.__hfNativeSettings.set('sensitivity',n);globalThis.__hfApplySettings?.();}
  else if(game.input)game.input.sensitivity=n;
 });
 root.addEventListener('click',e=>{
  const b=e.target?.closest?.('button');if(!b)return;
  if(local.system){
   const sys=b.dataset.hfSystem;
   if(b.dataset.hfSystemGear){
    const chosen=b.dataset.hfSystemGear,slotId=local.system.slotId;
    if(chosen==='unequip')showSystem('unequip',{slotId});
    else showSystem('gear-upgrade',{kind:chosen==='ascend'?'ascend':'upgrade',place:'equipped',id:slotId,index:0});
    return;
   }
   if(b.dataset.hfSystemSlot){
    showSystem('equip',{itemId:local.system.itemId,slotId:b.dataset.hfSystemSlot,variantIndex:local.system.variantIndex??0});return;
   }
   if(sys==='cancel'||sys==='dismiss'){local.system=null;render();return;}
   if(sys==='bag'){local.system=null;local.tab='bolsa';local.category='Todo';render();return;}
   if(sys==='confirm'){systemConfirm();return;}
   // Ignore EVERY click on underlying menus while the System message is visible.
   return;
  }
  const tab=b.dataset.hfTab;
  if(tab){if(tab.startsWith('bag:')){local.tab='bolsa';local.category=tab.slice(4);}
   else{local.tab=tab;local.category='Todo';}local.toast='';render();return;}
  if(b.dataset.hfEquipSlot){
   const chosen=b.dataset.hfEquipSlot;
   local.selectedEquipSlot=chosen;
   const itemId=bag.equipped[chosen],trait=gearTraitAt(bag,'equipped',chosen);
   if(itemId){
    local.system={type:'equipment-choice',phase:'choose',slotId:chosen,icon:'item_'+itemId,
     title:'EQUIPO · '+ITEM_DEFS[itemId].name,
     description:'Elegí qué acción querés realizar con esta pieza.',
     plus:trait?.plus??0,
     details:[{label:'Calidad',value:trait?.rarity??'Común'},
      {label:'Mejora',value:'+'+(trait?.plus??0)},
      {label:'Atributos',value:Object.entries(ITEM_DEFS[itemId].stats??{}).map(([k,v])=>k+' +'+v).join(' · ')||'—'}]};
    render();return;
   }
   message('Ranura vacía. Elegí un objeto de la Bolsa para equiparlo.');return;
  }
  if(b.dataset.hfSkillSlot!==undefined){
   const index=Number(b.dataset.hfSkillSlot);
   if(local.pickSkill){
    showSystem('assign-skill',{slotIndex:index,skillId:local.pickSkill});
   }else{
    const id=bag.skillSlots[index];if(id){local.selectedSkill=id;render();}
    else message('Ranura libre: elegí una habilidad y tocá EQUIPAR');
   }return;
  }
  if(b.dataset.hfItem){local.selected=b.dataset.hfItem;local.selectedGearIndex=Math.max(0,Number(b.dataset.hfStackIndex)||0);local.pickEquipItem=null;render();return;}
   if(b.dataset.hfGearIndex!==undefined){local.selectedGearIndex=Number(b.dataset.hfGearIndex);render();return;}
  if(b.dataset.hfQuest){
   // P4.6: Do NOT rebuild the scrollable mission list when selecting a row.
   // Update only selected appearance and the right hand story detail.
   local.selectedQuest=b.dataset.hfQuest;
   const list=b.closest('.hf-rpg-quest-list'),scroll=list?.scrollTop??local.questScroll;
   local.questScroll=scroll;local.scrollSaved['misiones.hf-rpg-quest-list']=scroll;
   if(list){
    for(const row of list.querySelectorAll('[data-hf-quest]'))
     row.classList.toggle('is-selected',row.dataset.hfQuest===local.selectedQuest);
   }
   const detail=root.querySelector('.hf-rpg-quest-right');
   if(detail)detail.innerHTML=questDetails();
   else render();
   return;
  }
  if(b.dataset.hfSkill){local.selectedSkill=b.dataset.hfSkill;render();return;}
  if(b.dataset.hfProf){local.selectedProfession=b.dataset.hfProf;render();return;}
  if(b.dataset.hfRecipe){local.recipe=b.dataset.hfRecipe;render();return;}
  if(b.hasAttribute('data-hf-camera-invert')){
   const settings=globalThis.__hfNativeSettings;
   const next=!(settings?.get('invertY')??game.input?.invertY);
   if(settings){settings.set('invertY',next);globalThis.__hfApplySettings?.();}
   else if(game.input)game.input.invertY=next;
   render();return;
  }
  if(b.dataset.hfNativeUpgrade){
   const ok=game.buy?.(b.dataset.hfNativeUpgrade)??false;
   message(ok?'Mejora original aplicada':'No alcanza la resonancia o ya alcanzaste el máximo');
   return;
  }
  if(b.dataset.hfGraphics){const ok=globalThis.__highflySetGraphics?.(b.dataset.hfGraphics);message(ok?'Calidad gráfica actualizada':'No se pudo aplicar ese perfil');return;}
  const action=b.dataset.hfAction??'';
  if(action==='edit-hud'){
   close();game.input?.highflyTouch?.hudEditor?.toggle();return;
  }
  if(action==='intro')return;
  if(action.startsWith('discard:')||action.startsWith('sell:')){
   const selling=action.startsWith('sell:'),id=action.slice(selling?5:8);
   const item=ITEM_DEFS[id];if(!item)return;
   const merchant=nearHighflyMerchant(game);
   if(selling&&!merchant){message('Para vender, acercate a Odo, el lutier');return;}
   // Prevent accidental deletion: explicit confirmation, selected variant, no negative inventory.
   const desc=(selling?'Vender':'Descartar')+' una unidad de '+item.name+
    (selling?' por '+itemSalePrice(item,bag.gearTraits?.bag?.[id]?.[local.selectedGearIndex]?.rarity??item.rarity)+' monedas?':'?');
   local.system={type:'p493-item-transaction',phase:'confirm',id,selling,variantIndex:local.selectedGearIndex,
    title:selling?'VENDER OBJETO':'DESCARTAR OBJETO',description:desc,icon:'item_'+id,
    details:[{label:'Cantidad',value:'1'},{label:'Acción',value:selling?'Venta con Odo':'Descarte irreversible'}]};
   render();return;
  }
  if(action==='close'){close();return;}
  if(action.startsWith('zoom:')){
   const change=action.slice(5);local.mapZoom=change==='reset'?1:Math.max(.75,Math.min(2.8,local.mapZoom*(change==='in'?1.25:.8)));
   render();return;
  }
  if(action==='cancel-unequip'||action==='cancel-equip'){
   local.confirmUnequip=null;local.pickEquipItem=null;render();return;
  }
  if(action.startsWith('ask-unequip:')){
   showSystem('unequip',{slotId:action.slice('ask-unequip:'.length)});return;
  }
  if(action.startsWith('unequip:')){showSystem('unequip',{slotId:action.slice('unequip:'.length)});return;}
  if(action.startsWith('pick-equip:')){
   const id=action.slice('pick-equip:'.length),slots=EQUIP_ITEM_DEFS[id]?.slots??[];
   showSystem(slots.length===1?'equip':'equip-choose',slots.length===1?{itemId:id,slotId:slots[0],variantIndex:local.selectedGearIndex}:{itemId:id,variantIndex:local.selectedGearIndex});return;
  }
  if(action.startsWith('equip:')){
   const [,slotId,itemId]=action.split(':');showSystem('equip',{itemId,slotId});return;
  }
  if(action==='choose-skill'){
   const selected=liveSkillRows(p()).find(s=>s.id===local.selectedSkill);
   if(!selected?.available){message('Esta habilidad todavía no está disponible');return;}
   local.pickSkill=selected.id;render();return;
  }
  if(action.startsWith('clear-skill:')){
   const result=clearSkillSlot(bag,Number(action.slice('clear-skill:'.length)));
   if(result.ok){save();syncSkills();}
   message(result.ok?'Ranura liberada':result.reason);return;
  }
  if(action==='expand'){showSystem('expand');return;}
   if(action.startsWith('gear:')){const [,kind,place,id,index]=action.split(':');showSystem('gear-upgrade',{kind,place,id,index:Number(index)||0});return;}
  if(action.startsWith('turn:')){local.heroTurn+=action==='turn:left'?-Math.PI/6:Math.PI/6;render();return;}
  // Gear is changed ONLY through real Bag <-> Character equip transactions.
   if(action.startsWith('use:')){
   const result=spendPotion(bag,p(),action.slice(4));if(result.ok)save();
   message(result.ok?'Recuperaste '+numeric(result.restored)+' de '+result.resource:result.reason);return;
  }
  if(action.startsWith('craft:')){showSystem('craft',{recipeId:action.slice(6)});return;}
 });
 document.addEventListener('keydown',e=>{
  if(e.repeat||e.target?.matches?.('input,textarea,select,[contenteditable]'))return;
  if(local.opened&&e.code==='Escape'){
   e.preventDefault();if(local.system?.phase==='working')return;
   if(local.system){local.system=null;render();}else close();return;
  }
  if(e.code==='KeyI'||e.code==='KeyB'){
   if(game.state==='playing'||local.opened){e.preventDefault();if(local.opened)close();else open(e.code==='KeyB'?'bolsa':'personaje');}
  }
 });
 // Android button remains inside the existing editable and opacity-controlled HUD.
 const touchButton=game.input?.highflyTouch?.root?.querySelector?.('[data-a="rpg-menu"]');
 if(touchButton){touchButton.hidden=false;touchButton.setAttribute('aria-label','Abrir menú RPG HIGHFLY');}
 else{
  const launcher=document.createElement('button');launcher.id='hf-rpg-launch';launcher.textContent='✧ MENÚ';
  launcher.addEventListener('click',()=>api.toggle());document.body.appendChild(launcher);
 }
 return api;
}
