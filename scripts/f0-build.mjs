import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const ROOT=process.cwd();
const config=JSON.parse(fs.readFileSync('foundation.config.json','utf8'));
const origin=path.join(ROOT,'.work','unsung');
const output=path.join(ROOT,'dist');
const SHA=config.unsungCommit;
const pagesBase=process.env.HIGHFLY_PAGES_BASE??('/'+config.pagesRepo+'/');
if(!pagesBase.startsWith('/'+config.pagesRepo+'/')||!/^[a-zA-Z0-9_.\/-]+$/.test(pagesBase)||!pagesBase.endsWith('/'))throw Error('Unsafe Pages base: '+pagesBase);
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
patch('src/anim/hero.js',"const HERO_VERT = /* glsl */ `","export const HERO_VERT = /* glsl */ `");
patch('src/audio/audio.js',"async init(base = '/audio/')","async init(base = import.meta.env.BASE_URL + 'audio/')");
patch('src/game/quests.js',"import * as THREE from 'three';",
 "import * as THREE from 'three';\nimport {translateHighfly} from '../highfly/es-localization.mjs';\nimport {localizeQuestData} from '../highfly/es-quest-data.mjs';\nimport {localizeNPCData} from '../highfly/es-npc-dialogues.mjs';");
patch('src/game/quests.js','export class Quests {',
 "localizeQuestData(QUESTS,IDLE,CHAT,translateHighfly);\nlocalizeNPCData(IDLE,CHAT);\nexport class Quests {");
patch("src/ui/ui.js","<h1>Unsung Vale</h1>","<h1>HIGHFLY: PHOENIX ASCENSIÓN</h1>");
patch("src/ui/ui.js","The valley has fallen silent. Wake its spires and let it sing again.","Entrená en la realidad. Ascendé en Aetheria. El poder no se hereda: se construye.");
patch("src/ui/ui.js","<div class=\"foot\">Everything you see is generated by code.</div>","<div class=\"foot\"></div>");
patch("src/ui/ui.js","const EMBLEM =","const MOBILE_KEYS = [[\"Mover\",\"Joystick izquierdo 360°\"],[\"Cámara\",\"Deslizar el dedo a la derecha\"],[\"Correr\",\"Botón CORRER\"],[\"Saltar\",\"Botón SALTO\"],[\"Rodar\",\"Botón ROLL\"],[\"Desplazamiento rápido\",\"Botón DASH\"],[\"Atacar\",\"Botón ATK\"],[\"Interactuar\",\"Botón USAR / acción contextual\"],[\"Habilidades\",\"Seis botones a la derecha\"],[\"Fijar objetivo\",\"Botón FIJAR\"],[\"Menú\",\"Pausa y opciones\"]];\nconst EMBLEM =");
patch("src/ui/ui.js","KEYS.map(([a, k])","((globalThis.navigator?.maxTouchPoints>0||globalThis.matchMedia?.('(pointer: coarse)')?.matches)?MOBILE_KEYS:KEYS).map(([a, k])");
patch("src/ui/ui.js","Design, code, models and textures are original to this project and generated procedurally. Music and sound come from the artists below; full details are in CREDITS.md.","HIGHFLY integra el mundo original de Unsung Vale (MIT) y recursos reutilizables autorizados. La música y los efectos conservan sus créditos; consultá CREDITS.md y las licencias de HIGHFLY.");
patch("index.html","<html lang=\"en\">","<html lang=\"es\">");
patch("index.html","<title>Unsung Vale</title>","<title>HIGHFLY: PHOENIX ASCENSIÓN | MMORPG Fitness</title>");
patch("index.html","<h1>Unsung Vale</h1>","<h1>HIGHFLY: PHOENIX ASCENSIÓN</h1>");
patch("index.html","Preparing the valley","Preparando Aetheria");
patch('index.html','</style>\n  </head>','</style>\n    <style>'+fs.readFileSync('src/highfly/phoenix-native-boot.css','utf8').replaceAll('__HF_BASE__',pagesBase)+'</style>\n  </head>');
patch("index.html","Unsung Vale: an original third-person fantasy RPG, generated entirely by code and rendered in your browser.","HIGHFLY: PHOENIX ASCENSIÓN. Entrená en la realidad. Ascendé en Aetheria. MMORPG fitness en tercera persona.");
patch("src/main.js","boot.querySelector('p').textContent = text;","boot.querySelector('p').textContent = translateHighfly(text);");
patch("src/main.js","tip.textContent = TIPS[tipN++ % TIPS.length];","tip.textContent = translateHighfly(TIPS[tipN++ % TIPS.length]);");
patch("index.html","The Vale could not be loaded (","No se pudo cargar Aetheria (");
patch("index.html","). Reload the page to try again.","). Recargá la página para volver a intentarlo.");

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
// F0.11.2: exact Standard assets from our Library, pin-verified with
// GitHub mirror. Source 15.7 MB is converted into only ~92 KB of animations.
// SOURCE GLBs and mannequin meshes never enter the final bundle.
const ualCommit='bb2ce469f0ab2ccfc487faef55550ba07fae2483';
const ualRoot='https://raw.githubusercontent.com/Barbatos6669/elderforge/'+ualCommit+'/assets/animations/';
const ualIn=[];
for(const [folder,fileName,expected] of [
 ['universal_animation_library_1/','UAL1_Standard.glb','69591853d817488edaa8fd9bf8fc1d821eaeaf789f8627b3cd23b41c4ed67997'],
 ['universal_animation_library_2/','UAL2_Standard.glb','8cee20ab1bc55130092447e810e26df22dd2803eccc54f52137a7d54d7ab88a8']
]){
 const file=loc('hf-ual-internal/'+fileName);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 // Former Elderforge remote deleted both binary assets. Recover only from
 // unchanged, versioned CC0 Quaternius mirrors and verify the original hash.
 const originUrl=ualRoot+folder+fileName;
 const response=await fetch(originUrl);
 if(response.ok){fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()));}
 else if(fileName==='UAL1_Standard.glb'){
  const mirror='https://github.com/WaviestSun/atelier-packs/releases/download/characters-1/UAL1_Standard.glb';
  const fallback=await fetch(mirror);
  if(!fallback.ok)throw Error('Quaternius UAL1 approved mirror unavailable '+fallback.status);
  fs.writeFileSync(file,Buffer.from(await fallback.arrayBuffer()));
  console.log('[HIGHFLY] Quaternius UAL1 exact SHA verified mirror');
 }else{
  const mirror='https://github.com/WaviestSun/atelier-packs/releases/download/packs-2/Universal-Animation-Library-2-Standard.zip';
  const fallback=await fetch(mirror);
  if(!fallback.ok)throw Error('Quaternius UAL2 approved mirror unavailable '+fallback.status);
  const zip=loc('hf-ual-internal/UAL2-mirror.zip');
  fs.writeFileSync(zip,Buffer.from(await fallback.arrayBuffer()));
  if(hash(zip)!=='4008ea208a604773a2b2177d965f0f5d3195498b5bf838c3f5785d68e95f2a68')
   throw Error('Quaternius UAL2 zip SHA-256 mismatch');
  const extract=spawnSync('python3',['-c',
   'import sys,zipfile,shutil;z=zipfile.ZipFile(sys.argv[1]);paths=[p for p in z.namelist() if p.endswith("/UAL2_Standard.glb")];assert len(paths)==1,paths;f=z.open(paths[0]);o=open(sys.argv[2],"wb");shutil.copyfileobj(f,o);o.close();f.close()',zip,file],{encoding:'utf8'});
  if(extract.status!==0)throw Error('Quaternius UAL2 mirror extraction failed '+extract.stderr);
  fs.rmSync(zip,{force:true});
  console.log('[HIGHFLY] Quaternius UAL2 exact SHA verified mirror');
 }
 if(hash(file)!==expected)throw Error('Quaternius GLB SHA-256 mismatch '+fileName);
 ualIn.push(file);
}
const ualOut=loc('public/animation/hf-ual-retarget.json');
run('node',[path.join(ROOT,'scripts/extract-ual.mjs'),...ualIn,ualOut]);
const ualExtract=JSON.parse(fs.readFileSync(ualOut,'utf8'));
for(const clip of ['Swim_Idle_Loop','Swim_Fwd_Loop','ClimbUp_1m'])
 if(!ualExtract.clips?.[clip]||ualExtract.clips[clip].bones.length<10)
  throw Error('UAL retarget clip invalid '+clip);
records.push({id:'quaternius-ual:retargeted-swim-climb',path:'animation/hf-ual-retarget.json',
 source:ualRoot+'universal_animation_library_1/UAL1_Standard.glb',
 sources:[ualRoot+'universal_animation_library_1/UAL1_Standard.glb',ualRoot+'universal_animation_library_2/UAL2_Standard.glb'],
 commit:ualCommit,bytes:fs.statSync(ualOut).size,sha256:hash(ualOut),
 license:'CC0-1.0',decision:'ALLOW',commercial:true,redistribution:true,
 attributionRequired:false,author:'Quaternius',clips:Object.keys(ualExtract.clips)});
 
// F0.10: two original MIT Emberfall Blender models with frozen hashes.
const emberCommit='5d199ab4888e428b0dab80528a37ab8ac0107360';
const emberRoot='https://raw.githubusercontent.com/we1jia/emberfall/'+emberCommit+'/public/assets/models-v3/';
for(const [fileName,outName,expected] of [
 ['Lightning_Spear.glb','hf-emberfall-spear.glb','fa0ca2b83f5e12aa23c74a429b43d49c78a99982b3b12a3d623b949d9646c429'],
 ['Water_Staff.glb','hf-emberfall-staff.glb','d38e82e7aea27ef140498ecec1d2815e4825f9daa054d09536e06e13e4ed9e64']
]){
 const url=emberRoot+fileName,resp=await fetch(url);
 if(!resp.ok)throw Error('Emberfall original weapon unavailable '+resp.status+' '+fileName);
 const dest=loc('public/models/'+outName);
 fs.writeFileSync(dest,Buffer.from(await resp.arrayBuffer()));
 if(hash(dest)!==expected)throw Error('Emberfall SHA mismatch '+fileName);
 records.push({id:'emberfall-original:'+fileName,path:'models/'+outName,source:url,
  commit:emberCommit,sha256:expected,bytes:fs.statSync(dest).size,
  license:'MIT (Emberfall original geometry)',decision:'ALLOW',commercial:true,
  redistribution:true,attributionRequired:true,author:'we1jia / Emberfall'});
}



