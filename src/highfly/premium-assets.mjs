/** HIGHFLY PREMIUM v2: standalone, resolution-independent artwork per real RPG ID.
 *  F0.14.8 game/UI state still drives all interactivity. No screenshots used as UI.
 */
export const assetUrl=name=>import.meta.env.BASE_URL+'highfly/'+name+((name.startsWith('approved-')||name.startsWith('user-icons/')||/^premium\/(item_|skill_|profession_|quest_|character_sanctuary$|forge_workshop$)/.test(name))?'.webp':'.svg');
const ITEMS=new Set(['hp_potion','mp_potion','herb','ore','wood','fish','ingot','blade_blank','seed','bag_upgrade','training_sword','training_shield','training_greatsword']);
const SLOTS=new Set(['helmet','chest','gloves','right_hand','necklace','shoulders','pants','boots','left_hand','ring']);
const PROFS=new Set(['recoleccion','mineria','tala','pesca','cocina','alquimia','fundicion','forja']);
const SKILLS=new Set(['attack','dash','roll','heavy','pulse','heal']);
const QUESTS=new Set(['primary','scales','amber','kept','nine','answer','vellum2','count2','names','rings','vellum','count','seeds','stair','voices','lamps','water','debt','windfall']);
const ALIAS={health:'item_hp_potion',mana:'item_mp_potion',herb:'item_herb',ore:'item_ore',wood:'item_wood',fish:'item_fish',ingot:'item_ingot',blade:'item_blade_blank',weapon:'item_training_sword',shield:'item_training_shield',expansion:'item_bag_upgrade',armor:'slot_chest',ring:'slot_ring',helmet:'slot_helmet',gloves:'slot_gloves',boots:'slot_boots',forge:'profession_forja',food:'profession_cocina'};

// Canonical mapping: 36 active visual IDs, optional empty-slot previews
// and future icon files remain separated from the actual RPG item registry.
const USER_ICONS=Object.freeze({
 ...Object.fromEntries('hp_potion mp_potion herb ore wood fish ingot blade_blank seed bag_upgrade'.split(' ').map(x=>['item_'+x,'items/'+x])),
 item_training_sword:'weapons/sword',
 item_training_shield:'armor/shield',
 item_training_greatsword:'weapons/greatsword',
 ...Object.fromEntries('attack dash roll heavy pulse heal'.split(' ').map(x=>['skill_'+x,'skills/'+x])),
 ...Object.fromEntries('recoleccion mineria tala pesca cocina alquimia fundicion forja'.split(' ').map(x=>['profession_'+x,'professions/'+x])),
 ...Object.fromEntries('personaje atributos bolsa habilidades oficios forja misiones mapa opciones'.split(' ').map(x=>['nav_'+x,'navigation/'+x])),
 slot_helmet:'armor/helmet',slot_chest:'armor/chest',slot_gloves:'armor/gloves',
 slot_right_hand:'weapons/sword',slot_necklace:'armor/necklace',
 slot_shoulders:'armor/shoulders',slot_boots:'armor/boots',
 slot_left_hand:'armor/shield',slot_ring:'armor/ring'
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
export function premiumArt(name,large=false){
 const id=ALIAS[name]||name;
 const source=userIconUrl(id);
 if(source)return '<img class="hf-rpg-art hf-premium-icon hf-user-icon'+(large?' is-large':'')+'" data-hf-icon-pack="user-v1" data-hf-art-id="'+id+'" src="'+source+'" draggable="false" loading="eager" alt="" aria-hidden="true"/>';
 if(!valid(id))return null;
 return '<img class="hf-rpg-art hf-premium-icon'+(large?' is-large':'')+'" data-hf-art-id="'+id+'" src="'+assetUrl('premium/'+id)+'" draggable="false" loading="eager" alt="" aria-hidden="true"/>';
}
const jobNames={'Recolección':'recoleccion','Minería':'mineria','Tala':'tala','Pesca':'pesca','Cocina':'cocina','Alquimia':'alquimia','Fundición':'fundicion','Forja':'forja'};
export const professionIcon=job=>'profession_'+(jobNames[job]||'recoleccion');
export const questArtUrl=id=>assetUrl('premium/quest_'+(QUESTS.has(id)?id:'primary'));
export const PREMIUM_IDS=Object.freeze({items:[...ITEMS],slots:[...SLOTS],professions:[...PROFS],skills:[...SKILLS],quests:[...QUESTS]});
export const PLEDGE='60 iconos WebP 256x256 aportados por el usuario e integrados por ID: solo 36 funciones actuales, futuros reservados. F0.14.8 conserva lógica DOM/Canvas.';
