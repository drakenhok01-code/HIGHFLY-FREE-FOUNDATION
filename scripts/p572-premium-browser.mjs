import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const result={ok:false,screens:[],rarities:[],errors:[]};
const grades=['Común','Poco común','Raro','Épico','Legendario','Mítico'],slugs=['comun','poco-comun','raro','epico','legendario','mitico'];
try{
const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'});
page.on('pageerror',e=>result.errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/?hfqa=1',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForFunction(()=>window.__highflyRpg&&window.__game?.player?._hfProfession&&document.querySelector('.hf-release')?.textContent==='P5.7.2',{},{timeout:600000});
await page.evaluate(grades=>{const g=window.__game,r=window.__highflyRpg,b=r.state;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'});
// isolated browser fixture only. No player save or production loot shortcuts.
b.slots=72;b.items.training_sword=6;b.items.hp_potion=4;b.items.mp_potion=2;
b.gearTraits.bag.training_sword=grades.map(rarity=>({rarity,plus:0}));
b.equipped.right_hand='training_sword';b.gearTraits.equipped.right_hand={rarity:'Épico',plus:0};
const inv=g.player._hfProfession.inventory;for(const id of ['stone','ore','ore_copper','ore_iron','ore_silver','wood','wolf_pelt','boar_tusk','crab_shell','fish_river','fish_coast','ingot_copper','ingot_iron','upgrade_stone','upgrade_stone_advanced'])inv[id]=2;
},grades);
const check=async(tab,width,height)=>{
 await page.setViewportSize({width,height});
 await page.evaluate(tab=>{const r=window.__highflyRpg;if(r.opened)r.close();r.open(tab);},tab);
 await page.waitForFunction(()=>[...document.querySelectorAll('#hf-rpg img.hf-user-icon')].every(i=>i.complete),{},{timeout:60000});
 const data=await page.evaluate(tab=>{
 const root=document.getElementById('hf-rpg'),rect=e=>e.getBoundingClientRect(),style=e=>getComputedStyle(e);
 const select={bolsa:'.hf-rpg-grid>.hf-rpg-item,.hf-rpg-detail-art[data-hf-rarity]',personaje:'.hf-rpg-equip-slot .hf-rpg-slot-art',oficios:'.hf-p42-prof-frame',forja:'.hf-rpg-recipe,.hf-rpg-ingredient,.hf-rpg-forge-result-art'}[tab];
 const rows=[...root.querySelectorAll(select)].map(e=>{const a=e.querySelector(':scope > .hf-rpg-art');if(!a)return null;
 const b=rect(a),p=rect(e),c=style(a);const img=a.tagName==='IMG';const embedded=img&&a.dataset.hfFrameArt==='p43';
 const exact=tab==='bolsa'||tab==='oficios'||tab==='personaje'||e.classList.contains('hf-rpg-forge-result-art');
 const center=exact?Math.abs((b.left+b.right-p.left-p.right)/2)<2.5&&Math.abs((b.top+b.bottom-p.top-p.bottom)/2)<2.5:true;
 return {id:a.dataset.hfArtId??e.dataset.hfItem??'',bounds:{art:[b.x,b.y,b.width,b.height],slot:[p.x,p.y,p.width,p.height]},src:img?a.getAttribute('src'):null,embedded,rarity:e.dataset.hfRarity??null,loaded:!img||a.naturalWidth>0,square:Math.abs(b.width-b.height)<2.1&&b.width>0,center,fit:b.left>=p.left-2.5&&b.right<=p.right+2.5&&b.top>=p.top-2.5&&b.bottom<=p.bottom+2.5,transform:c.transform,contain:!img||c.objectFit==='contain',one:e.querySelectorAll(':scope > .hf-rpg-art').length===1,original:!embedded||a.naturalWidth===256&&a.naturalHeight===256};
 }).filter(Boolean);
 const panel=root.querySelector('.hf-p42-professions'),right=panel?.lastElementChild;
 const panelFit=!panel||!right||rect(right).right<=rect(panel).right+2;
 const double=root.querySelectorAll('.hf-separated-art,.hf-art-frame,.hf-art-interior').length;
 const bad=rows.filter(x=>!x.loaded||!x.square||!x.center||!x.fit||x.transform!=='none'||!x.contain||!x.one||!x.original);
 return {tab,width:innerWidth,height:innerHeight,count:rows.length,double,panelFit,bad,rows};
 },tab);
 await page.screenshot({path:'p572-'+width+'x'+height+'-'+tab+'.png',timeout:120000});
 console.log('HF572_PANEL '+JSON.stringify({...data,rows:undefined}));
 result.screens.push({...data,rows:undefined});
 if(!data.count||data.double||!data.panelFit||data.bad.length)throw Error('Art layout failed '+tab+' '+JSON.stringify(data.bad));
 if(tab==='bolsa'&&width===915){
  const seen=data.rows.filter(x=>x.id==='item_training_sword'&&x.embedded).map(x=>x.src);
  result.rarities=slugs.filter(s=>seen.some(url=>url?.endsWith('sword__'+s+'.webp')));
  if(result.rarities.length!==6)throw Error('All six original sword rarity images not rendered '+JSON.stringify(seen));
  const items=data.rows.filter(x=>x.id.startsWith('item_'));if(items.some(x=>!x.embedded))throw Error('Inventory item missing original framed image '+JSON.stringify(items.filter(x=>!x.embedded)));
 }
};
for(const [width,height] of [[915,412],[800,375]])for(const tab of ['bolsa','personaje','oficios','forja']){try{await check(tab,width,height)}catch(e){result.errors.push(String(e));console.error('HF572_PANEL_ERROR '+String(e))}}
await page.evaluate(()=>window.__highflyRpg.close());
result.ok=result.errors.length===0;
}catch(e){result.errors.push(String(e));console.error(e)}finally{await browser.close();fs.writeFileSync('p572-premium-browser.json',JSON.stringify(result,null,2));console.log('HF572_SUMMARY '+JSON.stringify(result))}
if(!result.ok||result.errors.length)process.exitCode=1;
