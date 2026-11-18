/** Android overlay feeding the one original Unsung Input/Player. F0-only lab. */
const mobile=()=>/Android/i.test(navigator.userAgent)||globalThis.matchMedia?.('(pointer:coarse)')?.matches;
export function attachHighflyTouch(input){
 if(typeof document==='undefined'||!mobile())return;
 const style=document.createElement('style');
 style.textContent=[
 '#hf-touch{position:fixed;inset:0;z-index:9000;pointer-events:none;font:bold 11px system-ui;color:#fff}',
 '#hf-touch[hidden]{display:none!important}',
 '#hf-touch .cam{position:absolute;inset:0 0 0 48%;pointer-events:auto;touch-action:none}',
 '#hf-touch .stick{position:absolute;left:16px;bottom:12px;width:116px;height:116px;border:2px solid #a984ce;border-radius:50%;background:#14132d88;pointer-events:auto;touch-action:none}',
 '#hf-touch .knob{position:absolute;left:50%;top:50%;width:40%;height:40%;border-radius:50%;background:#56338c;border:2px solid #f0edff;transform:translate(-50%,-50%)}',
 '#hf-touch button{position:absolute;width:54px;height:54px;border:1px solid #e2c27d;border-radius:50%;background:linear-gradient(135deg,#48316c,#100b20);color:white;font:bold 10px system-ui;pointer-events:auto;touch-action:none}',
 '#hf-touch .atk{right:12px;bottom:12px;width:76px;height:76px;font-size:15px}',
 '#hf-touch .jump{right:96px;bottom:13px}',
 '#hf-touch .roll{right:98px;bottom:80px}',
 '#hf-touch .use{right:21px;bottom:108px}',
 '#hf-touch .sprint{left:146px;bottom:44px}',
 '#hf-touch .full{right:12px;top:8px;width:38px;height:38px}',
 '#hf-touch .dash{right:162px;bottom:13px;opacity:.38}',
 '#hf-rotate{display:none;position:fixed;inset:0;z-index:10000;place-items:center;background:#100e22;color:white;text-align:center;font:bold 19px system-ui}',
 '@media(orientation:portrait){#hf-rotate{display:grid!important}}'
 ].join('');
 document.head.append(style);
 const root=document.createElement('div');root.id='hf-touch';root.hidden=true;
 root.innerHTML='<div class="cam" aria-label="Cámara"></div><div class="stick" aria-label="Joystick"><div class="knob"></div></div>'+
 '<button class="atk" data-a="attack">ATK</button><button class="jump" data-a="jump">SALTO</button>'+
 '<button class="roll" data-a="dodge">ROLL</button><button class="use" data-a="interact">USAR</button>'+
 '<button class="sprint" data-a="sprint">CORRER</button><button class="dash" disabled aria-label="DASH no implementado">🔒 DASH</button>'+
 '<button class="full" data-a="fullscreen">⛶</button>';
 document.body.append(root);
 const rotate=document.createElement('div');rotate.id='hf-rotate';rotate.textContent='Girás el teléfono a horizontal para jugar HIGHFLY';document.body.append(rotate);
 const t={root,x:0,y:0,held:new Set(),pressed:new Set()};input.highflyTouch=t;
 const stick=root.querySelector('.stick'),knob=root.querySelector('.knob');let sid=null;
 function steer(e){const r=stick.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width*.45),dy=(e.clientY-r.top-r.height/2)/(r.height*.45),n=Math.max(1,Math.hypot(dx,dy));
  t.x=dx/n;t.y=-dy/n;knob.style.transform='translate(calc(-50% + '+(t.x*38)+'px),calc(-50% + '+(-t.y*38)+'px))';}
 stick.addEventListener('pointerdown',e=>{if(sid!==null)return;sid=e.pointerId;stick.setPointerCapture(sid);steer(e);e.preventDefault()});
 stick.addEventListener('pointermove',e=>{if(e.pointerId===sid){steer(e);e.preventDefault()}});
 const endStick=e=>{if(e.pointerId!==sid)return;sid=null;t.x=t.y=0;knob.style.transform='translate(-50%,-50%)'};
 stick.addEventListener('pointerup',endStick);stick.addEventListener('pointercancel',endStick);
 const camera=root.querySelector('.cam');let cid=null,px=0,py=0;
 camera.addEventListener('pointerdown',e=>{if(cid!==null)return;cid=e.pointerId;px=e.clientX;py=e.clientY;camera.setPointerCapture(cid);e.preventDefault()});
 camera.addEventListener('pointermove',e=>{if(e.pointerId!==cid)return;input._dx+=(e.clientX-px)*1.6;input._dy+=(e.clientY-py)*1.6;px=e.clientX;py=e.clientY;e.preventDefault()});
 const endCamera=e=>{if(e.pointerId===cid)cid=null};camera.addEventListener('pointerup',endCamera);camera.addEventListener('pointercancel',endCamera);
 for(const b of root.querySelectorAll('[data-a]')){
  const a=b.dataset.a;
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();
    if(a==='fullscreen'){(document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.());return;}
    if(a==='sprint')t.held.add(a);else t.pressed.add(a);});
  const up=e=>{e.preventDefault();if(a==='sprint')t.held.delete(a);};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);
 }
}
export function applyHighflyTouch(input){
 const t=input.highflyTouch;if(!t)return;
 t.root.hidden=!input.enabled;
 if(!input.enabled){t.pressed.clear();t.held.clear();t.x=t.y=0;return;}
 input.move.x=t.x;input.move.y=t.y;
 for(const a of t.pressed)input.pressed.add(a);
 for(const a of t.held)input.held.add(a);
 t.pressed.clear();
}
