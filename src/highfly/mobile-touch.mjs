/** HIGHFLY F0.1: Android-native analog 360° with original Unsung Input/Player. */
export const isTouchDevice=()=>/Android/i.test(globalThis.navigator?.userAgent??'')||!!globalThis.matchMedia?.('(pointer:coarse)')?.matches;

import {installHudEditor} from '../highfly/hud-editor.mjs';
import {translateHighfly} from '../highfly/es-localization.mjs';
import {findProfessionTarget,professionActionFor} from '../highfly/professions.mjs';
import {terrainWallContact} from '../highfly/wall-physics.mjs';
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
 const fallback={action:'interact',label:'USAR'};
 if(!p?.world||!p?.pos)return fallback;
 const w=p.world,fx=Math.sin(p.yaw),fz=Math.cos(p.yaw);
 // In water, wall contact takes priority over diving.
 if(p.state==='swim'){
  const d=typeof w.raycast==='function'?w.raycast(
    {x:p.pos.x,y:p.pos.y+.87,z:p.pos.z},{x:fx,y:0,z:fz},1.08):Infinity;
  if(d>.06&&d<.96||terrainWallContact(w,p.pos,{x:fx,z:fz},1.08,.75))return {action:'climb',label:'TREPAR'};
  return {action:'dive',label:p._hfDive?'SUBIR':'BUCEAR'};
 }
 // Harvest targets must have explicit resource tags, never generic rock collisions.
 const tagged=findProfessionTarget(w,p.pos,p.yaw);
 if(tagged){
  const type=professionActionFor(tagged);
  const label={chop:'TALAR',mine:'MINAR',fishing:'PESCAR',
    plant:'SEMBRAR',water:'REGAR',harvest:'COSECHAR',smelt:'FUNDIR',forge:'FORJAR'}[type];
  if(label)return {action:type,label};
 }
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
 const wall=typeof w.raycast==='function'?w.raycast(
   {x:p.pos.x,y:p.pos.y+.85,z:p.pos.z},{x:fx,y:0,z:fz},1.03):Infinity;
 if((wall>.04&&wall<.91)||terrainWallContact(w,p.pos,{x:fx,z:fz},1.08,.7))
  return {action:'climb',label:'TREPAR'};
 const caps=w.caps;
 if(caps?.length)for(let i=0;i<caps.length;i+=7){
   const x=(caps[i]+caps[i+3])/2-p.pos.x,z=(caps[i+2]+caps[i+5])/2-p.pos.z;
   if(x*x+z*z<1.2&&x*fx+z*fz>.08)return {action:'climb',label:'TREPAR'};
 }
 const interaction=resolveHighflyUse(p);
 if(interaction.action==='pickup')return interaction;
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
 '<small class="hf-motto">EL PODER SE CONSTRUYE</small></div>'+
 '<div class="hf-quests"><div class="hf-quest-head"><b>◈ MISIONES ACTIVAS</b><span>⌄</span></div><div class="hf-quest-body">'+
 '<div class="hf-primary-quest"></div><div class="hf-side-quests"></div></div></div>';
