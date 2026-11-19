/** HIGHFLY F0.1: Android-native analog 360° with original Unsung Input/Player. */
export const isTouchDevice=()=>/Android/i.test(globalThis.navigator?.userAgent??'')||!!globalThis.matchMedia?.('(pointer:coarse)')?.matches;

import {installHudEditor} from '../highfly/hud-editor.mjs';
/** Pure vector calculation; 8-way + continuous 360° testable without a browser. */
export function joystickVector(rect,px,py,deadzone=0.07){
 const radius=Math.max(1,Math.min(rect.width,rect.height)*0.5-9);
 let dx=(px-(rect.left+rect.width*0.5))/radius;
 let dy=(py-(rect.top+rect.height*0.5))/radius;
 const distance=Math.hypot(dx,dy);
 if(!Number.isFinite(distance)||distance<=deadzone)return {x:0,y:0};
 const amplitude=Math.min(1,Math.max(0,(distance-deadzone)/(1-deadzone)));
 const scale=amplitude/distance;
 dx*=scale;dy*=scale;
 // Unsung expects x = lateral right and y = camera-forward, like WASD.
 return {x:Math.abs(dx)<1e-12?0:dx,y:Math.abs(dy)<1e-12?0:-dy};
}
/** Drag from ability circle (not from walking joystick).
 * Screen right => x+; screen up => y+; reject tiny accidental drags.
 */
export function abilityVector(dx,dy,deadzone=9){
 const length=Math.hypot(dx,dy);
 if(!Number.isFinite(length)||length<deadzone)return null;
 return {x:dx===0?0:dx/length,y:dy===0?0:-dy/length};
}
export function resolveHighflyContext(p){
 const fallback={action:'climb',label:'TREPAR'};
 if(!p?.world||!p?.pos)return fallback;
 const w=p.world,fx=Math.sin(p.yaw),fz=Math.cos(p.yaw);
 // In water, wall contact takes priority over diving.
 if(p.state==='swim'){
  const d=typeof w.raycast==='function'?w.raycast(
    {x:p.pos.x,y:p.pos.y+.87,z:p.pos.z},{x:fx,y:0,z:fz},1.08):Infinity;
  if(d>.06&&d<.96)return {action:'climb',label:'TREPAR'};
  return {action:'dive',label:p._hfDive?'SUPERFICIE':'BUCEAR'};
 }
 // Harvest targets must have explicit resource tags, never generic rock collisions.
 const actions={tree:['chop','TALAR'],ore:['mine','PICAR']}; // loot always uses USAR
 const candidates=Array.isArray(w.highflyInteractables)?w.highflyInteractables:[];
 let best=null,dist=4;
 for(const n of candidates){
   if(n.available===false||!actions[n.kind])continue;
   const dx=n.x-p.pos.x,dz=n.z-p.pos.z,d=dx*dx+dz*dz;
   if(d<dist&&dx*fx+dz*fz>.1){dist=d;best={action:actions[n.kind][0],label:actions[n.kind][1]};}
 }
 if(best)return best;
 if(p.grounded&&typeof w.waterLevel==='function'&&typeof w.groundHeight==='function'){
   const x=p.pos.x+fx*1.4,z=p.pos.z+fz*1.4;
   const level=w.waterLevel(x,z),floor=w.groundHeight(x,z);
   if(Number.isFinite(level)&&Number.isFinite(floor)&&level-floor>1.15&&
     level-p.pos.y<2.2&&level-p.pos.y>-.6)return {action:'fishing',label:'PESCAR'};
 }
 return fallback;
}
export function resolveHighflyUse(p){
 if(!p?.world||!p?.pos)return {action:'interact',label:'USAR'};
 const facing={x:Math.sin(p.yaw),z:Math.cos(p.yaw)};
 const targets=Array.isArray(p.world.highflyInteractables)?p.world.highflyInteractables:[];
 for(const n of targets){
  if(n.kind!=='loot'||n.available===false)continue;
  const dx=n.x-p.pos.x,dz=n.z-p.pos.z;
  if(dx*dx+dz*dz<4&&dx*facing.x+dz*facing.z>.12)
   return {action:'pickup',label:'USAR'};
 }
 return {action:'interact',label:'USAR'};
}
export function vitalSnapshot(p){
 const spec=[['hp','HP',p?.health,p?.healthMax],['en','ENERGÍA',p?.stamina,p?.staminaMax],
  ['mp','MANÁ',p?._hfMana,p?._hfManaMax],['o2','O₂',p?._hfOxygen,p?._hfOxygenMax]];
 return spec.map(([id,label,v,m])=>{
  const max=Number.isFinite(m)&&m>0?m:100;
  return {id,label,max,value:Number.isFinite(v)?Math.max(0,Math.min(max,v)):max};
 });
}
const hfHud=()=>'<div class="hf-vitals"><div class="hf-profile"><span class="hf-avatar">✦</span><div><b>CAZADOR UNIVERSAL</b><small>HIGHFLY · NIVEL 01</small></div></div>'+
 ['hp','en','mp','o2'].map((id,i)=>'<div class="hf-vital hf-'+id+'"><b>'+['HP','ENERGÍA','MANÁ','O₂'][i]+'</b><span class="hf-track"><i class="hf-fill"></i></span><span class="hf-number">100/100</span></div>').join('')+
 '<small class="hf-motto">EL PODER SE CONSTRUYE</small></div>';
