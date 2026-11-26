/** P4.9.3 — use tap to advance original Unsung dialogue, never bypass its quest engine. */
export function installP493Interaction(game){
 if(!game||typeof document==='undefined')return null;
 const talk=document.createElement('button');talk.type='button';talk.id='hf-p493-dialog-tap';
 talk.textContent='TOCAR PARA CONTINUAR';talk.hidden=true;
 talk.setAttribute('aria-label','Tocar para avanzar diálogo');
 document.body.append(talk);
 const advance=()=>{
  if(!game.people?.talk||game.people.talk.phase!=='hold')return;
  if(game.input?._down?.add)game.input._down.add('interact');
  else game.input?.pressed?.add('interact');
 };
 const onTouch=e=>{e.preventDefault();e.stopPropagation();advance();};
 talk.addEventListener('pointerdown',onTouch);
 const domTalk=()=>document.querySelector('#ui #talk');
 domTalk()?.addEventListener('pointerdown',onTouch);
 let pending=0;const previous=game.update;
 game.update=function(dt){
  const result=previous.call(this,dt);
  if(++pending%3===1){
   const active=!!game.people?.talk&&game.state==='playing';
   talk.hidden=!active;
   if(active){const n=game.people.talk?.n?.def;talk.title=n?.name??'Continuar diálogo';const el=domTalk();if(el){for(const [k,v] of Object.entries({position:'fixed',top:'54%',left:'50%',right:'auto',bottom:'auto',transform:'translate(-50%,-50%)',width:'min(620px,72vw)',maxHeight:'58vh',zIndex:'9900'}))el.style.setProperty(k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),v,'important');}}
  }
  return result;
 };
 const api={talk,advance,dispose(){game.update=previous;talk.remove();}};
 globalThis.__highflyP493Interaction=api;return api;
}
