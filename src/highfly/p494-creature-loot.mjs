/** HIGHFLY P4.9.4. A SINGLE physical animal corpse is the loot container.
 * Original enemy AI and death event remain authoritative. Items start at +0.
 */
export const CORPSE_TIMEOUT=52;
export const SPECIES_LOOT=Object.freeze({
 hf_wolf:Object.freeze({item:'wolf_pelt',name:'Piel de lobo',verb:'DESOLLAR LOBO'}),
 hf_boar:Object.freeze({item:'boar_tusk',name:'Colmillo de jabalí',verb:'RECOGER COLMILLO'}),
 hf_crab:Object.freeze({item:'crab_shell',name:'Caparazón de cangrejo',verb:'RECOGER CAPARAZÓN'})
});
export function corpseLootFor(enemy){return SPECIES_LOOT[enemy?.kind]??null;}
export function closestLootableCorpse(corpses,hero,reach=3.3){
 if(!hero)return null;
 let best=null,d=reach;
 for(const c of corpses??[]){
  if(c.collected||c.expiresAt<=c.now||!c.avatar?.root?.visible)continue;
  const p=c.enemy?.pos??c.pos;if(!p)continue;
  const dx=p.x-hero.x,dz=p.z-hero.z,dd=Math.hypot(dx,dz);
  if(dd<d&&Math.abs((p.y??0)-(hero.y??0))<3.5){d=dd;best=c;}
 }
 return best;
}
