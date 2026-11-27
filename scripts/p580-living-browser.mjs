import {chromium} from 'playwright';
import fs from 'node:fs';
const expected={1:138,2:271,3:145,4:162,5:264,6:152,7:178,8:147};
const seeds=(process.env.HF_QA_SEEDS??'1,2').split(',').map(Number);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:900,height:420},deviceScaleFactor:1,hasTouch:true,isMobile:true});
const errors=[],rows=[];let forge=null,models=[];
page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',e)});
try{
 await page.goto('http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/play-p580.html?hfqa=1&hftime=dia',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__hfP555Regions?.qaJumpCenter&&window.__hfNativePopulation?.qaModels&&window.__hero?.diagnostics&&window.__hfCharacterForge,{},{timeout:600000});
 await page.evaluate(()=>{const g=window.__game;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'})});
 models=await page.evaluate(()=>window.__hfNativePopulation.qaModels());
 console.log('HF580_MODEL_DIAGNOSTICS '+JSON.stringify(await page.evaluate(()=>window.__hfNativePopulation.metrics())));
 if(models.length!==5||models.some(m=>m.profile.bones!==41||m.profile.headRatio<.17||m.profile.headRatio>.35))throw Error('Styled models invalid '+JSON.stringify(models));
 for(const seed of seeds){
  await page.evaluate(s=>window.__hfP555Regions.open(s,true),seed);
  await page.waitForFunction(s=>window.__hfP555Regions.active===s&&!window.__hfP555Regions.busy&&window.__hfNativePopulation.ready,seed,{timeout:600000});
  await page.evaluate(()=>{window.__hfNativePopulation.qaHour(9);window.__hfP555Regions.qaJumpCenter()});
  await page.waitForFunction(n=>window.__hfNativePopulation.metrics().population===n&&window.__hfNativePopulation.residents.some(v=>Number.isFinite(v.x)&&!v.indoors),expected[seed],{timeout:120000});
  const before=await page.evaluate(()=>window.__hfNativePopulation.residents);
  await page.evaluate(()=>window.__hfNativePopulation.qaHour(13));
  await page.waitForFunction(()=>window.__hfNativePopulation.metrics().hour===13,{},{timeout:60000});
  const moved=await page.evaluate(before=>window.__hfNativePopulation.residents.filter(n=>{const a=before.find(q=>q.id===n.id);return a&&Math.hypot(a.x-n.x,a.z-n.z)>.5}).length,before);
  if(moved<1)throw Error('No scheduled movement '+seed);
  const resident=await page.evaluate(()=>{const a=window.__hfNativePopulation.residents;return a.find(n=>n.stylist&&!n.indoors&&Number.isFinite(n.x))??a.find(n=>!n.indoors&&Number.isFinite(n.x))});
  await page.evaluate(n=>{const g=window.__game;g.player.spawn(n.x,n.y+.02,n.z,0);g.player.grounded=true},resident);
  await page.waitForFunction(()=>window.__hfNativePopulation.metrics().visible>0,{},{timeout:120000});
  const row=await page.evaluate(()=>{const a=window.__hfNativePopulation,integrity=window.__hfP555Regions.qaIntegrity();return {...a.metrics(),stylist:a.residents.find(n=>n.stylist),terrainMismatch:integrity.mismatch,waterNative:integrity.waterUsesNative}});
  row.moved=moved;
  if(row.population!==expected[seed]||row.visible<1||row.active>24||row.loadError||row.terrainMismatch!==0||!row.waterNative||!row.stylist)throw Error('Population runtime failure '+JSON.stringify(row));
  rows.push(row);console.log('HF580_QA_REGION '+JSON.stringify(row));await page.screenshot({path:'p580-region-'+seed+'.png',timeout:120000});
  if(seed===2){
   // Verify that the stylist's actual interaction opens the same creator used on first launch.
   let found=false;
   for(const hour of [9,10,11,12,13,14,15,16,17,18]){
    await page.evaluate(h=>window.__hfNativePopulation.qaHour(h),hour);
    await page.waitForFunction(h=>window.__hfNativePopulation.metrics().hour===h,h,{timeout:60000});
    const n=await page.evaluate(()=>window.__hfNativePopulation.residents.find(r=>r.stylist&&!r.indoors&&Number.isFinite(r.x)));
    if(!n)continue;
    await page.evaluate(n=>{const g=window.__game;g.player.spawn(n.x,n.y+.01,n.z,0);g.player.grounded=true},n);
    try{await page.waitForFunction(()=>{const a=window.__hfNativePopulation,p=window.__game.player.pos;return a.near(p)?.stylist===true},{},{timeout:15000});found=true;break}catch{}
   }
   if(!found)throw Error('Stylist not reachable');
   await page.evaluate(()=>{const g=window.__game;window.__hfP580Player=g.player;window.__hfP580Inventory=JSON.stringify(g.player._hfProfession?.inventory??{});if(!window.__hfNativePopulation.talk(g.player.pos))throw Error('Stylist dialogue failed')});
   await page.getByRole('button',{name:'Cambiar mi apariencia',exact:true}).click();
   await page.waitForFunction(()=>window.__hfCharacterForge.active,{},{timeout:30000});
   await page.locator('#hf-character-forge input[type=text]').fill('Prueba Fénix');
   await page.getByRole('button',{name:'Fénix',exact:true}).click();
   await page.getByRole('button',{name:'Guardar apariencia',exact:true}).click();
   forge=await page.evaluate(()=>{const g=window.__game,a=window.__hfCharacterForge;return {saved:a.saved,closed:!a.active,samePlayer:g.player===window.__hfP580Player,sameInventory:JSON.stringify(g.player._hfProfession?.inventory??{})===window.__hfP580Inventory,applied:window.__hero.appearance?.outfit===a.saved?.outfit,persisted:JSON.parse(localStorage.getItem('hf-p580-appearance-v1')||'null')?.name==='Prueba Fénix'}});
   if(!forge.saved||!forge.closed||!forge.samePlayer||!forge.sameInventory||!forge.applied||!forge.persisted)throw Error('Cosmetic save failed '+JSON.stringify(forge));
   console.log('HF580_FORGE '+JSON.stringify(forge));
  }
 }
}catch(e){errors.push(String(e));console.error(e);console.log('HF580_FAILURE_CONTEXT '+JSON.stringify(await page.evaluate(()=>({population:window.__hfNativePopulation?.metrics(),regions:window.__hfP555Regions?.metrics()})).catch(()=>null)))}finally{await browser.close();fs.writeFileSync('p580-qa-'+seeds[0]+'.json',JSON.stringify({rows,errors,forge,models},null,2));console.log('HF580_QA_SUMMARY '+JSON.stringify({tested:rows.length,expected:seeds.length,errors,forge,models:models.map(x=>({name:x.name,headRatio:x.profile.headRatio,clips:x.profile.clips}))}))}
if(rows.length!==seeds.length||errors.length||seeds.includes(2)&&!forge)process.exitCode=1;
