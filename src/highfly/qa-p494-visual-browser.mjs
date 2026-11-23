/** Real Three.js GPU visual validation of all THREE licensed animal rigs
 * and KayKit Free stylized NPC without loading massive Unsung world.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const port=5188,url='http://127.0.0.1:'+port+'/qa-p494-visual.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let browser;
try{
 let ok=false;for(let i=0;i<85;i++){if(server.exitCode!==null)throw Error('Vite visual QA failed');try{if((await fetch(url)).ok){ok=true;break}}catch{}await delay(250);}
 assert.ok(ok,'Vite visual QA did not start');
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__p494VisualQA?.ready,null,{timeout:35000});
 const report=await page.evaluate(()=>{const {ready,issues,creatures,kaykit,manualWorldMatrix}=window.__p494VisualQA;return {ready,issues,creatures,kaykit,manualWorldMatrix};});
 assert.deepEqual(report.issues,[],JSON.stringify(report));
 assert.equal(report.manualWorldMatrix,true,'QA must reproduce Unsung scene.matrixWorldAutoUpdate=false');
 assert.ok(report.kaykit.meshCount>=5,JSON.stringify(report.kaykit));
 for(const id of ['wolf','boar','crab']){
  const entry=report.creatures[id];assert.ok(entry?.meshCount>=1,id+' has no visible skinned mesh');
  assert.ok(entry.clips>=4,id+' has no original animations');
  assert.equal(entry.unlit,true,id+' will render black inside unlit Unsung world');
 }
 await delay(800);
 await page.screenshot({path:'qa-p494-real-wildlife.png'});
 fs.writeFileSync('qa-p494-real-wildlife.json',JSON.stringify({report,errors},null,2));
 assert.deepEqual(errors.filter(x=>/TypeError|ReferenceError|SyntaxError|WebGL/.test(x)),[]);
 console.log('HIGHFLY P494 REAL THREE MODEL QA PASS',JSON.stringify(report));
}finally{await browser?.close();server.kill('SIGTERM');}
