import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
if(!chrome)throw Error('Chromium unavailable for visual QA');
const base='http://127.0.0.1:5188/HIGHFLY-FREE-FOUNDATION/preview-p539/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5188','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p539/'],{stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
let browser;
try{
 let available=false;
 for(let i=0;i<90;i++){try{if((await fetch(base+'highfly/world-forge-3d.html')).ok){available=true;break;}}catch{}await delay(350);}
 if(!available)throw Error('Preview unavailable: '+logs.slice(-1300));
 browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage();await page.setViewport({width:1260,height:800,deviceScaleFactor:1});
 const errors=[],missingResources=[];
 page.on('pageerror',e=>errors.push('Browser JS: '+String(e).slice(0,500)));
 // The generic Chromium console message 'Failed to load resource 404' does
 // not identify the resource. Track the actual URL and status instead.
 // Missing favicons are not failures of the 3D town or playable RPG.
 page.on('response',r=>{if(r.status()<400)return;
  const path=new URL(r.url()).pathname;
  if(path.endsWith('/favicon.ico'))return;
  missingResources.push({status:r.status(),url:r.url()});
 });
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource: the server responded with a status of 404/i.test(m.text()))errors.push(m.text().slice(0,350));});
 await page.goto(base+'highfly/world-forge-3d.html?hfqa=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>['listo','fallo'].includes(window.__highfly3DEditorHealth?.phase),{timeout:200000,polling:500});
 const status=await page.evaluate(()=>{
  const qa=window.__hfWorldForge3DQA;
  const plan=qa?.eastbrookPlan();
  return {phase:window.__highfly3DEditorHealth?.phase,
    errors:window.__highfly3DEditorHealth?.errors,
    plan:{complete:plan?.complete,center:plan?.center,reason:plan?.reason,
      missing:plan?.missing,npcMissing:plan?.npcMissing,
      objects:plan?.objects?.map(x=>({id:x.id,type:x.type,x:x.x,z:x.z,role:x.highflyRole,npc:x.highflyNpc}))},
    button:!!document.getElementById('pilot-eastbrook')};
 });
 fs.writeFileSync('p539-eastbrook-qa.json',JSON.stringify({status,errors,missingResources},null,2));
 console.log('[P539 EASTBROOK PREVIEW]',JSON.stringify({status,errors,missingResources}).slice(0,7000));
 if(status.phase!=='listo'||status.errors?.length||errors.length||missingResources.length||!status.button)throw Error('P539 source scene or JS failed');
 if(!status.plan?.complete)throw Error('Eastbrook LAND constrained placement not complete: '+JSON.stringify(status.plan));
 const smithy=status.plan.objects.find(x=>x.role==='herreria');
 if(!['kaykit-blacksmith','free-building-blacksmith-blue','free-building-blacksmith-green','free-building-blacksmith-yellow','kaykit-home-a','kaykit-home-b','unsung-hall'].includes(smithy?.type))throw Error('Smithy must use original CC0 or verified CC0 substitute: '+JSON.stringify(smithy));
 if(status.plan.objects.some(x=>/quay|dock|muelle|harbor|port/i.test(x.role||x.type)))throw Error('Harbor resource in land-only layout');
 page.once('dialog',dialog=>dialog.accept());
 await page.click('#pilot-eastbrook');
 await page.waitForFunction(()=>window.__hfWorldForge3DQA?.objects().some(x=>x.highflyNpc==='sera'),{timeout:110000,polling:500});
 const placed=await page.evaluate(()=>window.__hfWorldForge3DQA.objects().filter(x=>x.highflyTown==='arvelia'));
 if(placed.length!==status.plan.objects.length)throw Error('Editor placed '+placed.length+' but planned '+status.plan.objects.length);
 // Real WebGL interaction: keyboard moves the target in continuous camera space,
 // right-drag turns the scene (rather than panning like in P538).
 const camStart=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 await page.keyboard.down('w');await delay(230);await page.keyboard.up('w');
 const camMoved=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 if(Math.hypot(camMoved.targetX-camStart.targetX,camMoved.targetZ-camStart.targetZ)<.3)
  throw Error('WASD camera movement failed');
 await page.mouse.move(950,340);await page.mouse.down({button:'right'});
 await page.mouse.move(1050,420,{steps:5});await page.mouse.up({button:'right'});
 const camTurned=await page.evaluate(()=>window.__hfWorldForge3DQA.camera());
 if(Math.hypot(camMoved.x-camTurned.x,camMoved.z-camTurned.z)<.3)
  throw Error('Right-mouse camera orbit failed');
 const slopeProbe=await page.evaluate(()=>{
  const qa=window.__hfWorldForge3DQA;
  for(let x=-740;x<=-330;x+=24)for(let z=-250;z<=100;z+=24){
   const o={id:'qa-slope',type:'kaykit-home-a',x,z,yaw:0,scale:1,clearTrees:true};
   const r=qa.validPosition(o);
   if(r.ok&&r.slope>2.3)return {x,z,slope:r.slope,groundY:r.y};
  }
  return null;
 });
 if(!slopeProbe)throw Error('P539 real Unsung slope acceptance probe found no buildable sloping parcel');
 console.log('[P539 NAV+SLOPE PASS]',JSON.stringify({camStart,camMoved,camTurned,slopeProbe}));
 await delay(800);
 await page.screenshot({path:'p539-eastbrook-editor.png',fullPage:true});
 fs.writeFileSync('p539-eastbrook-placed.json',JSON.stringify(placed,null,2));
 console.log('[P539 PASS] EASTBROOK land-only, native tree/architecture validations, 3D models, NPCs and editable saved layout:',placed.length);
}finally{await browser?.close();server.kill('SIGTERM');}
