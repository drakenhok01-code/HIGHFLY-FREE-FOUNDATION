/** HIGHFLY P4.9: REAL Unsung world + KayKit NPC + 3 creature smoke.
 * Chromium mobile 915x412. No fake game engine, no localStorage mocks.
 * Hardware Android QA still required.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const url='http://127.0.0.1:5189/?hfchar=kaykit&hfqa=1&hfintro=1';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5189','--strictPort'],
 {cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
let browser;
try {
 let online=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error('Vite exited '+output);
  try{if((await fetch(url)).ok){online=true;break;}}catch{}
  await delay(250);
 }
 assert.ok(online,'Vite P4.9 start failed '+output);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36'});
 const page=await ctx.newPage();
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>window.__game?.world&&window.__highflyHunts&&window.__highflyRpg,
  null,{timeout:115000});
 await page.waitForFunction(()=>window.__highflyHunts.npcCount===3,null,{timeout:65000});
 const placement=await page.evaluate(()=>{
  const g=window.__game,h=window.__highflyHunts;
  g.input.lockPointer=()=>{};
  if(g.state!=='playing')g.start();
  g.cine=false;g.player.invulnerable=1000;
  const result={npcCount:h.npcCount,spots:{}};
  for(const [id,spot] of Object.entries(h.spots)){
   const point=spot.point;
   result.spots[id]={x:point.x,y:point.y,z:point.z,water:g.world.waterLevel(point.x,point.z),
    deltaHeight:Math.abs(g.world.groundHeight(point.x+2,point.z)-point.y)};
  }
  return result;
 });
 assert.equal(placement.npcCount,3,'3 real KayKit CC0 NPCs must load on game map');
 assert.deepEqual(Object.keys(placement.spots).sort(),['boar','crab','wolf']);
 for(const [id,p] of Object.entries(placement.spots)){
  assert.ok(Number.isFinite(p.y)&&p.deltaHeight<8,id+' must stand on real solid ground');
  assert.equal(Number.isFinite(p.water),false,id+' should not spawn underwater');
 }
 // Each native Unsung enemy group must spawn at its own spot, with native HP.
 for(const id of ['wolf','boar','crab']){
  await page.evaluate(id=>{
   const g=window.__game,spot=window.__highflyHunts.spots[id].point;
   g.player.spawn(spot.x,spot.y+.16,spot.z);
   g.player.invulnerable=1000;
  },id);
  await page.waitForFunction(id=>window.__game.enemies.list.some(e=>e.group==='hf49:'+id&&e.alive&&e.hp>0),
   id,{timeout:12000});
 }
 // Return to the wolf and close the exact NPC mission/kill/loot feedback loop.
 await page.evaluate(()=>{
  const g=window.__game,p=window.__highflyHunts.spots.wolf.point;
  g.player.spawn(p.x,p.y+.16,p.z);g.player.invulnerable=1000;
 });
 await page.waitForFunction(()=>window.__game.enemies.list.some(e=>e.group==='hf49:wolf'&&e.alive),null,{timeout:12000});
 assert.equal(await page.evaluate(()=>window.__highflyHunts.accept('wolf')),true);
 const wolfBefore=await page.evaluate(()=>window.__highflyHunts.state.totalXp);
 await page.evaluate(()=>{
  const g=window.__game,e=g.enemies.list.find(e=>e.group==='hf49:wolf'&&e.alive);
  if(!e)throw Error('No original HIGHFLY wolf entity');
  g.enemies.kill(e,g.player.pos.clone().set(0,0,0));
 });
 await page.waitForFunction(before=>window.__highflyHunts.state.totalXp>=before+12,wolfBefore,{timeout:10000});
 await page.waitForFunction(()=>window.__game.__hfP41WorldLoot?.drops?.some(d=>d.id==='wolf_pelt'),null,{timeout:10000});
 const data=await page.evaluate(()=>{
  const g=window.__game,h=window.__highflyHunts;
  return {npc:h.npcCount,level:h.state.level,xp:h.state.xp,totalXp:h.state.totalXp,
   mission:h.state.missions.wolf,dropIds:g.__hfP41WorldLoot?.drops?.map(d=>d.id),
   alive:h.activeCount,save:localStorage.getItem('highfly-hunts-p49-v1'),
   threeD:[...g.pipe.scene.children].filter(n=>n.name?.startsWith('HIGHFLY_KAYKIT_NPC_')).length};
 });
 fs.writeFileSync('qa-p49-hunts-report.json',JSON.stringify({placement,data,pageErrors},null,2));
 await page.screenshot({path:'qa-p49-hunts-mobile.png'});
 assert.equal(data.mission.status,'active');
 assert.equal(data.mission.count,1);
 assert.ok(data.dropIds.includes('wolf_pelt'));
 assert.equal(data.threeD,3,'KayKit NPCs should exist as real 3D assets, not images');
 assert.ok(data.alive<=9,'Three spots must not saturate world');
 assert.ok(data.save?.includes('wolf'));
 assert.deepEqual(pageErrors.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)),[],
  'Browser errors in P4.9');
 console.log('[HIGHFLY P4.9 REAL WORLD PASS]',JSON.stringify({placement,data,pageErrors}));
} finally {
 await browser?.close();
 server.kill('SIGTERM');
}
