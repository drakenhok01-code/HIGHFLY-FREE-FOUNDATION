/** HIGHFLY 4.9.3 real terrain map; samples the actual Unsung heightfield.
 * It is not an illustration, invented city plan or downloaded map tile.
 */
import {collectHighflyRadarTargets} from './p492-radar.mjs';
const finite=n=>Number.isFinite(n);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function drawHighflyLiveMap(game,canvas,trail=[],zoom=1){
 if(!game?.player?.pos||!canvas?.getContext)return {ok:false};
 const ctx=canvas.getContext('2d'),p=game.player.pos,W=game.world,w=canvas.width,h=canvas.height;
 if(!ctx||!W)return {ok:false};
 const extent=clamp(470/zoom,150,900);
 const mapX=x=>w/2+(x-p.x)*w/(2*extent),mapY=z=>h/2-(z-p.z)*h/(2*extent);
 ctx.fillStyle='#122134';ctx.fillRect(0,0,w,h);
 const gx=48,gy=28,dx=w/gx,dy=h/gy;
 for(let j=0;j<gy;j++)for(let i=0;i<gx;i++){
  const x=p.x+((i+.5)/gx*2-1)*extent,z=p.z-((j+.5)/gy*2-1)*extent;
  const y=W.groundHeight?.(x,z),water=W.waterLevel?.(x,z);
  if(!finite(y)){ctx.fillStyle='#0b152b';}
  else if(finite(water)&&water>y+.2)ctx.fillStyle='#22506c';
  else if(y<0)ctx.fillStyle='#33516a';
  else if(y>150)ctx.fillStyle='#69646c';
  else if(y>55)ctx.fillStyle='#455d58';
  else ctx.fillStyle='#334b42';
  ctx.fillRect(Math.floor(i*dx),Math.floor(j*dy),Math.ceil(dx+1),Math.ceil(dy+1));
 }
 ctx.lineWidth=1;ctx.strokeStyle='#ddd4f128';
 for(let i=1;i<8;i++){ctx.beginPath();ctx.moveTo(i*w/8,0);ctx.lineTo(i*w/8,h);ctx.stroke();}
 for(let j=1;j<5;j++){ctx.beginPath();ctx.moveTo(0,j*h/5);ctx.lineTo(w,j*h/5);ctx.stroke();}
 // Travelled path is sampled from the actual player coordinates, never simulated.
 if(trail.length>1){
  ctx.strokeStyle='#6cf1dd';ctx.lineWidth=2.5;ctx.beginPath();
  trail.forEach((n,i)=>{const x=mapX(n.x),y=mapY(n.z);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
  ctx.stroke();
 }
 const point=(x,z,color,r,label)=>{
  const px=mapX(x),py=mapY(z);if(px<-12||py<-12||px>w+12||py>h+12)return;
  ctx.beginPath();ctx.arc(px,py,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  ctx.strokeStyle='#ebf7ff';ctx.lineWidth=1;ctx.stroke();
  if(label){ctx.font='bold 12px system-ui';ctx.fillStyle='#ffffff';ctx.textAlign='left';ctx.fillText(label,px+r+5,py+4);}
 };
 for(const n of game.people?.list??[])if(n.awake)point(n.x,n.z,'#95b9ff',3,'');
 for(const [id,s] of Object.entries(game.__highflyHunts?.spots??{})){
  if(s.point)point(s.point.x,s.point.z,'#ef976c',4,id==='wolf'?'Lobos':id==='boar'?'Jabalíes':'Cangrejos');
  if(s.npc)point(s.npc.x,s.npc.z,'#b28cff',5,game.__highflyHunts?.missions?.[id]?.npc??id);
 }
 for(const q of collectHighflyRadarTargets(game))point(q.x,q.z,q.kind==='story'?'#f3d989':'#cba1f1',5,'');
 ctx.save();ctx.translate(w/2,h/2);
 ctx.rotate(Math.PI-(game.rig?.yaw??game.player?.yaw??0));
 ctx.fillStyle='#7ffaf3';ctx.strokeStyle='#071c2b';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(9,10);ctx.lineTo(0,5);ctx.lineTo(-9,10);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.restore();
 ctx.font='bold 11px system-ui';ctx.fillStyle='#f5e0b3';ctx.textAlign='left';
 ctx.fillText('N ↑ · Centro: tu posición · Alcance '+Math.round(extent)+' m',12,20);
 return {ok:true,player:{x:p.x,z:p.z},targetCount:collectHighflyRadarTargets(game).length,trailPoints:trail.length};
}
