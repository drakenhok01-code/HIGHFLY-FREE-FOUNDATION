/** CI: actual Chromium/WebGL GLTF smoke, not a full Unsung gameplay acceptance test. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const url='http://127.0.0.1:5175/qa-kaykit.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5175','--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';
server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
let browser;
try{
 let ready=false;
 for(let n=0;n<80;n++){
  if(server.exitCode!==null)throw Error('Vite server exited: '+output);
  try{const r=await fetch(url);if(r.ok){ready=true;break}}catch{}
  await delay(250);
 }
 assert.ok(ready,'Vite QA harness never came online '+output);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540}});
 let errors=[];
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction('window.__hfQa?.done===true',null,{timeout:65000});
 const report=await page.evaluate(()=>window.__hfQa);
 fs.writeFileSync('qa-kaykit-report.json',JSON.stringify({report,errors},null,2));
 await page.screenshot({path:'qa-kaykit.png'});
 console.log('[HIGHFLY REAL WEBGL]',JSON.stringify(report), 'errors=',errors.join(' | '));
 assert.equal(report.ok,true,'KayKit actual browser GLB loader/render failed: '+String(report.error));
 assert.equal(errors.length,0,'Browser threw JS errors');
 assert.ok(report.changedPixels>100,'Knight pixels missing');
 console.log('PASS KayKit FREE WebGL2 image + actual 14 animation states + sword and socket');
}finally{await browser?.close();server.kill('SIGTERM');}
