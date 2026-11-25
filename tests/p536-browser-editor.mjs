import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
const chrome=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(x=>fs.existsSync(x));
if(!chrome)throw Error('Chromium unavailable for visual QA');
const base='http://127.0.0.1:5188/HIGHFLY-FREE-FOUNDATION/preview-p536/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5188','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p536/'],{stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
let browser;
try{
 let available=false;
 for(let i=0;i<90;i++){try{const z=await fetch(base+'highfly/world-forge-3d.html');if(z.ok){available=true;break;}}catch{}await delay(350);}
 if(!available)throw Error('Vite editor preview unavailable: '+logs.slice(-1000));
 browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage();await page.setViewport({width:1152,height:700,deviceScaleFactor:1});
 const exceptions=[];page.on('pageerror',e=>exceptions.push(String(e).slice(0,400)));page.on('console',m=>{if(m.type()==='error')exceptions.push(m.text().slice(0,400));});
 await page.goto(base+'highfly/world-forge-3d.html?hfqa=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>['listo','fallo'].includes(window.__highfly3DEditorHealth?.phase),{timeout:190000,polling:500});
 let s=await page.evaluate(()=>({phase:window.__highfly3DEditorHealth?.phase,
  log:window.__highfly3DEditorHealth?.lines,errors:window.__highfly3DEditorHealth?.errors,
  canvas:!!document.querySelector('#canvas-holder canvas'),
  status:document.querySelector('#status')?.textContent,
  bend4:!!document.querySelector('#p536-bend-tight'),
  bend8:!!document.querySelector('#p536-bend-wide')
 }));
 console.log('[P536 ORIGINAL SCENE]',JSON.stringify({s,exceptions}).slice(0,7000));
 await page.screenshot({path:'p536-editor-native-screenshot.png',fullPage:true});
 if(s.phase!=='listo'||!s.canvas||!s.bend4||!s.bend8||
  !s.log?.some(x=>x.includes('9 capas PBR'))||
  !s.log?.some(x=>x.includes('Agua estática'))||
  !s.log?.some(x=>x.includes('Pasto, árboles'))||
  s.errors?.length)throw Error('Native scene incomplete '+JSON.stringify({s,exceptions}).slice(0,3300));
 await page.click('#p536-bend-tight');
 await page.click('#rot-right');
 const spot=await page.evaluate(()=>{
  const q=window.__hfWorldForge3DQA;
  for(let dx=-55;dx<55;dx+=8)for(let dz=-55;dz<55;dz+=8){
   const x=Math.round((-512+dx)/4)*4,z=Math.round((-70+dz)/4)*4;
   if(q.validPosition({type:'floor-stone-curve-tight',x,z,scale:1,yaw:Math.PI/2}).ok){
    q.focus(x,z,65);return {x,z};
   }
  }
  return null;
 });
 if(!spot)throw Error('Modular tile: no valid initial town terrain');
 await delay(350);
 const hit=await page.evaluate(q=>window.__hfWorldForge3DQA.point(q.x,q.z),spot);
 if(!hit.visible)throw Error('Modular tile placement offscreen '+JSON.stringify(hit));
 await page.mouse.move(hit.x,hit.y);await page.mouse.down();await page.mouse.up();await delay(500);
 const saved=await page.evaluate(()=>window.__hfWorldForge3DQA.objects().filter(x=>x.type==='floor-stone-curve-tight'));
 if(!saved.length||Math.abs(saved[0].yaw-Math.PI/2)>.03)throw Error('Modular tile did not save rotated 90 degrees '+JSON.stringify(saved));
 console.log('[P536 PASS] REAL 9 UNSUNG MATERIALS + PATHS + STATIC DEPTH WATER + NATIVE GRASS / LEAVES + MODULAR 90 DEGREE PIECE');
 fs.writeFileSync('p536-editor-native-qa.json',JSON.stringify({status:s,exceptions,spot,saved},null,2));
}finally{await browser?.close();server.kill('SIGTERM');}
