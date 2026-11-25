/** P532 public CC0 imports only. Source files are original decoded GLBs
 * built from upstream Quaternius packs and checked against ClaudeCraft's
 * per-file CC0 attribution/source record. Every byte is pinned to a git blob.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {QUATERNIUS_CC0_ALL,QUATERNIUS_CC0_TAG} from '../src/highfly/p532-quaternius-cc0-catalog.mjs';

const ROOT=process.cwd(),dst=path.join(ROOT,'public/highfly/quaternius-cc0');
const ROOTURL='https://raw.githubusercontent.com/levy-street/world-of-claudecraft/'+QUATERNIUS_CC0_TAG+'/';
fs.mkdirSync(dst,{recursive:true});
if(QUATERNIUS_CC0_ALL.length!==42)throw Error('Incomplete Quaternius CC0 inventory');
const copyOne=async a=>{
 const url=ROOTURL+a.sourcePath;
 let bytes=null,last;
 for(let trial=0;trial<4;trial++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(35000)});
   if(!response.ok)throw Error('HTTP '+response.status+' '+url);
   bytes=Buffer.from(await response.arrayBuffer());break;
  }catch(e){last=e;await new Promise(r=>setTimeout(r,350*(trial+1)));}
 }
 if(!bytes)throw last||Error('Cannot retrieve CC0 model '+a.id);
 if(bytes.length!==a.sizeBytes)throw Error('Size mismatch '+a.id+' '+bytes.length+'/'+a.sizeBytes);
 if(bytes.toString('ascii',0,4)!=='glTF')throw Error('Not genuine GLB '+a.id);
 const hash=crypto.createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 if(hash!==a.gitBlob)throw Error('Original Git blob SHA changed for '+a.id+' '+hash);
 const rel=a.freePath.replace(/^quaternius-cc0\//,'');
 const output=path.join(dst,rel);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,bytes);
 return {id:a.id,source:url,size:bytes.length,gitBlob:hash,license:'CC0-1.0',sourcePack:a.sourcePack,redistribution:'Yes'};
};
const done=[];
for(let i=0;i<QUATERNIUS_CC0_ALL.length;i+=4){
 const batch=await Promise.all(QUATERNIUS_CC0_ALL.slice(i,i+4).map(copyOne));
 done.push(...batch);
}
fs.writeFileSync(path.join(dst,'manifest.json'),JSON.stringify({schema:1,author:'Quaternius',
 sources:'https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md',
 originalPacks:['Quaternius Medieval Village Pack','Quaternius Fantasy Props MegaKit','Quaternius Stylized Nature MegaKit'],
 license:'CC0-1.0',models:done},null,2));
fs.writeFileSync(path.join(dst,'CREDITS.txt'),
 'Quaternius CC0 original 3D assets. These files are taken unmodified from the credited CC0 media pack outputs of World of ClaudeCraft v0.44.7.\n'+
 'See https://github.com/levy-street/world-of-claudecraft/blob/v0.44.7/CREDITS.md\n'+
 'Original packs https://quaternius.com/packs/medievalvillage.html , https://quaternius.com/packs/fantasypropsmegakit.html , https://quaternius.itch.io/stylized-nature-megakit\n'+
 'CC0-1.0: https://creativecommons.org/publicdomain/zero/1.0/\n'+
 'No WoC proprietary or With-the-project-only media included.\n');
console.log('[P532 VERIFIED QUATERNIUS CC0]',done.length,'real GLB models,',done.reduce((p,x)=>p+x.size,0),'bytes');
