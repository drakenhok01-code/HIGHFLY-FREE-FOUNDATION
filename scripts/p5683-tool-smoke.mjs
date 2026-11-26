import {chromium} from 'playwright';import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true,isMobile:true});let report={ok:false,rows:[],errors:[]};page.on('pageerror',e=>report.errors.push(String(e)));
try{
await page.goto('http://127.0.0.1:4173/HIGHFLY-FREE-FOUNDATION/preview-p55/?hfqa=1',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForFunction(()=>window.__hero?.workTools&&window.__game?.player?._hfProfession,{},{timeout:600000});
await page.evaluate(()=>{const g=window.__game;g.state='playing';g.input.enabled=true;g.emit('state',{state:'playing'})});
report.rows=await page.evaluate(()=>{
 const g=window.__game,p=g.player,h=window.__hero,w=p.world,prof=p._hfProfession,save=p.pos.clone(),yaw=p.yaw,old=w.highflyInteractables,inv={...prof.inventory},rows=[];const input=(press=[],x=0)=>({pressed:new Set(press),held:new Set(),move:{x,y:0},look:{x:0,y:0},zoom:0});const step=(press=[],x=0)=>{p.update(.05,input(press,x),0);h.update(.05,p)};
 const jobs=[['collectWood','woodPile','axe','wood'],['collectStone','stonePile','pickaxe','stone'],['chop','tree','axe','wood'],['mine','ore','pickaxe','ore'],['fishing','fishSpot','rod','fish'],['plant','soil','hoe',null,'empty'],['water','soil','watering_can',null,'seeded'],['harvest','soil','sickle','herb','ripe'],['smelt','furnace','tongs','ingot'],['forge','forge','hammer','blade_blank']];
 try{for(const [action,kind,tool,product,phase] of jobs){
  p.spawn(save.x,save.y,save.z,0);p.grounded=true;p.setState('move');prof.inventory.seed=10;prof.inventory.ore=10;prof.inventory.ingot=10;
  const node={id:'qa-work-'+action,kind,x:p.pos.x,y:p.pos.y,z:p.pos.z+1.25,phase,available:true,charges:4};w.highflyInteractables=[node];
  const before=product?prof.inventory[product]??0:0,weapon=h.weaponMode.id;const nodes=[...h.gearNodes.values(),...h.extraWeapons.values()],visibility=nodes.map(n=>n.visible);
  step([action]);const started=p.state==='hf_action';for(let i=0;i<17;i++)step();
  const prop=h.workTools.tools.get(tool);const visible=prop?.visible===true&&prop.parent===h.socket&&h.workTools.active===tool;
  const hidden=nodes.every(n=>!n.visible),line=action!=='fishing'||h.workTools.line.visible&&h.workTools.bobber.visible;
  const beforePos=prop?.getWorldPosition(p.pos.clone());for(let i=0;i<5;i++)step();const motion=beforePos&&prop.getWorldPosition(p.pos.clone()).distanceTo(beforePos)>0.002;
  for(let i=0;i<95&&p.state==='hf_action';i++)step();const restored=h.workTools.active===null&&nodes.every((n,i)=>n.visible===visibility[i])&&h.weaponMode.id===weapon&&(!prop||!prop.visible)&&!h.workTools.line.visible;
  const gain=product?(prof.inventory[product]??0)-before:0;rows.push({action,tool,started,visible,hidden,line,motion,restored,gain,product,phase:node.phase});
  p.spawn(save.x,save.y,save.z,0);p.grounded=true;p.setState('move');node.available=true;node.charges=4;if(phase)node.phase=phase;const n=product?prof.inventory[product]??0:0;step([action]);step([],1);rows.at(-1).cancelled=h.workTools.active===null&&(!product||(prof.inventory[product]??0)===n)&&nodes.every((v,i)=>v.visible===visibility[i]);
 }}finally{w.highflyInteractables=old;prof.inventory=inv;p._hfProfessionSave?.();p.spawn(save.x,save.y,save.z,yaw);h.update(.05,p)}
 return rows;
});
console.log('HF5683_TOOLS '+JSON.stringify(report.rows));if(report.rows.length!==10||report.rows.some(r=>!r.started||!r.visible||!r.hidden||!r.line||!r.restored||!r.cancelled||r.product&&r.gain<=0))throw Error('Tool transaction, grip or weapon restoration failed');
report.ok=true;
}catch(e){report.errors.push(String(e));console.error(e)}finally{await browser.close();fs.writeFileSync('p5683-tool-smoke.json',JSON.stringify(report,null,2));console.log('HF5683_TOOL_SUMMARY '+JSON.stringify(report))}
if(!report.ok||report.errors.length)process.exitCode=1;
