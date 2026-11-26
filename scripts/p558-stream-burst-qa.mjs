// P558 streaming burst QA: only test harness, no changes to the player-facing app.
import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.HF_QA_URL??'http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/';
const seeds=(process.env.HF_QA_SEEDS??'1,2,3,4,5,6,7,8').split(',').map(Number);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:800,height:375},deviceScaleFactor:1,hasTouch:true,isMobile:true});
const rows=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
 await page.goto(base+'?hfdiag=full&hfqa=1',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__game&&window.__hfP555Regions&&window.__hfP508Clock,{},{timeout:600000});
 await page.evaluate(()=>{const g=window.__game;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'});window.__hfP508Clock.setDiagnostics('full')});
 for(const seed of seeds){
  const row=await page.evaluate(async seed=>{
   const api=window.__hfP555Regions,g=window.__game,pipe=window.__pipe,t0=performance.now();
   await api.open(seed,true);
   if(api.active!==seed)return {seed,ok:false,reason:'region failed to load'};
   const p=api.regions.find(r=>r.seed===seed),d=await fetch('highfly/regions/island-'+seed+'.json').then(r=>{if(!r.ok)throw Error('region HTTP '+r.status);return r.json()});
   const road=[];for(let i=0;i<d.paths.length;i+=9){road.push({x:p.x+(d.paths[i]+d.paths[i+3]+d.paths[i+6])/3*p.scale,z:p.z+(d.paths[i+2]+d.paths[i+5]+d.paths[i+8])/3*p.scale})}
   const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
   const hops=[],used=new Set();let cursor={x:g.player.pos.x,z:g.player.pos.z};
   for(const [i,target] of [25,50,75,100,50,25].entries()){
    const candidates=road.map((v,j)=>({v,j,dist:Math.hypot(v.x-cursor.x,v.z-cursor.z)})).filter(o=>!used.has(o.j)&&o.dist>=target*.85&&o.dist<=target*1.25).sort((a,b)=>Math.abs(a.dist-target)-Math.abs(b.dist-target));
    let next=null;for(const c of candidates){const {x,z}=c.v,y=g.world.groundHeight(x,z),water=g.world.waterLevel(x,z);if(!Number.isFinite(y)||water>y+.05)continue;const h=g.world.floorBelow(x,y+3,z,4);if(!Number.isFinite(h)||Math.abs(h-y)>1)continue;next={...c,y:h};break}
    if(!next){hops.push({i,target,ok:false,reason:'no dry road candidate'});continue}
    used.add(next.j);const {x,z}=next.v,yaw=(i+1)*Math.PI/2,started=performance.now();
    // Force only avatar and camera position, not sector activation: actual stream hooks must react.
    g.player.spawn(x,next.y+.12,z,yaw);g.player.setState('move');g.rig.yaw=yaw;g.rig.snap(g.player);pipe.taa.reset=true;
    const samples=[];let last=performance.now();
    for(let j=0;j<4;j++){const now=await frame(),m=api.metrics();samples.push({ms:now-last,queued:m.queued,visible:m.visible,triangles:m.opaque?.triangles??null,calls:m.opaque?.calls??null,geometries:pipe.renderer.info.memory.geometries,textures:pipe.renderer.info.memory.textures});last=now}
    const distance=Math.hypot(g.player.pos.x-x,g.player.pos.z-z);
    hops.push({i,target,metres:next.dist,ok:api.active===seed&&Number.isFinite(g.player.pos.y)&&distance<5,elapsed:performance.now()-started,samples});cursor={x,z};
   }
   const recoveryStart=performance.now();while(api.metrics().queued>0&&performance.now()-recoveryStart<60000)await frame();
   const final=api.metrics();
   return {seed,ok:hops.length===6&&hops.every(h=>h.ok)&&final.queued===0,hops,elapsed:performance.now()-t0,recovered:final.queued===0,final,memory:{geometries:pipe.renderer.info.memory.geometries,textures:pipe.renderer.info.memory.textures}};
  },seed);rows.push(row);console.log('HF558_BURST '+JSON.stringify(row));
  await page.screenshot({path:'burst-region-'+seed+'.png',timeout:30000}).catch(()=>{});
 }
}catch(e){errors.push(String(e));console.error(e)}finally{await browser.close();fs.writeFileSync('p558-burst-audit.json',JSON.stringify({device:'CI Chromium SwiftShader, not Android GPU',seeds,rows,errors,note:'QA avatar repositioning tests streaming bursts, not continuous movement, collision paths, thermal or real mobile FPS'},null,2))}
if(rows.length!==seeds.length||rows.some(r=>!r.ok)||errors.some(e=>/TypeError|ReferenceError|shader error|WebGLProgram: Shader Error/i.test(e)))process.exitCode=1;
