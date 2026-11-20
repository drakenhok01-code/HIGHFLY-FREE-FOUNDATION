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
 const url=ualRoot+folder+fileName,response=await fetch(url);
 if(!response.ok)throw Error('Pinned Quaternius unavailable '+response.status+' '+url);
 const file=loc('hf-ual-internal/'+fileName);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,Buffer.from(await response.arrayBuffer()));
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
for(const name of ['rpg-equipment','premium-skill-art','system-dialog'])copy(path.join(ROOT,'src/highfly/'+name+'.mjs'),loc('src/highfly/'+name+'.mjs'));
for(const name of ['highfly-icons','hero-sanctuary','quest-petal','world-petal','forge-chamber'])
 copy(path.join(ROOT,'assets/highfly/'+name+'.svg'),loc('public/highfly/'+name+'.svg'));
for(const name of ['approved-logo','approved-potions','approved-hero'])
 copy(path.join(ROOT,'assets/highfly/'+name+'.webp'),loc('public/highfly/'+name+'.webp'));
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

for(const name of ['premium-assets.mjs','premium-map.mjs'])copy(path.join(ROOT,'src/highfly/'+name),loc('src/highfly/'+name));
for(const name of ['rpg-core.mjs','premium-rpg.mjs','premium-rpg.css','premium-f0148-v2.css','premium-f0148-v3.css','premium-f0148-v3-1-polish.css'])copy(path.join(ROOT,'src/highfly/'+name),loc('src/highfly/'+name));
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
copy(path.join(ROOT,'src/highfly/qa-rpg-entry.mjs'),loc('src/highfly/qa-rpg-entry.mjs'));
copy(path.join(ROOT,'src/highfly/qa-rpg.html'),loc('qa-rpg.html'));
copy(path.join(ROOT,'src/highfly/dash.mjs'),loc('src/game/highfly-dash.mjs'));

patch('src/main.js',"import { FILM } from './engine/quality.js';",
 "import { FILM } from './engine/quality.js';\\nimport { installHighflyFog } from './highfly/fog.mjs';\\nimport { KayKitFreeHero } from './highfly/kaykit-free-hero.mjs';\\nimport { installHighflyGraphics } from './highfly/visual-profile.mjs';\\nimport { installSpanishLocalization, translateHighfly } from './highfly/es-localization.mjs';\\nimport { installProfessionYard } from './highfly/profession-yard.mjs';\nimport { installPremiumRpgUI } from './highfly/premium-rpg.mjs';".replaceAll('\\n','\n'));
patch('src/main.js',"const settings = new Settings(pipe.renderer);",
 "const settings = new Settings(pipe.renderer);\\nwindow.__hfGraphics=installHighflyGraphics(pipe,settings,location.search);".replaceAll('\\n','\n'));
const pipeline=read('src/main.js').split('\n').find(x=>x.startsWith('const pipe = new Pipeline('));
if(!pipeline)throw Error('Unsung pipeline initialization missing');
patch('src/main.js',pipeline,pipeline+'\nwindow.__highflyFog = installHighflyFog(pipe);');
patch('src/main.js',"window.__ui = ui;","window.__ui = ui;\nwindow.__highflyES=installSpanishLocalization(document,location.search);\nwindow.__highflyRpg=installPremiumRpgUI(game);");
// Reset TAA history whenever the dynamic-resolution governor changes pixel count.
patch('src/engine/pipeline.js',"this.renderScale = s; this.setSize(this.displayW, this.displayH, true);",
 "this.renderScale = s; this.setSize(this.displayW, this.displayH, true); this.taa.reset = true;");
patch('src/engine/governor.js',"this.max = max; this.target = target;",
 "this.max = max; this.target = target; this.min = Math.max(0.60,Math.min(0.88,max-0.12));");
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
 "import * as THREE from 'three';\nimport {safeCliffCameraDistance} from '../highfly/cliff-camera.mjs';");