copy(path.join(ROOT,'src/highfly/fog.mjs'),loc('src/highfly/fog.mjs'));
copy(path.join(ROOT,'src/highfly/mobile-touch.mjs'),loc('src/game/highfly-touch.mjs'));
copy(path.join(ROOT,'src/highfly/hud-editor.mjs'),loc('src/highfly/hud-editor.mjs'));
copy(path.join(ROOT,'src/highfly/hero-portrait.mjs'),loc('src/highfly/hero-portrait.mjs'));
copy(path.join(ROOT,'src/highfly/cliff-camera.mjs'),loc('src/highfly/cliff-camera.mjs'));
for(const name of ['rpg-equipment','rpg-itemization','premium-skill-art','system-dialog'])copy(path.join(ROOT,'src/highfly/'+name+'.mjs'),loc('src/highfly/'+name+'.mjs'));
for(const name of ['highfly-icons','hero-sanctuary','quest-petal','world-petal','forge-chamber'])
 copy(path.join(ROOT,'assets/highfly/'+name+'.svg'),loc('public/highfly/'+name+'.svg'));
for(const name of ['approved-logo','approved-potions','approved-hero'])
 copy(path.join(ROOT,'assets/highfly/'+name+'.webp'),loc('public/highfly/'+name+'.webp'));
copy(path.join(ROOT,'assets/highfly/brand/highfly-official.avif'),loc('public/highfly/brand/highfly-official.avif'));
// F0.14.8 premium: hand-painted raster illustration packs are unpacked to REAL
// individual assets in public/highfly/premium; live game state/UI is untouched.
// Fixed SHA-256 protects source archives from corruption and accidental drift.
const premiumArchiveHashes={
 'HF_PHOENIX_ITEMS.zip':'a92a67f613fc10d1c42588f83ae8f68c42f24a84df1e18e847765c9b2a559cc6',
 'HF_PHOENIX_BACKGROUNDS.zip':'42dfe7d936cbe31b5ff386ddebc75d170722eb863d1a246845a0cff8d8665e88',
 'HF_PHOENIX_MISSIONS_A.zip':'ffeff308148c5f61ea75697e010cb8ea4421ab0ac5e3bb7bffb3d28f587980e4',
 'HF_PHOENIX_MISSIONS_B.zip':'83291e744de6fa9f27946f0d80ca1aad0e0d5a8286fed7d71b62253e33c5c40d'
};
const rasterOutput=loc('public/highfly/premium');
fs.mkdirSync(rasterOutput,{recursive:true});
for(const source of walk(path.join(ROOT,'assets/highfly/premium'))){
 if(source.endsWith('.zip'))continue;
 if(!source.endsWith('.svg'))throw Error('Unexpected premium source: '+source);
 copy(source,path.join(rasterOutput,path.basename(source)));
}
for(const [name,expected] of Object.entries(premiumArchiveHashes)){
 const archive=path.join(ROOT,'assets/highfly/premium',name);
 if(!fs.existsSync(archive)||hash(archive)!==expected)throw Error('PREMIUM raster pack missing/corrupt: '+name);
 const list=capture('unzip',['-Z','-1',archive]).split('\n').filter(Boolean);
 if(!list.length)throw Error('Empty premium pack: '+name);
 for(const entry of list)if(!/^(items|skills|professions|backgrounds|quests)\/[a-z0-9_]+\.webp$/.test(entry))throw Error('Invalid ZIP asset path: '+entry);
 const tmp=path.join(ROOT,'.work','premium-unpack',name);
 fs.mkdirSync(tmp,{recursive:true});
 run('unzip',['-qo',archive,'-d',tmp]);
 for(const entry of list){
  const source=path.join(tmp,entry),dest=path.join(rasterOutput,path.basename(entry));
  if(fs.statSync(source).size<1000)throw Error('Premium artwork empty: '+entry);
  if(fs.existsSync(dest))throw Error('Duplicate premium ID: '+entry);
  copy(source,dest);
 }
 console.log('[HIGHFLY ART]',name,list.length,'individual WebP assets');
}
const rasterExpected=[
 ...'hp_potion mp_potion herb ore wood fish ingot blade_blank seed bag_upgrade training_sword training_shield training_greatsword'.split(' ').map(id=>'item_'+id),
 ...'attack dash roll heavy pulse heal'.split(' ').map(id=>'skill_'+id),
 ...'recoleccion mineria tala pesca cocina alquimia fundicion forja'.split(' ').map(id=>'profession_'+id),
 ...'character_sanctuary forge_workshop'.split(' '),
 ...'primary scales amber kept nine answer vellum2 count2 names rings vellum count seeds stair voices lamps water debt windfall'.split(' ').map(id=>'quest_'+id)
];
if(rasterExpected.length!==48)throw Error('Incorrect raster manifest count');
for(const id of rasterExpected)
 if(!fs.existsSync(path.join(rasterOutput,id+'.webp')))throw Error('Missing premium image '+id);
console.log('[HIGHFLY PHOENIX] 48 individual painterly graphics verified');

