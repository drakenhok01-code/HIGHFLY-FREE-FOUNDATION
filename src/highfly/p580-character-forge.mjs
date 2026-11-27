// Appearance only: the persistent Unsung Player, equipment and RPG save are never recreated.
const KEY='hf-p580-appearance-v1';
const DEFAULT=Object.freeze({version:1,name:'Aventurero',outfit:'#ffffff',accent:'#ffffff',helmet:false,cape:false});
export function normalizeAppearance(v={}){
 const color=x=>typeof x==='string'&&/^#[0-9a-f]{6}$/i.test(x)?x.toLowerCase():'#ffffff';
 return {version:1,name:String(v.name??DEFAULT.name).trim().slice(0,24)||DEFAULT.name,outfit:color(v.outfit),accent:color(v.accent),helmet:!!v.helmet,cape:!!v.cape};
}
export function readAppearance(storage=globalThis.localStorage){try{const v=JSON.parse(storage.getItem(KEY)||'null');return v?.version===1?normalizeAppearance(v):null}catch{return null}}
export function saveAppearance(v,storage=globalThis.localStorage){const a=normalizeAppearance(v);storage.setItem(KEY,JSON.stringify(a));return a}
export function applyAppearance(hero,appearance){
 if(!hero?.root||hero.originalLook)return false;
 const a=normalizeAppearance(appearance);let count=0;
 hero.root.traverse(o=>{
  if(!o.isMesh)return;
  const name=o.name??'';
  if(/^Knight_(Helmet|HelmetVisor)$/i.test(name))o.visible=a.helmet;
  if(/^Knight_Cape$/i.test(name))o.visible=a.cape;
  if(!/^Knight_(Body|ArmLeft|ArmRight|LegLeft|LegRight|Helmet|HelmetVisor|Cape)$/i.test(name))return;
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   const u=m?.uniforms?.uHFAppearanceTint;if(!u?.value?.set)continue;
   u.value.set(/Helmet|Cape|Arm/i.test(name)?a.accent:a.outfit);count++;
  }
 });
 hero.root.updateMatrixWorld(true);hero.appearance=a;return count>0;
}
export function installCharacterForge(game){
 let saved=readAppearance(),draft=saved??{...DEFAULT},offered=false,active=false,previousInput=null,lastHero=null,initial=false;
 const panel=document.createElement('section');panel.id='hf-character-forge';panel.hidden=true;
 panel.style.cssText='position:fixed;top:5%;right:3%;width:min(350px,48vw);max-height:90vh;overflow:auto;z-index:100020;padding:16px;background:#171224f5;color:#f4e6ce;border:1px solid #b792d9;border-radius:13px;box-shadow:0 12px 35px #0008;font:13px system-ui;box-sizing:border-box';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Forja de personaje');
 const field=(label,el)=>{const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;margin:10px 0';row.append(document.createTextNode(label),el);return row};
 const make=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e};
 const btn=(text,fn)=>{const b=make('button',text);b.type='button';b.style.cssText='background:#3b2957;color:#fff3d5;border:1px solid #a888d1;border-radius:7px;padding:8px;margin:4px 4px 0 0;cursor:pointer';b.onclick=fn;return b};
 const name=make('input');name.type='text';name.maxLength=24;name.autocomplete='off';name.style.width='55%';
 const outfit=make('input');outfit.type='color';const accent=make('input');accent.type='color';
 const helmet=make('input');helmet.type='checkbox';const cape=make('input');cape.type='checkbox';
 const title=make('h3','✦ FORJA DE PERSONAJE');title.style.margin='0 0 6px';
 const note=make('p','Estética HIGHFLY Anime V6.6 · tu progreso no cambia.');
 const warning=make('p','');warning.style.color='#e9bd8f';
 const readFields=()=>normalizeAppearance({name:name.value,outfit:outfit.value,accent:accent.value,helmet:helmet.checked,cape:cape.checked});
 function sync(a){name.value=a.name;outfit.value=a.outfit;accent.value=a.accent;helmet.checked=a.helmet;cape.checked=a.cape}
 function preview(){draft=readFields();const ok=applyAppearance(globalThis.__hero,draft);warning.textContent=ok?'Vista previa aplicada a tu personaje real.':'El modelo estilizado todavía no está listo.'}
 for(const el of [name,outfit,accent,helmet,cape])el.addEventListener('input',preview);
 const presets=make('div');
 for(const [label,a,b] of [['Original','#ffffff','#ffffff'],['Fénix','#9c75f6','#e9c36a'],['Sombra','#686581','#9bb0dc'],['Bosque','#84bc8b','#d7b99b']])presets.append(btn(label,()=>{outfit.value=a;accent.value=b;preview()}));
 function close(commit=false){
  if(!active)return false;
  if(commit){const next=readFields();if(!applyAppearance(globalThis.__hero,next))return false;try{saved=saveAppearance(next);game.player._hfAppearance=saved}catch{warning.textContent='No se pudo guardar la apariencia.';return false}}
  else applyAppearance(globalThis.__hero,saved??DEFAULT);
  panel.hidden=true;active=false;if(game.input&&previousInput!==null)game.input.enabled=previousInput;previousInput=null;return true;
 }
 panel.append(title,note,field('Nombre',name),field('Vestimenta',outfit),field('Detalles',accent),field('Casco',helmet),field('Capa',cape),presets,warning,btn('Guardar apariencia',()=>close(true)),btn('Cancelar',()=>close(false)));
 for(const event of ['pointerdown','pointerup','touchstart','touchend','click','keydown'])panel.addEventListener(event,e=>e.stopPropagation());
 document.body.append(panel);
 function open(source='stylist'){
  if(active||!globalThis.__hero?.root||globalThis.__hero.originalLook||game.player?.state==='dead')return false;
  initial=source==='initial';draft=saved??{...DEFAULT};sync(draft);previousInput=game.input?.enabled??null;if(game.input)game.input.enabled=false;
  active=true;offered=true;panel.hidden=false;preview();return true;
 }
 function update(){
  const h=globalThis.__hero;if(h&&h!==lastHero){lastHero=h;if(saved){applyAppearance(h,saved);game.player._hfAppearance=saved}}
  if(!saved&&!offered&&game.state==='playing'&&h?.root&&!h.originalLook&&!game.cine&&new URLSearchParams(location.search).get('hfqa')!=='1')open('initial');
 }
 const api={open,close,update,get active(){return active},get saved(){return saved},get initial(){return initial},get draft(){return draft}};
 globalThis.__hfCharacterForge=api;return api;
}
