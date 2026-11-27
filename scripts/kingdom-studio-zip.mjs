// K1.1.2: local archive reader. No network or cloud upload.
import fs from "node:fs/promises";
const root=process.argv[2]??"guildhall-native";
const dir=root+"/apps/studio/src/hexworld/";
await fs.writeFile(dir+"kingdom-zip.ts",[
'export type ZipEntry={name:string;size:number;compressed:number;method:number;flags:number;offset:number;crc:number}',
'const view=(b:ArrayBuffer)=>new DataView(b),u16=(d:DataView,i:number)=>d.getUint16(i,true),u32=(d:DataView,i:number)=>d.getUint32(i,true);',
'const dec=new TextDecoder();',
'const clean=(s:string)=>s.replaceAll("\\\\","/").split("/").filter(p=>p&&p!==".").join("/");',
'export async function readZip(blob:Blob):Promise<ZipEntry[]>{',
' if(blob.size<22)throw Error("ZIP incompleto");',
' const tail=await blob.slice(Math.max(0,blob.size-65557)).arrayBuffer(),d=view(tail);let e=-1;',
' for(let i=d.byteLength-22;i>=0;i--)if(u32(d,i)===0x06054b50&&i+22+u16(d,i+20)===d.byteLength){e=i;break}',
' if(e<0)throw Error("No se encontró el índice ZIP");',
' const count=u16(d,e+10),size=u32(d,e+12),off=u32(d,e+16);',
' if(u16(d,e+4)||u16(d,e+6)||count===65535||off===0xffffffff||size===0xffffffff)throw Error("ZIP64 o ZIP dividido no compatible; usá los ZIP independientes o carpetas extraídas");',
' if(size>80*1024*1024||off+size>blob.size)throw Error("Índice ZIP inválido");',
' const b=await blob.slice(off,off+size).arrayBuffer(),c=view(b);let i=0;const out:ZipEntry[]=[];',
' for(let n=0;n<count;n++){if(i+46>b.byteLength||u32(c,i)!==0x02014b50)throw Error("Índice ZIP dañado");',
' const length=u16(c,i+28),extra=u16(c,i+30),comment=u16(c,i+32),raw=dec.decode(new Uint8Array(b,i+46,length)),name=clean(raw);',
' if(name&&!raw.endsWith("/")&&!name.split("/").includes(".."))out.push({name,size:u32(c,i+24),compressed:u32(c,i+20),method:u16(c,i+10),flags:u16(c,i+8),offset:u32(c,i+42),crc:u32(c,i+16)});',
' i+=46+length+extra+comment;}return out;',
'}',
'const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});',
'function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]!^(c>>>8);return (c^0xffffffff)>>>0}',
'export async function extractZip(blob:Blob,e:ZipEntry):Promise<Blob>{',
' if(e.flags&1)throw Error("ZIP cifrado");if(e.size>768*1024*1024)throw Error("Entrada demasiado grande");',
' const d=view(await blob.slice(e.offset,e.offset+30).arrayBuffer());if(d.byteLength!==30||u32(d,0)!==0x04034b50)throw Error("Cabecera ZIP inválida");',
' const off=e.offset+30+u16(d,26)+u16(d,28);if(off+e.compressed>blob.size)throw Error("Entrada truncada");',
' const input=blob.slice(off,off+e.compressed);',
' let result:Blob;if(e.method===0)result=input;else if(e.method===8)result=await new Response(input.stream().pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat))).blob();else throw Error("Compresión no compatible: "+e.method);',
' if(result.size!==e.size||crc32(new Uint8Array(await result.arrayBuffer()))!==e.crc)throw Error("CRC/tamaño incorrecto: "+e.name);return result;',
'}',
'export type ScanStats={glb:number;duplicates:number;archives:number;other:number;failed:string[]};',
'export async function scanKayKit(files:Blob[],names:string[],save:(path:string,model:Blob)=>Promise<boolean>,progress:(s:string)=>void):Promise<ScanStats>{',
' const stats:ScanStats={glb:0,duplicates:0,archives:0,other:0,failed:[]};let seenBytes=0;',
' async function walk(blob:Blob,base:string,depth:number){if(depth>4)throw Error("Demasiados ZIP anidados");stats.archives++;const entries=await readZip(blob);',
' for(const e of entries){const path=base+"/"+e.name;if(!/\\.(glb|zip)$/i.test(e.name)){stats.other++;continue}try{seenBytes+=e.size;if(seenBytes>4*1024*1024*1024)throw Error("Límite de importación 4 GB");const item=await extractZip(blob,e);',
' if(/\\.zip$/i.test(e.name)){await walk(item,path.replace(/\\.zip$/i,""),depth+1);continue}',
' const h=view(await item.slice(0,12).arrayBuffer());if(h.byteLength!==12||u32(h,0)!==0x46546c67||u32(h,4)!==2||u32(h,8)!==item.size)throw Error("GLB 2.0 inválido");',
' if(await save(path,item))stats.glb++;else stats.duplicates++;if((stats.glb+stats.duplicates)%25===0)progress(stats.glb+" modelos · "+stats.duplicates+" duplicados");',
' }catch(err){if(stats.failed.length<50)stats.failed.push(path+": "+String(err))}}}',
' for(let i=0;i<files.length;i++){progress("Leyendo "+names[i]);try{await walk(files[i]!,names[i]!.replace(/\\.zip$/i,""),0)}catch(e){stats.failed.push(names[i]+": "+String(e))}}return stats;',
'}',
].join("\n"));
const path=dir+"kingdom-editor.ts";let s=await fs.readFile(path,"utf8");
s='import {scanKayKit} from "./kingdom-zip.ts"\n'+s;
const anchor='void keys("assets").then(v=>{localIds=v;fillAssets()}).catch(()=>{});';
if(!s.includes(anchor))throw Error("No se encontró biblioteca");
s=s.replace(anchor,anchor+[
'',
' const zipInput=input("file");zipInput.multiple=true;zipInput.accept=".zip,application/zip";zipInput.hidden=true;panel.append(zipInput);',
' const zipRow=row(),zipButton=btn(zipRow,"Importar ZIP SOURCE / Halloween",()=>zipInput.click());',
' const zipStatus=el("small","KIT_COMPLETO_PARTE_01 + PARTE_02 + Halloween · solo en este navegador.");panel.append(zipStatus);',
' zipInput.onchange=()=>void(async()=>{const fs=Array.from(zipInput.files??[]);if(!fs.length)return;zipButton.disabled=true;try{const imported=await keys("assets"),known=new Set(imported);const stats=await scanKayKit(fs,fs.map(f=>f.name),async(path,blob)=>{const id="local/"+path;if(known.has(id))return false;await storePut("assets",id,blob);known.add(id);return true},message=>zipStatus.textContent=message);localIds=await keys("assets");fillAssets();zipStatus.textContent=stats.glb+" GLB importados · "+stats.duplicates+" existentes · "+stats.failed.length+" errores registrados · "+stats.other+" otros archivos omitidos";if(stats.failed.length)download("HIGHFLY-importacion-incidencias.json",stats);toast("Importación local terminada",stats.glb+" modelos nuevos")}catch(e){toast("No se pudo importar",String(e))}finally{zipButton.disabled=false;zipInput.value=""}})();',
].join("\n"));
await fs.writeFile(path,s);
