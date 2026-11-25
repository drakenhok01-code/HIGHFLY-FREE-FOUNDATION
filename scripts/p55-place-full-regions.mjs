// P5.5 region placement on native Unsung raster. Preserve the original playable
// core, spawn, plazas, bridges and routes. A placement is a proposal, not a runtime bake.
import fs from 'node:fs';
import {PNG} from 'pngjs';
const out='dist/HIGHFLY-FREE-FOUNDATION/preview-p55/highfly/regions',old='https://drakenhok01-code.github.io/HIGHFLY-FREE-FOUNDATION/preview-p541/highfly/';
const get=async name=>{const r=await fetch(old+name,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Native '+name+' '+r.status);return Buffer.from(await r.arrayBuffer())};
const [m,core,reg,ov]=await Promise.all([get('native-terrain-manifest.json'),get('native-terrain-core.png'),get('native-terrain-region.png'),get('native-overview.json')]);
const manifest=JSON.parse(m),overview=JSON.parse(ov),c=PNG.sync.read(core),r=PNG.sync.read(reg);
function raster(p,meta,x,z){const fx=Math.max(0,Math.min(meta.res-1.0001,(x/meta.size+.5)*meta.res-.5)),fz=Math.max(0,Math.min(meta.res-1.0001,(z/meta.size+.5)*meta.res-.5)),ix=Math.min(meta.res-2,Math.floor(fx)),iz=Math.min(meta.res-2,Math.floor(fz)),tx=fx-ix,tz=fz-iz;const v=(x,z)=>{const k=(z*meta.res+x)*4;return meta.min+(p.data[k]*256+p.data[k+1])*(meta.max-meta.min)/65535};return (v(ix,iz)*(1-tx)+v(ix+1,iz)*tx)*(1-tz)+(v(ix,iz+1)*(1-tx)+v(ix+1,iz+1)*tx)*tz}
function elevation(x,z){let e=Math.max(Math.abs(x),Math.abs(z))/(manifest.meta.core.size/2),hr=e<.9?0:raster(r,manifest.meta.region,x,z);if(e>=.985)return hr;let hc=raster(c,manifest.meta.core,x,z);if(e<=.9)return hc;let t=(e-.9)/.085,w=1-t*t*(3-2*t);return hr+(hc-hr)*w}
const index=JSON.parse(fs.readFileSync(out+'/source-index.json','utf8')),placements=[];
const routePts=(overview.routes??[]).flatMap(line=>line.flatMap(([x,z],i)=>{if(!i)return [{x,z}];const [a,b]=line[i-1],n=Math.max(1,Math.ceil(Math.hypot(x-a,z-b)/8));return Array.from({length:n},(_,j)=>({x:a+(x-a)*(j+1)/n,z:b+(z-b)*(j+1)/n}))}));
const reserve=1080,apron=36;
const overlap=(a,b)=>a.minX<b.maxX+48&&a.maxX>b.minX-48&&a.minZ<b.maxZ+48&&a.maxZ>b.minZ-48;
const preferred=[[-1550,-500],[-1500,600],[-600,-1500],[600,-1500],[1500,-600],[1500,600],[600,1500],[-600,1500]];
// Prioritize the most maritime original designs for the eastern coast.
const sorted=[...index.regions].sort((a,b)=>b.stats.boats-a.stats.boats),east=[sorted[0].seed,sorted[1].seed];
const remaining=sorted.filter(t=>!east.includes(t.seed)).map(t=>t.seed);
const slots=[remaining[0],remaining[1],remaining[2],remaining[3],east[0],east[1],remaining[4],remaining[5]];
for(let k=0;k<slots.length;k++){
 const seed=slots[k],source=index.regions.find(r=>r.seed===seed),s=source.scale;
 // Size from actual complete source ground extent, including all water tiles.
 const data=JSON.parse(fs.readFileSync(out+'/island-'+seed+'.json','utf8')),q=data.tiles;
 const minX=Math.min(...q.map(t=>t.x))*s-6,maxX=Math.max(...q.map(t=>t.x))*s+6,minZ=Math.min(...q.map(t=>t.z))*s-6,maxZ=Math.max(...q.map(t=>t.z))*s+6;
 const [px,pz]=preferred[k],maritime=east.includes(seed),options=[];
 for(let x=-4200;x<=4200;x+=100)for(let z=-4200;z<=4200;z+=100){
  const b={minX:x+minX-apron,maxX:x+maxX+apron,minZ:z+minZ-apron,maxZ:z+maxZ+apron};
  if(b.minX<reserve&&b.maxX>-reserve&&b.minZ<reserve&&b.maxZ>-reserve)continue;
  if(placements.some(p=>overlap(b,p.bounds)))continue;
  if(routePts.some(p=>p.x>b.minX-12&&p.x<b.maxX+12&&p.z>b.minZ-12&&p.z<b.maxZ+12))continue;
  const heights=[];for(let i=0;i<=6;i++)for(let j=0;j<=6;j++)heights.push(elevation(b.minX+(b.maxX-b.minX)*i/6,b.minZ+(b.maxZ-b.minZ)*j/6));
  const wet=heights.filter(h=>h<.1).length/heights.length,land=heights.filter(h=>h>=.1).sort((a,b)=>a-b);
  if(!land.length||wet>.68||(!maritime&&wet>.25))continue;
  const median=land[Math.floor(land.length/2)],spread=land[Math.floor(land.length*.9)]-land[Math.floor(land.length*.1)],base=maritime&&wet>.12?0:median;
  const score=Math.hypot(x-px,z-pz)*.1+spread*6+(maritime?Math.abs(wet-.35)*110+Math.max(0,median-25)*3:wet*300)+Math.abs(base-median)*3;
  options.push({seed,x,z,base,scale:s,bounds:b,localBounds:{minX,minZ,maxX,maxZ},nativeSample:{landFraction:1-wet,median,spread},score,maritime,transition:apron});
 }
 options.sort((a,b)=>a.score-b.score);if(options[0]){placements.push(options[0]);console.log('HF55_SITE '+JSON.stringify(options[0]))}else console.log('HF55_NO_SITE '+seed);
}
const result={schema:'hf-original-guildhall-placement-v1',source:'native Unsung 16-bit height rasters',spawn:overview.spawn,protectedCore:reserve,placements,unplaced:index.regions.filter(r=>!placements.some(p=>p.seed===r.seed)).map(r=>r.seed),notes:['Whole-region footprints are tested on native raster; existing central architecture and route network excluded.','No new route connection, collision mesh or playable terrain bake yet.','Placement needs visual and navigation validation; inland water remains local basin.']};
fs.writeFileSync(out+'/placements.json',JSON.stringify(result,null,2));console.log('HF55_PLACEMENTS '+JSON.stringify({placed:placements.length,unplaced:result.unplaced,spawn:result.spawn}));
