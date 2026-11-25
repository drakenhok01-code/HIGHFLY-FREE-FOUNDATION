import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
const CHROME=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(f=>fs.existsSync(f));
if(!CHROME)throw Error('Chrome unavailable on CI runner: cannot claim visual 3D verification');
const base='http://127.0.0.1:5188/HIGHFLY-FREE-FOUNDATION/preview-p528/';
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5188','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p528/'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let serverLogs='';vite.stdout.on('data',x=>serverLogs+=x);vite.stderr.on('data',x=>serverLogs+=x);
let browser;
try{
 let up=false;
 for(let k=0;k<40;k++){
  try{const r=await fetch(base+'highfly/world-forge-3d.html');const html=await r.text();if(r.ok&&html.includes('WORLD FORGE · 3D V0.8')){up=true;break;}}catch{}
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
 await page.goto(base+'highfly/world-forge-3d.html?hfqa=1',{waitUntil:'domcontentloaded',timeout:35000});
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
  console.error('[P528 CHROME STATE AFTER 35s]',JSON.stringify({trace,errors,serverLogs:serverLogs.slice(-600)}).slice(0,6000));
  await Promise.race([page.screenshot({path:'p528-editor-3d-smoke.png',fullPage:true}),delay(2400)]);
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
 await page.screenshot({path:'p528-editor-3d-smoke.png',fullPage:true});
 console.log('[P528 THREE.JS BROWSER SMOKE]',JSON.stringify(state));
 if(state.phase!=='listo'||!state.canvas||state.catalog<4||
    !state.entries.some(s=>s.includes('Construcciones originales 3D')))
   throw Error('Native 3D scene did not finish: '+JSON.stringify({state,errors}).slice(0,2900));

 // User-reported failure: KayKit preview shows, but no building is placed; TEST actual click.
 const first=await page.evaluate(()=>{
  const qa=window.__hfWorldForge3DQA,points=[];
  for(let dx=-180;dx<=160;dx+=12)for(let dz=-150;dz<=120;dz+=12){
   const x=-512+dx,z=-70+dz;
   const a=qa.validPosition({type:'kaykit-home-a',x,z,scale:1,yaw:Math.PI/12,clearTrees:true});
   if(a.ok)points.push({x,z,dist:Math.hypot(dx,dz)});
  }
  points.sort((a,b)=>a.dist-b.dist);
  return points.slice(0,5);
 });
 if(!first.length)throw Error('NO buildable parcel near initial plaza; user bug persists');
 const spot=first[0];
 console.log('[P528 available build lot]',JSON.stringify(spot));
 await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.focus(x,z,64),spot);
 await delay(300);
 const tab=await page.$('#cats button[data-cat="Edificios"]');
 if(!tab)throw Error('KayKit FREE category not accessible');
 await tab.click();
 const catalog=await page.evaluate(()=>[...document.querySelectorAll('#catalog button')].map(x=>x.textContent.trim()));
 if(catalog.length!==16||catalog.some(x=>/Gremio|Casa medieval$|Granero|Almacén/.test(x)))
  throw Error('The main buildings catalog still contains old generic boxes: '+JSON.stringify(catalog));
 const house=await page.evaluate(()=>{const b=[...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('Casa A'));if(b)b.click();return !!b;});
 if(!house)throw Error('KayKit house missing from editable catalog');
 await page.waitForFunction(()=>window.__hfWorldForge3DQA?.ready('kaykit-home-a'),{timeout:30000});
 await page.click('#rot-right'); // Age: rotate the complete prefab BEFORE placement
 await delay(100);
 const screen=await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.point(x,z),spot);
 if(!screen.visible)throw Error('Buildable ground not visible to camera: '+JSON.stringify(screen));
 await page.mouse.move(screen.x,screen.y);
 await page.mouse.down();await page.mouse.up();
 await delay(900);
 const placed=await page.evaluate(()=>window.__hfWorldForge3DQA.objects());
 if(!placed.some(x=>x.type==='kaykit-home-a'&&x.clearTrees===true&&Math.abs(x.yaw-Math.PI/12)<.01))
  throw Error('KayKit preview did NOT commit on tap release! '+JSON.stringify({spot,screen,placed}));
 const evidence=await page.evaluate(()=>{
  const entry=window.__hfWorldForge3DQA.objects().find(x=>x.type==='kaykit-home-a');
  return window.__hfWorldForge3DQA.inspect(entry?.id);
 });
 if(!evidence||evidence.foundation!==1||evidence.meshes<2||evidence.children<2)
  throw Error('House was not a complete 3D prefab with stone foundation: '+JSON.stringify(evidence));
 console.log('[P528 FULL PREFAB MODEL]',JSON.stringify(evidence));
 console.log('[P528 KAYKIT TAP DROP]',placed.length,'building on world');

 await page.evaluate(()=>{const b=[...document.querySelectorAll('#cats button')].find(e=>e.dataset.cat==='Pisos');b?.click();});
 const floorChoice=await page.evaluate(()=>{const b=[...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('plaza'));b?.click();return !!b;});
 if(!floorChoice)throw Error('Continuar plaza paving tool missing');
 await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.focus(x+28,z+12,58),spot);
 await delay(200);
 const start=await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.point(x+20,z+12),spot);
 const end=await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.point(x+28,z+12),spot);
 if(!start.visible||!end.visible)throw Error('Paving route outside view');
 await page.mouse.move(start.x,start.y);await page.mouse.down();
 await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();await delay(350);
 const floor=await page.evaluate(()=>window.__hfWorldForge3DQA.objects().filter(o=>o.type==='floor-stone'));
 if(floor.length<2)throw Error('Floor drag brush did NOT paint continuous path: '+JSON.stringify({start,end,floor}));
 console.log('[P528 ANDROID-SAFE PAVING]',floor.length,'4m pieces');
 await page.screenshot({path:'p528-editor-3d-smoke.png',fullPage:true});

 // P5.2.8 acceptance: opt-in complete village must persist fully editable JSON.
 await page.evaluate(()=>{
  window.confirm=()=>true;
  const b=document.querySelector('#preset-village');
  if(!b)throw Error('P528 village button missing');
  b.click();
 });
 try{
  await page.waitForFunction(()=>window.__hfWorldForge3DQA?.objects().some(o=>o.id.startsWith('hf-p528-')),
   {timeout:60000});
 }catch{
  const state=await page.evaluate(()=>({
   status:document.querySelector('#status')?.textContent,
   health:window.__highfly3DEditorHealth,
   objects:window.__hfWorldForge3DQA?.objects().slice(-12)
  }));
  throw Error('Village preset was not committed: '+JSON.stringify(state).slice(0,2200));
 }
 const village=await page.evaluate(()=>({
  objects:window.__hfWorldForge3DQA.objects().filter(o=>o.id.startsWith('hf-p528-')),
  status:document.querySelector('#status')?.textContent
 }));
 const houses=village.objects.filter(o=>o.type.startsWith('kaykit-'));
 const stones=village.objects.filter(o=>o.type==='floor-stone');
 if(houses.length<3||stones.length<40||
  !village.objects.some(o=>o.type.startsWith('village-')))
  throw Error('Village is incomplete: '+JSON.stringify({
   houses:houses.length,stones:stones.length,status:village.status}));
 console.log('[P528 VILLAGE COMMITTED]',houses.length,'buildings,',stones.length,
  'paved pieces,',village.objects.length,'3D editable items');
 await page.screenshot({path:'p528-village-editor-smoke.png',fullPage:true});
 console.log('PASS: genuine Unsung plaza, preserved existing design, complete KayKit buildings and original highfly village décor');
}catch(e){console.error('[P528 VISUAL SMOKE FAILED]',String(e),serverLogs.slice(-500));throw e}
finally{await browser?.close();vite.kill('SIGTERM');}
