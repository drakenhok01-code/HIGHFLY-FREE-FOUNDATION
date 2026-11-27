// P575: derive a separate preview from the exact, validated P574 binary.
// Changes are strictly scoped to region data URLs, atlas URLs, release label and resume namespace.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const dir='dist/assets',out='overlay';
await fs.mkdir(out+'/assets',{recursive:true});
const names=(await fs.readdir(dir)).filter(n=>n.endsWith('.js')).sort();
if(!names.length)throw Error('Missing verified P574 bundle');
const renamed=new Map(names.map(n=>[n,n.slice(0,-3)+'-p575.js']));
const counts={regions:0,atlas:0,resume:0,label:0};
const replace=(s,a,b,key)=>{const n=s.split(a).length-1;if(key)counts[key]+=n;return s.replaceAll(a,b)};
const ref=s=>{for(const [a,b] of renamed)s=s.replaceAll(a,b);return s};
const digest=s=>createHash('sha256').update(s).digest('hex');
const proof=[];
for(const name of names){
 const old=await fs.readFile(path.join(dir,name),'utf8');
 let s=replace(old,'highfly/regions/','highfly/regions-p575/','regions');
 s=replace(s,'p564/','p564-p575/','atlas');
 s=replace(s,'highfly-unsung-regional-resume-v2','highfly-unsung-regional-resume-p575','resume');
 s=replace(s,'Viaje · 5.7.4','Viaje · 5.7.5','label');
 s=replace(s,'P5.7.4</div>','P5.7.5</div>','label');
 s=ref(s);
 await fs.writeFile(out+'/assets/'+renamed.get(name),s);
 proof.push({source:name,derived:renamed.get(name),before:digest(old),after:digest(s)});
}
if(!counts.regions||!counts.atlas||!counts.resume)throw Error('Could not identify the live P574 runtime URLs: '+JSON.stringify(counts));
const html=ref(await fs.readFile('dist/index.html','utf8'));
if(![...renamed.values()].some(n=>html.includes(n)))throw Error('New entrypoint not referenced');
await fs.writeFile(out+'/play-p575.html',html);
for(const p of ['regions-p575','p564-p575']){
 await fs.mkdir(out+'/highfly',{recursive:true});
 await fs.cp('dist/highfly/'+p,out+'/highfly/'+p,{recursive:true});
}
await fs.writeFile(out+'/highfly/release-p575.json',JSON.stringify({version:'5.7.5',baseCommit:'2243be1b33a00093e572f9cafaaae7b1fa4f85f7',baseRun:46009002629,sourceCommit:'ef56b1cdf247f8839bf7fbb289713b15dbacae8c',testedCommit:process.env.GITHUB_SHA,validationRun:Number(process.env.GITHUB_RUN_ID),data:'regions-p575',counts,proof},null,2));
console.log('HF575_OVERLAY '+JSON.stringify({files:names.length,counts}));
