/**
 * HIGHFLY P5.3.8 Arvelia — ORIGINAL short introductory NPC quests.
 * Not ClaudeCraft's restricted dialogue, art, sounds, or quest text.
 * Isolated from other HIGHFLY missions; touch-friendly and persistent.
 */
import {EASTBROOK_MISSIONS} from './p538-eastbrook-land.mjs';
export const ARVELIA_QUEST_KEY='hf-p538-arvelia-quests-v1';
const initial=()=>({schema:1,mission:0,step:0,completed:[]});
export function readArveliaQuests(storage){
 try{
  const a=JSON.parse(storage?.getItem(ARVELIA_QUEST_KEY)||'null');
  if(!a||a.schema!==1||!Number.isInteger(a.mission)||!Number.isInteger(a.step)||
   a.mission<0||a.mission>EASTBROOK_MISSIONS.length||a.step<0||a.step>3||!Array.isArray(a.completed))
   return initial();
  return a;
 }catch{return initial();}
}
export function speakArveliaNpc(npcId,state){
 const current=EASTBROOK_MISSIONS[state.mission];
 if(!current)return {state,changed:false,text:'¡Arvelia te da la bienvenida!',done:true};
 const expected=current.steps[state.step];
 if(npcId!==expected){
  const human=expected==='sera'?'Sera':expected==='borin'?'Borin':expected==='galdren'?'Galdren':'Mila';
  return {state,changed:false,text:'Tenés una tarea pendiente: hablá con '+human+'.',done:false};
 }
 const message=current.dialogues[state.step]||'¡Gracias por tu ayuda!';
 const step=state.step+1,mission=step>=current.steps.length?state.mission+1:state.mission;
 const next={schema:1,mission,step:mission===state.mission?step:0,
  completed:mission!==state.mission?[...state.completed,current.id]:[...state.completed]};
 return {state:next,changed:true,text:message,done:mission!==state.mission,
  completedTitle:mission!==state.mission?current.title:null};
}
export function installArveliaQuests({people=[],storage,doc=globalThis.document}={}){
 if(!doc?.body||!people.some(o=>o.highflyNpc))return null;
 const npcs=people.filter(o=>o.highflyNpc&&Number.isFinite(o.x)&&Number.isFinite(o.z));
 let state=readArveliaQuests(storage),near=null,lastNear='',disposed=false;
 const wrap=doc.createElement('div');
 wrap.id='hf-p538-dialogues';
 wrap.style.cssText='position:fixed;left:50%;bottom:20%;transform:translateX(-50%);z-index:9900;width:min(620px,72vw);max-height:62vh;overflow:auto;font:13px system-ui,sans-serif;color:#fff;pointer-events:none';
 const talk=doc.createElement('button');
 talk.type='button';talk.textContent='💬 Hablar';
 talk.style.cssText='display:none;pointer-events:auto;background:#312044ec;color:#fff3cd;border:1px solid #c7a4ec;border-radius:20px;padding:10px 16px;font:700 13px system-ui,sans-serif;box-shadow:0 2px 13px #0009';
 const panel=doc.createElement('div');panel.hidden=true;
 panel.style.cssText='pointer-events:auto;margin-top:7px;background:#181327f5;border:1px solid #b190d6;border-radius:12px;padding:12px 14px;box-shadow:0 5px 25px #000c;line-height:1.55';
 const label=doc.createElement('strong'),message=doc.createElement('p'),close=doc.createElement('button');
 label.textContent='ARVELIA · GREMIO';label.style.color='#f4d3a3';
 message.style.cssText='margin:7px 0 9px';
 close.textContent='Cerrar';close.style.cssText='background:#4a3566;color:white;border:1px solid #9f85ca;border-radius:8px;padding:6px 12px';
 close.type='button';close.onclick=()=>{panel.hidden=true;};
 panel.append(label,message,close);wrap.append(talk,panel);doc.body.append(wrap);
 const open=()=>{
  if(!near)return;
  const result=speakArveliaNpc(near.highflyNpc,state);
  state=result.state;
  if(result.changed){try{storage?.setItem(ARVELIA_QUEST_KEY,JSON.stringify(state));}catch{}}
  label.textContent=near.highflyName+' · '+(result.completedTitle||EASTBROOK_MISSIONS[Math.min(state.mission,EASTBROOK_MISSIONS.length-1)]?.title||'Arvelia');
  message.textContent=result.text+(result.completedTitle?' ✔ Misión completada.':'');
  panel.hidden=false;
 };
 talk.addEventListener('click',open);
 const onKey=ev=>{
  if(ev.key?.toLowerCase()!=='f'||!near||ev.repeat||ev.target?.matches?.('input,textarea'))return;
  open();
 };
 globalThis.addEventListener?.('keydown',onKey);
 let frame=0;
 return {
  get state(){return state;},
  update(position){
   if(disposed||!position)return;
   if(++frame%8!==0)return;
   const found=npcs.map(n=>({n,d:Math.hypot(n.x-position.x,n.z-position.z)}))
    .filter(t=>t.d<5.2).sort((a,b)=>a.d-b.d)[0]?.n||null;
   const key=found?.id??'';
   if(key===lastNear)return;
   near=found;lastNear=key;
   talk.style.display=found?'block':'none';
   talk.textContent=found?'💬 '+found.highflyName+' · Hablar':'';
   if(!found)panel.hidden=true;
  },
  dispose(){disposed=true;globalThis.removeEventListener?.('keydown',onKey);wrap.remove();}
 };
}
