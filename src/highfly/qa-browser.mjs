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
 // F0.11 Android-specific physical viewport test: the context circle must
 // actually render and DASH dragging must not steer the movement joystick.
 const android=await browser.newContext({
   viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true,
   userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'
 });
 const mobile=await android.newPage();
 await mobile.goto('http://127.0.0.1:5175/qa-touch.html',{waitUntil:'domcontentloaded',timeout:30000});
 await mobile.waitForFunction('window.__hfTouchTest?.ready && !document.querySelector("#hf-touch")?.hidden',null,{timeout:10000});
 const buttons=await mobile.evaluate(()=>{
  const context=document.querySelector('#hf-touch .context');
  const dash=document.querySelector('#hf-touch .dash');
  const roll=document.querySelector('#hf-touch .roll');
  const rect=e=>e?.getBoundingClientRect();
  const c=rect(context),d=rect(dash),r=rect(roll);
  const hud=document.querySelector('#hf-touch .hf-vitals'),rectHud=rect(hud);
  const labels=[...document.querySelectorAll('#hf-touch .hf-vital b')].map(e=>e.textContent);
  return {width:innerWidth,height:innerHeight,
   premiumHud:{visible:!!rectHud&&rectHud.width>315&&rectHud.x>=0&&rectHud.right<innerWidth&&
       rectHud.top>=0,labels,rect:{x:rectHud?.x,y:rectHud?.y,width:rectHud?.width,height:rectHud?.height}},
   visible:!!c&&
   getComputedStyle(context).display!=='none'&&
   getComputedStyle(context).visibility==='visible'&&
   c.width>45&&c.x>=0&&c.right<=innerWidth,
   context:{x:c?.x,y:c?.y,width:c?.width},dash:{x:d?.x,y:d?.y,width:d?.width},
   roll:{x:r?.x,y:r?.y,width:r?.width},
   adjacent:!!c&&!!d&&Math.abs(c.right-d.left)<22};
 });
 assert.ok(buttons.premiumHud.visible&&JSON.stringify(buttons.premiumHud.labels)===JSON.stringify(['HP','ENERGÍA','MANÁ','O₂']),
   'Premium four-resource HUD missing or outside Samsung landscape viewport '+JSON.stringify(buttons.premiumHud));
 assert.ok(buttons.visible&&buttons.adjacent,'Context button must be visible next to DASH on S23 landscape: '+JSON.stringify(buttons));
 const d=await mobile.locator('#hf-touch .dash').boundingBox();
 await mobile.mouse.move(d.x+d.width/2,d.y+d.height/2);
 await mobile.mouse.down();
 await mobile.mouse.move(d.x+d.width/2+34,d.y+d.height/2,{steps:4});
 await mobile.mouse.up();
 await mobile.waitForFunction('window.__hfTouchTest?.dash !== null',null,{timeout:6000});
 const drag=await mobile.evaluate(()=>window.__hfTouchTest.dash);
 assert.ok(drag.direction?.x>.9 && Math.abs(drag.move.x)<.001,'Independent rightward DASH circle aim '+JSON.stringify(drag));
 // An ACTUAL Android-like DOM pointermove must emit the desired cut while
 // still held down; F0.12 only emitted after pointerup, often too late.
 const slash=await mobile.locator('#hf-touch .atk').boundingBox();
 await mobile.mouse.move(slash.x+slash.width/2,slash.y+slash.height/2);
 await mobile.mouse.down();
 await mobile.mouse.move(slash.x+slash.width/2-40,slash.y+slash.height/2,{steps:7});
 await mobile.waitForFunction('window.__hfTouchTest?.attack?.direction?.x < -0.9',null,{timeout:6000});
 const swipe=await mobile.evaluate(()=>window.__hfTouchTest.attack);
 assert.equal(swipe.direction.x,-1,'left slash must be selected before release');
 assert.ok(!swipe.held,'directional slash must not turn into permanent ATK hold');
 await mobile.mouse.up();
 console.log('PASS HIGHFLY DIRECTIONAL ATTACK live pointermove',JSON.stringify(swipe));
  // F0.12.2 HUD editing: drag ATK without launching a strike, save, restore.
 const editor=mobile.locator('#hf-touch .hud-edit');
 await editor.click({force:true});
 await mobile.waitForFunction('document.querySelector("#hf-touch")?.dataset.editing==="1"');
 const original=await mobile.locator('#hf-touch .atk').boundingBox();
 await mobile.mouse.move(original.x+original.width/2,original.y+original.height/2);
 await mobile.mouse.down();
 await mobile.mouse.move(original.x+original.width/2-24,original.y+original.height/2-31,{steps:5});
 await mobile.mouse.up();
 const shifted=await mobile.locator('#hf-touch .atk').boundingBox();
 assert.ok(original.x-shifted.x>12&&original.y-shifted.y>12,
   'HUD editor must drag ATK without firing native combat');
 const saved=await mobile.evaluate(()=>!!localStorage.getItem('highfly-hud-layout-f0122'));
 assert.ok(saved,'HUD layout must persist to browser storage');
 await mobile.locator('[data-hud-op="save"]').click({force:true});
 await mobile.reload({waitUntil:'domcontentloaded'});
 await mobile.waitForFunction('window.__hfTouchTest?.ready && !document.querySelector("#hf-touch")?.hidden');
 const restored=await mobile.locator('#hf-touch .atk').boundingBox();
 assert.ok(Math.abs(restored.x-shifted.x)<5&&Math.abs(restored.y-shifted.y)<5,
   'HUD custom position must restore after page reload');
 await mobile.locator('#hf-touch .hud-edit').click({force:true});
 await mobile.locator('[data-hud-op="reset"]').click({force:true});
 await mobile.locator('[data-hud-op="save"]').click({force:true});
 await mobile.screenshot({path:'qa-touch-mobile.png'});
 fs.writeFileSync('qa-touch-report.json',JSON.stringify({buttons,drag},null,2));
 console.log('PASS F0.11 S23 LANDSCAPE HUD / CONTEXT CIRCLE / RADIAL AIM',JSON.stringify({buttons,drag}));
 await android.close();
}finally{await browser?.close();server.kill('SIGTERM');}
