/** HIGHFLY P4.9.2: small live HUD radar.
 * Uses real-world X/Z, live Unsung enemies/NPCs and P4.9 hunt state.
 * No fictitious pins, no teleport and no substitute for native world map.
 */
const R=83, RANGE=145, TAU=Math.PI*2;
const finite=n=>Number.isFinite(Number(n));
const short=s=>String(s||'Destino').slice(0,31);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const questState=(q,id)=>q?.state?.[id]?.s;
export function collectHighflyRadarTargets(game){
 const targets=[],hunt=game?.__highflyHunts;
 if(hunt?.spots){
  for(const id of ['wolf','boar','crab']){
   const spot=hunt.spots[id],mission=hunt.state?.missions?.[id],q=hunt.missions?.[id];
   if(!spot||!mission||!q||mission.status==='done')continue;
   const npc=mission.status!=='active';
   const pos=npc?spot.npc:spot.point;
   targets.push({id:'hunt:'+id,x:pos.x,z:pos.z,label:(npc?'NPC ':'CAZA ')+q.npc,
    detail:mission.status==='ready'?'Entregar misión':mission.status==='active'?
    mission.count+'/'+q.count+' · '+q.title:'Aceptar · '+q.title,kind:'quest'});
  }
 }
 for(const q of game?.quests?.active??[]){
  if(questState(game.quests,q.id)!=='ready')continue;
  const n=game?.people?.get?.(q.giver);
  if(n?.awake)targets.push({id:'unsung:'+q.id,x:n.x,z:n.z,
   label:'NPC '+n.def.name,detail:'Entregar · '+q.title,kind:'quest'});
 }
 const spires=game?.spires??[];
 const next=spires.find(s=>!s.tuned);
 if(next&&finite(next.x)&&finite(next.z))
  targets.push({id:'story:'+next.id,x:next.x,z:next.z,
   label:'Historia · '+(next.name??next.id),detail:'Siguiente aguja',kind:'story'});
 return targets;
}
export function radarProject(hero,point,radius=R,worldRange=RANGE){
 const dx=Number(point.x)-Number(hero.x),dz=Number(point.z)-Number(hero.z);
 const d=Math.hypot(dx,dz),scale=radius/worldRange;
 const k=d>worldRange?worldRange/Math.max(1e-5,d):1;
 return {x:dx*k*scale,y:-dz*k*scale,distance:d,edge:d>worldRange};
}
function dot(ctx,x,y,r,color){
 ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fillStyle=color;ctx.fill();
}
export function installHighflyRadar(input,t){
 const root=t?.root;if(!root||t.radar||typeof root.appendChild!=='function'||typeof document?.createElement!=='function')return t?.radar??null;
 const shell=document.createElement('div');shell.className='hf-radar';shell.setAttribute('aria-label','Radar de Aetheria · tocar para cambiar objetivo');
 shell.innerHTML='<div class="hf-radar-head">◈ AETHERIA · RADAR</div>'+
  '<canvas class="hf-radar-canvas" width="190" height="190" aria-hidden="true"></canvas>'+
  '<div class="hf-radar-target">Explorá el mundo</div>';
 root.appendChild(shell);
 const canvas=shell.querySelector('canvas'),ctx=canvas.getContext('2d');
 const caption=shell.querySelector('.hf-radar-target');
 let targetId=null,frame=0,lastLabel='',lastDistance=-1;
 try{targetId=localStorage.getItem('hf-p492-radar-target')||null;}catch{}
 const choose=()=>{
  const targets=collectHighflyRadarTargets(globalThis.__game),ids=targets.map(q=>q.id);
  targetId=ids.length?ids[(Math.max(-1,ids.indexOf(targetId))+1)%ids.length]:null;
  try{if(targetId)localStorage.setItem('hf-p492-radar-target',targetId);}catch{}
  draw();
 };
 shell.addEventListener('click',()=>{if(!t.editing)choose();});
 function draw(){
  const g=globalThis.__game,p=g?.player?.pos;if(!g||!p||!ctx)return;
  if(root.hidden)return;
  const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=R;
  ctx.clearRect(0,0,w,h);
  ctx.save();ctx.translate(cx,cy);
  ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.clip();
  ctx.fillStyle='#101729';ctx.fillRect(-r,-r,r*2,r*2);
  ctx.strokeStyle='#43536b';ctx.lineWidth=1;
  for(const circle of [r/3,r*2/3]){ctx.beginPath();ctx.arc(0,0,circle,0,TAU);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();
  // Current live mobs; avoid thousands of dormant world entities.
  for(const e of g.enemies?.list??[]){
   if(!e.alive||!e.pos||dist(e.pos,p)>RANGE)continue;
   const q=radarProject(p,e.pos);dot(ctx,q.x,q.y,2.4,
    String(e.kind).startsWith('hf_')?'#ffb477':'#e6869c');
  }
  // Native people remain mission-compatible; HIGHFLY hunt NPCs are added separately.
  for(const n of g.people?.list??[]){
   if(!n.awake||dist(n,p)>RANGE)continue;
   const q=radarProject(p,n);dot(ctx,q.x,q.y,3,'#bcd9ff');
  }
  for(const spot of Object.values(g.__highflyHunts?.spots??{})){
   if(!spot.npc||dist(spot.npc,p)>RANGE)continue;
   const q=radarProject(p,spot.npc);dot(ctx,q.x,q.y,4,'#b78bff');
  }
  const targets=collectHighflyRadarTargets(g);
  let chosen=targets.find(o=>o.id===targetId);
  if(!chosen){
   chosen=targets.reduce((best,item)=>!best||dist(item,p)<dist(best,p)?item:best,null);
   targetId=chosen?.id??null;
  }
  if(chosen){
   const q=radarProject(p,chosen);
   ctx.beginPath();ctx.moveTo(q.x,q.y-7);ctx.lineTo(q.x+6,q.y);ctx.lineTo(q.x,q.y+7);ctx.lineTo(q.x-6,q.y);ctx.closePath();
   ctx.fillStyle=chosen.kind==='story'?'#e8cb82':'#bd86ff';ctx.fill();
   ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.stroke();
   const d=Math.round(q.distance),label=short(chosen.label);
   if(label!==lastLabel||Math.abs(d-lastDistance)>3){
    caption.textContent=label+' · '+d+' m';
    caption.title=chosen.detail;
    lastLabel=label;lastDistance=d;
   }
  }else if(lastLabel){caption.textContent='Explorá el mundo';lastLabel='';}
  // Always show the real heading from the native third-person camera.
  ctx.save();ctx.rotate(Math.PI-(g.rig?.yaw??g.player?.yaw??0));
  ctx.fillStyle='#7cf5f4';ctx.strokeStyle='#ffffff';ctx.lineWidth=1.6;
  ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(7,7);ctx.lineTo(0,4);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.restore();
  ctx.restore();
  ctx.strokeStyle='#9c77d4';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r+2,0,TAU);ctx.stroke();
  ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#f5ddaa';ctx.fillText('N',cx,cy-r-5);
 }
 const api={node:shell,draw,choose,targets:()=>collectHighflyRadarTargets(globalThis.__game),dispose:()=>shell.remove(),
  update(){if(++frame%8===1)draw();}};
 t.radar=api;draw();return api;
}
