import {chromium} from 'playwright';
import fs from 'node:fs';
const expected={1:138,2:271,3:145,4:162,5:264,6:152,7:178,8:147};
const seeds=(process.env.HF_QA_SEEDS??'1,2').split(',').map(Number);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:900,height:420},deviceScaleFactor:1,hasTouch:true,isMobile:true});
const errors=[],rows=[];let forge=null,models=[];
page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',e)});
try{
 await page.goto('http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/play-p581.html?hfqa=1&hftime=dia',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__hfP555Regions?.qaJumpCenter&&window.__hfNativePopulation?.qaModels&&window.__hero?.diagnostics&&window.__hfCharacterForge,{},{timeout:600000});
 await page.evaluate(()=>{const g=window.__game;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'})});
 models=await page.evaluate(()=>window.__hfNativePopulation.qaModels());
 console.log('HF581_MODEL_DIAGNOSTICS '+JSON.stringify(await page.evaluate(()=>window.__hfNativePopulation.metrics())));
 if(models.length!==5||models.some(m=>m.actual!==m.name||m.profile.bones!==41||m.profile.headRatio<.17||m.profile.headRatio>.35))throw Error('Styled models invalid '+JSON.stringify(models));
 for(const seed of seeds){
  await page.evaluate(s=>window.__hfP555Regions.open(s,true),seed);
  await page.waitForFunction(s=>window.__hfP555Regions.active===s&&!window.__hfP555Regions.busy&&window.__hfNativePopulation.ready,seed,{timeout:600000});
  await page.evaluate(()=>{window.__hfNativePopulation.qaHour(9);window.__hfP555Regions.qaJumpCenter()});
  await page.waitForFunction(n=>{const a=window.__hfNativePopulation;return a.metrics().population===n&&a.metrics().scanHour===9&&a.residents.some(v=>Number.isFinite(v.x)&&!v.indoors)},expected[seed],{timeout:120000});
  const before=await page.evaluate(()=>window.__hfNativePopulation.residents.filter(n=>Number.isFinite(n.x)&&Number.isFinite(n.z)));
  await page.evaluate(()=>window.__hfNativePopulation.qaHour(13));
  await page.waitForFunction(()=>window.__hfNativePopulation.metrics().scanHour===13,{},{timeout:60000});
  const moved=await page.evaluate(before=>window.__hfNativePopulation.residents.filter(n=>{const a=before.find(q=>q.id===n.id);return a&&Number.isFinite(n.x)&&Number.isFinite(n.z)&&Math.hypot(a.x-n.x,a.z-n.z)>.5}).length,before);
  if(moved<1)throw Error('No scheduled movement '+seed);
  const resident=await page.evaluate(()=>{const a=window.__hfNativePopulation.residents;return a.find(n=>n.stylist&&!n.indoors&&Number.isFinite(n.x))??a.find(n=>!n.indoors&&Number.isFinite(n.x))});
  await page.evaluate(n=>{const g=window.__game;g.player.spawn(n.x,n.y+.12,n.z-2.4,0);g.player.grounded=true;g.rig.yaw=0;g.rig.snap(g.player)},resident);
  await page.waitForFunction(()=>window.__hfNativePopulation.metrics().drawn>0,{},{timeout:120000});
  const row=await page.evaluate(()=>{const a=window.__hfNativePopulation,integrity=window.__hfP555Regions.qaIntegrity();return {...a.metrics(),stylist:a.residents.find(n=>n.stylist),terrainMismatch:integrity.mismatch,waterNative:integrity.waterUsesNative}});
  row.moved=moved;row.surface=await page.evaluate(()=>window.__hfP555Regions.metrics().surface);if(!row.surface?.clippedRoads||row.surface.roadTriangles<1)throw Error('Road conformity data absent');
  if(row.population!==expected[seed]||row.visible<1||row.drawn<1||row.active>24||row.queuedBodies>row.active||row.loadError||row.terrainMismatch!==0||!row.waterNative||!row.stylist)throw Error('Population runtime failure '+JSON.stringify(row));
  if(seed===3){
   await page.evaluate(()=>window.__hfNativePopulation.qaHour(22));
   await page.waitForFunction(()=>window.__hfNativePopulation.metrics().scanHour===22,{},{timeout:60000});
   row.night=await page.evaluate(()=>{const a=window.__hfNativePopulation;return {population:a.residents.length,indoors:a.residents.filter(n=>n.indoors).length,active:a.metrics().active,drawn:a.metrics().drawn}});
   if(row.night.population!==expected[seed]||row.night.indoors<1)throw Error('Night population missing');
   await page.screenshot({path:'p581-puertaria-night.png',timeout:120000});
   await page.evaluate(()=>window.__hfNativePopulation.qaHour(13));
  }
  rows.push(row);console.log('HF581_QA_REGION '+JSON.stringify(row));await page.screenshot({path:'p581-region-'+seed+'.png',timeout:120000});
  if(seed===2){
   // Verify that the stylist's actual interaction opens the same creator used on first launch.
   let found=false;
   for(const hour of [9,10,11,12,13,14,15,16,17,18]){
    await page.evaluate(h=>window.__hfNativePopulation.qaHour(h),hour);
    await page.waitForFunction(h=>window.__hfNativePopulation.metrics().scanHour===h,hour,{timeout:60000});
    const n=await page.evaluate(()=>window.__hfNativePopulation.residents.find(r=>r.stylist&&!r.indoors&&Number.isFinite(r.x)));
    if(!n)continue;
    await page.evaluate(n=>{const g=window.__game;g.player.spawn(n.x,n.y+.01,n.z,0);g.player.grounded=true},n);
    try{await page.waitForFunction(()=>{const a=window.__hfNativePopulation,p=window.__game.player.pos;return a.near(p)?.stylist===true},{},{timeout:15000});found=true;break}catch{}
   }
   if(!found)throw Error('Stylist not reachable');
   await page.evaluate(()=>{const g=window.__game;window.__hfP580Player=g.player;window.__hfP580Inventory=JSON.stringify(g.player._hfProfession?.inventory??{});if(!window.__hfNativePopulation.talk(g.player.pos))throw Error('Stylist dialogue failed')});
   const dialogue=page.locator('#hf-native-dialogue');
   await dialogue.getByRole('button',{name:'¿Cómo va tu trabajo?',exact:true}).click();
   const first=await dialogue.innerText();
   for(let k=0;k<3;k++){
    await dialogue.getByRole('button',{name:'Volver a conversar',exact:true}).click();
    await dialogue.getByRole('button',{name:'¿Cómo va tu trabajo?',exact:true}).click();
   }
   const repeat=await dialogue.innerText();
   if(!first.includes('Afinidad 2')||!repeat.includes('Afinidad 2'))throw Error('Repeated dialogue affinity changed: '+repeat);
   await page.getByRole('button',{name:'Cambiar mi apariencia',exact:true}).click();
   await page.waitForFunction(()=>window.__hfCharacterForge.active,{},{timeout:30000});
   const rect=await page.locator('#hf-character-forge .hf-forge-actions').boundingBox();
   if(!rect||rect.y<0||rect.y+rect.height>420)throw Error('Landscape creator controls clipped');
   await page.screenshot({path:'p581-forge-landscape.png',timeout:120000});
   await page.locator('#hf-character-forge input[type=text]').fill('Prueba Fénix');
   await page.getByRole('button',{name:'Fénix',exact:true}).click();
   await page.getByRole('button',{name:'Guardar apariencia',exact:true}).click();
   forge=await page.evaluate(()=>{const g=window.__game,a=window.__hfCharacterForge;return {saved:a.saved,closed:!a.active,samePlayer:g.player===window.__hfP580Player,sameInventory:JSON.stringify(g.player._hfProfession?.inventory??{})===window.__hfP580Inventory,applied:window.__hero.appearance?.outfit===a.saved?.outfit,persisted:JSON.parse(localStorage.getItem('hf-p580-appearance-v1')||'null')?.name==='Prueba Fénix'}});
   if(!forge.saved||!forge.closed||!forge.samePlayer||!forge.sameInventory||!forge.applied||!forge.persisted)throw Error('Cosmetic save failed '+JSON.stringify(forge));
   console.log('HF581_FORGE '+JSON.stringify(forge));
  }
 }
}catch(e){errors.push(String(e));console.error(e);console.log('HF581_FAILURE_CONTEXT '+JSON.stringify(await page.evaluate(()=>({population:window.__hfNativePopulation?.metrics(),regions:window.__hfP555Regions?.metrics()})).catch(()=>null)))}finally{await browser.close();fs.writeFileSync('p581-qa-'+seeds[0]+'.json',JSON.stringify({rows,errors,forge,models},null,2));console.log('HF581_QA_SUMMARY '+JSON.stringify({tested:rows.length,expected:seeds.length,errors,forge,models:models.map(x=>({name:x.name,actual:x.actual,headRatio:x.profile.headRatio,clips:x.profile.clips}))}))}
if(rows.length!==seeds.length||errors.length||seeds.includes(2)&&!forge)process.exitCode=1;
