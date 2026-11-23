/** P494 cartographic world map from ACTUAL Unsung height and water samples.
 * Raster cache recomputes only after 16 world metres, not per frame.
 * No fabricated towns, roads, mountains or quest positions.
 */
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const linear=(a,b,t)=>a+(b-a)*t;
export function cartographicColor(h,wet,slope,light){
 if(wet)return [29+light*7,76+light*12,112+light*18];
 const rocky=clamp((slope-.6)*.6,0,1),height=clamp((h+5)/300,0,1);
 const grass=[40+height*65,79+height*54,72+height*56],stone=[112,112,137];
 let c=grass.map((v,i)=>linear(v,stone[i],rocky));
 if(height>.7)c=c.map((v,i)=>linear(v,190,clamp((height-.7)*1.6,0,.6)));
 return c.map(v=>clamp(v+light,0,255));
}
export function paintCartographicBackdrop(ctx,g,W,H,scale=.28){
 const p=g?.player?.pos,terrain=g?.world;
 if(!ctx||!p||!terrain)return false;
 const cache=ctx.canvas.__highflyP494MapCache;
 const dx=cache?((cache.x-p.x)*scale):0,dz=cache?((cache.z-p.z)*scale):0;
 if(!cache||Math.abs(dx)>15||Math.abs(dz)>15){
  const bw=W+64,bh=H+64,c=document.createElement('canvas');
  c.width=bw;c.height=bh;
  const k=c.getContext('2d',{alpha:false});if(!k)return false;
  k.fillStyle='#13242c';k.fillRect(0,0,bw,bh);
  const unit=3.5;
  // Short coherent hillshade and contours; 3-4px samples, softened once
  // during compositing. ~20k height reads only on a map cache miss.
  for(let x=0;x<bw;x+=unit)for(let y=0;y<bh;y+=unit){
   const wx=p.x+(x-bw/2)/scale,wz=p.z+(y-bh/2)/scale;
   const h=Number(terrain.groundHeight(wx,wz));
   if(!Number.isFinite(h))continue;
   const water=Number(terrain.waterLevel?.(wx,wz));
   const wet=Number.isFinite(water)&&h<water+.3;
   const h2=Number(terrain.groundHeight(wx+10,wz+10)),h3=Number(terrain.groundHeight(wx-10,wz-7));
   const incline=Number.isFinite(h2)&&Number.isFinite(h3)?Math.abs(h2-h3)/24:0;
   const light=clamp((h3-h2)*.85,-23,21);
   const shade=cartographicColor(h,wet,incline,light);
   k.fillStyle='rgb('+shade.map(v=>Math.round(v)).join(',')+')';
   k.fillRect(x,y,unit+1,unit+1);
   if(!wet&&Math.abs((h%18+18)%18)<1.7){
    k.fillStyle='rgba(245,237,215,.075)';k.fillRect(x,y,unit+1,unit+1);
   }
  }
  ctx.canvas.__highflyP494MapCache={canvas:c,x:p.x,z:p.z};
 }
 const now=ctx.canvas.__highflyP494MapCache;
 ctx.clearRect(0,0,W,H);
 const ox=(now.x-p.x)*scale,oy=(now.z-p.z)*scale;
 ctx.save();
 ctx.filter='blur(1px) saturate(1.16)';
 ctx.drawImage(now.canvas,-32+ox,-32+oy);
 ctx.restore();
 // Decorative but grounded compass geometry.
 ctx.strokeStyle='rgba(228,209,242,.13)';ctx.lineWidth=1;
 for(let x=W/2%64;x<W;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
 for(let y=H/2%64;y<H;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
 ctx.strokeStyle='rgba(236,216,166,.54)';ctx.lineWidth=2;ctx.strokeRect(8,8,W-16,H-16);
 ctx.font='700 12px system-ui';ctx.textAlign='left';ctx.fillStyle='#f6e6c0';
 ctx.fillText('AETHERIA  •  CARTOGRAFÍA',18,27);
 ctx.font='600 10px system-ui';ctx.fillStyle='#e6d5f0';
 ctx.fillText('TERRENO REAL • N/↑',18,43);
 return true;
}
