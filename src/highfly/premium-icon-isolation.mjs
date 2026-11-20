/** HIGHFLY F0.14.11 — isolate each game icon to an independent asset.
 * The old single CSS atlas caused neighbour bleed and misframing at S23 DPR.
 * 20 cells are decoded once into separate 256×256 WebP blobs in memory.
 * This does NOT claim additional source detail: new high-resolution masters
 * can replace the original atlas later without changing any menu code.
 */
import {PREMIUM_ATLAS} from './premium-assets.mjs';
export const ATLAS_COLUMNS=5,ATLAS_ROWS=4,ICON_SIZE=256;
export function iconCell(index,width,height){
 if(!Number.isInteger(index)||index<0||index>=ATLAS_COLUMNS*ATLAS_ROWS||width<=0||height<=0)
  throw new RangeError('Icono de atlas fuera de rango');
 const w=width/ATLAS_COLUMNS,h=height/ATLAS_ROWS;
 return {sx:index%ATLAS_COLUMNS*w,sy:Math.floor(index/ATLAS_COLUMNS)*h,sw:w,sh:h};
}
export function installPremiumIconIsolation(root,url){
 if(typeof document==='undefined'||typeof Image==='undefined')return {apply:()=>{},status:()=>({ready:false})};
 const cache=new Map(),img=new Image();
 let finished=false,error=null;
 function apply(){
  if(!finished)return;
  for(const el of root.querySelectorAll('[data-hf-premium-icon]')){
   const data=cache.get(el.dataset.hfPremiumIcon);
   if(!data)continue;
   el.style.setProperty('--hf-isolated-art','url("'+data+'")');
   el.dataset.hfIsolated='1';
  }
 }
 img.onload=()=>{
  try{
   const used=new Map(Object.entries(PREMIUM_ATLAS));
   const cv=document.createElement('canvas');cv.width=ICON_SIZE;cv.height=ICON_SIZE;
   const ctx=cv.getContext('2d',{willReadFrequently:false});
   if(!ctx)throw new Error('Canvas 2D no disponible');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   for(const [name,index] of used){
    const {sx,sy,sw,sh}=iconCell(index,img.naturalWidth,img.naturalHeight);
    ctx.clearRect(0,0,ICON_SIZE,ICON_SIZE);
    // Crop each source cell to its own bitmap, dropping the one-pixel fringe.
    // Safe inset prevents gold frames from touching neighbouring button edges.
    const edge=Math.max(0.5,Math.min(sw,sh)*.014);
    ctx.drawImage(img,sx+edge,sy+edge,sw-edge*2,sh-edge*2,6,6,ICON_SIZE-12,ICON_SIZE-12);
    cache.set(name,cv.toDataURL('image/webp',.91));
   }
   finished=true;apply();
  }catch(e){error=String(e);}
 };
 img.onerror=()=>{error='No se pudo cargar atlas premium';};
 img.decoding='async';img.src=url;
 return {apply,status:()=>({ready:finished,count:cache.size,error})};
}
