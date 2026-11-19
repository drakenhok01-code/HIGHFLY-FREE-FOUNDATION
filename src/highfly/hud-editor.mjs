/** F0.12.2: Android portrait-safe, per-player movable HIGHFLY HUD.
 * Persist normalized widget position/scale in same-origin localStorage.
 * Always restore stock layout by pressing RESET. Native game physics untouched.
 */
const STORAGE='highfly-hud-layout-f0122';
const SELECTOR='.hf-vitals,.stick,.atk,.jump,.roll,.use,.sprint,.dash,.context';
const names=['vitals','stick','attack','jump','dodge','interact','sprint','dash','context'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const win=()=>({w:Math.max(1,globalThis.innerWidth??915),h:Math.max(1,globalThis.innerHeight??412)});
export function hudNodeId(node){
 if(!node)return null;
 if(node.classList?.contains('hf-vitals'))return 'vitals';
 if(node.classList?.contains('stick'))return 'stick';
 const value=node.dataset?.a;
 return names.includes(value)?value:null;
}
export function installHudEditor(t){
 const root=t.root,button=root?.querySelector?.('.hud-edit');
 const panel=root?.querySelector?.('.hf-hud-editor');
 const ui={active:false,drag:null,selected:null,restore:null,toggle:null,reset:null,save:null};
 if(!button||!panel)return ui; // synthetic touch adapters don't need a live editor
 const all=()=>[...root.querySelectorAll(SELECTOR)];
 const read=()=>{try{return JSON.parse(globalThis.localStorage?.getItem(STORAGE)||'{}')}catch{return {}}};
 const save=()=>{
  const {w,h}=win();const layout={};
  for(const node of all()){
   const id=hudNodeId(node);
   if(!id)continue;
   const rect=node.getBoundingClientRect(),scale=Number(node.dataset.hfScale||1);
   if(node.dataset.hfModified==='1'){
    layout[id]={x:clamp(rect.left/Math.max(1,w-rect.width),0,1),
      y:clamp(rect.top/Math.max(1,h-rect.height),0,1),scale:clamp(scale,.65,1.4)};
   }
  }
  try{globalThis.localStorage?.setItem(STORAGE,JSON.stringify(layout))}catch{}
  return layout;
 };
 const place=(node,entry)=>{
  if(!node||!entry)return;
  const scale=clamp(Number(entry.scale)||1,.65,1.4);
  node.style.transform='scale('+scale+')';
  node.style.transformOrigin='top left';
  node.dataset.hfScale=String(scale);
  const rect=node.getBoundingClientRect(),{w,h}=win();
  const x=clamp(Number(entry.x)||0,0,1)*Math.max(1,w-rect.width);
  const y=clamp(Number(entry.y)||0,0,1)*Math.max(1,h-rect.height);
  node.style.left=x+'px';node.style.top=y+'px';
  node.style.right='auto';node.style.bottom='auto';
  node.dataset.hfModified='1';
 };
 const restore=()=>{
  // Hidden root has zero-size DOMRect: normalize only after HUD is visible.
  if(root.hidden)return false;
  const layout=read();
  for(const node of all()){
   const id=hudNodeId(node);
   if(layout[id])place(node,layout[id]);
  }
  return true;
 };
 const reset=()=>{
  for(const node of all()){
   node.style.left='';node.style.top='';node.style.right='';node.style.bottom='';
   node.style.transform='';node.style.transformOrigin='';
   delete node.dataset.hfModified;delete node.dataset.hfScale;
  }
  ui.selected=null;
  try{globalThis.localStorage?.removeItem(STORAGE)}catch{}
 };
 const toggle=(force)=>{
  ui.active=force===undefined?!ui.active:!!force;
  t.editing=ui.active;root.dataset.editing=ui.active?'1':'0';
  button.dataset.active=ui.active?'1':'0';
  panel.hidden=!ui.active;
  t.held.clear();t.pressed.clear();t.x=t.y=0;
  if(ui.active){
   t.actionPanel&&(t.actionPanel.hidden=true);t.actionsOpen=false;
   ui.selected=root.querySelector('.atk');
  }else{ui.drag=null;save();}
  return ui.active;
 };
 // Root CAPTURE receives pointer events before attack, camera and joystick
 // listeners, so HUD dragging can never also trigger an attack or dash.
 root.addEventListener('pointerdown',e=>{
  if(!ui.active||e.target?.closest?.('.hf-hud-editor,.hud-edit'))return;
  const node=e.target?.closest?.(SELECTOR);
  if(!node||!hudNodeId(node))return;
  e.preventDefault?.();e.stopImmediatePropagation?.();
  const rect=node.getBoundingClientRect();ui.selected=node;
  ui.drag={node,id:e.pointerId,x:e.clientX,y:e.clientY,left:rect.left,top:rect.top};
  try{node.setPointerCapture(e.pointerId)}catch{}
 },true);
 root.addEventListener('pointermove',e=>{
  const drag=ui.drag;if(!ui.active||!drag||drag.id!==e.pointerId)return;
  e.preventDefault?.();e.stopImmediatePropagation?.();
  const rect=drag.node.getBoundingClientRect(),{w,h}=win();
  const x=clamp(drag.left+e.clientX-drag.x,0,Math.max(0,w-rect.width));
  const y=clamp(drag.top+e.clientY-drag.y,0,Math.max(0,h-rect.height));
  drag.node.style.left=x+'px';drag.node.style.top=y+'px';
  drag.node.style.right='auto';drag.node.style.bottom='auto';
  drag.node.dataset.hfModified='1';
 },true);
 for(const event of ['pointerup','pointercancel','lostpointercapture'])
  root.addEventListener(event,e=>{
   if(!ui.drag||ui.drag.id!==e.pointerId)return;
   e.preventDefault?.();e.stopImmediatePropagation?.();
   ui.drag=null;save();
  },true);
 for(const control of panel.querySelectorAll('[data-hud-op]'))
  control.addEventListener('pointerdown',e=>{
   e.preventDefault?.();e.stopPropagation?.();
   const op=control.dataset.hudOp;
   if(op==='reset'){reset();return;}
   if(op==='save'){toggle(false);return;}
   if(!ui.selected)return;
   const rect=ui.selected.getBoundingClientRect(),{w,h}=win();
   const scale=Number(ui.selected.dataset.hfScale||1);
   const next=clamp(scale+(op==='larger'?.1:-.1),.65,1.4);
   place(ui.selected,{x:rect.left/Math.max(1,w-rect.width),
     y:rect.top/Math.max(1,h-rect.height),scale:next});
   save();
  });
 ui.restored=!root.hidden&&restore();
 ui.toggle=toggle;ui.reset=reset;ui.restore=restore;ui.save=save;
 return ui;
}
