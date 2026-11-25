import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

// This QA is intentionally manual-only: it must never auto-generate Arvelia.
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
if(!chrome)throw Error('Chrome unavailable');
const base='http://127.0.0.1:5188/HIGHFLY-FREE-FOUNDATION/preview-p542/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5188','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p542/'],{stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',s=>logs+=s);server.stderr.on('data',s=>logs+=s);
let browser;
try{
 let available=false;
 for(let i=0;i<90;i++){
  try{if((await fetch(base+'highfly/world-forge-3d.html')).ok){available=true;break;}}
  catch{}
  await delay(350);
 }
 if(!available)throw Error('Vite preview failed: '+logs.slice(-1500));
 for(let attempt=1;attempt<=2&&!browser;attempt++){
  try{browser=await puppeteer.launch({executablePath:chrome,headless:true,timeout:100000,
   protocolTimeout:120000,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox','--no-first-run','--disable-background-networking']});}
  catch(err){console.warn('[P542 browser attempt '+attempt+'] '+String(err).slice(0,350));if(attempt===2)throw err;await delay(1800);}
 }
 const page=await browser.newPage();
 await page.setViewport({width:1260,height:800,deviceScaleFactor:1});
 const errors=[],missing=[];
 page.on('pageerror',e=>errors.push('JS '+String(e).slice(0,500)));
 page.on('response',r=>{if(r.status()>=400&&!new URL(r.url()).pathname.endsWith('/favicon.ico'))missing.push({status:r.status(),url:r.url()});});
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource: the server responded with a status of 404/i.test(m.text()))errors.push(m.text().slice(0,350));});
 await page.goto(base+'highfly/world-forge-3d.html?hfqa=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>['listo','fallo'].includes(window.__highfly3DEditorHealth?.phase),{timeout:200000,polling:500});
 const health=await page.evaluate(()=>{
  const qa=window.__hfWorldForge3DQA;
  return {phase:window.__highfly3DEditorHealth?.phase,
   errors:window.__highfly3DEditorHealth?.errors||[],
   count:qa?.objects()?.length,
   autoVillageHidden:getComputedStyle(document.getElementById('pilot-eastbrook')).display==='none',
   automaticPresetHidden:getComputedStyle(document.getElementById('preset-village')).display==='none',
   slopeAuto:qa?.placement()?.adaptSlope,
   title:document.title};
 });
 fs.writeFileSync('p542-editor-health.json',JSON.stringify({health,errors,missing},null,2));
 if(health.phase!=='listo'||health.errors.length||errors.length||missing.length)throw Error('Native Unsung editor scene or assets failed: '+JSON.stringify({health,errors,missing}));
 if(health.count!==0||!health.autoVillageHidden||!health.automaticPresetHidden||!health.slopeAuto)
  throw Error('Manual editor MUST open clean with slope AUTO and hidden town generators: '+JSON.stringify(health));
 console.log('[P542 CLEAN MANUAL PASSED]',JSON.stringify(health));
 await page.screenshot({path:'p542-original-terrain-empty.png',fullPage:true});
 const position=await page.evaluate(()=>{
  const qa=window.__hfWorldForge3DQA;
  for(let x=-740;x<=-330;x+=24)for(let z=-250;z<=100;z+=24){
   const o={id:'qa-slope',type:'kaykit-home-a',x,z,yaw:0,scale:1,clearTrees:true};
   const v=qa.validPosition(o);
   if(v.ok&&v.slope>2.3&&v.slope<24)return {x,z,slope:v.slope,y:v.y};
  }
  return null;
 });
 if(!position)throw Error('No buildable real native sloped parcel');
 await page.evaluate(()=>window.__hfWorldForge3DQA.chooseForQA('kaykit-home-a'));
 await page.waitForFunction(()=>window.__hfWorldForge3DQA?.ready('kaykit-home-a'),{timeout:110000,polling:500});
 const placedId=await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.placeForQA(x,z),position);
 if(!placedId)throw Error('Manual construction failed on a native slope at '+JSON.stringify(position));
 const heightsBefore=await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.heightAt(x,z),position);
 if(Math.abs(heightsBefore.original-heightsBefore.rendered)>1e-5||heightsBefore.gradePatches!==0)
  throw Error('Building raised the ORIGINAL Unsung terrain: '+JSON.stringify(heightsBefore));
 await page.waitForFunction(id=>!!window.__hfWorldForge3DQA?.inspect(id),{timeout:60000,polling:250},placedId);
 const result=await page.evaluate(id=>{
  const qa=window.__hfWorldForge3DQA;
  const object=qa.objects().find(x=>x.id===id);
  return {object,mesh:qa.inspect(id),slopeAuto:qa.placement().adaptSlope};
 },placedId);
 if(result.object?.type!=='kaykit-home-a'||result.mesh?.meshes<3||result.mesh?.faces<3||result.mesh?.foundation<1||!result.slopeAuto)
  throw Error('Placed building is not real 3D or lost slope: '+JSON.stringify(result));
 await page.click('#save');
 const saved=await page.evaluate(()=>JSON.parse(window.__hfWorldForge3DQA.savedJSON()||'null'));
 if(saved?.objects?.length!==1||saved.objects[0].id!==placedId)
  throw Error('Manual placement not saved in RPG-shared isolated JSON');
 if(saved.objects[0].highflyTown||saved.objects[0].highflyMaster)
  throw Error('Unexpected generated town in manually saved building');
 // Three manual 4m tiles, each made of 200 source-height triangles.
 const paths=[];
 for(const [type,dx,dz] of [['floor-stone',16,14],['floor-earth',20,14],['floor-grass',24,14]]){
  await page.evaluate(type=>window.__hfWorldForge3DQA.chooseForQA(type),type);
  const id=await page.evaluate(({x,z,dx,dz})=>window.__hfWorldForge3DQA.placeForQA(x+dx,z+dz),{...position,dx,dz});
  if(!id)throw Error('Cannot place conforming path '+type);
  await page.waitForFunction(id=>!!window.__hfWorldForge3DQA.inspect(id),{timeout:60000,polling:300},id);
  const part=await page.evaluate(id=>({model:window.__hfWorldForge3DQA.inspect(id),
    object:window.__hfWorldForge3DQA.objects().find(o=>o.id===id)}),id);
  if(part.object?.type!==type||part.model?.faces<600)
   throw Error('Terrain-matching 200-triangle tile not visible: '+JSON.stringify(part));
  paths.push({id,type,faces:part.model.faces});
 }
 const heightsAfter=await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.heightAt(x,z),position);
 if(heightsAfter.gradePatches!==0||Math.abs(heightsAfter.original-heightsBefore.original)>1e-7||
    Math.abs(heightsAfter.rendered-heightsBefore.rendered)>1e-7)
  throw Error('Terrain changed after placing house and three road types: '+JSON.stringify({heightsBefore,heightsAfter}));
 await page.click('#save');
 const savedWithPaths=await page.evaluate(()=>JSON.parse(window.__hfWorldForge3DQA.savedJSON()||'null'));
 if(savedWithPaths?.objects?.length!==4||!savedWithPaths.objects.some(o=>o.type==='floor-grass'))
  throw Error('Edited stone, native dirt, grass and house do not share the RPG layout');
 const selecting=await page.evaluate(()=>window.__hfWorldForge3DQA.placement());
 if(selecting.repeatPlacement)throw Error('Unwanted default Repeat ON prevents selecting an object automatically');
 console.log('[P542 NATIVE PAVEMENT + SUPPORT]',JSON.stringify({position,heightsBefore,heightsAfter,paths,foundation:result.mesh.foundation}));

 const before=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 await page.keyboard.down('w');await delay(1200);await page.keyboard.up('w');
 const after=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 if(Math.hypot(after.targetX-before.targetX,after.targetZ-before.targetZ)<.3)
  throw Error('WASD camera failed');
 await page.mouse.move(930,355);await page.mouse.down({button:'right'});
 await page.mouse.move(1040,415,{steps:5});await page.mouse.up({button:'right'});
 const turned=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 if(Math.hypot(after.x-turned.x,after.z-turned.z)<.3)throw Error('Right mouse orbit failed');
 await page.screenshot({path:'p542-manual-slope-house.png',fullPage:true});
 fs.writeFileSync('p542-manual-slope-evidence.json',JSON.stringify({health,position,result,savedCount:savedWithPaths.objects.length,paths,heightsBefore,heightsAfter,before,after,turned,errors,missing},null,2));
 console.log('[P542 PASS] clean native Unsung plaza, real manually placed KayKit house on '+position.slope.toFixed(2)+' m hillside, native terrain UNCHANGED, 3 conforming path textures, WASD, mouse:',JSON.stringify({placedId,position,meshes:result.mesh.meshes,faces:result.mesh.faces}));
}finally{await browser?.close();server.kill('SIGTERM');}
