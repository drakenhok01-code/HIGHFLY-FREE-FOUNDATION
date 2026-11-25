/** P515 real Chrome/SwiftShader smoke — native original Unsung RPG, NO editor.
 * This is an integration test, not a mobile FPS benchmark.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium} from 'playwright';
const BASE='http://127.0.0.1:5195/HIGHFLY-FREE-FOUNDATION/preview-p515-eastbrook/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5195','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p515-eastbrook/'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
let browser;
try{
 let ready=false;
 for(let n=0;n<90;n++){
  if(server.exitCode!==null)throw Error('Vite stopped '+logs.slice(-700));
  try{const r=await fetch(BASE);if(r.ok){ready=true;break;}}catch{}
  await sleep(400);
 }
 assert.ok(ready,'Native Unsung Vite preview did not start '+logs.slice(-1400));
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 page.on('console',evt=>{if(evt.type()==='error')errors.push(evt.text().slice(0,500));});
 const badResponses=[];
 page.on('response',r=>{if(r.status()===404&&r.url().includes('/kaykit-free/'))badResponses.push(r.url());});
 await page.goto(BASE+'?hfqa=1&hfchar=kaykit',{waitUntil:'domcontentloaded',timeout:60000});
 try{
  await page.waitForFunction(()=>!!window.__hfP515Eastbrook?.readyPromise,null,{timeout:190000});
 }catch(err){
  const debug=await page.evaluate(()=>({readyState:document.readyState,
   game:!!window.__game,scene:!!window.__game?.pipe?.scene,
   town:window.__hfP515Eastbrook?.id??null,world:!!window.__game?.world,
   boot:document.querySelector('#boot')?.textContent?.slice(0,250)||''})).catch(e=>({error:String(e)}));
  console.error('[P515 RPG BOOT DIAGNOSTIC]',JSON.stringify({debug,errors,badResponses,reason:String(err)}).slice(0,7500));
  await page.screenshot({path:'qa-p515-eastbrook-native.png',fullPage:true,timeout:12000}).catch(()=>{});
  fs.writeFileSync('qa-p515-eastbrook.json',JSON.stringify({debug,errors,badResponses,error:String(err)},null,2));
  throw err;
 }
 await page.evaluate(async()=>{await window.__hfP515Eastbrook.readyPromise;return true;});
 const status=await page.evaluate(()=>{
  const town=window.__hfP515Eastbrook,g=window.__game;
  return {game:!!g,player:!!g?.player,world:!!g?.world,town:{
   id:town.id,editor:town.editor,placed:town.placed,intended:town.intended,
   visibleBuildings:town.visibleBuildings,loaded:town.loaded.map(x=>({id:x.id,model:x.model,colliders:x.colliders})),
   failed:town.failed,skipped:town.skipped,grassPixels:town.grassPixels,roads:town.roads,
   ready:town.fullyBuilt
  }};
 });
 console.log('[HIGHFLY P515 NATIVE REAL GAME]',JSON.stringify({status,errors,badResponses}).slice(0,8500));
 fs.writeFileSync('qa-p515-eastbrook.json',JSON.stringify({status,errors,badResponses},null,2));
 await page.screenshot({path:'qa-p515-eastbrook-native.png',fullPage:true});
 assert.ok(status.game&&status.player&&status.world,'Not the original playable RPG');
 assert.equal(status.town.id,'p515-native-eastbrook-v1');
 assert.equal(status.town.editor,false);
 assert.equal(status.town.intended,11);
 assert.equal(status.town.visibleBuildings,11,'Actual 3D buildings must load, no fake editor success');
 assert.equal(status.town.loaded.length,9);
 assert.ok(status.town.loaded.every(x=>x.colliders>0),'Real KayKit GLTF collision');
 assert.equal(status.town.ready,true,'No ground/asset omissions allowed');
 assert.ok(status.town.roads.segments>40&&status.town.grassPixels>100,'Medieval plaza/roads or grass clearing absent');
 assert.equal(badResponses.length,0,'All KayKit glTF texture/material resources must load');
 assert.equal(errors.filter(e=>/ReferenceError|TypeError|SyntaxError|GLSL|ERROR:/.test(e)).length,0,'No fatal runtime/shader errors');
 console.log('[HIGHFLY P515 PASS] 11 real GLTF/Unsung built-in, collidable, smooth stone roads. Mobile FPS not measured.');
}finally{await browser?.close();server.kill('SIGTERM');}
