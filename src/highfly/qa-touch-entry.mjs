/** Real DOM QA of the same HIGHFLY mobile-touch HUD used by the game. */
import {attachHighflyTouch,applyHighflyTouch} from '../game/highfly-touch.mjs';
const input={enabled:true,_dx:0,_dy:0,move:{x:0,y:0},look:{x:0,y:0},pressed:new Set(),held:new Set()};
attachHighflyTouch(input);
window.__hfTouchTest={ready:!!input.highflyTouch,dash:null,roll:null,contextSeen:false};
function frame(){
 input.pressed.clear();input.held.clear();
 applyHighflyTouch(input);
 const t=input.highflyTouch;
 window.__hfTouchTest.contextSeen ||= !!t?.contextButton&&!t.contextButton.hidden;
 for(const kind of ['dash','dodge'])
  if(input.pressed.has(kind))window.__hfTouchTest[kind==='dodge'?'roll':'dash']={
   direction:input.highflyAbilityAim?.[kind]||null,move:{...input.move}
  };
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);