export function attachHighflyTouch(input){
 if(typeof document==='undefined'||!isTouchDevice())return;
 const css=[
 `
 #ui #hud .goal{display:none!important}
 #ui #hud .fps{display:none!important}
 #hf-touch .hf-quests{position:absolute;left:10px;top:111px;width:330px;box-sizing:border-box;padding:6px 9px;border:1px solid #8b70b35f;border-radius:10px;background:linear-gradient(110deg,#10142dde,#100f25de);pointer-events:auto;max-height:118px;overflow:hidden}
 #hf-touch .hf-quest-head{display:flex;justify-content:space-between;align-items:center;color:#dccba7;font:700 10px system-ui;letter-spacing:.6px;pointer-events:auto}
 #hf-touch .hf-quest-body{font:10px system-ui;color:#c8c4df;margin-top:5px;line-height:1.25}
 #hf-touch .hf-primary-quest{color:#c9dcff;font:10px system-ui}
 #hf-touch .hf-side-quests{font:9px system-ui;color:#a9a7cd}
 #hf-touch .hf-side-quests div{display:flex;justify-content:space-between;gap:4px}
 #hf-touch .hf-quests[data-collapsed="1"] .hf-quest-body{display:none}
 #hf-touch .hf-fps{position:absolute;right:6px;bottom:2px;font:9px monospace;color:#b4c6df;background:#0a0c1b9e;padding:2px 5px;border-radius:5px;pointer-events:auto;white-space:nowrap}
 #hf-touch .hf-fps[hidden]{display:none!important}
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
 '#hf-touch .lock{right:12px;top:57px;width:48px;height:48px;border:2px solid #8bbbea;font-size:9px}',
 '#hf-touch .lock[data-active="1"]{box-shadow:0 0 13px #83c4f6aa;background:linear-gradient(135deg,#285e7a,#1a1a34)}',
 '#hf-touch button[data-a^="skill"]{width:41px;height:41px;border:1.5px solid #8c8cf0;background:linear-gradient(135deg,#334063,#141226);font-size:9px;border-radius:12px}',
 '#hf-touch button[data-locked="1"]{opacity:.56;color:#9d9bb9;border-color:#56546c}',
 '#hf-touch .skill1{right:311px;bottom:11px}#hf-touch .skill2{right:356px;bottom:11px}',
 '#hf-touch .skill3{right:401px;bottom:11px}#hf-touch .skill4{right:446px;bottom:11px}',
 '#hf-touch .skill5{right:311px;bottom:57px}#hf-touch .skill6{right:356px;bottom:57px}',
 '#hf-touch .hf-hud-editor{position:absolute;right:9px;top:55px;width:286px;padding:9px;border:1px solid #60ddd3;background:#11172aef;border-radius:10px;box-shadow:0 12px 24px #0008;pointer-events:auto;z-index:20;font:10px system-ui}',
 '#hf-touch .hf-hud-editor label{display:flex;justify-content:space-between;align-items:center;gap:5px;padding:2px 0}',
 '#hf-touch .hf-hud-editor input[type="number"]{max-width:53px;color:white;background:#283049;border:1px solid #5e7599;border-radius:4px;padding:3px;font:10px system-ui}',
 '#hf-touch .hf-hud-editor input[type="range"]{width:125px;accent-color:#80e6e0}',
 '#hf-touch .hf-hud-editor[hidden]{display:none!important}',
 '#hf-touch .hf-hud-editor .controls{display:flex;gap:5px;margin-top:5px}',
 '#hf-touch .hf-hud-editor button{position:static;flex:1;width:auto;height:27px;border-radius:8px;font-size:9px}',
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
 style.textContent+=`
/* F0.13.1 Android design: saved per-control inline opacity overrides defaults */
#hf-touch button[data-a]{opacity:.70;border-radius:50%}
#hf-touch .actions,#hf-touch .hud-edit{width:44px;height:44px;border-radius:50%;font-size:12px}
#hf-touch .actions{font-size:24px}
#hf-touch .full{border-radius:50%}
#hf-touch .use{display:none!important}
#hf-touch button[data-a^="skill"]{border-radius:50%;opacity:.7}
#hf-touch button[data-locked="1"]{opacity:.7;filter:grayscale(.35);color:#b9afc7}
#hf-touch .settings{right:190px;top:8px;width:40px;height:40px;font-size:17px;border-radius:50%}
#hf-touch .hf-hud-editor{left:50%;top:50%;right:auto;transform:translate(-50%,-50%);width:min(282px,70vw);max-height:75vh;overflow-y:auto;z-index:60;border-radius:14px}
#hf-touch .hf-panel-handle{display:flex;justify-content:space-between;align-items:center;cursor:grab;touch-action:none;border-radius:9px;padding:3px 8px;background:#182642;min-height:32px;margin-bottom:5px}
#hf-touch .hf-panel-handle button{position:static!important;width:30px;height:30px;border-radius:50%!important}
#hf-touch .hf-hud-editor[data-minimized="1"]{width:174px;max-height:48px;overflow:hidden;padding:4px}
#hf-touch .hf-hud-editor[data-minimized="1"] .hf-editor-body{display:none!important}
#hf-touch .hf-fps{min-width:100px;min-height:30px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;cursor:grab;touch-action:none;opacity:.7;padding:5px 8px;border-radius:15px}
#hf-touch .hf-fps[hidden]{display:none!important}
#hf-touch .hf-settings{position:absolute;right:10px;top:58px;width:250px;z-index:65;background:#141b36f6;border:1px solid #8f82c1;border-radius:12px;padding:10px;pointer-events:auto;box-sizing:border-box}
#hf-touch .hf-settings[hidden]{display:none!important}
#hf-touch .hf-setting-buttons{display:flex;gap:6px;margin:9px 0 5px}
#hf-touch .hf-settings button{position:static;border-radius:50%;width:71px;height:61px;opacity:.82;font:10px system-ui}
#hf-touch .action-panel{right:10px;top:56px;width:193px;z-index:52;grid-template-columns:repeat(3,minmax(0,1fr));padding:7px;border-radius:14px}
#hf-touch .action-panel button{border-radius:50%;width:54px;height:54px;position:static;font-size:9px;opacity:.7}
#hf-touch .action-panel button span{display:block;font-size:19px}
#hf-touch .action-panel[hidden]{display:none!important}
#hf-touch .roll,#hf-touch .dash{z-index:3}
#hf-touch .hf-talk-next{position:absolute;right:12px;top:23%;width:65px;height:65px;border-radius:50%;z-index:80}
#hf-touch .hf-talk-next[hidden]{display:none!important}
#hf-touch[data-talking="1"] .cam,#hf-touch[data-talking="1"] .stick,#hf-touch[data-talking="1"] button[data-a]:not(.hf-talk-next){pointer-events:none!important;opacity:0!important}
#ui:has(#talk.on){z-index:9050!important;pointer-events:none!important}
#ui #talk.on{top:7%!important;bottom:auto!important;width:min(560px,73vw)!important;max-height:35vh;overflow:auto;background:#101729ee;padding:7px 13px!important;border:1px solid #ccaf75aa;border-radius:13px;box-shadow:0 9px 24px #000a}
#ui #talk p{font-size:clamp(11px,1.7vw,15px)!important;line-height:1.25!important;min-height:0!important;margin:6px 0!important}
#ui #talk .who b{font-size:clamp(12px,2vw,17px)!important}
#ui #talk .who span{font-size:clamp(9px,1.4vw,12px)!important}
#ui #hud .hints,#ui #hud .grab,#ui #hud .prompt{display:none!important}
#hf-touch[data-editing="1"] .hf-fps{outline:2px dashed #80ffec;outline-offset:2px}
`;
 const root=document.createElement('div');root.id='hf-touch';root.hidden=true;
 root.innerHTML=hfHud()+'<div class="cam" aria-label="Cámara libre"></div><div class="stick" aria-label="Joystick 360 grados"><div class="knob"></div></div>'+
 '<button class="atk" data-a="attack">ATK</button><button class="jump" data-a="jump">SALTO</button>'+
 '<button class="roll" data-a="dodge">ROLL</button><button class="use" data-a="interact">USAR</button>'+
 '<button class="sprint" data-a="sprint" aria-pressed="false">CORRER</button><button class="dash" data-a="dash" aria-label="DASH direccional">DASH</button>'+
 '<button class="context" data-a="context" aria-label="Acción contextual">TREPAR</button><button class="full" data-a="fullscreen" aria-label="Pantalla completa">⛶</button><button class="actions" data-a="actions" aria-label="Gestos" aria-expanded="false">☺</button><button class="hud-edit" data-a="hud-edit" data-active="0">HUD</button><button class="settings" data-a="settings" aria-label="Opciones gráficas">⚙</button>'+
 '<button class="lock" data-a="lock" aria-label="Fijar enemigo">⊕<small>FIJAR</small></button>'+
 '<button class="skill1" data-a="skill1" aria-label="Resonancia" data-locked="1">🔒</button>'+
 '<button class="skill2" data-a="skill2" aria-label="Ataque pesado">S2</button>'+
 '<button class="skill3" data-a="skill3" aria-label="Curación" data-locked="1">🔒</button>'+
 '<button class="skill4" data-a="skill4" aria-label="Habilidad cuatro" data-locked="1">🔒</button>'+
 '<button class="skill5" data-a="skill5" aria-label="Habilidad cinco" data-locked="1">🔒</button>'+
 '<button class="skill6" data-a="skill6" aria-label="Habilidad seis" data-locked="1">🔒</button>'+
 '<div class="hf-fps" hidden data-hf-no-translate>FPS · resolución</div>'+
 '<div class="hf-attack-cue" hidden></div>'+
 '<div class="hf-hud-editor" hidden><div class="hf-panel-handle" data-hud-panel-handle><b>HUD 3.1 ↔</b><button type="button" data-hud-op="collapse">−</button></div><div class="hf-editor-body"><div>Seleccionado: <b data-hud-selected>ATK</b></div>'+
 '<label>Tamaño (%) <input type="range" min="60" max="170" data-hud-size value="100"/>'+
 '<input type="number" min="60" max="170" data-hud-size-number value="100"/></label>'+
 '<label>Opacidad (%) <input type="range" min="20" max="100" data-hud-opacity value="70"/>'+
 '<input type="number" min="20" max="100" data-hud-opacity-number value="70"/></label>'+
 '<label>Posición X (%) <input type="number" min="0" max="100" data-hud-x value="0"/></label>'+
 '<label>Posición Y (%) <input type="number" min="0" max="100" data-hud-y value="0"/></label>'+
 '<div class="controls"><button data-hud-op="smaller">−</button><button data-hud-op="larger">+</button>'+
 '<button data-hud-op="reset">RESET</button><button data-hud-op="save">GUARDAR</button></div></div></div>'+
 '<div class="ability-aim" data-active="0"><span class="aim-arrow">➤</span></div>'+
 '<div class="action-panel" hidden><button data-a="sit" aria-label="Sentarse"><span>🪑</span>SENTAR</button>'+
 '<button data-a="lie" aria-label="Acostarse"><span>🛌</span>ACOSTAR</button>'+
 '<button data-a="cheer" aria-label="Festejar"><span>🙌</span>FESTEJAR</button></div>'+
 '<div class="hf-settings" hidden><b>CALIDAD GRÁFICA</b><div class="hf-setting-buttons">'+
 '<button data-graphics="performance">FLUIDO</button><button data-graphics="balanced">BALANCE</button>'+
 '<button data-graphics="quality">NÍTIDO</button></div>'+
 '<button data-a="equip" aria-label="Cambiar arma">⚔ ARMA</button>'+
 '<div data-hf-settings-metrics>Resolución y FPS</div></div>'+
 '<button class="hf-talk-next" data-a="dialogue-next" hidden>SEGUIR</button>';
 document.body.append(root);
 const rotate=document.createElement('div');rotate.id='hf-rotate';rotate.textContent='Girás el teléfono a horizontal para jugar HIGHFLY';document.body.append(rotate);
 const t={root,x:0,y:0,held:new Set(),pressed:new Set(),active:false,lastPointer:null,debug:null,gestureCount:0,sprintOn:false,dashButton:root.querySelector('.dash'),contextButton:root.querySelector('.context'),contextAction:'climb', contextHeld:null,abilityAim:{},abilityPointer:null,aimOverlay:root.querySelector('.ability-aim'),actionsOpen:false,actionPanel:root.querySelector('.action-panel'),attackPointer:null,resources:{},
 attackCue:root.querySelector('.hf-attack-cue'),lastAttackSwipe:null,
 questPanel:root.querySelector('.hf-quests'),fpsBadge:root.querySelector('.hf-fps'),
 questExpanded:true,frames:0,skillButtons:{},
 settingsPanel:root.querySelector('.hf-settings'),talkNext:root.querySelector('.hf-talk-next')};
 input.highflyTouch=t;
 for(const id of ['hp','en','mp','o2'])t.resources[id]=root.querySelector('.hf-'+id);
 t.hudEditor=installHudEditor(t);
 t.settingsPanel?.querySelectorAll('[data-graphics]')?.forEach(btn=>btn.addEventListener('pointerdown',e=>{
  e.preventDefault();e.stopPropagation();
  if(globalThis.__highflySetGraphics?.(btn.dataset.graphics))t.settingsPanel.hidden=true;
 }));
 for(let i=1;i<=6;i++)t.skillButtons[i]=root.querySelector('.skill'+i);
 t.questPanel?.addEventListener('pointerdown',e=>{
  if(t.editing)return;
  t.questExpanded=!t.questExpanded;t.questPanel.dataset.collapsed=t.questExpanded?'0':'1';
  e.stopPropagation();e.preventDefault();
 });
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
   let active=null;
   b.addEventListener('pointerdown',e=>{
    if(active!==null)return;
    active=e.pointerId;t.pressed.add('attack');t.held.add('attack');
    t.abilityAim.attack=null;
    try{b.setPointerCapture(e.pointerId)}catch{}
    e.preventDefault();e.stopPropagation();
   });
   const finish=e=>{
    if(e.pointerId!==active)return;
    active=null;t.held.delete('attack');
    e.preventDefault?.();e.stopPropagation?.();
   };
   b.addEventListener('pointerup',finish);
   b.addEventListener('pointercancel',finish);
   b.addEventListener('lostpointercapture',finish);
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
   if(a==='dialogue-next'){t.pressed.add('interact');return;}
   if(a==='settings'){t.settingsPanel.hidden=!t.settingsPanel.hidden;return;}
   if(a==='actions'){
    t.actionsOpen=!t.actionsOpen;t.actionPanel.hidden=!t.actionsOpen;
    if(t.actionsOpen){const rect=b.getBoundingClientRect(),p=t.actionPanel;
      p.style.left=Math.max(0,Math.min(innerWidth-193,rect.left+rect.width/2-96))+'px';
      p.style.right='auto';p.style.top=Math.max(54,Math.min(innerHeight-70,rect.bottom+6))+'px';
    }
    b.setAttribute('aria-expanded',String(t.actionsOpen));return;
   }
   try{b.setPointerCapture(e.pointerId)}catch{}
   if(a.startsWith('skill')){
     const n=Number(a.slice(5)),p=globalThis.__game?.player;
     const action=n===1?'pulse':n===2?'heavy':n===3?'heal':null;
     const unlocked=action&&(n===2||(n===1&&p?.skills?.has('pulse'))||(n===3&&p?.refrains>0));
     if(unlocked)t.pressed.add(action);
     return;
   }
   const chosen=a==='context'?t.contextAction:a==='interact'?resolveHighflyUse(globalThis.__game?.player).action:a;
   if(a==='sprint'){
    t.sprintOn=!t.sprintOn;
    b.dataset.active=t.sprintOn?'1':'0';b.textContent='CORRER';
   }else{
    t.pressed.add(chosen);
    if(['sit','lie','cheer'].includes(a)){t.actionPanel.hidden=true;t.actionsOpen=false;}
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
function rootLock(t){return t?.root?.querySelector?.('.lock')}
export function activeQuestSummary(game){
 const tasks=game?.quests?.active??[];
 const side=tasks.slice(0,3).map(q=>{
  const st=game.quests.state[q.id],value=game.quests.progress(q);
  const text=st?.s==='ready'?'Volvé con '+(game.people?.get(q.giver)?.def?.name??'el encargado'):
    translateHighfly(q.verb);
  return {title:translateHighfly(q.title),text,count:st?.s==='ready'?null:
     value[0]+' / '+value[1]};
 });
 return {primary:translateHighfly(game?.objective??''),side,total:tasks.length};
}
export function refreshHighflyQuests(t,game){
 const root=t?.questPanel;if(!root)return;
 const summary=activeQuestSummary(game),main=root.querySelector('.hf-primary-quest'),
  secondary=root.querySelector('.hf-side-quests');
 if(main&&main.textContent!==summary.primary)main.textContent=summary.primary||'Explorá el mundo';
 if(secondary){
  const html=summary.side.map(q=>'<div><span>'+escapeQuestText(q.title)+'</span>'+
    '<span>'+(q.count??'✓')+'</span></div>').join('')+
    (summary.total>3?'<div>+'+(summary.total-3)+' misiones más</div>':'');
  if(secondary.innerHTML!==html)secondary.innerHTML=html;
 }
}
function escapeQuestText(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll('"','&quot;')}

export function applyHighflyTouch(input){
 const t=input.highflyTouch;if(!t)return;
 t.root.hidden=!input.enabled;
 t.frames=(t.frames??0)+1;
 if(!t.root.hidden&&t.hudEditor?.restore&&!t.hudEditor.restored)
  t.hudEditor.restored=!!t.hudEditor.restore();
 if(!input.enabled){
  t.pressed.clear();t.held.clear();t.sprintOn=false;t.x=t.y=0;t.active=false;
  return;
 }
 input.move.x=t.x;input.move.y=t.y;
 for(const a of t.pressed)input.pressed.add(a);
 input.highflyAbilityAim={...t.abilityAim};t.abilityAim={};
 for(const a of t.held)input.held.add(a);
 if(t.sprintOn)input.held.add('sprint');
 const g=globalThis.__game,p=g?.player;
 const talking=!!g?.people?.talk;
 t.root.dataset.talking=talking?'1':'0';
 if(t.talkNext)t.talkNext.hidden=!talking;
 if(t.settingsPanel&&!t.settingsPanel.hidden){
  const box=t.settingsPanel.querySelector('[data-hf-settings-metrics]');
  if(box)box.textContent='Resolución '+Math.round((globalThis.__pipe?.renderScale??1)*100)+' % · '+Math.round(globalThis.__gov?.fps??0)+' FPS';
 }
 if(t.skillButtons){
   const ready=[!!p?.skills?.has('pulse'),true,!!p?.refrains];
   for(let i=1;i<=6;i++){
     const btn=t.skillButtons[i];if(!btn)continue;
     const available=i<=3&&ready[i-1];
     btn.dataset.locked=available?'0':'1';
     if(!available)btn.textContent='🔒';
     else btn.textContent=i===1?'S1':i===2?'S2':'S3';
   }
 }
 const lock=rootLock(t);
 if(lock){
  const fixed=!!p?.lockTarget;lock.dataset.active=fixed?'1':'0';
  lock.setAttribute('aria-label',fixed?'Liberar objetivo':'Fijar enemigo');
 }
 if(t.fpsBadge){
  const legacy=globalThis.document?.querySelector?.('#hud .fps')?.textContent?.trim();
  t.fpsBadge.hidden=!legacy&&!t.editing;
  if(legacy)t.fpsBadge.textContent=translateHighfly(legacy);
 }
 if(t.frames%12===0||t.frames===1)refreshHighflyQuests(t,globalThis.__game);
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
