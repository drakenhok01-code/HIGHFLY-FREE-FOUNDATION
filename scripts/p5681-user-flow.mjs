import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1,hasTouch:true,isMobile:true,userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'});
const result={},errors=[];page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/?hfqa=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__hfP555Regions?.qaBoat&&window.__game?.input?.highflyTouch&&document.querySelector('.hf-release')?.textContent==='P5.6.8.1',{},{timeout:600000});
 await page.evaluate(()=>{const g=window.__game;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'})});
 await page.evaluate(()=>window.__hfP555Regions.open(3,true));await page.waitForFunction(()=>window.__hfP555Regions.active===3&&!window.__hfP555Regions.busy,{},{timeout:600000});
 result.hud=await page.evaluate(()=>{const g=window.__game,p=g.player,t=g.input.highflyTouch,w=p.world;const save=p.pos.clone(),yaw=p.yaw,oldGround=w.groundHeight,oldWater=w.waterLevel,oldFloor=w.floorBelow,oldResolve=w.resolveCapsule;
 const input=(x=0,y=0)=>({pressed:new Set(t.pressed),held:new Set(t.held),move:{x,y},look:{x:0,y:0},zoom:0});const fire=(sel,kind,id)=>document.querySelector(sel).dispatchEvent(new PointerEvent(kind,{pointerId:id,pointerType:'touch',bubbles:true,cancelable:true,clientX:20,clientY:20}));
 const update=(x=0,y=0)=>{p.update(.05,input(x,y),0);t.pressed.clear()};
 try{w.groundHeight=()=>0;w.waterLevel=()=>-Infinity;w.floorBelow=()=>0;w.resolveCapsule=()=>false;p.spawn(0,0,0,0);p.stamina=p.staminaMax;p.grounded=true;
 fire('.flight','pointerdown',51);update();fire('.flight','pointerup',51);const launch=p.state==='hf_glide';
 fire('.jump','pointerdown',52);const y0=p.pos.y;for(let i=0;i<24;i++)update(0,1);fire('.jump','pointerup',52);const rise=p.pos.y-y0;
 fire('.dash','pointerdown',53);const held=t.held.has('dash');for(let i=0;i<20;i++)update(0,1);const boost=p._hfGlide?.mode,speed=Math.hypot(p.vel.x,p.vel.z);fire('.dash','pointerup',53);const released=!t.held.has('dash');fire('.roll','pointerdown',54);update();fire('.roll','pointerup',54);
 return {launch,rise,held,boost,speed,released,closed:p.state==='move'};
 }finally{t.pressed.clear();t.held.clear();w.groundHeight=oldGround;w.waterLevel=oldWater;w.floorBelow=oldFloor;w.resolveCapsule=oldResolve;p.spawn(save.x,save.y,save.z,yaw)}});
 console.log('HF5681_TOUCH '+JSON.stringify(result.hud));if(!result.hud.launch||result.hud.rise<3||!result.hud.held||result.hud.boost!=='boost'||result.hud.speed<12||!result.hud.released||!result.hud.closed)throw Error('Mobile flight buttons failed');
 result.boat=await page.evaluate(()=>{const g=window.__game,p=g.player,a=window.__hfP555Regions,t=g.input.highflyTouch,b=a.qaBoat();if(!b)return {available:false};const save=p.pos.clone(),yaw=p.yaw;
 const update=(x=0,y=0)=>{p.update(.05,{pressed:new Set(t.pressed),held:new Set(t.held),move:{x,y},look:{x:0,y:0},zoom:0},p.yaw);t.pressed.clear()};const click=()=>{const el=t.root.querySelector('.context');for(const type of ['pointerdown','pointerup'])el.dispatchEvent(new PointerEvent(type,{pointerId:61,pointerType:'touch',bubbles:true,cancelable:true,clientX:30,clientY:30}))};
 try{p.spawn(b.x,b.y+.12,b.z,b.yaw);p.grounded=true;click();const command=t.pressed.has('boat_board');update();const piloted=p.state==='hf_boat';let moved=0;for(let k=0;k<4&&moved<1;k++){for(let i=0;i<45;i++)update(0,k%2===0?1:-1);const n=a.qaBoat();moved=Math.max(moved,Math.hypot(n.boatX-b.boatX,n.boatZ-b.boatZ));if(moved<1)for(let i=0;i<22;i++)update(1,0)}
 click();update();return {available:true,command,piloted,moved,exited:p.state==='move',solidAfter:a.qaBoat()?.solid};
 }finally{t.pressed.clear();t.held.clear();p.spawn(save.x,save.y,save.z,yaw)}});
 console.log('HF5681_BOAT '+JSON.stringify(result.boat));if(!result.boat.available||!result.boat.command||!result.boat.piloted||result.boat.moved<1||!result.boat.exited||!result.boat.solidAfter)throw Error('Puertaria boat actual movement failed');
 result.fish=await page.evaluate(()=>{const g=window.__game,p=g.player,a=window.__hfP555Regions,w=p.world,t=g.input.highflyTouch,b=a.qaBoat(),save=p.pos.clone(),yaw=p.yaw,prof=p._hfProfession,had=prof.tools.has('rod'),before=prof.inventory.fish??0;
 const update=()=>{p.update(.05,{pressed:new Set(t.pressed),held:new Set(),move:{x:0,y:0},look:{x:0,y:0},zoom:0},p.yaw);t.pressed.clear()};const click=()=>{const el=t.root.querySelector('.context');for(const type of ['pointerdown','pointerup'])el.dispatchEvent(new PointerEvent(type,{pointerId:62,pointerType:'touch',bubbles:true,cancelable:true,clientX:30,clientY:30}))};
 try{let point=null;outer:for(let d=4;d<=45;d+=2)for(let i=0;i<24;i++){const ang=i*Math.PI/12,x=b.x+Math.sin(ang)*d,z=b.z+Math.cos(ang)*d,h=w.groundHeight(x,z),water=w.waterLevel(x,z);if(!Number.isFinite(h)||Number.isFinite(water)&&water>h+.02)continue;p.spawn(x,h+.12,z,ang+Math.PI);p.grounded=true;if(!a.fishingWater(p)||a.nearBoat(p.pos))continue;click();const ok=t.pressed.has('fishing');t.pressed.clear();if(ok){point={x,z,h};break outer}}
 if(!point)return {point:null};prof.tools.delete('rod');click();update();const blocked=p.state!=='hf_action'&&(prof.inventory.fish??0)===before;prof.tools.add('rod');click();update();const started=p.state==='hf_action';for(let i=0;i<42;i++)update();const gain=(prof.inventory.fish??0)-before;return {point,blocked,started,gain,notice:p._hfNotice?.message};
 }finally{if(!had)prof.tools.delete('rod');t.pressed.clear();p.spawn(save.x,save.y,save.z,yaw)}});
 console.log('HF5681_FISH '+JSON.stringify(result.fish));if(!result.fish.point||!result.fish.blocked||!result.fish.started||result.fish.gain!==1)throw Error('Real shoreline fishing or tool gate failed');
 await page.screenshot({path:'p5681-puertaria.png',timeout:120000});result.ok=true;
}catch(e){errors.push(String(e));result.ok=false;console.error(e)}finally{await browser.close();result.errors=errors;fs.writeFileSync('p5681-user-flow.json',JSON.stringify(result,null,2));console.log('HF5681_USER_FLOW '+JSON.stringify(result))}
if(!result.ok||errors.length)process.exitCode=1;
