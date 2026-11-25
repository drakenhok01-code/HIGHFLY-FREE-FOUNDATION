import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';

// This QA is intentionally manual-only: it must never auto-generate Arvelia.
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
if(!chrome)throw Error('Chrome unavailable');
const base='http://127.0.0.1:5188/HIGHFLY-FREE-FOUNDATION/preview-p541/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5188','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p541/'],{stdio:['ignore','pipe','pipe']});
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
  catch(err){console.warn('[P541 browser attempt '+attempt+'] '+String(err).slice(0,350));if(attempt===2)throw err;await delay(1800);}
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
 fs.writeFileSync('p541-editor-health.json',JSON.stringify({health,errors,missing},null,2));
 if(health.phase!=='listo'||health.errors.length||errors.length||missing.length)throw Error('Native Unsung editor scene or assets failed: '+JSON.stringify({health,errors,missing}));
 if(health.count!==0||!health.autoVillageHidden||!health.automaticPresetHidden||!health.slopeAuto)
  throw Error('Manual editor MUST open clean with slope AUTO and hidden town generators: '+JSON.stringify(health));
 console.log('[P541 CLEAN MANUAL PASSED]',JSON.stringify(health));
 await page.screenshot({path:'p541-original-terrain-empty.png',fullPage:true});
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
 await page.waitForFunction(id=>!!window.__hfWorldForge3DQA?.inspect(id),{timeout:60000,polling:250},placedId);
 const result=await page.evaluate(id=>{
  const qa=window.__hfWorldForge3DQA;
  const object=qa.objects().find(x=>x.id===id);
  return {object,mesh:qa.inspect(id),slopeAuto:qa.placement().adaptSlope};
 },placedId);
 if(result.object?.type!=='kaykit-home-a'||result.mesh?.meshes<1||result.mesh?.faces<3||!result.slopeAuto)
  throw Error('Placed building is not real 3D or lost slope: '+JSON.stringify(result));
 await page.click('#save');
 const saved=await page.evaluate(()=>JSON.parse(window.__hfWorldForge3DQA.savedJSON()||'null'));
 if(saved?.objects?.length!==1||saved.objects[0].id!==placedId)
  throw Error('Manual placement not saved in RPG-shared isolated JSON');
 if(saved.objects[0].highflyTown||saved.objects[0].highflyMaster)
  throw Error('Unexpected generated town in manually saved building');
 const before=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 await page.keyboard.down('w');await delay(1200);await page.keyboard.up('w');
 const after=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 if(Math.hypot(after.targetX-before.targetX,after.targetZ-before.targetZ)<.3)
  throw Error('WASD camera failed');
 await page.mouse.move(930,355);await page.mouse.down({button:'right'});
 await page.mouse.move(1040,415,{steps:5});await page.mouse.up({button:'right'});
 const turned=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 if(Math.hypot(after.x-turned.x,after.z-turned.z)<.3)throw Error('Right mouse orbit failed');
 await page.screenshot({path:'p541-manual-slope-house.png',fullPage:true});
 fs.writeFileSync('p541-manual-slope-evidence.json',JSON.stringify({health,position,result,savedCount:saved.objects.length,before,after,turned,errors,missing},null,2));
 console.log('[P541 PASS] clean native Unsung plaza, real manually placed KayKit house on '+position.slope.toFixed(2)+' m hillside, graded earth, single RPG save, WASD, mouse:',JSON.stringify({placedId,position,meshes:result.mesh.meshes,faces:result.mesh.faces}));
}finally{await browser?.close();server.kill('SIGTERM');}
