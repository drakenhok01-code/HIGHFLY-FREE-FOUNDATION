/** HIGHFLY F0.1: Android-native analog 360° with original Unsung Input/Player. */
export const isTouchDevice=()=>/Android/i.test(globalThis.navigator?.userAgent??'')||!!globalThis.matchMedia?.('(pointer:coarse)')?.matches;

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
export function attachHighflyTouch(input){
 if(typeof document==='undefined'||!isTouchDevice())return;
 const css=[
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
 '#hf-touch .dash{right:162px;bottom:13px;width:59px;height:59px;border:2px solid #9c84fc;background:linear-gradient(135deg,#5c2eaa,#21103e)}',
 '#hf-rotate{display:none;position:fixed;inset:0;z-index:10000;place-items:center;background:#100e22;color:white;text-align:center;font:bold 19px system-ui}',
 '#hf-input-debug{position:absolute;left:12px;bottom:145px;border:1px solid #bb88ec;background:#09091ccc;padding:4px 7px;font:11px monospace;pointer-events:none;white-space:pre}',
 '@media(orientation:portrait){#hf-rotate{display:grid!important}}'
 ].join('');
 const style=document.createElement('style');style.textContent=css+'#view{touch-action:none!important}#ui #hud .hints,#ui #hud .grab{display:none!important}';document.head.append(style);
 const root=document.createElement('div');root.id='hf-touch';root.hidden=true;
 root.innerHTML='<div class="cam" aria-label="Cámara libre"></div><div class="stick" aria-label="Joystick 360 grados"><div class="knob"></div></div>'+
 '<button class="atk" data-a="attack">ATK</button><button class="jump" data-a="jump">SALTO</button>'+
 '<button class="roll" data-a="dodge">ROLL</button><button class="use" data-a="interact">USAR</button>'+
 '<button class="sprint" data-a="sprint" aria-pressed="false">CORRER</button><button class="dash" data-a="dash" aria-label="DASH direccional">DASH</button>'+
 '<button class="full" data-a="fullscreen">⛶</button>';
 document.body.append(root);
 const rotate=document.createElement('div');rotate.id='hf-rotate';rotate.textContent='Girás el teléfono a horizontal para jugar HIGHFLY';document.body.append(rotate);
 const t={root,x:0,y:0,held:new Set(),pressed:new Set(),active:false,lastPointer:null,debug:null,gestureCount:0,sprintOn:false,dashButton:root.querySelector('.dash')};
 input.highflyTouch=t;
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
  b.addEventListener('pointerdown',e=>{
   e.preventDefault();e.stopPropagation();
   if(a==='fullscreen'){
    const p=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();
    p?.catch?.(()=>{});return;
   }
   try{b.setPointerCapture(e.pointerId)}catch{}
   if(a==='sprint'){
    t.sprintOn=!t.sprintOn;
    b.dataset.active=t.sprintOn?'1':'0';b.textContent=t.sprintOn?'CORRIENDO':'CORRER';
   }else t.pressed.add(a);
  });
  const up=e=>{e.preventDefault();e.stopPropagation?.();};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
 }
 // Browser focus/fullscreen transitions should never leave runaway movement.
 globalThis.addEventListener('blur',()=>{sid=cid=null;center();t.held.clear();t.sprintOn=false;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){sid=cid=null;center();t.held.clear();}});
}
export function applyHighflyTouch(input){
 const t=input.highflyTouch;if(!t)return;
 t.root.hidden=!input.enabled;
 if(!input.enabled){
  t.pressed.clear();t.held.clear();t.sprintOn=false;t.x=t.y=0;t.active=false;
  return;
 }
 input.move.x=t.x;input.move.y=t.y;
 for(const a of t.pressed)input.pressed.add(a);
 for(const a of t.held)input.held.add(a);
 if(t.sprintOn)input.held.add('sprint');
 const cd=globalThis.__game?.player?._hfDashCd??0;
 if(t.dashButton){t.dashButton.textContent=cd>.05?'DASH '+cd.toFixed(1):'DASH';t.dashButton.style.opacity=cd>.05?'.65':'1';}
 t.pressed.clear();
 if(t.debug){
  const fx=Math.round(input.move.x*100),fy=Math.round(input.move.y*100);
  const yaw=globalThis.__game?.player?.yaw;
  t.debug.textContent='JOYSTICK 360° X='+fx+' Y='+fy+'\n'+
   (Number.isFinite(yaw)?'GIRO personaje='+yaw.toFixed(2):'GIRO personaje=...')+
   '\nGESTOS='+t.gestureCount+' '+(t.active?'ACTIVO':'LIBRE')+'\n'+(globalThis.__game?.player?.pos?'POS X='+globalThis.__game.player.pos.x.toFixed(2)+' Z='+globalThis.__game.player.pos.z.toFixed(2):'POS esperando');
 }
}
