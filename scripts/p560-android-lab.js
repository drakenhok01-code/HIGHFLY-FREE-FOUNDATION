/* P560 Android Lab: independent diagnostic layer over the validated P559 build.
 * No world asset changes. No synchronous GPU readbacks. Normal effects by default. */
const W=window,D=document;
const ready=setInterval(()=>{if(W.__pipe&&W.__game&&W.__hfP555Regions){clearInterval(ready);install(W.__pipe,W.__game,W.__hfP555Regions)}},250);
function install(p,g,regions){
 if(W.__hfP560Lab)return;
 const r=p.renderer,gl=r.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),s=p.shadows;
 const stages=['total','shadows','opaque','transparent','sky','volumetrics','fog','taa','bloom','tonemap'];
 const gpu={},pending=[],records=[],events=[],errors=[],frames=[],maxRows=7200;
 let current=null,last=0,lastSample=performance.now(),count=0,queryActive=false,chosen=null,paused=false,mode='mini',profile='normal',session=Date.now(),grass=true,volume=true,bloom=true,baseBloom=p.bloomStrength,lastBloom=null,frameN=0,latest=null;
 const original={enabled:s.enabled,soft:s.soft,rate:s.rate,splits:[...s.splits],fade:s.uniforms.uShadowInfo.value.z,volume:p.volumetrics?.enabled,grass:W.__parts?.cover?.group?.visible};
 const undo=[],mark=(type,value)=>{events.push({t:Date.now()-session,type,value});if(events.length>2000)events.shift()};
 const keepError=e=>{errors.push({t:Date.now()-session,message:String(e).slice(0,1000)});if(errors.length>100)errors.shift()};
 W.addEventListener('error',e=>keepError(e.message));W.addEventListener('unhandledrejection',e=>keepError(e.reason));r.domElement.addEventListener('webglcontextlost',()=>keepError('WebGL context lost'));
 function wrap(o,k,fn){if(!o||typeof o[k]!=='function')return;const old=o[k];o[k]=function(...a){return fn.call(this,old,a)};undo.push(()=>o[k]=old)}
 function timed(name,fn){
  let q=null;const t=performance.now();
  if(current&&ext&&!queryActive&&chosen===name&&pending.length<3){try{q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);queryActive=true}catch{if(q)gl.deleteQuery(q);q=null}}
  try{return fn()}finally{if(current){current.cpu[name]=(current.cpu[name]??0)+performance.now()-t}if(q){try{gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push({q,name,profile,at:Date.now()-session})}catch{gl.deleteQuery(q)}queryActive=false}}
 }
 function poll(){if(!ext)return;try{if(gl.getParameter(ext.GPU_DISJOINT_EXT)){for(const x of pending)gl.deleteQuery(x.q);pending.length=0;return}while(pending.length&&gl.getQueryParameter(pending[0].q,gl.QUERY_RESULT_AVAILABLE)){const x=pending.shift(),ms=gl.getQueryParameter(x.q,gl.QUERY_RESULT)/1e6;gl.deleteQuery(x.q);if(Number.isFinite(ms)&&ms>=0)gpu[x.name]={ms,profile:x.profile,at:x.at}}}catch(e){keepError(e)}}
 function applyShadow(){const spec=profile==='normal'?original:profile==='moderate'?{enabled:true,soft:false,rate:2,splits:original.splits}:profile==='light'?{enabled:true,soft:false,rate:2,splits:[18,64]}:{enabled:false,soft:false,rate:2,splits:original.splits};s.enabled=spec.enabled;s.soft=spec.soft;s.rate=spec.rate;s.splits=[...spec.splits];s.uniforms.uShadowInfo.value.z=spec.splits[1]}
 wrap(s,'update',function(old,a){applyShadow();return timed('shadows',()=>old.apply(this,a))});
 wrap(r,'render',function(old,a){const scene=a[0],k=scene===p.scene?'opaque':scene===p.sceneT?'transparent':scene===s.scene?'cascade':scene===s.staticScene?'staticShadow':'other',t=this.info.render.triangles,c=this.info.render.calls;const v=timed(k,()=>old.apply(this,a));if(current){const v=current.draw[k]??={triangles:0,calls:0};v.triangles+=this.info.render.triangles-t;v.calls+=this.info.render.calls-c}return v});
 for(const [obj,key,name] of [[p.sky,'update','sky'],[p.volumetrics,'render','volumetrics'],[p.fog,'render','fog'],[p.taa,'render','taa'],[p.tonemap,'render','tonemap']])wrap(obj,key,function(old,a){return timed(name,()=>old.apply(this,a))});
 wrap(p.bloom,'render',function(old,a){if(!bloom&&lastBloom)return lastBloom;lastBloom=timed('bloom',()=>old.apply(this,a));return lastBloom});
 wrap(p,'render',function(old,a){
  if(p.volumetrics)p.volumetrics.enabled=volume?original.volume:false;
  const cover=W.__parts?.cover?.group;if(cover)cover.visible=grass?(original.grass??true):false;
  if(bloom){if(p.bloomStrength!==0)baseBloom=p.bloomStrength;p.bloomStrength=baseBloom}else p.bloomStrength=0;
  if(paused||D.hidden||g.state!=='playing'){last=0;return old.apply(this,a)}
  const now=performance.now(),dt=last?now-last:0;last=now;
  current={cpu:{},draw:{}};chosen=frameN++%24===0?stages[Math.floor((frameN-1)/24)%stages.length]:null;
  try{return timed('total',()=>old.apply(this,a))}
  finally{const x=current;current=null;count++;if(dt>0)frames.push(dt);if(count%20===0)poll();
   if(now-lastSample>=1000){const sorted=frames.splice(0).sort((a,b)=>a-b),mean=sorted.reduce((a,b)=>a+b,0)/Math.max(1,sorted.length),q=n=>sorted[Math.max(0,Math.ceil(n*sorted.length)-1)]??null;const m=regions.metrics();latest={t:Date.now()-session,region:regions.active,mobility:g.player.state,stamina:g.player.stamina,destination:m.destination??null,beaconArrival:m.beaconArrival??null,position:{x:g.player.pos.x,y:g.player.pos.y,z:g.player.pos.z},fps:mean?1000/mean:null,frames:sorted.length,frameMean:mean,p95:q(.95),max:q(1),cpu:x.cpu,gpu:JSON.parse(JSON.stringify(gpu)),draw:x.draw,total:{triangles:r.info.render.triangles,calls:r.info.render.calls},components:m.opaque?.parts??null,sectors:{visible:m.visible,total:m.total,queued:m.queued,busy:m.busy,loadMs:m.loadMs},forest:m.forest,density:m.vegetationDensity,lod:m.lod,memory:{geometries:r.info.memory.geometries,textures:r.info.memory.textures},resolution:{display:[p.displayW,p.displayH],internal:[p.rw,p.rh]},profile,grass,volume,bloom};records.push(latest);if(records.length>maxRows)records.shift();lastSample=now;paint()}
  }
 });
 const box=D.createElement('div');box.id='hf-p560-lab';box.style.cssText='position:fixed;top:5px;left:5px;z-index:100005;color:#eae5ff;background:#111225d9;border:1px solid #a78bd8;border-radius:7px;font:10px/1.25 system-ui;max-width:min(310px,45vw);padding:4px;touch-action:manipulation;box-shadow:0 1px 4px #0006';
 const header=D.createElement('button');header.style.cssText='background:none;border:0;color:#a6efb5;font:bold 10px monospace;padding:2px;cursor:pointer';header.textContent='LAB · iniciando';box.append(header);
 const panel=D.createElement('div');panel.style.cssText='display:none;max-height:65vh;overflow:auto;padding:3px';box.append(panel);
 const pre=D.createElement('pre');pre.style.cssText='white-space:pre-wrap;margin:3px 0;font:10px/1.25 monospace';panel.append(pre);
 function btn(label,fn){const b=D.createElement('button');b.textContent=label;b.style.cssText='background:#211b3c;color:#fff;border:1px solid #8772ba;border-radius:4px;margin:2px;padding:5px;font:10px system-ui';b.onclick=fn;panel.append(b);return b}
 function setProfile(v){profile=v;s._frame=0;mark('shadow',v);paint()}
 for(const [label,v] of [['Normal','normal'],['Moderada','moderate'],['Ligera','light'],['Sin sombra','off']])btn(label,()=>setProfile(v));
 const grassBtn=btn('Césped ON',()=>{grass=!grass;mark('grass',grass);paint()});const volumeBtn=btn('Volumétricos ON',()=>{volume=!volume;mark('volume',volume);paint()});const bloomBtn=btn('Bloom ON',()=>{bloom=!bloom;mark('bloom',bloom);paint()});
 const pauseBtn=btn('Pausar registro',()=>{paused=!paused;last=0;frames.length=0;mark('paused',paused);paint()});
 function exportData(){const data={version:'P5.6.5 World Integrity / Android Lab',started:new Date(session).toISOString(),exported:new Date().toISOString(),device:{userAgent:navigator.userAgent,dpr:devicePixelRatio,gpuTimer:!!ext},notes:'CPU render submission, not full CPU utilization; GPU async stage samples may be from earlier frames; memory counts, not bytes; no temperature API',records,events,errors,bugMarks};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=D.createElement('a');a.href=url;a.download='HIGHFLY-P565-'+Date.now()+'.json';D.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);return data}
 const bugMarks=[];const coords=D.createElement('div');coords.style.cssText='font:10px monospace;color:#e4cf9f';panel.prepend(coords);
 function markBug(){const pl=g.player,pos=pl.pos,m=regions.metrics(),water=g.world.waterLevel(pos.x,pos.z),floor=g.world.groundHeight(pos.x,pos.z),row={t:Date.now()-session,region:regions.active,city:m.city?.name??null,destination:m.destination,position:{x:pos.x,y:pos.y,z:pos.z},yaw:pl.yaw,cameraYaw:g.rig.yaw,cameraPitch:g.rig.pitch,ground:floor,water:Number.isFinite(water)?water:null,state:pl.state,fps:latest?.fps??null};bugMarks.push(row);mark('bug',row);coords.textContent='✓ ERROR '+bugMarks.length+' · X '+pos.x.toFixed(1)+' Y '+pos.y.toFixed(1)+' Z '+pos.z.toFixed(1);return row}
 const flag=D.createElement('button');flag.textContent='⚑';flag.title='Marcar error en este lugar';flag.setAttribute('aria-label','Marcar error');flag.style.cssText='border:0;background:#413451;color:#ffd28a;border-radius:3px;padding:2px 5px;font:11px system-ui';flag.onclick=markBug;box.insertBefore(flag,panel);btn('Marcar error',markBug);
 btn('Exportar JSON',exportData);btn('Ocultar',()=>setMode('hidden'));btn('Restaurar efectos',()=>{profile='normal';grass=volume=bloom=true;s._frame=0;mark('restore',true);paint()});
 const tab=D.createElement('button');tab.textContent='LAB';tab.style.cssText='display:none;position:fixed;top:5px;left:5px;z-index:100005;background:#171326ad;color:#c6b9e7;font:9px system-ui;border:0;border-radius:4px;padding:3px';tab.onclick=()=>setMode('mini');
 function setMode(v){mode=v;box.style.display=v==='hidden'?'none':'block';panel.style.display=v==='full'?'block':'none';tab.style.display=v==='hidden'?'block':'none'}
 header.onclick=()=>setMode(mode==='full'?'mini':'full');
 function paint(){const x=latest;const pos=g.player.pos;coords.textContent='X '+pos.x.toFixed(1)+' Y '+pos.y.toFixed(1)+' Z '+pos.z.toFixed(1)+' · ⚑ '+bugMarks.length;header.textContent=x?(Math.round(x.fps??0)+' FPS · '+x.frameMean.toFixed(1)+'ms · '+(paused?'II':'●')+' LAB'):'LAB · iniciando';if(x){const num=v=>Number.isFinite(v)?v.toFixed(1):'N/D';const gpuLines=Object.entries(x.gpu).filter(([,v])=>v.profile===profile).map(([k,v])=>k+' '+num(v.ms)+'ms').join(' | ');pre.textContent='Isla '+(x.region??'inicio')+' · '+profile+'\nP95 '+num(x.p95)+'ms · CPU render '+num(x.cpu.total)+'ms\nGPU '+(ext?gpuLines||'muestreando':'N/D')+'\n'+Math.round(x.total.triangles/1000)+'k tri · '+x.total.calls+' draws\nCola '+x.sectors.queued+' · geo '+x.memory.geometries+' · tex '+x.memory.textures+'\n'+x.resolution.internal.join('×')+' · '+records.length+' muestras'}grassBtn.textContent='Césped '+(grass?'ON':'OFF');volumeBtn.textContent='Volumétricos '+(volume?'ON':'OFF');bloomBtn.textContent='Bloom '+(bloom?'ON':'OFF');pauseBtn.textContent=paused?'Reanudar registro':'Pausar registro'}
 D.body.append(box,tab);const legacy=D.createElement('style');legacy.textContent='#hf-p514-fps-mini,#hf-p514-debug-toggle{display:none!important}';D.head.append(legacy);W.__hfP508Clock?.setDiagnostics('hidden');setMode('mini');paint();
 W.__hfP560Lab={version:'P565',setProfile,setMode,exportData,markBug,get bugMarks(){return bugMarks.slice()},get latest(){return latest},get count(){return records.length},get profile(){return profile},get gpuSupported(){return !!ext}};
}
