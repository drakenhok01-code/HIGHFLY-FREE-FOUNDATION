import {paintCartographicBackdrop,paintP564Atlas} from './p494-cartographic-map.mjs';
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
 for(const n of Object.values(game?.strings?.nodes??{}))if(finite(n.x)&&finite(n.z))targets.push({id:'pylon:'+n.id,x:n.x,z:n.z,label:'Faro '+n.id,detail:'Estación de Cuerdas de Luz',kind:'pylon'});
 const regions=globalThis.__hfP555Regions;for(const q of regions?.regions??[])targets.push({id:'region:'+q.seed,x:q.x,z:q.z,label:q.city?.name??'Región '+q.seed,detail:q.city?.theme??'Exploración libre',kind:'region'});
 for(const n of globalThis.__hfNativePopulation?.residents??[])if(n.stylist&&!n.indoors&&finite(n.x)&&finite(n.z))targets.push({id:'stylist:'+n.id,x:n.x,z:n.z,label:'Estilista',detail:'Forja de personaje',kind:'npc'});
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
 // Tap opens the real-world map instead of silently switching quest.
 let modal=null,largeCanvas=null,mapCaption=null,mapScale=.28;
 const openMap=()=>{
  if(modal)return;
  modal=document.createElement('div');modal.id='hf-p493-radar-modal';
  modal.innerHTML='<section class="hf-map-sheet" role="dialog" aria-modal="true" aria-label="Mapa de Aetheria">'+
   '<header><b>✦ AETHERIA · MAPA DE EXPLORACIÓN</b><button data-in>+</button><button data-out>−</button><button data-close>✕ CERRAR</button></header>'+
   '<canvas width="672" height="286" aria-label="Mapa local de terreno con posición, NPC y misiones"></canvas>'+
   '<div class="hf-map-caption">El triángulo cian indica tu posición; tocá un marcador para fijar el objetivo.</div></section>';
  document.body.appendChild(modal);largeCanvas=modal.querySelector('canvas');
  mapCaption=modal.querySelector('.hf-map-caption');
  modal.querySelector('[data-close]').addEventListener('click',closeMap);modal.querySelector('[data-in]').onclick=()=>{mapScale=Math.min(.95,mapScale*1.5);renderMap()};modal.querySelector('[data-out]').onclick=()=>{mapScale=Math.max(.035,mapScale/1.5);renderMap()};
  modal.addEventListener('click',e=>{if(e.target===modal)closeMap();});
  largeCanvas.addEventListener('click',e=>{
   const rect=largeCanvas.getBoundingClientRect(),g=globalThis.__game,p=g?.player?.pos;
   if(!p)return;
   const x=(e.clientX-rect.left)*672/rect.width,y=(e.clientY-rect.top)*286/rect.height;
   let best=null,dd=22*22;
   for(const q of collectHighflyRadarTargets(g)){
    const px=336+(q.x-p.x)*mapScale,py=143+(q.z-p.z)*mapScale,d=(px-x)**2+(py-y)**2;
    if(d<dd){best=q;dd=d;}
   }
   if(best){targetId=best.id;try{localStorage.setItem('hf-p492-radar-target',targetId);}catch{}}
   renderMap();
  });
  renderMap();
 };
 const closeMap=()=>{modal?.remove();modal=largeCanvas=mapCaption=null;};
 shell.addEventListener('click',()=>{if(!t.editing)openMap();});
 function renderMap(){
  const g=globalThis.__game,p=g?.player?.pos,c=largeCanvas,ctx=c?.getContext('2d');
  if(!ctx||!p)return;
  const W=c.width,H=c.height,scale=mapScale,terrain=g.world;
  paintP564Atlas(ctx,g,W,H,scale);
  const points=[...collectHighflyRadarTargets(g)];
  for(const n of g.people?.list??[])if(n.awake)points.push({x:n.x,z:n.z,label:n.def.name,kind:'npc',id:'npc:'+n.def.id});
  for(const q of points){
   const x=W/2+(q.x-p.x)*scale,y=H/2+(q.z-p.z)*scale;
   if(x<6||y<6||x>W-6||y>H-6)continue;
   dot(ctx,x,y,q.id===targetId?7:4,q.kind==='quest'?'#d9a4ff':q.kind==='npc'?'#a3cdf8':q.kind==='region'?'#9ce0b2':'#eacd82');
   if(q.id===targetId){ctx.fillStyle='#ffffff';ctx.font='bold 13px system-ui';ctx.fillText(q.label,x+9,y-7);}
  }
  ctx.save();ctx.translate(W/2,H/2);ctx.rotate(Math.PI-(g.rig?.yaw??0));
  ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(8,9);ctx.lineTo(0,3);ctx.lineTo(-8,9);ctx.closePath();
  ctx.fillStyle='#67eef9';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.restore();
  const chosen=points.find(q=>q.id===targetId);
  if(mapCaption)mapCaption.textContent='POSICIÓN X '+Math.round(p.x)+' · Z '+Math.round(p.z)+
   ' · '+(chosen?chosen.label+' · '+Math.round(dist(p,chosen))+' m':'Tocá un NPC o misión para fijar objetivo');
 }

 function draw(){
  const g=globalThis.__game,p=g?.player?.pos;if(!g||!p||!ctx)return;
  if(root.hidden)return;
  const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=R;
  ctx.clearRect(0,0,w,h);
  ctx.save();ctx.translate(cx,cy);
  ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.clip();
  ctx.fillStyle='#101729';ctx.fillRect(-r,-r,r*2,r*2);ctx.save();ctx.translate(-r,-r);paintP564Atlas(ctx,g,r*2,r*2,r/RANGE);ctx.restore();
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
  for(const t of targets)if((t.kind==='pylon'||t.kind==='region')&&dist(t,p)<=RANGE){const q=radarProject(p,t);dot(ctx,q.x,q.y,4,t.kind==='pylon'?'#f3d479':'#9ce0b2')}
  let chosen=targets.find(o=>o.id===targetId);
  if(!chosen){
   chosen=targets.filter(q=>q.kind==='quest'||q.kind==='story').reduce((best,item)=>!best||dist(item,p)<dist(best,p)?item:best,null);
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
  update(){if(++frame%8===1){draw();if(modal)renderMap();}}};
 t.radar=api;draw();return api;
}
