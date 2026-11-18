/** Optional collapsible Android actions palette (?hfactions=1). */
import {isTouchDevice} from './mobile-touch.mjs';
const ENTRIES=[
 ['hf_climb','TREPAR'],['hf_sit','SENTARSE'],['hf_lie','ACOSTARSE'],
 ['hf_cheer','GESTO'],['hf_pickup','RECOGER'],['hf_use','USAR ITEM'],
 ['hf_chop','TALAR'],['hf_mine','MINAR'],['hf_fish','PESCAR'],
 ['hf_cast','MAGIA']
];
export function attachActionMenu(input){
 if(typeof document==='undefined'||!isTouchDevice())return;
 if(new URLSearchParams(globalThis.location?.search||'').get('hfactions')!=='1')return;
 const style=document.createElement('style');
 style.textContent=[
 '#hf-activity{position:fixed;right:64px;top:6px;z-index:9150;color:#f4ebff;font:12px system-ui;pointer-events:none}',
 '#hf-activity button{font:600 11px system-ui;background:#25163bec;color:#f6ebff;border:1px solid #bca0df;border-radius:10px;min-height:36px;padding:5px 9px;touch-action:manipulation;pointer-events:auto}',
 '#hf-activity .panel{display:none;position:absolute;right:0;top:42px;width:min(295px,80vw);max-height:70vh;overflow-y:auto;grid-template-columns:repeat(2,minmax(120px,1fr));gap:6px;background:#130e28f5;border:1px solid #8b69c2;border-radius:12px;padding:8px;box-shadow:0 6px 25px #05020a9c;pointer-events:auto}',
 '#hf-activity[data-open="1"] .panel{display:grid}',
 '#hf-activity .hint{grid-column:1/-1;color:#baa8d9;font-size:10px}'
 ].join('');
 document.head.append(style);
 const root=document.createElement('div');root.id='hf-activity';root.dataset.open='0';
 const toggle=document.createElement('button');toggle.textContent='ACCIONES';
 toggle.setAttribute('aria-expanded','false');
 const panel=document.createElement('div');panel.className='panel';
 for(const [action,label] of ENTRIES){
  const button=document.createElement('button');button.textContent=label;
  button.dataset.action=action;
  button.addEventListener('pointerdown',e=>{
   e.preventDefault();e.stopPropagation();
   if(!input.enabled)return;
   const t=input.highflyTouch;
   if(t)t.pressed.add(action);else input._down.add(action);
   root.dataset.open='0';toggle.setAttribute('aria-expanded','false');
  });
  panel.appendChild(button);
 }
 const hint=document.createElement('div');hint.className='hint';
 hint.textContent='TREPADA = saliente bajo • TALAR/MINAR = recurso cercano • Animaciones de trabajo provisionales';
 panel.appendChild(hint);
 toggle.addEventListener('pointerdown',e=>{
  e.preventDefault();e.stopPropagation();
  root.dataset.open=root.dataset.open==='1'?'0':'1';
  toggle.setAttribute('aria-expanded',String(root.dataset.open==='1'));
 });
 root.append(toggle,panel);document.body.append(root);
 return root;
}
