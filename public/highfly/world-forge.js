/* HIGHFLY WORLD FORGE V0.1
 * No game engine / combat / WebGL. Actual frozen 16-bit Unsung heightmaps.
 * Same-origin localStorage layout is read by the isolated game preview.
 */
const $=id=>document.getElementById(id);
const STORE='hf-world-forge-layout-v1',TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const CATALOG=[
 {id:'guild',label:'Gremio',icon:'🏰',cat:'Edificios',w:14,d:11,h:10},
 {id:'forge',label:'Herrería',icon:'⚒️',cat:'Edificios',w:11,d:9,h:8},
 {id:'inn',label:'Posada',icon:'🏠',cat:'Edificios',w:12,d:10,h:8},
 {id:'house',label:'Casa medieval',icon:'🏡',cat:'Edificios',w:9,d:8,h:7},
 {id:'timber',label:'Casa de madera',icon:'🛖',cat:'Edificios',w:8,d:8,h:6},
 {id:'market',label:'Mercado',icon:'🏪',cat:'Edificios',w:12,d:9,h:6},
 {id:'mill',label:'Molino',icon:'🌾',cat:'Edificios',w:10,d:10,h:11},
 {id:'granary',label:'Granero',icon:'🌽',cat:'Edificios',w:12,d:9,h:8},
 {id:'warehouse',label:'Almacén',icon:'📦',cat:'Edificios',w:11,d:9,h:7},
 {id:'fishery',label:'Pesquería',icon:'🎣',cat:'Edificios',w:10,d:8,h:7},
 {id:'ranger',label:'Refugio',icon:'🏕️',cat:'Edificios',w:9,d:8,h:6},
 {id:'floor-stone',label:'Empedrado',icon:'▩',cat:'Pisos',w:4,d:4,h:.12,floor:true},
 {id:'floor-earth',label:'Sendero de tierra',icon:'🟫',cat:'Pisos',w:4,d:4,h:.12,floor:true},
 {id:'floor-wood',label:'Tablas de madera',icon:'🟨',cat:'Pisos',w:4,d:4,h:.12,floor:true},
 {id:'lantern',label:'Farol de piedra',icon:'🏮',cat:'Decoración',w:1.5,d:1.5,h:3},
 {id:'well',label:'Pozo',icon:'🕳️',cat:'Decoración',w:4,d:4,h:2},
 {id:'fence',label:'Valla',icon:'🚧',cat:'Decoración',w:4,d:.4,h:1.3},
 {id:'barrel',label:'Barril',icon:'🛢️',cat:'Decoración',w:1.1,d:1.1,h:1.3},
 {id:'bench',label:'Banco de piedra',icon:'🪑',cat:'Decoración',w:3,d:1.4,h:1},
 {id:'tree',label:'Árbol ornamental',icon:'🌳',cat:'Naturaleza',w:3,d:3,h:7},
 {id:'rock',label:'Roca',icon:'🪨',cat:'Naturaleza',w:3,d:2.5,h:2},
 {id:'ore',label:'Mineral',icon:'⛏️',cat:'Naturaleza',w:3,d:3,h:2},
 {id:'npc-merchant',label:'NPC comerciante',icon:'🧙',cat:'NPC',w:1,d:1,h:1.8},
 {id:'npc-guard',label:'NPC guardia',icon:'🛡️',cat:'NPC',w:1,d:1,h:1.8},
 {id:'npc-artisan',label:'NPC artesano',icon:'👨‍🏭',cat:'NPC',w:1,d:1,h:1.8}
];
const BY_ID=new Map(CATALOG.map(x=>[x.id,x]));
const ZONES=[
 {x:-519,z:-70,r:42,name:'Aparición y plaza inicial'},
 {x:-372,z:-392,r:27,name:'Aguja de Pétalos'},
 {x:66,z:-498,r:31,name:'Aguja del Cantor'},
 {x:150,z:-15,r:43,name:'Aguja del Coro'},
 {x:578,z:-437,r:29,name:'Aguja del Este'},
 {x:517,z:437,r:29,name:'Aguja de los Juncos'},
 {x:136,z:546,r:29,name:'Aguja de Aurel'},
 {x:-405,z:435,r:29,name:'Aguja del Huerto'},
 {x:-1005,z:-168,r:47,name:'Aguja de la Corona'},
 {x:-179,z:-459,r:20,name:'Escalera original'}
];
const COLORS={guild:'#a296bc',forge:'#c48f78',inn:'#aa866b',house:'#c09e7e',timber:'#a18465',market:'#c69a79',mill:'#d1be8d',granary:'#ae8d6c',warehouse:'#867e89',fishery:'#8ca9b8',ranger:'#789486','floor-stone':'#b2b0a4','floor-earth':'#9b7a56','floor-wood':'#b58b59',lantern:'#f6ca70',well:'#84b2c4',fence:'#c7af84',barrel:'#aa8667',bench:'#c1b69f',tree:'#4d995c',rock:'#96908a',ore:'#bdbfa3','npc-merchant':'#e6bb95','npc-guard':'#b7afe9','npc-artisan':'#d2a98f'};
let mapData=null,coreMap,regionMap,objects=[],selectedId=null,selectedAsset=null,category='Edificios',tool='select',gridOn=true,history=[],future=[],drag=null,lastStamp=null,mouse={x:-512,z:-70,valid:true},frame=0;
const view={x:-510,z:-70,zoom:2.1},canvas=$('map'),ctx=canvas.getContext('2d',{alpha:false});
const safe=(text)=>{ $('status').textContent=text; };
const cell=(x,n=1)=>Math.round(x/n)*n;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const getAsset=obj=>BY_ID.get(obj.type);
function snapshot(){history.push(JSON.stringify(objects));if(history.length>65)history.shift();future.length=0;}
function undo(){if(!history.length)return;future.push(JSON.stringify(objects));objects=JSON.parse(history.pop());selectedId=null;saveLocal(false);updateProps();draw();}
function redo(){if(!future.length)return;history.push(JSON.stringify(objects));objects=JSON.parse(future.pop());selectedId=null;saveLocal(false);updateProps();draw();}
function saveLocal(show=true){
 const layout={schema:1,author:'HIGHFLY World Forge',world:'unsung-vale',objects};
 try{localStorage.setItem(STORE,JSON.stringify(layout));if(show)safe('✓ Mundo guardado en este dispositivo. Exportá JSON para llevarlo a otro.');}
 catch(e){safe('No se pudo guardar. Exportá el archivo JSON. '+e.message);}
 $('items').textContent=objects.length+' elementos';
}
function loadLocal(){
 try{
  const data=JSON.parse(localStorage.getItem(STORE)||'null');
  if(data?.schema===1&&Array.isArray(data.objects))objects=data.objects.filter(o=>validItem(o));
 }catch{}
 $('items').textContent=objects.length+' elementos';
}
function validItem(o){return !!(o&&typeof o.id==='string'&&BY_ID.has(o.type)&&Number.isFinite(o.x)&&Number.isFinite(o.z)&&Math.abs(o.x)<8190&&Math.abs(o.z)<8190&&Number.isFinite(o.yaw)&&Number.isFinite(o.scale)&&o.scale>=.5&&o.scale<=3);}
function loadImage(res,name){
 return fetch(new URL('../world/'+name,import.meta.url)).then(r=>{if(!r.ok)throw Error('No se encontró '+name+' ('+r.status+')');return r.arrayBuffer();}).then(async buf=>{
  const raw=await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const val=new DataView(raw),out=new Float32Array(res.res*res),factor=(res.max-res.min)/65535;
  if(raw.byteLength!==out.length*2)throw Error('Dimensiones incorrectas de '+name);
  for(let i=0;i<out.length;i++)out[i]=res.min+val.getUint16(i*2,true)*factor;
  return out;
 });
}
function sample(data,m,x,z){
 const f=(x/m.size+.5)*m.res-.5,g=(z/m.size+.5)*m.res-.5,ix=clamp(Math.floor(f),0,m.res-2),iz=clamp(Math.floor(g),0,m.res-2);
 const tx=clamp(f-ix,0,1),tz=clamp(g-iz,0,1),j=iz*m.res+ix;
 return ((data[j]*(1-tx)+data[j+1]*tx)*(1-tz)+(data[j+m.res]*(1-tx)+data[j+m.res+1]*tx)*tz);
}
function heightAt(x,z){
 if(!mapData)return 0;
 const e=Math.max(Math.abs(x),Math.abs(z))/(mapData.meta.core.size*.5);
 const hr=e<.9?0:sample(mapData.region,mapData.meta.region,x,z);
 if(e>=.985)return hr;
 const hc=sample(mapData.core,mapData.meta.core,x,z);
 if(e<=.9)return hc;
 const t=(e-.9)/.085,w=1-t*t*(3-2*t);
 return hr+(hc-hr)*w;
}
const sea=(x,z)=>heightAt(x,z)<-.05;
function siteStatus(o,ignoreId=null){
 if(!mapData)return {ok:false,reason:'Cargando mapa'};
 const item=getAsset(o);if(!item)return {ok:false,reason:'Objeto desconocido'};
 const w=item.w*o.scale,d=item.d*o.scale,rad=Math.hypot(w,d)/2;
 const c=Math.cos(o.yaw),s=Math.sin(o.yaw),samples=[];
 for(const [dx,dz] of [[0,0],[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){
  const x=o.x+dx*c-dz*s,z=o.z+dx*s+dz*c;
  if(Math.abs(x)>8120||Math.abs(z)>8120)return {ok:false,reason:'Fuera del mapa'};
  const h=heightAt(x,z);if(!Number.isFinite(h)||h<-.1)return {ok:false,reason:'Agua o fuera del terreno'};
  samples.push(h);
 }
 const y=Math.max(...samples),slope=y-Math.min(...samples);
 if(!item.floor&&!o.type.startsWith('npc-')&&slope>Math.min(3.8,1.2+o.scale*1.1))return {ok:false,reason:'Pendiente excesiva ('+slope.toFixed(1)+' m)'};
 if(!item.floor){
  for(const zone of ZONES){if(dist(o,zone)<zone.r+rad*.72)return {ok:false,reason:'Zona protegida: '+zone.name};}
  if(!o.type.startsWith('npc-'))for(const existing of objects){
   if(existing.id===ignoreId||existing.id===o.id)continue;
   const other=getAsset(existing);if(!other||other.floor||existing.type.startsWith('npc-'))continue;
   if(dist(existing,o)<(Math.hypot(other.w,other.d)*existing.scale+Math.hypot(w,d))*.32)
    return {ok:false,reason:'Edificio superpuesto'};
  }
 }
 return {ok:true,y,grade:slope};
}
function itemAt(x,z){
 for(let i=objects.length-1;i>=0;i--){
  const o=objects[i],item=getAsset(o),r=Math.max(item.w,item.d)*o.scale*.62;
  if(Math.hypot(x-o.x,z-o.z)<Math.max(r,3/view.zoom))return o;
 }
 return null;
}
function insert(type,x,z){
 const item=BY_ID.get(type);if(!item)return false;
 const q=item.floor?4:2,o={id:'hf-wf-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),type,x:cell(x,q),z:cell(z,q),yaw:0,scale:1,y:0};
 const status=siteStatus(o);
 if(!status.ok){safe('✕ No se puede colocar '+item.label+': '+status.reason);return false;}
 if(item.floor&&objects.some(p=>p.type===type&&dist(o,p)<1.1))return false;
 o.y=status.y;
 objects.push(o);selectedId=o.id;
 return true;
}
function paintLine(from,to,type){
 const dx=to.x-from.x,dz=to.z-from.z,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/2));
 let changed=false;
 for(let k=0;k<=steps;k++)if(insert(type,from.x+dx*k/steps,from.z+dz*k/steps))changed=true;
 return changed;
}
function worldAt(ev){
 const rect=canvas.getBoundingClientRect();
 return {x:view.x+(ev.clientX-rect.left-rect.width/2)/view.zoom,z:view.z+(ev.clientY-rect.top-rect.height/2)/view.zoom};
}
function drawMapLayer(canvasLayer,size){
 if(!canvasLayer)return;
 ctx.drawImage(canvasLayer,-size/2,-size/2,size,size);
}
function makeTopo(data,m,size=512){
 const el=document.createElement('canvas');el.width=el.height=size;
 const cx=el.getContext('2d'),img=cx.createImageData(size,size);
 for(let py=0;py<size;py++)for(let px=0;px<size;px++){
  const x=(px/size-.5)*m.size,z=(py/size-.5)*m.size;
  const h=sample(data,m,x,z),east=sample(data,m,x+m.size/size,z),north=sample(data,m,x,z-m.size/size);
  const gradient=Math.hypot(east-h,north-h),shade=clamp((north-h)*1.0-(east-h)*.7,-20,20);
  const i=(py*size+px)*4;let r,g,b0;
  if(h<-.2){r=35;g=60;b0=78;}else if(h<2){r=149;g=148;b0=107;}
  else if(gradient>2.6){r=107;g=101;b0=93;}
  else if(h>225){r=171;g=169;b0=160;}
  else if(h>120){r=110;g=119;b0=104;}
  else{r=67+Math.min(20,h*.06);g=110+Math.min(22,h*.07);b0=82+Math.min(14,h*.035);}
  const contour=h>0&&Math.abs((h%20)-10)<.7?-12:0,light=clamp(shade*.85+contour,-30,30);
  img.data[i]=clamp(r+light,0,255);img.data[i+1]=clamp(g+light,0,255);img.data[i+2]=clamp(b0+light,0,255);img.data[i+3]=255;
 }
 cx.putImageData(img,0,0);
 return el;
}
function resize(){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
 draw();
}
function drawItem(o,ghost=false){
 const item=getAsset(o),selected=o.id===selectedId,w=item.w*o.scale,d=item.d*o.scale;
 ctx.save();ctx.translate(o.x,o.z);ctx.rotate(o.yaw);
 const fill=COLORS[o.type]||'#c3a98a';
 ctx.globalAlpha=ghost ? .62 : 1;
 ctx.fillStyle=fill;ctx.strokeStyle=selected?'#79fff5':ghost?'#fff0a3':'#271d2b';
 ctx.lineWidth=(selected?2.6:1.4)/view.zoom;
 if(item.floor){ctx.fillRect(-w/2,-d/2,w,d);ctx.strokeRect(-w/2,-d/2,w,d);}
 else if(o.type.startsWith('npc-')){ctx.beginPath();ctx.arc(0,0,1.35*o.scale,0,TAU);ctx.fill();ctx.stroke();}
 else if(o.type==='tree'||o.type==='rock'||o.type==='ore'||o.type==='well'||o.type==='lantern'||o.type==='barrel'){
  ctx.beginPath();ctx.arc(0,0,Math.max(w,d)*.5,0,TAU);ctx.fill();ctx.stroke();
 }else{
  ctx.shadowColor='#111';ctx.shadowBlur=ghost?0:5/view.zoom;
  ctx.fillRect(-w/2,-d/2,w,d);ctx.strokeRect(-w/2,-d/2,w,d);
  ctx.shadowBlur=0;ctx.strokeStyle='#ffeed5';ctx.lineWidth=.8/view.zoom;
  ctx.beginPath();ctx.moveTo(-w/2,-d/2);ctx.lineTo(0,d/2);ctx.lineTo(w/2,-d/2);ctx.stroke();
  ctx.fillStyle='#f6dfaf';ctx.fillRect(-1.3,d/2-1.8,2.6,1.8);
 }
 ctx.restore();
 if(view.zoom>.58&&!ghost){
  ctx.save();ctx.font=(11/view.zoom)+'px system-ui';ctx.textAlign='center';ctx.lineWidth=3/view.zoom;
  ctx.strokeStyle='#13101b';ctx.fillStyle='#fff5d7';
  const label=item.floor?'':item.label;ctx.strokeText(label,o.x,o.z+(d/2+9/view.zoom));ctx.fillText(label,o.x,o.z+(d/2+9/view.zoom));ctx.restore();
 }
}
function draw(){
 if(frame)return;
 frame=requestAnimationFrame(()=>{
  frame=0;
  const rect=canvas.getBoundingClientRect(),dpr=canvas.width/Math.max(1,rect.width);
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#263a3e';ctx.fillRect(0,0,rect.width,rect.height);
  ctx.translate(rect.width/2,rect.height/2);ctx.scale(view.zoom,view.zoom);ctx.translate(-view.x,-view.z);
  if(mapData){drawMapLayer(regionMap,16384);drawMapLayer(coreMap,2048);}
  if(gridOn&&view.zoom>.42){
   const unit=view.zoom>.8?10:50,loX=view.x-rect.width/view.zoom/2,hiX=view.x+rect.width/view.zoom/2;
   const loZ=view.z-rect.height/view.zoom/2,hiZ=view.z+rect.height/view.zoom/2;
   ctx.beginPath();ctx.strokeStyle='#fff8bd24';ctx.lineWidth=1/view.zoom;
   for(let x=cell(loX,unit);x<hiX;x+=unit){ctx.moveTo(x,loZ);ctx.lineTo(x,hiZ);}
   for(let z=cell(loZ,unit);z<hiZ;z+=unit){ctx.moveTo(loX,z);ctx.lineTo(hiX,z);}
   ctx.stroke();
  }
  for(const q of ZONES){
   ctx.beginPath();ctx.arc(q.x,q.z,q.r,0,TAU);ctx.fillStyle='#d1982619';ctx.fill();
   ctx.strokeStyle='#f9c35a99';ctx.lineWidth=1.2/view.zoom;ctx.stroke();
   if(view.zoom>.34){ctx.font=(10/view.zoom)+'px system-ui';ctx.fillStyle='#ffe2a6';ctx.textAlign='center';ctx.fillText(q.name,q.x,q.z);}
  }
  for(const o of objects)drawItem(o);
  if(selectedAsset&&mouse.valid&&tool==='place'){
   const item=BY_ID.get(selectedAsset),q=item.floor?4:2,guess={id:'ghost',type:selectedAsset,x:cell(mouse.x,q),z:cell(mouse.z,q),yaw:0,scale:1};
   const st=siteStatus(guess);drawItem(guess,true);
   ctx.beginPath();ctx.strokeStyle=st.ok?'#78ffb4':'#ff6e86';ctx.lineWidth=2/view.zoom;
   ctx.arc(guess.x,guess.z,Math.max(item.w,item.d)*.75,0,TAU);ctx.stroke();
  }
  ctx.setTransform(1,0,0,1,0,0);
  $('coord').textContent='X '+mouse.x.toFixed(1)+' · Z '+mouse.z.toFixed(1);
  $('height').textContent='Suelo '+(mapData?heightAt(mouse.x,mouse.z).toFixed(2)+' m':'cargando…');
  $('items').textContent=objects.length+' elementos';
 });
}
function setCategory(cat){category=cat;for(const b of $('categories').children)b.classList.toggle('active',b.dataset.cat===cat);renderCatalog();}
function renderCatalog(){
 const root=$('catalog');root.replaceChildren();
 for(const it of CATALOG.filter(x=>x.cat===category)){
  const btn=document.createElement('button');btn.className='asset'+(selectedAsset===it.id?' active':'');
  const st=document.createElement('strong');st.textContent=it.icon;
  const label=document.createElement('span');label.textContent=it.label;
  btn.append(st,label);btn.title=it.label;btn.onclick=()=>{selectedAsset=it.id;tool='place';selectedId=null;syncTools();updateProps();renderCatalog();safe('Elegiste '+it.label+'. Tocá el mapa para colocarlo.');draw();};
  root.append(btn);
 }
}
function syncTools(){
 $('select').classList.toggle('active',tool==='select');$('pan').classList.toggle('active',tool==='pan');$('grid').classList.toggle('active',gridOn);
}
function updateProps(){
 const o=objects.find(o=>o.id===selectedId),item=o&&getAsset(o);
 const props=$('properties');
 const title=props.querySelector('b');
 const small=props.querySelector('small');
 if(item){title.textContent=item.icon+' '+item.label;small.textContent='X '+o.x.toFixed(1)+' · Y '+o.y.toFixed(2)+' · Z '+o.z.toFixed(1)+' · Ángulo '+Math.round(o.yaw*180/Math.PI)+'° · Escala '+o.scale.toFixed(2);}
 else{title.textContent=selectedAsset?'Añadir '+BY_ID.get(selectedAsset).label:'CONTROLES';small.textContent='Tocá SELECCIONAR y arrastrá un objeto para moverlo. En PISOS, deslizá para formar un camino.';}
}
function transformSelected(kind){
 const o=objects.find(o=>o.id===selectedId);if(!o)return;
 const prior={...o};snapshot();
 if(kind==='rotate-left')o.yaw-=Math.PI/12;
 if(kind==='rotate-right')o.yaw+=Math.PI/12;
 if(kind==='scale-down')o.scale=clamp(Math.round((o.scale-.1)*100)/100,.5,3);
 if(kind==='scale-up')o.scale=clamp(Math.round((o.scale+.1)*100)/100,.5,3);
 const status=siteStatus(o,o.id);
 if(!status.ok){Object.assign(o,prior);history.pop();safe('No se puede modificar: '+status.reason);}
 else{o.y=status.y;saveLocal(false);}
 updateProps();draw();
}
function locateInitial(){
 view.x=-510;view.z=-70;view.zoom=2.1;draw();
}
const downPointers=new Map();
function onPointerDown(e){
 e.preventDefault();canvas.setPointerCapture(e.pointerId);
 const w=worldAt(e);mouse={...w,valid:true};downPointers.set(e.pointerId,{clientX:e.clientX,clientY:e.clientY});
 if(downPointers.size>1){const a=[...downPointers.values()];drag={kind:'pinch',dist:Math.hypot(a[1].clientX-a[0].clientX,a[1].clientY-a[0].clientY),zoom:view.zoom};return;}
 if(e.button===1||tool==='pan'||e.shiftKey||e.altKey){drag={kind:'pan',x:e.clientX,z:e.clientY,originX:view.x,originZ:view.z};return;}
 if(tool==='place'&&selectedAsset){
  snapshot();lastStamp=w;
  const before=objects.length;
  insert(selectedAsset,w.x,w.z);
  if(objects.length===before){history.pop();drag=null;}
  else{drag={kind:BY_ID.get(selectedAsset).floor?'paint':'single',start:w};}
  draw();return;
 }
 const hit=itemAt(w.x,w.z);selectedId=hit?.id??null;tool='select';selectedAsset=null;syncTools();renderCatalog();
 drag=hit?{kind:'move',id:hit.id,before:JSON.stringify(objects),x:hit.x,z:hit.z}:{kind:'pan',x:e.clientX,z:e.clientY,originX:view.x,originZ:view.z};
 if(hit)snapshot();updateProps();draw();
}
function onPointerMove(e){
 const w=worldAt(e);mouse={...w,valid:true};
 if(downPointers.has(e.pointerId))downPointers.set(e.pointerId,{clientX:e.clientX,clientY:e.clientY});
 if(downPointers.size>1){const a=[...downPointers.values()],d=Math.hypot(a[1].clientX-a[0].clientX,a[1].clientY-a[0].clientY);if(drag?.kind!=='pinch')drag={kind:'pinch',dist:d,zoom:view.zoom};else if(drag.dist>0)view.zoom=clamp(drag.zoom*d/drag.dist,.045,6);draw();return;}
 if(!drag){draw();return;}
 if(drag.kind==='pan'){view.x=drag.originX-(e.clientX-drag.x)/view.zoom;view.z=drag.originZ-(e.clientY-drag.z)/view.zoom;}
 if(drag.kind==='move'){
  const o=objects.find(x=>x.id===drag.id);if(o){
   const p={...o,x:cell(w.x,2),z:cell(w.z,2)},status=siteStatus(p,o.id);
   if(status.ok){o.x=p.x;o.z=p.z;o.y=status.y;}
   else safe('Ubicación bloqueada: '+status.reason);
  }
 }
 if(drag.kind==='paint'){
  const prior=objects.length;paintLine(lastStamp??w,w,selectedAsset);lastStamp=w;
  if(objects.length>prior)saveLocal(false);
 }
 draw();
}
function onPointerUp(e){
 if(downPointers.has(e.pointerId))downPointers.delete(e.pointerId);
 if(downPointers.size!==0)return;
 if(drag){if(drag.kind==='move'||drag.kind==='paint'||drag.kind==='single')saveLocal(false);}
 drag=null;lastStamp=null;updateProps();draw();
}
canvas.addEventListener('pointerdown',onPointerDown);canvas.addEventListener('pointermove',onPointerMove);
canvas.addEventListener('pointerup',onPointerUp);canvas.addEventListener('pointercancel',onPointerUp);
canvas.addEventListener('wheel',e=>{
 e.preventDefault();
 const anchor=worldAt({clientX:e.clientX,clientY:e.clientY});
 view.zoom=clamp(view.zoom*Math.exp(-e.deltaY*.0011),.045,6);
 const next=worldAt({clientX:e.clientX,clientY:e.clientY});
 view.x+=anchor.x-next.x;view.z+=anchor.z-next.z;draw();
},{passive:false});
$('select').onclick=()=>{tool='select';selectedAsset=null;syncTools();renderCatalog();draw();};
$('pan').onclick=()=>{tool='pan';selectedAsset=null;syncTools();renderCatalog();draw();};
$('grid').onclick=()=>{gridOn=!gridOn;syncTools();draw();};
$('home').onclick=locateInitial;
$('zoom-in').onclick=()=>{view.zoom=clamp(view.zoom*1.25,.045,6);draw();};
$('zoom-out').onclick=()=>{view.zoom=clamp(view.zoom/1.25,.045,6);draw();};
$('undo').onclick=undo;$('redo').onclick=redo;
for(const id of ['rotate-left','rotate-right','scale-down','scale-up'])$(id).onclick=()=>transformSelected(id);
$('delete').onclick=()=>{const i=objects.findIndex(o=>o.id===selectedId);if(i<0)return;snapshot();objects.splice(i,1);selectedId=null;saveLocal();updateProps();draw();};
$('save').onclick=()=>saveLocal();
$('export').onclick=()=>{
 const data={schema:1,author:'HIGHFLY World Forge',world:'unsung-vale',objects};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='HIGHFLY-WORLD-FORGE.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 safe('Archivo exportado. Importalo desde otro dispositivo para llevar las construcciones.');
};
$('import').onclick=()=>$('io-file').click();
$('io-file').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(data?.schema!==1||!Array.isArray(data.objects)||data.objects.length>3000)throw Error('Formato o tamaño no permitido');
  const invalid=data.objects.filter(o=>!validItem(o));
  if(invalid.length)throw Error('Elementos inválidos: '+invalid.length);
  snapshot();objects=data.objects.map(o=>({...o,y:mapData?heightAt(o.x,o.z):o.y}));selectedId=null;
  saveLocal();updateProps();draw();safe('✓ Importados '+objects.length+' elementos. Ya están listos para el mapa del juego.');
 }catch(err){safe('No se pudo importar: '+err.message);}
 e.target.value='';
};
$('play').onclick=()=>{saveLocal(false);const game=new URL('../',import.meta.url);game.search='?hfworld=1';location.href=game.href;};
window.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();}
 if(e.key==='Delete'||e.key==='Backspace'){if(document.activeElement?.tagName!=='INPUT')$('delete').click();}
 if(e.key==='Escape'){$('select').click();}
 if(e.key.toLowerCase()==='r'&&selectedId){$('rotate-right').click();}
});
window.addEventListener('resize',resize);
for(const cat of [...new Set(CATALOG.map(x=>x.cat))]){
 const btn=document.createElement('button');btn.textContent=cat;btn.dataset.cat=cat;btn.onclick=()=>setCategory(cat);$('categories').append(btn);
}
setCategory(category);loadLocal();resize();updateProps();syncTools();
(async function boot(){
 try{
  if(!('DecompressionStream' in window))throw Error('Tu navegador no admite descompresión gzip; probá Chrome actualizado.');
  const url=new URL('../world/world.json',import.meta.url),resp=await fetch(url);
  if(!resp.ok)throw Error('No se pudo leer el mundo ('+resp.status+')');
  const meta=await resp.json();
  const [core,region]=await Promise.all([loadImage(meta.core,'core_h.bin'),loadImage(meta.region,'region_h.bin')]);
  mapData={meta,core,region};
  safe('Preparando mapa aéreo…');
  await new Promise(resolve=>setTimeout(resolve,25));
  regionMap=makeTopo(region,meta.region,590);coreMap=makeTopo(core,meta.core,700);
  for(const o of objects)o.y=heightAt(o.x,o.z);
  safe('✓ Mapa real cargado · Sin combate, IA, partículas ni renderizado del juego. Elegí algo del catálogo.');
  draw();
 }catch(err){safe('ERROR DE MAPA: '+err.message+'. El editor necesita los archivos originales de Unsung.');console.error(err);}
})();
