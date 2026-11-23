import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const url='http://127.0.0.1:5199/qa-p494-scene.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5199','--strictPort'],
 {cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let browser,logs='';
server.stdout.on('data',v=>logs+=String(v));server.stderr.on('data',v=>logs+=String(v));
try{
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await delay(200);}
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
  '--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:915,height:500}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>globalThis.__highflyP494SceneQA?.ready,null,{timeout:90000});
 const report=await page.evaluate(()=>globalThis.__highflyP494SceneQA);
 console.log('[HIGHFLY P494 REAL GPU VISUAL QA]',JSON.stringify({report,errors}));
 assert.equal(report.error,null,'3D loaders error');
 assert.equal(report.npcMeshes,6,'KayKit actual six skinned body meshes must load');
 assert.ok(report.wolfMeshes>0,'Quaternius actual wolf GLB must have visible skinned meshes');
 assert.ok(report.npcPixelDifference>90,'KayKit NPC must render real colored pixels');
 assert.ok(report.wolfPixelDifference>90,'Quaternius wolf must render real colored pixels');
 await page.screenshot({path:'qa-p494-actors.png'});
}finally{await browser?.close();server.kill('SIGTERM');}
