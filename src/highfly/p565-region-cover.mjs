// Reuse the exact existing native blades and flower cells; one local float
// texture supplies the modified regional height, soil, slope and water mask.
import * as THREE from 'three';
import {roadMask} from './p566-interaction-policy.mjs';
export function installRegionCover(cover){
 if(!cover?.grassMat||!cover?.flowerMat)return null;
 const fallback=new THREE.DataTexture(new Float32Array(4),1,1,THREE.RGBAFormat,THREE.FloatType);fallback.needsUpdate=true;
 const emptyRoad=new THREE.DataTexture(new Uint8Array(1),1,1,THREE.RedFormat);emptyRoad.needsUpdate=true;const road={value:emptyRoad};
 const tex={value:fallback},bounds={value:new THREE.Vector4()},enabled={value:0};
 for(const m of [cover.grassMat,cover.flowerMat]){
  const token='vec4 groundInfo(vec2 xz) {',end='return vec4(h, grow, n1.r, meadowFamily(n1, n2, pn.r));';
  if(!m.vertexShader.includes(token)||!m.vertexShader.includes(end))throw Error('P565 grass anchors');
  m.uniforms.uHFRoadMask=road;m.uniforms.uHFRegionCover=tex;m.uniforms.uHFRegionCoverBounds=bounds;m.uniforms.uHFRegionCoverEnabled=enabled;
  m.vertexShader=m.vertexShader.replace(token,`uniform sampler2D uHFRoadMask; uniform sampler2D uHFRegionCover; uniform vec4 uHFRegionCoverBounds; uniform float uHFRegionCoverEnabled;
vec4 hfRegionSample(vec2 xz){vec2 uv=(xz-uHFRegionCoverBounds.xy)/uHFRegionCoverBounds.zw;ivec2 sz=textureSize(uHFRegionCover,0);vec2 g=clamp(uv,0.0,1.0)*vec2(sz-1);ivec2 i=min(ivec2(floor(g)),sz-2);vec2 f=g-vec2(i);vec4 a=texelFetch(uHFRegionCover,i,0),b=texelFetch(uHFRegionCover,i+ivec2(1,0),0),c=texelFetch(uHFRegionCover,i+ivec2(0,1),0),d=texelFetch(uHFRegionCover,i+ivec2(1,1),0);return f.x+f.y<=1.0?a+(b-a)*f.x+(c-a)*f.y:d+(c-d)*(1.0-f.x)+(b-d)*(1.0-f.y);}
`+token).replace(end,`if(uHFRegionCoverEnabled>0.5 && all(greaterThanEqual(xz,uHFRegionCoverBounds.xy)) && all(lessThanEqual(xz,uHFRegionCoverBounds.xy+uHFRegionCoverBounds.zw))){vec4 r=hfRegionSample(xz);h=r.x;grow=(1.0-smoothstep(.22,.75,r.z))*(1.0-smoothstep(.25,.72,r.y))*(1.0-smoothstep(.10,.35,r.w))*smoothstep(.05,.85,h)*(1.0-soil*.85);vec2 roadUv=(xz-uHFRegionCoverBounds.xy)/uHFRegionCoverBounds.zw;grow*=1.0-step(.1,texture(uHFRoadMask,roadUv).r);}
`+end);m.needsUpdate=true;
 }
 const invalidate=()=>{for(const c of cover.cells??[]){c._hfCellX=null;c._hfCellZ=null}};
 function clear(){enabled.value=0;if(tex.value!==fallback)tex.value.dispose();tex.value=fallback;if(road.value!==emptyRoad)road.value.dispose();road.value=emptyRoad;invalidate()}
 function mount(grid,blocked,paths=[],placement){clear();const {nx,nz,pos,soil,wet,b}=grid,w=nx+1,h=nz+1,buf=new Float32Array(w*h*4),dx=(b.maxX-b.minX)/nx,dz=(b.maxZ-b.minZ)/nz;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i,y=pos[k*3+1],x=pos[k*3],z=pos[k*3+2],slope=Math.hypot((pos[(j*w+Math.min(nx,i+1))*3+1]-pos[(j*w+Math.max(0,i-1))*3+1])/(2*dx),(pos[(Math.min(nz,j+1)*w+i)*3+1]-pos[(Math.max(0,j-1)*w+i)*3+1])/(2*dz));buf.set([y,blocked?.(x,z,y,.15)?1:soil[k],slope,y<0||wet[k].f>0?1:0],k*4)}
  const t=new THREE.DataTexture(buf,w,h,THREE.RGBAFormat,THREE.FloatType);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;tex.value=t;bounds.value.set(b.minX,b.minZ,b.maxX-b.minX,b.maxZ-b.minZ);if(placement&&paths.length){const m=roadMask(paths,placement,b);const rt=new THREE.DataTexture(m.buf,m.w,m.h,THREE.RedFormat);rt.minFilter=rt.magFilter=THREE.NearestFilter;rt.needsUpdate=true;road.value=rt;}enabled.value=1;invalidate();
 }
 return {mount,clear,get roadTexture(){return road.value===emptyRoad?null:road.value},get roadBounds(){return bounds.value}};
}
