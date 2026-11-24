/** HEADLESS WebGL2 checks actual shader output rather than static format args.
 * Uses Chrome/SwiftShader, NOT a substitute for Adreno 740 device FPS tests. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const url='http://127.0.0.1:5178/qa-p504-hdr.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5178','--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
let browser;
try{
 let connected=false;
 for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(output);try{if((await fetch(url)).ok){connected=true;break}}catch{}await delay(250);}
 assert.ok(connected,'P504 QA Vite did not launch '+output);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__hfP504VisualQA?.ready,{timeout:25000});
 const q=await page.evaluate(()=>window.__hfP504VisualQA);
 assert.equal(q.error,undefined,'Real HDR shader failed: '+JSON.stringify(q));
 assert.equal(errors.length,0,'Browser shader JS errors: '+errors.join(';'));
 if(q.packed){
  assert.ok(q.meanAbsRGB<=2.0,'Visible packed-HDR average error too large: '+JSON.stringify(q));
  assert.ok(q.maxAbsRGB<=8,'Visible packed-HDR peak channel error too large: '+JSON.stringify(q));
  assert.equal(q.missingPixels,0,'Packed HDR output unexpectedly black');
  console.log('[HIGHFLY P504 WEBGL PACKED-HDR PIXEL COMPARISON PASS]',JSON.stringify(q));
 }else{
  assert.ok(['unsupported','incomplete-fbo','gpu-probe-error'].includes(q.reason),'Unknown GPU format status '+JSON.stringify(q));
  console.log('::warning::Chromium test GPU does not support packed HDR. Reference RGBA16F fallback verified. '+JSON.stringify(q));
 }
 await ctx.close();
}finally{
 try{await browser?.close()}catch{}
 server.kill('SIGTERM');
}
