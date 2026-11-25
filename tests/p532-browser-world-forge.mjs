import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import puppeteer from 'puppeteer-core';
const CHROME=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(f=>fs.existsSync(f));
if(!CHROME)throw Error('Chrome unavailable on CI runner: cannot claim visual 3D verification');
const base='http://127.0.0.1:5188/HIGHFLY-FREE-FOUNDATION/preview-p532/';
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5188','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p532/'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let serverLogs='';vite.stdout.on('data',x=>serverLogs+=x);vite.stderr.on('data',x=>serverLogs+=x);
let browser;
try{
 let up=false;
 for(let k=0;k<40;k++){
  try{const r=await fetch(base+'highfly/world-forge-3d.html');const html=await r.text();if(r.ok&&html.includes('WORLD FORGE 4.2 · P5.3.2')){up=true;break;}}catch{}
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
  await Promise.race([page.screenshot({path:'p532-editor-3d-smoke.png',fullPage:true}),delay(2400)]);
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
 await page.screenshot({path:'p532-editor-3d-smoke.png',fullPage:true});
 console.log('[P528 THREE.JS BROWSER SMOKE]',JSON.stringify(state));
 if(state.phase!=='listo'||!state.canvas||state.catalog<4||
    !state.entries.some(s=>s.includes('Construcciones originales 3D')))
   throw Error('Native 3D scene did not finish: '+JSON.stringify({state,errors}).slice(0,2900));

 // FREE trial must show complete, searchable categories, and never SOURCE import.
 const inventory=await page.evaluate(()=>({
  groups:[...document.querySelectorAll('#cats button')].map(b=>({name:b.dataset.cat,label:b.textContent})),
  sourceButtonVisible:getComputedStyle(document.querySelector('#import-source')).display!=='none'
 }));
 for(const cat of ['KayKit FREE · Edificios','KayKit FREE · Arquitectura',
    'KayKit FREE · Accesorios','KayKit FREE · Naturaleza','KayKit FREE · Hexágonos',
    'Unsung original','Unsung árboles'])
  if(!inventory.groups.some(x=>x.name===cat))throw Error('FREE category missing '+cat);
 if(inventory.sourceButtonVisible)throw Error('SOURCE import should be hidden in FREE-only lab');
 console.log('[P531 FREE CATALOG TABS]',JSON.stringify(inventory));
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
 const tab=await page.$('#cats button[data-cat="KayKit FREE · Edificios"]');
 if(!tab)throw Error('KayKit FREE category not accessible');
 await tab.click();
 const catalog=await page.evaluate(()=>[...document.querySelectorAll('#catalog button')].map(x=>x.textContent.trim()));
 if(catalog.length!==36||catalog.some(x=>/Gremio|Casa medieval$|Granero|Almacén/.test(x)))
  throw Error('The main buildings catalog still contains old generic boxes: '+JSON.stringify(catalog));
 const house=await page.evaluate(()=>{const b=[...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('Casa A')&&e.textContent.includes('rojo'));if(b)b.click();return !!b;});
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
 if(!evidence||evidence.meshes<1||evidence.children<1)
  throw Error('House was not a complete 3D prefab with stone foundation: '+JSON.stringify(evidence));
 console.log('[P528 FULL PREFAB MODEL]',JSON.stringify(evidence));
 // Real desktop clipboard: copy the SELECTED original house, then Ctrl+V
 // leaves a fully placeable ghost (same model, yaw, scale), not immediate
 // duplicate at some hard-coded world position.
 const firstHouse=placed.find(x=>x.type==='kaykit-home-a');
 const copy=await page.evaluate(id=>{
  const q=window.__hfWorldForge3DQA;
  q.select(id);const copied=q.copy();return {copied,clip:q.clipboard()};
 },firstHouse.id);
 if(!copy.copied||copy.clip?.type!=='kaykit-home-a')throw Error('Ctrl+C prefab memory failed');
 await page.keyboard.down('Control');await page.keyboard.press('v');await page.keyboard.up('Control');
 await delay(160);
 const pasteState=await page.evaluate(()=>window.__hfWorldForge3DQA.placement());
 if(pasteState.mode!=='place'||pasteState.chosen!=='kaykit-home-a'||Math.abs(pasteState.pendingYaw-Math.PI/12)>.01)
  throw Error('Ctrl+V did not arm real mouse positioning with original yaw '+JSON.stringify(pasteState));
 const pasted=await page.evaluate(({x,z})=>{
  const q=window.__hfWorldForge3DQA;
  for(let dx=-80;dx<=80;dx+=8)for(let dz=-80;dz<=80;dz+=8){
   const px=x+dx,pz=z+dz;
   if(Math.hypot(dx,dz)<25)continue;
   if(q.validPosition({type:'kaykit-home-a',x:px,z:pz,scale:1,yaw:Math.PI/12,clearTrees:true}).ok)return {x:px,z:pz};
  }return null;
 },spot);
 if(!pasted)throw Error('No valid plot to paste second original full house');
 await page.evaluate(o=>window.__hfWorldForge3DQA.focus(o.x,o.z,105),pasted);await delay(300);
 const pastedScreen=await page.evaluate(o=>window.__hfWorldForge3DQA.point(o.x,o.z),pasted);
 if(!pastedScreen.visible)throw Error('Copied house target offscreen');
 await page.mouse.click(pastedScreen.x,pastedScreen.y);await delay(600);
 if(!await page.evaluate(()=>window.__hfWorldForge3DQA.objects().filter(x=>x.type==='kaykit-home-a').length>=2))
  throw Error('Ctrl+V copied object did not commit to editable layout');
 console.log('[P532 CTRL+C/V HOUSE]',copy.clip,pasted);
 console.log('[P528 KAYKIT TAP DROP]',placed.length,'building on world');

 await page.evaluate(()=>{const b=[...document.querySelectorAll('#cats button')].find(e=>e.dataset.cat==='Pisos');b?.click();});
 const floorChoice=await page.evaluate(()=>{const b=[...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('plaza'));b?.click();return !!b;});
 if(!floorChoice)throw Error('Continuar plaza paving tool missing');
 // Paint in a *visible, testable* piece of open ground: the previous
 // test used a cliff-side point (y=-381px, outside the canvas) that looked
 // "visible" only because clip depth, not screen bounds, was checked.
 await page.evaluate(({x,z})=>window.__hfWorldForge3DQA.focus(x,z,125),spot);
 await delay(320);
 const road=await page.evaluate(({x,z})=>{
  const qa=window.__hfWorldForge3DQA,rect=document.querySelector('#canvas-holder canvas').getBoundingClientRect();
  const usable=p=>p.visible&&p.x>rect.left+16&&p.x<rect.right-16&&p.y>rect.top+16&&p.y<rect.bottom-16;
  for(const [dx,dz] of [[-16,16],[12,12],[-12,-12],[20,0],[0,20],[0,-20],[-20,0],[8,8]]){
   const sx=Math.round((x+dx)/4)*4,sz=Math.round((z+dz)/4)*4;
   const first=qa.point(sx,sz),last=qa.point(sx+8,sz);
   if(usable(first)&&usable(last))return {start:first,end:last,world:[sx,sz],rect:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom}};
  }
  return null;
 },spot);
 if(!road)throw Error('No on-screen 8m road segment near real village terrace');
 const {start,end}=road;
 console.log('[P530 VISIBLE ROAD]',JSON.stringify(road));
 await page.mouse.move(start.x,start.y);await page.mouse.down();
 await page.mouse.move(end.x,end.y,{steps:12});await page.mouse.up();await delay(350);
 const floor=await page.evaluate(()=>window.__hfWorldForge3DQA.objects().filter(o=>o.type==='floor-stone'));
 if(floor.length<2)throw Error('Floor drag brush did NOT paint continuous path: '+JSON.stringify({start,end,floor}));
 console.log('[P528 ANDROID-SAFE PAVING]',floor.length,'4m pieces');
 await page.screenshot({path:'p532-editor-3d-smoke.png',fullPage:true});

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

 // Exact-original Unsung assets: palette must expose genuine procedural props
 // rendered from exporter geometry, never an invented fallback box.
 const unsungButton=await page.$('#cats button[data-cat="Unsung original"]');
 if(!unsungButton)throw Error('Missing original Unsung catalog tab');
 await unsungButton.click();
 const unsungList=await page.evaluate(()=>[...document.querySelectorAll('#catalog button')].map(e=>e.textContent));
 if(unsungList.length!==12||!unsungList.some(x=>x.includes('Banco de Unsung')))
  throw Error('Native Unsung catalog incomplete: '+JSON.stringify(unsungList));
 await page.evaluate(()=>{
  const b=[...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('Banco de Unsung'));
  b?.click();
 });
 await page.waitForFunction(()=>window.__hfWorldForge3DQA?.ready('unsung-bench'),{timeout:30000});
 const benchSpot=await page.evaluate(()=>{
  const q=window.__hfWorldForge3DQA;
  for(let dx=-68;dx<=68;dx+=6)for(let dz=-70;dz<=70;dz+=6){
   const x=-512+dx,z=-70+dz;
   if(q.validPosition({type:'unsung-bench',x,z,yaw:0,scale:1,clearTrees:false}).ok)return {x,z};
  }
  return null;
 });
 if(!benchSpot)throw Error('No valid location for exact Unsung bench');
 await page.evaluate(o=>window.__hfWorldForge3DQA.focus(o.x,o.z,58),benchSpot);
 await delay(320);
 const benchScreen=await page.evaluate(o=>window.__hfWorldForge3DQA.point(o.x,o.z),benchSpot);
 if(!benchScreen.visible)throw Error('Original Unsung bench cannot be inspected');
 await page.mouse.click(benchScreen.x,benchScreen.y);await delay(500);
 const benchPlaced=await page.evaluate(()=>window.__hfWorldForge3DQA.objects().some(x=>x.type==='unsung-bench'));
 if(!benchPlaced)throw Error('Original Unsung MIT bench not placed in editable JSON');
 console.log('[P530 REAL UNSUNG PLACED]',benchSpot,benchPlaced);
 // Test a real FREE props mesh (barrel), not a generic fake box.
 await page.click('#cats button[data-cat="KayKit FREE · Accesorios"]');
 const props=await page.evaluate(()=>[...document.querySelectorAll('#catalog button')].map(e=>e.textContent));
 if(props.length!==26||!props.some(x=>x.includes('Barril')))
  throw Error('Missing 26 FREE accessories: '+JSON.stringify(props));
 await page.evaluate(()=>{
  const b=[...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('Barril'));b?.click();
 });
 await page.waitForFunction(()=>window.__hfWorldForge3DQA?.ready('free-barrel'),{timeout:30000});
 const barrelSpot=await page.evaluate(()=>{
  const q=window.__hfWorldForge3DQA;
  for(let dx=-26;dx<=26;dx+=4)for(let dz=-26;dz<=26;dz+=4){
   const x=-512+dx,z=-70+dz;
   if(q.validPosition({type:'free-barrel',x,z,yaw:0,scale:1,clearTrees:false}).ok)return {x,z};
  }return null;
 });
 if(!barrelSpot)throw Error('No valid spot for official KayKit FREE barrel');
 await page.evaluate(o=>window.__hfWorldForge3DQA.focus(o.x,o.z,64),barrelSpot);
 await delay(220);
 const barrelScreen=await page.evaluate(o=>window.__hfWorldForge3DQA.point(o.x,o.z),barrelSpot);
 if(!barrelScreen.visible)throw Error('FREE barrel spot not visible');
 await page.mouse.click(barrelScreen.x,barrelScreen.y);await delay(450);
 if(!await page.evaluate(()=>window.__hfWorldForge3DQA.objects().some(x=>x.type==='free-barrel')))
  throw Error('Official KayKit FREE prop not saved');

 // Six actual Unsung treegen species are independently editable in the same 3D scene.
 await page.click('#cats button[data-cat="Unsung árboles"]');
 const floraList=await page.evaluate(()=>[...document.querySelectorAll('#catalog button')].map(e=>e.textContent));
 if(floraList.length!==6||!floraList.some(x=>x.includes('Cerezo rosa')))
  throw Error('Missing genuine Unsung procedural forest: '+JSON.stringify(floraList));
 await page.evaluate(()=>{
  [...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('Cerezo rosa'))?.click();
 });
 await page.waitForFunction(()=>window.__hfWorldForge3DQA?.ready('unsung-tree-blossom'),{timeout:30000});
 const floraSpot=await page.evaluate(()=>{
  const q=window.__hfWorldForge3DQA;
  for(let dx=-80;dx<=80;dx+=8)for(let dz=-80;dz<=80;dz+=8){
   const x=-512+dx,z=-70+dz;
   if(q.validPosition({type:'unsung-tree-blossom',x,z,yaw:0,scale:1,clearTrees:false}).ok)return {x,z};
  }return null;
 });
 if(!floraSpot)throw Error('No valid Unsung blossom plot');
 await page.evaluate(o=>window.__hfWorldForge3DQA.focus(o.x,o.z,88),floraSpot);await delay(220);
 const floraScreen=await page.evaluate(o=>window.__hfWorldForge3DQA.point(o.x,o.z),floraSpot);
 if(!floraScreen.visible)throw Error('Native Unsung blossom not visible in test');
 await page.mouse.click(floraScreen.x,floraScreen.y);await delay(400);
 const preserved=await page.evaluate(()=>({
  free:window.__hfWorldForge3DQA.objects().some(x=>x.type==='free-barrel'),
  tree:window.__hfWorldForge3DQA.objects().some(x=>x.type==='unsung-tree-blossom'),
  old:window.__hfWorldForge3DQA.objects().some(x=>x.type==='kaykit-home-a')
 }));
 if(!preserved.free||!preserved.tree||!preserved.old)
  throw Error('FREE/RPG edit JSON lost a model: '+JSON.stringify(preserved));
 console.log('[P531 FREE + NATIVE UNSUNG SAVED]',JSON.stringify(preserved));

 // Additional Quaternius models are accepted only when the CC0 GLB really loads,
 // and public HIGHFLY fountain must persist as its own original 3D prefab.
 const pageTags=await page.evaluate(()=>[...document.querySelectorAll('#cats button')].map(x=>x.dataset.cat));
 for(const cat of ['Quaternius · Edificios','Quaternius · Accesorios','Quaternius · Naturaleza','Urbanismo HIGHFLY'])
  if(!pageTags.includes(cat))throw Error('Missing public-only expansion tab '+cat);
 await page.click('#cats button[data-cat="Quaternius · Naturaleza"]');
 await page.evaluate(()=>{
  [...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('Arbusto con flores'))?.click();
 });
 await page.waitForFunction(()=>window.__hfWorldForge3DQA?.ready('qcc0-bush_flowers')||
  window.__hfWorldForge3DQA?.error('qcc0-bush_flowers'),{timeout:20000});
 const qload=await page.evaluate(()=>({
  ready:window.__hfWorldForge3DQA?.ready('qcc0-bush_flowers'),
  failure:window.__hfWorldForge3DQA?.error('qcc0-bush_flowers'),
  status:document.querySelector('#status')?.textContent,
  diag:window.__highfly3DEditorHealth?.lines?.slice(-6)
 }));
 if(!qload.ready)throw Error('Actual Quaternius meshopt GLB unable to load: '+JSON.stringify({qload,errors}).slice(0,3900));
 const qspot=await page.evaluate(()=>{
  const q=window.__hfWorldForge3DQA;
  for(let dx=-66;dx<=66;dx+=6)for(let dz=-66;dz<=66;dz+=6){
   const x=-512+dx,z=-70+dz;
   if(q.validPosition({type:'qcc0-bush_flowers',x,z,yaw:0,scale:1,clearTrees:false}).ok)return {x,z};
  }return null;
 });
 if(!qspot)throw Error('No valid original CC0 Quaternius bush plot');
 await page.evaluate(o=>window.__hfWorldForge3DQA.focus(o.x,o.z,88),qspot);await delay(200);
 const qscreen=await page.evaluate(o=>window.__hfWorldForge3DQA.point(o.x,o.z),qspot);
 if(!qscreen.visible)throw Error('Quaternius flower bush offscreen');
 await page.mouse.click(qscreen.x,qscreen.y);await delay(450);
 if(!await page.evaluate(()=>window.__hfWorldForge3DQA.objects().some(x=>x.type==='qcc0-bush_flowers')))
  throw Error('Quaternius CC0 bush GLB not saved');
 await page.click('#cats button[data-cat="Urbanismo HIGHFLY"]');
 await page.evaluate(()=>{
  [...document.querySelectorAll('#catalog button')].find(e=>e.textContent.includes('Fuente de piedra'))?.click();
 });
 const fountainSpot=await page.evaluate(()=>{
  const q=window.__hfWorldForge3DQA;
  for(let dx=-85;dx<=85;dx+=7)for(let dz=-85;dz<=85;dz+=7){
   const x=-512+dx,z=-70+dz;
   if(q.validPosition({type:'hf-fountain-stone',x,z,yaw:0,scale:1,clearTrees:false}).ok)return {x,z};
  }return null;
 });
 if(!fountainSpot)throw Error('No safe original fountain plot');
 await page.evaluate(o=>window.__hfWorldForge3DQA.focus(o.x,o.z,100),fountainSpot);await delay(200);
 const fscr=await page.evaluate(o=>window.__hfWorldForge3DQA.point(o.x,o.z),fountainSpot);
 if(!fscr.visible)throw Error('Fountain screen coordinates invalid');
 await page.mouse.click(fscr.x,fscr.y);await delay(400);
 const combined=await page.evaluate(()=>{
  const a=window.__hfWorldForge3DQA.objects();return {
   fountain:a.some(x=>x.type==='hf-fountain-stone'),
   quaternius:a.some(x=>x.type==='qcc0-bush_flowers'),
   unsung:a.some(x=>x.type==='unsung-tree-blossom'),
   houses:a.filter(x=>x.type==='kaykit-home-a').length
  };
 });
 if(!combined.fountain||!combined.quaternius||!combined.unsung||combined.houses<2)
  throw Error('P532 mixed editable original world incomplete '+JSON.stringify(combined));
 console.log('[P532 PUBLIC CC0 + UNSUNG + FOUNTAIN]',JSON.stringify(combined));
 await page.screenshot({path:'p532-village-editor-smoke.png',fullPage:true});
 console.log('PASS: genuine Unsung plaza, preserved existing design, complete KayKit buildings and original highfly village décor');
}catch(e){console.error('[P528 VISUAL SMOKE FAILED]',String(e),serverLogs.slice(-500));throw e}
finally{await browser?.close();vite.kill('SIGTERM');}
