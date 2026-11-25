/* P544 native site planner. Pure functions: can run against real Unsung rasters at build time
 * and the same native height/occupancy sampler in World Forge. No world mutations. */
import {buildSettlement,validateSite,SETTLEMENTS} from './p544-guildhall-settlements.mjs';
export const SCALE_REFERENCE=Object.freeze({sourceHero:2.2*.47,targetHero:1.82,factor:1.82/(2.2*.47),source:'Guildhall CHARACTER_SCALE=.47; Unsung player capsule height=1.82',status:'capsule-based initial calibration; door mesh QA required'});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const shift=(p,x,z)=>({...p,x:p.x+x,z:p.z+z});
function bounds(plan){const p=plan.lots.flatMap(l=>l.corners);return {minX:Math.min(...p.map(x=>x.x)),maxX:Math.max(...p.map(x=>x.x)),minZ:Math.min(...p.map(x=>x.z)),maxZ:Math.max(...p.map(x=>x.z))}}
function move(plan,x,z){return {...plan,anchor:shift(plan.anchor,x,z),lots:plan.lots.map(l=>({...l,corners:l.corners.map(p=>shift(p,x,z))})),objects:plan.objects.map(p=>shift(p,x,z)),roads:plan.roads.map(r=>({...r,points:r.points.map(p=>shift(p,x,z))})),floraHints:plan.floraHints.map(p=>shift(p,x,z)),blockers:plan.blockers.map(p=>shift(p,x,z))}}
const overlap=(a,b,pad=12)=>a.minX<b.maxX+pad&&a.maxX>b.minX-pad&&a.minZ<b.maxZ+pad&&a.maxZ>b.minZ-pad;
export function findSettlementSite(id,{assetLookup,sampleTerrain,isOccupied,anchors,existing=[],seed=7,maxCandidates=1600,gapMeters=1.5,roadWidth=3.2}){
 const preset=SETTLEMENTS.find(t=>t.id===id);if(!preset||id==='japonesa')return {ok:false,id,reason:'reserved theme'};
 const accepted=existing.map(bounds),options=[];
 for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const raw=buildSettlement(id,{assetLookup,metersPerUnit:SCALE_REFERENCE.factor,anchor:{x:0,z:0},yaw,seed,gapMeters,roadWidth});
  if(!raw.ok)return raw;
  const b=bounds(raw);options.push(move(raw,-(b.minX+b.maxX)/2,-(b.minZ+b.maxZ)/2));
 }
 let tested=0;
 for(const a of anchors){for(const raw of options){
  if(++tested>maxCandidates)return {ok:false,id,tested,reason:'no compatible site in bounded search'};
  const p=move(raw,a.x,a.z),b=bounds(p);
  if(Math.max(Math.abs(b.minX),Math.abs(b.maxX),Math.abs(b.minZ),Math.abs(b.maxZ))>1015||accepted.some(q=>overlap(b,q)))continue;
  const occupied=(x,z)=>isOccupied(x,z)||accepted.some(q=>x>q.minX-3&&x<q.maxX+3&&z>q.minZ-3&&z<q.maxZ+3);
  let bad=false;
  for(const lot of p.lots){const [a,b,c]=lot.corners,hs=[];for(let i=0;i<=2;i++)for(let j=0;j<=2;j++){const x=a.x+(b.x-a.x)*i/2+(c.x-a.x)*j/2,z=a.z+(b.z-a.z)*i/2+(c.z-a.z)*j/2;const t=sampleTerrain(x,z);if(!t||!Number.isFinite(t.height)||occupied(x,z)||(!lot.coastal&&t.water)){bad=true;break}if(!t.water)hs.push(t.height)}if(hs.length&&Math.max(...hs)-Math.min(...hs)>1.25)bad=true;if(bad)break}
  if(bad)continue;
  const check=validateSite(p,{sampleTerrain,isOccupied:occupied,step:1,maxLotRelief:1.25,maxRoadGrade:.22});
  if(!check.ok)continue;
  return {...p,tested,siteValidation:check,bounds:b};
 }}
 return {ok:false,id,tested,reason:'no compatible site; do not flatten native geography'};
}
export function candidateGrid(overview,{step=20,limit=10000,prefer=null}={}){
 const points=[],routes=(overview?.routes??[]).flat().map(([x,z])=>({x,z}));
 for(let x=-980;x<=980;x+=step)for(let z=-980;z<=980;z+=step){
  const p={x,z};const near=routes.length?Math.min(...routes.map(q=>distance(p,q))):0;
  const bias=prefer?distance(p,prefer):near;
  points.push({x,z,score:bias+near*.35});
 }
 return points.sort((a,b)=>a.score-b.score).slice(0,limit);
}
// Bounded A* from settlement entrance to native network. No roads over water,
// occupied plots, or steep grades. Eight directions, sample each segment.
export function connectNativeRoad(start,targets,{sampleTerrain,isOccupied,step=4,maxGrade=.28,maxNodes=45000}){
 if(!targets.length)return null;
 const key=(x,z)=>x+','+z, snap=p=>({x:Math.round(p.x/step)*step,z:Math.round(p.z/step)*step});
 const s=snap(start),goals=targets.map(snap),goalKeys=new Set(goals.map(p=>key(p.x,p.z)));
 const h=p=>Math.min(...goals.map(q=>distance(p,q)));
 const open=[],cost=new Map(),prev=new Map(),points=new Map();
 function push(n){open.push(n);let i=open.length-1;while(i){let p=(i-1)>>1;if(open[p].f<=n.f)break;open[i]=open[p];i=p}open[i]=n}
 function pop(){const top=open[0],last=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let j=i*2+1;if(j+1<open.length&&open[j+1].f<open[j].f)j++;if(open[j].f>=last.f)break;open[i]=open[j];i=j}open[i]=last}return top}
 const sk=key(s.x,s.z);cost.set(sk,0);points.set(sk,s);push({p:s,k:sk,g:0,f:h(s)});
 function walk(a,b){const len=distance(a,b),n=Math.max(1,Math.ceil(len));let last=null;for(let i=0;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n,t=sampleTerrain(x,z);if(!t||!Number.isFinite(t.height)||t.water||isOccupied(x,z))return false;if(last!==null&&len&&Math.abs(t.height-last)/(len/n)>maxGrade)return false;last=t.height}return true}
 if(!walk(start,s))return null;
 for(let count=0;open.length&&count<maxNodes;count++){
  const n=pop();if(n.g!==cost.get(n.k))continue;
  if(goalKeys.has(n.k)){const path=[];let k=n.k;while(k){path.push(points.get(k));k=prev.get(k)}path.reverse();const end=targets.find(p=>key(snap(p).x,snap(p).z)===n.k);if(!end||!walk(n.p,end))continue;return [start,...path,end].filter((p,i,a)=>!i||distance(p,a[i-1])>.01)}
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const p={x:n.p.x+dx*step,z:n.p.z+dz*step};if(Math.max(Math.abs(p.x),Math.abs(p.z))>1015||!walk(n.p,p))continue;
   const k=key(p.x,p.z),g=n.g+distance(n.p,p);if(g>=(cost.get(k)??Infinity))continue;
   cost.set(k,g);prev.set(k,n.k);points.set(k,p);push({p,k,g,f:g+h(p)});
  }
 }
 return null;
}
