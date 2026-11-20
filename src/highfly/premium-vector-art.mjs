/** Stand-alone, transparent, vector-scale original art for real F0.14.8 IDs.
 * No buttons, borders, labels, rarity or counts are baked into any icon.
 * One and the same image component is reused by equipment, inventory and crafting.
 */
const colors={
 item_hp_potion:['#ff5670','#ffd6b7'],item_mp_potion:['#268eff','#b7f7ff'],
 item_herb:['#38da64','#e5ff9d'],item_ore:['#628cff','#d0c4ff'],
 item_wood:['#b77b3d','#ffe0a1'],item_fish:['#35c9ec','#d2fdff'],
 item_ingot:['#89b6ff','#fff0b9'],item_blade_blank:['#a4bfff','#f5fdff'],
 item_seed:['#86d94f','#fff7b4'],item_bag_upgrade:['#bc54ff','#fff1fc'],
 item_training_sword:['#45bfff','#f7f3cb'],item_training_shield:['#a970ff','#fff1aa'],
 item_training_greatsword:['#3878ff','#fef1c3'],
 profession_recoleccion:['#40e869','#d9ff91'],profession_mineria:['#7795ff','#f4d6ff'],
 profession_tala:['#cb9451','#ffeab8'],profession_pesca:['#40d5ff','#c9fff9'],
 profession_cocina:['#ffaf4b','#fff2a4'],profession_alquimia:['#ba77ff','#bdfff4'],
 profession_fundicion:['#ffc165','#fff3bd'],profession_forja:['#fcaa42','#f6f4b2']
};
for(const k of ['helmet','chest','gloves','right_hand','necklace','shoulders','pants','boots','left_hand','ring'])
 colors['slot_'+k]=['#a3bff1','#f5deb4'];
