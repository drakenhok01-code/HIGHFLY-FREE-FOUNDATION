/** Real DOM QA of the same HIGHFLY mobile-touch HUD used by the game. */
import {attachHighflyTouch,applyHighflyTouch} from '../game/highfly-touch.mjs';
const input={enabled:true,_dx:0,_dy:0,move:{x:0,y:0},look:{x:0,y:0},pressed:new Set(),held:new Set()};
attachHighflyTouch(input);
const qaQuests=Array.from({length:5},(_,i)=>({id:'qa-quest-'+i,title:'Encargo de prueba '+(i+1),verb:'Buscá el objetivo '+(i+1)}));
window.__game={objective:'Visitá la Terraza del Alba',player:null,quests:{active:qaQuests,state:{},progress:()=>[1,3]}};
window.__hfTouchTest={ready:!!input.highflyTouch,dash:null,roll:null,attack:null,contextSeen:false};
function frame(){
 input.pressed.clear();input.held.clear();
 applyHighflyTouch(input);
 const t=input.highflyTouch;
 window.__hfTouchTest.contextSeen ||= !!t?.contextButton&&!t.contextButton.hidden;
 if(input.pressed.has('attack'))
  window.__hfTouchTest.attack={direction:input.highflyAbilityAim?.attack??null,
   move:{...input.move},held:input.held.has('attack')};
 for(const kind of ['dash','dodge'])
  if(input.pressed.has(kind))window.__hfTouchTest[kind==='dodge'?'roll':'dash']={
   direction:input.highflyAbilityAim?.[kind]||null,move:{...input.move}
  };
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);