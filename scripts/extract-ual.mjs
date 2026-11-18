import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
// Extract only 3 CC0 animation clips from pinned Standard GLBs.
// No Quaternius mannequin or source GLB is shipped to Pages.
const map={
 spine_01:'spine',spine_03:'chest',
 upperarm_l:'upperarm.l',lowerarm_l:'lowerarm.l',hand_l:'hand.l',
 upperarm_r:'upperarm.r',lowerarm_r:'lowerarm.r',hand_r:'hand.r',
 thigh_l:'upperleg.l',calf_l:'lowerleg.l',foot_l:'foot.l',
 thigh_r:'upperleg.r',calf_r:'lowerleg.r',foot_r:'foot.r'
};
function load(file){
 const buf=fs.readFileSync(file);
 if(buf.toString('ascii',0,4)!=='glTF')throw Error('Not GLB');
 let json,bin,i=12;
 while(i<buf.length){
  const len=buf.readUInt32LE(i),type=buf.readUInt32LE(i+4);i+=8;
  if(type===0x4e4f534a)json=JSON.parse(buf.subarray(i,i+len).toString('utf8'));
  if(type===0x004e4942)bin=buf.subarray(i,i+len);i+=len;
 }
 if(!json||!bin)throw Error('GLB missing JSON/BIN');
 return {json,bin};
}
function accessor(source,id){
 const a=source.json.accessors[id],v=source.json.bufferViews[a.bufferView];
 if(a.componentType!==5126)throw Error('Only FLOAT accessors allowed');
 const count={SCALAR:1,VEC3:3,VEC4:4}[a.type];
 if(!count)throw Error('Unsupported glTF accessor '+a.type);
 const start=(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||count*4,values=[];
 for(let i=0;i<a.count;i++)for(let j=0;j<count;j++)
  values.push(+source.bin.readFloatLE(start+i*stride+j*4).toFixed(5));
 return values;
}
function mul(a,b){return [
 a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
 a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
 a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
 a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
function extract(file,name,destination){
 const glb=load(file),nodes=glb.json.nodes,parents=Array(nodes.length).fill(-1);
 for(let i=0;i<nodes.length;i++)for(const child of nodes[i].children||[])parents[child]=i;
 const rest=i=>nodes[i].rotation||[0,0,0,1],cache=new Map();
 function world(i){if(i<0)return [0,0,0,1];if(cache.has(i))return cache.get(i);
  const q=mul(world(parents[i]),rest(i));cache.set(i,q);return q;}
 const clip=glb.json.animations.find(a=>a.name===name);
 if(!clip)throw Error('Quaternius clip unavailable: '+name);
 const bones=[];
 for(const channel of clip.channels){
  if(channel.target.path!=='rotation')continue;
  const node=channel.target.node,target=map[nodes[node].name];if(!target)continue;
  const sampler=clip.samplers[channel.sampler];
  const times=accessor(glb,sampler.input),values=accessor(glb,sampler.output);
  if(times.length<2||values.length!==times.length*4)throw Error('Invalid clip '+name);
  bones.push({target,rest:rest(node).map(v=>+v.toFixed(5)),
   parent:world(parents[node]).map(v=>+v.toFixed(5)),times,values});
 }
 if(bones.length<10)throw Error('Too few source bones for retarget: '+name);
 destination.clips[name]={duration:Math.max(...bones.flatMap(t=>t.times)),bones};
}
const [ual1,ual2,out]=process.argv.slice(2);
if(!ual1||!ual2||!out)throw Error('Expected UAL1, UAL2 and output paths');
const data={schema:1,origin:'Quaternius Universal Animation Library 1 + 2 Standard, CC0',clips:{}};
extract(ual1,'Swim_Idle_Loop',data);
extract(ual1,'Swim_Fwd_Loop',data);
extract(ual2,'ClimbUp_1m',data);
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(data));
console.log('[HIGHFLY F0.11 UAL extracted]',Object.entries(data.clips).map(([k,v])=>k+':'+v.bones.length).join(' / '),
 fs.statSync(out).size,'sha256='+crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex'));
