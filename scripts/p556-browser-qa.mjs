// P558 browser smoke & walk test. Desktop SwiftShader is a functional test,
// never a benchmark for Samsung Adreno. Reports failures instead of inventing FPS.
import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.HF_QA_URL??'http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:800,height:375},deviceScaleFactor:1,hasTouch:true,isMobile:true});
const errors=[],rows=[];let baseline=null;const seeds=(process.env.HF_QA_SEEDS??'1,2,3,4,5,6,7,8').split(',').map(Number);page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
 await page.goto(base+'?hfdiag=full&hfqa=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__game&&window.__hfP555Regions&&window.__hfP508Clock,{},{timeout:240000});
 await page.evaluate(()=>{const g=window.__game;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'});window.__hfP508Clock.setDiagnostics('full')});
 baseline=await page.evaluate(async()=>{await new Promise(resolve=>{let n=0;function frame(){if(++n>=4)resolve();else requestAnimationFrame(frame)}requestAnimationFrame(frame)});return window.__hfP555Regions.metrics().opaque});console.log('HF558_BASELINE '+JSON.stringify(baseline));
 for(const seed of seeds){for(const zone of ['exterior','centro']){
  const result=await page.evaluate(async ({seed,zone})=>{
   const api=window.__hfP555Regions,g=window.__game,pipe=window.__pipe,from=performance.now();
   await api.open(seed,true);if(api.active!==seed)return {seed,zone,settled,triP95,triMax:tris.at(-1)??null,geometrySamples:tris.length,partsMax:parts,ok:false,reason:'Teleport failed',metrics:api.metrics()};if(zone==='centro'&&!api.qaJumpCenter())return {seed,zone,ok:false,reason:'No safe centre',metrics:api.metrics()};
   const settle=performance.now();await new Promise(resolve=>{function frame(){if(api.metrics().queued===0||performance.now()-settle>90000)resolve();else requestAnimationFrame(frame)}requestAnimationFrame(frame)});const settled=api.metrics().queued===0;
   const before=g.player.pos.clone(),inp=g.input,old=inp.update,frames=[],geometry=[],start=performance.now();let last=start;
   // Follow a free direction chosen at the safe arrival point.
   inp.update=()=>{inp.pressed=new Set();inp.held=new Set();inp.move.x=0;inp.move.y=1;inp.look.x=0;inp.look.y=0;inp.zoom=0;};
   try{await new Promise(resolve=>{function frame(t){frames.push(t-last);last=t;const opaque=api.metrics().opaque;if(opaque&&Number.isFinite(opaque.triangles))geometry.push(opaque);if(frames.length<32&&t-start<90000)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)})}finally{inp.update=old;inp.move.set?.(0,0);}
   const after=g.player.pos,elapsed=performance.now()-start,sorted=frames.slice(1).sort((a,b)=>a-b),mean=sorted.reduce((a,b)=>a+b,0)/Math.max(1,sorted.length);
   const distance=Math.hypot(after.x-before.x,after.z-before.z),regionMetrics=api.metrics(),tris=geometry.map(x=>x.triangles).sort((a,b)=>a-b),triP95=tris[Math.max(0,Math.ceil(tris.length*.95)-1)]??null,parts=geometry.reduce((a,x)=>{for(const [k,v] of Object.entries(x.parts??{})){a[k]??={calls:0,triangles:0};a[k].calls=Math.max(a[k].calls,v.calls);a[k].triangles=Math.max(a[k].triangles,v.triangles)}return a},{}),diag=document.getElementById('hf-p514-fps-mini');
   return {seed,zone,ok:Number.isFinite(distance)&&distance>.6&&sorted.length>=12,walkedMetres:distance,elapsed,frames:sorted.length,frameMean:mean,p95:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]??null,loadMs:api.metrics().loadMs,renderCalls:regionMetrics.opaque?.calls??null,triangles:regionMetrics.opaque?.triangles??null,metrics:regionMetrics,state:g.player.state,diagnostic:diag?.textContent,diagVisible:!!diag&&getComputedStyle(diag).display!=='none',wallElapsed:performance.now()-from};
  },{seed,zone});
  result.geometryBudget=Math.max(2500000,(baseline?.triangles??0)+1000000);result.geometryOk=result.settled&&result.geometrySamples>=12&&Number.isFinite(result.triP95)&&result.triP95<=result.geometryBudget;result.nativeForestOk=!!result.metrics?.forest?.trees;rows.push(result);console.log('HF558_WALK '+JSON.stringify(result));await page.screenshot({path:'qa-region-'+seed+'-'+zone+'.png',timeout:30000}).catch(()=>{});
 }}
}catch(e){errors.push(String(e));console.error(e)}finally{await browser.close();fs.writeFileSync('p556-browser-audit.json',JSON.stringify({device:'CI Chromium SwiftShader, NOT Galaxy S23',baseline,rows,errors,allWalked:rows.length===seeds.length*2&&rows.every(r=>r.ok&&r.diagVisible),note:'32-frame target, wait for visible sector queue, P95 opaque triangles across samples, component maxima; no mobile FPS claim'},null,2))}
if(rows.length!==seeds.length*2||rows.some(r=>!r.ok||!r.diagVisible||!r.geometryOk||!r.nativeForestOk||!(r.metrics?.lod?.generated>0))||errors.some(e=>/TypeError|ReferenceError|shader error|WebGLProgram: Shader Error/i.test(e)))process.exitCode=1;
