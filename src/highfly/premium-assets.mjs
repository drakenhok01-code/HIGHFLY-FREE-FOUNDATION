/** HIGHFLY PREMIUM v2: standalone, resolution-independent artwork per real RPG ID.
 *  F0.14.8 game/UI state still drives all interactivity. No screenshots used as UI.
 */
export const officialLogoUrl=()=>import.meta.env.BASE_URL+'highfly/brand/highfly-official.avif';
export const assetUrl=name=>import.meta.env.BASE_URL+'highfly/'+name+((name.startsWith('approved-')||name.startsWith('user-icons/')||name.startsWith('rarity/')||/^premium\/(item_|skill_|profession_|quest_|character_sanctuary$|forge_workshop$)/.test(name))?'.webp':'.svg');
const ITEMS=new Set(['hp_potion','mp_potion','herb','ore','wood','fish','ingot','blade_blank','seed','bag_upgrade','training_sword','training_shield','training_greatsword']);
const SLOTS=new Set(['helmet','chest','gloves','right_hand','necklace','shoulders','pants','boots','left_hand','ring']);
const PROFS=new Set(['recoleccion','mineria','tala','pesca','cocina','alquimia','fundicion','forja']);
const SKILLS=new Set(['attack','dash','roll','heavy','pulse','heal']);
const QUESTS=new Set(['primary','scales','amber','kept','nine','answer','vellum2','count2','names','rings','vellum','count','seeds','stair','voices','lamps','water','debt','windfall']);
const ALIAS={health:'item_hp_potion',mana:'item_mp_potion',herb:'item_herb',ore:'item_ore',wood:'item_wood',fish:'item_fish',ingot:'item_ingot',blade:'item_blade_blank',weapon:'item_training_sword',shield:'item_training_shield',expansion:'item_bag_upgrade',armor:'slot_chest',ring:'slot_ring',helmet:'slot_helmet',gloves:'slot_gloves',boots:'slot_boots',forge:'profession_forja',food:'profession_cocina'};

// Canonical mapping: 36 active visual IDs, optional empty-slot previews
// and future icon files remain separated from the actual RPG item registry.
const USER_ICONS=Object.freeze({
 ...Object.fromEntries('hp_potion mp_potion herb ore wood fish ingot blade_blank seed bag_upgrade'.split(' ').map(x=>['item_'+x,'items/'+(x==='ingot'?'ingot_iron':x)])),
 ...Object.fromEntries(Object.entries({hf_iron_helmet:'helmet',hf_iron_chest:'chest',hf_iron_gloves:'gloves',hf_iron_pants:'shoulders',hf_iron_boots:'boots',hf_iron_shoulders:'shoulders',hf_copper_ring:'ring',hf_silver_necklace:'necklace'}).map(([id,asset])=>['item_'+id,'armor/'+asset])),
 item_leather:'items/leather',
 item_training_sword:'weapons/sword',
 item_training_shield:'armor/shield',
 item_training_greatsword:'weapons/greatsword',
 item_ingot_copper:'items/ingot_copper',item_ingot_iron:'items/ingot_iron',item_ingot_silver:'items/ingot_silver',item_ingot_gold:'items/ingot_gold',
 ...Object.fromEntries('ingot_steel ingot_diamond ingot_obsidian ingot_mithril ore_copper ore_iron coal ore_silver ore_gold raw_diamond raw_obsidian ore_mithril'.split(' ').map(x=>['item_'+x,'items/'+x])),
 item_upgrade_stone:'items/upgrade_stone',item_upgrade_stone_advanced:'items/upgrade_stone_advanced',item_ascension_core:'items/ascension_core',
 ...Object.fromEntries('attack dash roll heavy pulse heal'.split(' ').map(x=>['skill_'+x,'skills/'+x])),
 ...Object.fromEntries('recoleccion mineria tala pesca cocina alquimia fundicion forja marroquineria sastreria joyeria ingenieria encantamiento inscripcion desuello'.split(' ').map(x=>['profession_'+x,'professions/'+x])),
 ...Object.fromEntries('personaje atributos bolsa habilidades oficios forja misiones mapa opciones'.split(' ').map(x=>['nav_'+x,'navigation/'+x])),
 // Empty equip slots always render their light, neutral outline SVG.
 // Gold equipment paintings are reserved for inventory and truly equipped objects.
});
export const USER_ICON_ACTIVE_IDS=Object.freeze(Object.keys(USER_ICONS).filter(x=>!x.startsWith('slot_')));
export const USER_ICON_RESERVED_FILES=Object.freeze([
 'items/leather','skills/parry','skills/impact_jump',
 ...'arcane_arrow berserker flame_slash frost_nova holy_seal lightning shadow_summon spinning_slash'.split(' ').map(x=>'skills-advanced/'+x),
 ...'axe bow dual_daggers spear staff wand_orb'.split(' ').map(x=>'weapons/'+x),
 ...'boots chest gloves helmet necklace ring shoulders'.split(' ').map(x=>'armor/'+x)
]);
// Does not add an object to inventory or unlock a skill.
export const userIconUrl=id=>USER_ICONS[id]?assetUrl('user-icons/'+USER_ICONS[id]):null;

