// Controlled shadow A/B/C/D audit against existing P559 artifact. No production changes.
import {chromium} from 'playwright';
import fs from 'node:fs';
const seed=Number(process.env.HF_SHADOW_SEED??6),base=process.env.HF_QA_URL??'http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:800,height:375},deviceScaleFactor:1,hasTouch:true,isMobile:true});
const rows=[],errors=[];page.on('pageerror',e=>{errors.push(String(e));console.error('PAGEERROR',String(e))});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error('CONSOLE',m.text())}});
try{
 await page.goto(base+'?hfqa=1&hfquality=android&hfpx=css',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__game&&window.__hfP555Regions&&window.__pipe,{},{timeout:600000});
 await page.evaluate(()=>{const g=window.__game;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'});window.__hfP508Clock?.setDiagnostics('hidden')});
 await page.evaluate(async seed=>{const api=window.__hfP555Regions;await api.open(seed,true);if(api.active!==seed||!api.qaJumpCenter())throw Error('Centre unavailable');const t=performance.now();while(api.metrics().queued>0&&performance.now()-t<90000)await new Promise(requestAnimationFrame);if(api.metrics().queued>0)throw Error('Sector queue not settled')},seed);
 const baseline=await page.evaluate(()=>{const p=window.__pipe,s=p.shadows;return {enabled:s.enabled,soft:s.soft,rate:s.rate,splits:[...s.splits],size:s.size,output:[p.displayW,p.displayH],internal:[p.rw,p.rh],casters:s.twins.length,sourceCasters:s.twins.filter(([m])=>{for(let n=m;n;n=n.parent)if(n.name==='P555 streamed Guildhall region')return true;return false}).length}});
 console.log('HF_SHADOW_BASE '+JSON.stringify({seed,baseline}));
 // Rotate order across regions to reduce time-order bias.
 const modes=seed===8?['off','light','moderate','normal']:['normal','moderate','light','off'];
 for(const mode of modes){
  const result=await page.evaluate(async ({mode,baseline})=>{
   const p=window.__pipe,s=p.shadows,r=p.renderer,gl=r.getContext(),g=window.__game;
   const startPos=g.player.pos.clone(),startCam=p.camera.position.clone(),old=s.update,oldRender=r.render,oldPipe=p.render;
   const spec=mode==='normal'?{enabled:baseline.enabled,soft:baseline.soft,rate:baseline.rate,splits:baseline.splits}:mode==='moderate'?{enabled:true,soft:false,rate:2,splits:baseline.splits}:mode==='light'?{enabled:true,soft:false,rate:2,splits:[18,64]}:{enabled:false,soft:false,rate:2,splits:baseline.splits};
   const saved={enabled:s.enabled,soft:s.soft,rate:s.rate,splits:[...s.splits],fade:s.uniforms.uShadowInfo.value.z};
   const samples=[];let current=null,active=true;
   s._frame=0;
   s.update=function(...args){this.enabled=spec.enabled;this.soft=spec.soft;this.rate=spec.rate;this.splits=[...spec.splits];this.uniforms.uShadowInfo.value.z=spec.splits[1];return old.apply(this,args)};
   r.render=function(scene,cam){const a=this.info.render.triangles,b=this.info.render.calls;const ret=oldRender.call(this,scene,cam);if(current){const k=scene===s.scene?'cascade':scene===s.staticScene?'staticShadow':scene===p.scene?'opaque':scene===p.sceneT?'transparent':'other';current[k].triangles+=this.info.render.triangles-a;current[k].calls+=this.info.render.calls-b}return ret};
   p.render=function(...args){if(!active)return oldPipe.apply(this,args);const t=performance.now();current=Object.fromEntries(['cascade','staticShadow','opaque','transparent','other'].map(k=>[k,{triangles:0,calls:0}]));try{return oldPipe.apply(this,args)}finally{current.cpuSubmitMs=performance.now()-t;current.now=performance.now();samples.push(current);current=null}};
   try{const t=performance.now();while(samples.length<16&&performance.now()-t<120000)await new Promise(requestAnimationFrame)}finally{active=false;p.render=oldPipe;r.render=oldRender;s.update=old;Object.assign(s,{enabled:saved.enabled,soft:saved.soft,rate:saved.rate,splits:saved.splits});s.uniforms.uShadowInfo.value.z=saved.fade;s._frame=0}
   const measured=samples.slice(4),agg={},quant=(a,q)=>{const v=[...a].sort((x,y)=>x-y);return v[Math.max(0,Math.ceil(q*v.length)-1)]??null};
   for(const k of ['cascade','staticShadow','opaque','transparent','other'])agg[k]={meanTriangles:measured.reduce((v,x)=>v+x[k].triangles,0)/Math.max(1,measured.length),p95Triangles:quant(measured.map(x=>x[k].triangles),.95),meanCalls:measured.reduce((v,x)=>v+x[k].calls,0)/Math.max(1,measured.length)};
   const deltas=measured.slice(1).map((x,i)=>x.now-measured[i].now);
   return {mode,spec,frames:measured.length,ok:measured.length>=8&&g.player.pos.distanceTo(startPos)<.5,playerDrift:g.player.pos.distanceTo(startPos),cameraDrift:p.camera.position.distanceTo(startCam),cpuSubmitMedian:quant(measured.map(x=>x.cpuSubmitMs),.5),frameMedian:quant(deltas,.5),frameP95:quant(deltas,.95),passes:agg,output:[p.displayW,p.displayH],internal:[p.rw,p.rh],contextLost:gl.isContextLost(),memory:{geometries:r.info.memory.geometries,textures:r.info.memory.textures}};
  },{mode,baseline});
  rows.push(result);console.log('HF_SHADOW_RESULT '+JSON.stringify({seed,...result}));
 }
}catch(e){errors.push(String(e));console.error(e)}finally{await browser.close();fs.writeFileSync('p559-shadow-audit-'+seed+'.json',JSON.stringify({seed,rows,errors,device:'Chromium SwiftShader (software); no Android FPS claim',note:'Per render-call counter deltas isolate dynamic/static shadow vs opaque geometry. Normal is fixed Android graphics profile. Terrain baked shadow and cloud shadows are separate and remain.'},null,2))}
if(rows.length!==4||rows.some(r=>!r.ok||r.contextLost)||errors.some(e=>/TypeError|ReferenceError|shader error|WebGLProgram: Shader Error/i.test(e)))process.exitCode=1;
