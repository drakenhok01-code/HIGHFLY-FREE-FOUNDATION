/** Tap-to-advance Unsung dialogue; original quest IDs / state / rewards unchanged. */
import {translateHighfly} from './es-localization.mjs';
import './p493-dialogue.css';
export function installHighflyDialogue(game){
 if(!game?.on||!globalThis.document)return null;
 const box=document.createElement('div');box.id='hf-p493-story';box.hidden=true;
 box.setAttribute('aria-live','polite');box.setAttribute('role','dialog');
 box.setAttribute('aria-label','Diálogo de Aetheria');
 box.innerHTML='<section class="hf-p493-story-card" tabindex="0"><span class="hf-p493-story-kicker">HIGHFLY · LA LLAMA SIN NOMBRE</span><h3></h3><p></p><small>TOCÁ EL DIÁLOGO PARA CONTINUAR</small></section>';
 document.body.appendChild(box);
 const name=box.querySelector('h3'),speech=box.querySelector('p');
 let phase='close',last=0;
 const forward=e=>{
  if(phase==='close'||(e?.repeat??false))return;
  if(game.time-last<.07)return;
  last=game.time;
  // Mobile touch merges its presses into native Input on the following frame.
  // PC input uses the same original interaction action, never alters quest state.
  if(game.input?.highflyTouch?.pressed)game.input.highflyTouch.pressed.add('interact');
  else game.input?._down?.add('interact');
  e?.preventDefault?.();
 };
 box.addEventListener('pointerdown',forward);
 box.addEventListener('keydown',e=>{if(e.code==='Enter'||e.code==='Space')forward(e)});
 game.on((type,data)=>{
  if(type!=='dialogue')return;
  if(data.phase==='close'){phase='close';box.hidden=true;return;}
  phase=data.phase;
  name.textContent=translateHighfly(data.name||'Habitante de Aetheria');
  speech.textContent=translateHighfly(data.text||'');
  box.hidden=false;
 });
 const api={root:box,get opened(){return !box.hidden},tap:forward,
  dispose(){box.remove();}};
 game.__highflyDialogue=api;
 return api;
}
