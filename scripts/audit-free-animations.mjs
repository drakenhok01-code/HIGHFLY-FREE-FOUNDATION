import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const source='https://media.githubusercontent.com/media/MightyBubble/Ludots-Assets/fab331eff1cb9c552c60399ea10186ef675cd460/animations/KayKit-Character-Animations-Free-1.1.zip';
const sha='65882f31f905ad2e953819648a59287cdeab8f623908d5ef701971d3758be20f';
const response=await fetch(source,{signal:AbortSignal.timeout(60000)});
if(!response.ok)throw Error('CC0 animation archive unavailable '+response.status);
const bytes=Buffer.from(await response.arrayBuffer());
if(bytes.length!==14858957)throw Error('Archive size changed '+bytes.length);
if(crypto.createHash('sha256').update(bytes).digest('hex')!==sha)throw Error('Official CC0 animation ZIP SHA mismatch');
const file=path.join(os.tmpdir(),'KayKit-Character-Animations-Free-1.1.zip');
fs.writeFileSync(file,bytes);
const members=execFileSync('unzip',['-Z','-1',file],{encoding:'utf8',maxBuffer:5e6}).trim().split('\n');
const medium=members.filter(x=>/Rig_Medium.*\.glb$/i.test(x));
const large=members.filter(x=>/Rig_Large.*\.glb$/i.test(x));
const tool=medium.filter(x=>/Tools/i.test(x));
const toolBytes=execFileSync('unzip',['-p',file,tool[0]],{maxBuffer:40_000_000});
if(toolBytes.toString('ascii',0,4)!=='glTF'||toolBytes.toString('ascii',16,20)!=='JSON')
 throw Error('Rig_Medium_Tools.GLTF invalid');
const toolsGltf=JSON.parse(toolBytes.subarray(20,20+toolBytes.readUInt32LE(12)).toString('utf8'));
const toolClips=(toolsGltf.animations||[]).map(a=>a.name);
const targetNames=[...new Set((toolsGltf.animations||[]).flatMap(a=>(a.channels||[]).map(c=>toolsGltf.nodes[c.target?.node]?.name||'MISSING')))].sort();
if(toolClips.length<8||!targetNames.some(x=>/hand|arm/i.test(x)))
 throw Error('Tool animation GLB has no usable Medium clips or channels');
console.log('[KAYKIT FREE 1.1 MEDIUM TOOL CLIPS]',JSON.stringify({count:toolClips.length,clips:toolClips,animatedNodes:targetNames.length,rigNodes:targetNames}));

const report={source,sha256:sha,bytes:bytes.length,totalMembers:members.length,medium,large,tool,toolClips,toolAnimationNodes:targetNames,
  note:'Exact legal CC0 free archive, downloaded and hash-checked. Data not included in public game yet.'};
console.log('[KAYKIT FREE 1.1 VERIFIED ARCHIVE]',JSON.stringify(report));
fs.writeFileSync('qa-kaykit-free-animations.json',JSON.stringify(report,null,2));
if(!tool.length||medium.length<5)throw Error('Missing medium tools animation GLBs');