const valid=id=>id.startsWith('item_')?ITEMS.has(id.slice(5)):id.startsWith('slot_')?SLOTS.has(id.slice(5)):id.startsWith('profession_')?PROFS.has(id.slice(11)):id.startsWith('skill_')?SKILLS.has(id.slice(6)):false;
export function premiumArt(name,large=false,rarity='Común'){
 // P4.3 restores approved 256px, painterly icons WITH their integrated metal
 // frame. Do not add a secondary HTML frame or crop the illustration.
 const grades={'Común':'comun','Poco común':'poco-comun','Raro':'raro','Épico':'epico','Legendario':'legendario','Mítico':'mitico'};
 const id=ALIAS[name]||name;
 const source=userIconUrl(id);
 if(source){
  const rel=USER_ICONS[id],hasOrnateRarity=id.startsWith('item_')&&/^(items|armor|weapons)\//.test(rel);
  const framed=hasOrnateRarity?assetUrl('rarity/'+rel+'__'+(grades[rarity]??'comun')):source;
  return '<img class="hf-rpg-art hf-premium-icon hf-user-icon'+(large?' is-large':'')+'" data-hf-icon-pack="user-v1" data-hf-art-id="'+id+'" data-hf-frame-art="'+(hasOrnateRarity?'p43':'original')+'" src="'+framed+'" draggable="false" loading="eager" alt="" aria-hidden="true"/>';
 }
 if(!valid(id))return null;
 return '<img class="hf-rpg-art hf-premium-icon'+(large?' is-large':'')+'" data-hf-art-id="'+id+'" src="'+assetUrl('premium/'+id)+'" draggable="false" loading="eager" alt="" aria-hidden="true"/>';
}
const jobNames={'Recolección':'recoleccion','Minería':'mineria','Tala':'tala','Pesca':'pesca','Cocina':'cocina','Alquimia':'alquimia','Fundición':'fundicion','Forja':'forja','Marroquinería':'marroquineria','Sastrería':'sastreria','Joyería':'joyeria','Ingeniería':'ingenieria','Encantamiento':'encantamiento','Inscripción':'inscripcion','Desuello':'desuello'};
export const professionIcon=job=>'profession_'+(jobNames[job]||'recoleccion');
export const questArtUrl=(id,title='')=>{
 if(!id||id==='primary')return assetUrl('premium/quest_primary');
 if(id==='scales')return assetUrl('premium/quest_voices'); // Grave, medio, agudo: arte musical propio; distinto de Cuatro nombres
 if(id==='names')return assetUrl('premium/quest_names');
 if(QUESTS.has(id))return assetUrl('premium/quest_'+id);
 const text=String(title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const hints=[['names',/cuatro nombres/],['vellum',/pergamino|cartogra/],['count',/cuenta del guardian|notas/],['scales',/campanillas/],['amber',/ambar/],['kept',/relicario/],['seeds',/semillas/],['stair',/escalera/]];
 const hit=hints.find(([,re])=>re.test(text));
 if(hit)return assetUrl('premium/quest_'+hit[0]);
 const keys=[...QUESTS].filter(x=>x!=='primary');
 let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;
 return assetUrl('premium/quest_'+keys[h%keys.length]);
};
export const PREMIUM_IDS=Object.freeze({items:[...ITEMS],slots:[...SLOTS],professions:[...PROFS],skills:[...SKILLS],quests:[...QUESTS]});
export const PLEDGE='60 iconos WebP 256x256 aportados por el usuario e integrados por ID: solo 36 funciones actuales, futuros reservados. F0.14.8 conserva lógica DOM/Canvas.';
