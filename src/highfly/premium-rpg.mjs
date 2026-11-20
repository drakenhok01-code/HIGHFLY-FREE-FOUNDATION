/** HIGHFLY F0.14 premium RPG windows.
 * DOM/CSS and original SVG art: NOT a screenshot pasted onto Unsung.
 * Read ONE real Player; render over existing Three.js canvas (no second renderer).
 * Preview gated by ?hfrpg=1. Approved F0.13.1 remains untouched by default.
 */
import './premium-rpg.css';
import {paintLiveHero} from './hero-portrait.mjs';
import {premiumArt,assetUrl} from './premium-assets.mjs';
import {originalMapSnapshot,currentMapLandmarks} from './premium-map.mjs';
import {ITEM_DEFS,RECIPES,loadRpgState,saveRpgState,inventoryRows,bagSlots,MAX_BAG_SLOTS,consumeBagUpgrade,spendPotion,canCraft,craftPotion,attributeBreakdown,liveSkillRows} from './rpg-core.mjs';
import {weaponMode,WEAPON_MODES} from './universal-gear.mjs';
import {translateHighfly} from './es-localization.mjs';

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
const slot=(name,icon,value='Vacío',active=false)=>'<div class="hf-rpg-equip-slot '+(active?'is-active':'is-empty')+'"><span class="hf-rpg-slot-art">'+art(icon)+'</span><span><small>'+safe(name)+'</small><b>'+safe(value)+'</b></span></div>';
const menuLink=(tab,icon,label)=>'<button type="button" class="hf-rpg-side-link" data-hf-tab="'+tab+'"><span>'+icon+'</span>'+safe(label)+'</button>';

