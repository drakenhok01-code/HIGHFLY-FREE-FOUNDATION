/** HIGHFLY atlas reads native Unsung map canvas, marker data and quest locations.
 * The illustration fallback is explicitly visual, NEVER a fake functional map.
 */
export function originalMapSnapshot(game,ui=globalThis.__ui){
 if(!game?.hasMap||!ui?._bakeMap||!ui?.el?.land)return null;
 try{
  ui._bakeMap();ui._drawMap();
  const land=ui.el.land,overlay=ui.el.over;
  if(!land.width||!land.height)return null;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=560;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)return null;
  ctx.drawImage(land,0,0,560,560);
  if(overlay?.width)ctx.drawImage(overlay,0,0,560,560);
  return canvas.toDataURL('image/webp',.78);
 }catch(error){
  console.warn('[HIGHFLY MAPA] No se pudo leer el mapa original:',error);
  return null;
 }
}
export function currentMapLandmarks(game){
 const sites=game?.sites?.spires??game?.spires??[];
 return sites.map(s=>({id:s.id,name:s.name??s.id,unlocked:!!s.tuned})).slice(0,16);
}
