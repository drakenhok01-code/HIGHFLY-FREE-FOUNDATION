import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
if(!chrome)throw Error('Chromium unavailable for visual QA');
const base='http://127.0.0.1:5188/HIGHFLY-FREE-FOUNDATION/preview-p538/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5188','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p538/'],{stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
let browser;
try{
 let available=false;
 for(let i=0;i<90;i++){try{if((await fetch(base+'highfly/world-forge-3d.html')).ok){available=true;break;}}catch{}await delay(350);}
 if(!available)throw Error('Preview unavailable: '+logs.slice(-1300));
 browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage();await page.setViewport({width:1260,height:800,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e).slice(0,500)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,350));});
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
 fs.writeFileSync('p538-eastbrook-qa.json',JSON.stringify({status,errors},null,2));
 console.log('[P538 EASTBROOK PREVIEW]',JSON.stringify({status,errors}).slice(0,7000));
 if(status.phase!=='listo'||status.errors?.length||errors.length||!status.button)throw Error('P538 source scene or JS failed');
 if(!status.plan?.complete)throw Error('Eastbrook LAND constrained placement not complete: '+JSON.stringify(status.plan));
 if(status.plan.objects.some(x=>/quay|dock|muelle|harbor|port/i.test(x.role||x.type)))throw Error('Harbor resource in land-only layout');
 page.once('dialog',dialog=>dialog.accept());
 await page.click('#pilot-eastbrook');
 await page.waitForFunction(()=>window.__hfWorldForge3DQA?.objects().some(x=>x.highflyNpc==='sera'),{timeout:110000,polling:500});
 const placed=await page.evaluate(()=>window.__hfWorldForge3DQA.objects().filter(x=>x.highflyTown==='arvelia'));
 if(placed.length!==status.plan.objects.length)throw Error('Editor placed '+placed.length+' but planned '+status.plan.objects.length);
 await delay(800);
 await page.screenshot({path:'p538-eastbrook-editor.png',fullPage:true});
 fs.writeFileSync('p538-eastbrook-placed.json',JSON.stringify(placed,null,2));
 console.log('[P538 PASS] EASTBROOK land-only, native tree/architecture validations, 3D models, NPCs and editable saved layout:',placed.length);
}finally{await browser?.close();server.kill('SIGTERM');}
