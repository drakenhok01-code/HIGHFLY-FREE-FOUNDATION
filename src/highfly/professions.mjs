/** HIGHFLY profession lab F0.12.1 — deterministic, synthetic resources only.
 * No KayKit SOURCE assets, no arbitrary trees or rock walls converted to loot.
 * All transactions commit exactly ONCE when the animation completes.
 */
export const PROFESSION_RULES=Object.freeze({
 chop:  {kind:'tree',tool:'axe',seconds:.8,product:'wood',amount:2},
 mine:  {kind:'ore',tool:'pickaxe',seconds:.9,product:'ore',amount:2},
 fishing:{kind:'fishSpot',tool:'rod',seconds:1.6,product:'fish',amount:1},
 plant: {kind:'soil',tool:'hoe',seconds:.85,requires:{seed:1}},
 water: {kind:'soil',tool:'watering_can',seconds:.8},
 harvest:{kind:'soil',tool:null,seconds:.9,product:'herb',amount:2},
 smelt:{kind:'furnace',tool:null,seconds:1.5,requires:{ore:2},product:'ingot',amount:1},
 forge:{kind:'forge',tool:'hammer',seconds:1.7,requires:{ingot:2},product:'blade_blank',amount:1}
});
export const WORK_TARGET_ACTION=Object.freeze({
 tree:'chop',ore:'mine',fishSpot:'fishing',furnace:'smelt',forge:'forge'
});
export function professionState(inventory={},tools=[]){
 const clean={};for(const [id,n] of Object.entries(inventory))
  if(Number.isInteger(n)&&n>=0)clean[id]=n;
 return {inventory:clean,tools:new Set(tools),completed:0};
}
export function professionActionFor(target){
 if(!target||target.available===false)return null;
 if(target.kind==='soil'){
  if(target.phase==='empty'||!target.phase)return 'plant';
  if(target.phase==='seeded')return 'water';
  if(target.phase==='ripe')return 'harvest';
  return null; // growing is NOT automatically harvestable
 }
 return WORK_TARGET_ACTION[target.kind]??null;
}
export function findProfessionTarget(world,pos,yaw,action=null,reach=2.65){
 if(!world||!pos||!Array.isArray(world.highflyInteractables))return null;
 const fx=Math.sin(yaw),fz=Math.cos(yaw);let best=null,dist=reach*reach;
 for(const node of world.highflyInteractables){
  if(!node||typeof node.id!=='string'||!Number.isFinite(node.x)||!Number.isFinite(node.z))continue;
  if(node.available===false)continue;
  if(action&&professionActionFor(node)!==action)continue;
  if(!professionActionFor(node))continue;
  const dx=node.x-pos.x,dz=node.z-pos.z,ds=dx*dx+dz*dz;
  if(ds<dist&&dx*fx+dz*fz>.1){best=node;dist=ds;}
 }
 return best;
}
export function prepareProfession(state,world,action,pos,yaw){
 const rule=PROFESSION_RULES[action];
 if(!rule)return {ok:false,reason:'unknown-action'};
 const node=findProfessionTarget(world,pos,yaw,action);
 if(!node)return {ok:false,reason:'no-real-target'};
 if(!state)return {ok:false,reason:'no-profession-state'};
 if(rule.tool&&!state.tools?.has(rule.tool))return {ok:false,reason:'missing-tool',tool:rule.tool};
 for(const [item,n] of Object.entries(rule.requires??{}))
  if((state.inventory?.[item]??0)<n)return {ok:false,reason:'missing-item',item};
 return {ok:true,job:{action,id:node.id,seconds:rule.seconds,done:false}};
}
export function commitProfession(state,world,job){
 if(!job||job.done)return {ok:false,reason:'already-committed'};
 const rule=PROFESSION_RULES[job.action];
 if(!rule)return {ok:false,reason:'unknown-action'};
 const node=world?.highflyInteractables?.find(n=>n.id===job.id);
 if(!node||node.available===false||professionActionFor(node)!==job.action)
  return {ok:false,reason:'invalidated-target'};
 if(rule.tool&&!state.tools?.has(rule.tool))return {ok:false,reason:'missing-tool'};
 for(const [item,n] of Object.entries(rule.requires??{}))
  if((state.inventory?.[item]??0)<n)return {ok:false,reason:'missing-item'};
 for(const [item,n] of Object.entries(rule.requires??{}))state.inventory[item]-=n;
 if(rule.product)state.inventory[rule.product]=(state.inventory[rule.product]??0)+(rule.amount??1);
 switch(job.action){
  case 'chop':case 'mine':case 'fishing':
   node.charges=(node.charges??1)-1;
   if(node.charges<=0){node.charges=0;node.available=false;}
   break;
  case 'plant':node.phase='seeded';node.growth=0;break;
  case 'water':node.phase='growing';node.growth=0;break;
  case 'harvest':node.phase='empty';node.growth=0;break;
 }
 job.done=true;state.completed=(state.completed??0)+1;
 return {ok:true,action:job.action,product:rule.product??null,amount:rule.amount??0,
  inventory:{...state.inventory},target:node.id};
}
export function advanceCrops(world,seconds){
 if(!Number.isFinite(seconds)||seconds<=0)return 0;
 let ripe=0;
 for(const node of world?.highflyInteractables??[]){
  if(node.kind!=='soil'||node.phase!=='growing')continue;
  node.growth=(node.growth??0)+seconds;
  if(node.growth>=(node.growSeconds??12)){node.phase='ripe';ripe++;}
 }
 return ripe;
}
