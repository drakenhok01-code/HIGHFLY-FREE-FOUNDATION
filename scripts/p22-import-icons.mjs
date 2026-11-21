import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const manifest=JSON.parse(fs.readFileSync('docs/catalog/p22/P22_ASSETS_28_SHA256.json','utf8'));
const src=process.argv[2];
if(!src||!fs.existsSync(src)){
 console.error('Uso: node scripts/p22-import-icons.mjs /ruta/HIGHFLY_P22_WEBP256_LISTO_PARA_INTEGRAR.zip');
 process.exit(2);
}
const entryNames=execFileSync('unzip',['-Z','-1',src],{encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
const permitted=new Set([...manifest.files.map(x=>x.zipEntry),'ASSET_MANIFEST_P22.json','QA_RESULTS_P22.json']);
for(const e of entryNames)if(!permitted.has(e))throw Error('ZIP contiene entrada no autorizada: '+e);
for(const item of manifest.files)if(!entryNames.includes(item.zipEntry))throw Error('Falta icono '+item.zipEntry);
// Validate EVERY file before writing; do not touch existing V36 files.
const payloads=manifest.files.map(item=>{
 const data=execFileSync('unzip',['-p',src,item.zipEntry],{maxBuffer:2*1024*1024});
 const hash=crypto.createHash('sha256').update(data).digest('hex');
 if(hash!==item.sha256)throw Error('Icono modificado '+item.id);
 if(data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP')throw Error('WebP inválido '+item.id);
 return [item,data];
});
for(const [item] of payloads)if(fs.existsSync(item.intendedRepoFile))throw Error('No se sobrescribe arte existente: '+item.intendedRepoFile);
for(const [item,data] of payloads){
 fs.mkdirSync(path.dirname(item.intendedRepoFile),{recursive:true});
 fs.writeFileSync(item.intendedRepoFile,data,{flag:'wx'});
}
console.log('P2.2 importados '+payloads.length+' WebP como fuentes de arte separadas. NO se activó ningún binding ni se cambió gameplay.');
