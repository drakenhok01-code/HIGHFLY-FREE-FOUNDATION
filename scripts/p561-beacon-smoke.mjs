import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:800,height:375},deviceScaleFactor:1,hasTouch:true,isMobile:true,acceptDownloads:true});
const errors=[],result={};page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',String(e))});
try{
 await page.goto('http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/?hfqa=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__hfP560Lab&&window.__hfP555Regions?.travelToBeacon,{},{timeout:600000});
 result.landings=await page.evaluate(()=>{const g=window.__game,api=window.__hfP555Regions;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'});const rows=[];for(let seed=1;seed<=8;seed++){const ok=api.travelToBeacon(seed),b=api.beacons[seed],arrival=api.beaconArrival,pos=g.player.pos;rows.push({seed,ok,id:b.id,edgeMetres:b.edgeMetres,centerMetres:b.centerMetres,offset:Math.hypot(pos.x-b.x,pos.z-b.z),height:pos.y,arrival,active:api.active})}return rows});
 for(const row of result.landings)console.log('HF561_BEACON '+JSON.stringify(row));
 if(result.landings.some(x=>!x.ok||x.offset>4||!Number.isFinite(x.height)||x.active!==null))throw Error('One or more native beacon landings failed');
 await page.waitForFunction(()=>window.__hfP560Lab.count>=1,{},{timeout:180000});
 // QA-only synthetic approach to an exterior position, not a completed walk from pylon.
 result.approach=await page.evaluate(()=>{const api=window.__hfP555Regions,g=window.__game,p=api.regions.find(x=>x.seed===8),b=api.beacons[8],w=g.world;const edge=(q,x,z)=>Math.hypot(Math.max(q.bounds.minX-x,0,x-q.bounds.maxX),Math.max(q.bounds.minZ-z,0,z-q.bounds.maxZ));const candidates=[];
 for(const d of [350,250,150,80])for(let i=0;i<64;i++){const angle=i*Math.PI/32,x=p.x+Math.cos(angle)*((p.bounds.maxX-p.bounds.minX)/2+d),z=p.z+Math.sin(angle)*((p.bounds.maxZ-p.bounds.minZ)/2+d),dist=edge(p,x,z);if(dist<30||dist>550||api.regions.some(q=>q.seed!==8&&edge(q,x,z)<dist))continue;const h=window.__terrain.heightAt(x,z);if(h<1||!Number.isFinite(h))continue;const slope=Math.max(...[[5,0],[-5,0],[0,5],[0,-5]].map(([dx,dz])=>Math.abs(window.__terrain.heightAt(x+dx,z+dz)-h)));if(slope>2)continue;candidates.push({x,z,h,dist,toBeacon:Math.hypot(x-b.x,z-b.z)})}
 candidates.sort((a,b)=>a.toBeacon-b.toBeacon);const c=candidates[0];if(!c)throw Error('No exterior dry QA position');w.stream(c.x,c.z,6);const y=w.floorBelow(c.x,c.h+4,c.z,12);if(!Number.isFinite(y)||Math.abs(y-c.h)>3)throw Error('Invalid exterior floor');g.player.spawn(c.x,y+.12,c.z,g.player.yaw);g.player.setState('move');g.rig.snap(g.player);return {...c,y}});
 await page.waitForFunction(()=>window.__hfP555Regions.active===8&&!window.__hfP555Regions.busy,{},{timeout:600000});
 result.loaded=await page.evaluate(()=>{const a=window.__hfP555Regions,g=window.__game;return {active:a.active,pos:{x:g.player.pos.x,y:g.player.pos.y,z:g.player.pos.z},metrics:a.metrics(),lab:window.__hfP560Lab.latest}});
 if(Math.hypot(result.loaded.pos.x-result.approach.x,result.loaded.pos.z-result.approach.z)>4)throw Error('Approach caused unwanted teleport');
 console.log('HF561_APPROACH '+JSON.stringify({approach:result.approach,active:result.loaded.active,pos:result.loaded.pos,loadMs:result.loaded.metrics.loadMs}));
 result.ok=true;
}catch(e){result.ok=false;errors.push(String(e));console.error(e)}finally{await browser.close();result.errors=errors;fs.writeFileSync('p561-smoke.json',JSON.stringify(result,null,2));console.log('HF561_SMOKE '+JSON.stringify({ok:result.ok,landings:result.landings?.length,errors}))}
if(!result.ok||errors.some(e=>/TypeError|ReferenceError/.test(e)))process.exitCode=1;
