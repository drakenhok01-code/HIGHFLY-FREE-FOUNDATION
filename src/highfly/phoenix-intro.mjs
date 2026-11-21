/** Brand welcome: uses the user-supplied HIGHFLY RPG FITNESS Phoenix logo.
 *  Decorative overlay only; game start screen, saves and KayKit remain native.
 */
import {officialLogoUrl} from './premium-assets.mjs';
export function installHighflyIntro(){
 const query=new URLSearchParams(location.search),forced=query.get('hfintro')==='1';
 const qa=location.pathname.endsWith('/qa-rpg.html');
 let root=null,timer=null,leaving=false;
 const hide=()=>{
  if(!root||leaving)return;
  leaving=true;clearTimeout(timer);
  try{sessionStorage.setItem('hf-intro-brand-v1','seen')}catch{}
  root.classList.add('hf-intro-exit');
  setTimeout(()=>{root?.remove();root=null;leaving=false},380);
 };
 const show=()=>{
  if(root)return;
  leaving=false;root=document.createElement('section');root.id='hf-phoenix-intro';
  root.setAttribute('role','dialog');root.setAttribute('aria-label','Bienvenida HIGHFLY');
  root.innerHTML='<div class="hf-intro-halo" aria-hidden="true"></div><div class="hf-intro-body">'+
    '<img class="hf-intro-image" src="'+officialLogoUrl()+'" alt="HIGHFLY RPG FITNESS: fénix violeta y dorado, atleta y barra de pesas" draggable="false"/>'+
    '<p>EL PODER NO SE HEREDA. SE CONSTRUYE.</p>'+
    '<button type="button" data-hf-intro-enter>CONTINUAR <span aria-hidden="true">✦</span></button></div>';
  document.body.appendChild(root);
  root.querySelector('[data-hf-intro-enter]').addEventListener('click',hide);
  if(!forced)timer=setTimeout(hide,4200);
 };
 const api={show,hide,get visible(){return Boolean(root)&&!leaving}};
 globalThis.__highflyIntro=api;
 let seen=false;try{seen=sessionStorage.getItem('hf-intro-brand-v1')==='seen'}catch{}
 if(query.get('hfintro')!=='0'&&(!qa||forced)&&(forced||!seen))show();
 return api;
}
