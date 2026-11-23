/** Focused real-browser P4.9.3 menu and controls smoke. Heavy P4.9.2 image tests
 * already passed in their approved release; this checks new P493 interactions.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const url='http://127.0.0.1:5197/qa-rpg.html?hfintro=1';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5197','--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',x=>output+=String(x));server.stderr.on('data',x=>output+=String(x));
let browser;
try{
 let ready=false;
 for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(output);try{if((await fetch(url)).ok){ready=true;break}}catch{}await delay(250);}
 assert.ok(ready,'P493 Vite fixture unavailable '+output);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:915,height:412}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__hfRpgTest?.ready&&window.__highflyRpg&&window.__game,null,{timeout:15000});
 await page.evaluate(()=>{const g=window.__game;g.start();window.__highflyRpg.open();});
 await page.waitForSelector('#hf-rpg .hf-rpg-character-layout');
 await page.locator('#hf-rpg [data-hf-tab="opciones"]').click();
 await page.waitForSelector('#hf-rpg [data-hf-camera-sensitivity]');
 await page.locator('#hf-rpg [data-hf-camera-sensitivity]').evaluate(el=>{el.value='1.5';el.dispatchEvent(new Event('input',{bubbles:true}));});
 const control=await page.evaluate(()=>window.__game.input.sensitivity);
 assert.equal(control,1.5,'Mobile camera sensitivity must alter actual input object');
 await page.locator('#hf-rpg [data-hf-camera-invert]').click();
 assert.equal(await page.evaluate(()=>window.__game.input.invertY),true,'InvertY camera must update');
 await page.locator('#hf-rpg [data-hf-tab="mapa"]').click();
 assert.equal(await page.locator('.hf-p493-map-canvas').count(),1,'P493 map canvas missing');
 await page.locator('#hf-rpg [data-hf-tab="bolsa"]').click();
 assert.ok(await page.locator('#hf-rpg [data-hf-action="bag:discard"]').count()>0,'Bag discard must be visible');
 assert.ok(await page.locator('#hf-rpg [data-hf-action="bag:sell"]').count()>0,'Bag sale must be visible');
 await page.locator('#hf-rpg [data-hf-action="bag:discard"]').click();
 await page.waitForSelector('#hf-rpg .hf-p493-confirm-mask');
 await page.locator('#hf-rpg [data-hf-bag="cancel"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-p493-confirm-mask').count(),0,'Cancelling must be safe');
 await page.locator('#hf-rpg [data-hf-action="close"]').click();
 await page.evaluate(()=>window.__highflyRpg.open());
 assert.ok(await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="personaje"].is-active').count()>0,'Menu resets to Personaje');
 assert.deepEqual(errors,[],'Browser exceptions');
 console.log('[HIGHFLY P493 MENU SMOKE] PASS sensitivity=1.5 invertY=true map=real-canvas bag=discard+sell+confirm cancel');
}finally{await browser?.close();server.kill('SIGTERM');}
