/* P55 original-region viewer: one complete imported region at a time, native
 * Unsung landscape remains visible. Source geometry and transforms are preserved.
 * Terrain fusion and game collision are NOT yet enabled.
 */
import * as THREE from 'three';
import {makeContinuousRegion} from './p553-continuous-region.mjs';
import {REGION_THEMES,treeId,shrubId} from './p553-region-sampler.mjs';
const DIR='regions/';
const fetchJson=async path=>{const r=await fetch(new URL(DIR+path,location.href));if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()};
export async function installFullRegionLab({scene,loader,focus,status,render,nativeVisuals,elevation,overview,refreshVegetation}){
 const panel=document.getElementById('guildhall-lab');panel.hidden=false;
 panel.innerHTML='<strong>🏰 P5.5.3 · Biomas naturales</strong><p style="font-size:11px">8 regiones · suelo continuo · árboles Unsung</p><select id="hf55-select" style="width:100%"></select><div id="hf55-teleports" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:7px 0"></div><button id="hf55-open">Vista general</button><button id="hf55-guild">Ir al gremio</button><button id="hf55-home">Volver al inicio</button><button id="hf55-copy">Copiar datos de región</button><a id="hf55-json" style="display:block;color:#d8baff" target="_blank">JSON original</a><pre id="hf55-report" style="white-space:pre-wrap;font-size:10px;max-height:220px;overflow:auto"></pre>';
 const $=id=>document.getElementById(id),sel=$('hf55-select'),report=$('hf55-report');
 const [index,placement,audit]=await Promise.all([fetchJson('source-index.json'),fetchJson('placements.json'),fetchJson('asset-audit.json')]);
 const map=new Map(placement.placements.map(p=>[p.seed,p])),models=new Map(),assets=new Map(audit.assets.map(a=>[a.id,a]));
 for(const r of index.regions){const o=document.createElement('option');o.value=r.seed;o.textContent='Isla '+r.seed+' · '+r.stats.buildings+' edificios / '+r.stats.fields+' campos';sel.append(o)}
 const names=REGION_THEMES;
 const buttons=new Map();
 for(const r of index.regions){const p=map.get(r.seed),b=document.createElement('button');b.type='button';b.textContent='⚑ Isla '+r.seed+' · '+names[r.seed];b.title=p?'X '+p.x+' / Z '+p.z:'Sin parcela';b.style.cssText='white-space:normal;min-height:36px;font-size:11px;line-height:1.2;padding:5px';b.disabled=!p;b.onclick=()=>{sel.value=String(r.seed);summary();open()};$('hf55-teleports').append(b);buttons.set(r.seed,b)}
 const fusion=makeContinuousRegion(nativeVisuals,elevation,overview);
 const group=new THREE.Group();group.name='P55 source region preview';scene.add(group);let current=null,busy=false,activeStats=null;
 const matGround=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),matPath=new THREE.MeshLambertMaterial({color:0xb99a71,side:THREE.DoubleSide}),matWater=new THREE.MeshLambertMaterial({color:0x438eac,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
 function surface(pos,col,mat){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));if(col){g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('aGuildColor',new THREE.Float32BufferAttribute(col,3));}g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.userData.owned=true;return m}
 function clear(){fusion.clear();group.traverse(o=>{if(o.userData.owned)o.geometry?.dispose();if(o.isInstancedMesh)o.dispose()});group.clear();activeStats=null}
 const load=id=>{if(!models.has(id)){const a=assets.get(id);if(!a)throw Error('Modelo no recuperado '+id);models.set(id,loader.loadAsync(new URL(DIR+a.path,location.href).href).then(g=>g.scene).catch(e=>{models.delete(id);throw e}))}return models.get(id)};
 function summary(){const r=index.regions.find(r=>r.seed===Number(sel.value)),p=map.get(r.seed);report.textContent=Object.entries(r.stats).map(([k,v])=>k+': '+v).join('\n')+'\n'+(p?'Parcela candidata X '+p.x+' Z '+p.z+' · base '+p.base.toFixed(1)+' m':'Sin parcela compatible')+'\nBiblioteca '+audit.assets.length+'/'+index.requiredModels.length+' · vista previa, no terreno jugable.'+(activeStats&&current?.seed===r.seed?'\\nVegetación nativa: '+activeStats.replaced+' reemplazados, '+activeStats.recycled+' recuperados, '+activeStats.added+' nuevos.':'');$('hf55-json').href=new URL(DIR+'island-'+r.seed+'.json',location.href).href}
 function cameraRegion(p){focus((p.bounds.minX+p.bounds.maxX)/2,(p.bounds.minZ+p.bounds.maxZ)/2,Math.max(p.bounds.maxX-p.bounds.minX,p.bounds.maxZ-p.bounds.minZ)*.78,p.base+6);refreshVegetation?.();render()}
 function syncButtons(){for(const [seed,b] of buttons){b.disabled=busy||!map.has(seed);b.style.borderColor=current?.seed===seed?'#e7c06a':'';b.setAttribute('aria-pressed',String(current?.seed===seed))}for(const id of ['hf55-open','hf55-home','hf55-guild','hf55-select'])$(id).disabled=busy||(id==='hf55-guild'&&!current)}
 async function open(){
  if(busy)return;const seed=Number(sel.value);if(current?.seed===seed){cameraRegion(map.get(seed));return}busy=true;syncButtons();try{
   const p=map.get(seed);if(!p)throw Error('No hay parcela nativa para esta isla');status('P55: cargando isla original '+seed);
   const d=await fetchJson('island-'+seed+'.json');const tmp=new THREE.Group();tmp.position.set(p.x,p.base,p.z);tmp.scale.setScalar(p.scale);
   const integrated=fusion.build(d,p,assets);
   if(d.structures.position.length)tmp.add(surface(d.structures.position,d.structures.color,matGround));
   const by=new Map();for(const q of d.pieces){if(treeId(q.piece)||shrubId(q.piece))continue;if(!by.has(q.piece))by.set(q.piece,[]);by.get(q.piece).push(q)}
   const ids=[...by.keys()];for(let i=0;i<ids.length;i+=8)await Promise.all(ids.slice(i,i+8).map(load));
   const dummy=new THREE.Object3D(),matrix=new THREE.Matrix4();
   for(const [id,items] of by){const model=await load(id);model.updateMatrixWorld(true);model.traverse(m=>{if(!m.isMesh||m.isSkinnedMesh)return;const instances=new THREE.InstancedMesh(m.geometry,m.material,items.length);items.forEach((q,i)=>{const t=integrated.sampler.nearest(q.x,q.z).t,at=integrated.sampler.sample(p.x+q.x*p.scale,p.z+q.z*p.scale);const shift=t&&t.ground!=='water'&&Math.abs(q.y-t.top)<1.8?Math.max(-1.2,Math.min(1.2,(at.y-p.base)/p.scale-t.top)):0;dummy.position.set(q.x,q.y+shift,q.z);dummy.rotation.set(q.tilt?.[0]??0,q.rot??0,q.tilt?.[1]??0,'YXZ');const scale=q.scale??1;dummy.scale.set(scale*(q.stretch??1),scale,scale);dummy.updateMatrix();matrix.multiplyMatrices(dummy.matrix,m.matrixWorld);instances.setMatrixAt(i,matrix)});instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();tmp.add(instances)})}
   clear();group.add(integrated.group,tmp);fusion.activate(p);current=d;activeStats=integrated.stats;cameraRegion(p);summary();status('Isla '+seed+' · '+activeStats.replaced+' árboles/arbustos reemplazados · '+activeStats.recycled+' reciclados · '+activeStats.added+' nuevos. Colisiones pendientes.');
  }catch(e){status('P55: '+e.message)}finally{busy=false;syncButtons()}
 }
 sel.onchange=summary;$('hf55-open').onclick=open;$('hf55-home').onclick=()=>{if(busy)return;clear();current=null;syncButtons();focus(placement.spawn.x,placement.spawn.z,100);refreshVegetation?.();render();status('Inicio original conservado')};
 $('hf55-guild').onclick=()=>{if(busy||!current)return;const p=map.get(current.seed),board=current.board,zone=Array.isArray(current.zones)?current.zones.find(z=>z.kind==='castle'):null,t=Number.isFinite(board?.x)&&Number.isFinite(board?.z)?{x:board.x,z:board.z,top:board.y??0}:current.tiles.find(t=>t.i===zone?.tile)??current.tiles.find(t=>/guild|hall|castle/.test(t.prefab??''));if(!t){status('Gremio: no se encontró el centro de la región');return}focus(p.x+t.x*p.scale,p.z+t.z*p.scale,65,p.base+t.top*p.scale);refreshVegetation?.();render();status('Centro del gremio · Isla '+current.seed)};
 $('hf55-copy').onclick=async()=>{try{const d=current?.seed===Number(sel.value)?current:await fetchJson('island-'+sel.value+'.json');await navigator.clipboard.writeText(JSON.stringify(d));status('Datos de la isla copiados. Importador jugable pendiente.')}catch(e){status('No se pudo copiar: '+e.message)}};
 // Mark each proposed footprint on the existing world, without altering native terrain.
 for(const p of placement.placements){const g=new THREE.RingGeometry(9,12,32);g.rotateX(-Math.PI/2);const ring=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffce69,side:THREE.DoubleSide}));ring.position.set(p.x,p.base+5,p.z);scene.add(ring)}
 summary();syncButtons();status('P553: '+index.regions.length+' islas originales · '+placement.placements.length+' parcelas candidatas. El inicio de Unsung permanece intacto.');
}
