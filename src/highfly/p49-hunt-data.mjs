/**
 * HIGHFLY P4.9 — original Three Hunts of Aetheria.
 * Pure, offline-first data. No source assets or logic borrowed from ClaudeCraft.
 * Existing Unsung quests remain fully independent.
 */
export const HUNT_SAVE_KEY = 'highfly-hunts-p49-v1';
export const HUNT_MOBS = Object.freeze({
 wolf:Object.freeze({id:'wolf',kind:'hf_wolf',name:'Lobo del Bosque',
  zone:'Bosque de los Susurros',anchor:Object.freeze({x:-262,z:-440}),
  xp:12,hp:44,damage:9,speed:5.2,loot:'wolf_pelt',dropName:'Piel de lobo'}),
 boar:Object.freeze({id:'boar',kind:'hf_boar',name:'Jabalí de la Pradera',
  zone:'Praderas de Arvelia',anchor:Object.freeze({x:-350,z:400}),
  xp:14,hp:72,damage:12,speed:3.6,loot:'boar_tusk',dropName:'Colmillo de jabalí'}),
 crab:Object.freeze({id:'crab',kind:'hf_crab',name:'Cangrejo de la Orilla',
  zone:'Costa del Valle',anchor:Object.freeze({x:270,z:85}),
  xp:10,hp:32,damage:7,speed:2.8,loot:'crab_shell',dropName:'Caparazón de cangrejo'})
});
export const HUNT_MISSIONS=Object.freeze({
 wolf:Object.freeze({id:'hf_wolf',mob:'wolf',npc:'Sera',role:'Exploradora de Aetheria',
  title:'Aullidos en el bosque',count:3,bonusXp:50,bonusItem:'hp_potion',
  introduction:'Los lobos se acercan demasiado a los caminos del valle. Eliminá tres y volvé para informarme.',
  progress:'El bosque necesita un respiro. Regresá cuando hayas derrotado a tres lobos.',
  thanks:'Los viajeros volverán a cruzar el bosque con mayor seguridad. El gremio recordará tu ayuda.'}),
 boar:Object.freeze({id:'hf_boar',mob:'boar',npc:'Brann',role:'Granjero de Arvelia',
  title:'Los campos amenazados',count:4,bonusXp:65,bonusItem:'hp_potion',
  introduction:'Un grupo de jabalíes está destruyendo los sembrados. Necesito que ahuyentes a cuatro.',
  progress:'Los campos siguen en peligro. Derrotá cuatro jabalíes y regresá.',
  thanks:'Salvaste la cosecha. Puede que nuestro pueblo vuelva a conocer un invierno tranquilo.'}),
 crab:Object.freeze({id:'hf_crab',mob:'crab',npc:'Mira',role:'Pescadora de la Costa',
  title:'Pinzas entre las redes',count:3,bonusXp:50,bonusItem:'mp_potion',
  introduction:'Los cangrejos gigantes destrozan las redes de pesca. Derrotá tres cerca de la orilla.',
  progress:'Todavía necesito que despejes la orilla de esos cangrejos.',
  thanks:'Mis redes están a salvo. Cuando el puerto crezca, tendrás un lugar entre nosotros.'})
});
export const HUNT_ORDER=Object.freeze(['wolf','boar','crab']);
export function xpRequired(level){
 const n=Math.max(1,Math.min(200,Math.floor(Number(level)||1)));
 return 50+n*25;
}
export function createHuntState(raw=null){
 const level=Math.max(1,Math.min(200,Math.floor(Number(raw?.level)||1)));
 const xp=Math.max(0,Math.floor(Number(raw?.xp)||0));
 const totalXp=Math.max(xp,Math.floor(Number(raw?.totalXp)||0));
 const missions={};
 for(const id of HUNT_ORDER){
  const m=raw?.missions?.[id]??{};
  const status=['available','active','ready','done'].includes(m.status)?m.status:'available';
  const count=Math.max(0,Math.min(HUNT_MISSIONS[id].count,Math.floor(Number(m.count)||0)));
  missions[id]={status,count:status==='available'?0:count};
 }
 return {schema:1,level,xp,totalXp,missions};
}
export function gainHuntXp(state,amount){
 if(!Number.isInteger(amount)||amount<=0)return {ok:false,levels:0};
 state.xp+=amount;state.totalXp+=amount;
 let levels=0;
 while(state.level<200&&state.xp>=xpRequired(state.level)){
  state.xp-=xpRequired(state.level);state.level++;levels++;
 }
 return {ok:true,levels,level:state.level,amount};
}
export function acceptHunt(state,id){
 const quest=HUNT_MISSIONS[id],mission=state?.missions?.[id];
 if(!quest||!mission||mission.status!=='available')return false;
 mission.status='active';mission.count=0;return true;
}
export function recordHuntKill(state,id){
 const m=state?.missions?.[id],quest=HUNT_MISSIONS[id];
 if(!m||!quest||m.status!=='active')return false;
 m.count=Math.min(quest.count,m.count+1);
 if(m.count>=quest.count)m.status='ready';
 return true;
}
export function turnInHunt(state,id,bag){
 const m=state?.missions?.[id],quest=HUNT_MISSIONS[id];
 if(!m||!quest||m.status!=='ready'||!bag?.items)return {ok:false};
 // Claim once, despite repeated clicks. The caller saves both ledgers.
 m.status='done';
 const xp=gainHuntXp(state,quest.bonusXp);
 bag.items[quest.bonusItem]=(bag.items[quest.bonusItem]??0)+1;
 return {ok:true,xp,bonusItem:quest.bonusItem};
}
