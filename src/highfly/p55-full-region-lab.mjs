/* P55 original-region viewer: one complete imported region at a time, native
 * Unsung landscape remains visible. Source geometry and transforms are preserved.
 * Terrain fusion and game collision are NOT yet enabled.
 */
import * as THREE from 'three';
import {makeRegionFusion} from './p551-region-fusion.mjs';
const DIR='regions/';
const fetchJson=async path=>{const r=await fetch(new URL(DIR+path,location.href));if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()};
export async function installFullRegionLab({scene,loader,focus,status,render,nativeVisuals,elevation,refreshVegetation}){
 const panel=document.getElementById('guildhall-lab');panel.hidden=false;
 panel.innerHTML='<strong>🏰 P5.5.1 · Guildhall original</strong><p style="font-size:11px">8 regiones completas · sin NPC · fusión visual de terreno</p><select id="hf55-select" style="width:100%"></select><button id="hf55-open">Ver isla completa</button><button id="hf55-home">Volver al inicio</button><button id="hf55-copy">Copiar datos de región</button><a id="hf55-json" style="display:block;color:#d8baff" target="_blank">JSON original</a><pre id="hf55-report" style="white-space:pre-wrap;font-size:10px;max-height:220px;overflow:auto"></pre>';
 const $=id=>document.getElementById(id),sel=$('hf55-select'),report=$('hf55-report');
 const [index,placement,audit]=await Promise.all([fetchJson('source-index.json'),fetchJson('placements.json'),fetchJson('asset-audit.json')]);
 const map=new Map(placement.placements.map(p=>[p.seed,p])),models=new Map(),assets=new Map(audit.assets.map(a=>[a.id,a]));
 for(const r of index.regions){const o=document.createElement('option');o.value=r.seed;o.textContent='Isla '+r.seed+' · '+r.stats.buildings+' edificios / '+r.stats.fields+' campos';sel.append(o)}
 const fusion=makeRegionFusion(nativeVisuals,elevation);
 const group=new THREE.Group();group.name='P55 source region preview';scene.add(group);let current=null,busy=false;
 const matGround=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),matPath=new THREE.MeshLambertMaterial({color:0xb99a71,side:THREE.DoubleSide}),matWater=new THREE.MeshLambertMaterial({color:0x438eac,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
 function surface(pos,col,mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(col){g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('aGuildColor',new THREE.Float32BufferAttribute(col,3));}g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.userData.owned=true;return m}
 function clear(){fusion.clear();group.traverse(o=>{if(o.userData.owned)o.geometry?.dispose()});group.clear()}
 const load=id=>{if(!models.has(id)){const a=assets.get(id);if(!a)throw Error('Modelo no recuperado '+id);models.set(id,loader.loadAsync(new URL(DIR+a.path,location.href).href).then(g=>g.scene).catch(e=>{models.delete(id);throw e}))}return models.get(id)};
 function summary(){const r=index.regions.find(r=>r.seed===Number(sel.value)),p=map.get(r.seed);report.textContent=Object.entries(r.stats).map(([k,v])=>k+': '+v).join('\n')+'\n'+(p?'Parcela candidata X '+p.x+' Z '+p.z+' · base '+p.base.toFixed(1)+' m':'Sin parcela compatible')+'\nBiblioteca '+audit.assets.length+'/'+index.requiredModels.length+' · vista previa, no terreno jugable.';$('hf55-json').href=new URL(DIR+'island-'+r.seed+'.json',location.href).href}
 async function open(){
  if(busy)return;busy=true;$('hf55-open').disabled=true;const seed=Number(sel.value);try{
   const p=map.get(seed);if(!p)throw Error('No hay parcela nativa para esta isla');status('P55: cargando isla original '+seed);
   const d=await fetchJson('island-'+seed+'.json');const tmp=new THREE.Group();tmp.position.set(p.x,p.base,p.z);tmp.scale.setScalar(p.scale);
   tmp.add(surface(d.ground.position,d.ground.color,fusion.groundMaterial));
   if(d.structures.position.length)tmp.add(surface(d.structures.position,d.structures.color,matGround));
   if(d.paths.length)tmp.add(surface(d.paths,null,fusion.pathMaterial));
   // Native water surface positions retained from original island, including inland pools and shallows.
   const water=[],R=d.tileRadius;for(const t of d.tiles.filter(t=>t.ground==='water')){const y=t.top-.14>-.05?t.top-.14:-.05;for(let j=0;j<6;j++){const a=(j*60-30)*Math.PI/180,b=((j+1)*60-30)*Math.PI/180;water.push(t.x,y,t.z,t.x+Math.cos(b)*R,y,t.z+Math.sin(b)*R,t.x+Math.cos(a)*R,y,t.z+Math.sin(a)*R)}}
   if(water.length)tmp.add(surface(water,null,matWater));
   const by=new Map();for(const q of d.pieces){if(!by.has(q.piece))by.set(q.piece,[]);by.get(q.piece).push(q)}
   const ids=[...by.keys()];for(let i=0;i<ids.length;i+=8)await Promise.all(ids.slice(i,i+8).map(load));
   const dummy=new THREE.Object3D(),matrix=new THREE.Matrix4();
   for(const [id,items] of by){const model=await load(id);model.updateMatrixWorld(true);model.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh)return;const instances=new THREE.InstancedMesh(m.geometry,m.material,items.length);items.forEach((q,i)=>{dummy.position.set(q.x,q.y,q.z);dummy.rotation.set(q.tilt?.[0]??0,q.rot,q.tilt?.[1]??0,'YXZ');dummy.scale.set(q.scale*(q.stretch??1),q.scale,q.scale);dummy.updateMatrix();matrix.multiplyMatrices(dummy.matrix,m.matrixWorld);instances.setMatrixAt(i,matrix)});instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();tmp.add(instances)})}
   const apron=fusion.apron(d,p);clear();group.add(apron,tmp);fusion.activate(p);current=d;focus(p.x,p.z,Math.max(p.bounds.maxX-p.bounds.minX,p.bounds.maxZ-p.bounds.minZ)*.78,p.base+6);refreshVegetation?.();render();status('Isla '+seed+' · '+d.pieces.length+' piezas originales. Fusión visual de terreno activa. Colisiones y enlace vial pendientes.');
  }catch(e){status('P55: '+e.message)}finally{busy=false;$('hf55-open').disabled=false}
 }
 sel.onchange=summary;$('hf55-open').onclick=open;$('hf55-home').onclick=()=>{clear();current=null;focus(placement.spawn.x,placement.spawn.z,100);refreshVegetation?.();render();status('Inicio original conservado')};
 $('hf55-copy').onclick=async()=>{try{const d=current?.seed===Number(sel.value)?current:await fetchJson('island-'+sel.value+'.json');await navigator.clipboard.writeText(JSON.stringify(d));status('Datos de la isla copiados. Importador jugable pendiente.')}catch(e){status('No se pudo copiar: '+e.message)}};
 // Mark each proposed footprint on the existing world, without altering native terrain.
 for(const p of placement.placements){const g=new THREE.RingGeometry(9,12,32);g.rotateX(-Math.PI/2);const ring=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffce69,side:THREE.DoubleSide}));ring.position.set(p.x,p.base+5,p.z);scene.add(ring)}
 summary();status('P55: '+index.regions.length+' islas originales · '+placement.placements.length+' parcelas candidatas. El inicio de Unsung permanece intacto.');
}
