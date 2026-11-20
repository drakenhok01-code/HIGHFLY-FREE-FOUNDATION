/** HIGHFLY F0.14 premium menu browser acceptance on actual Unsung world.
 * Real WebGL + DOM, simulated Samsung S23 Ultra 915x412.
 * This is NOT a substitute for hardware multitouch validation.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const url='http://127.0.0.1:5177/qa-rpg.html';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5177','--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
let browser;
try{
 let online=false;
 for(let i=0;i<80;i++){if(server.exitCode!==null)throw Error(output);try{if((await fetch(url)).ok){online=true;break}}catch{}await delay(250);}
 assert.ok(online,'Vite launch failed '+output);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:1,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36'});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction('window.__hfRpgTest?.ready && window.__highflyRpg && window.__game',null,{timeout:15000});
 await page.waitForSelector('#hf-rpg-launch',{state:'visible'});
 await page.evaluate(()=>{const g=window.__game;g.input.lockPointer=()=>{};g.start();g.player.health=Math.max(1,g.player.healthMax-60);});
 await page.locator('#hf-rpg-launch').click();
 const opening=await page.evaluate(()=>({ok:window.__highflyRpg.opened,game:window.__game.state,harnessReady:window.__hfRpgTest?.ready,health:window.__game.player.health,maximum:window.__game.player.healthMax}));
 assert.ok(opening.ok&&opening.game==='menu'&&opening.harnessReady,'Premium RPG production menu mount failed '+JSON.stringify(opening));
 await page.waitForSelector('#hf-rpg .hf-rpg-character-layout');
 await page.waitForFunction(()=>document.querySelector('.hf-rpg-approved-logo')?.naturalWidth>0,null,{timeout:15000});
 assert.equal(await page.locator('#hf-rpg .hf-rpg-approved-logo').count(),1,'Approved HIGHFLY Phoenix logo missing');
 const artStatus=await page.evaluate(async()=>{const x=getComputedStyle(document.querySelector('#hf-rpg')).getPropertyValue('--hf-hero-art');const url=x.match(/url\(["']?([^"')]+)/)?.[1];if(!url)return {ok:false,x};const image=new Image();image.src=url;await image.decode();return {ok:image.naturalWidth>0,width:image.naturalWidth};});
 assert.ok(artStatus.ok,'Approved sanctuary background must be a REAL raster image, '+JSON.stringify(artStatus));

 const viewport=await page.evaluate(()=>{
  const outer=document.querySelector('#hf-rpg .hf-rpg-shell').getBoundingClientRect();
  const stage=document.querySelector('#hf-rpg .hf-rpg-hero-stage').getBoundingClientRect();
  return {screen:[innerWidth,innerHeight],outer:{x:outer.x,y:outer.y,right:outer.right,bottom:outer.bottom},stage:{w:stage.width,h:stage.height}};
 });
 assert.equal(viewport.screen[0],915);assert.equal(viewport.screen[1],412);
 assert.ok(viewport.stage.w>140&&viewport.stage.h>120,'Character stage does not fit S23 landscape '+JSON.stringify(viewport));
 assert.equal(await page.locator('#hf-rpg .hf-rpg-equip-slot').count(),10,'Character must show 10 separate equipment slots');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-stat-row').count(),0,'Attributes must NOT appear inside Character');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-hero-canvas').count(),1,'Real 3D portrait canvas must exist');
 assert.ok(await page.locator('#hf-rpg .hf-rpg-equip-slot').filter({hasText:'Mano derecha'}).count()>0);
 assert.ok(await page.locator('#hf-rpg .hf-rpg-equip-slot').filter({hasText:'Mano izquierda'}).count()>0);
 await page.locator('#hf-rpg [data-hf-action="turn:right"]').click();
 await page.locator('#hf-rpg [data-hf-action="turn:left"]').click();
 // True game equipment: remove the actual sword, return it to Bag, then equip it again.
 await page.locator('#hf-rpg [data-hf-equip-slot="right_hand"]').click();
 await page.locator('#hf-rpg [data-hf-action="ask-unequip:right_hand"]').click();
 await page.locator('#hf-rpg [data-hf-action="unequip:right_hand"]').click();
 let gear=await page.evaluate(()=>({eq:window.__highflyRpg.state.equipped.right_hand,
 qty:window.__highflyRpg.state.items.training_sword,mode:window.__game.player._hfGearCycle}));
 assert.deepEqual(gear,{eq:null,qty:1,mode:4},'Unequip must remove sword from real actor and return it to Bag');
 await page.screenshot({path:'qa-rpg-character.png'});
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="atributos"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-stat-row').count(),5,'STR AGI VIT PER INT must be visible');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="bolsa"]').click();
 await page.locator('#hf-rpg [data-hf-item="training_sword"]').click();
 await page.locator('#hf-rpg [data-hf-action="pick-equip:training_sword"]').click();
 await page.locator('#hf-rpg [data-hf-action="equip:right_hand:training_sword"]').click();
 const restoredSword=await page.evaluate(()=>({eq:window.__highflyRpg.state.equipped.right_hand,
 qty:window.__highflyRpg.state.items.training_sword,mode:window.__game.player._hfGearCycle}));
 assert.deepEqual(restoredSword,{eq:'training_sword',qty:0,mode:0},'Equip must restore visible real sword without duplicating the item');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="bolsa"]').click();
 assert.ok(await page.locator('#hf-rpg [data-hf-item="hp_potion"]').count()>0,'Health potion not shown in real bag');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-potion-approved').count()>=2,true,'Approved health and mana illustrations must replace procedural bottle icons');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-grid').getAttribute('data-hf-bag-capacity'),'36');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-grid > *').count(),36,'All 36 bag slots must render even when empty');
 assert.ok(await page.locator('#hf-rpg .hf-rpg-empty-slot').count()>20,'Empty inventory squares remain visible');
 await page.locator('#hf-rpg [data-hf-item="hp_potion"]').click();
 const previous=await page.evaluate(()=>({hp:window.__game.player.health,qty:window.__highflyRpg.state.items.hp_potion}));
 await page.locator('#hf-rpg [data-hf-action="use:hp_potion"]').click();
 const result=await page.evaluate(()=>({hp:window.__game.player.health,qty:window.__highflyRpg.state.items.hp_potion,stored:JSON.parse(localStorage.getItem('highfly-rpg-f014-v1'))?.items?.hp_potion}));
 assert.ok(result.hp>previous.hp,'Consumable did not heal real player');
 assert.equal(result.qty,previous.qty-1);assert.equal(result.stored,result.qty);
 await page.screenshot({path:'qa-rpg-bag.png'});
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="forja"]').click();
 await page.evaluate(()=>{window.__game.player._hfProfession.inventory.herb=2;window.__highflyRpg.render();});
 assert.equal(await page.locator('#hf-rpg [data-hf-action="craft:hp_potion"]').isEnabled(),true);
 const before=await page.evaluate(()=>window.__highflyRpg.state.items.hp_potion);
 await page.locator('#hf-rpg [data-hf-action="craft:hp_potion"]').click();
 const crafted=await page.evaluate(()=>({qty:window.__highflyRpg.state.items.hp_potion,herb:window.__game.player._hfProfession.inventory.herb}));
 assert.equal(crafted.qty,before+1,'crafted result not returned to bag');
 assert.equal(crafted.herb,0,'materials were not consumed');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="misiones"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-quest-row').count(),6,'Five active quests plus main objective, none hidden');
 await page.evaluate(()=>{const el=document.querySelector('#hf-rpg .hf-rpg-quest-list');el.scrollTop=64;});
 const questScrollBefore=await page.locator('#hf-rpg .hf-rpg-quest-list').evaluate(el=>el.scrollTop);
 await page.locator('#hf-rpg [data-hf-quest="q3"]').click();
 const questScrollAfter=await page.locator('#hf-rpg .hf-rpg-quest-list').evaluate(el=>el.scrollTop);
 assert.ok(Math.abs(questScrollBefore-questScrollAfter)<4,'Quest selection reset the mission scroll: '+questScrollBefore+' => '+questScrollAfter);
 assert.match(await page.locator('#hf-rpg .hf-rpg-quest-right').innerText(),/Encargo 3/,'Selected quest should update the right-hand illustrated card');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-quest-art img').count(),1,'One fantasy quest illustration exists');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="mapa"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-map-display').count(),1,'Map must render original world or clearly labeled illustration');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="bolsa"]').click();
 await page.evaluate(()=>{window.__highflyRpg.state.items.bag_upgrade=1;window.__highflyRpg.render();});
 await page.locator('#hf-rpg [data-hf-action="expand"]').first().click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-grid > *').count(),48,'Expansion must reveal twelve persistent slots');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="bolsa"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-grid > *').count(),48,'Bag capacity persists across tab changes');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="habilidades"]').click();
 assert.ok(await page.locator('#hf-rpg .hf-rpg-skill').count()>=4,'Actual skills missing');
 await page.locator('#hf-rpg [data-hf-skill="pulse"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-skill-equip-slot').count(),6,'Six RPG skill slots required');
 await page.locator('#hf-rpg [data-hf-skill="dash"]').click();
 await page.locator('#hf-rpg [data-hf-action="choose-skill"]').click();
 await page.locator('#hf-rpg [data-hf-skill-slot="4"]').click();
 const assigned=await page.evaluate(()=>window.__highflyRpg.state.skillSlots[4]);
 assert.equal(assigned,'dash','Tap a slot to bind a real ability');
 await page.locator('#hf-rpg [data-hf-skill="pulse"]').click();
 assert.match(await page.locator('#hf-rpg .hf-rpg-right-panel').innerText(),/Pulso/,'Skills selection renders detail');

 await page.locator('#hf-rpg [data-hf-action="close"]').first().click();
 assert.equal(await page.evaluate(()=>window.__game.state),'playing','closing menu must resume original game');
 assert.equal(await page.locator('#hf-rpg').isHidden(),true);
 assert.equal(errors.length,0,'Actual browser JS errors: '+errors.join(' | '));
 const report={opening,viewport,previous,result,crafted,errors,pass:true};
 fs.writeFileSync('qa-rpg-report.json',JSON.stringify(report,null,2));
 console.log('[HIGHFLY F0.14 PREMIUM ANDROID]',JSON.stringify(report));
}finally{await browser?.close();server.kill('SIGTERM');}
