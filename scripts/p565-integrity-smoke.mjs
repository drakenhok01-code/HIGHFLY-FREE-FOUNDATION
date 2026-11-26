import {chromium} from 'playwright';
import fs from 'node:fs';
const seeds=(process.env.HF_QA_SEEDS??'1,2,3,4').split(',').map(Number);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:800,height:375},deviceScaleFactor:1,hasTouch:true,isMobile:true,acceptDownloads:true});
const errors=[],rows=[];page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',String(e))});page.on('console',m=>{if(m.type()==='error'&&/shader|GL_INVALID|WebGL.*error|THREE.WebGLProgram/i.test(m.text())){errors.push(m.text());console.error(m.text())}});
try{
 await page.goto('http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/?hfqa=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__hfP560Lab?.version==='P565'&&window.__hfP555Regions?.qaIntegrity,{},{timeout:600000});
 await page.evaluate(()=>{const g=window.__game;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'})});
 for(const seed of seeds){
  await page.evaluate(s=>window.__hfP555Regions.open(s,true),seed);
  await page.waitForFunction(s=>window.__hfP555Regions.active===s&&!window.__hfP555Regions.busy,seed,{timeout:600000});
  await page.evaluate(()=>window.__hfP555Regions.qaJumpCenter());
  await page.waitForFunction(()=>window.__hfP555Regions.metrics().queued===0,{},{timeout:120000});
  // Render native shaders in each region; use several real RAF samples.
  await page.evaluate(()=>new Promise(resolve=>{let n=0;function tick(){if(++n>=5)resolve();else requestAnimationFrame(tick)}requestAnimationFrame(tick)}));
  const row=await page.evaluate(()=>{const a=window.__hfP555Regions,g=window.__game,lab=window.__hfP560Lab,q=a.qaIntegrity(),m=a.metrics(),bug=lab.markBug();return {...q,loadMs:m.loadMs,triangles:m.opaque?.triangles??null,bug,bugMarks:lab.bugMarks.length}});
  if(!row||row.seed!==seed||row.mismatch!==0||!row.waterUsesNative||!row.nativeCover||!row.materials.includes('P565_NATIVE_UNSUNG_REGION')||row.bug.region!==seed||row.bugMarks<1)throw Error('Region integrity failed '+JSON.stringify(row));
  // Test the seated controller against a source furniture anchor if available.
  if(row.seat){row.seatTest=await page.evaluate(s=>{const g=window.__game,p=g.player,w=g.world,a=window.__hfP555Regions,save=p.pos.clone(),yaw=p.yaw;const input=(press=[],x=0)=>({pressed:new Set(press),held:new Set(),move:{x,y:0},look:{x:0,y:0},zoom:0});try{p.spawn(s.x,s.ground,s.z,s.yaw);p.grounded=true;const found=a.nearSeat(p.pos);p.update(.05,input(['seat']),s.yaw);const seated=p.state==='hf_seated',anchor=p._hfSeat?.id;p.update(.05,input([],1),s.yaw);return {found:!!found,seated,anchor,released:p.state==='move'}}finally{p.spawn(save.x,save.y,save.z,yaw)}},row.seat);if(!row.seatTest.seated||!row.seatTest.released)throw Error('Seat controller failed '+seed)}
  console.log('HF565_REGION '+JSON.stringify(row));rows.push(row);await page.screenshot({path:'p565-region-'+seed+'.png'});
 }
}catch(e){errors.push(String(e));console.error(e)}finally{await browser.close();fs.writeFileSync('p565-integrity-'+seeds[0]+'.json',JSON.stringify({rows,errors},null,2));console.log('HF565_SUMMARY '+JSON.stringify({tested:rows.length,expected:seeds.length,errors}))}
if(rows.length!==seeds.length||errors.length)process.exitCode=1;
