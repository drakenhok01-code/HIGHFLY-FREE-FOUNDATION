/* P55.1: non-destructive editor-only terrain patch around an exact source island.
 * The source mesh preserves its own seats, roads and river beds. Native
 * terrain outside the patch is unchanged; a smooth apron joins the source coast
 * to the same triangles rendered by Unsung's far terrain mesh.
 * This is a visual preview, not a physics or hydrology bake.
 */
import * as THREE from 'three';
const lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
function farHeight(elevation,x,z){
 const cell=64,ax=Math.floor(x/cell)*cell,az=Math.floor(z/cell)*cell,u=(x-ax)/cell,v=(z-az)/cell;
 const a=elevation(ax,az),b=elevation(ax+cell,az),c=elevation(ax,az+cell),d=elevation(ax+cell,az+cell);
 return (u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v))-.7;
}
function axial(x,z,R){
 const qf=(Math.sqrt(3)*x/3-z/3)/R,rf=2*z/(3*R),sf=-qf-rf;
 let q=Math.round(qf),r=Math.round(rf),s=Math.round(sf);
 const dq=Math.abs(q-qf),dr=Math.abs(r-rf),ds=Math.abs(s-sf);
 if(dq>dr&&dq>ds)q=-r-s;else if(dr>ds)r=-q-s;
 return [q,r];
}
export function makeRegionFusion(nativeVisuals,elevation){
 if(!nativeVisuals?.material||typeof elevation!=='function')throw Error('Native material/heightfield required');
 const native=nativeVisuals.material,pristine=native.fragmentShader;
 const apronMaterial=native.clone(),groundMaterial=native.clone(),pathMaterial=native.clone();
 for(const m of [apronMaterial,groundMaterial,pathMaterial])for(const k of ['uUnsungAlbedo','uUnsungDetail','uNativePath'])m.uniforms[k]={value:native.uniforms[k].value};
 const pathToken='float path=texture(uNativePath,vWorld.xz/2048.0+0.5).r;';
 if(!pristine.includes(pathToken)||!pristine.includes('void main(){'))throw Error('Native terrain shader mismatch');
 // All cloned shaders retain the exact native texture arrays. Never clone GPU textures.
 apronMaterial.fragmentShader=pristine.replace(pathToken,'float path=0.0;');
 pathMaterial.fragmentShader=pristine.replace(pathToken,'float path=1.0;');
 groundMaterial.vertexShader=groundMaterial.vertexShader.replace('out vec3 vWorld;','in vec3 aGuildColor; out vec3 vGuildColor; out vec3 vWorld;').replace('vWorld=world.xyz;','vGuildColor=aGuildColor; vWorld=world.xyz;');
 groundMaterial.fragmentShader=pristine.replace('in vec3 vWorld;','in vec3 vGuildColor; in vec3 vWorld;').replace(pathToken,'float path=smoothstep(0.02,0.20,vGuildColor.r-vGuildColor.g);').replace('outColor=vec4(col,1.0);','col=mix(col,vGuildColor,0.27); outColor=vec4(col,1.0);');
 for(const m of [apronMaterial,groundMaterial,pathMaterial]){m.side=THREE.DoubleSide;m.needsUpdate=true}
 native.uniforms.uP55Bounds={value:new THREE.Vector4()};
 native.uniforms.uP55Clip={value:0};
 native.fragmentShader=pristine.replace('in vec3 vWorld;','uniform vec4 uP55Bounds; uniform float uP55Clip; in vec3 vWorld;').replace('void main(){','void main(){ if(uP55Clip>0.5 && vWorld.x>uP55Bounds.x && vWorld.x<uP55Bounds.y && vWorld.z>uP55Bounds.z && vWorld.z<uP55Bounds.w) discard;');
 native.needsUpdate=true;
 let active=null;
 const clear=()=>{native.uniforms.uP55Clip.value=0;active=null;globalThis.__hfP546Cleared=()=>false};
 function activate(p){
  active=p.bounds;native.uniforms.uP55Bounds.value.set(active.minX,active.maxX,active.minZ,active.maxZ);native.uniforms.uP55Clip.value=1;
  globalThis.__hfP546Cleared=(x,z)=>!!active&&x>=active.minX&&x<=active.maxX&&z>=active.minZ&&z<=active.maxZ;
 }
 function apron(d,p){
  const b=p.bounds,R=d.tileRadius,S=p.scale,table=new Set(d.tiles.map(t=>t.q+','+t.r)),nR=Math.ceil(p.transition/(R*S))+2;
  const W=b.maxX-b.minX,D=b.maxZ-b.minZ,nx=Math.ceil(W/2),nz=Math.ceil(D/2);
  const g=new THREE.PlaneGeometry(W,D,nx,nz).rotateX(-Math.PI/2),a=g.getAttribute('position'),centerX=(b.minX+b.maxX)/2,centerZ=(b.minZ+b.maxZ)/2;
  for(let i=0;i<a.count;i++){
   const x=a.getX(i)+centerX,z=a.getZ(i)+centerZ,lx=(x-p.x)/S,lz=(z-p.z)/S,[q,r]=axial(lx,lz,R);
   let h=farHeight(elevation,x,z);
   if(table.has(q+','+r))h=p.base-2.65*S;
   else{
    let dist=Infinity;
    for(let dq=-nR;dq<=nR;dq++)for(let dr=-nR;dr<=nR;dr++){
     if(!table.has((q+dq)+','+(r+dr)))continue;
     const cx=Math.sqrt(3)*R*(q+dq+(r+dr)/2),cz=1.5*R*(r+dr);
     dist=Math.min(dist,Math.max(0,Math.hypot(lx-cx,lz-cz)*S-R*S));
    }
    const border=Math.min(x-b.minX,b.maxX-x,z-b.minZ,b.maxZ-z);
    const k=(1-smooth(dist/p.transition))*smooth(border/8);
    h=lerp(h,p.base-.92*S,k);
   }
   // Exactly match the coarse native triangles at the rectangular external edge.
   if(Math.min(x-b.minX,b.maxX-x,z-b.minZ,b.maxZ-z)<.05)h=farHeight(elevation,x,z);
   a.setXYZ(i,x,h,z);
  }
  a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,apronMaterial);mesh.userData.owned=true;mesh.name='Unsung native coast transition';return mesh;
 }
 return {activate,clear,apron,groundMaterial,pathMaterial};
}