const blade='<path d="M64 10L42 65l-8 6 2-14 22-51z" fill="url(#metal)" stroke="#d8faff" stroke-width="2.5"/><path d="M35 67l-9 11 16 16 10-10z" fill="#dba358" stroke="#ffe1ac" stroke-width="3"/><path d="M27 70l19 19" stroke="#ffe6ae" stroke-width="5"/><circle cx="30" cy="91" r="5" fill="#ffb752"/>';
const shield='<path d="M50 10L81 25l-5 43-26 23-26-23-5-43z" fill="url(#metal)" stroke="#ffde9f" stroke-width="5"/><path d="M50 18v61M27 41h46" stroke="#ddc5ff" stroke-width="4"/><path d="M50 42q-12-11-20-1 7 13 20 13 13 0 20-13-9-10-20 1z" fill="#bc61ed" stroke="#ffdbfa" stroke-width="1.5"/>';
const potion='<path d="M38 9h24l3 13-5 10 16 32Q90 90 51 93 12 90 24 64l16-32-5-10z" fill="url(#glass)" stroke="#f9d492" stroke-width="3"/><path d="M27 66q23-16 48 0l5 14Q70 96 49 91 23 91 21 79z" fill="url(#liquid)" stroke="#f6f7ff" stroke-opacity=".7" stroke-width="2"/><path d="M34 8h32v10H34zM38 22h24" fill="#cf9140" stroke="#fff0bf" stroke-width="3"/><path d="M39 41q-18 30-12 40" fill="none" stroke="#fff" opacity=".8" stroke-linecap="round" stroke-width="5"/><path d="M50 54l6 9-6 11-7-11z" fill="#fff5bb"/><path d="M38 73q12-7 24 0" fill="none" stroke="#ffe0a3" stroke-width="2"/>';
const leaves='<path d="M49 89V31" fill="none" stroke="#ffdb9f" stroke-width="5"/><path d="M49 62Q11 66 17 24q34 1 32 38zM50 63Q86 60 82 15 50 17 50 63zM49 81Q18 84 20 59q30-7 29 22z" fill="url(#liquid)" stroke="#ccffc0" stroke-width="3"/><path d="M26 36l21 21M73 29L52 55" stroke="#efffcf" stroke-width="2"/>';
const crystal='<path d="M24 66l11-42 25-14 24 29-8 37-28 15z" fill="url(#metal)" stroke="#d0ddff" stroke-width="3"/><path d="M35 24l22 37-9 30M57 61l27-22M57 61l19 15" fill="none" stroke="#e9eeff" stroke-width="2.5"/>';
const log='<path d="M20 42q24-18 64-3v31q-26 17-64 3z" fill="#975832" stroke="#f5bd7f" stroke-width="3"/><ellipse cx="22" cy="58" rx="16" ry="24" fill="#d89c58" stroke="#ffe0a0" stroke-width="3"/><ellipse cx="22" cy="58" rx="10" ry="17" fill="none" stroke="#945328" stroke-width="2"/><ellipse cx="22" cy="58" rx="4" ry="7" fill="none" stroke="#945328" stroke-width="2"/>';
const fish='<path d="M20 50q32-40 64 0-32 40-64 0L8 35v30z" fill="url(#liquid)" stroke="#c6fbff" stroke-width="3"/><path d="M45 19l9-10 11 13M45 81l9 10 11-13" stroke="#95e5ff" stroke-width="3" fill="#48b9df"/><circle cx="70" cy="44" r="3" fill="#0b2a55"/>';
const ingot='<path d="M14 56l18-26 37-8 17 28-15 28-40 4z" fill="url(#metal)" stroke="#ffecc4" stroke-width="3"/><path d="M32 30l18 29-19 23M50 59l36-9" stroke="#fdfcff" stroke-width="2.5" fill="none"/>';
const ring='<ellipse cx="49" cy="64" rx="24" ry="20" fill="none" stroke="#ffd487" stroke-width="11"/><path d="M50 13L70 36 50 56 31 36z" fill="url(#liquid)" stroke="#fff1d1" stroke-width="3"/>';
const helmet='<path d="M18 60v-17a32 32 0 0 1 64 0v17L67 67l-9-11H44l-9 11z" fill="url(#metal)" stroke="#fff1b9" stroke-width="4"/><path d="M50 15v58M28 46h44" stroke="#ffd488" stroke-width="3"/>';
const armor='<path d="M27 13l23 9 23-9 17 23-17 17-6 33H33l-6-33-17-17z" fill="url(#metal)" stroke="#ffe4a1" stroke-width="4"/><path d="M50 23v56M30 40l20 15 20-15" fill="none" stroke="#ffecb3" stroke-width="3"/>';
const gloves='<path d="M26 78l-9-28 2-25 9-3 7 23 2-32 9-2 4 35 7-29 10 2-4 31 9-22 8 6-10 45z" fill="url(#metal)" stroke="#f8ddac" stroke-width="3"/>';
const boots='<path d="M23 16h23v41l9 13 2 16H9V65l14-8zM62 16h21v44l10 11v15H54V66l8-7z" fill="url(#metal)" stroke="#f4d2a1" stroke-width="3"/>';
const pants='<path d="M28 11h44l8 74H56l-6-35-6 35H20z" fill="url(#metal)" stroke="#f5d9a2" stroke-width="3"/>';
const food='<path d="M15 49h70L75 83H25z" fill="url(#metal)" stroke="#ffe6ad" stroke-width="3"/><path d="M20 47q30-28 60 0" stroke="#ffc05e" stroke-width="7" fill="none"/><path d="M37 32q-12-12 0-24M53 31q-12-12 0-24M69 32q-12-12 0-24" fill="none" stroke="#f2e1ff" stroke-width="3"/>';
const anvil='<path d="M8 40h84l-20 17H28zM35 57h30v18H35zM24 75h52v12H24z" fill="url(#metal)" stroke="#ffe2b1" stroke-width="3"/><path d="M40 20l17 17M56 12l15 14" stroke="#ffd17c" stroke-width="7" stroke-linecap="round"/>';
const pick='<path d="M34 22l52 55" fill="none" stroke="#ffc987" stroke-width="8"/><path d="M18 23Q52 2 86 30L55 27Q38 40 18 23z" fill="url(#metal)" stroke="#d5eaff" stroke-width="3"/>';
const bottleLab='<path d="M41 9h18v24l16 38Q80 92 50 92 20 92 25 71l16-38z" fill="url(#glass)" stroke="#ffe7af" stroke-width="3"/><path d="M27 67q26-15 46 0l5 15q-25 19-52 0z" fill="url(#liquid)"/><path d="M37 10h26" stroke="#ffd98f" stroke-width="7"/>';
const shapes={
 item_hp_potion:potion,item_mp_potion:potion,
 item_herb:leaves,item_ore:crystal,item_wood:log,item_fish:fish,item_ingot:ingot,
 item_blade_blank:blade,item_seed:'<path d="M50 22q-26-6-26 23 4 23 26 41 22-18 26-41 0-29-26-23z" fill="url(#liquid)" stroke="#faffb7" stroke-width="3"/>'+leaves,
 item_bag_upgrade:'<path d="M23 31L50 13l27 18v43L50 90 23 74z" fill="none" stroke="#ffe8b8" stroke-width="6"/><path d="M50 20v62M28 52h44" fill="none" stroke="#d678ff" stroke-width="6"/>',
 item_training_sword:blade,item_training_shield:shield,item_training_greatsword:'<g transform="translate(-9 -7) scale(1.16)">'+blade+'</g>',
 profession_recoleccion:leaves,profession_mineria:crystal+pick,profession_tala:log,
 profession_pesca:fish,profession_cocina:food,profession_alquimia:bottleLab,
 profession_fundicion:ingot+'<path d="M12 89h76" stroke="#ffb54a" stroke-width="6"/>',profession_forja:anvil,
 slot_helmet:helmet,slot_chest:armor,slot_gloves:gloves,slot_right_hand:blade,
 slot_necklace:ring,slot_shoulders:armor,slot_pants:pants,slot_boots:boots,
 slot_left_hand:shield,slot_ring:ring
};
export const PREMIUM_VECTOR_IDS=Object.freeze(Object.keys(shapes));
export function premiumVectorArt(name,large=false){
 const shape=shapes[name];if(!shape)return null;
 const pair=colors[name]||['#a878ff','#fff1d5'];
 const tag='hfvec_'+name.replace(/[^a-z0-9_]/gi,'_');
 return '<svg class="hf-rpg-art hf-premium-vector'+(large?' is-large':'')+'" data-hf-art-id="' + name + '" viewBox="0 0 100 100" fill="none" role="img" aria-label="'+name.replaceAll('_',' ')+'" xmlns="http://www.w3.org/2000/svg">'+
 '<defs><linearGradient id="'+tag+'_metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fffbdc"/><stop offset=".22" stop-color="'+pair[1]+'"/><stop offset=".58" stop-color="'+pair[0]+'"/><stop offset="1" stop-color="#3b1b71"/></linearGradient>'+
 '<radialGradient id="'+tag+'_liquid"><stop stop-color="'+pair[1]+'"/><stop offset=".6" stop-color="'+pair[0]+'"/><stop offset="1" stop-color="#211149"/></radialGradient>'+
 '<linearGradient id="'+tag+'_glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f1f9ff" stop-opacity=".9"/><stop offset=".25" stop-color="'+pair[0]+'" stop-opacity=".25"/><stop offset=".8" stop-color="#16114e" stop-opacity=".35"/><stop offset="1" stop-color="#eeeaff" stop-opacity=".8"/></linearGradient></defs>'+
 '<g transform="translate(50 50) scale(.79) translate(-50 -50)" style="--icon-accent:'+pair[0]+'">'+shape.replaceAll('url(#metal)','url(#'+tag+'_metal)').replaceAll('url(#liquid)','url(#'+tag+'_liquid)').replaceAll('url(#glass)','url(#'+tag+'_glass)')+'</g>'+
 '<path d="M77 16v12M71 22h12M16 65v9M11 69h10" stroke="'+pair[1]+'" stroke-width="1.8" opacity=".8"/></svg>';
}
