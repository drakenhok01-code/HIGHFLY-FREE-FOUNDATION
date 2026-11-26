export const isSeat=id=>['kenney-graveyard/bench','kaykit-dungeon/stool'].includes(id);
export const isMaritime=id=>['kenney-pirate/structure-platform','kenney-pirate/boat-row-small','kenney-pirate/boat-row-large','kenney-pirate/ship-small'].includes(id);
// Independent compact road mask rasterized from actual source triangles.
export function roadMask(paths,p,b,{step=.65,pad=.8,maxSide=2048}={}){
 const w=Math.max(2,Math.min(maxSide,Math.ceil((b.maxX-b.minX)/step))),h=Math.max(2,Math.min(maxSide,Math.ceil((b.maxZ-b.minZ)/step)));
 const dx=(b.maxX-b.minX)/w,dz=(b.maxZ-b.minZ)/h,buf=new Uint8Array(w*h),margin=pad+Math.hypot(dx,dz)*.5;
 const seg=(x,z,a,c)=>{const u=c[0]-a[0],v=c[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*u+(z-a[1])*v)/(u*u+v*v||1)));return Math.hypot(x-a[0]-t*u,z-a[1]-t*v)};
 const cross=(a,c,x,z)=>(c[0]-a[0])*(z-a[1])-(c[1]-a[1])*(x-a[0]);
 for(let i=0;i+8<paths.length;i+=9){
  const q=[0,3,6].map(j=>[p.x+paths[i+j]*p.scale,p.z+paths[i+j+2]*p.scale]);if(!q.flat().every(Number.isFinite))continue;
  const [a,c,d]=q,area=cross(a,c,d[0],d[1]);if(Math.abs(area)<1e-7)continue;
  const x0=Math.max(0,Math.floor((Math.min(...q.map(t=>t[0]))-margin-b.minX)/dx)),x1=Math.min(w-1,Math.floor((Math.max(...q.map(t=>t[0]))+margin-b.minX)/dx));
  const z0=Math.max(0,Math.floor((Math.min(...q.map(t=>t[1]))-margin-b.minZ)/dz)),z1=Math.min(h-1,Math.floor((Math.max(...q.map(t=>t[1]))+margin-b.minZ)/dz));
  for(let j=z0;j<=z1;j++)for(let k=x0;k<=x1;k++){if(buf[j*w+k])continue;const x=b.minX+(k+.5)*dx,z=b.minZ+(j+.5)*dz,sign=Math.sign(area);
   if([cross(a,c,x,z),cross(c,d,x,z),cross(d,a,x,z)].every(v=>v*sign>=0)||Math.min(seg(x,z,a,c),seg(x,z,c,d),seg(x,z,d,a))<=margin)buf[j*w+k]=255;
  }
 }return {w,h,buf};
}