function art(id='stone',large=false){
 const premium=premiumArt(id,large);if(premium)return premium;
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
function tile(id,count,selected){
 const def=ITEM_DEFS[id],icon=def?.icon||'stone';
 return '<button type="button" class="hf-rpg-item '+(selected===id?'is-selected':'')+'" data-hf-item="'+safe(id)+'" aria-label="'+safe(def?.name||id)+'">'+art(icon)+'<b>x'+numeric(count)+'</b></button>';
}
function resourceRow(key,label,pCurrent,pMax){
 return '<div class="hf-rpg-meter"><span>'+label+'</span><div class="hf-rpg-track"><i class="'+key+'" style="width:'+pct(pCurrent,pMax).toFixed(1)+'%"></i></div><b>'+numeric(pCurrent)+' / '+numeric(pMax)+'</b></div>';
}
function title(s,sub=''){return '<div class="hf-rpg-heading"><span class="hf-rpg-sigil">✧</span><div><h2>'+safe(s)+'</h2>'+(sub?'<small>'+safe(sub)+'</small>':'')+'</div><i></i></div>';}
function panel(inner,cls=''){return '<section class="hf-rpg-panel '+cls+'">'+inner+'</section>';}
function button(label,attrs='',cls=''){return '<button type="button" class="hf-rpg-button '+cls+'" '+attrs+'>'+label+'</button>';}
function blank(text){return '<div class="hf-rpg-muted">'+safe(text)+'</div>';}
function itemCount(id,prof,bag){return ITEM_DEFS[id] ? id in bag.items?(bag.items[id]??0):(prof.inventory?.[id]??0):0;}

export function installPremiumRpgUI(game,{search=globalThis.location?.search??''}={}){
 if(typeof document==='undefined'||new URLSearchParams(search).get('hfrpg')==='0')return null;
 const root=document.createElement('div');
 root.id='hf-rpg';root.hidden=true;
 document.body.appendChild(root);
 const bag=loadRpgState();
 const local={tab:'personaje',category:'Todo',selected:'hp_potion',recipe:'hp_potion',selectedQuest:'primary',selectedSkill:'attack',toast:'',opened:false,heroTurn:0};
 root.style.setProperty('--hf-spritesheet','url("'+assetUrl('highfly-icons')+'")');
 root.style.setProperty('--hf-hero-art','url("'+assetUrl('hero-sanctuary')+'")');
 const p=()=>game.player,prof=()=>p()?._hfProfession??{inventory:{},tools:new Set()};
 const allItems=()=>inventoryRows(bag,prof().inventory);
 const attrs=()=>attributeBreakdown(p()?._hfLevel??1,p()?._hfTrainingScore??0);
 const health=()=>({value:p()?.health??0,max:p()?.healthMax??100});
 const mana=()=>({value:p()?._hfMana??0,max:p()?._hfManaMax??100});
 const weapon=()=>weaponMode(p()?._hfGearCycle??0);
 const message=(s)=>{local.toast=String(s);render();};
 const save=()=>saveRpgState(bag);
 const preview=()=>{
  const mode=weapon();
  return panel('<div class="hf-rpg-character-title">✧ CAZADOR UNIVERSAL <small>NIVEL '+numeric(attrs().level)+'</small></div>'+
   '<div class="hf-rpg-hero-stage" aria-label="Vista 3D del personaje actual">'+
   '<div class="hf-rpg-stage-halo"></div><div class="hf-rpg-stage-arch" aria-hidden="true">'+PHOENIX+'</div><canvas class="hf-rpg-hero-canvas" data-hf-hero aria-label="Retrato 3D vivo del personaje"></canvas>'+
   '<div class="hf-rpg-stage-ring"></div><div class="hf-rpg-hero-loading" data-hf-hero-status>Cargando personaje 3D…</div>'+
   '</div>'+
   '<div class="hf-rpg-weapon-tag"><span>⚔ '+safe(mode.label)+'</span>'+
   '<span class="hf-rpg-turn-buttons">'+button('↶','data-hf-action="turn:left" aria-label="Girar personaje a la izquierda"')+
   button('↷','data-hf-action="turn:right" aria-label="Girar personaje a la derecha"')+'</span></div>',
   'hf-rpg-hero-panel');
 };
 function character(){
  const mode=weapon();
  const main=mode.main?mode.label:mode.external?mode.label:'Sin arma';
  const off=mode.off==='1H_Sword_Offhand'?'Espada secundaria':mode.off==='Round_Shield'?'Escudo redondo':
   mode.style==='twohand'||mode.style==='spear'||mode.style==='staff'?'Agarre a dos manos':'Vacío';
  return '<div class="hf-rpg-character-layout">'+
   panel(title('Equipo','Mano derecha · equipo')+
    '<div class="hf-rpg-slot-list">'+
    slot('Casco','shield')+slot('Pechera','shield')+slot('Guantes','shield')+
    slot('Mano derecha','weapon',main,!!mode.main||!!mode.external)+slot('Collar','ring')+
    '</div>','hf-rpg-left-panel')+
   preview()+
   panel(title('Equipamiento','Mano izquierda · accesorios')+
    '<div class="hf-rpg-slot-list">'+
    slot('Hombros','shield')+slot('Pantalón','shield')+slot('Botas','shield')+
    slot('Mano izquierda',mode.off==='Round_Shield'?'shield':'weapon',off,!!mode.off||mode.style==='twohand'||!!mode.external)+
    slot('Anillo','ring')+'</div>','hf-rpg-right-panel')+
   '<div class="hf-rpg-equip-footer">'+button('⚔ CAMBIAR ARMA ACTUAL','data-hf-action="weapon"','is-primary')+
   '<span>Los slots vacíos se habilitarán con equipo real, sin inventar objetos.</span>'+
   button('ATRIBUTOS →','data-hf-tab="atributos"')+'</div></div>';
 }
 function refreshPortrait(){
  if(local.tab!=='personaje'||!local.opened)return;
  const canvas=root.querySelector('[data-hf-hero]'),status=root.querySelector('[data-hf-hero-status]');
  if(!canvas||!canvas.isConnected)return;
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
  const a=attrs(),rows=a.rows.map(r=>'<div class="hf-rpg-stat-row"><span><b>'+r.id+'</b> <small>'+r.name+'</small></span>'+
    '<span>'+r.level+'</span><span>'+r.training+'</span><span class="is-green">+'+r.equipment+'</span><strong>'+r.total+'</strong></div>').join('');
  return '<div class="hf-rpg-two">'+panel(title('Atributos','Atributos principales · Nivel '+a.level)+
   '<div class="hf-rpg-stat-head"><span>ATRIBUTO</span><span>NIVEL 80%</span><span>ENTRENAMIENTO 20%</span><span>EQUIPO</span><span>TOTAL</span></div>'+rows+
   '<div class="hf-rpg-rule"></div><p class="hf-rpg-info">Los puntos base nuevos se distribuyen hasta un <b>80% por nivel</b> y hasta un <b>20% por entrenamiento real verificado</b>. Las bonificaciones de equipo se suman por separado.</p>'+
   '<div class="hf-rpg-split">'+panel('<b>PROGRESIÓN</b><p>Nivel real registrado: '+a.level+'</p><small>Puntos por nivel: '+a.levelPoints+'</small>')+
   panel('<b>ENTRENAMIENTO REAL</b><p>'+a.trainingPoints+' / '+a.trainingCap+' puntos</p><small>No se otorgan puntos simulados.</small>')+'</div>')+
   panel(title('Estadísticas derivadas','Combate y recursos del personaje')+
   '<div class="hf-rpg-stats-aside">'+[['HP máximo',health().max],['Maná máximo',mana().max],['Energía máxima',p()?.staminaMax],['Oxígeno máximo',p()?._hfOxygenMax??100],['Ataque',p()?.power?'×'+Number(p().power).toFixed(2):'—'],['Defensa',p()?._hfDefense??'—'],['Crítico',p()?._hfCritical??'—'],['Esquiva',p()?._hfEvasion??'—']].map(([k,v])=>'<div><span>'+safe(k)+'</span><b>'+safe(v??'—')+'</b></div>').join('')+'</div>','hf-rpg-right-panel')+'</div>';
 }
 function bagView(){
  const rows=allItems().filter(o=>local.category==='Todo'||o.kind===local.category);
  const chosen=ITEM_DEFS[local.selected]&&allItems().some(x=>x.id===local.selected)?ITEM_DEFS[local.selected]:rows[0]||null;
  const count=chosen?itemCount(chosen.id,prof(),bag):0;
  return '<div class="hf-rpg-three">'+panel(title('Bolsa','Categorías')+
    ['Todo','Consumibles','Materiales','Especial'].map(cat=>menuLink('bag:'+cat,cat==='Todo'?'◈':cat==='Consumibles'?'⚗':cat==='Materiales'?'❖':'✧',cat)).join('')+
    '<div class="hf-rpg-space">OBJETOS DISTINTOS <strong>'+allItems().length+'</strong></div>'+button('✧ EXPANDIR BOLSA · '+(bag.items.bag_upgrade??0)+' SELLOS','data-hf-action="expand" '+((bag.items.bag_upgrade??0)>0?'':'disabled'),'is-primary')+'<small class="hf-rpg-bag-capacity">Capacidad '+bag.slots+' / 72 · Los sellos se fabrican con recursos reales.</small>','hf-rpg-left-panel')+
    panel(title('Inventario','Objetos reales y consumibles utilizables')+
    '<div class="hf-rpg-grid" data-hf-bag-capacity="'+bag.slots+'">'+bagSlots(rows,bag.slots).map((o,i)=>o?tile(o.id,o.count,chosen?.id):
  '<div class="hf-rpg-empty-slot" aria-label="Espacio de bolsa vacío '+(i+1)+'"><span>✧</span></div>').join('')+'</div>'+
    '<div class="hf-rpg-inventory-counter">'+rows.length+' / '+bag.slots+' ESPACIOS OCUPADOS</div>'+
    '<div class="hf-rpg-bottom-note">La bolsa conserva sus casillas vacías. Cada objeto o material real ocupa un espacio cuando se consigue.</div>')+
    panel(title('Detalle del objeto',chosen?.rarity??'Sin selección')+
    (chosen?'<div class="hf-rpg-detail-art">'+art(chosen.icon,true)+'</div><h3>'+safe(chosen.name)+'</h3>'+
    '<div class="hf-rpg-tag">'+safe(chosen.kind)+' · Tenés '+numeric(count)+'</div>'+
    '<p class="hf-rpg-info">'+safe(chosen.description)+'</p>'+
    (chosen.kind==='Consumibles'?button('✧ USAR','data-hf-action="use:'+safe(chosen.id)+'"','is-primary'):chosen.id==='bag_upgrade'?button('✧ EXPANDIR BOLSA','data-hf-action="expand"','is-primary'):blank('Material obtenido en el mundo; se utiliza en Fabricación.')):
    blank('Sin objetos en esta categoría.')),'hf-rpg-right-panel')+'</div>';
 }
 function skills(){
  const list=liveSkillRows(p()),chosen=list.find(s=>s.id===local.selectedSkill)||list[0];
  return '<div class="hf-rpg-two">'+panel(title('Habilidades','Catálogo del Cazador Universal · '+list.filter(s=>s.available).length+' activas')+
    '<div class="hf-rpg-skill-list">'+list.map((s,i)=>'<button type="button" data-hf-skill="'+safe(s.id)+'" class="hf-rpg-skill '+(!s.available?'is-locked ':'')+(chosen?.id===s.id?'is-selected':'')+'"><span class="hf-rpg-skill-glyph">'+art(s.kind==='Mágica'?'mana':s.kind==='Curación'?'health':'weapon')+'</span><div><b>'+safe(s.label)+'</b><small>'+safe(s.kind)+' · '+safe(s.cost)+'</small></div><em>'+(s.available?'ACTIVA':'BLOQUEADA')+'</em></button>').join('')+'</div>')+
   panel(title(chosen?.label??'Habilidad','Detalles de la habilidad seleccionada')+
    '<div class="hf-rpg-skill-scenery">'+art(chosen?.kind==='Curación'?'health':chosen?.kind==='Mágica'?'mana':'skills',true)+'</div>'+
    '<div class="hf-rpg-tag">'+safe(chosen?.kind??'')+' · '+safe(chosen?.cost??'')+'</div>'+
    '<p class="hf-rpg-info">'+safe(chosen?.desc??'')+'</p>'+
    '<div class="hf-rpg-stat-panel"><b>Estado</b><strong>'+(chosen?.available?'Disponible':'Por desbloquear')+'</strong></div>'+
    (chosen?.id==='heal'?'<p class="hf-rpg-info">Se activa con las cargas curativas disponibles en el mundo.</p>':'')+
    '<div class="hf-rpg-mini-actions">'+button('VER PERSONAJE','data-hf-tab="personaje"','is-primary')+'</div>','hf-rpg-right-panel')+'</div>';
 }
 function professions(){
  const profession=prof(),jobs=[['Recolección','herb','Recolectar plantas reales'],['Minería','ore','Extraer minerales de vetas'],['Tala','wood','Talar árboles válidos'],['Pesca','fish','Pescar en lugares habilitados'],['Fundición','ingot','Fundir minerales'],['Forja','blade_blank','Fabricar hojas de prueba']];
  return '<div class="hf-rpg-two">'+panel(title('Oficios','Profesiones conectadas al inventario')+
   '<div class="hf-rpg-prof-grid">'+jobs.map(([name,id,descr])=>'<article class="hf-rpg-prof-card">'+art(ITEM_DEFS[id]?.icon)+'<div><b>'+name+'</b><small>'+descr+'</small><p>En bolsa: <strong>'+numeric(profession.inventory?.[id]??0)+'</strong></p></div></article>').join('')+'</div>')+
   panel(title('Registro de actividades','Sin progreso inventado')+
    '<div class="hf-rpg-stat-panel"><b>Acciones completadas</b><strong>'+numeric(profession.completed??0)+'</strong></div>'+
    '<div class="hf-rpg-stat-panel"><b>Herramientas disponibles</b><strong>'+numeric(profession.tools?.size??0)+'</strong></div>'+
    '<p class="hf-rpg-info">Estos materiales son los mismos que aparecen en Bolsa y que consumirá Fabricación. Las estaciones funcionales se prueban en el taller original de HIGHFLY.</p>'+
    '<div class="hf-rpg-mini-actions">'+button('IR A FABRICACIÓN','data-hf-tab="forja"','is-primary')+'</div>','hf-rpg-right-panel')+'</div>';
 }
 function forge(){
  const recipe=RECIPES[local.recipe]||RECIPES.hp_potion,ok=canCraft(recipe.item,prof().inventory,bag);
  return '<div class="hf-rpg-three">'+panel(title('Fabricación','Recetas disponibles')+
  Object.values(RECIPES).map(r=>'<button type="button" data-hf-recipe="'+r.item+'" class="hf-rpg-recipe '+(r.item===recipe.item?'is-selected':'')+'">'+art(ITEM_DEFS[r.item].icon)+'<b>'+safe(r.name)+'</b></button>').join('')+
  '<div class="hf-rpg-space">ESTACIÓN <strong>'+safe(recipe.profession)+'</strong></div>','hf-rpg-left-panel')+
  panel(title(recipe.name,recipe.profession+' · Elaboración real')+'<div class="hf-rpg-craft-focus">'+art(ITEM_DEFS[recipe.item].icon,true)+
   '<div><h3>'+safe(recipe.name)+'</h3><p>'+safe(ITEM_DEFS[recipe.item].description)+'</p></div></div>'+
   '<div class="hf-rpg-subtitle">MATERIALES NECESARIOS</div>'+
   '<div class="hf-rpg-ingredients">'+Object.entries(recipe.ingredients).map(([id,n])=>'<div class="hf-rpg-ingredient">'+art(ITEM_DEFS[id].icon)+'<b>'+safe(ITEM_DEFS[id].name)+'</b><span class="'+((prof().inventory[id]??0)<n?'is-red':'is-green')+'">'+numeric(prof().inventory[id]??0)+' / '+n+'</span></div>').join('')+'</div>'+
   '<div class="hf-rpg-rule"></div>'+button(ok.ok?'✧ FABRICAR 1':'FALTAN MATERIALES','data-hf-action="craft:'+recipe.item+'" '+(ok.ok?'':'disabled'),'is-primary')+
   '<div class="hf-rpg-bottom-note">No se crean materiales ni se entregan recetas sin insumos.</div>')+
  panel(title('Materiales en bolsa','Cantidades actuales')+
   Object.keys(ITEM_DEFS).filter(k=>ITEM_DEFS[k].kind==='Materiales').map(id=>'<div class="hf-rpg-material-row">'+art(ITEM_DEFS[id].icon)+'<span>'+safe(ITEM_DEFS[id].name)+'</span><b>x'+numeric(prof().inventory[id]??0)+'</b></div>').join('')+
   '<div class="hf-rpg-mini-actions">'+button('ABRIR BOLSA','data-hf-tab="bolsa"')+'</div>','hf-rpg-right-panel')+'</div>';
 }
 function quests(){
  const rows=game.quests?.active??[];
  const objective=translateHighfly(game.objective||'Explorá el mundo');
  const selected=rows.find(q=>q.id===local.selectedQuest)??null;
  const name=selected?translateHighfly(selected.title):objective;
  const goal=selected?translateHighfly(selected.verb):objective;
  const state=selected?game.quests?.state?.[selected.id]:null;
  const progress=selected?game.quests?.progress?.(selected):null;
  const progressText=state?.s==='ready'?'LISTA PARA ENTREGAR':progress?.length>=2?progress[0]+' / '+progress[1]:'OBJETIVO PRINCIPAL';
  return '<div class="hf-rpg-quest-layout">'+panel(title('Misiones','Principal · Secundarias · Profesiones')+
    '<div class="hf-rpg-subtitle">SEGUIMIENTO · '+rows.length+' ACTIVAS</div>'+
    '<div class="hf-rpg-quest-list">'+
     '<button type="button" data-hf-quest="primary" class="hf-rpg-quest-row '+(local.selectedQuest==='primary'?'is-selected':'')+'"><b>✦ HISTORIA · '+safe(objective)+'</b><small>Objetivo principal del Valle</small></button>'+
     rows.map(q=>{const st=game.quests?.state?.[q.id],v=game.quests?.progress?.(q);return '<button type="button" data-hf-quest="'+safe(q.id)+'" class="hf-rpg-quest-row '+(local.selectedQuest===q.id?'is-selected':'')+'"><b>'+safe(translateHighfly(q.title))+'</b><small>'+safe(translateHighfly(q.verb))+'</small><span>'+safe(st?.s==='ready'?'ENTREGAR':v?.length>=2?v[0]+' / '+v[1]:'ACTIVA')+'</span></button>';}).join('')+
    '</div>','hf-rpg-quest-left')+
   panel('<div class="hf-rpg-quest-detail">'+title(name,'REGISTRO DE AETHERIA')+
    '<p class="hf-rpg-info">'+safe(goal)+'</p>'+
    '<div class="hf-rpg-quest-art"><img alt="Ilustración del Camino al Patio de los Pétalos" src="'+assetUrl('quest-petal')+'"/></div>'+
    '<div class="hf-rpg-quest-detail-foot"><b>OBJETIVO · '+safe(progressText)+'</b><span>Las recompensas se obtienen al completar la misión del juego.</span></div>'+
    '</div>','hf-rpg-quest-right')+'</div>';
 }
 function map(){
  const native=originalMapSnapshot(game);
  const locations=currentMapLandmarks(game);
  const visual=native?'<img class="hf-rpg-map-native" alt="Mapa nativo real con terreno, posición y objetivos" src="'+native+'"/>':
   '<div class="hf-rpg-map-art" role="img" aria-label="Ilustración de la región de Aetheria"></div>';
  return '<div class="hf-rpg-map-layout">'+panel(title('Mapa del Mundo',native?'Terreno y marcadores reales':'Atlas de Aetheria · Vista ilustrativa')+
   '<div class="hf-rpg-map-display">'+visual+'</div>'+
   '<small class="hf-rpg-map-caveat">'+(native?'Mapa original del juego · Tu posición y objetivos están marcados.':'Vista ilustrativa. Conseguí el mapa en la misión del Cartógrafo para acceder a los datos del mundo.')+'</small>','hf-rpg-map-main')+
   panel(title('Leyenda','Ubicaciones descubiertas')+
    '<div class="hf-rpg-legend"><div>◈ Tu posición</div><div>✧ Objetivo principal</div><div>✦ Misiones activas</div><div>◇ Lugares descubiertos</div></div>'+
    (locations.length?'<div class="hf-rpg-subtitle">AGUJAS DEL VALLE</div>'+locations.map(l=>'<div class="hf-rpg-material-row"><span>'+safe(translateHighfly(l.name))+'</span><b>'+(l.unlocked?'DESPIERTA':'CERRADA')+'</b></div>').join(''):blank('Explorá el Valle y descubrí sus lugares.')),'hf-rpg-map-aside')+'</div>';
 }
 function options(){
  return panel(title('Opciones','Ajustes vinculados al renderizador')+
    '<div class="hf-rpg-options"><div><b>Calidad gráfica</b><small>Los ajustes usan el sistema real HIGHFLY.</small></div>'+
    '<div class="hf-rpg-mini-actions">'+button('FLUIDO','data-hf-graphics="performance"')+button('BALANCE','data-hf-graphics="balanced"')+button('NÍTIDO','data-hf-graphics="quality"')+'</div></div>'+
    '<div class="hf-rpg-rule"></div>'+blank('El editor HUD 3.1 se mantiene disponible desde el juego, con su guardado independiente.')+
    '<div class="hf-rpg-mini-actions">'+button('VOLVER AL JUEGO','data-hf-action="close"','is-primary')+'</div>');
 }
 const bodies={personaje:character,atributos:attributes,bolsa:bagView,habilidades:skills,oficios:professions,forja:forge,misiones:quests,mapa:map,opciones:options};
 function render(){
  if(!local.opened)return;
  const body=bodies[local.tab]||character;
  root.innerHTML='<div class="hf-rpg-fade"></div><div class="hf-rpg-shell" role="dialog" aria-label="Menú del sistema HIGHFLY">'+
   '<header class="hf-rpg-top"><div class="hf-rpg-logo">'+PHOENIX+'<span class="hf-rpg-brand-name">HIGHFLY<small>PHOENIX ASCENSIÓN</small></span></div>'+
   '<nav class="hf-rpg-nav" aria-label="Pestañas del RPG">'+NAV.map(([id,icon,name])=>'<button data-hf-tab="'+id+'" type="button" class="'+(id===local.tab?'is-active':'')+'"><span>'+icon+'</span>'+name+'</button>').join('')+'</nav>'+
   '<button class="hf-rpg-close" type="button" data-hf-action="close" aria-label="Cerrar menú">×</button></header>'+
   '<div class="hf-rpg-content">'+body()+'</div>'+
   '<footer class="hf-rpg-footer"><span>✦ CAZADOR UNIVERSAL · UNA SOLA AVENTURA</span><span>'+safe(local.toast||'F0.14.5 · HIGHFLY PHOENIX ASCENSIÓN · ANDROID HORIZONTAL')+'</span></footer></div>';
  if(local.tab==='personaje')requestAnimationFrame(()=>refreshPortrait());
 }
 function open(tab='personaje'){
  if(local.opened){local.tab=tab;render();return true;}
  if(game.state!=='playing'||game.people?.talk||game.cine)return false;
  game.openMenu('hero');
  if(game.state!=='menu')return false;
  local.opened=true;local.tab=tab;root.hidden=false;
  document.body.classList.add('hf-rpg-is-open');
  render();return true;
 }
 function close(){
  if(!local.opened)return;
  local.opened=false;root.hidden=true;root.innerHTML='';document.body.classList.remove('hf-rpg-is-open');
  local.toast='';
  if(game.state==='menu'&&game.menu==='hero')game.closeMenu();
 }
 const api={open,close,toggle:()=>local.opened?close():open(),render,get opened(){return local.opened},get state(){return bag}};
 root.addEventListener('click',e=>{
  const b=e.target?.closest?.('button');if(!b)return;
  const tab=b.dataset.hfTab;
  if(tab){if(tab.startsWith('bag:')){local.tab='bolsa';local.category=tab.slice(4);}
   else{local.tab=tab;local.category='Todo';}local.toast='';render();return;}
  if(b.dataset.hfItem){local.selected=b.dataset.hfItem;render();return;}
  if(b.dataset.hfQuest){local.selectedQuest=b.dataset.hfQuest;render();return;}
  if(b.dataset.hfSkill){local.selectedSkill=b.dataset.hfSkill;render();return;}
  if(b.dataset.hfRecipe){local.recipe=b.dataset.hfRecipe;render();return;}
  if(b.dataset.hfGraphics){const ok=globalThis.__highflySetGraphics?.(b.dataset.hfGraphics);message(ok?'Calidad gráfica actualizada':'No se pudo aplicar ese perfil');return;}
  const action=b.dataset.hfAction??'';
  if(action==='close'){close();return;}
  if(action==='expand'){
   const result=consumeBagUpgrade(bag);if(result.ok)save();
   message(result.ok?'¡Bolsa ampliada a '+result.slots+' casillas!':result.reason);return;
  }
  if(action.startsWith('turn:')){local.heroTurn+=action==='turn:left'?-Math.PI/6:Math.PI/6;render();return;}
  if(action==='weapon'){
   if(!p())return;
   p()._hfGearCycle=((p()._hfGearCycle??0)+1)%WEAPON_MODES.length;
   game.hero?.equip?.(p()._hfGearCycle);
   message('Arma visible actualizada: '+weapon().label);return;
  }
  if(action.startsWith('use:')){
   const result=spendPotion(bag,p(),action.slice(4));if(result.ok)save();
   message(result.ok?'Recuperaste '+numeric(result.restored)+' de '+result.resource:result.reason);return;
  }
  if(action.startsWith('craft:')){
   const result=craftPotion(action.slice(6),prof(),bag);if(result.ok){save();p()?._hfProfessionSave?.();}
   message(result.ok?'¡Fabricaste '+ITEM_DEFS[result.id].name+'!':result.reason);return;
  }
 });
 document.addEventListener('keydown',e=>{
  if(e.repeat||e.target?.matches?.('input,textarea,select,[contenteditable]'))return;
  if(local.opened&&e.code==='Escape'){e.preventDefault();close();return;}
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
