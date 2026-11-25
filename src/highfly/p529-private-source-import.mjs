/** HIGHFLY KayKit SOURCE + Halloween local user import.
 * All asset bytes stay in IndexedDB on the player's own browser. Zero source GLBs
 * or private pack ZIPs are committed to public GitHub, Actions or a remote CDN.
 * Import format: curated HIGHFLY_KAYKIT_SOURCE_EDITOR_V1_PRIVATE.zip (ZIP_STORED).
 */
const DB_NAME='HIGHFLY_SOURCE_PACKS_V1',STORE='models';
export const SOURCE_CATALOG_KEY='hf-source-kaykit-catalog-v1';
const MAX_ZIP_BYTES=75_000_000,MAX_ASSETS=450,MAX_FILE_BYTES=4_000_000;
const sourceId=id=>typeof id==='string'&&/^source-[a-z0-9-]{4,104}$/.test(id);
const cleanNumber=n=>typeof n==='number'&&Number.isFinite(n);
const win=globalThis;
function storage(){return win.localStorage}
export function loadPrivateSourceCatalog(){
 try{
  const d=JSON.parse(storage().getItem(SOURCE_CATALOG_KEY)||'null');
  if(d?.schema!==1||!Array.isArray(d.assets)||d.assets.length>MAX_ASSETS)return [];
  return d.assets.filter(x=>sourceId(x.id)&&x.label?.length<140&&x.category?.length<90&&
   [x.width,x.depth,x.height].every(n=>cleanNumber(n)&&n>0&&n<200));
 }catch{return []}
}
export function privateSourceType(type){return sourceId(type);}
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!win.indexedDB){reject(Error('Tu navegador no ofrece almacenamiento IndexedDB.'));return;}
  const req=win.indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>reject(req.error||Error('No se pudo abrir almacenamiento privado'));
  req.onsuccess=()=>resolve(req.result);
 });
}
export async function readPrivateSourceGLB(type){
 if(!sourceId(type))throw Error('ID KayKit SOURCE inválido');
 const db=await openDB();
 try{
  return await new Promise((resolve,reject)=>{
   const t=db.transaction(STORE,'readonly'),req=t.objectStore(STORE).get(type);
   req.onsuccess=async()=>{
    const data=req.result;
    if(!data){reject(Error('Importá tu ZIP KayKit SOURCE desde World Forge: falta '+type));return;}
    if(data instanceof Blob)resolve(await data.arrayBuffer());
    else if(data instanceof ArrayBuffer)resolve(data);
    else reject(Error('Formato de asset privado no reconocido'));
   };
   req.onerror=()=>reject(req.error||Error('No se encontró '+type));
  });
 }finally{db.close();}
}
function parseStoredZip(buffer){
 const view=new DataView(buffer),bytes=new Uint8Array(buffer),text=new TextDecoder(),files=new Map();
 let offset=0,count=0;
 while(offset+4<=bytes.length&&view.getUint32(offset,true)===0x04034b50){
  if(count++>MAX_ASSETS+8)throw Error('Demasiados archivos en el paquete KayKit');
  if(offset+30>bytes.length)throw Error('ZIP cortado');
  const flags=view.getUint16(offset+6,true),method=view.getUint16(offset+8,true);
  const packed=view.getUint32(offset+18,true),unpacked=view.getUint32(offset+22,true);
  const fileLen=view.getUint16(offset+26,true),extraLen=view.getUint16(offset+28,true);
  if((flags&8)||method!==0||packed!==unpacked)throw Error('Usá el ZIP privado HIGHFLY original sin recomprimir (ZIP_STORED)');
  const nameStart=offset+30,start=nameStart+fileLen+extraLen,end=start+packed;
  if(end>bytes.length||fileLen>220)throw Error('Entrada ZIP inválida');
  const name=text.decode(bytes.slice(nameStart,nameStart+fileLen));
  if(!/^(manifest\.json|README\.txt|models\/source-[a-z0-9-]+\.glb)$/.test(name)||name.includes('..'))
   throw Error('Ruta no permitida en ZIP: '+name);
  if(unpacked>MAX_FILE_BYTES)throw Error('Asset excesivamente grande: '+name);
  if(files.has(name))throw Error('Asset duplicado en ZIP: '+name);
  files.set(name,bytes.slice(start,end).buffer);offset=end;
 }
 if(!files.has('manifest.json'))throw Error('El ZIP no contiene manifest.json de HIGHFLY');
 return files;
}
function asArrayBuffer(file){
 if(!file?.arrayBuffer)throw Error('Seleccioná el paquete ZIP de HIGHFLY');
 return file.arrayBuffer();
}
async function sha256(data){
 if(!win.crypto?.subtle)throw Error('Este navegador necesita un contexto seguro (HTTPS) para comprobar SHA-256');
 const b=await win.crypto.subtle.digest('SHA-256',data);
 return [...new Uint8Array(b)].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function importPrivateSourcePack(file,progress=()=>{}){
 if(!file||file.size<=0||file.size>MAX_ZIP_BYTES)
  throw Error('Elegí HIGHFLY_KAYKIT_SOURCE_EDITOR_V1_PRIVATE.zip (máximo 75 MB)');
 progress('Leyendo ZIP privado sin subirlo a internet…');
 const files=parseStoredZip(await asArrayBuffer(file));
 const manifest=JSON.parse(new TextDecoder().decode(files.get('manifest.json')));
 if(manifest.schema!==1||manifest.format!=='glb'||!Array.isArray(manifest.assets)||
    manifest.assets.length<1||manifest.assets.length>MAX_ASSETS)
  throw Error('Manifest de KayKit SOURCE no compatible');
 if(files.size!==manifest.assets.length+2)
  throw Error('El ZIP no coincide con la cantidad de modelos del manifest');
 const seen=new Set(),prepared=[];
 for(const [i,x] of manifest.assets.entries()){
  if(!sourceId(x.id)||seen.has(x.id)||!x.path||x.path!=='models/'+x.id+'.glb'||
     !Array.isArray([x.width,x.depth,x.height])|| // defensive type shape
     ![x.width,x.depth,x.height].every(n=>cleanNumber(n)&&n>.1&&n<200)||
     typeof x.label!=='string'||x.label.length>139||typeof x.category!=='string'||
     x.category.length>89||typeof x.sha256!=='string'||!/^[0-9a-f]{64}$/.test(x.sha256))
   throw Error('Asset inválido: '+String(x.id));
  seen.add(x.id);
  const buffer=files.get(x.path);if(!buffer||buffer.byteLength!==x.bytes)throw Error('Archivo GLB ausente: '+x.id);
  if(new DataView(buffer).getUint32(0,true)!==0x46546c67)throw Error('Modelo no es GLB: '+x.id);
  const digest=await sha256(buffer);
  if(digest!==x.sha256)throw Error('SHA-256 no coincide: '+x.id);
  prepared.push({id:x.id,blob:new Blob([buffer],{type:'model/gltf-binary'})});
  if(i%16===0)progress('Verificando autenticidad: '+(i+1)+'/'+manifest.assets.length);
 }
 const db=await openDB();
 try{
  await new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   for(const x of prepared)store.put(x.blob,x.id);
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('No se pudieron guardar los modelos en este celular'));
   tx.onabort=()=>reject(tx.error||Error('Se canceló la importación de modelos'));
  });
 }finally{db.close();}
 const metadata=manifest.assets.map(x=>({
  id:x.id,label:x.label,category:x.category,kind:x.kind,
  width:x.width,depth:x.depth,height:x.height,license:x.license,sourcePack:x.sourcePack
 }));
 storage().setItem(SOURCE_CATALOG_KEY,JSON.stringify({schema:1,assets:metadata}));
 progress('✓ Modelos privados importados en este dispositivo: '+metadata.length);
 return metadata;
}
