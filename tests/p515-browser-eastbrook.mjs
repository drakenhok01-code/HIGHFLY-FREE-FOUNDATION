import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
const base='http://127.0.0.1:5191/HIGHFLY-FREE-FOUNDATION/preview-p515/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','5191','--strictPort','--base','/HIGHFLY-FREE-FOUNDATION/preview-p515/'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
let browser=null;
try{
 let online=false;
 for(let n=0;n<90;n++){
  try{const r=await fetch(base+'index.html');if(r.ok){online=true;break;}}catch{}
  await delay(400);
 }
 if(!online)throw Error('P515 Vite preview did not start: '+logs.slice(-1800));
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});
 const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1});
 const errs=[];page.on('pageerror',e=>errs.push(String(e).slice(0,300)));
 await page.goto(base+'?hfqa=1',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>!!window.__hfP515Eastbrook?.readyPromise,null,{timeout:210000,polling:1000});
 await page.evaluate(()=>window.__hfP515Eastbrook.readyPromise);
 const status=await page.evaluate(()=>{
  const a=window.__hfP515Eastbrook;
  return {version:a.version,town:a.town,placed:a.placed,loaded:a.loaded,skipped:a.skipped,errors:a.errors,
   roads:a.roads,meshes:a.meshes.map(m=>m.name),scene:window.__game?.pipe?.scene?.children?.length};
 });
 console.log('[P515 REAL 3D RPG]',JSON.stringify({status,errs}).slice(0,4500));
 await page.screenshot({path:'p515-eastbrook-rpg.png',fullPage:true});
 fs.writeFileSync('p515-eastbrook-rpg.json',JSON.stringify({status,errs},null,2));
 if(status.placed!==11||status.loaded.length<9||status.roads!==7||status.errors.length)throw Error('P515 Eastbrook missing buildings: '+JSON.stringify(status));
 if(errs.some(x=>/Cannot read|is not defined|Failed to fetch/i.test(x)))throw Error('P515 Chrome runtime exceptions: '+errs.join(' | '));
 console.log('[P515 PASS] Static town directly in native RPG, no editor, 11 placements, 9 genuine KayKit models + 2 native Unsung, 7 cobble streets');
}finally{await browser?.close();server.kill('SIGTERM');}