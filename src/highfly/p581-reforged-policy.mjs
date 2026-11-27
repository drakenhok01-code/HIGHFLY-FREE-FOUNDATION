// Pure policies: no renderer or game-side state. All distances in world metres.
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function edgeDistance(p,x,z){const b=p.bounds;return Math.hypot(Math.max(b.minX-x,0,x-b.maxX),Math.max(b.minZ-z,0,z-b.maxZ))}
export function approach(p,pos,vel,seconds=24){
 const speed=Math.hypot(vel.x,vel.z),now=edgeDistance(p,pos.x,pos.z);
 // Sample the swept route, not merely its endpoint (fast flight can cross an island).
 let closest=now,eta=Infinity;
 for(let t=0;t<=seconds;t+=.5){const d=edgeDistance(p,pos.x+vel.x*t,pos.z+vel.z*t);closest=Math.min(closest,d);if(d<160&&eta===Infinity)eta=t}
 const approaching=closest<now-15;
 return {seed:p.seed,now,closest,eta,approaching,prefetch:now<850||approaching&&closest<350,mount:now<550||approaching&&eta<=12,speed};
}
export function selectApproach(placements,pos,vel,active){
 const candidates=placements.map(p=>approach(p,pos,vel)).filter(q=>q.seed!==active&&q.prefetch);
 candidates.sort((a,b)=>Number(b.mount)-Number(a.mount)||a.eta-b.eta||a.closest-b.closest||a.now-b.now);
 return candidates[0]??null;
}
export function affinityOnce(state,event,delta){
 if(!state||typeof event!=='string'||!event||!Number.isFinite(delta))return false;
 state.decisions??={};if(Object.hasOwn(state.decisions,event))return false;
 state.decisions[event]=true;
 state.affinity=clamp((Number(state.affinity)||0)+delta,-100,100);return true;
}
export function relationship(n){return n<=-40?'Hostil':n<0?'Distante':n<10?'Neutral':n<30?'Amable':n<55?'Amigo':n<80?'Aliado':'Leal'}
export function npcBudget(frameMs,previous=16){
 if(frameMs>34)return Math.max(10,previous-2);
 if(frameMs<19)return Math.min(24,previous+1);
 return previous;
}
