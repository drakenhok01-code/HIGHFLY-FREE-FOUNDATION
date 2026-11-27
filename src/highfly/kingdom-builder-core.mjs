/* Kingdom Builder K0.1 — editor-only draft data; source prefabs MIT, Codestz. */
export const SCHEMA='hf-kingdom-builder-v1';
export const isBase=id=>/(^|\/)(ground-hex|hex-ground|hexagon-base|tile-base|ground-river)/i.test(id);
const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
export function validatePiece(p){return p&&typeof p.id==='string'&&typeof p.sourceId==='string'&&/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(p.sourceId)&&[p.x,p.z,p.offset,p.yaw,p.scale].every(finite)&&p.scale>0&&(!p.stretch||finite(p.stretch)&&p.stretch>0)&&(!p.tilt||Array.isArray(p.tilt)&&p.tilt.length===2&&p.tilt.every(finite))}
export function importIsland(d,placement){
 if(d.schema!=='hf-original-guildhall-region-v1'||!Array.isArray(d.pieces)||!Array.isArray(d.tiles))throw Error('Formato de isla no compatible');
 const s=placement.scale,r=d.tileRadius||4,grid=new Map(),key=(x,z)=>Math.floor(x/r)+','+Math.floor(z/r);
 for(const t of d.tiles){const k=key(t.x,t.z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(t)}
 function nearest(x,z){let best=null,dist=Infinity;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(const t of grid.get(key(x+a*r,z+b*r))||[]){const h=(x-t.x)**2+(z-t.z)**2;if(h<dist){dist=h;best=t}}return best}
 return d.pieces.flatMap((p,i)=>{if(isBase(p.piece))return [];const t=nearest(p.x,p.z);const q={id:'isla-'+d.seed+'-'+i,sourceId:p.piece,x:placement.x+p.x*s,z:placement.z+p.z*s,offset:((p.y??t?.top??0)-(t?.top??0))*s,yaw:p.rot??0,scale:(p.scale??1)*s,stretch:p.stretch??1,tilt:p.tilt,group:'sector-'+(t?.i??'libre'),seed:d.seed};if(!validatePiece(q))throw Error('Pieza inválida '+i);return [q]});
}
export function prefabPieces(tile,x,z,yaw,scale,group){
 if(!tile||!Array.isArray(tile.pieces))throw Error('Conjunto inválido');
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return tile.pieces.flatMap((p,i)=>{if(isBase(p.piece))return [];const q={id:group+'-'+i,sourceId:p.piece,x:x+(p.x*c+p.z*s)*scale,z:z+(-p.x*s+p.z*c)*scale,offset:(p.y??0)*scale,yaw:(p.rot??0)+yaw,scale:(p.scale??1)*scale,stretch:p.stretch??1,tilt:p.tilt,group,prefab:tile.id};if(!validatePiece(q))throw Error('Pieza inválida '+i);return [q]});
}
export function selectArea(items,x,z,w,h){return new Set(items.filter(p=>Math.abs(p.x-x)<=w/2&&Math.abs(p.z-z)<=h/2).map(p=>p.id))}
export function transformSelection(items,ids,x,z,dx,dz,yaw,scale){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return items.map(p=>{if(!ids.has(p.id))return p;const a=p.x-x,b=p.z-z;return {...p,x:x+dx+(a*c+b*s)*scale,z:z+dz+(-a*s+b*c)*scale,offset:p.offset*scale,yaw:p.yaw+yaw,scale:p.scale*scale}});
}
export function exportDraft(pieces,terrain){if(!pieces.every(validatePiece)||new Set(pieces.map(p=>p.id)).size!==pieces.length)throw Error('Plano inválido');return {schema:SCHEMA,world:'unsung-vale',units:'world',readyForGame:false,baseHexagons:false,pieces:pieces.map(p=>({...p,y:terrain(p.x,p.z)+p.offset})),pending:['colisiones','caminos','validación de agua y pendientes','NPC y puntos de interacción']}}
export function readDraft(d){if(d?.schema!==SCHEMA||d.world!=='unsung-vale'||!Array.isArray(d.pieces)||d.pieces.length>300000||!d.pieces.every(validatePiece)||new Set(d.pieces.map(p=>p.id)).size!==d.pieces.length)throw Error('Plano inválido o incompatible');return d.pieces.map(({y,...p})=>p)}
