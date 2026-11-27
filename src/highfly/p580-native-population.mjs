// HIGHFLY P580: original Guildhall day plans, stylized CC0 bodies, persistent RPG interaction.
// One renderer, logical population retained, closest residents rendered within a fixed budget.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {stylizeUniversalKayKit,appendSharedRigAnimations} from './stylize-kaykit-free.mjs';
import {affinityOnce,relationship,npcBudget} from './p581-reforged-policy.mjs';
const BASE=import.meta.env.BASE_URL+'highfly/living-p580/',REGION=import.meta.env.BASE_URL+'highfly/regions-p575/';
const KEY='hf-p580-native-residents-v1',LIMIT=24,NEAR=85,ANIM=45;
const roleNames={merchant:'Comerciante',smith:'Herrero',farmer:'Agricultor',fisher:'Pescador',miner:'Minero',lumberjack:'Leñador',guard:'Guardia','night-watch':'Vigilante',monk:'Monje',archer:'Arquero',soldier:'Soldado',knight:'Caballero',bard:'Bardo',lamplighter:'Farolero','tavern-keeper':'Tabernero',mage:'Mago'};
const lore={arvelia:'El gremio de Arvelia guarda los primeros registros del renacimiento.',puertaria:'Los pescadores oyen ecos extraños en la costa desde la restauración del Valle.',valdoria:'Las cosechas se recuperan, pero algunos campos siguen mostrando señales de la Fractura.',sylvaris:'Los árboles conservan ecos de la antigua magia.',ferrondral:'Las minas revelaron vetas que brillan al caer la noche.',lumeria:'Las caravanas traen noticias de los otros reinos.',auralis:'Los estudiosos investigan la Novena Voz.',valtheria:'Las fortalezas vigilan los cambios en las fronteras.'};
const replies={farmer:['Si cuidamos la tierra, ella cuidará de nosotros.','La cosecha es el sustento de muchas familias.'],fisher:['El viento nos dice cuándo salir al agua.','Hay días en que el mar devuelve cosas que nadie esperaba.'],smith:['Un buen filo lleva horas de paciencia.','Necesitamos materiales para que el taller siga trabajando.'],miner:['Nunca hay que entrar solo en una galería desconocida.','Las piedras de este valle guardan historias.'],merchant:['Cada viajero trae noticias distintas.','Sin caminos seguros no hay comercio.'],guard:['Las rondas no terminan cuando cae la noche.','No todos los peligros vienen de fuera de las murallas.'],bard:['Las canciones conservan lo que los libros olvidan.','Algún día contaré la historia de los aventureros de este valle.']};
const roleText={merchant:'Las rutas comerciales mantienen unida Aetheria.',smith:'El metal responde a la paciencia y al fuego.',farmer:'Cada cosecha necesita tiempo y manos cuidadosas.',fisher:'El agua trae sustento y secretos.',miner:'La roca esconde riquezas y peligros.',lumberjack:'El bosque merece respeto.',guard:'Mi deber es mantener el camino seguro.',monk:'La Novena Voz todavía resuena en el Valle.',bard:'Cada pueblo tiene una historia que merece una canción.'};
const jobs={farmer:{action:'harvest',count:1,title:'Una cosecha para el pueblo'},fisher:{action:'fishing',count:2,title:'Provisiones de la costa'},miner:{action:'mine',count:2,title:'Mineral para el taller'},lumberjack:{action:'chop',count:2,title:'Madera para el pueblo'}};
const models={knight:'Knight',barbarian:'Barbarian',mage:'Mage',rogue:'Rogue','rogue-hooded':'Rogue_Hooded',ranger:'Rogue'};
const names=['Aren','Liora','Taren','Maren','Iria','Darian','Nila','Kael','Eira','Nolan','Rin','Thalia','Oren','Lyra','Alden','Mila'];
const colors=['#d9c7b2','#a8c2e4','#c0d2a4','#e1b4a8','#d8c5ed','#b3b4c6','#e6d4aa','#a4ccc4'];
const random=(id,salt=0)=>{let x=2166136261;for(const ch of String(id)+':'+salt)x=Math.imul(x^ch.charCodeAt(0),16777619);return (x>>>0)/4294967296};
const choose=(a,id,salt)=>a?.length?a[Math.min(a.length-1,Math.floor(random(id,salt)*a.length))]:null;
const norm=n=>(n??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const get=async url=>{const r=await fetch(url);if(!r.ok)throw Error('Living World '+r.status+' '+url);return r.json()};
export function installNativePopulation(game,pipe,forge){
 const root=new THREE.Group();root.name='HF580_NATIVE_POPULATION';pipe.scene.add(root);
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),ktx=new KTX2Loader().setTranscoderPath(import.meta.env.BASE_URL+'highfly/basis/').detectSupport(pipe.renderer);loader.setKTX2Loader(ktx);
 const plans=new Map(),materials=new Map(),bodyQueue=new Map(),bodies=new Map(),props=new Map(),fallbackClips=new Set(),unmounted=new Set(),bodyErrors=new Set();
 let sharedRig=null,rigReport={},qaHour=null,dependencies=null,region=null,records=[],active=[],generation=0,lastScan=-Infinity,scanHour=null,scanRevision=0,selected=null,lastAffinity=0,drawBudget=16,frameMs=16,lastFrame=0,lastBudget=0,loadError=null,ready=false,lastHour=12,wetRejected=0;
 let state={};try{const value=JSON.parse(localStorage.getItem(KEY)||'{}');if(value&&typeof value==='object')state=value}catch{}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
 const panel=document.createElement('section');panel.id='hf-native-dialogue';panel.hidden=true;panel.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(400px,75vw);max-height:72vh;overflow:auto;z-index:100015;background:#1a152af8;color:#f2e5cf;border:1px solid #b58be7;border-radius:12px;padding:15px;font:13px system-ui';document.body.append(panel);
 const dep=()=>dependencies??=Promise.all([get(BASE+'recipes.json'),import(/* @vite-ignore */ BASE+'native-life.mjs'),get(REGION+'asset-audit.json'),get(BASE+'mounts.json').catch(()=>({mounts:{}})),get(BASE+'prop-audit.json').catch(()=>({assets:[],rig:null}))]).then(([recipes,life,audit,mounts,extra])=>({recipes,life,assets:new Map([...audit.assets,...extra.assets].map(a=>[a.id,a])),mounts:mounts.mounts??{},rig:extra.rig}));
 const rig=()=>sharedRig??=dep().then(d=>d.rig?loader.loadAsync(BASE+'rig-medium.glb').catch(()=>null):null);
 const planFor=seed=>{if(!plans.has(seed))plans.set(seed,get(BASE+'region-'+seed+'.json').catch(e=>{plans.delete(seed);throw e}));return plans.get(seed)};
 const prefetch=seed=>Promise.all([dep(),planFor(seed)]).then(()=>true);
 const materialFor=(base,tint)=>{const key=(base?.map?.uuid??'plain')+':'+tint;if(!materials.has(key))materials.set(key,new THREE.MeshBasicMaterial({map:base?.map??null,color:tint,side:THREE.DoubleSide,transparent:!!base?.transparent,alphaTest:base?.alphaTest??0}));return materials.get(key)};
 const model=name=>{if(!bodies.has(name))bodies.set(name,Promise.all([loader.loadAsync(BASE+'models/'+name+'.glb'),rig()]).then(([g,r])=>{if(r)rigReport[name]=appendSharedRigAnimations(g,r);return {g,actual:name,profile:stylizeUniversalKayKit(g,{npc:true})}}).catch(e=>{bodyErrors.add(name+': '+String(e));if(name==='Knight')throw e;return model('Knight')}));return bodies.get(name)};
 const loadProp=(id,asset)=>{if(!props.has(id))props.set(id,loader.loadAsync(REGION+asset.path).then(g=>g.scene).catch(e=>{unmounted.add(id);return null}));return props.get(id)};
 function clearActor(n){bodyQueue.delete(n.id);if(n.actor){n.mixer?.stopAllAction();if(n.body)n.mixer?.uncacheRoot(n.body);n.actor.traverse(o=>{if(o.userData.hfNpcTag){o.material.map?.dispose();o.material.dispose()}});n.actor.removeFromParent()}n.actor=null;n.body=null;n.mixer=null;n.action=null;n.clip=null;n.loading=false;n.attached=new Map();n.serial=(n.serial??0)+1;n.lastDraw=-Infinity}
 function clear(){generation++;bodyQueue.clear();scanHour=null;for(const n of records)clearActor(n);root.clear();region=null;records=[];active=[];selected=null;panel.hidden=true;ready=false;lastScan=-Infinity;lastFrame=0;loadError=null}
 function tag(n){const c=document.createElement('canvas');c.width=512;c.height=112;const ctx=c.getContext('2d');ctx.fillStyle='#1c152cdd';ctx.fillRect(0,0,512,112);ctx.fillStyle=n.stylist?'#e9c36a':'#eee2cd';ctx.font='bold 34px system-ui';ctx.textAlign='center';ctx.fillText((n.stylist?'✦ ':n.quest?'! ':'')+n.def.name,256,47);ctx.font='26px system-ui';ctx.fillText(n.stylist?'Estilista':n.def.role,256,88);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthWrite:false}));s.scale.set(2.5,.54,1);s.position.y=2.2;s.userData.hfNpcTag=true;s.visible=false;return s}
 function actor(n){
  if(n.actor||n.loading)return;
  n.loading=true;const token=generation,serial=n.serial??0;
  model(n.modelName).then(({g,profile})=>{
   if(token!==generation||serial!==(n.serial??0)||!active.includes(n))return;
   bodyQueue.set(n.id,()=>{
   if(token!==generation||serial!==(n.serial??0)||!active.includes(n)){n.loading=false;return}
   const a=new THREE.Group();a.name='HF580_'+n.id;const b=cloneSkeleton(g.scene);const scale=(1.82/profile.naturalHeight)*n.height;const bodyHolder=new THREE.Group();bodyHolder.scale.setScalar(scale);bodyHolder.add(b);
   b.traverse(o=>{if(!o.isMesh)return;const name=o.name??'';
    if(n.recipe.hide?.includes(name)||/sword|shield|dagger|quiver|bow|staff|wand|hammer|axe|book/i.test(name)&&!/_Body$|_Head$|_ArmLeft$|_ArmRight$|_LegLeft$|_LegRight$/i.test(name))o.visible=false;
    const mat=Array.isArray(o.material)?o.material[0]:o.material;
    o.material=materialFor(mat,/_Head$|hood/i.test(name)?0xffffff:n.tint);o.frustumCulled=false;
    if(o.isSkinnedMesh&&o.visible){o.onAfterRender=(renderer,scene)=>{if(scene===pipe.scene){n.lastDraw=performance.now();n.drawCalls=(n.drawCalls??0)+1}}}

   });
   a.add(bodyHolder);const t=tag(n);a.add(t);pipe.scene.add(a);a.position.set(n.x??0,n.y??0,n.z??0);a.updateMatrixWorld(true);
   n.actor=a;n.body=b;n.tag=t;n.mixer=new THREE.AnimationMixer(b);n.clips=new Map(g.animations.map(c=>[c.name,c]));n.modelScale=scale;n.loading=false;n.attached=new Map();n.actor.visible=false;n.lastDraw=-Infinity;n.drawCalls=0;
   });
  }).catch(e=>{if(token===generation&&serial===(n.serial??0)){n.loading=false;loadError=String(e)}})
 }
 function mount(r){
  clear();region=r;const token=generation;
  Promise.all([dep(),planFor(r.p.seed)]).then(([d,plan])=>{
   if(token!==generation)return;
   if(plan.seed!==r.p.seed||plan.sourceSeed!==r.d.sourceSeed||plan.folk.length!==plan.summary.population)throw Error('Population seed mismatch');
   const usedRoles=new Set();let stylistAssigned=false;
   records=plan.folk.map(f=>{
    const id='r'+r.p.seed+'-folk-'+f.id,recipe=d.recipes[f.role],role=roleNames[f.role]??f.role;
    const modelOptions=(recipe.body??[]).map(x=>models[x.split('/').at(-1)]).filter(Boolean);
    const stylist=!stylistAssigned&&f.role==='merchant';if(stylist)stylistAssigned=true;
    const quest=!stylist&&jobs[f.role]&&!usedRoles.has(f.role)?{...jobs[f.role],reward:25}:null;if(quest)usedRoles.add(f.role);
    const def={id,name:stylist?'Estilista de '+plan.city:choose(names,id,1)+' '+String(f.id+1),role:stylist?'Estilista':role,text:roleText[f.role]??'Que la llama del Fénix te acompañe.'};
    return {id,f,recipe,def,city:plan.city,native:true,stylist,quest,modelName:choose(modelOptions,id,2)??'Knight',height:.96+random(id,3)*.08,tint:choose(colors,id,4),d,actor:null,loading:false,serial:0,attached:new Map()};
   });ready=true;
  }).catch(e=>{if(token===generation){loadError=String(e);console.error('[HF580 population]',e)}})
 }
 function hour(){if(qaHour!==null)return qaHour;const h=Number(globalThis.__hfP508Climate?.phase);return Number.isFinite(h)?((h%1+1)%1)*24:12}
 function pose(n,h){
  const p=region.p,i=region.integrated,v=n.d.life.lifePose(n.f.day,h,24),at=v.at;
  let x=p.x+at[0]*p.scale,z=p.z+at[2]*p.scale,y=p.base+at[1]*p.scale;
  let routine=null;
  if(v.routine){const t=n.d.life.routineClock(v.routine,Math.max(0,h-(v.since??h))*112.5,h,112.5);routine=n.d.life.routineSample(v.routine,t);if(routine.shift){x+=routine.shift[0]*p.scale;z+=routine.shift[1]*p.scale}}
  if(v.ground){const h=i.gridHeight(x,z),w=i.gridWater(x,z);if(!Number.isFinite(h)||Number.isFinite(w)&&w>h+.25)return null;y=h}
  y+=(v.lift??0)*p.scale;
  return {x,y,z,v,routine,facing:v.facing+(routine?.turn??0)}
 }
 function findClip(n,want,act){if(n.clips.has(want))return want;const aliases={Idle_A:'Idle',Idle_B:'Idle',Melee_Blocking:'Block',Melee_Block:'Block',Melee_1H_Attack_Chop:'1H_Melee_Attack_Chop',Melee_2H_Attack_Chop:'2H_Melee_Attack_Chop',Sawing:'Saw',Holding_A:'Idle',Holding_C:'Idle'};if(n.clips.has(aliases[want])){fallbackClips.add(want+'→'+aliases[want]);return aliases[want]}const fallback=act==='walk'?'Walking_A':act==='work'&&n.clips.has('Working_A')?'Working_A':'Idle';if(want!==fallback)fallbackClips.add(want+'→'+fallback);return n.clips.has(fallback)?fallback:n.clips.keys().next().value}
 function attach(n,id,clip,slotHint){
  const asset=n.d.assets.get(id),mount=n.d.mounts[id];if(!asset||!mount){unmounted.add(id);return}
  const slot=slotHint&&(slotHint===mount.slot||mount.alt?.includes(slotHint))?slotHint:mount.slot;
  const key=id+':'+slot;if(n.attached.has(key)){const a=n.attached.get(key);if(a?.pivot)a.pivot.visible=!mount.clips?.[clip]?.hide;return}
  n.attached.set(key,null);const serial=n.serial,body=n.body;
  loadProp(id,asset).then(template=>{if(!template||serial!==n.serial||body!==n.body)return;
   let bone=null;const boneName={'hand.r':'handslotr','hand.l':'handslotl',head:'head',chest:'chest',back:'chest'}[slot];body.traverse(o=>{if(o.isBone&&norm(o.name)===boneName)bone=o});if(!bone){unmounted.add(id);return}
   const vec=a=>new THREE.Vector3(...a),edge=slot==='hand.l'?[-1,0,0]:slot==='head'||slot==='chest'?[0,0,1]:slot==='back'?[0,0,-1]:[1,0,0],along=[0,1,0];
   const pa=vec(mount.axis),pe=vec(mount.edge),sa=vec(along),se=vec(edge);
   const P=new THREE.Matrix4().makeBasis(pe,pa,new THREE.Vector3().crossVectors(pe,pa)),S=new THREE.Matrix4().makeBasis(se,sa,new THREE.Vector3().crossVectors(se,sa));
   const rot=new THREE.Quaternion().setFromRotationMatrix(S.multiply(P.transpose())),scale=(mount.scale??1)*.75;
   const pivot=new THREE.Group(),piece=template.clone(true);piece.quaternion.copy(rot);piece.scale.setScalar(scale);piece.position.copy(vec(mount.handle).multiplyScalar(-scale).applyQuaternion(rot));pivot.add(piece);bone.add(pivot);pivot.visible=false;n.attached.set(key,{pivot,id,slot});
  })
 }
 function render(n,p,h,dt){
  if(!n.actor)return;
  const q=pose(n,h);if(!q||q.v.indoors){n.actor.visible=false;return}n.x=q.x;n.y=q.y;n.z=q.z;
  n.actor.position.set(q.x,q.y,q.z);n.actor.rotation.y=selected===n?Math.atan2(p.x-q.x,p.z-q.z):q.facing;n.actor.visible=true;n.tag.visible=Math.hypot(p.x-q.x,p.z-q.z)<13;
  const d=Math.hypot(p.x-q.x,p.z-q.z);if(d>ANIM){n.actor.updateMatrixWorld(true);return;} if(d>20&&performance.now()-(n.animAt??0)<83){n.actor.updateMatrixWorld(true);return;}n.animAt=performance.now();
  const v=q.v,r=q.routine,want=selected===n?'Idle_A':r?.clip??v.clip??(v.act==='walk'?n.recipe.activity.walk:v.act==='work'?n.recipe.activity.work:choose(n.recipe.activity.idle,n.id,5));
  const clip=findClip(n,want,v.act);if(clip&&n.clip!==clip){n.action?.stop();n.action=n.mixer.clipAction(n.clips.get(clip));n.action.reset().play();n.clip=clip}
  if(n.action){if(r&&n.clip===r.clip&&selected!==n){n.action.paused=true;n.action.time=r.phase*n.action.getClip().duration;n.mixer.update(0)}else{n.action.paused=false;n.mixer.update(Math.min(.05,dt))}}
  const desired=new Set();if(selected!==n){for(const id of r?.props??(v.prop?[v.prop]:v.act==='work'&&n.f.prop?[n.f.prop]:[]))if(id)desired.add(id);if(v.carry)desired.add(v.carry);if(v.act==='work'&&!desired.size){for(const id of [choose(n.recipe.hands?.r,n.id,6),choose(n.recipe.hands?.l,n.id,7)])if(id)desired.add(id)}}
  for(const a of n.attached.values())if(a)a.pivot.visible=desired.has(a.id)&&!n.d.mounts[a.id]?.clips?.[clip]?.hide;
  for(const id of desired)attach(n,id,clip);
  n.actor.updateMatrixWorld(true);
 }
 function update(dt){
  const p=game.player?.pos;if(!ready||!region||!p)return;const h=hour();const now=performance.now();if(lastFrame)frameMs=frameMs*.92+Math.min(250,now-lastFrame)*.08;lastFrame=now;if(now-lastBudget>1800){drawBudget=npcBudget(frameMs,drawBudget);lastBudget=now}
  if(now-lastScan>300){lastScan=now;const candidates=[];wetRejected=0;
   for(const n of records){const q=pose(n,h);if(!q){wetRejected++;n.x=n.y=n.z=null;n.indoors=true;continue}n.x=q.x;n.y=q.y;n.z=q.z;n.indoors=q.v.indoors;if(q.v.indoors)continue;const distance=Math.hypot(p.x-q.x,p.z-q.z);if(distance<NEAR)candidates.push({n,distance})}
   candidates.sort((a,b)=>a.distance-b.distance);const next=candidates.slice(0,Math.min(LIMIT,drawBudget)).map(q=>q.n);if(selected&&!next.includes(selected)){selected=null;panel.hidden=true}
   for(const n of active)if(!next.includes(n))clearActor(n);active=next;for(const n of active)actor(n);scanHour=h;scanRevision++;
  }
  // Run only the closest valid queued job per frame; discarded actors cannot enqueue stale work.
  for(const n of active){const job=bodyQueue.get(n.id);if(!job)continue;bodyQueue.delete(n.id);try{job()}catch(e){n.loading=false;loadError=String(e)}break;}
  lastHour=h;
  const camera=game.rig?.camera;
  const frustum=camera?new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)):null;
  const bounds=new THREE.Sphere(new THREE.Vector3(),2.5);
  for(const n of active){render(n,p,h,dt);if(!n.actor?.visible)continue;
   const dist=Math.hypot(n.x-p.x,n.z-p.z);bounds.center.set(n.x,n.y+1,n.z);
   // Keep immediate interaction range available even if the camera looks elsewhere.
   if(frustum&&dist>6&&!frustum.intersectsSphere(bounds))n.actor.visible=false;
   if(n.actor.visible){if(n.actor.parent!==pipe.scene)pipe.scene.add(n.actor);n.actor.updateMatrixWorld(true)}
  }
  if(selected&&Math.hypot(p.x-selected.x,p.z-selected.z)>4.5){selected=null;panel.hidden=true}
 }
 const near=p=>!p?null:active.filter(n=>n.actor?.visible&&Math.abs(n.y-p.y)<2&&Math.hypot(n.x-p.x,n.z-p.z)<3.1).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0]??null;
 function getState(n){return state[n.id]??=( {affinity:0,status:n.quest?'available':'none',progress:0})}
 function draw(n,message=null,stage='greeting'){
  selected=n;panel.hidden=false;panel.replaceChildren();const q=getState(n);
  const add=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;panel.append(el);return el};
  const btn=(label,fn)=>{const b=add('button',label);b.style.cssText='margin:4px;padding:8px;background:#39264e;border:1px solid #b58ae4;color:white;border-radius:6px';b.onclick=fn};
  add('strong',n.def.name+' · '+n.def.role);add('p',relationship(q.affinity)+' · Afinidad '+q.affinity);
  const greeting=lastHour<6||lastHour>=20?'Buenas noches':lastHour<12?'Buen día':'Buenas tardes';
  add('p',message??(q.affinity<0?'Preferiría seguir con mi trabajo.':greeting+', aventurero. '+n.def.text));
  const decide=(id,delta)=>{affinityOnce(q,id,delta);save()};
  if(stage==='greeting'){
   btn('¿Cómo va tu trabajo?',()=>{decide('first-respect',2);draw(n,(replies[n.f.role]??[n.def.text])[0],'work')});
   btn('¿Qué sabés del Valle?',()=>draw(n,lore[n.city]??'La llama del Fénix todavía nos guía.','lore'));
   if(!q.decisions?.first-disrespect)btn('No tengo tiempo para tus problemas.',()=>{decide('first-disrespect',-3);draw(n,'Entiendo. No te quitaré más tiempo.','end')});
  }else if(stage==='work'){btn('Contame un poco más',()=>draw(n,(replies[n.f.role]??[n.def.text,n.def.text])[1],'detail'));btn('Volver a conversar',()=>draw(n));}
  else if(stage!=='end')btn('Volver a conversar',()=>draw(n));
  if(n.stylist)btn('Cambiar mi apariencia',()=>{if(forge.open('stylist')){panel.hidden=true;selected=null}});
  if(n.quest){add('p',n.quest.title+' · '+q.progress+'/'+n.quest.count+' · '+q.status);
   if(q.status==='available')btn('Aceptar misión secundaria',()=>{q.status='active';save();draw(n,'Gracias, aventurero.')});
   if(q.status==='ready')btn('Entregar misión',()=>{if(typeof game.__highflyRpg?.livingAward!=='function')return;q.status='done';q.affinity=Math.min(100,q.affinity+10);game.__highflyRpg.livingAward(n.quest.reward);save();draw(n,'Misión completada.')});
  }

  btn('Cerrar',()=>{selected=null;panel.hidden=true});
 }
 function talk(p){const n=near(p);if(!n)return false;draw(n);return true}
 function record(e){if(!region||!e?.ok)return;for(const n of records){const q=state[n.id];if(n.quest?.action===e.action&&q?.status==='active'){q.progress=Math.min(n.quest.count,q.progress+1);if(q.progress>=n.quest.count)q.status='ready'}}save()}
 const api={mount,clear,update,near,talk,record,prefetch,get ready(){return ready},qaHour:h=>{if(new URLSearchParams(location.search).get('hfqa')!=='1')return false;qaHour=Number.isFinite(h)?((h%24+24)%24):null;lastScan=-Infinity;return true},qaModels:async()=>{if(new URLSearchParams(location.search).get('hfqa')!=='1')return [];return Promise.all(['Knight','Barbarian','Mage','Rogue','Rogue_Hooded'].map(async name=>{const m=await model(name);return {name,actual:m.actual,profile:m.profile}}))},get residents(){return records.map(n=>({id:n.id,role:n.def.role,stylist:n.stylist,x:n.x,y:n.y,z:n.z,visible:!!n.actor?.visible,drawn:performance.now()-(n.lastDraw??-Infinity)<750,drawCalls:n.drawCalls??0,indoors:!!n.indoors}))},metrics:()=>({seed:region?.p.seed??null,ready,population:records.length,visible:active.filter(n=>n.actor?.visible).length,active:active.length,drawBudget,frameMs,queuedBodies:bodyQueue.size,scanHour,scanRevision,drawn:active.filter(n=>performance.now()-(n.lastDraw??-Infinity)<750).length,hour:lastHour,wetRejected,bodyErrors:[...bodyErrors],fallbackClips:[...fallbackClips],rigReport,unmounted:[...unmounted],loadError})};
 globalThis.__hfNativePopulation=api;return api;
}
