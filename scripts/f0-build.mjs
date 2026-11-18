import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const ROOT=process.cwd();
const config=JSON.parse(fs.readFileSync('foundation.config.json','utf8'));
const origin=path.join(ROOT,'.work','unsung');
const output=path.join(ROOT,'dist');
const SHA=config.unsungCommit;
if(!/^[0-9a-f]{40}$/.test(SHA))throw Error('Expected immutable Unsung commit');
if(config.allowPrivateAssets||config.allowKaykitPaid||config.allowClaudeAssets)throw Error('Private assets gate disabled');
function run(cmd,args,cwd=ROOT){
 const r=spawnSync(cmd,args,{cwd,stdio:'inherit',env:{...process.env,CI:'true'}});
 if(r.status!==0)throw Error(cmd+' '+args.join(' ')+' failed ('+r.status+')');
}
function capture(cmd,args,cwd=ROOT){
 const r=spawnSync(cmd,args,{cwd,encoding:'utf8'});
 if(r.status!==0)throw Error(r.stderr);
 return r.stdout.trim();
}
const loc=(f)=>path.join(origin,f);
const read=(f)=>fs.readFileSync(loc(f),'utf8');
const write=(f,text)=>fs.writeFileSync(loc(f),text);
function patch(f,a,b){
 const before=read(f), count=before.split(a).length-1;
 if(count!==1)throw Error('FAIL CLOSED: upstream drift '+f+' anchor '+a.slice(0,60)+' count '+count);
 write(f,before.replace(a,b));
 console.log('[HIGHFLY adapter] '+f);
}
function copy(source,dest){
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.copyFileSync(source,dest);
}
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function walk(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]).sort();
}

fs.rmSync(origin,{recursive:true,force:true});
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(path.dirname(origin),{recursive:true});
run('git',['clone','--quiet','--no-checkout',config.unsungRepository,origin]);
run('git',['checkout','--detach',SHA],origin);
const actual=capture('git',['rev-parse','HEAD'],origin);
if(actual!==SHA)throw Error('Unsung SHA mismatch');
const creditText=read('CREDITS.md');
const lines=creditText.split('\n');
const audio=walk(loc('public/audio')).filter(f=>f.endsWith('.ogg'));
const records=[];
const licenses={'CC-BY-4.0':0,'CC0-1.0':0};
for(const f of audio){
 const rel=path.relative(loc('public'),f).split(path.sep).join('/');
 const basename=path.basename(f);
 const row=lines.find(s=>s.startsWith('|')&&s.includes(basename));
 if(!row)throw Error('Missing credits for '+rel);
 const license=/CC BY 4\.0|CC-BY 4\.0/i.test(row)?'CC-BY-4.0':/CC0 1\.0/i.test(row)?'CC0-1.0':null;
 if(!license)throw Error('Unknown license for '+rel);
 licenses[license]++;
 records.push({id:'unsung:'+rel,path:rel,source:'https://github.com/Leonxlnx/unsung-vale/blob/'+SHA+'/public/'+rel,commit:SHA,bytes:fs.statSync(f).size,sha256:hash(f),license,decision:'ALLOW',commercial:true,redistribution:true,attributionRequired:license==='CC-BY-4.0',creditRow:row});
}
if(audio.length!==129||licenses['CC-BY-4.0']!==62||licenses['CC0-1.0']!==67)
 throw Error('Unsung audio baseline drift: '+JSON.stringify(licenses)+' '+audio.length);