export function attachHighflyTouch(input){
 if(typeof document==='undefined'||!isTouchDevice())return;
 const css=[
 `
 #ui #hud .goal{left:13px!important;top:120px!important;max-width:315px!important;zoom:.70!important}
 #hf-touch .hf-vitals{position:absolute;left:calc(env(safe-area-inset-left,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 7px);width:330px;box-sizing:border-box;padding:6px 9px 5px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:9px;row-gap:1px;border:1px solid #8766bc99;border-radius:13px;pointer-events:none;background:linear-gradient(115deg,#111329ef,#0b1126ee 75%,#1b1834ed);box-shadow:0 5px 18px #05070f99,inset 0 1px #e9ddff26;backdrop-filter:blur(5px)}
 #hf-touch .hf-profile{display:flex;align-items:center;gap:7px;grid-column:1/-1;padding-bottom:4px;margin-bottom:3px;border-bottom:1px solid #9080c23b}
 #hf-touch .hf-avatar{width:24px;height:24px;flex:none;border-radius:50%;border:2px solid #bc9be8;background:#30254e;color:#e8d3ff;font:bold 17px system-ui;display:grid;place-items:center;box-shadow:0 0 10px #7a53d96b}
 #hf-touch .hf-profile b{display:block;color:#f6f0ff;font:700 9px system-ui;letter-spacing:.55px}
 #hf-touch .hf-profile small{display:block;color:#ada8d1;font:7px system-ui;letter-spacing:1px;margin-top:1px}
 #hf-touch .hf-vital{display:grid;grid-template-columns:42px minmax(0,1fr) 37px;gap:3px;align-items:center;height:19px}
 #hf-touch .hf-vital b{font:700 8px system-ui}
 #hf-touch .hf-number{font:7px monospace;color:#f2eefe;text-align:right;font-variant-numeric:tabular-nums}
 #hf-touch .hf-track{height:8px;overflow:hidden;border-radius:8px;background:#1b1930;border:1px solid #ffffff26;box-shadow:inset 0 1px 2px #0009}
 #hf-touch .hf-fill{display:block;height:100%;transform-origin:left;transform:scaleX(1);transition:transform .14s linear;border-radius:7px}
 #hf-touch .hf-hp b{color:#ff697e}#hf-touch .hf-hp .hf-fill{background:linear-gradient(90deg,#b72a49,#fa5f74)}
 #hf-touch .hf-en b{color:#f1cd75}#hf-touch .hf-en .hf-fill{background:linear-gradient(90deg,#b47a2a,#eac25f)}
 #hf-touch .hf-mp b{color:#779dff}#hf-touch .hf-mp .hf-fill{background:linear-gradient(90deg,#2c54bc,#6195ff)}
 #hf-touch .hf-o2 b{color:#66edf6}#hf-touch .hf-o2 .hf-fill{background:linear-gradient(90deg,#218eab,#59e8f4)}
 #hf-touch .hf-o2[data-low="1"] .hf-track{border-color:#ff7e95;box-shadow:0 0 8px #ff5365}
 #hf-touch .hf-motto{display:block;grid-column:1/-1;text-align:center;color:#8d82ae;font:7px system-ui;letter-spacing:1.6px;padding-top:3px}
 `,
 '#hf-touch{position:fixed;inset:0;z-index:9000;pointer-events:none;color:#fff;font:bold 11px system-ui;user-select:none;-webkit-user-select:none}',
 '#hf-touch[hidden]{display:none!important}',
 '#hf-touch .cam{position:absolute;inset:0 0 0 48%;pointer-events:auto;touch-action:none}',
 '#hf-touch .stick{position:absolute;left:14px;bottom:10px;width:128px;height:128px;box-sizing:border-box;border:2px solid #a984ce;border-radius:50%;background:radial-gradient(circle,#3d2b6080,#14132d7d);pointer-events:auto;touch-action:none}',
 '#hf-touch .stick:before{content:"";position:absolute;inset:48%;border-radius:50%;background:#eed8ff80;pointer-events:none}',
 '#hf-touch .knob{position:absolute;left:50%;top:50%;width:40%;height:40%;box-sizing:border-box;border-radius:50%;background:#56338c;border:2px solid #f0edff;transform:translate(-50%,-50%);pointer-events:none;box-shadow:0 0 8px #b58dff80}',
 '#hf-touch button{position:absolute;width:54px;height:54px;border:1px solid #e2c27d;border-radius:50%;background:linear-gradient(135deg,#48316c,#100b20);color:white;font:bold 10px system-ui;pointer-events:auto;touch-action:none}',
 '#hf-touch .atk{right:12px;bottom:12px;width:76px;height:76px;font-size:15px}',
 '#hf-touch .jump{right:96px;bottom:13px}',
 '#hf-touch .roll{right:98px;bottom:80px}',
 '#hf-touch .use{right:21px;bottom:108px}',
 '#hf-touch .sprint{left:152px;bottom:64px;width:62px;height:62px;z-index:3}',
 '#hf-touch .sprint[data-active="1"]{border:2px solid #ffdc87;background:linear-gradient(135deg,#755221,#25112f);box-shadow:0 0 16px #e4b85b88}',
 '#hf-touch .full{right:12px;top:8px;width:38px;height:38px}',
 '#hf-touch .actions{right:63px;top:8px;width:62px;height:38px;border-radius:17px}',
 '#hf-touch .hud-edit{right:133px;top:8px;width:47px;height:38px;border-radius:14px;border-color:#79ddd9;background:linear-gradient(135deg,#174956,#251936)}',
 '#hf-touch .hud-edit[data-active="1"]{box-shadow:0 0 16px #73f2eab4;border-width:2px}',
 '#hf-touch .hf-hud-editor{position:absolute;right:9px;top:54px;width:274px;padding:9px;border:1px solid #60ddd3;background:#11172aef;border-radius:10px;box-shadow:0 12px 24px #0008;pointer-events:auto;z-index:20;font:10px system-ui}',
 '#hf-touch .hf-hud-editor[hidden]{display:none!important}',
 '#hf-touch .hf-hud-editor .controls{display:flex;gap:5px;margin-top:8px}',
 '#hf-touch .hf-hud-editor button{position:static;flex:1;width:auto;height:33px;border-radius:8px;font-size:10px}',
 '#hf-touch[data-editing="1"] .stick,#hf-touch[data-editing="1"] button[data-a]:not(.hud-edit),#hf-touch[data-editing="1"] .hf-vitals{outline:2px dashed #80ffec;outline-offset:2px;cursor:grab}',
 '#hf-touch[data-editing="1"] .hf-vitals{pointer-events:auto!important}',
 '#hf-touch .hf-attack-cue{position:absolute;right:110px;bottom:112px;color:#6deffa;pointer-events:none;padding:3px 8px;background:#121d32dd;border:1px solid #55ceef;border-radius:8px;font:700 11px system-ui}',
 '#hf-touch .hf-attack-cue[hidden]{display:none!important}',
 '#hf-touch .action-panel{position:absolute;right:8px;top:51px;width:260px;padding:6px;border:1px solid #e0c37e;border-radius:9px;background:#141026eb;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;pointer-events:auto}',
 '#hf-touch .action-panel[hidden]{display:none!important}',
 '#hf-touch .action-panel button{position:static;width:auto;height:43px;border-radius:8px;font-size:9px;padding:2px}',
 '#hf-touch .dash{right:162px;bottom:13px;width:59px;height:59px;border:2px solid #9c84fc;background:linear-gradient(135deg,#5c2eaa,#21103e)}',
 '#hf-touch .context{right:228px;bottom:13px;width:59px;height:59px;border:2px solid #68d8ca;background:linear-gradient(135deg,#1c6267,#16182e);z-index:5}', 
 '#hf-touch .roll,#hf-touch .dash{z-index:6}',
 '#hf-touch .ability-aim{display:none;position:absolute;width:108px;height:108px;box-sizing:border-box;border-radius:50%;border:2px solid #78e1fa;background:radial-gradient(circle,#473d8650,#14112d70);pointer-events:none;z-index:10;box-shadow:0 0 18px #57d4ffa0}',
 '#hf-touch .ability-aim[data-active="1"]{display:flex;align-items:center;justify-content:center}',
 '#hf-touch .aim-arrow{color:#e8f9ff;font:36px system-ui;text-shadow:0 0 10px #57d4ff;transform:rotate(-90deg)}',
 '#hf-rotate{display:none;position:fixed;inset:0;z-index:10000;place-items:center;background:#100e22;color:white;text-align:center;font:bold 19px system-ui}',
 '#hf-input-debug{position:absolute;left:12px;bottom:145px;border:1px solid #bb88ec;background:#09091ccc;padding:4px 7px;font:11px monospace;pointer-events:none;white-space:pre}',
 '@media(orientation:portrait){#hf-rotate{display:grid!important}}'
 ].join('');
 const style=document.createElement('style');style.textContent=css+'#view{touch-action:none!important}#ui #hud .hints,#ui #hud .grab,#ui #hud .vitals{display:none!important}';document.head.append(style);
 const root=document.createElement('div');root.id='hf-touch';root.hidden=true;
 root.innerHTML=hfHud()+'<div class="cam" aria-label="Cámara libre"></div><div class="stick" aria-label="Joystick 360 grados"><div class="knob"></div></div>'+
 '<button class="atk" data-a="attack">ATK</button><button class="jump" data-a="jump">SALTO</button>'+
 '<button class="roll" data-a="dodge">ROLL</button><button class="use" data-a="interact">USAR</button>'+
 '<button class="sprint" data-a="sprint" aria-pressed="false">CORRER</button><button class="dash" data-a="dash" aria-label="DASH direccional">DASH</button>'+
 '<button class="context" data-a="context" aria-label="Acción contextual">TREPAR</button><button class="full" data-a="fullscreen">⛶</button><button class="actions" data-a="actions" aria-expanded="false">ACCIONES</button><button class="hud-edit" data-a="hud-edit" data-active="0">HUD</button>'+
 '<div class="hf-attack-cue" hidden></div>'+
 '<div class="hf-hud-editor" hidden><b>EDITOR DE HUD</b><div>Arrastrá cada botón o las barras. Seleccioná uno y cambiá su tamaño.</div><div class="controls">'+
 '<button data-hud-op="smaller">−</button><button data-hud-op="larger">+</button><button data-hud-op="reset">RESET</button><button data-hud-op="save">GUARDAR</button></div></div>'+
 '<div class="ability-aim" data-active="0"><span class="aim-arrow">➤</span></div>'+
 '<div class="action-panel" hidden>'+
 '<button data-a="climb">TREPAR</button><button data-a="equip">ARMA</button><button data-a="pickup">RECOGER</button><button data-a="cheer">GESTO</button>'+
 '<button data-a="sit">SENTAR</button><button data-a="lie">ACOSTAR</button><button data-a="chop">TALAR</button><button data-a="mine">MINAR</button>'+
 '<button data-a="fishing">PESCAR</button><button data-a="use">UTILIZAR</button></div>';
 document.body.append(root);
 const rotate=document.createElement('div');rotate.id='hf-rotate';rotate.textContent='Girás el teléfono a horizontal para jugar HIGHFLY';document.body.append(rotate);
 const t={root,x:0,y:0,held:new Set(),pressed:new Set(),active:false,lastPointer:null,debug:null,gestureCount:0,sprintOn:false,dashButton:root.querySelector('.dash'),contextButton:root.querySelector('.context'),contextAction:'climb', contextHeld:null,abilityAim:{},abilityPointer:null,aimOverlay:root.querySelector('.ability-aim'),actionsOpen:false,actionPanel:root.querySelector('.action-panel'),attackPointer:null,resources:{},attackCue:root.querySelector('.hf-attack-cue'),lastAttackSwipe:null};
 input.highflyTouch=t;
 for(const id of ['hp','en','mp','o2'])t.resources[id]=root.querySelector('.hf-'+id);
 t.hudEditor=installHudEditor(t);
 const dbg=globalThis.location?.search&&new URLSearchParams(globalThis.location.search).get('hfinputdebug')==='1';
 if(dbg){t.debug=document.createElement('div');t.debug.id='hf-input-debug';root.append(t.debug);}
 const stick=root.querySelector('.stick'),knob=root.querySelector('.knob');
 let sid=null;
 function center(){t.x=0;t.y=0;t.active=false;t.lastPointer=null;knob.style.transform='translate(-50%,-50%)';}
 function steer(e){
  const rect=stick.getBoundingClientRect(),v=joystickVector(rect,e.clientX,e.clientY);
  t.x=v.x;t.y=v.y;t.active=true;t.lastPointer=[e.clientX,e.clientY];
  const radius=Math.min(rect.width,rect.height)*.5-9;
  const mx=Math.round(v.x*radius*.72),my=Math.round(-v.y*radius*.72);
  knob.style.transform='translate(calc(-50% + '+mx+'px),calc(-50% + '+my+'px))';
 }
 stick.addEventListener('pointerdown',e=>{
  if(sid!==null)return;
  sid=e.pointerId;try{stick.setPointerCapture(sid)}catch{}
  steer(e);t.gestureCount++;e.preventDefault();e.stopImmediatePropagation?.();e.stopPropagation();
 });
 stick.addEventListener('pointermove',e=>{if(e.pointerId===sid){steer(e);e.preventDefault();e.stopPropagation();}});
 const endStick=e=>{if(e.pointerId!==sid)return;sid=null;center();e.preventDefault?.();e.stopPropagation?.();};
 stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);
 stick.addEventListener('lostpointercapture',endStick);
 const camera=root.querySelector('.cam');let cid=null,px=0,py=0;
 camera.addEventListener('pointerdown',e=>{
  if(cid!==null)return;
  cid=e.pointerId;px=e.clientX;py=e.clientY;
  try{camera.setPointerCapture(cid)}catch{}
  e.preventDefault();e.stopPropagation();
 });
 camera.addEventListener('pointermove',e=>{
  if(e.pointerId!==cid)return;
  input._dx+=(e.clientX-px)*1.6;input._dy+=(e.clientY-py)*1.6;
  px=e.clientX;py=e.clientY;e.preventDefault();
 });
 const endCamera=e=>{if(e.pointerId===cid)cid=null};
 camera.addEventListener('pointerup',endCamera);camera.addEventListener('pointercancel',endCamera);
 camera.addEventListener('lostpointercapture',endCamera);
 for(const b of root.querySelectorAll('[data-a]')){
  const a=b.dataset.a;
  if(a==='attack'){
   const aim=e=>{
    const active=t.attackPointer;if(!active||active.id!==e.pointerId)return;
    const v=abilityVector(e.clientX-active.x,e.clientY-active.y,13);
    active.vector=v;
    if(v&&!active.directionSent){
      // Critical F0.12 fix: send the directional input on POINTERMOVE,
      // not after the release when an ordinary attack may already have begun.
      t.abilityAim.attack=v;t.pressed.add('attack');
      active.directionSent=true;active.started=true;
      t.lastAttackSwipe=v;
      const direction=Math.abs(v.x)>Math.abs(v.y)?
        (v.x>0?'DERECHA':'IZQUIERDA'):(v.y>0?'ASCENDENTE':'DESCENDENTE');
      if(t.attackCue){t.attackCue.hidden=false;t.attackCue.textContent='CORTE '+direction;}
    }
    e.preventDefault();e.stopPropagation();
   };
   b.addEventListener('pointerdown',e=>{
    if(t.attackPointer)return;
    t.attackPointer={id:e.pointerId,x:e.clientX,y:e.clientY,frames:0,
      started:false,directionSent:false,vector:null};
    try{b.setPointerCapture(e.pointerId)}catch{}
    e.preventDefault();e.stopPropagation();
   });
   b.addEventListener('pointermove',aim);
   b.addEventListener('pointerup',e=>{
    const a=t.attackPointer;if(!a||a.id!==e.pointerId)return;
    aim(e); // capture last movement if pointermove was coalesced by Android
    if(!a.started){t.pressed.add('attack');t.abilityAim.attack=null;}
    t.held.delete('attack');t.attackPointer=null;
    if(t.attackCue)t.attackCue.hidden=true;
    e.preventDefault();e.stopPropagation();
   });
   const cancel=e=>{
    if(t.attackPointer?.id===e.pointerId){
      t.attackPointer=null;t.held.delete('attack');if(t.attackCue)t.attackCue.hidden=true;
    }
   };
   b.addEventListener('pointercancel',cancel);
   b.addEventListener('lostpointercapture',cancel);
   continue;
  }
  if(a==='dash'||a==='dodge'){
    const move=e=>{
      if(t.abilityPointer?.id!==e.pointerId||t.abilityPointer?.kind!==a)return;
      const v=abilityVector(e.clientX-t.abilityPointer.x,e.clientY-t.abilityPointer.y);
      t.abilityPointer.vector=v;
      if(t.aimOverlay)t.aimOverlay.querySelector('.aim-arrow').style.transform=
        'rotate('+(v?Math.atan2(-v.y,v.x)*180/Math.PI: -90)+'deg)';
      e.preventDefault();e.stopPropagation();
    };
    b.addEventListener('pointerdown',e=>{
      if(t.abilityPointer)return;
      const r=b.getBoundingClientRect();
      // Fingertip movement defines the aim. A tap anywhere in the button
      // (including near the rim) has no aim vector, so it uses hero facing.
      const centerX=r.left+r.width/2,centerY=r.top+r.height/2;
      t.abilityPointer={id:e.pointerId,kind:a,x:e.clientX,y:e.clientY,vector:null};
      const overlay=t.aimOverlay;
      if(overlay){overlay.style.left=(centerX-54)+'px';overlay.style.top=(centerY-54)+'px';overlay.dataset.active='1';}
      try{b.setPointerCapture(e.pointerId)}catch{}
      move(e);e.preventDefault();e.stopPropagation();
    });
    b.addEventListener('pointermove',move);
    const end=e=>{
      if(t.abilityPointer?.id!==e.pointerId||t.abilityPointer?.kind!==a)return;
      move(e);
      t.abilityAim[a]=t.abilityPointer.vector; // null means tap/fallback joystick
      t.pressed.add(a);t.abilityPointer=null;
      if(t.aimOverlay)t.aimOverlay.dataset.active='0';
      e.preventDefault();e.stopPropagation();
    };
    const cancel=e=>{
      if(t.abilityPointer?.id!==e.pointerId)return;
      t.abilityPointer=null;if(t.aimOverlay)t.aimOverlay.dataset.active='0';
    };
    b.addEventListener('pointerup',end);
    b.addEventListener('pointercancel',cancel);
    b.addEventListener('lostpointercapture',cancel);
    continue;
  }
  b.addEventListener('pointerdown',e=>{
   e.preventDefault();e.stopPropagation();
   if(a==='fullscreen'){
    const p=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();
    p?.catch?.(()=>{});return;
   }
   if(a==='hud-edit'){t.hudEditor?.toggle();return;}
   if(a==='actions'){
    t.actionsOpen=!t.actionsOpen;t.actionPanel.hidden=!t.actionsOpen;
    b.setAttribute('aria-expanded',String(t.actionsOpen));return;
   }
   try{b.setPointerCapture(e.pointerId)}catch{}
   const chosen=a==='context'?t.contextAction:a==='interact'?resolveHighflyUse(globalThis.__game?.player).action:a;
   if(a==='sprint'){
    t.sprintOn=!t.sprintOn;
    b.dataset.active=t.sprintOn?'1':'0';b.textContent=t.sprintOn?'CORRIENDO':'CORRER';
   }else{
    t.pressed.add(chosen);
    if(a==='attack')t.held.add('attack'); // hold-to-combo
    // One tap toggles climbing. Do not require holding the climbing button.
    if(a==='context')t.contextHeld=chosen;
   }
  });
  const up=e=>{
    if(a==='attack')t.held.delete('attack');
    if(a==='context')t.contextHeld=null;
    e.preventDefault();e.stopPropagation?.();
   };
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
 }
 // Browser focus/fullscreen transitions should never leave runaway movement.
 globalThis.addEventListener('blur',()=>{sid=cid=null;center();t.held.clear();t.sprintOn=false;t.attackPointer=null;if(t.attackCue)t.attackCue.hidden=true;t.abilityPointer=null;t.abilityAim={};if(t.aimOverlay)t.aimOverlay.dataset.active='0';});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){sid=cid=null;center();t.held.clear();t.attackPointer=null;}});
}
export function applyHighflyTouch(input){
 const t=input.highflyTouch;if(!t)return;
 t.root.hidden=!input.enabled;
 if(!input.enabled){
  t.pressed.clear();t.held.clear();t.sprintOn=false;t.x=t.y=0;t.active=false;
  return;
 }
 input.move.x=t.x;input.move.y=t.y;
 if(t.attackPointer&&!t.attackPointer.started){
  if(++t.attackPointer.frames>=9){
   t.attackPointer.started=true;t.held.add('attack');t.pressed.add('attack');t.abilityAim.attack=null;
  }
 }
 for(const a of t.pressed)input.pressed.add(a);
 input.highflyAbilityAim={...t.abilityAim};t.abilityAim={};
 for(const a of t.held)input.held.add(a);
 if(t.sprintOn)input.held.add('sprint');
 const context=resolveHighflyContext(globalThis.__game?.player);
 t.contextAction=context.action;
 if(t.contextButton){
   t.contextButton.textContent=context.label;
   t.contextButton.setAttribute('aria-label',context.label);
 }
 const cd=globalThis.__game?.player?._hfDashCd??0;
 if(t.dashButton){t.dashButton.textContent=cd>.05?'DASH '+cd.toFixed(1):'DASH';t.dashButton.style.opacity=cd>.05?'.65':'1';}
 for(const bar of vitalSnapshot(globalThis.__game?.player)){
  const el=t.resources?.[bar.id];if(!el)continue;
  const fill=el.querySelector('.hf-fill'),num=el.querySelector('.hf-number');
  if(fill)fill.style.transform='scaleX('+(bar.value/bar.max)+')';
  if(num)num.textContent=Math.ceil(bar.value)+'/'+Math.ceil(bar.max);
  if(bar.id==='o2')el.dataset.low=bar.value/bar.max<.22?'1':'0';
 }
 t.pressed.clear();
 if(t.debug){
  const fx=Math.round(input.move.x*100),fy=Math.round(input.move.y*100);
  const yaw=globalThis.__game?.player?.yaw;
  t.debug.textContent='JOYSTICK 360° X='+fx+' Y='+fy+'\n'+
   (Number.isFinite(yaw)?'GIRO personaje='+yaw.toFixed(2):'GIRO personaje=...')+
   '\nGESTOS='+t.gestureCount+' '+(t.active?'ACTIVO':'LIBRE')+'\n'+(globalThis.__game?.player?.pos?'POS X='+globalThis.__game.player.pos.x.toFixed(2)+' Z='+globalThis.__game.player.pos.z.toFixed(2):'POS esperando');
 }
}
