// Clip a source road triangle into the exact two heightfield triangles per grid cell.
// A single triangle then lies on a single planar ground face, never spanning a ridge.
const EPS=1e-9;
function clip(poly,fn){
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],fa=fn(a),fb=fn(b);
  if(fa>=-EPS)out.push(a);
  if((fa>=-EPS)!==(fb>=-EPS)){const t=fa/(fa-fb);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}
 }
 return out;
}
export function conformRoadTriangle(tri,grid,offset=.018){
 const {b,nx,nz,pos}=grid,dx=(b.maxX-b.minX)/nx,dz=(b.maxZ-b.minZ)/nz;
 const points=tri.map(([x,z])=>[(x-b.minX)/dx,(z-b.minZ)/dz]),out=[];
 const loX=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0])))),hiX=Math.min(nx-1,Math.floor(Math.max(...points.map(p=>p[0]))));
 const loZ=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1])))),hiZ=Math.min(nz-1,Math.floor(Math.max(...points.map(p=>p[1]))));
 for(let j=loZ;j<=hiZ;j++)for(let i=loX;i<=hiX;i++){
  let poly=clip(points,p=>p[0]-i);if(poly.length<3)continue;
  poly=clip(poly,p=>i+1-p[0]);if(poly.length<3)continue;
  poly=clip(poly,p=>p[1]-j);if(poly.length<3)continue;
  poly=clip(poly,p=>j+1-p[1]);if(poly.length<3)continue;
  const k=j*(nx+1)+i,h=n=>pos[n*3+1],a=h(k),c=h(k+nx+1),e=h(k+1),f=h(k+nx+2);
  for(const side of [0,1]){
   const face=clip(poly,p=>(side?1:-1)*(p[0]-i+p[1]-j-1));if(face.length<3)continue;
   const y=p=>{const u=p[0]-i,v=p[1]-j;return (side?f+(c-f)*(1-u)+(e-f)*(1-v):a+(e-a)*u+(c-a)*v)+offset};
   for(let k=1;k<face.length-1;k++){
    const [p,q,r]=[face[0],face[k],face[k+1]];
    if(Math.abs((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]))<1e-10)continue;
    for(const v of [p,q,r])out.push(b.minX+v[0]*dx,y(v),b.minZ+v[1]*dz);
   }
  }
 }
 return out;
}
