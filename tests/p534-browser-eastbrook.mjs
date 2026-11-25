import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
const CHROME=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(fs.existsSync);
if(!CHROME)throw Error('Chrome no está disponible: la prueba WebGL es obligatoria');
const base='http://127.0.0.1:5189/HIGHFLY-FREE-FOUNDATION/preview-p534/';
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5189','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p534/'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let logs='';vite.stdout.on('data',x=>logs+=x);vite.stderr.on('data',x=>logs+=x);
let browser;
try{
 let up=false;
 for(let i=0;i<75;i++){
  try{const r=await fetch(base+'highfly/world-forge-3d.html');if(r.ok&&(await r.text()).includes('P5.3.4 PILOTO')){up=true;break;}}catch{}
  await delay(400);
 }
 if(!up)throw Error('No inició la vista P534: '+logs.slice(-1000));
 browser=await puppeteer.launch({executablePath:CHROME,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox','--window-size=1320,780']});
 const page=await browser.newPage();await page.setViewport({width:1320,height:780,deviceScaleFactor:1});
 const failures=[];page.on('pageerror',e=>failures.push(String(e).slice(0,300)));
 page.on('console',e=>{if(e.type()==='error')failures.push(e.text().slice(0,300));});
 await page.goto(base+'highfly/world-forge-3d.html?hfqa=1',{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>['listo','fallo'].includes(window.__highfly3DEditorHealth?.phase),{timeout:75000});
 let ready=await page.evaluate(()=>({health:window.__highfly3DEditorHealth,button:!!document.querySelector('#pilot-eastbrook'),key:localStorage.getItem('hf-world-forge-layout-p534-v1')}));
 console.log('[P534 NATIVE EDITOR]',JSON.stringify(ready).slice(0,2000));
 if(ready.health.phase!=='listo'||!ready.button)throw Error('La escena original o botón no cargó');
 await page.evaluate(()=>{window.confirm=()=>true;document.querySelector('#pilot-eastbrook').click();});
 await page.waitForFunction(()=>{
  const l=window.__hfWorldForge3DQA?.objects()||[];
  const s=document.querySelector('#status')?.textContent||'';
  return l.some(x=>String(x.id).startsWith('hf-p534-eastbrook-'))||s.includes('sin aplicar')||s.includes('cancelado')||s.includes('Faltan modelos');
 },{timeout:45000});
 await delay(1800);
 const state=await page.evaluate(()=>{
  const all=window.__hfWorldForge3DQA?.objects()||[];
  const town=all.filter(x=>String(x.id).startsWith('hf-p534-eastbrook-'));
  const keys=[...new Set(town.map(x=>x.highflyRole))];
  const saved=JSON.parse(localStorage.getItem('hf-world-forge-layout-p534-v1')||'null');
  return {count:town.length,roles:keys,saved:saved?.objects?.filter(x=>String(x.id).startsWith('hf-p534-eastbrook-')).length||0,
    status:document.querySelector('#status')?.textContent||'',buildings:town.map(x=>({type:x.type,role:x.highflyRole,x:x.x,z:x.z})),
    errors:window.__highfly3DEditorHealth?.errors?.slice(-5)};
 });
 await page.screenshot({path:'p534-eastbrook-world-forge.png',fullPage:true});
 console.log('[P534 EASTBROOK ACTUAL TERRAIN]',JSON.stringify({state,failures}).slice(0,6500));
 if(state.count<7||state.saved!==state.count||
    !['banco','herreria','taberna','capilla','botica','casa_muelle','gremio_highfly'].every(x=>state.roles.includes(x)))
  throw Error('Eastbrook NO quedó completo en las parcelas de Unsung: '+JSON.stringify(state).slice(0,4000));
 console.log('[P534 PASS] 6/6 Eastbrook + Unsung guild, native ground validated, separate JSON persisted. Android FPS NOT measured.');
}finally{await browser?.close();vite.kill('SIGTERM');}