for(const rel of ['world/core_h.bin','world/region_h.bin','world/world.json','models/hero.glb']){
 const f=loc('public/'+rel);
 if(!fs.existsSync(f))throw Error('Missing required world/model '+rel);
 records.push({id:'unsung:'+rel,path:rel,source:'https://github.com/Leonxlnx/unsung-vale/blob/'+SHA+'/public/'+rel,commit:SHA,bytes:fs.statSync(f).size,sha256:hash(f),license:'MIT (original Unsung)',decision:'ALLOW',commercial:true,redistribution:true,attributionRequired:true});
}
patch('src/world/terrain.js',"fetch('/world/world.json')","fetch(import.meta.env.BASE_URL + 'world/world.json')");
patch('src/world/terrain.js',"loadHeights('/world/core_h.bin', meta.core)","loadHeights(import.meta.env.BASE_URL + 'world/core_h.bin', meta.core)");
patch('src/world/terrain.js',"loadHeights('/world/region_h.bin', meta.region)","loadHeights(import.meta.env.BASE_URL + 'world/region_h.bin', meta.region)");
patch('src/main.js',"fetch('/models/hero.glb', { method: 'HEAD' })","fetch(import.meta.env.BASE_URL + 'models/hero.glb', { method: 'HEAD' })");
patch('src/anim/hero.js',"url = '/models/hero.glb'","url = import.meta.env.BASE_URL + 'models/hero.glb'");
patch('src/audio/audio.js',"async init(base = '/audio/')","async init(base = import.meta.env.BASE_URL + 'audio/')");
patch('src/ui/ui.js','<h1>Unsung Vale</h1>','<h1>HIGHFLY FREE FOUNDATION</h1>');

// F1 opt-in: one official FREE KayKit GLB, downloaded from a frozen public commit
// and rejected unless the exact independently recorded SHA-256 matches.
const kaykitCommit='672074b73ba276876a19e8816ecdc5241817ab47';
const kaykitRoot='https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/'+kaykitCommit+'/';
async function downloadPinned(relative,expected,out){
 const url=kaykitRoot+relative;
 const r=await fetch(url);
 if(!r.ok)throw Error('KayKit official asset unavailable '+r.status+' '+url);
 const bytes=Buffer.from(await r.arrayBuffer());
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out,bytes);
 if(hash(out)!==expected)throw Error('KayKit FREE asset digest mismatch '+relative);
 return {url,bytes:bytes.byteLength};
}
const kaykitAsset='addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb';
const kaykitModel=loc('public/models/hf-kaykit-knight.glb');
const kaykitResult=await downloadPinned(kaykitAsset,'60428e3abc09ba83e595d256e3af8c5c976b46cdae599f0802fc82b4a3445168',kaykitModel);
const kaykitLicense=loc('KAYKIT-FREE-LICENSE.txt');
await downloadPinned('LICENSE.txt','ae322141814056dda0deea7540d74c41d87aee1da319977cd1bd84ee5a923629',kaykitLicense);
records.push({id:'kaykit-free:Knight.glb',path:'models/hf-kaykit-knight.glb',source:kaykitResult.url,commit:kaykitCommit,bytes:kaykitResult.bytes,sha256:hash(kaykitModel),license:'CC0-1.0',decision:'ALLOW',commercial:true,redistribution:true,attributionRequired:false,author:'Kay Lousberg'});


copy(path.join(ROOT,'src/highfly/fog.mjs'),loc('src/highfly/fog.mjs'));
copy(path.join(ROOT,'src/highfly/mobile-touch.mjs'),loc('src/game/highfly-touch.mjs'));
copy(path.join(ROOT,'src/highfly/kaykit-free-hero.mjs'),loc('src/highfly/kaykit-free-hero.mjs'));

patch('src/main.js',"import { FILM } from './engine/quality.js';","import { FILM } from './engine/quality.js';\nimport { installHighflyFog } from './highfly/fog.mjs';\nimport { KayKitFreeHero } from './highfly/kaykit-free-hero.mjs';");
const pipeline=read('src/main.js').split('\n').find(x=>x.startsWith('const pipe = new Pipeline('));
if(!pipeline)throw Error('Unsung pipeline initialization missing');
patch('src/main.js',pipeline,pipeline+'\nwindow.__highflyFog = installHighflyFog(pipe);');
// F1 is strictly an opt-in lab, the F0 original hero stays default.
const nativeHero=read('src/main.js').split('\n').find(s=>s.startsWith("fetch(import.meta.env.BASE_URL + 'models/hero.glb'"));
if(!nativeHero)throw Error('Unsung original hero startup changed');
const freeHeroStart="if(new URLSearchParams(location.search).get('hfchar')==='kaykit'){\n"+
 " KayKitFreeHero.load(pipe).then(h=>{game.attachHero(h);window.__hero=h;}).catch(err=>{console.error('KayKit FREE lab failed; original Hero fallback',err);Hero.load(pipe,import.meta.env.BASE_URL+'models/hero.glb').then(h=>{game.attachHero(h);window.__hero=h;});});\n"+
 "}else{\n"+nativeHero+"\n}";
