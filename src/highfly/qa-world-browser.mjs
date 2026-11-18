/** HIGHFLY — ACTUAL-world E2E, not isolated hero gallery.
 * Runs the real Unsung terrain, camera, depth/fog/multipass renderer with the
 * Android CPU skinned KayKit body active. Fails if removing body yields same frame.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const url='http://127.0.0.1:5175/?hfchar=kaykit&hfskin=cpu';
const server=spawn(process.execPath,
 ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5175','--strictPort'],
 {cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let output='';
server.stdout.on('data',b=>output+=String(b));
server.stderr.on('data',b=>output+=String(b));
let browser;
try {
 let online=false;
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error('Vite died: '+output.slice(-3000));
  try{if((await fetch(url)).ok){online=true;break;}}catch{}
  await delay(250);
 }
 assert.ok(online,'Vite never became available');
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader','--enable-webgl',
  '--enable-unsafe-swiftshader','--disable-dev-shm-usage','--no-sandbox'
 ]});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,200));});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
 try {
  await page.waitForFunction(()=>{
    const g=window.__game;
    return window.__highflyHeroStatus?.loaded===true&&!!g?.hero;
  },null,{timeout:140000});
 }catch(e){
  const state=await page.evaluate(()=>({
   boot:document.getElementById('boot')?.className??'already removed',
   loader:document.getElementById('boot')?.textContent?.slice(0,240),
   game:!!window.__game,
   hero:!!window.__game?.hero,
   status:window.__highflyHeroStatus??null,
   ready:document.readyState
  })).catch(err=>({evaluationError:String(err)}));
  console.log('[HIGHFLY WORLD LOAD DIAG]',JSON.stringify({state,errors}));
  fs.writeFileSync('qa-world-kaykit-report.json',JSON.stringify({failure:String(e),state,errors},null,2));
  await page.screenshot({path:'qa-world-kaykit.png',timeout:10000}).catch(()=>{});
  throw e;
 }
 const before=await page.evaluate(()=>{
  const g=window.__game;g.input.lockPointer=()=>{};g.start();
  return {pos:g.player.pos.toArray(),status:window.__highflyHeroStatus};
 });
 await delay(400);
 const report=await page.evaluate(()=>{
  const g=window.__game,h=g.hero,p=h.pipe;
  if(!h.cpuSkin?.parts?.length)throw Error('Android CPU skin was not installed');
  const originalMeshes=h.cpuSkin.parts;
  const names=originalMeshes.map(x=>x.mesh.name);
  if(names.length<6)throw Error('Not six skinned CPU parts: '+names);
  const width=p.renderer.domElement.width,height=p.renderer.domElement.height;
  const gl=p.renderer.getContext();
  // Force stable camera and disable TAA accumulation, but retain the WORLD
  // scene, its terrain depth buffer, fog and real tonemap for the comparison.
  p.taa.enabled=false;
  p.camera.updateMatrixWorld(true);
  const sample=()=>{
   for(let k=0;k<2;k++)p.render(0);
   const pixels=new Uint8Array(width*height*4);
   gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   return pixels;
  };
  h.trail.visible=false;
  const all=h.root.children;
  const meshes=[];h.root.traverse(o=>{if(o.isMesh)meshes.push([o,o.visible]);});
  // Only sword baseline, no body.
  for(const [o] of meshes)o.visible=o===h.sword;
  const sword=sample();
  // Restore all equipment and the six independently CPU-deformed body parts.
  for(const [o] of meshes)o.visible=(o===h.sword)||originalMeshes.some(x=>x.mesh===o);
  const withBody=sample();
  for(const [o,vis] of meshes)o.visible=vis;
  let count=0,center=0,rgbSum=0,nonzero=0;
  const left=Math.floor(width*.25),right=Math.floor(width*.75);
  const top=Math.floor(height*.1),bottom=Math.floor(height*.90);
  for(let i=0;i<sword.length;i+=4){
    const d=Math.abs(sword[i]-withBody[i])+
      Math.abs(sword[i+1]-withBody[i+1])+
      Math.abs(sword[i+2]-withBody[i+2]);
    if(d>50){
      count++;rgbSum+=d;
      const q=i/4,x=q%width,y=Math.floor(q/width);
      if(x>=left&&x<=right&&y>=top&&y<=bottom)center++;
    }
    if(withBody[i]+withBody[i+1]+withBody[i+2]>10)nonzero++;
  }
  p.render(0);
  const actor=h.actor.getWorldPosition(p.camera.position.clone());
  return {width,height,bodyNames:names,cpuVertices:h.cpuSkin.vertices,
   bodyDiffPixels:count,bodyCentralPixels:center,rgbSum,
   nonzero,actor:actor.toArray(),player:g.player.pos.toArray(),
   camera:p.camera.position.toArray(),
   status:window.__highflyHeroStatus,state:g.state};
 });
 await page.screenshot({path:'qa-world-kaykit.png'});
 fs.writeFileSync('qa-world-kaykit-report.json',JSON.stringify({before,report,errors},null,2));
 console.log('[HIGHFLY ACTUAL GAME BODY TEST]',JSON.stringify({before,report,errors}));
 assert.ok(report.bodyDiffPixels>=250,
  'INVISIBLE BODY IN ACTUAL WORLD: only '+report.bodyDiffPixels+' distinct pixels');
 assert.ok(report.bodyCentralPixels>=180,
  'BODY NOT VISIBLE IN CAMERA: only '+report.bodyCentralPixels+' central changed pixels');
 assert.ok(report.cpuVertices>=3000,'CPU skinned vertex count unexpectedly low');
 assert.equal(errors.filter(x=>/TypeError|ReferenceError|SyntaxError/.test(x)).length,0);
 console.log('PASS actual Unsung game KayKit skinned body visibly alters screen, not just sword');
}finally{
 await browser?.close();server.kill('SIGTERM');
}
