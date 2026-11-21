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
 const navUserImages=await page.locator('#hf-rpg .hf-rpg-nav .hf-user-nav-icon').evaluateAll(imgs=>imgs.map(i=>({src:i.src,loaded:i.complete&&i.naturalWidth===256})));
 assert.equal(navUserImages.length,9,'All nine tabs need real user-supplied icons');
 await page.locator('#hf-rpg .hf-rpg-nav .hf-user-nav-icon').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 assert.ok(navUserImages.every(x=>x.src.includes('/user-icons/navigation/')),'Navigation still using old assets: '+JSON.stringify(navUserImages));
 const ornaments=await page.evaluate(async()=>{const root=document.querySelector('#hf-rpg');const keys=['--hf-crest','--hf-wave-art','--hf-panel-ornament'];const result={};for(const key of keys){const v=root.style.getPropertyValue(key);const m=v.match(/url\(["']?([^"')]+)/);if(!m)throw Error('Ornament URL missing '+key);const i=new Image();i.src=m[1];await i.decode();result[key]=i.naturalWidth;}return result;});
 assert.ok(Object.values(ornaments).every(v=>v>0),'Phoenix ornate image resources not loaded: '+JSON.stringify(ornaments));
 const frameStyle=await page.evaluate(()=>getComputedStyle(document.querySelector('#hf-rpg .hf-rpg-panel')).backgroundImage);
 assert.doesNotMatch(frameStyle,/ui_gold_corners/,'Old corner ornament should be gone');
 const cleanFrame=await page.evaluate(()=>({panelBefore:getComputedStyle(document.querySelector('#hf-rpg .hf-rpg-panel'),'::before').display,panelAfter:getComputedStyle(document.querySelector('#hf-rpg .hf-rpg-panel'),'::after').display,footerBefore:getComputedStyle(document.querySelector('#hf-rpg .hf-rpg-footer'),'::before').display}));
 assert.deepEqual(cleanFrame,{panelBefore:'none',panelAfter:'none',footerBefore:'none'},'Decorations are still blocking menu contents');
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
 const equipmentFit=await page.evaluate(()=>[...document.querySelectorAll('#hf-rpg .hf-rpg-character-layout>.hf-rpg-left-panel,#hf-rpg .hf-rpg-character-layout>.hf-rpg-right-panel')].map(panel=>({scroll:panel.scrollHeight-panel.clientHeight,overflow:getComputedStyle(panel).overflowY,slots:[...panel.querySelectorAll('.hf-rpg-equip-slot')].map(slot=>{const a=slot.getBoundingClientRect(),b=panel.getBoundingClientRect();return {height:a.height,top:a.top-b.top,bottom:b.bottom-a.bottom};})})));
 assert.equal(equipmentFit.length,2,'Both gear panels must exist');
 for(const side of equipmentFit){assert.equal(side.overflow,'hidden','Equipment panels must not scroll: '+JSON.stringify(side));assert.ok(side.scroll<=2,'All five equipment slots must fit without scrolling: '+JSON.stringify(side));assert.ok(side.slots.length===5&&side.slots.every(v=>v.height>=25&&v.top>=0&&v.bottom>=-2),'Equipment slots clipped: '+JSON.stringify(side));}

 assert.equal(await page.locator('#hf-rpg .hf-rpg-stat-row').count(),0,'Attributes must NOT appear inside Character');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-hero-canvas').count(),1,'Real 3D portrait canvas must exist');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-weapon-tag').first().evaluate(el=>el.textContent.includes('Espada')),false,'Redundant weapon caption remains in 3D stage');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-turn-buttons button').count(),2,'Character rotation buttons must stay functional');
 assert.ok(await page.locator('#hf-rpg .hf-rpg-equip-slot').filter({hasText:'Mano derecha'}).count()>0);
 assert.ok(await page.locator('#hf-rpg .hf-rpg-equip-slot').filter({hasText:'Mano izquierda'}).count()>0);
 await page.locator('#hf-rpg [data-hf-action="turn:right"]').click();
 await page.locator('#hf-rpg [data-hf-action="turn:left"]').click();
 // True game equipment: remove the actual sword, return it to Bag, then equip it again.
 await page.locator('#hf-rpg [data-hf-equip-slot="right_hand"]').click();
 await page.locator('#hf-rpg [data-hf-action="ask-unequip:right_hand"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-system-shade[data-stage="confirm"]').count(),1,'Un-equip must open System modal');
 await page.screenshot({path:'qa-rpg-system-unequip.png'});
 const swordBefore=await page.evaluate(()=>({eq:window.__highflyRpg.state.equipped.right_hand,qty:window.__highflyRpg.state.items.training_sword??0}));
 await page.locator('#hf-rpg [data-hf-system="cancel"]').click();
 const swordAfterCancel=await page.evaluate(()=>({eq:window.__highflyRpg.state.equipped.right_hand,qty:window.__highflyRpg.state.items.training_sword??0}));
 assert.deepEqual(swordAfterCancel,swordBefore,'Cancelling System unequip must not modify inventory');
 await page.locator('#hf-rpg [data-hf-action="ask-unequip:right_hand"]').click();
 await page.locator('#hf-rpg [data-hf-system="confirm"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-system-shade[data-stage="result"]').count(),1);
 await page.locator('#hf-rpg [data-hf-system="dismiss"]').click();
 let gear=await page.evaluate(()=>({eq:window.__highflyRpg.state.equipped.right_hand,
 qty:window.__highflyRpg.state.items.training_sword,mode:window.__game.player._hfGearCycle}));
 assert.deepEqual(gear,{eq:null,qty:1,mode:4},'Unequip must remove sword from real actor and return it to Bag');
 await page.screenshot({path:'qa-rpg-character.png'});
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="atributos"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-stat-row').count(),5,'STR AGI VIT PER INT must be visible');
 await page.screenshot({path:'qa-rpg-attributes.png'});
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="bolsa"]').click();
 await page.locator('#hf-rpg [data-hf-item="training_sword"]').click();
 await page.locator('#hf-rpg [data-hf-action="pick-equip:training_sword"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-system-shade[data-stage="choose"]').count(),1,'Equipment slot selector must be a system dialog');
 await page.locator('#hf-rpg [data-hf-system-slot="right_hand"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-system-shade[data-stage="confirm"]').count(),1);
 await page.locator('#hf-rpg [data-hf-system="confirm"]').click();
 await page.locator('#hf-rpg [data-hf-system="dismiss"]').click();
 const restoredSword=await page.evaluate(()=>({eq:window.__highflyRpg.state.equipped.right_hand,
 qty:window.__highflyRpg.state.items.training_sword,mode:window.__game.player._hfGearCycle}));
 assert.deepEqual(restoredSword,{eq:'training_sword',qty:0,mode:0},'Equip must restore visible real sword without duplicating the item');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="bolsa"]').click();
 assert.ok(await page.locator('#hf-rpg [data-hf-item="hp_potion"]').count()>0,'Health potion not shown in real bag');
 assert.ok(await page.locator('#hf-rpg .hf-premium-icon[src$="/user-icons/items/hp_potion.webp"]').count()>0,'User HP potion icon missing');
 assert.ok(await page.locator('#hf-rpg .hf-premium-icon[src$="/user-icons/items/mp_potion.webp"]').count()>0,'User MP potion icon missing');
 const iconLoad=await page.locator('#hf-rpg .hf-premium-icon').evaluateAll(imgs=>({loaded:imgs.filter(x=>x.naturalWidth>0).length,total:imgs.length,allWebp:imgs.every(x=>x.src.endsWith('.webp'))}));
 assert.ok(iconLoad.loaded===iconLoad.total&&iconLoad.allWebp,'Item sprites must be fully loaded WebP: '+JSON.stringify(iconLoad));
 const packPaths=await page.locator('#hf-rpg .hf-user-icon').evaluateAll(imgs=>imgs.map(img=>img.getAttribute('src')));
 assert.ok(packPaths.every(x=>x.includes('/highfly/user-icons/')),'Some dynamic objects still point to legacy images');
 assert.ok(packPaths.length>=3,'Two visible potion assets plus selected detail must load from the user pack: '+JSON.stringify(packPaths));
 assert.equal(await page.locator('#hf-rpg .hf-rpg-grid').getAttribute('data-hf-bag-capacity'),'36');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-grid > *').count(),36,'All 36 bag slots must render even when empty');
 assert.ok(await page.locator('#hf-rpg .hf-rpg-empty-slot').count()>20,'Empty inventory squares remain visible');
 const activeFilter=await page.locator('#hf-rpg .hf-rpg-side-link.is-selected').count();
 assert.equal(activeFilter,1,'Exactly one bag category must be visually selected');
 await page.locator('#hf-rpg [data-hf-item="hp_potion"]').click();
 const previous=await page.evaluate(()=>({hp:window.__game.player.health,qty:window.__highflyRpg.state.items.hp_potion}));
 await page.locator('#hf-rpg [data-hf-action="use:hp_potion"]').click();
 const result=await page.evaluate(()=>({hp:window.__game.player.health,qty:window.__highflyRpg.state.items.hp_potion,stored:JSON.parse(localStorage.getItem('highfly-rpg-f014-v1'))?.items?.hp_potion}));
 assert.ok(result.hp>previous.hp,'Consumable did not heal real player');
 assert.equal(result.qty,previous.qty-1);assert.equal(result.stored,result.qty);
 await page.screenshot({path:'qa-rpg-bag.png'});
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="forja"]').click();
 await page.locator('#hf-rpg .hf-rpg-recipe .hf-premium-icon').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));
 await page.screenshot({path:'qa-rpg-forge.png'});
 const forgeSizes=await page.evaluate(()=>({recipe:document.querySelector('#hf-rpg .hf-rpg-recipe .hf-premium-icon')?.getBoundingClientRect().width,ingredient:document.querySelector('#hf-rpg .hf-rpg-ingredient .hf-premium-icon')?.getBoundingClientRect().width}));
 assert.ok(forgeSizes.recipe>=43&&forgeSizes.ingredient>=39,'Recipe/material icons remain too small: '+JSON.stringify(forgeSizes));
 assert.equal(await page.locator('#hf-rpg .hf-rpg-forge-layout > .hf-rpg-panel').count(),2,'Forge must not waste a third panel on material inventory');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-material-row').count(),0,'No redundant bag material list in Forge');
 await page.evaluate(()=>{window.__game.player._hfProfession.inventory.herb=2;window.__highflyRpg.render();});
 assert.equal(await page.locator('#hf-rpg [data-hf-action="craft:hp_potion"]').isEnabled(),true);
 const before=await page.evaluate(()=>window.__highflyRpg.state.items.hp_potion);
 await page.locator('#hf-rpg [data-hf-action="craft:hp_potion"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-system-shade[data-stage="confirm"]').count(),1,'Craft must request System confirmation');
 const beforeCancel=await page.evaluate(()=>({qty:window.__highflyRpg.state.items.hp_potion,herb:window.__game.player._hfProfession.inventory.herb}));
 await page.locator('#hf-rpg [data-hf-system="cancel"]').click();
 const afterCancel=await page.evaluate(()=>({qty:window.__highflyRpg.state.items.hp_potion,herb:window.__game.player._hfProfession.inventory.herb}));
 assert.deepEqual(afterCancel,beforeCancel,'Cancelling crafting must consume zero materials');
 await page.locator('#hf-rpg [data-hf-action="craft:hp_potion"]').click();
 await page.locator('#hf-rpg [data-hf-system="confirm"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-system-shade[data-stage="working"]').count(),1,'Craft progress must appear in the System UI');
 await page.screenshot({path:'qa-rpg-system-crafting.png'});
 await page.waitForSelector('#hf-rpg .hf-system-shade[data-stage="result"]',{timeout:5000});
 await page.screenshot({path:'qa-rpg-system-crafted.png'});
 const crafted=await page.evaluate(()=>({qty:window.__highflyRpg.state.items.hp_potion,herb:window.__game.player._hfProfession.inventory.herb}));
 await page.locator('#hf-rpg [data-hf-system="dismiss"]').click();
 assert.equal(crafted.qty,before+1,'crafted result not returned to bag');
 assert.equal(crafted.herb,0,'materials were not consumed');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="oficios"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-prof-card').count(),8);
 await page.screenshot({path:'qa-rpg-professions.png'});
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="misiones"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-quest-row').count(),6,'Five active quests plus main objective, none hidden');
 await page.evaluate(()=>{const el=document.querySelector('#hf-rpg .hf-rpg-quest-list');el.scrollTop=64;});
 const questScrollBefore=await page.locator('#hf-rpg .hf-rpg-quest-list').evaluate(el=>el.scrollTop);
 await page.locator('#hf-rpg [data-hf-quest="q3"]').click();
 const questScrollAfter=await page.locator('#hf-rpg .hf-rpg-quest-list').evaluate(el=>el.scrollTop);
 assert.ok(Math.abs(questScrollBefore-questScrollAfter)<4,'Quest selection reset the mission scroll: '+questScrollBefore+' => '+questScrollAfter);
 await page.screenshot({path:'qa-rpg-quests.png'});
 assert.match(await page.locator('#hf-rpg .hf-rpg-quest-right').innerText(),/Encargo 3/,'Selected quest should update the right-hand illustrated card');
 assert.equal(await page.locator('#hf-rpg .hf-rpg-quest-art img').count(),1,'One real mission scene exists');
 const missionPhoto=await page.locator('#hf-rpg .hf-rpg-quest-art img').evaluate(img=>({src:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight}));
 assert.ok(missionPhoto.src.endsWith('.webp')&&missionPhoto.width>=800&&missionPhoto.height>=400,'Mission artwork must load as high-detail raster: '+JSON.stringify(missionPhoto));
 assert.ok((await page.locator('#hf-rpg .hf-rpg-quest-art img').getAttribute('src')).includes('premium/quest_'),'Mission should use its own original art');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="mapa"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-map-display').count(),1,'Map must render original world or clearly labeled illustration');
 await page.screenshot({path:'qa-rpg-map.png'});
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="bolsa"]').click();
 await page.evaluate(()=>{window.__highflyRpg.state.items.bag_upgrade=1;window.__highflyRpg.render();});
 await page.locator('#hf-rpg [data-hf-action="expand"]').first().click();
 assert.equal(await page.locator('#hf-rpg .hf-system-shade[data-stage="confirm"]').count(),1,'Bag expansion must ask for a System decision');
 await page.locator('#hf-rpg [data-hf-system="confirm"]').click();
 const expansion=await page.evaluate(()=>({
  stage:document.querySelector('#hf-rpg .hf-system-shade')?.dataset.stage,
  message:document.querySelector('#hf-rpg .hf-system-card')?.innerText?.slice(0,360),
  slots:window.__highflyRpg.state.slots,
  expansionItems:window.__highflyRpg.state.items.bag_upgrade,
  buttons:[...document.querySelectorAll('#hf-rpg [data-hf-system]')].map(x=>x.dataset.hfSystem)
 }));
 assert.equal(expansion.stage,'result','Expansion System state did not settle: '+JSON.stringify(expansion)+' JS '+errors.join(' | '));
 await page.locator('#hf-rpg [data-hf-system="dismiss"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-grid > *').count(),48,'Expansion must reveal twelve persistent slots');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="bolsa"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-grid > *').count(),48,'Bag capacity persists across tab changes');
 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="habilidades"]').click();
 assert.ok(await page.locator('#hf-rpg .hf-rpg-skill').count()>=4,'Actual skills missing');
 await page.locator('#hf-rpg .hf-rpg-skill-glyph .hf-premium-icon').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));
 const alphaReframing=await page.locator('#hf-rpg .hf-rpg-skill-glyph .hf-premium-icon').first().evaluate(el=>getComputedStyle(el).transform);
 assert.equal(alphaReframing,'none','User skill icon already has its own frame and must never be zoomed/cropped');
 const actualSkillArt=await page.locator('#hf-rpg .hf-rpg-skill-glyph .hf-user-icon').evaluateAll(imgs=>imgs.map(x=>({src:x.src,w:x.naturalWidth,h:x.naturalHeight})));
 assert.equal(actualSkillArt.length,6,'Must show six real skill icons');
 assert.ok(actualSkillArt.every(x=>x.src.includes('/user-icons/skills/')&&x.w===256&&x.h===256),'Wrong skill icon dimensions or routes: '+JSON.stringify(actualSkillArt));
 await page.screenshot({path:'qa-rpg-skills.png'});
 const skillSize=await page.locator('#hf-rpg .hf-rpg-skill-glyph').first().evaluate(el=>el.getBoundingClientRect().width);
 assert.ok(skillSize>=43&&skillSize<=48,'Skill glyph must be moderately enlarged, not oversized: '+skillSize);
 await page.locator('#hf-rpg [data-hf-skill="pulse"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-rpg-skill-equip-slot').count(),6,'Six RPG skill slots required');
 await page.locator('#hf-rpg [data-hf-skill="dash"]').click();
 await page.locator('#hf-rpg [data-hf-action="choose-skill"]').click();
 await page.locator('#hf-rpg [data-hf-skill-slot="4"]').click();
 assert.equal(await page.locator('#hf-rpg .hf-system-shade[data-stage="confirm"]').count(),1,'Skill assignment asks the System');
 await page.locator('#hf-rpg [data-hf-system="confirm"]').click();
 await page.locator('#hf-rpg [data-hf-system="dismiss"]').click();
 const assigned=await page.evaluate(()=>window.__highflyRpg.state.skillSlots[4]);
 assert.equal(assigned,'dash','Tap a slot to bind a real ability');
 await page.locator('#hf-rpg [data-hf-skill="pulse"]').click();
 assert.match(await page.locator('#hf-rpg .hf-rpg-right-panel').innerText(),/Pulso/,'Skills selection renders detail');

 await page.locator('#hf-rpg .hf-rpg-nav [data-hf-tab="opciones"]').click();
 await page.screenshot({path:'qa-rpg-options.png'});
 await page.locator('#hf-rpg [data-hf-action="close"]').first().click();
 assert.equal(await page.evaluate(()=>window.__game.state),'playing','closing menu must resume original game');
 assert.equal(await page.locator('#hf-rpg').isHidden(),true);
 assert.equal(errors.length,0,'Actual browser JS errors: '+errors.join(' | '));
 const report={opening,viewport,previous,result,crafted,errors,pass:true};
 fs.writeFileSync('qa-rpg-report.json',JSON.stringify(report,null,2));
 console.log('[HIGHFLY F0.14 PREMIUM ANDROID]',JSON.stringify(report));
}finally{await browser?.close();server.kill('SIGTERM');}