patch('src/main.js',nativeHero,freeHeroStart);

patch('src/game/input.js','export class Input {',"import { attachHighflyTouch, applyHighflyTouch } from './highfly-touch.mjs';\nexport class Input {");
patch('src/game/input.js','    this._down = new Set();','    this._down = new Set();\n    attachHighflyTouch(this);');
const inputEnd="    if (!this.enabled) { this.pressed = new Set([...this.pressed].filter((a) => a === 'pause' || a === 'map' || a === 'journal')); this.move.x = this.move.y = 0; this.look.x = this.look.y = 0; this.held.clear(); }";
patch('src/game/input.js',inputEnd,inputEnd+'\n    applyHighflyTouch(this);');

const changed=capture('git',['diff','--name-only'],origin).split('\n').filter(Boolean);
const allowed=new Set(['src/world/terrain.js','src/main.js','src/anim/hero.js','src/audio/audio.js','src/ui/ui.js','src/game/input.js']);
if(changed.some(x=>!allowed.has(x)))throw Error('Original Unsung world source modified illegally');
const terrainDiff=capture('git',['diff','--','src/world/terrain.js'],origin);
const delta=terrainDiff.split('\n').filter(x=>/^[+-](?![+-])/.test(x));
if(delta.length!==6||!delta.every(x=>/fetch\(|loadHeights\(/.test(x)))throw Error('World generation diff not limited to 3 Pages URLs');
run('npm',['ci','--no-audit','--no-fund'],origin);
run('npm',['run','build','--','--base','/'+config.pagesRepo+'/'],origin);
if(!fs.existsSync(loc('dist/index.html')))throw Error('No Vite output');
fs.cpSync(loc('dist'),output,{recursive:true});
copy(loc('LICENSE'),path.join(output,'LICENSES','UNSUNG-MIT.txt'));
copy(loc('CREDITS.md'),path.join(output,'CREDITS_UNSUNG.md'));
copy(kaykitLicense,path.join(output,'LICENSES','KAYKIT-ADVENTURERS-CC0.txt'));

copy(path.join(ROOT,'LICENSES','REUSE_NOTICES.md'),path.join(output,'LICENSES','REUSE_NOTICES.md'));
const modules=[
 ['three',['LICENSE','LICENSE.md','LICENSE.txt']],
 ['three-mesh-bvh',['LICENSE','LICENSE.md','LICENSE.txt']],
 ['@fontsource-variable/inter',['OFL.txt','OFL.md','LICENSE','LICENSE.txt','LICENSE.md']],
 ['@fontsource-variable/josefin-sans',['OFL.txt','OFL.md','LICENSE','LICENSE.txt','LICENSE.md']],
 ['@fontsource-variable/jost',['OFL.txt','OFL.md','LICENSE','LICENSE.txt','LICENSE.md']]
];
for(const [name,options] of modules){
 const folder=loc('node_modules/'+name);
 let file=options.map(x=>path.join(folder,x)).find(x=>fs.existsSync(x));
 if(!file){const available=fs.readdirSync(folder).find(x=>/^(OFL|LICENSE|LICENCE)/i.test(x));if(available)file=path.join(folder,available);}
 if(!file)throw Error('Missing dependency legal notice: '+name);
 copy(file,path.join(output,'LICENSES',name.replaceAll('/','_')+'.txt'));
}
fs.writeFileSync(path.join(output,'ASSET_MANIFEST.json'),JSON.stringify({schemaVersion:1,source:{repository:config.unsungRepository,commit:SHA},generated:new Date().toISOString(),records},null,2));
fs.writeFileSync(path.join(output,'BUILD_PROVENANCE.json'),JSON.stringify({phase:'F1 OPT-IN ONLY',originalUnsungCommit:SHA,pagesBase:'/'+config.pagesRepo+'/',worldAuthority:'UNSUNG',androidVisualQA:'NOT_RUN',kaykitQA:'NOT_RUN',kaykitCommit},null,2));
console.log('[HIGHFLY] Build finished: '+records.length+' original assets. Run npm run qa:dist before deployment.');
