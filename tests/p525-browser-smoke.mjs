import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
const CHROME=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(f=>fs.existsSync(f));
if(!CHROME)throw Error('Chrome unavailable on CI runner: cannot claim visual 3D verification');
const base='http://127.0.0.1:5188/HIGHFLY-FREE-FOUNDATION/preview-p525/';
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5188','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p525/'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let serverLogs='';vite.stdout.on('data',x=>serverLogs+=x);vite.stderr.on('data',x=>serverLogs+=x);
let browser;
try{
 let up=false;
 for(let k=0;k<40;k++){
  try{const r=await fetch(base+'highfly/world-forge-3d.html');const html=await r.text();if(r.ok&&html.includes('WORLD FORGE · 3D V0.6')){up=true;break;}}catch{}
  await delay(400);
 }
 if(!up)throw Error('Vite preview server did not start '+serverLogs.slice(-1500));
 browser=await puppeteer.launch({executablePath:CHROME,headless:true,args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
  '--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox',
  '--window-size=1280,760'
 ]});
 const page=await browser.newPage();
 await page.setViewport({width:1280,height:760,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e).slice(0,350)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text().slice(0,350));});
 await page.goto(base+'highfly/world-forge-3d.html',{waitUntil:'domcontentloaded',timeout:35000});
 let phase='unknown';
 try{
  await page.waitForFunction(()=>['listo','fallo'].includes(window.__highfly3DEditorHealth?.phase),{timeout:35000});
 }catch(err){
  // Debug exactly what was loaded: DOM, script, resource errors and scene phase.
  const trace=await Promise.race([
   page.evaluate(()=>({phase:window.__highfly3DEditorHealth?.phase||'missing global',
    log:window.__highfly3DEditorHealth?.lines||[],errors:window.__highfly3DEditorHealth?.errors||[],
    ready:document.readyState,html:document.querySelector('#status')?.textContent,
    script:[...document.scripts].map(s=>s.src),canvas:!!document.querySelector('canvas'),
    resource:[...performance.getEntriesByType('resource')].slice(-12).map(x=>({name:x.name.slice(-75),duration:x.duration}))})),
   delay(2500).then(()=>({blocked:'browser event loop unresponsive'}))
  ]);
  console.error('[P525 CHROME STATE AFTER 35s]',JSON.stringify({trace,errors,serverLogs:serverLogs.slice(-600)}).slice(0,6000));
  await Promise.race([page.screenshot({path:'p525-editor-3d-smoke.png',fullPage:true}),delay(2400)]);
  throw err;
 }
 const state=await page.evaluate(()=>{
  const r=window.__highfly3DEditorHealth;
  const canvas=document.querySelector('#canvas-holder canvas');
  return {phase:r.phase,entries:r.lines,errors:r.errors,
   canvas:!!canvas&&canvas.width>300&&canvas.height>200,
   catalog:document.querySelectorAll('#cats button').length,
   map2d:!!document.querySelector('#map2d'),
   text:document.querySelector('#status')?.textContent};
 });
 await page.screenshot({path:'p525-editor-3d-smoke.png',fullPage:true});
 console.log('[P525 THREE.JS BROWSER SMOKE]',JSON.stringify(state));
 if(state.phase!=='listo'||!state.canvas||state.catalog<4||
    !state.entries.some(s=>s.includes('Construcciones originales 3D')))
   throw Error('Native 3D scene did not finish: '+JSON.stringify({state,errors}).slice(0,2900));
 console.log('PASS: headless WebGL render, exact Unsung terrain/architecture, KayKit catalog and 2D fallback');
}catch(e){console.error('[P525 VISUAL SMOKE FAILED]',String(e),serverLogs.slice(-500));throw e}
finally{await browser?.close();vite.kill('SIGTERM');}