patch('src/game/camera.js',
 "const wantDist = Math.max(0.7, Math.min(distance, free));",
 "const wantDist = safeCliffCameraDistance(this.world,_pivot,_dir,distance,Math.max(0.7,Math.min(distance,free)));");
patch('src/game/camera.js',
 "const floor = this.world.groundHeight(_want.x, _want.z) + 0.25;",
 "const floor = this.world.groundHeight(_want.x, _want.z) + 0.54;");
patch('src/game/game.js',"import { Player, TUNE } from './player.js';","import { Player, TUNE } from './player.js';\nimport { installHighflyDash } from './highfly-dash.mjs';\nimport { installHighflyUniversalMotion } from '../highfly/universal-motion.mjs';");
patch('src/game/game.js','    this.player = new Player(this.world);','    this.player = new Player(this.world);\n    installHighflyDash(this.player);\n    installHighflyUniversalMotion(this.player);');
patch('src/game/game.js','    p.update(dt, busy ? this._idle : this.input, this.rig.yaw);',
 '    p._hfCameraPitch=this.rig.pitch;\n    p.update(dt, busy ? this._idle : this.input, this.rig.yaw);');
// Camera raymarches actual heightfield so a close cliff cannot show its backface.
patch('src/game/camera.js',
 "const free = this.world.raycast(_pivot, _dir, distance + 0.4) - 0.3;",
 `let terrainFree = distance + 0.4;
    for(let sample=.45;sample<distance+.4;sample+=.19){
      const x=_pivot.x+_dir.x*sample,y=_pivot.y+_dir.y*sample,z=_pivot.z+_dir.z*sample;
      if(this.world.groundHeight(x,z)>y-.18){terrainFree=Math.max(.68,sample-.22);break;}
    }
    const free = Math.min(this.world.raycast(_pivot, _dir, distance + 0.4),terrainFree) - 0.3;`);
 // Some NPC platforms sit higher than the terrain/underlying ground: always
 // resolve to the exposed surface, never put their body BELOW the terrain.
patch('src/game/people.js',
 "const y = W.floorBelow(x, (spire?.base ?? game.sites.spawn.y) + 1.6, z, 6);",
 "const rawY = W.floorBelow(x, (spire?.base ?? game.sites.spawn.y) + 1.6, z, 6); const baseY=W.groundHeight(x,z); const y=Number.isFinite(rawY)?Math.max(rawY,baseY):baseY;");
patch('src/game/input.js',"  interact: ['KeyE'],","  dash: ['KeyV'], interact: ['KeyE'],");

patch('src/game/input.js','export class Input {',"import { attachHighflyTouch, applyHighflyTouch } from './highfly-touch.mjs';\nexport class Input {");
patch('src/game/input.js','    this._down = new Set();','    this._down = new Set();\n    attachHighflyTouch(this);');
const inputEnd="    if (!this.enabled) { this.pressed = new Set([...this.pressed].filter((a) => a === 'pause' || a === 'map' || a === 'journal')); this.move.x = this.move.y = 0; this.look.x = this.look.y = 0; this.held.clear(); }";
patch('src/game/input.js',inputEnd,inputEnd+'\n    applyHighflyTouch(this);');
patch('src/game/input.js',"  lockPointer() {","  lockPointer() {\n    if (this.highflyTouch) return; // never lock mouse for touch input");
patch('src/game/input.js',"    canvas.addEventListener('mousedown', (e) => {","    canvas.addEventListener('mousedown', (e) => {\n      if (this.highflyTouch) return; // never turn touch into native mouse attack");

const changed=capture('git',['diff','--name-only'],origin).split('\n').filter(Boolean);
const allowed=new Set(['index.html','src/engine/pipeline.js','src/engine/governor.js','src/game/camera.js','src/game/people.js','src/world/terrain.js','src/main.js','src/anim/hero.js','src/audio/audio.js','src/ui/ui.js','src/game/input.js','src/game/game.js','src/game/quests.js']);
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
