/* World Forge P544 isolated settlement laboratory, no game writes. */
import * as THREE from 'three';
import {makeCurvedCobblestone3D,disposeCurvedRoadGeometry} from './p533-curved-road-3d.mjs';
import {SETTLEMENTS} from './p544-guildhall-settlements.mjs';
import {verifiedAssetLookup,mergeDirtPathMask} from './p544-unsung-settlement-bridge.mjs';
import {SCALE_REFERENCE} from './p544-native-site-planner.mjs';
import {searchRegion,REGION_HINTS} from './p545-region-planner.mjs';
const LIB='https://highfly-guildhall-assets-p544.vercel.app/';
const KEY='hf-world-forge-settlement-p545-drafts-v1';
export async function installSettlementLab({scene,loader,overview,elevation,occupied,nativeVisuals,render,focus,target,status,refreshGrass}){
 const panel=document.getElementById('guildhall-lab');panel.hidden=false;
 panel.innerHTML='<strong>🏰 P5.4.5 · Pueblos Guildhall</strong><p style="font-size:11px">214 GLB exactos · héroe estilizado 1,82 m · sin hexágonos</p><select id="hf544-theme" style="width:100%"></select><button id="hf544-one">Buscar parcela y generar</button><button id="hf544-all">Buscar 14 pueblos</button><button id="hf544-goto">Ir al pueblo elegido</button><button id="hf544-clear">Quitar vista previa</button><button id="hf544-export">Exportar plano JSON</button><pre id="hf544-report" style="white-space:pre-wrap;font-size:10px;max-height:180px;overflow:auto"></pre>';
 const $=id=>document.getElementById(id),select=$('hf544-theme'),report=$('hf544-report');
 for(const p of SETTLEMENTS.filter(p=>p.id!=='japonesa')){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.append(o)}
 const response=await fetch(LIB+'asset-audit.json');if(!response.ok)throw Error('Biblioteca GLB HTTP '+response.status);
 const audit=await response.json();if(!audit.complete||audit.verified!==214)throw Error('Biblioteca incompleta');
 const lookup=verifiedAssetLookup(audit,LIB),group=new THREE.Group();group.name='P544 isolated settlements';scene.add(group);
 const models=new Map(),plans=[],failures=[],originalMask=nativeVisuals?.pathPixels?.slice();
 const sample=(x,z)=>{const height=elevation(x,z);let level=-.07;for(const p of overview.pools??[])if(Math.hypot(x-p.x,z-p.z)<=p.r)level=Math.max(level,p.level+.03);return {height,water:height<level-.05,waterHeight:level}};
 const inside=(p,x,z)=>{const b=p.bounds;return x>b.minX&&x<b.maxX&&z>b.minZ&&z<b.maxZ};
 const initialRoutes=(overview.routes??[]).flatMap(line=>line.flatMap(([x,z],i)=>{if(!i)return [{x,z}];const [a,b]=line[i-1],n=Math.ceil(Math.hypot(x-a,z-b)/5);return Array.from({length:n},(_,j)=>({x:a+(x-a)*(j+1)/n,z:b+(z-b)*(j+1)/n}))}));
 const load=id=>{if(!models.has(id)){const a=lookup(id);if(!a)throw Error('Missing model '+id);models.set(id,loader.loadAsync(a.uri).then(g=>g.scene).catch(e=>{models.delete(id);throw e}))}return models.get(id)};
 function setReport(){report.textContent=plans.map(p=>p.name+': '+p.objects.length+' piezas · X '+p.anchor.x.toFixed(1)+' Z '+p.anchor.z.toFixed(1)+' · '+(p.connector?'conectado':'sin conexión')).concat(failures.map(p=>p.id+': '+p.reason)).join('\n');}
 function paths(){
  if(!originalMask||!nativeVisuals)return;
  const all=plans.flatMap(p=>p.roads.concat(p.connector?[p.connector]:[]));
  // Dirt connections use original shader's exact path mask. Stone lots remain
  // explicit draft hints until native paving shader and runtime are connected.
  const mask=mergeDirtPathMask(originalMask,all.flatMap(r=>r.points.slice(1).map((p,i)=>({...r,material:'unsung-dirt',points:[r.points[i],p]}))).filter(r=>r.points.every(p=>Math.max(Math.abs(p.x),Math.abs(p.z))<1015)));
  nativeVisuals.pathPixels.set(mask);
  const tex=nativeVisuals.material.uniforms.uNativePath.value;tex.image.data.set(mask);tex.needsUpdate=true;refreshGrass?.();
 }
 async function preview(plan){
  const temp=new THREE.Group(),lots=new Map(plan.lots.map(l=>[l.id,l]));
  const datums=new Map(plan.lots.map(l=>{const x=l.corners.reduce((n,p)=>n+p.x,0)/4,z=l.corners.reduce((n,p)=>n+p.z,0)/4;return [l.id,sample(x,z).height]}));
  const required=[...new Set(plan.objects.map(o=>o.sourceId))];for(let i=0;i<required.length;i+=8)await Promise.all(required.slice(i,i+8).map(load));
  for(const o of plan.objects){
   const a=lookup(o.sourceId),source=await load(o.sourceId),node=source.clone(true);
   const terrain=sample(o.x,o.z),lot=lots.get(o.lot);
   const base=Number.isFinite(o.y)?o.y-o.yOffset:o.surface==='water'?terrain.waterHeight:lot?.coastal&&o.surface==='shore'?Math.max(terrain.height,terrain.waterHeight):datums.get(o.lot);
   if(!Number.isFinite(base))throw Error('missing support height '+o.id);node.position.set(o.x,base+o.yOffset,o.z);node.rotation.set(o.tilt?.[0]??0,o.yaw,o.tilt?.[1]??0,'YXZ');node.scale.setScalar(o.scale);node.name=o.sourceId;
   temp.add(node);
  }
  // Clear, physical guild label, not a simulated NPC.
  const guild=plan.lots.find(l=>l.role==='guild');if(guild){const x=guild.corners.reduce((s,p)=>s+p.x,0)/4,z=guild.corners.reduce((s,p)=>s+p.z,0)/4;
   const c=document.createElement('canvas');c.width=512;c.height=128;const cx=c.getContext('2d');cx.fillStyle='#261b36';cx.fillRect(0,0,512,128);cx.fillStyle='#ffdf86';cx.font='bold 50px sans-serif';cx.textAlign='center';cx.fillText('GREMIO',256,80);const tex=new THREE.CanvasTexture(c);const marker=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:true}));marker.position.set(x,datums.get(guild.id)+7,z);marker.scale.set(5,1.25,1);temp.add(marker)}
  for(const road of plan.roads.filter(r=>r.material==='unsung-stone')){const points=road.points.map(p=>[p.x,p.z]);const r={id:road.id,type:'road-curved-stone',x:points[0][0],z:points[0][1],width:Math.max(3,road.width),points};if(Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])>=.65)temp.add(makeCurvedCobblestone3D(r,elevation));}
  if(nativeVisuals){const mat=nativeVisuals.material.clone();mat.fragmentShader=mat.fragmentShader.replace('float path=texture(uNativePath,vWorld.xz/2048.0+0.5).r;','float path=1.0;');mat.needsUpdate=true;
   for(const road of plan.roads.concat(plan.connector?[plan.connector]:[]).filter(r=>r.material==='unsung-dirt')){const v=[],idx=[];let n=0;
    for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.001)continue;const count=Math.max(1,Math.ceil(len/.8));
     for(let j=0;j<=count;j++){const t=j/count,x=a.x+dx*t,z=a.z+dz*t;for(const k of [-1,0,1]){const xx=x-dz/len*road.width*.5*k,zz=z+dx/len*road.width*.5*k;v.push(xx,elevation(xx,zz)+.12,zz);}if(j){const q=n-3;idx.push(q,q+3,q+1,q+1,q+3,q+4,q+1,q+4,q+2,q+2,q+4,q+5)}n+=3;}
    }if(v.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const mesh=new THREE.Mesh(g,mat);mesh.userData.road=true;temp.add(mesh);}
   }
  }
  group.add(temp);return temp;
 }
 let busy=false;
 async function generate(id,prefer){
  if(plans.some(p=>p.id===id))return;
  const plan=searchRegion(id,{overview,assetLookup:lookup,sampleTerrain:sample,isOccupied:occupied,existing:plans,prefer:prefer??REGION_HINTS[id]});
  if(!plan.ok){failures.push({id,reason:plan.reason??'modelos faltantes'});setReport();return}
  await preview(plan);plans.push(plan);paths();setReport();render();focus(plan.anchor.x,plan.anchor.z,Math.max(65,plan.bounds.maxX-plan.bounds.minX+20));localStorage.setItem(KEY,JSON.stringify(plans));
 }
 async function run(all){if(busy)return;busy=true;$('hf544-one').disabled=$('hf544-all').disabled=true;try{const ids=all?SETTLEMENTS.filter(p=>p.id!=='japonesa').map(p=>p.id):[select.value];for(const id of ids){status('Buscando parcela nativa: '+id);await new Promise(r=>requestAnimationFrame(r));try{await generate(id,all?null:{x:target.x,z:target.z})}catch(e){failures.push({id,reason:e.message});setReport()}}status('P544: '+plans.length+' pueblos de prueba; '+failures.length+' incidencias. No modifica el RPG.')}finally{busy=false;$('hf544-one').disabled=$('hf544-all').disabled=false}}
 $('hf544-one').onclick=()=>run(false);$('hf544-all').onclick=()=>run(true);
 $('hf544-goto').onclick=()=>{const p=plans.find(p=>p.id===select.value);const q=p?.anchor??REGION_HINTS[select.value];if(q)focus(q.x,q.z,p?Math.max(65,p.bounds.maxX-p.bounds.minX+20):120);};
 $('hf544-clear').onclick=()=>{if(busy)return;for(const child of group.children)disposeCurvedRoadGeometry(child);group.clear();plans.length=0;failures.length=0;paths();localStorage.removeItem(KEY);setReport();render()};
 $('hf544-export').onclick=()=>{const a=document.createElement('a'),blob=new Blob([JSON.stringify({schema:'hf-p544-settlement-drafts',world:'unsung-vale',calibration:SCALE_REFERENCE,plans,failures,readyForGame:false},null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download='HIGHFLY-P544-SETTLEMENTS.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
 window.__hfP544={plans,failures,calibration:SCALE_REFERENCE,generate:()=>run(true)};
 try{
 const res=await fetch(new URL('./p545-native-plans.json',location.href));if(!res.ok)throw Error('No hay planos precomputados');
 const data=await res.json();if(!Array.isArray(data.plans))throw Error('Formato de planos no válido');
 for(const p of data.plans){try{await preview(p);plans.push(p);}catch(e){failures.push({id:p.id,reason:'render: '+e.message})}}
 failures.push(...(data.failures??[]));paths();setReport();render();const p=plans.find(p=>p.id==='arvelia')??plans[0];if(p)focus(p.anchor.x,p.anchor.z,Math.max(85,p.bounds.maxX-p.bounds.minX+25));
 status('P545: '+plans.length+' asentamientos precargados · '+failures.length+' incidencias · selector Ir al pueblo.');
 }catch(e){status('P545: biblioteca 214/214. '+e.message);}

 // Restore only by re-running native validation; saved draft is export only.
}
