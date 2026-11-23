import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import fs from 'node:fs';
import {chromium} from 'playwright';
const url='http://127.0.0.1:5193/qa-p493-rigs.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5193','--strictPort'],
 {cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
let browser;
try{
 let ready=false;
 for(let i=0;i<120;i++){
  if(server.exitCode!==null)throw Error('Vite failed '+output);
  try{if((await fetch(url)).ok){ready=true;break}}catch{}
  await delay(250);
 }
 assert.ok(ready,'QA dev server unavailable '+output);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader',
  '--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1150,height:470}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__hfP493RigQA?.ready||!!window.__hfP493RigQA?.error,null,{timeout:75000});
 const result=await page.evaluate(()=>window.__hfP493RigQA);
 await page.screenshot({path:'qa-p493-real-rigs.png'});
 fs.writeFileSync('qa-p493-real-rigs.json',JSON.stringify({result,errors},null,2));
 console.log('[HIGHFLY P493 RIG REAL PIXEL QA]',JSON.stringify({result,errors}));
 assert.equal(result.error,null,'KayKit/animal GLB rig load/render failed');
 assert.equal(result.report?.length,4,'4 independent actors required');
 for(const n of result.report){
  assert.ok(n.skinned>0,n.name+' needs real skeletal meshes');
  assert.ok(n.visiblePixels>80,n.name+' invisible in actual GPU render: '+n.visiblePixels);
 }
 assert.ok(result.triangles>100,'GPU triangles missing');
 assert.deepEqual(errors,[],'Browser WebGL script errors');
}finally{await browser?.close();server.kill('SIGTERM');}
