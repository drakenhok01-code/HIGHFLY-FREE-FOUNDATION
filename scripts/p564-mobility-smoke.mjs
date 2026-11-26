import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:800,height:375},deviceScaleFactor:1,hasTouch:true,isMobile:true});
const errors=[],result={};page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',String(e))});
try{
 await page.goto('http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/?hfqa=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__hfP560Lab&&window.__hfP555Regions?.travelToBeacon,{},{timeout:600000});
 result.glide=await page.evaluate(()=>{
  const g=window.__game,p=g.player,w=p.world;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'});
  const a=window.__hfP555Regions;a.travelToBeacon(3);const start=p.pos.clone();w.stream(start.x,start.z,6);
  const floor=w.floorBelow(start.x,start.y+3,start.z,10);
  p.spawn(start.x,floor+30,start.z,p.yaw);p.grounded=false;p.airTime=1;p.vel.y=-10;p.fallStart=p.pos.y;p.invulnerable=0;
  const input=(press=[],x=0,y=0)=>({pressed:new Set(press),held:new Set(),move:{x,y},look:{x:0,y:0},zoom:0});
  const health=p.health,energy=p.stamina;p.update(.05,input(['jump']),p.yaw);
  const deployed=p.state==='hf_glide',deployedAt=p.pos.y;let ticks=0,lowest=0,braked=false;
  while(p.state==='hf_glide'&&ticks++<400){p.update(.05,input(),p.yaw);lowest=Math.min(lowest,p.vel.y);if(p.vel.y>=-5.2)braked=true;}
  return {deployed,deployedAt,braked,ticks,lowest,landed:p.grounded,state:p.state,healthBefore:health,healthAfter:p.health,energyBefore:energy,energyAfter:p.stamina,y:p.pos.y,floor};
 });
 console.log('HF564_GLIDE '+JSON.stringify(result.glide));
 if(!result.glide.deployed||!result.glide.braked||!result.glide.landed||result.glide.state!=='move'||result.glide.healthAfter<result.glide.healthBefore||result.glide.energyAfter>=result.glide.energyBefore)throw Error('Phoenix descent failed');
 result.air=await page.evaluate(()=>{const g=window.__game,p=g.player,w=p.world;const save=p.pos.clone(),yaw=p.yaw,oldGround=w.groundHeight,oldWater=w.waterLevel,oldFloor=w.floorBelow,oldResolve=w.resolveCapsule;const input=(press=[],held=[],y=0)=>({pressed:new Set(press),held:new Set(held),move:{x:0,y},look:{x:0,y:0},zoom:0});try{w.groundHeight=()=>0;w.waterLevel=()=>-Infinity;w.floorBelow=()=>0;w.resolveCapsule=()=>false;p.spawn(0,0,0,0);p.stamina=p.staminaMax;p.grounded=true;p.update(.05,input(['air_launch']),0);const launch=p.state==='hf_glide';const y0=p.pos.y;for(let i=0;i<25;i++)p.update(.05,input([],['jump'],1),0);const rise=p.pos.y-y0,ascend=p._hfGlide?.mode;for(let i=0;i<25;i++)p.update(.05,input([],['dash'],1),0);const boost=p._hfGlide?.mode,speed=Math.hypot(p.vel.x,p.vel.z);p.update(.05,input(['air_dive'],[],1),0);for(let i=0;i<6;i++)p.update(.05,input([],[],1),0);const dive=p._hfGlide?.mode;p.update(.05,input(['air_dive'],[],1),0);const recover=p._hfGlide?.mode;p.update(.05,input(['air_close']),0);return {launch,rise,ascend,boost,speed,dive,recover,closed:p.state==='move'}}finally{w.groundHeight=oldGround;w.waterLevel=oldWater;w.floorBelow=oldFloor;w.resolveCapsule=oldResolve;p.spawn(save.x,save.y,save.z,yaw)}});
 console.log('HF5681_AIR '+JSON.stringify(result.air));if(!result.air.launch||result.air.rise<3||result.air.ascend!=='ascend'||result.air.boost!=='boost'||result.air.speed<12||result.air.dive!=='dive'||result.air.recover!=='recover'||!result.air.closed)throw Error('Full air controller failed');
 result.climb=await page.evaluate(()=>{
  const g=window.__game,p=g.player,w=p.world;
  // Isolated deterministic wall fixture, exercise actual player controller,
  // not a replacement game. Restore world and spawn afterwards.
  const save=p.pos.clone(),yaw=p.yaw,oldGround=w.groundHeight,oldRay=w.raycast,oldResolve=w.resolveCapsule,oldFloor=w.floorBelow;
  const input=(press=[],x=0,y=0)=>({pressed:new Set(press),held:new Set(),move:{x,y},look:{x:0,y:0},zoom:0});
  try{
   w.groundHeight=(x,z)=>z>=0?20:0;
   w.raycast=(o,d,max)=>{if(d.z<=.01||o.y>=20)return max;const t=-o.z/d.z;return t>=0&&t<=max?t:max};
   w.resolveCapsule=()=>false;w.floorBelow=(x,y,z)=>z>=0?20:0;
   p.spawn(0,5,-.54,0);p.grounded=false;p.airTime=1;p.update(.05,input(['climb']),0);
   const entered=p.state==='hf_climb',y0=p.pos.y;for(let i=0;i<20;i++)p.update(.05,input([],0,1),0);const up=p.pos.y-y0,y1=p.pos.y;for(let i=0;i<20;i++)p.update(.05,input([],0,-1),0);const down=y1-p.pos.y;const after=p.state;
   p.update(.05,input(['climb']),0);return {entered,up,down,after,released:p.state==='move'};
  }finally{w.groundHeight=oldGround;w.raycast=oldRay;w.resolveCapsule=oldResolve;w.floorBelow=oldFloor;p.spawn(save.x,save.y,save.z,yaw);}
 });
 console.log('HF564_CLIMB '+JSON.stringify(result.climb));
 if(!result.climb.entered||result.climb.up<1||result.climb.down<1||!result.climb.released)throw Error('Bidirectional climb fixture failed');
 result.ok=true;
}catch(e){result.ok=false;errors.push(String(e));console.error(e)}finally{await browser.close();result.errors=errors;fs.writeFileSync('p564-mobility.json',JSON.stringify(result,null,2));console.log('HF564_MOBILITY '+JSON.stringify(result))}
if(!result.ok||errors.some(e=>/TypeError|ReferenceError|Shader Error/.test(e)))process.exitCode=1;
