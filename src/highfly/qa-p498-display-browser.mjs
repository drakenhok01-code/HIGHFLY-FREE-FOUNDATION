/** P4.9.8 Real Unsung Pipeline on simulated Android; no synthetic fake renderer.
 * True Adreno GPU/thermal evaluation still requires the physical Samsung.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const port=5178,base='http://127.0.0.1:'+port+'/qa-p498-display.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
let browser;
try{
 let ready=false;
 for(let k=0;k<80;k++){
  if(server.exitCode!==null)throw Error('Vite failed: '+output);
  try{if((await fetch(base)).ok){ready=true;break}}catch{}
  await delay(250);
 }
 assert.ok(ready,'Vite did not start: '+output);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?hfdisplay=native',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction('window.__p498Browser?.ok===true',{timeout:35000});
 const native=await page.evaluate(()=>window.__p498Browser);
 assert.equal(native.kind,'ACTUAL_UNSUNG_PIPELINE');
 assert.equal(native.synchronized,true,'Scene/TAA framebuffer mismatch '+JSON.stringify(native));
 assert.deepEqual(native.css,[915,412]);
 assert.deepEqual(native.drawingBuffer,[1830,824]);
 assert.deepEqual(native.scene,[1830,824]);
 assert.deepEqual(native.taaHistory,[[1830,824],[1830,824]]);
 assert.deepEqual(native.simDpr3,[2745,1236]);
 assert.equal(native.physicalCoverage,1);
 await page.screenshot({path:'qa-p498-native-buffer.png'});
 await page.goto(base+'?hfdisplay=css',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction('window.__p498Browser?.ok===true',{timeout:35000});
 const css=await page.evaluate(()=>window.__p498Browser);
 assert.deepEqual(css.drawingBuffer,[915,412]);
 assert.equal(css.synchronized,true);
 assert.equal(css.mode,'css');
 assert.deepEqual(errors,[],'Unexpected browser exceptions');
 fs.writeFileSync('qa-p498-native-buffer-report.json',JSON.stringify({native,css,errors},null,2));
 console.log('HIGHFLY P498 REAL UNSUNG PIPELINE DPR/RT PASS',JSON.stringify({native,css,errors}));
}finally{
 await browser?.close();server.kill('SIGTERM');
}
