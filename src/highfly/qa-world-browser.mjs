/** Actual world E2E. Native Unsung terrain, sky, materials, camera and KayKit mesh. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const url='http://127.0.0.1:5175/?hfchar=kaykit&hflook=armored';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5175','--strictPort'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=String(b));server.stderr.on('data',b=>output+=String(b));
let browser;
try{
 let online=false;
 for(let i=0;i<80;i++){
  if(server.exitCode!==null)throw Error('Vite exited '+output);
  try{if((await fetch(url)).ok){online=true;break}}catch{}
  await delay(250);
 }
 assert.ok(online,'Vite did not start '+output);
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1200,height:675},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,200))});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction('window.__highflyHeroStatus?.loaded && window.__game?.hero && !document.querySelector("#boot:not(.gone)")',null,{timeout:155000});
 const ready=await page.evaluate(()=>{window.__game.input.lockPointer=()=>{};window.__game.start();return {x:window.__game.player.pos.x,y:window.__game.player.pos.y,z:window.__game.player.pos.z}});
 await delay(2000);
 // All captures are performed at fixed scene time and camera with one pipeline.render.
 const details=await page.evaluate(()=>{
  const h=window.__game.hero,p=h.pipe;
  const meshes=[];h.root.traverse(o=>{if(o.isMesh)meshes.push([o,o.visible])});
  const bodyNames=h.bodyParts;
  const gl=p.renderer.getContext(),w=p.renderer.domElement.width,hh=p.renderer.domElement.height;
  const capture=()=>{
   p.render(0);
   const pix=new Uint8Array(w*hh*4);
   gl.readPixels(0,0,w,hh,gl.RGBA,gl.UNSIGNED_BYTE,pix);
   return pix;
  };
  for(const [mesh] of meshes)mesh.visible=bodyNames.has(mesh.name);
  h.trail.visible=false;
  const on=capture();
  for(const [mesh] of meshes)mesh.visible=mesh===h.sword;
  const off=capture();
  for(const [mesh,v] of meshes)mesh.visible=v;
  const all=capture();
  let diff=0,bodyZoneDiff=0;
  for(let i=0;i<on.length;i+=4){
   const d=Math.abs(on[i]-off[i])+Math.abs(on[i+1]-off[i+1])+Math.abs(on[i+2]-off[i+2]);
   if(d>40){diff++;const pixidx=i/4,x=pixidx%w,y=Math.floor(pixidx/w);if(x>w*.2&&x<w*.8&&y<hh*.8)bodyZoneDiff++;}
  }
  const bd=new (h.root.constructor.prototype.constructor===undefined ? Object : Object)();
  const body=get=>{const m=h.root.getObjectByName(get);return {visible:m?.visible,pos:m?.getWorldPosition?.(new p.camera.position.constructor())?.toArray?.(),isSkinned:m?.isSkinnedMesh}};
  return {diff,bodyZoneDiff,width:w,height:hh,heroStatus:window.__highflyHeroStatus,player:{pos:window.__game.player.pos.toArray(),viewY:window.__game.player.viewY},head:body('Knight_Head'),torso:body('Knight_Body'),foot:body('Knight_LegLeft'),camera:p.camera.position.toArray(),sw:all.slice(0,4).join(',')};
 });
 await page.screenshot({path:'qa-world-kaykit.png'});
 fs.writeFileSync('qa-world-kaykit-report.json',JSON.stringify({ready,details,errors},null,2));
 console.log('[HIGHFLY REAL WORLD KAYKIT]',JSON.stringify({ready,details,errors}));
 assert.ok(details.diff>180,'FULL WORLD GHOST BODY: skinned body does not affect image ('+details.diff+' pixels)');
 assert.ok(details.bodyZoneDiff>100,'FULL WORLD body is not visible in gameplay camera central region');
 assert.equal(errors.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)).length,0,'Real world errors');
}finally{await browser?.close();server.kill('SIGTERM');}
