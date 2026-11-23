/** Real Three.js GPU visual validation of all THREE licensed animal rigs
 * and KayKit Free stylized NPC without loading massive Unsung world.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
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
 await page.waitForFunction(()=>window.__p494VisualQA?.pixels?.kaykit?.drawn>0,null,{timeout:15000});
 const report=await page.evaluate(()=>{const {ready,issues,creatures,kaykit,pixels,worldTransforms}=window.__p494VisualQA;return {ready,issues,creatures,kaykit,pixels,worldTransforms};});
 const imageBytes=await page.screenshot({path:'qa-p494-real-wildlife.png'});
 const png=PNG.sync.read(imageBytes);
 const screenshotMetrics={};
 for(const id of ['wolf','boar','crab','kaykit']){
  const probe=report.pixels?.[id];
  assert.ok(probe,'missing rendered pixel probe for '+id);
  assert.equal(probe.manualScene,true,'QA must use Unsung manual-matrix scene');
  // Chrome composites the WebGL drawing buffer before readback. Sampling
  // a Playwright screenshot is more reliable than gl.readPixels on a
  // default framebuffer with preserveDrawingBuffer=false.
  let bright=0,nonBackground=0;
  const py=png.height-probe.screenY;
  for(let y=Math.max(0,py-76);y<Math.min(png.height,py+74);y++)
   for(let x=Math.max(0,probe.screenX-43);x<Math.min(png.width,probe.screenX+42);x++){
    const i=(y*png.width+x)*4,rr=png.data[i],gg=png.data[i+1],bb=png.data[i+2];
    if(rr+gg+bb>195)bright++;
    if(rr+gg+bb>135)nonBackground++;
   }
  screenshotMetrics[id]={bright,nonBackground};
 }
 console.log('HIGHFLY P495 MANUAL SCENE PIXEL METRICS',JSON.stringify({
  screenshotMetrics,webglPixels:report.pixels,worldTransforms:report.worldTransforms}));
 for(const [id,v] of Object.entries(screenshotMetrics))
  assert.ok(v.bright>24,id+' model has no visible image pixels in real manual scene '+JSON.stringify(v));
 for(const [id,x] of [['wolf',-3.1],['boar',0],['crab',3.1]]){
  const v=report.worldTransforms.find(a=>a.id===id);
  assert.ok(v&&Math.abs(v.x-x)<.15,id+' model matrix not updated to real scene position: '+JSON.stringify(v));
 }
 assert.deepEqual(report.issues,[],JSON.stringify(report));
 assert.ok(report.kaykit.meshCount>=5,JSON.stringify(report.kaykit));
 for(const id of ['wolf','boar','crab']){
  const entry=report.creatures[id];assert.ok(entry?.meshCount>=1,id+' has no visible skinned mesh');
  assert.ok(entry.clips>=4,id+' has no original animations');
  assert.equal(entry.unlit,true,id+' will render black inside unlit Unsung world');
 }
 await delay(800);
 const corpse=await page.evaluate(()=>window.__p495ProbeCorpse());
 assert.equal(corpse.ok,true,'Corpse + USAR transaction failed: '+JSON.stringify(corpse));
 // Screenshot already captured for per-species visible pixel validation.
 fs.writeFileSync('qa-p494-real-wildlife.json',JSON.stringify({report,screenshotMetrics,corpse,errors},null,2));
 assert.deepEqual(errors.filter(x=>/TypeError|ReferenceError|SyntaxError|WebGL/.test(x)),[]);
 console.log('HIGHFLY P494 REAL THREE MODEL QA PASS',JSON.stringify(report));
}finally{await browser?.close();server.kill('SIGTERM');}
