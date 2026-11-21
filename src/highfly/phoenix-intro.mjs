/** HIGHFLY v3.6: native game loading owns the welcome. No modal. */
export function installHighflyIntro(){
 const api={show:()=>false,hide:()=>true,get visible(){return false}};
 globalThis.__highflyIntro=api;return api;
}
