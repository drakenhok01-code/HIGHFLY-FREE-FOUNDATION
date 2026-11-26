// P556: spatial partition / arrival selection, shared by runtime and data QA.
export const modelClass=id=>/building-|castle|wall-|tower|barracks|lumbermill|windmill|watermill|bridge|boat|ship|lighthouse/i.test(id)?'landmark':/fence|rock|tree|barn|dock|gate|arch|mill/i.test(id)?'mid':'detail';
export const policy={landmark:{cell:48,radius:215},mid:{cell:28,radius:90},detail:{cell:18,radius:40}};
export function sectorKey(id,x,z){const kind=modelClass(id),p=policy[kind];return kind+'/'+Math.floor(x/p.cell)+'/'+Math.floor(z/p.cell)}
export function sectorBounds(key){const [kind,i,j]=key.split('/'),p=policy[kind],x=+i*p.cell,z=+j*p.cell;return {kind,x,z,maxX:x+p.cell,maxZ:z+p.cell,radius:p.radius}}
export function distanceToBounds(x,z,b){return Math.hypot(Math.max(b.x-x,0,x-b.maxX),Math.max(b.z-z,0,z-b.maxZ))}
export function chooseArrival({origin,candidates,height,water,blocked}){
 const ordered=candidates.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)).sort((a,b)=>Math.hypot(a.x-origin.x,a.z-origin.z)-Math.hypot(b.x-origin.x,b.z-origin.z));
 for(const p of ordered){const y=height(p.x,p.z);if(!Number.isFinite(y)||water(p.x,p.z)>y+.12||blocked(p.x,p.z,y,.65))continue;
  let exits=0,yaw=0;for(let j=0;j<8;j++){const a=j*Math.PI/4;let ok=true;for(let r=.5;r<=3;r+=.5){const x=p.x+Math.sin(a)*r,z=p.z+Math.cos(a)*r,h=height(x,z);if(!Number.isFinite(h)||Math.abs(h-y)>r*.45+.25||water(x,z)>h+.12||blocked(x,z,h,.60)){ok=false;break}}if(ok){exits++;yaw=a}}
  if(exits>=2)return {...p,y,yaw,exits};
 }
 return null;
}
