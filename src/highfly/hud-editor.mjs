/** HIGHFLY F0.13 HUD v3: EVERY control, including HUD, actions, fullscreen,
 * skill 1-6, lock-on, quest, FPS, vitals, stick. Fullscreen-safe anchor layout.
 */
export const LAYOUT_KEY='highfly-hud-layout-f013';
const PREVIOUS_KEY='highfly-hud-layout-f0122';
const query='#hf-touch [data-a],#hf-touch .stick,#hf-touch .hf-vitals,#hf-touch .hf-quests,#hf-touch .hf-fps';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const vp=()=>({w:Math.max(1,globalThis.innerWidth??915),h:Math.max(1,globalThis.innerHeight??412)});
export function hudNodeId(n){
 if(!n)return null;
 for(const [c,v] of [['hf-vitals','vitals'],['hf-quests','quests'],['hf-fps','fps'],['stick','stick']])
  if(n.classList?.contains(c))return v;
 return n.dataset?.a??null;
}
export function captureAnchor(rect,w,h,scale=1,opacity=.7){
 const xSide=rect.left+rect.width/2<w/2?'left':'right';
 const ySide=rect.top+rect.height/2<h/2?'top':'bottom';
 return {xSide,ySide,
  x:clamp((xSide==='left'?rect.left:w-rect.right)/w,0,.98),
  y:clamp((ySide==='top'?rect.top:h-rect.bottom)/h,0,.98),
  scale:clamp(Number(scale)||1,.60,1.70),opacity:clamp(Number(opacity)||1,.20,1)};
}
export function positionFromAnchor(a,w,h,bw,bh){
 const scale=clamp(Number(a.scale)||1,.60,1.70),width=bw*scale,height=bh*scale;
 const left=a.xSide==='right'?w-w*(Number(a.x)||0)-width:w*(Number(a.x)||0);
 const top=a.ySide==='bottom'?h-h*(Number(a.y)||0)-height:h*(Number(a.y)||0);
 return {left:clamp(left,0,Math.max(0,w-width)),top:clamp(top,0,Math.max(0,h-height)),scale,
  opacity:clamp(a.opacity===undefined?.7:Number(a.opacity),.20,1)};
}
export function installHudEditor(t){
 const root=t.root,button=root?.querySelector?.('.hud-edit'),panel=root?.querySelector?.('.hf-hud-editor');
 const api={active:false,selected:null,restore:null,toggle:null,reset:null,save:null,restored:false};
 if(!root||!button||!panel)return api;
 const all=()=>[...root.querySelectorAll(query.replaceAll('#hf-touch ',''))].filter(n=>!!hudNodeId(n));
 const read=()=>{
  try{
   const newer=globalThis.localStorage?.getItem(LAYOUT_KEY);
   if(newer)return JSON.parse(newer);
   const old=JSON.parse(globalThis.localStorage?.getItem(PREVIOUS_KEY)||'{}');
   const layout={};
   for(const [id,o] of Object.entries(old)){
    if(!o||!Number.isFinite(o.x)||!Number.isFinite(o.y))continue;
    const node=all().find(n=>hudNodeId(n)===id);
    const elw=node?.offsetWidth??55,elh=node?.offsetHeight??55;
    const {w,h}=vp(),px=o.x*Math.max(1,w-elw),py=o.y*Math.max(1,h-elh);
    layout[id]=captureAnchor({left:px,top:py,right:px+elw,bottom:py+elh,width:elw,height:elh},
       w,h,o.scale??1,.7);
   }
   return layout;
  }catch{return {}}
 };
 const persist=layout=>{try{globalThis.localStorage?.setItem(LAYOUT_KEY,JSON.stringify(layout))}catch{}};
 const size=n=>({w:n.offsetWidth||n.getBoundingClientRect().width,h:n.offsetHeight||n.getBoundingClientRect().height});
 const show=(node,anchor)=>{
  if(!node||!anchor)return;
  const {w,h}=vp(),dim=size(node),p=positionFromAnchor(anchor,w,h,dim.w,dim.h);
  node.style.left=p.left+'px';node.style.top=p.top+'px';
  node.style.right='auto';node.style.bottom='auto';
  node.style.transform='scale('+p.scale+')';node.style.transformOrigin='top left';
  node.style.opacity=String(p.opacity);
  node.dataset.hfModified='1';node.dataset.hfScale=String(p.scale);
  node.dataset.hfOpacity=String(p.opacity);
 };
 const anchored=node=>{
  const rect=node.getBoundingClientRect(),{w,h}=vp();
  return captureAnchor(rect,w,h,Number(node.dataset.hfScale)||1,Number(node.dataset.hfOpacity)||.7);
 };
 const collect=()=>{
  const layout=read();
  for(const node of all())if(node.dataset.hfModified==='1')layout[hudNodeId(node)]=anchored(node);
  return layout;
 };
 const save=()=>{const layout=collect();persist(layout);return layout};
 const restore=()=>{
  if(root.hidden)return false;const layout=read();
  for(const node of all())if(layout[hudNodeId(node)])show(node,layout[hudNodeId(node)]);
  return true;
 };
 const reset=()=>{
  for(const n of all()){
   for(const key of ['left','top','right','bottom','transform','transformOrigin','opacity'])n.style[key]='';
   for(const key of ['hfModified','hfScale','hfOpacity'])delete n.dataset[key];
  }
  try{globalThis.localStorage?.removeItem(LAYOUT_KEY);
      globalThis.localStorage?.removeItem(PREVIOUS_KEY)}catch{}
  api.selected=null;updateControls();
 };
 const by=s=>panel.querySelector(s),label=by('[data-hud-selected]'),
  percent=by('[data-hud-size]'),alpha=by('[data-hud-opacity]'),
  sizeNum=by('[data-hud-size-number]'),opacityNum=by('[data-hud-opacity-number]'),
  xNum=by('[data-hud-x]'),yNum=by('[data-hud-y]');
 function updateControls(){
  const n=api.selected,dim=n?.getBoundingClientRect(),{w,h}=vp();
  if(label)label.textContent=n?(n.getAttribute('aria-label')||n.textContent?.trim()?.slice(0,20)||hudNodeId(n)):'Elegí un control';
  const pct=Math.round(100*(Number(n?.dataset?.hfScale)||1));
  const op=Math.round(100*(Number(n?.dataset?.hfOpacity)||.7));
  if(percent)percent.value=String(pct);if(sizeNum)sizeNum.value=String(pct);
  if(alpha)alpha.value=String(op);if(opacityNum)opacityNum.value=String(op);
  if(xNum)xNum.value=String(dim?Math.round(100*dim.left/w):0);
  if(yNum)yNum.value=String(dim?Math.round(100*dim.top/h):0);
 }
 function resizeSelected(pct){
  const n=api.selected;if(!n)return;
  const rect=n.getBoundingClientRect(),{w,h}=vp();
  const anchor=captureAnchor(rect,w,h,clamp(pct/100,.60,1.70),
    Number(n.dataset.hfOpacity)||.7);
  show(n,anchor);save();updateControls();
 }
 function opacitySelected(pct){
  const n=api.selected;if(!n)return;
  n.dataset.hfOpacity=String(clamp(pct/100,.20,1));n.style.opacity=n.dataset.hfOpacity;
  n.dataset.hfModified='1';save();updateControls();
 }
 function moveSelected(axis,pct){
  const n=api.selected;if(!n)return;
  const rect=n.getBoundingClientRect(),{w,h}=vp();
  const left=axis==='x'?clamp(pct,0,100)*w/100:rect.left;
  const top=axis==='y'?clamp(pct,0,100)*h/100:rect.top;
  const anchor=captureAnchor({left,top,right:left+rect.width,bottom:top+rect.height,
   width:rect.width,height:rect.height},w,h,Number(n.dataset.hfScale)||1,
   Number(n.dataset.hfOpacity)||.7);
  show(n,anchor);save();updateControls();
 }
 const toggle=(forced)=>{
  api.active=forced===undefined?!api.active:!!forced;
  root.dataset.editing=api.active?'1':'0';t.editing=api.active;
  button.dataset.active=api.active?'1':'0';panel.hidden=!api.active;
  t.held?.clear?.();t.pressed?.clear?.();t.x=t.y=0;
  if(api.active){t.actionPanel&&(t.actionPanel.hidden=true);t.actionsOpen=false;
   api.selected=root.querySelector('.atk');updateControls();
  }else{drag=null;save();}
  return api.active;
 };
 let drag=null;
 root.addEventListener('pointerdown',e=>{
  if(!api.active||e.target?.closest?.('.hf-hud-editor'))return;
  const node=e.target?.closest?.('[data-a],.stick,.hf-vitals,.hf-quests,.hf-fps');
  if(!node||!hudNodeId(node))return;
  e.preventDefault?.();e.stopImmediatePropagation?.();
  const rect=node.getBoundingClientRect();
  drag={node,id:e.pointerId,startX:e.clientX,startY:e.clientY,left:rect.left,top:rect.top};
  api.selected=node;updateControls();
  try{node.setPointerCapture(e.pointerId)}catch{}
 },true);
 root.addEventListener('pointermove',e=>{
  if(!api.active||!drag||drag.id!==e.pointerId)return;
  e.preventDefault?.();e.stopImmediatePropagation?.();
  const n=drag.node,{w,h}=vp(),rect=n.getBoundingClientRect();
  const left=clamp(drag.left+e.clientX-drag.startX,0,Math.max(0,w-rect.width));
  const top=clamp(drag.top+e.clientY-drag.startY,0,Math.max(0,h-rect.height));
  const anchor=captureAnchor({left,top,right:left+rect.width,bottom:top+rect.height,
    width:rect.width,height:rect.height},w,h,Number(n.dataset.hfScale)||1,
    Number(n.dataset.hfOpacity)||.7);
  show(n,anchor);updateControls();
 },true);
 for(const evt of ['pointerup','pointercancel','lostpointercapture'])
  root.addEventListener(evt,e=>{
   if(!drag||e.pointerId!==drag.id)return;
   e.preventDefault?.();e.stopImmediatePropagation?.();drag=null;save();
  },true);
 for(const ctrl of panel.querySelectorAll('[data-hud-op]'))
  ctrl.addEventListener('pointerdown',e=>{
   e.preventDefault?.();e.stopPropagation?.();
   const op=ctrl.dataset.hudOp;
   if(op==='save'){toggle(false);return;}
   if(op==='reset'){reset();return;}
   if(op==='smaller'||op==='larger')resizeSelected((Number(api.selected?.dataset.hfScale)||1)*100+
     (op==='smaller'?-5:5));
  });
 for(const [el,fn] of [[percent,resizeSelected],[sizeNum,resizeSelected],
  [alpha,opacitySelected],[opacityNum,opacitySelected],
  [xNum,v=>moveSelected('x',v)],[yNum,v=>moveSelected('y',v)]]){
  el?.addEventListener?.('input',()=>fn(Number(el.value)));
  el?.addEventListener?.('change',()=>fn(Number(el.value)));
 }
 // Move the editor itself, without touching the saved HUD layout.
 const panelHandle=panel.querySelector('[data-hud-panel-handle]');
 let pd=null;
 panelHandle?.addEventListener('pointerdown',e=>{
  if(e.target.closest('button'))return;
  const r=panel.getBoundingClientRect();
  panel.style.left=r.left+'px';panel.style.top=r.top+'px';
  panel.style.right='auto';panel.style.bottom='auto';panel.style.transform='none';
  pd={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top};
  try{panelHandle.setPointerCapture(e.pointerId)}catch{}
  e.preventDefault();e.stopPropagation();
 });
 panelHandle?.addEventListener('pointermove',e=>{
  if(!pd||e.pointerId!==pd.id)return;
  const {w,h}=vp();
  panel.style.left=clamp(pd.left+e.clientX-pd.x,0,Math.max(0,w-panel.offsetWidth))+'px';
  panel.style.top=clamp(pd.top+e.clientY-pd.y,0,Math.max(0,h-panel.offsetHeight))+'px';
  e.preventDefault();e.stopPropagation();
 });
 const endPanel=e=>{if(pd&&e.pointerId===pd.id){pd=null;e.preventDefault();e.stopPropagation();}};
 panelHandle?.addEventListener('pointerup',endPanel);
 panelHandle?.addEventListener('pointercancel',endPanel);
 const collapse=panel.querySelector('[data-hud-op="collapse"]');
 collapse?.addEventListener('pointerdown',e=>{
  const small=panel.dataset.minimized!=='1';
  panel.dataset.minimized=small?'1':'0';collapse.textContent=small?'□':'−';
  e.stopPropagation();e.preventDefault();
 });
 const reflow=()=>{
  if(root.hidden)return;
  const layout=read();
  for(const n of all())if(layout[hudNodeId(n)])show(n,layout[hudNodeId(n)]);
  const {w,h}=vp();
  if(panel.style.left)panel.style.left=clamp(parseFloat(panel.style.left)||0,0,Math.max(0,w-panel.offsetWidth))+'px';
  if(panel.style.top)panel.style.top=clamp(parseFloat(panel.style.top)||0,0,Math.max(0,h-panel.offsetHeight))+'px';
  updateControls();
 };
 // Fullscreen and mobile browser toolbars change viewport independently.
 const postResize=()=>{globalThis.requestAnimationFrame?.(()=>globalThis.requestAnimationFrame?.(reflow));};
 globalThis.addEventListener?.('resize',postResize);
 globalThis.addEventListener?.('orientationchange',postResize);
 globalThis.document?.addEventListener?.('fullscreenchange',postResize);
 api.restored=!root.hidden&&restore();
 Object.assign(api,{toggle,reset,save,restore,reflow});
 return api;
}
