/**
 * HIGHFLY single-player CC0 Knight FREE equipment preview.
 * Uses ONLY weapon/gear meshes already embedded in the pinned Knight GLB.
 * Each mode changes VISIBLE meshes + visual animation profile, not class,
 * rig, base stats, damage formula or collision. Other weapons need adapters.
 */
export const WEAPON_MODES=Object.freeze([
 {id:'sword',label:'Espada',main:'1H_Sword',off:null,style:'onehand'},
 {id:'greatsword',label:'Mandoble',main:'2H_Sword',off:null,style:'twohand'},
 {id:'dual',label:'Dos espadas',main:'1H_Sword',off:'1H_Sword_Offhand',style:'dual'},
 {id:'shield',label:'Espada y escudo',main:'1H_Sword',off:'Round_Shield',style:'onehand'},
 {id:'unarmed',label:'Sin armas',main:null,off:null,style:'unarmed'},
 {id:'spear',label:'Lanza Emberfall',main:null,off:null,style:'spear',external:'spear'},
 {id:'staff',label:'Bastón Emberfall',main:null,off:null,style:'staff',external:'staff'}
]);
export const EQUIPMENT_NODES=Object.freeze([
 '1H_Sword','2H_Sword','1H_Sword_Offhand',
 'Badge_Shield','Rectangle_Shield','Round_Shield','Spike_Shield'
]);
export const WEAPON_ANIMATIONS=Object.freeze({
 onehand:['1H_Melee_Attack_Slice_Horizontal','1H_Melee_Attack_Chop','1H_Melee_Attack_Slice_Diagonal'],
 twohand:['2H_Melee_Attack_Slice','2H_Melee_Attack_Chop','2H_Melee_Attack_Spin'],
 dual:['Dualwield_Melee_Attack_Slice','Dualwield_Melee_Attack_Chop','Dualwield_Melee_Attack_Stab'],
 unarmed:['Unarmed_Melee_Attack_Punch_A','Unarmed_Melee_Attack_Punch_B','Unarmed_Melee_Attack_Kick'],
 spear:['2H_Melee_Attack_Stab','1H_Melee_Attack_Stab','2H_Melee_Attack_Slice'],
 staff:['Spellcast_Shoot','Spellcast_Raise','Spellcast_Long']
});
export function weaponMode(index){return WEAPON_MODES[((Math.trunc(index)||0)%WEAPON_MODES.length+WEAPON_MODES.length)%WEAPON_MODES.length];}
export function applyEquipment(hero,index){
 const mode=weaponMode(index);
 const all=hero.gearNodes;
 if(!all?.has('1H_Sword')||!all?.has('2H_Sword')||!all?.has('1H_Sword_Offhand')||!all?.has('Round_Shield'))
  throw Error('Knight FREE equipment mesh slots incomplete');
 for(const node of all.values())node.visible=false;
 for(const node of hero.extraWeapons?.values()??[])node.visible=false;
 if(mode.external&&hero.extraWeapons?.get(mode.external))
  hero.extraWeapons.get(mode.external).visible=true;
 if(mode.main)all.get(mode.main).visible=true;
 if(mode.off)all.get(mode.off).visible=true;
 hero.sword=mode.main?all.get(mode.main):null;
 hero.swordMeshes=mode.main?1:0;
 hero.weaponMode=mode;
 return mode;
}
