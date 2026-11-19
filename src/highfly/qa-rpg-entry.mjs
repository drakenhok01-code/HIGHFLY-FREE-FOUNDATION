/** Minimal browser harness that mounts EXACT production HIGHFLY RPG menu code.
 * Native Unsung build/WebGL is covered separately; this makes the UI test fast.
 */
import {installPremiumRpgUI} from './premium-rpg.mjs';
const player={
 state:'move',health:40,healthMax:100,stamina:70,staminaMax:100,
 _hfMana:30,_hfManaMax:100,_hfLevel:4,_hfTrainingScore:1,_hfGearCycle:0,
 skills:new Set(['pulse']),refrains:2,
 _hfProfession:{inventory:{herb:2,ore:1,wood:3},tools:new Set(['axe','pickaxe']),completed:1},
 _hfProfessionSave(){this._savedProfession={...this._hfProfession.inventory};}
};
const game={
 state:'playing',menu:null,player,hero:{equip(i){this.index=i}},
 input:{enabled:true,lockPointer(){},highflyTouch:null},
 people:{talk:null},cine:false,finisher:false,hasMap:false,objective:'Andá hasta el mirador',
 quests:{active:Array.from({length:5},(_,i)=>({id:'q'+(i+1),title:'Encargo '+(i+1),verb:'Encontrá materiales'})),
 state:{},progress(){return [1,3]}},
 openMenu(name){if(this.state!=='playing')return;this.state='menu';this.menu=name;this.input.enabled=false},
 closeMenu(){this.state='playing';this.menu=null;this.input.enabled=true},
 start(){this.state='playing';this.menu=null;this.input.enabled=true}
};
window.__game=game;
window.__highflySetGraphics=mode=>['performance','balanced','quality'].includes(mode);
window.__highflyRpg=installPremiumRpgUI(game,{search:''});
window.__hfRpgTest={ready:!!window.__highflyRpg,game};