// HIGHFLY ICON PACK V1: exact user-provided WebP 256x256 assets.
// Archives are pinned by SHA-256 and expanded into real individual files.
// Independent of F0.14.8 mechanics, KayKit models and skill unlock state.
const userIconPackHashes={
 'armor':'5ae833209b0fdffbe6e0d33ab8c58de609f639e0d6142a035e04e3ceb910bc21',
 'items':'0861a7fc17ec50ff88403969cca115da8cef1aabffcef9e43b24ce59a07aa774',
 'navigation':'01f7f2d60cd598e96557c4f49548f8ab631d556f357f6317be4add418df209b8',
 'professions':'2f888665537bc7b96f7bce8d88ca6602395c393500cfa4ca02f9dbcfdff151c0',
 'skills':'c0ae669e42610c5e041d91b62c1aa059b814dc85b7d7f5ded9f043bf71b523e1',
 'skills-advanced':'5f0c40d5e6034e41dc3b264f6383e340d42bb39aca1289d808cdff2cf6fd935b',
 'weapons':'ef5cef4b03b5ad00b74618167b84a5d592e94c42770aa7293786a6fe75fb3173'
};
const packSizes={armor:8,items:11,navigation:9,professions:8,skills:8,'skills-advanced':8,weapons:8};
const iconDest=loc('public/highfly/user-icons');
fs.mkdirSync(iconDest,{recursive:true});
let userIconCount=0;
for(const [category,expectedHash] of Object.entries(userIconPackHashes)){
 const name='hf_user_icons_'+category+'.zip';
 const file=path.join(ROOT,'assets/highfly/premium',name);
 if(!fs.existsSync(file)||hash(file)!==expectedHash)throw Error('Original user icon pack missing or hash mismatch: '+name);
 const entries=capture('unzip',['-Z','-1',file]).split('\n').filter(Boolean);
 if(entries.length!==packSizes[category])throw Error('Wrong icon count '+category+': '+entries.length);
 for(const entry of entries){
  if(!entry.startsWith(category+'/')||!/^(armor|items|navigation|professions|skills|skills-advanced|weapons)\/[a-z0-9_]+\.webp$/.test(entry))
   throw Error('Unsafe user icon entry '+entry);
 }
 const temp=path.join(ROOT,'.work','user-icons-unpack',category);
 fs.mkdirSync(temp,{recursive:true});
 run('unzip',['-qo',file,'-d',temp]);
 for(const entry of entries){
  const source=path.join(temp,entry),dest=path.join(iconDest,entry);
  const bytes=fs.readFileSync(source);
  if(bytes.length<1000||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Not a WebP icon '+entry);
  if(fs.existsSync(dest))throw Error('Duplicate user icon '+entry);
  copy(source,dest);
  userIconCount++;
 }
 console.log('[HIGHFLY USER ICONS]',category,entries.length,'original 256x256 WebP images verified');
}
if(userIconCount!==60)throw Error('Expected 60 user icons, got '+userIconCount);
// Original user WebPs are RGB opaque; remove connected near-black border exterior,
// preserving the gilded art, and keep URLs/real item IDs exactly the same.
run(process.env.HIGHFLY_ICON_PYTHON || 'python3',['scripts/highfly-icon-alpha.py',iconDest]);
run(process.env.HIGHFLY_ICON_PYTHON || 'python3',['scripts/highfly-metal-variants.py',iconDest]);
// Distinct painterly ore silhouettes and two true enhancement-stone families.
run(process.env.HIGHFLY_ICON_PYTHON || 'python3',['scripts/highfly-p46-material-art.py',iconDest]);
// P4.7B: approved 12 PAINTERLY ICONS from real binary Git atlas, inserted
// BEFORE the established rarity-frame workflow. NEVER redraw the frames.
run(process.env.HIGHFLY_ICON_PYTHON || 'python3',['scripts/highfly-p47b-approved-icons.py',path.join(ROOT,'assets/highfly/p47/source-12-icons.jpg'),iconDest]);
// P4.8.1: ONLY the copper ingot needs three aligned bars, same original frames.
run(process.env.HIGHFLY_ICON_PYTHON || 'python3',['scripts/highfly-p481-copper-ingot.py',path.join(ROOT,'assets/highfly/p481/copper-triple.webp.b64'),iconDest]);
// P4.8.2: the SAME three-bar source, tinted for the other seven metal IDs.
// All artwork remains inside each previously approved frame; 6 rarities downstream.
run(process.env.HIGHFLY_ICON_PYTHON || 'python3',['scripts/highfly-p482-three-ingots.py',path.join(ROOT,'assets/highfly/p481/copper-triple.webp.b64'),iconDest]);
// Restore the approved P3.2 visual language without embedding 96 base64 images
// in JavaScript: six real WebP frame variants generated on every deterministic build.
run(process.env.HIGHFLY_ICON_PYTHON || 'python3',['scripts/highfly-p43-premium-art.py',iconDest,loc('public/highfly/rarity')]);
run(process.env.HIGHFLY_ICON_PYTHON || 'python3',['scripts/highfly-p44-align-art.py',iconDest,loc('public/highfly/rarity'),loc('public/highfly/brand/highfly-official.avif'),loc('public/highfly/brand/official-rpg-fitness.webp')]);
console.log('[HIGHFLY USER ICON PACK V1] 60 original WebP icons installed; 24 future references kept inactive');



for(const name of ['premium-assets.mjs','premium-map.mjs'])copy(path.join(ROOT,'src/highfly/'+name),loc('src/highfly/'+name));
for(const name of ['p491-cc0-creatures.mjs','p49-hunt-data.mjs','p49-hunt-world.mjs','p492-kaykit-people.mjs','p492-radar.mjs','p493-item-transactions.mjs','p493-interaction.mjs','p493-portal.mjs','p493-interaction.css','p494-cartographic-map.mjs','p494-stair-guard.mjs','p495-stair-route.mjs','p496-stair-camera.mjs','p498-android-resolution.mjs','p499-native-profiler.mjs','p501-stage-profiler.mjs','p502-fps-audit.mjs','p503-opaque-copy.mjs','p504-hdr-options.mjs','p505-frame-pacing.mjs','p49-hunts.css','rpg-bag-capacity.mjs','rpg-core.mjs','p41-loot.mjs','p41-world-loot.mjs','p42-item-art.mjs','premium-p41.css','premium-p42.css','premium-p43.css','premium-p44.css','premium-p45.css','premium-p46.css','premium-p47.css','premium-rpg.mjs','premium-rpg.css','premium-f0148-v2.css','premium-f0148-v3.css','premium-f0148-v3-1-polish.css','premium-f0148-v3-2-clean.css','premium-f0148-user-icons.css','phoenix-brand.css','phoenix-intro.mjs','phoenix-v36-polish.css'])copy(path.join(ROOT,'src/highfly/'+name),loc('src/highfly/'+name));
copy(path.join(ROOT,'src/highfly/kaykit-free-hero.mjs'),loc('src/highfly/kaykit-free-hero.mjs'));
copy(path.join(ROOT,'src/highfly/stylize-kaykit-free.mjs'),loc('src/highfly/stylize-kaykit-free.mjs'));
copy(path.join(ROOT,'src/highfly/kaykit-material.mjs'),loc('src/highfly/kaykit-material.mjs'));
copy(path.join(ROOT,'src/highfly/universal-gear.mjs'),loc('src/highfly/universal-gear.mjs'));
copy(path.join(ROOT,'src/highfly/universal-motion.mjs'),loc('src/highfly/universal-motion.mjs'));
copy(path.join(ROOT,'src/highfly/flow-combat.mjs'),loc('src/highfly/flow-combat.mjs'));
for(const name of ['directional-rig','wall-physics','oxygen-progression','visual-profile','es-localization','es-quest-data','es-npc-dialogues','professions','profession-yard','worksite-data'])
  copy(path.join(ROOT,'src/highfly/'+name+'.mjs'),loc('src/highfly/'+name+'.mjs'));
copy(path.join(ROOT,'src/highfly/ual-retarget.mjs'),loc('src/highfly/ual-retarget.mjs'));
copy(path.join(ROOT,'src/highfly/qa-kaykit-entry.mjs'),loc('src/highfly/qa-kaykit-entry.mjs'));
copy(path.join(ROOT,'src/highfly/qa-kaykit.html'),loc('qa-kaykit.html'));
copy(path.join(ROOT,'src/highfly/qa-touch.html'),loc('qa-touch.html'));
copy(path.join(ROOT,'src/highfly/qa-touch-entry.mjs'),loc('src/highfly/qa-touch-entry.mjs'));
copy(path.join(ROOT,'src/highfly/qa-browser.mjs'),loc('scripts/qa-browser.mjs'));
copy(path.join(ROOT,'src/highfly/qa-world-browser.mjs'),loc('scripts/qa-world-browser.mjs'));
copy(path.join(ROOT,'src/highfly/qa-rpg-browser.mjs'),loc('scripts/qa-rpg-browser.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p49-browser.mjs'),loc('scripts/qa-p49-browser.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p494-visual.html'),loc('qa-p494-visual.html'));
copy(path.join(ROOT,'src/highfly/qa-p494-visual-entry.mjs'),loc('src/highfly/qa-p494-visual-entry.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p494-visual-browser.mjs'),loc('scripts/qa-p494-visual-browser.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p501-stair-apron.mjs'),loc('src/highfly/qa-p501-stair-apron.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p503-grass.mjs'),loc('src/highfly/qa-p503-grass.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p504-hdr.mjs'),loc('src/highfly/qa-p504-hdr.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p504-hdr.html'),loc('qa-p504-hdr.html'));
copy(path.join(ROOT,'src/highfly/qa-p504-hdr-entry.mjs'),loc('src/highfly/qa-p504-hdr-entry.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p504-browser.mjs'),loc('src/highfly/qa-p504-browser.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p507-sky.mjs'),loc('src/highfly/qa-p507-sky.mjs'));
copy(path.join(ROOT,'src/highfly/p508-world-clock.mjs'),loc('src/highfly/p508-world-clock.mjs'));
copy(path.join(ROOT,'src/highfly/p510-world-alive.mjs'),loc('src/highfly/p510-world-alive.mjs'));
copy(path.join(ROOT,'src/highfly/p511-sky-events.mjs'),loc('src/highfly/p511-sky-events.mjs'));
copy(path.join(ROOT,'src/highfly/p510-staged-shadows.mjs'),loc('src/highfly/p510-staged-shadows.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p510-shadows.mjs'),loc('src/highfly/qa-p510-shadows.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p495-stairs.mjs'),loc('src/highfly/qa-p495-stairs.mjs'));
copy(path.join(ROOT,'src/highfly/qa-p495-stairs.mjs'),loc('scripts/qa-p495-stairs.mjs'));

// P4.9.1 REAL skinned, animated animal GLBs from free CC0 source packs.
// Fail closed: expected *Git blob* fingerprints are checked byte-for-byte,
// not guessed from filenames or publisher descriptions.
const approvedSpecies={
 wolf:{origin:'https://github.com/levy-street/world-of-claudecraft/blob/v0.45.8/public/models/creatures/wolf.glb',
  sourcePack:'Quaternius animated creatures',author:'Quaternius',gitBlob:'00d69a6c127752c2506c66bc93db9a10f4a73df0'},
 crab:{origin:'https://github.com/levy-street/world-of-claudecraft/blob/v0.45.8/public/models/creatures/crabenemy.glb',
  sourcePack:'Quaternius animated creatures',author:'Quaternius',gitBlob:'ceb814db15ad267caeabadfb4da0299eccc807aa'},
 boar:{origin:'https://github.com/zttimmerman/project-whiskeyjack/blob/main/assets/meshes/gobkit_Boar.glb',
  original:'https://gobkit.itch.io/gobkit-free-animal-pack-vol-2',
  sourcePack:'Gobkit Animal Pack B',author:'Gobkit / Alsomind Tech',gitBlob:'f57ae4b2a4fa6df29e6feaf5fb9a7e39ec5ff73d'}
};
for(const [id,m] of Object.entries(approvedSpecies)){
 const src=path.join(ROOT,'assets/highfly/p491/models/'+id+'.glb'), dest=loc('public/models/hf-p491-'+id+'.glb');
 if(!fs.existsSync(src))throw Error('P491 CC0 rig missing '+src);
 const bytes=fs.readFileSync(src);
 const gitBlob=crypto.createHash('sha1').update('blob '+bytes.length).update(Buffer.from([0])).update(bytes).digest('hex');
 if(gitBlob!==m.gitBlob)throw Error('P491 model SHA mismatch '+id+' '+gitBlob);
 if(bytes.toString('utf8',0,4)!=='glTF')throw Error('P491 invalid GLB header: '+id);
 copy(src,dest);
 records.push({id:'highfly-p491:'+id,path:'models/hf-p491-'+id+'.glb',source:m.origin,
  original:m.original??m.origin,sha256:hash(dest),gitBlob,bytes:bytes.length,
  author:m.author,sourcePack:m.sourcePack,license:'CC0-1.0',decision:'ALLOW',
  commercial:true,redistribution:true,attributionRequired:false});
}

// Every wildlife icon is an independent original HIGHFLY vector painting.
copy(path.join(ROOT,'assets/highfly/p496/wolf_pelt.svg'),loc('public/highfly/p496/wolf_pelt.svg'));
for(const id of ['wolf_pelt','boar_tusk','crab_shell','quest_wolf']){
 const source=path.join(ROOT,'assets/highfly/p494/'+id+'.svg');
 const dest=loc('public/highfly/p494/'+id+'.svg');
 copy(source,dest);
 if(fs.statSync(dest).size<250)throw Error('Invalid HIGHFLY P494 wildlife illustration '+id);
}
copy(path.join(ROOT,'src/highfly/qa-rpg-entry.mjs'),loc('src/highfly/qa-rpg-entry.mjs'));
copy(path.join(ROOT,'src/highfly/qa-rpg.html'),loc('qa-rpg.html'));
copy(path.join(ROOT,'src/highfly/dash.mjs'),loc('src/game/highfly-dash.mjs'));

patch('src/main.js',"import { FILM } from './engine/quality.js';",
 "import { FILM } from './engine/quality.js';\\nimport { installAndroidPhysicalResolution } from './highfly/p498-android-resolution.mjs';\\nimport { installP499GpuDiagnostics } from './highfly/p499-native-profiler.mjs';\\nimport { installP501StageProfiler } from './highfly/p501-stage-profiler.mjs';\\nimport { installP502AutoProfiler } from './highfly/p502-fps-audit.mjs';\\nimport { installP503OpaqueCopy } from './highfly/p503-opaque-copy.mjs';\\nimport { installP505FramePacing } from './highfly/p505-frame-pacing.mjs';\\nimport { installHighflyFog } from './highfly/fog.mjs';\\nimport { KayKitFreeHero } from './highfly/kaykit-free-hero.mjs';\\nimport { installHighflyGraphics } from './highfly/visual-profile.mjs';\\nimport { installSpanishLocalization, translateHighfly } from './highfly/es-localization.mjs';\\nimport { installProfessionYard } from './highfly/profession-yard.mjs';\nimport { installPremiumRpgUI } from './highfly/premium-rpg.mjs';\nimport { installP49Hunts } from './highfly/p49-hunt-world.mjs';\nimport { installHighflyKayKitPeople } from './highfly/p492-kaykit-people.mjs';\nimport { installP493Interaction } from './highfly/p493-interaction.mjs';\nimport { installP493PortalVisuals } from './highfly/p493-portal.mjs';\nimport { installHighflyIntro } from './highfly/phoenix-intro.mjs';".replaceAll('\\n','\n'));
patch('src/main.js',"const settings = new Settings(pipe.renderer);",
 "const settings = new Settings(pipe.renderer);\\nwindow.__hfGraphics=installHighflyGraphics(pipe,settings,location.search);".replaceAll('\\n','\n'));
// P498 — actual Android drawing pixels instead of CSS pixels.
// Both native display framebuffer AND internally owned post-process targets
// are resized together via original Pipeline.setSize; no DPR double-up.
patch('src/main.js',"function resize() { pipe.setSize(window.innerWidth, window.innerHeight); }",
 "const __hfPixelLab=installAndroidPhysicalResolution(pipe,{search:location.search});\\nfunction resize() { __hfPixelLab.resize(); }".replaceAll('\\n','\n'));
// P5.0.1: The video confirms an exposed blue water pocket directly ahead
// of the first tread at Petal/Cantor stair (x=-118,z=-459). This original
// entrance is otherwise open because there is no low stone approach apron.
// Extend the SAME Unsung paving material by ~6.6m on the lower/positive-X
// approach. Include it in the original architecture mesh and native BVH,
// never add a floating overlay or alter terrain/water/assets.
patch('src/world/arch/sites.js',
 '        stairs(q, run, rise, 9);',
 `        stairs(q, run, rise, 9);
        // HIGHFLY P501: stone apron seals the exposed foot-of-stair water gap.
        // Original local +X goes uphill (world -X); negative X faces Cantor.
        // The apron top is 5 cm BELOW the first tread to avoid a step snag.
        q.mat_(M.PAVING).box(-6.6, -1.05, -4.5, 7.1, 1.17, 9, '-y');`);
// P504: opt-in packed high-dynamic-range render targets.  The GPU may
// support R11F_G11F_B10F (4 bytes per pixel) instead of RGBA16F (8 B/px).
// Test actual framebuffer completeness before use, restore RGBA16F on any
// failure. Scene, fog, opaque refraction and both TAA history buffers only.
// No change to native pixel dimensions or visible foliage/objects.
patch('src/engine/pipeline.js',
 "import { FullscreenPass, makeTarget } from './fullscreen.js';",
 "import { FullscreenPass, makeTarget } from './fullscreen.js';\\nimport { selectP504HdrFormat } from '../highfly/p504-hdr-options.mjs';".replaceAll('\\n','\n'));
patch('src/engine/pipeline.js',
 "    this.renderer = renderer;",
 "    this.renderer = renderer;\\n    this._hfHdrFormat=selectP504HdrFormat(renderer,globalThis.location?.search||'');\\n    this._hfCompactHdr=this._hfHdrFormat.options||{};".replaceAll('\\n','\n'));
patch('src/engine/pipeline.js',
 "    this.rtScene = makeTarget(rw, rh, { depthBuffer: true });",
 "    this.rtScene = makeTarget(rw, rh, { depthBuffer: true, ...this._hfCompactHdr });");
patch('src/engine/pipeline.js',
 "    this.rtFog = makeTarget(rw, rh);",
 "    this.rtFog = makeTarget(rw, rh, this._hfCompactHdr);");
patch('src/engine/pipeline.js',
 "    this.rtOpaque = makeTarget(rw, rh);",
 "    this.rtOpaque = makeTarget(rw, rh, this._hfCompactHdr);");
patch('src/engine/post.js',
 "    this.history = [makeTarget(w, h), makeTarget(w, h)];",
 "    this.history = [makeTarget(w, h, this.pipe._hfCompactHdr), makeTarget(w, h, this.pipe._hfCompactHdr)];");
// P505: optional RGB11F bloom mip chain. Bloom's shaders use only .rgb,
// and explicitly write opaque alpha 1, so packing does not remove any
// material transparency or alter the viewport. Requires BOTH ?hfcompact=1
// AND ?hfbloomcompact=1. Normal play is pixel-identical to approved P504.
patch('src/engine/pipeline.js',
 "    this.bloom = new BloomPass();",
 `    this.bloom = new BloomPass();
    this.bloom._hfCompactHdr=this._hfHdrFormat?.enabled &&
      new URLSearchParams(globalThis.location?.search||'').get('hfbloomcompact')==='1'
        ? this._hfCompactHdr : undefined;`);
patch('src/engine/post.js',
 "      this.mips.push(makeTarget(w, h));",
 "      this.mips.push(makeTarget(w, h, this._hfCompactHdr));");
patch('src/engine/post.js',
 "      this.ups.push(makeTarget(w, h));",
 "      this.ups.push(makeTarget(w, h, this._hfCompactHdr));");
// P507: keep P506's Spanish death and checkpoint notifications.
// This only changes strings; all native damage, respawn and timers remain intact.
patch('src/ui/ui.js',"    if (type === 'player' && d.type === 'death' && !g.cine) this.toast('The note falters', 'You will wake at the last safe place');","    if (type === 'player' && d.type === 'death' && !g.cine) this.toast('Has caído', 'Reaparecerás en el último lugar seguro.');\n    if (type === 'respawn' && !g.cine) this.toast('Has reaparecido', 'Regresaste al último lugar seguro.');");
// P507 SUPREMA: exact sky environment GPU pass deduplication.
// The resolve shader reads cloud textures/blend/atmosphere, not cloudTime.
// NO reduced resolution, cloud quality, shadows, or lost visual effects.
patch('src/engine/sky.js',"  invalidate() { this.ready = false; }","  invalidate() { this.ready = false; this._hfP507EnvDirty = true; }");
patch('src/engine/sky.js',"    this.uniforms.uCloudMix.value = this.mix;\n    this.resolve.render(this.renderer, this.env);\n    if (this._needSH && this.mix >= 1) { this._needSH = false; this._computeSHAsync(); }","    this.uniforms.uCloudMix.value = this.mix;\n    // No approximation: identical sky inputs yield identical env texels\n    // and mipmaps. The in-progress cloudRaw tile sweep is NOT sampled here.\n    const hfA = this.uniforms.uCloudA.value;\n    const hfB = this.uniforms.uCloudB.value;\n    const hfAtmo = this.uniforms.uSkyAtmo.value;\n    if (this._hfP507EnvDirty || this._hfP507EnvMix !== this.mix ||\n        this._hfP507EnvA !== hfA || this._hfP507EnvB !== hfB ||\n        this._hfP507EnvAtmo !== hfAtmo) {\n      this.resolve.render(this.renderer, this.env);\n      this._hfP507EnvMix = this.mix;\n      this._hfP507EnvA = hfA; this._hfP507EnvB = hfB;\n      this._hfP507EnvAtmo = hfAtmo;\n      this._hfP507EnvDirty = false;\n      this._hfP507EnvDraws = (this._hfP507EnvDraws || 0) + 1;\n    } else {\n      this._hfP507EnvSkips = (this._hfP507EnvSkips || 0) + 1;\n    }\n    if (this._needSH && this.mix >= 1) { this._needSH = false; this._computeSHAsync(); }");
// P508: same native sky/tonemap passes. No new render passes.
patch('src/engine/pipeline.js',"uniform vec3 uSunColor;\nvoid main() {","uniform vec3 uSunColor;\n\nuniform vec4 uHFGrade;\nuniform float uHFClock;\nuniform float uHFAurora;\nfloat hfHash(vec2 c){return fract(sin(dot(c,vec2(127.1,311.7)))*43758.5453123);}\nvoid main() {");
patch('src/engine/pipeline.js',"  vec3 col = s.rgb;\n  // Sun disc","  vec3 col = s.rgb;\n\n  float hfNight=clamp(uHFGrade.w,0.0,1.0);\n  col=mix(col,col*vec3(1.17,0.89,0.97),uHFGrade.x*0.48);\n  col=mix(col,col*vec3(0.83,1.05,1.26),uHFGrade.y*0.35);\n  col=mix(col,col*vec3(0.052,0.080,0.15),hfNight);\n  if(hfNight>0.001 && rd.y>0.01){\n    vec2 st=vec2(atan(rd.z,rd.x)*0.15915494+0.5,asin(clamp(rd.y,-1.0,1.0))*0.63661977)*vec2(430.0,155.0);\n    vec2 f=fract(st)-0.5;\n    float seed=hfHash(floor(st));\n    float star=step(0.992,seed)*(1.0-smoothstep(0.006,0.09,length(f)));\n    col+=vec3(0.72,0.83,1.0)*star*hfNight*0.54*(0.81+0.19*sin(uHFClock*0.8+seed*39.0));\n  }\n  if(hfNight>0.01 && uHFAurora>0.0 && rd.y>0.07){\n    float theta=atan(rd.z,rd.x);\n    float wave=sin(theta*13.0+sin(theta*4.0+uHFClock*0.09)*2.2-uHFClock*0.037);\n    float curtain=exp(-pow((rd.y-(0.29+0.095*wave))/0.17,2.0));\n    float ribs=0.58+0.42*pow(0.5+0.5*sin(theta*95.0+uHFClock*0.35),5.0);\n    float edge=smoothstep(0.055,0.22,rd.y)*(1.0-smoothstep(0.60,0.93,rd.y));\n    float a=curtain*ribs*edge*hfNight*uHFAurora;\n    col+=mix(vec3(0.055,0.9,0.55),vec3(0.36,0.28,1.12),0.5+0.5*sin(theta*5.0+uHFClock*0.035))*a*0.68;\n  }\n  // Sun disc");
patch('src/engine/pipeline.js',"  outColor = vec4(col, 1.0);\n}`;","\n  if(hfNight>0.005 && rd.y>0.0){\n    float md=dot(rd,normalize(vec3(-0.51,0.39,-0.77)));\n    float disc=smoothstep(0.99965,0.99983,md);\n    float halo=pow(max(md,0.0),240.0)*0.05;\n    col+=vec3(0.74,0.85,1.2)*(disc*0.75+halo)*hfNight;\n  }\n  outColor = vec4(col, 1.0);\n}`;");
patch('src/engine/pipeline.js',"  col += uSunColor * disc * limb * 260.0 * s.a * step(0.0, rd.y + 0.004);","  col += uSunColor * (1.0-uHFGrade.w) * disc * limb * 260.0 * s.a * step(0.0, rd.y + 0.004);");
patch('src/engine/pipeline.js',"  col += uSunColor * au * mix(0.3, 1.0, s.a) * smoothstep(-0.03, 0.01, rd.y);","  col += uSunColor * (1.0-uHFGrade.w) * au * mix(0.3, 1.0, s.a) * smoothstep(-0.03, 0.01, rd.y);");
patch('src/engine/pipeline.js',"uSunDir: this.globals.uSunDir, uSunColor: this.globals.uSunColor },","uSunDir: this.globals.uSunDir, uSunColor: this.globals.uSunColor, uHFGrade: { value: new THREE.Vector4(0,0,1,0) }, uHFClock: { value: 0 }, uHFAurora: { value: 1 } },");
patch('src/engine/pipeline.js',"uniform float uExposure;\nuniform float uVignette;","uniform float uExposure;\nuniform vec4 uHFGrade;\nuniform float uVignette;");
patch('src/engine/pipeline.js',"  c = agx(c * uExposure);","  float hfN=clamp(uHFGrade.w,0.0,1.0);\n  c=mix(c,c*vec3(0.28,0.40,0.70),hfN*0.82);\n  c=mix(c,c*vec3(1.03,0.91,0.97),uHFGrade.x*0.16);\n  c=mix(c,c*vec3(0.98,1.03,1.07),uHFGrade.y*0.14);\n  c = agx(c * uExposure);");
patch('src/engine/pipeline.js',"uSaturation: { value: 1.42 }, uContrast: { value: 1.14 },","uSaturation: { value: 1.42 }, uContrast: { value: 1.14 }, uHFGrade: { value: new THREE.Vector4(0,0,1,0) },");
// P509 SUPREME: precise aurora curtains, distinct sunset and optional visual eclipse.
// Native P508 + P507 shaders, no new passes, shadows/geometry unmodified.
patch('src/engine/pipeline.js',"uniform float uHFAurora;\nfloat hfHash","uniform float uHFAurora;\nuniform float uHFEclipse;\nfloat hfHash");
patch('src/engine/pipeline.js',"uHFClock: { value: 0 }, uHFAurora: { value: 1 } },","uHFClock: { value: 0 }, uHFAurora: { value: 1 }, uHFEclipse: { value: 0 } },");
patch('src/engine/pipeline.js',"uniform vec4 uHFGrade;\nuniform float uVignette;","uniform vec4 uHFGrade;\nuniform float uHFEclipse;\nuniform float uVignette;");
patch('src/engine/pipeline.js',"uHFGrade: { value: new THREE.Vector4(0,0,1,0) }, uVignette","uHFGrade: { value: new THREE.Vector4(0,0,1,0) }, uHFEclipse: { value: 0 }, uVignette");
patch('src/engine/pipeline.js',"  col=mix(col,col*vec3(0.83,1.05,1.26),uHFGrade.y*0.35);\n  col=mix(col,col*vec3(0.052,0.080,0.15),hfNight);","  col=mix(col,col*vec3(0.75,1.10,1.34),uHFGrade.y*0.52);\n  // P509: distinguish the amber-magenta GOLDEN HOUR from daylight.\n  // Angular horizon glow preserves full resolution and native geometry.\n  float hfDusk=uHFGrade.z;\n  float hfHoriz=1.0-smoothstep(0.0,0.72,max(0.0,rd.y));\n  float hfFacing=pow(max(0.0,dot(rd,uSunDir)),8.0);\n  col=mix(col,col*vec3(1.36,0.71,0.82),hfDusk*0.72);\n  col+=hfDusk*hfHoriz*(vec3(1.04,0.27,0.085)*(0.19+hfFacing*0.52)+\n                            vec3(0.27,0.065,0.29)*0.16);\n  col=mix(col,col*vec3(0.052,0.080,0.15),hfNight);");
patch('src/engine/pipeline.js',"  if(hfNight>0.01 && uHFAurora>0.0 && rd.y>0.07){\n    float theta=atan(rd.z,rd.x);\n    float wave=sin(theta*13.0+sin(theta*4.0+uHFClock*0.09)*2.2-uHFClock*0.037);\n    float curtain=exp(-pow((rd.y-(0.29+0.095*wave))/0.17,2.0));\n    float ribs=0.58+0.42*pow(0.5+0.5*sin(theta*95.0+uHFClock*0.35),5.0);\n    float edge=smoothstep(0.055,0.22,rd.y)*(1.0-smoothstep(0.60,0.93,rd.y));\n    float a=curtain*ribs*edge*hfNight*uHFAurora;\n    col+=mix(vec3(0.055,0.9,0.55),vec3(0.36,0.28,1.12),0.5+0.5*sin(theta*5.0+uHFClock*0.035))*a*0.68;\n  }","  // P509: TWO isolated animated curtains, restricted to a northern sky arc.\n  // The original P508 aurora covered all azimuths with a broad Gaussian.\n  // Outside the visible sector this branch avoids expensive trigonometry.\n  if(hfNight>0.01 && uHFAurora>0.0 && rd.y>0.04){\n    float hfSector=dot(normalize(rd.xz),vec2(0.458,0.889));\n    if(hfSector>0.64){\n      float theta=atan(rd.z,rd.x);\n      float azMask=smoothstep(0.64,0.92,hfSector);\n      float t=uHFClock;\n      float yA=0.25+0.051*sin(theta*9.8+1.2*sin(theta*2.4+t*0.045)-t*0.031);\n      float yB=0.46+0.062*sin(theta*8.2+1.5*sin(theta*3.0-t*0.020)+t*0.027);\n      float raysA=pow(0.5+0.5*sin(theta*121.0+t*0.23),6.0);\n      float raysB=pow(0.5+0.5*sin(theta*103.0-t*0.18+2.0),5.0);\n      float bandA=exp(-pow((rd.y-yA)/0.082,2.0))*(0.52+0.48*raysA);\n      float bandB=exp(-pow((rd.y-yB)/0.073,2.0))*(0.48+0.52*raysB);\n      float lowerEdge=exp(-pow((rd.y-(yA-0.039))/0.012,2.0));\n      float vertical=smoothstep(0.055,0.14,rd.y)*(1.0-smoothstep(0.69,0.86,rd.y));\n      float w=vertical*azMask*hfNight*uHFAurora;\n      col+=w*(vec3(0.06,1.18,0.72)*bandA*0.78+\n              vec3(0.57,0.27,1.08)*bandB*0.66+\n              vec3(0.12,0.94,0.85)*lowerEdge*0.42);\n    }\n  }");
patch('src/engine/pipeline.js',"  if(hfNight>0.005 && rd.y>0.0){\n    float md=dot(rd,normalize(vec3(-0.51,0.39,-0.77)));\n    float disc=smoothstep(0.99965,0.99983,md);\n    float halo=pow(max(md,0.0),240.0)*0.05;\n    col+=vec3(0.74,0.85,1.2)*(disc*0.75+halo)*hfNight;\n  }","  if(hfNight>0.005 && rd.y>0.0){\n    float md=dot(rd,normalize(vec3(-0.51,0.39,-0.77)));\n    float moonDisc=smoothstep(0.99947,0.99982,md);\n    float moonHalo=pow(max(md,0.0),120.0)*0.060;\n    float maria=0.88+0.12*sin(rd.x*1200.0+sin(rd.y*830.0)*0.7)*sin(rd.z*930.0);\n    col+=vec3(0.80,0.90,1.12)*(moonDisc*maria*0.93+moonHalo)*hfNight;\n  }");
patch('src/engine/pipeline.js',"  col += uSunColor * (1.0-uHFGrade.w) * disc * limb * 260.0 * s.a * step(0.0, rd.y + 0.004);","  // Eclipse is a shader-only optional event: a moon-sized occluder and\n  // a subtle corona; NO moving shadows or extra depth/render passes.\n  float hfOcc=1.0-smoothstep(0.00485,0.00528,ang);\n  col+=uSunColor*(1.0-uHFGrade.w)*disc*limb*260.0*s.a*\n       (1.0-uHFEclipse*hfOcc)*step(0.0,rd.y+0.004);\n  if(uHFEclipse>0.001){\n    float corona=exp(-pow((ang-0.00543)/0.00155,2.0));\n    col+=vec3(2.1,1.55,0.91)*corona*uHFEclipse;\n  }");
patch('src/engine/pipeline.js',"  col += uSunColor * (1.0-uHFGrade.w) * au * mix(0.3, 1.0, s.a) * smoothstep(-0.03, 0.01, rd.y);","  col += uSunColor * (1.0-uHFGrade.w) * (1.0-0.88*uHFEclipse) * au * mix(0.3, 1.0, s.a) * smoothstep(-0.03, 0.01, rd.y);");
patch('src/engine/pipeline.js',"  c=mix(c,c*vec3(0.98,1.03,1.07),uHFGrade.y*0.14);\n  c = agx(c * uExposure);","  c=mix(c,c*vec3(0.98,1.03,1.07),uHFGrade.y*0.14);\n  // Full-image dusk grade in existing native tonemap; no postprocess layer.\n  c=mix(c,c*vec3(1.26,0.79,0.87),uHFGrade.z*0.65);\n  c=mix(c,c*vec3(0.34,0.43,0.59),uHFEclipse*0.72);\n  c = agx(c * uExposure);");
// P510 WORLD ALIVE: orbiting visual sun, lunar phases, arch-centered auroras.
// Preserve P507 sky cache and original renderer passes. Texture shadow stages
// are isolated in a separate module and only update on discrete solar angles.
patch('src/engine/pipeline.js',"uniform float uHFEclipse;\nfloat hfHash","uniform float uHFEclipse;\nuniform vec3 uHFVisualSunDir;\nuniform vec3 uHFMoonDir;\nuniform float uHFMoonPhase;\nuniform vec2 uHFAuroraAxis;\nfloat hfHash");
patch('src/engine/pipeline.js',"uHFAurora: { value: 1 }, uHFEclipse: { value: 0 } },","uHFAurora: { value: 1 }, uHFEclipse: { value: 0 },\n      uHFVisualSunDir: { value: new THREE.Vector3(1,0.2,0.2).normalize() },\n      uHFMoonDir: { value: new THREE.Vector3(0.2,0.7,0.2).normalize() },\n      uHFMoonPhase: { value: 0.5 },\n      uHFAuroraAxis: { value: new THREE.Vector2(0.993,0.12).normalize() } },");
patch('src/engine/pipeline.js',"float ang = acos(clamp(dot(rd, uSunDir), -1.0, 1.0));","float ang = acos(clamp(dot(rd, uHFVisualSunDir), -1.0, 1.0));");
patch('src/engine/pipeline.js',"float hfSector=dot(normalize(rd.xz),vec2(0.458,0.889));","float hfSector=dot(normalize(rd.xz),uHFAuroraAxis);");
patch('src/engine/pipeline.js',"  if(hfNight>0.005 && rd.y>0.0){\n    float md=dot(rd,normalize(vec3(-0.51,0.39,-0.77)));\n    float moonDisc=smoothstep(0.99947,0.99982,md);\n    float moonHalo=pow(max(md,0.0),120.0)*0.060;\n    float maria=0.88+0.12*sin(rd.x*1200.0+sin(rd.y*830.0)*0.7)*sin(rd.z*930.0);\n    col+=vec3(0.80,0.90,1.12)*(moonDisc*maria*0.93+moonHalo)*hfNight;\n  }","  // P510: full moon orbit and actual terminator over the lunar disc.\n  if(hfNight>0.003 && rd.y>0.0){\n    vec3 moonDir=normalize(uHFMoonDir);\n    float md=dot(rd,moonDir);\n    float moonDisc=smoothstep(0.99944,0.99979,md);\n    vec3 right=normalize(cross(vec3(0.0,1.0,0.0),moonDir));\n    vec3 moonUp=normalize(cross(moonDir,right));\n    float moonX=dot(rd,right)/0.032,moonY=dot(rd,moonUp)/0.032;\n    float halfCircle=sqrt(max(0.0,1.0-moonY*moonY));\n    float boundary=cos(uHFMoonPhase*6.2831853)*halfCircle;\n    float lunarLit=uHFMoonPhase<0.5\n       ?smoothstep(-0.045,0.045,moonX-boundary)\n       :smoothstep(-0.045,0.045,-moonX-boundary);\n    float maria=0.85+0.15*sin(rd.x*1200.0+sin(rd.y*830.0)*0.7)*sin(rd.z*930.0);\n    float halo=pow(max(md,0.0),200.0)*0.030;\n    col+=vec3(0.84,0.92,1.16)*(moonDisc*maria*lunarLit*1.25+halo)*hfNight;\n  }");
patch('src/engine/pipeline.js',"col+=vec3(2.1,1.55,0.91)*corona*uHFEclipse;","col+=vec3(2.1,1.55,0.91)*corona*uHFEclipse;\n    col=mix(col,vec3(0.001,0.003,0.009),uHFEclipse*hfOcc);");
patch('src/engine/pipeline.js',"step(0.992,seed)","step(0.989,seed)");
patch('src/main.js',"window.__terrain = terrain;","window.__terrain = terrain;\nwindow.__hfP510ShadowCache=installP510StagedShadows(terrain,pipe);");
// P511 SKY LEGEND — starfield, cratered moon, enlarged sunlight, narrower auroras
// Uses SAME existing FullscreenPass/tonemap; no added pass, mesh or texture.
patch('src/engine/pipeline.js',"  if(hfNight>0.001 && rd.y>0.01){\n    vec2 st=vec2(atan(rd.z,rd.x)*0.15915494+0.5,asin(clamp(rd.y,-1.0,1.0))*0.63661977)*vec2(430.0,155.0);\n    vec2 f=fract(st)-0.5;\n    float seed=hfHash(floor(st));\n    float star=step(0.989,seed)*(1.0-smoothstep(0.006,0.09,length(f)));\n    col+=vec3(0.72,0.83,1.0)*star*hfNight*0.54*(0.81+0.19*sin(uHFClock*0.8+seed*39.0));\n  }\n","  // P511: stars remain visible on EVERY normal night, not only during events.\n  // A single shader grid gives different temperatures, twinkle and soft cores.\n  if(hfNight>0.003 && rd.y>0.018){\n    vec2 st=vec2(atan(rd.z,rd.x)*0.15915494+0.5,asin(clamp(rd.y,-1.0,1.0))*0.63661977)*vec2(320.0,132.0);\n    vec2 f=fract(st)-0.5;\n    float seed=hfHash(floor(st));\n    float bright=step(0.9925,seed);\n    float base=step(0.946,seed);\n    float r=length(f);\n    float core=base*(1.0-smoothstep(0.045,0.207,r));\n    float glint=bright*(1.0-smoothstep(0.14,0.34,r))*0.25;\n    float twinkle=0.89+0.11*sin(uHFClock*(0.32+0.47*seed)+seed*52.0);\n    vec3 starColor=mix(vec3(0.62,0.78,1.08),vec3(1.16,0.97,0.76),step(0.56,seed));\n    col+=starColor*(core*(0.32+0.82*bright)+glint)*hfNight*twinkle*1.11;\n  }\n");
patch('src/engine/pipeline.js',"  // P510: full moon orbit and actual terminator over the lunar disc.\n  if(hfNight>0.003 && rd.y>0.0){\n    vec3 moonDir=normalize(uHFMoonDir);\n    float md=dot(rd,moonDir);\n    float moonDisc=smoothstep(0.99944,0.99979,md);\n    vec3 right=normalize(cross(vec3(0.0,1.0,0.0),moonDir));\n    vec3 moonUp=normalize(cross(moonDir,right));\n    float moonX=dot(rd,right)/0.032,moonY=dot(rd,moonUp)/0.032;\n    float halfCircle=sqrt(max(0.0,1.0-moonY*moonY));\n    float boundary=cos(uHFMoonPhase*6.2831853)*halfCircle;\n    float lunarLit=uHFMoonPhase<0.5\n       ?smoothstep(-0.045,0.045,moonX-boundary)\n       :smoothstep(-0.045,0.045,-moonX-boundary);\n    float maria=0.85+0.15*sin(rd.x*1200.0+sin(rd.y*830.0)*0.7)*sin(rd.z*930.0);\n    float halo=pow(max(md,0.0),200.0)*0.030;\n    col+=vec3(0.84,0.92,1.16)*(moonDisc*maria*lunarLit*1.25+halo)*hfNight;\n  }","  // P511 moon: sharp antialiased limb, relief and phase terminator.\n  // Procedural albedo, no external texture or separate draw call.\n  if(hfNight>0.003 && rd.y>0.0){\n    vec3 moonDir=normalize(uHFMoonDir);\n    float md=dot(rd,moonDir);\n    if(md>0.982){\n      float halo=pow(max(md,0.0),125.0)*0.038;\n      float moonGlow=halo;\n      if(md>0.9980){\n        vec3 right=normalize(cross(vec3(0.0,1.0,0.0),moonDir));\n        vec3 moonUp=normalize(cross(moonDir,right));\n        vec2 uv=vec2(dot(rd,right),dot(rd,moonUp))/0.045;\n        float r2=dot(uv,uv);\n        float disk=smoothstep(0.99882,0.99904,md);\n        float halfCircle=sqrt(max(0.0,1.0-uv.y*uv.y));\n        float boundary=cos(uHFMoonPhase*6.2831853)*halfCircle;\n        float lunarLit=uHFMoonPhase<0.5\n          ?smoothstep(-0.045,0.045,uv.x-boundary)\n          :smoothstep(-0.045,0.045,-uv.x-boundary);\n        float c1=exp(-23.0*dot(uv-vec2(-0.32,0.19),uv-vec2(-0.32,0.19)));\n        float c2=exp(-30.0*dot(uv-vec2(0.22,-0.24),uv-vec2(0.22,-0.24)));\n        float c3=exp(-35.0*dot(uv-vec2(0.36,0.32),uv-vec2(0.36,0.32)));\n        float maria=0.89-0.21*c1-0.15*c2-0.11*c3+\n          0.065*sin(uv.x*18.0+sin(uv.y*12.0))*sin(uv.y*21.0);\n        float limb=0.80+0.20*sqrt(max(0.0,1.0-r2));\n        moonGlow+=disk*clamp(maria,0.50,1.05)*limb*lunarLit*1.55;\n      }\n      col+=vec3(0.86,0.94,1.18)*moonGlow*hfNight;\n    }\n  }");
patch('src/engine/pipeline.js',"  // P509: TWO isolated animated curtains, restricted to a northern sky arc.\n  // The original P508 aurora covered all azimuths with a broad Gaussian.\n  // Outside the visible sector this branch avoids expensive trigonometry.\n  if(hfNight>0.01 && uHFAurora>0.0 && rd.y>0.04){\n    float hfSector=dot(normalize(rd.xz),uHFAuroraAxis);\n    if(hfSector>0.64){\n      float theta=atan(rd.z,rd.x);\n      float azMask=smoothstep(0.64,0.92,hfSector);\n      float t=uHFClock;\n      float yA=0.25+0.051*sin(theta*9.8+1.2*sin(theta*2.4+t*0.045)-t*0.031);\n      float yB=0.46+0.062*sin(theta*8.2+1.5*sin(theta*3.0-t*0.020)+t*0.027);\n      float raysA=pow(0.5+0.5*sin(theta*121.0+t*0.23),6.0);\n      float raysB=pow(0.5+0.5*sin(theta*103.0-t*0.18+2.0),5.0);\n      float bandA=exp(-pow((rd.y-yA)/0.082,2.0))*(0.52+0.48*raysA);\n      float bandB=exp(-pow((rd.y-yB)/0.073,2.0))*(0.48+0.52*raysB);\n      float lowerEdge=exp(-pow((rd.y-(yA-0.039))/0.012,2.0));\n      float vertical=smoothstep(0.055,0.14,rd.y)*(1.0-smoothstep(0.69,0.86,rd.y));\n      float w=vertical*azMask*hfNight*uHFAurora;\n      col+=w*(vec3(0.06,1.18,0.72)*bandA*0.78+\n              vec3(0.57,0.27,1.08)*bandB*0.66+\n              vec3(0.12,0.94,0.85)*lowerEdge*0.42);\n    }\n  }","  // P511: rare aurora curtains above the valley arch, not a full-sky haze.\n  // Angular sector exits early; event brightness comes from the world clock.\n  if(hfNight>0.01 && uHFAurora>0.001 && rd.y>0.05){\n    float hfSector=dot(normalize(rd.xz),uHFAuroraAxis);\n    if(hfSector>0.67){\n      float theta=atan(rd.z,rd.x);\n      float t=uHFClock;\n      float azMask=smoothstep(0.67,0.93,hfSector);\n      float yA=0.29+0.050*sin(theta*8.9+1.1*sin(theta*2.3+t*0.042)-t*0.025);\n      float yB=0.47+0.054*sin(theta*7.8+1.3*sin(theta*2.8-t*0.019)+t*0.023);\n      float rayA=pow(0.5+0.5*sin(theta*117.0+t*0.19),6.0);\n      float rayB=pow(0.5+0.5*sin(theta*103.0-t*0.17+2.0),6.0);\n      float ridgeA=exp(-pow((rd.y-yA)/0.062,2.0));\n      float ridgeB=exp(-pow((rd.y-yB)/0.058,2.0));\n      float fringeA=exp(-abs((rd.y-yA)/0.145))*(0.24+0.76*rayA);\n      float fringeB=exp(-abs((rd.y-yB)/0.130))*(0.26+0.74*rayB);\n      float edge=exp(-pow((rd.y-(yA-0.032))/0.013,2.0));\n      float visible=smoothstep(0.05,0.15,rd.y)*(1.0-smoothstep(0.71,0.86,rd.y));\n      float strength=visible*azMask*hfNight*uHFAurora;\n      col+=strength*(vec3(0.055,1.12,0.67)*(0.62*ridgeA+0.42*fringeA)+\n                     vec3(0.43,0.28,1.03)*(0.58*ridgeB+0.42*fringeB)+\n                     vec3(0.12,0.88,0.89)*edge*0.40);\n    }\n  }");
patch('src/engine/pipeline.js',"  float disc = 1.0 - smoothstep(0.0046, 0.0054, ang);\n  float limb = 1.0 - 0.45 * sq(ang / 0.0054);","  // P511 solar disc: ~2.5x angular presence, crisp soft limb.\n  float disc=1.0-smoothstep(0.0128,0.0140,ang);\n  float limb=1.0-0.22*sq(ang/0.0140);");
patch('src/engine/pipeline.js',"  float hfOcc=1.0-smoothstep(0.00485,0.00528,ang);","  float hfOcc=1.0-smoothstep(0.0127,0.0138,ang);");
patch('src/engine/pipeline.js',"    float corona=exp(-pow((ang-0.00543)/0.00155,2.0));","    // Eclipse ring sized to the actual larger solar disc.\n    float corona=exp(-pow((ang-0.01425)/0.00245,2.0));\n    corona+=0.12*exp(-pow((ang-0.0205)/0.006,2.0));");
patch('src/engine/pipeline.js',"  float hfFacing=pow(max(0.0,dot(rd,uSunDir)),8.0);","  float hfFacing=pow(max(0.0,dot(rd,uHFVisualSunDir)),8.0);");
// P503: one source-of-truth for each stationary vegetation tile. Unsung's
// grass and flower cells only move when crossing their 16m / 32m grid;
// the original code sampled terrain.heightAt and called updateMatrixWorld on
// every visible tile EVERY frame. Cache the EXACT height at each cell origin
// until that cell changes; do not alter blades, density, LOD, frustum, or XYZ.
patch('src/world/flora/grass.js',
 "      const y = this.terrain.heightAt(cx, cz);",
 `      let y;
      if(c._hfCellX!==ci || c._hfCellZ!==cj){
        y=this.terrain.heightAt(cx,cz);
        c._hfCellX=ci;c._hfCellZ=cj;c._hfCellY=y;
      }else y=c._hfCellY;`);
patch('src/world/flora/grass.js',
 "      c.mesh.position.set(x, y, z);\\n      c.mesh.updateMatrixWorld();".replaceAll('\\n','\n'),
 "      if(c.mesh.position.x!==x||c.mesh.position.y!==y||c.mesh.position.z!==z){\\n        c.mesh.position.set(x, y, z);\\n        c.mesh.updateMatrixWorld();\\n      }".replaceAll('\\n','\n'));
// P499: mobile TAA saves eight neighbourhood texture fetches per physical
// pixel, but keeps identical 3D geometry, output/scene resolution, fog, shadows,
// bloom, and the original Catmull-Rom history filter. Can A/B the reference
// algorithm via ?hfperf=reference without downloading another game.
patch('src/engine/post.js',
 "    vec2 o = vec2(float(x), float(y)) * texel;\\n    vec3 c = toYCoCg(squash(textureLod(uCurrent, cuv + o, 0.0).rgb));".replaceAll('\\n','\n'),
 "    vec2 o = vec2(float(x), float(y)) * texel;\\n#if defined(HF_S23_NATIVE_TAA)\\n    if(x!=0 && y!=0) continue; // 5-tap cross in native full-res framebuffer\\n#endif\\n    vec3 c = toYCoCg(squash(textureLod(uCurrent, cuv + o, 0.0).rgb));".replaceAll('\\n','\n'));
patch('src/engine/post.js',
 "  m1 /= 9.0; m2 /= 9.0;",
 "#if defined(HF_S23_NATIVE_TAA)\\n  m1 /= 5.0; m2 /= 5.0;\\n#else\\n  m1 /= 9.0; m2 /= 9.0;\\n#endif".replaceAll('\\n','\n'));
patch('src/engine/post.js',
 "      defines: pipe.depthDefines,\\n      uniforms: {\\n        uCurrent: { value: null }, uHistory: { value: null }, uDepth: { value: null }, ...pipe.camUniforms,".replaceAll('\\n','\n'),
 "      defines: new URLSearchParams(globalThis.location?.search||'').get('hfperf')==='reference' ? pipe.depthDefines : {...pipe.depthDefines,HF_S23_NATIVE_TAA:1},\\n      uniforms: {\\n        uCurrent: { value: null }, uHistory: { value: null }, uDepth: { value: null }, ...pipe.camUniforms,".replaceAll('\\n','\n'));
// Preserve actual full-resolution 3D, masks and scene. Merely track frame time.
patch('src/main.js',"const __hfPixelLab=installAndroidPhysicalResolution(pipe,{search:location.search});",
 "const __hfPixelLab=installAndroidPhysicalResolution(pipe,{search:location.search});\\nwindow.__hfP499Perf=installP499GpuDiagnostics(pipe,{search:location.search});\\nwindow.__hfP501Profiler=installP501StageProfiler(pipe,{search:location.search});\\nwindow.__hfP502Audit=installP502AutoProfiler(pipe,{search:location.search});\\nwindow.__hfP503Copy=installP503OpaqueCopy(pipe,{search:location.search});\\nwindow.__hfP505PacingControl=installP505FramePacing(pipe,{search:location.search});".replaceAll('\\n','\n'));
patch('src/main.js',"import { installHighflyGraphics } from './highfly/visual-profile.mjs';","import { installHighflyGraphics } from './highfly/visual-profile.mjs';\nimport { installP508WorldClock } from './highfly/p508-world-clock.mjs';");
patch('src/main.js',"import { installP508WorldClock } from './highfly/p508-world-clock.mjs';","import { installP508WorldClock } from './highfly/p508-world-clock.mjs';\nimport { installP510StagedShadows } from './highfly/p510-staged-shadows.mjs';");
const pipeline=read('src/main.js').split('\n').find(x=>x.startsWith('const pipe = new Pipeline('));
if(!pipeline)throw Error('Unsung pipeline initialization missing');
patch('src/main.js',pipeline,pipeline+'\nwindow.__highflyFog = installHighflyFog(pipe);');
patch('src/main.js',"window.__highflyFog = installHighflyFog(pipe);","window.__highflyFog = installHighflyFog(pipe);\nwindow.__hfP507Sky = pipe.sky;");
patch('src/main.js',"window.__hfP507Sky = pipe.sky;","window.__hfP507Sky = pipe.sky;\nwindow.__hfP508Clock=installP508WorldClock(pipe,{search:location.search});");
patch('src/main.js',"const ui = new UI({ game, settings, apply, story });",
 "window.__hfNativeSettings=settings;\\nwindow.__hfApplySettings=apply;\\nconst ui = new UI({ game, settings, apply, story });".replaceAll('\\n','\n'));
patch('src/main.js',"window.__ui = ui;","window.__ui = ui;\nwindow.__highflyES=installSpanishLocalization(document,location.search);\nwindow.__highflyRpg=installPremiumRpgUI(game);\ngame.__highflyRpg=window.__highflyRpg;\nwindow.__highflyHunts=installP49Hunts(game);\nwindow.__highflyKayKitPeople=installHighflyKayKitPeople(game);\nwindow.__highflyP493Interaction=installP493Interaction(game);\nwindow.__highflyP493Portals=installP493PortalVisuals(game);\nwindow.__highflyIntro=installHighflyIntro();");
// Reset TAA history whenever the dynamic-resolution governor changes pixel count.
patch('src/engine/pipeline.js',"this.renderScale = s; this.setSize(this.displayW, this.displayH, true);",
 "this.renderScale = s; this.setSize(this.displayW, this.displayH, true); this.taa.reset = true;");
patch('src/engine/governor.js',"this.max = max; this.target = target;",
 "this.max = max; this.target = target; this.min = Math.max(0.60,Math.min(max,window.__hfGraphics?.minRenderScale ?? 0.75));");
patch('src/main.js',"const apply = () => applySettings(settings, { pipe, game, cover, audio, gloss, governor });",
 "const apply = () => applySettings(settings, { pipe, game, cover, audio, gloss, governor });\nwindow.__highflySetGraphics = mode => { const ok = window.__hfGraphics?.set(mode); if(ok){apply();pipe.taa.reset=true;} return !!ok; };");
patch('src/main.js',"window.__game = game;",
 "window.__game = game;\nif(params.get('hfworkshop')==='1')window.__hfProfessionYard=installProfessionYard(game,pipe);");
 // Browser-only full-world collision QA mode: retain the real world, player,
 // terrain heightfields, props and collision BVH, but shorten only the
 // cosmetic pre-game lighting bake in software WebGL. Normal play unchanged.
 patch('src/main.js','  const total = terrain._queue.length;',
   "  if (params.has('hfqa')) terrain._queue.length=Math.min(terrain._queue.length,18);\\n  const total = terrain._queue.length;".replace('\\n','\n'));
// F1 is strictly an opt-in lab, the F0 original hero stays default.
const nativeHero=read('src/main.js').split('\n').find(s=>s.startsWith("fetch(import.meta.env.BASE_URL + 'models/hero.glb'"));
if(!nativeHero)throw Error('Unsung original hero startup changed');
// Game diagnostics remain in window.__highflyHeroStatus, but never display a permanent center-screen success banner.
const freeHeroStart=[
 "const hfCharacter=params.get(\'hfchar\')===\'unsung\'?\'unsung\':\'kaykit\';",
 "window.__highflyHeroStatus={requested:hfCharacter,loaded:false,reason:null};",
 "if(hfCharacter===\'kaykit\'){",
 " KayKitFreeHero.load(pipe).then(h=>{game.attachHero(h);window.__hero=h;window.__highflyHeroStatus.loaded=true;}).catch(err=>{console.error(\'KayKit FREE failed, restoring Unsung\',err);window.__highflyHeroStatus.reason=String(err);Hero.load(pipe,import.meta.env.BASE_URL+\'models/hero.glb\').then(h=>{game.attachHero(h);window.__hero=h;}).catch(e=>console.error(e));});",
 "}else{",
 nativeHero,
 " window.__highflyHeroStatus.loaded=true;",
 "}"
].join('\n');
patch('src/main.js',nativeHero,freeHeroStart);

// Keep Unsung's physical player and world unchanged. Prevent the camera
// from penetrating the much taller terrain cliffs with a safety volume.
patch('src/game/camera.js',"import * as THREE from 'three';",
 "import * as THREE from 'three';\nimport {safeCliffCameraDistance} from '../highfly/cliff-camera.mjs';\nimport {cameraNearRealStairs,stairAwareCameraFloor,stabilizedStairCameraY} from '../highfly/p496-stair-camera.mjs';");
patch('src/game/camera.js',
 "const wantDist = Math.max(0.7, Math.min(distance, free));",
 "const wantDist = cameraNearRealStairs(this.world,player.pos) ? Math.max(0.7,Math.min(distance,free)) : safeCliffCameraDistance(this.world,_pivot,_dir,distance,Math.max(0.7,Math.min(distance,free)));");
patch('src/game/camera.js',
 "const floor = this.world.groundHeight(_want.x, _want.z) + 0.25;",
 "const floor = stairAwareCameraFloor(this.world,player.pos,_want);");
patch('src/game/game.js',"import { Player, TUNE } from './player.js';","import { Player, TUNE } from './player.js';\nimport { installHighflyDash } from './highfly-dash.mjs';\nimport { installHighflyUniversalMotion } from '../highfly/universal-motion.mjs';");
patch('src/game/game.js','    this.player = new Player(this.world);','    this.player = new Player(this.world);\n    installHighflyDash(this.player);\n    installHighflyUniversalMotion(this.player);');
patch('src/game/game.js','    p.update(dt, busy ? this._idle : this.input, this.rig.yaw);',
 '    p._hfCameraPitch=this.rig.pitch;\n    p.update(dt, busy ? this._idle : this.input, this.rig.yaw);');
// Camera raymarches actual heightfield so a close cliff cannot show its backface.
patch('src/game/camera.js',
 "const free = this.world.raycast(_pivot, _dir, distance + 0.4) - 0.3;",
 `let terrainFree = distance + 0.4;
    for(let sample=.45;!cameraNearRealStairs(this.world,player.pos)&&sample<distance+.4;sample+=.19){
      const x=_pivot.x+_dir.x*sample,y=_pivot.y+_dir.y*sample,z=_pivot.z+_dir.z*sample;
      if(this.world.groundHeight(x,z)>y-.18){terrainFree=Math.max(.68,sample-.22);break;}
    }
    const free = Math.min(this.world.raycast(_pivot, _dir, distance + 0.4),terrainFree) - 0.3;`);
 // P496: cap vertical camera jumps only on solid stone staircase.
patch('src/game/camera.js',
 "this.camera.position.copy(_want);",
 "_want.y=stabilizedStairCameraY(this._hfStairCamY,_want.y,dt,cameraNearRealStairs(this.world,player.pos)); this._hfStairCamY=_want.y; this.camera.position.copy(_want);");
// Some NPC platforms sit higher than the terrain/underlying ground: always
 // resolve to the exposed surface, never put their body BELOW the terrain.
patch('src/game/people.js',
 "const y = W.floorBelow(x, (spire?.base ?? game.sites.spawn.y) + 1.6, z, 6);",
 "const rawY = W.floorBelow(x, (spire?.base ?? game.sites.spawn.y) + 1.6, z, 6); const baseY=W.groundHeight(x,z); const y=Number.isFinite(rawY)?Math.max(rawY,baseY):baseY;");
// Native Unsung retains ALL AI, collisions and combat; just do not draw
// the incompatible purple shard/aura layer on our licensed Quaternius/Gobkit
// animals. No fake spheres, glow balls or shadow geometry for HF creatures.
patch('src/game/enemies.js',
 "      if (e.far) continue;\\n      const d = e.def, cy = Math.cos(e.yaw), sy = Math.sin(e.yaw);".replaceAll('\\n','\n'),
 "      if (e.far || e.kind.startsWith('hf_')) continue;\\n      const d = e.def, cy = Math.cos(e.yaw), sy = Math.sin(e.yaw);".replaceAll('\\n','\n'));
// P496: original Unsung shard debris persists until looted/expired.
patch('src/game/enemies.js',
 "this.list = this.list.filter((e) => e.alive || e.t < 3.2);",
 "this.list = this.list.filter((e) => e.alive || e.t < 3.2 || (e.__hfCorpsePending===true && e.__hfCorpseUntil>time));");
patch('src/game/enemies.js',
 "sh.vel.y -= 20 * dt; sh.pos.addScaledVector(sh.vel, dt);",
 "if (!e.__hfCorpsePending || e.t < 1.65) { sh.vel.y -= 20 * dt; sh.pos.addScaledVector(sh.vel, dt);");
patch('src/game/enemies.js',
 "sh.quat.premultiply(_q);",
 "sh.quat.premultiply(_q); }");
patch('src/game/enemies.js',
 "e.state === 'dead' ? Math.max(0, (e.t - 1.6) / 1.5)",
 "e.state === 'dead' ? (e.__hfCorpsePending ? 0 : Math.max(0, (e.t - 1.6) / 1.5))");
// P495: Unsung built a real 56m Petal-to-Cantor STAIR BVH. Its heightfield
// beneath the stone flight is NOT the walkable surface. This keeps every
// architecture collision and makes both uphill and downhill travel native.
patch('src/game/collision.js',"import * as THREE from 'three';",
 "import * as THREE from 'three';\\nimport {p495StairTread} from '../highfly/p495-stair-route.mjs';".replace('\\n','\n'));
patch('src/game/collision.js',
 "    let best = this.terrain.heightAt(x, z);",
 "    const stair=p495StairTread(this,x,z,yFrom);\\n    let best=stair?-Infinity:this.terrain.heightAt(x,z);".replace('\\n','\n'));
patch('src/game/collision.js',
 "    return best;\\n  }\\n\\n  // Distance to the first hit along a ray, or maxDist.".replaceAll('\\n','\n'),
 "    return Number.isFinite(best)?best:this.terrain.heightAt(x,z);\\n  }\\n\\n  // Distance to the first hit along a ray, or maxDist.".replaceAll('\\n','\n'));
patch('src/game/player.js',"import * as THREE from 'three';",
 "import * as THREE from 'three';\\nimport {p495StairTraverse,p495OnActualStairs} from '../highfly/p495-stair-route.mjs';".replace('\\n','\n'));
patch('src/game/player.js',
 "      const onTerrain = this.pos.y - g0 < 0.5;",
 "      const onTerrain = this.pos.y - g0 < 0.5 && !p495StairTraverse(W,this.pos,{x:nx,y:this.pos.y,z:nz});");
patch('src/game/player.js',
 "      if (this.pos.y <= g) { this.pos.y = g; grounded = true; }",
 "      if (!p495OnActualStairs(W,this.pos) && this.pos.y <= g) { this.pos.y = g; grounded = true; }");
patch('src/game/player.js',
 "      if (slope > 1.3 && this.pos.y - W.groundHeight(this.pos.x, this.pos.z) < 0.3)",
 "      if (!p495OnActualStairs(W,this.pos) && slope > 1.3 && this.pos.y - W.groundHeight(this.pos.x, this.pos.z) < 0.3)");
patch('src/game/input.js',"  interact: ['KeyE'],","  dash: ['KeyV'], interact: ['KeyE'],");

patch('src/game/input.js','export class Input {',"import { attachHighflyTouch, applyHighflyTouch } from './highfly-touch.mjs';\nexport class Input {");
patch('src/game/input.js','    this._down = new Set();','    this._down = new Set();\n    attachHighflyTouch(this);');
const inputEnd="    if (!this.enabled) { this.pressed = new Set([...this.pressed].filter((a) => a === 'pause' || a === 'map' || a === 'journal')); this.move.x = this.move.y = 0; this.look.x = this.look.y = 0; this.held.clear(); }";
patch('src/game/input.js',inputEnd,inputEnd+'\n    applyHighflyTouch(this);');
patch('src/game/input.js',"  lockPointer() {","  lockPointer() {\n    if (this.highflyTouch) return; // never lock mouse for touch input");
patch('src/game/input.js',"    canvas.addEventListener('mousedown', (e) => {","    canvas.addEventListener('mousedown', (e) => {\n      if (this.highflyTouch) return; // never turn touch into native mouse attack");

const changed=capture('git',['diff','--name-only'],origin).split('\n').filter(Boolean);
const allowed=new Set(['index.html','src/engine/pipeline.js','src/engine/governor.js','src/engine/post.js','src/engine/sky.js','src/game/camera.js','src/game/people.js','src/world/terrain.js','src/world/arch/sites.js','src/world/flora/grass.js','src/main.js','src/anim/hero.js','src/audio/audio.js','src/ui/ui.js','src/game/input.js','src/game/game.js','src/game/quests.js','src/game/player.js','src/game/enemies.js','src/game/collision.js']);
if(changed.some(x=>!allowed.has(x)))throw Error('Original Unsung world source modified illegally');
const terrainDiff=capture('git',['diff','--','src/world/terrain.js'],origin);
const delta=terrainDiff.split('\n').filter(x=>/^[+-](?![+-])/.test(x));
if(delta.length!==6||!delta.every(x=>/fetch\(|loadHeights\(/.test(x)))throw Error('World generation diff not limited to 3 Pages URLs');
run('npm',['ci','--no-audit','--no-fund'],origin);
run('npm',['run','build','--','--base',pagesBase],origin);
if(!fs.existsSync(loc('dist/index.html')))throw Error('No Vite output');
fs.cpSync(loc('dist'),output,{recursive:true});
copy(path.join(ROOT,'data/CATALOGO_FREE_KAYKIT_ADVENTURERS.json'),path.join(output,'catalogo-free.json'));
copy(path.join(ROOT,'src/highfly/catalogo-free.html'),path.join(output,'catalogo.html'));

copy(loc('LICENSE'),path.join(output,'LICENSES','UNSUNG-MIT.txt'));
copy(loc('CREDITS.md'),path.join(output,'CREDITS_UNSUNG.md'));
copy(kaykitLicense,path.join(output,'LICENSES','KAYKIT-ADVENTURERS-CC0.txt'));
copy(path.join(ROOT,'LICENSES','QUATERNIUS-UAL-CC0.txt'),path.join(output,'LICENSES','QUATERNIUS-UAL-CC0.txt'));
copy(path.join(ROOT,'LICENSES','EMBERFALL-MIT.txt'),path.join(output,'LICENSES','EMBERFALL-MIT.txt'));
// Inventory the actual FREE GLB animation names and sockets: no guesswork.
const kb=fs.readFileSync(kaykitModel);
if(kb.toString('ascii',0,4)!=='glTF'||kb.readUInt32LE(4)!==2||kb.readUInt32LE(8)!==kb.length||kb.toString('ascii',16,20)!=='JSON')throw Error('Invalid KayKit GLB structure');
const kj=JSON.parse(kb.subarray(20,20+kb.readUInt32LE(12)).toString('utf8'));
const clips=(kj.animations||[]).map(x=>x.name),nodes=(kj.nodes||[]).map(x=>x.name).filter(Boolean);
for(const n of ['Idle','Walking_A','Running_A','Running_B','Jump_Idle','Jump_Land','Dodge_Forward','1H_Melee_Attack_Slice_Horizontal','1H_Melee_Attack_Chop','1H_Melee_Attack_Slice_Diagonal'])if(!clips.includes(n))throw Error('Required KayKit clip missing '+n);
if(!nodes.includes('handslot.r')||clips.length<70)throw Error('Missing KayKit rig socket or clips');
fs.writeFileSync(path.join(output,'KAYKIT_ANIMATION_INVENTORY.json'),JSON.stringify({source:kaykitResult.url,sha256:hash(kaykitModel),count:clips.length,clips,nodes:nodes.filter(n=>/hand|arm|leg|foot|root|hip|spine|head/i.test(n))},null,2));

const animationModule=fs.readFileSync(path.join(ROOT,'src/highfly/kaykit-free-hero.mjs'),'utf8');
const animationMap=animationModule.match(/const CLIPS=\{([\s\S]*?)\};/)?.[1];
if(!animationMap)throw Error('KayKit runtime CLIPS map missing');
const mapped=[...animationMap.matchAll(/:\s*'([^']+)'/g)].map(m=>m[1]);
for(const name of mapped)if(!clips.includes(name))throw Error('Runtime KayKit clip is unavailable: '+name);
console.log('[KAYKIT CLIP AUDIT] '+clips.length+' exact FREE Knight animation clips; runtime mappings '+mapped.length+' (all present)');
console.log('[KAYKIT MODEL WEAPONS] '+nodes.filter(n=>/sword|shield|handslot/i.test(n)).join(' | '));
console.log('[KAYKIT CLIPS] '+clips.slice().sort().join(' | '));


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
fs.writeFileSync(path.join(output,'BUILD_PROVENANCE.json'),JSON.stringify({phase:'F0.11 COMBAT RECOVERY, ROLL/DASH AIM, ANCHORED CLIMB, QUATERNIUS UAL1/2 RETARGET',originalUnsungCommit:SHA,pagesBase,worldAuthority:'UNSUNG',androidVisualQA:'NOT_RUN',kaykitQA:'GLB_CLIPS_AUDITED_VISUAL_PENDING',kaykitCommit},null,2));
console.log('[HIGHFLY] Build finished: '+records.length+' original assets. Run npm run qa:dist before deployment.');
