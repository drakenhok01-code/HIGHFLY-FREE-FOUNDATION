// Read-only numerical audit of the P575 terrain and source walkways, not a controller test.
import fs from 'node:fs';
import {makeRegionSampler} from '../src/highfly/p553-region-sampler.mjs';
const dir='dist/highfly/regions-p575',out='p576-audit';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const meta=read(out+'/meta.json'),raw=Object.fromEntries(['core','region'].map(k=>{const b=fs.readFileSync(out+'/'+k+'.bin');return [k,new Float32Array(b.buffer,b.byteOffset,b.byteLength/4)]}));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),mix=(a,b,t)=>a+(b-a)*t;
function raster(k,x,z){const m=meta[k],n=m.res,a=raw[k],fx=clamp((x/m.size+.5)*n-.5,0,n-1.0001),fz=clamp((z/m.size+.5)*n-.5,0,n-1.0001),i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j;return mix(mix(a[j*n+i],a[j*n+i+1],u),mix(a[(j+1)*n+i],a[(j+1)*n+i+1],u),v)}
function native(x,z){const e=Math.max(Math.abs(x),Math.abs(z))/(meta.core.size/2),t=clamp((e-.9)/.085,0,1),k=t*t*(3-2*t);return k===0?raster('core',x,z):k===1?raster('region',x,z):mix(raster('core',x,z),raster('region',x,z),k)}
const placements=read(dir+'/placements.json').placements,report=[];
for(const p of placements){
 const d=read(dir+'/island-'+p.seed+'.json'),s=p.scale,b=p.bounds,sm=makeRegionSampler(d,p,native);
 const nx=Math.ceil((b.maxX-b.minX)/1.8),nz=Math.ceil((b.maxZ-b.minZ)/1.8),N=nx+1,W=N*(nz+1),ys=new Float32Array(W),wet=new Uint8Array(W),level=new Float32Array(W),sea=new Uint8Array(W);
 const dx=(b.maxX-b.minX)/nx,dz=(b.maxZ-b.minZ)/nz;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const q=sm.sample(b.minX+i*dx,b.minZ+j*dz),k=j*N+i;ys[k]=q.y;level[k]=Math.max(0,q.level);wet[k]=q.y<-.025||q.water>.30&&q.level>q.y+.025&&q.level>.05?1:0}
 function height(x,z){const u=clamp((x-b.minX)/dx,0,nx-.00001),v=clamp((z-b.minZ)/dz,0,nz-.00001),i=Math.floor(u),j=Math.floor(v),a=u-i,c=v-j,k=j*N+i;return a+c<=1?ys[k]+(ys[k+1]-ys[k])*a+(ys[k+N]-ys[k])*c:ys[k+N+1]+(ys[k+N]-ys[k+N+1])*(1-a)+(ys[k+1]-ys[k+N+1])*(1-c)}
 const queue=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){if(i!==0&&j!==0&&i!==nx&&j!==nz)continue;const k=j*N+i;if(wet[k]&&ys[k]<0){sea[k]=1;queue.push(k)}}
 for(let at=0;at<queue.length;at++){const k=queue[at],i=k%N,j=Math.floor(k/N);for(const [u,v] of [[i-1,j],[i+1,j],[i,j-1],[i,j+1]]){if(u<0||u>nx||v<0||v>nz)continue;const h=v*N+u;if(wet[h]&&!sea[h]){sea[h]=1;queue.push(h)}}}
 const point=(x,z)=>({x:p.x+x*s,z:p.z+z*s}),by=new Map(d.tiles.map(t=>[t.i,t]));
 const rivers=(d.rivers??[]).map((r,index)=>{const src=r.tiles??[],tiles=src.map(i=>by.get(i)),last=tiles.at(-1),prev=tiles.filter(Boolean).at(-1);let gaps=0,samples=0,maxRise=0,previous=null;
 for(let k=1;k<tiles.length;k++){const a=tiles[k-1],c=tiles[k];if(a?.ground!=='water'||c?.ground!=='water')continue;
 for(let j=0;j<=10;j++){const t=j/10,q=point(mix(a.x,c.x,t),mix(a.z,c.z,t)),v=sm.sample(q.x,q.z);samples++;if(!(v.y<-.025||v.water>.30&&v.level>height(q.x,q.z)+.025))gaps++;if(previous!==null)maxRise=Math.max(maxRise,v.level-previous);previous=v.level}}
 let connected=false;if(prev){const q=point(prev.x,prev.z),i=Math.round((q.x-b.minX)/dx),j=Math.round((q.z-b.minZ)/dz);for(let v=-2;v<=2;v++)for(let u=-2;u<=2;u++){const x=i+u,z=j+v;if(x>=0&&x<=nx&&z>=0&&z<=nz&&sea[z*N+x])connected=true}}
 return {index,sourceEnd:last?.kind??'outside-export',lastGround:last?.ground??null,samples,gaps,maxRise:+maxRise.toFixed(2),seaConnected:connected,mouth:prev?point(prev.x,prev.z):null}});
 const ways=[...(d.stairs??[]).map((w,i)=>({...w,id:'stairs:'+i})),...(d.bridges??[]).flatMap((w,i)=>(w.legs??[]).map((q,j)=>({...q,id:'bridge:'+i+':'+j})))];
 const walkway=ways.map(w=>{const a=point(w.ax,w.az),c=point(w.bx,w.bz),ay=p.base+w.ay*s,cy=p.base+w.by*s,len=Math.hypot(c.x-a.x,c.z-a.z),ux=(c.x-a.x)/(len||1),uz=(c.z-a.z)/(len||1);let maxPen=0,maxGap=0;for(let i=0;i<=Math.ceil(len/.25);i++){const t=i/Math.ceil(len/.25);for(const u of [-.65,0,.65]){const x=mix(a.x,c.x,t)-uz*w.half*s*u,z=mix(a.z,c.z,t)+ux*w.half*s*u,y=mix(ay,cy,t),h=height(x,z);maxPen=Math.max(maxPen,h-y);maxGap=Math.max(maxGap,y-h)}}
 const foot=height(c.x+ux*.7,c.z+uz*.7),head=height(a.x-ux*.7,a.z-uz*.7);
 return {id:w.id,kind:w.kind,maxPen:+maxPen.toFixed(2),maxGap:+maxGap.toFixed(2),headDelta:+(head-ay).toFixed(2),footDelta:+(foot-cy).toFixed(2),slope:+(Math.abs(cy-ay)/(len||1)).toFixed(2),at:a,end:c}});
 let roads=0,buried=0,float=0,maxRoadBuried=0,maxRoadFloat=0;const roadExamples=[];
 for(let i=0;i+8<d.paths.length;i+=9){const v=[];let ground=true;for(let j=0;j<9;j+=3){const x=d.paths[i+j],z=d.paths[i+j+2],q=point(x,z),sample=sm.sample(q.x,q.z);if(sm.walkwayAt(x,z)||sample.water>.3){ground=false;break}v.push({...q,y:height(q.x,q.z)+.022})}if(!ground)continue;roads++;const x=v.reduce((n,q)=>n+q.x,0)/3,z=v.reduce((n,q)=>n+q.z,0)/3,y=v.reduce((n,q)=>n+q.y,0)/3,delta=y-height(x,z);if(delta<-.08){buried++;maxRoadBuried=Math.max(maxRoadBuried,-delta)}if(delta>.15){float++;maxRoadFloat=Math.max(maxRoadFloat,delta)}if((delta<-.15||delta>.25)&&roadExamples.length<20)roadExamples.push({x,z,delta:+delta.toFixed(2)})}
 const result={seed:p.seed,city:p.city,rivers:rivers.length,riverGaps:rivers.reduce((n,r)=>n+r.gaps,0),riverSamples:rivers.reduce((n,r)=>n+r.samples,0),seaConnected:rivers.filter(r=>r.seaConnected).length,seaOrOutsideEnds:rivers.filter(r=>r.sourceEnd==='sea'||r.sourceEnd==='outside-export').length,bridgeCount:d.bridges.length,stairs:d.stairs.length,walkwaySamples:walkway.length,bridgeIntrusions:walkway.filter(w=>w.kind==='deck'&&w.maxPen>.15).length,stairIntrusions:walkway.filter(w=>w.kind==='stairs'&&w.maxPen>.15).length,bridgeApproachMismatch:walkway.filter(w=>w.kind==='deck'&&Math.abs(w.footDelta)>.3).length,stairApproachMismatch:walkway.filter(w=>w.kind==='stairs'&&(Math.abs(w.footDelta)>.3||Math.abs(w.headDelta)>.3)).length,roads,buried,float,maxRoadBuried:+maxRoadBuried.toFixed(2),maxRoadFloat:+maxRoadFloat.toFixed(2)};
 report.push({...result,riverDetails:rivers,walkway,roadExamples});console.log('HF576_SURFACE',JSON.stringify(result));
}
fs.writeFileSync(out+'/surface-audit.json',JSON.stringify({notes:['Numerical terrain grid, not actual player collision traversal.','Sea connectivity is flood-fill approximation at 1.8 m; inland basins may intentionally be disconnected.','Bridge intrusion tests deck centerline and width, approach delta samples terrain only and can flag adjacent deck legs.','Road midpoint tests dry triangles only.'],regions:report},null,2));
