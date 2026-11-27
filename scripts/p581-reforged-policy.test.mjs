import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approach,selectApproach,affinityOnce,npcBudget} from '../src/highfly/p581-reforged-policy.mjs';
import {conformRoadTriangle} from '../src/highfly/p581-road-conform.mjs';
const p={seed:3,bounds:{minX:0,maxX:100,minZ:0,maxZ:100}};
const approaching=approach(p,{x:-1700,z:50},{x:100,z:0});
assert(approaching.prefetch&&approaching.mount===false);
assert(approach(p,{x:-600,z:50},{x:100,z:0}).mount);
assert(!approach(p,{x:-1700,z:50},{x:-100,z:0}).prefetch);
assert(!approach(p,{x:-1700,z:500},{x:100,z:0}).prefetch);
assert.equal(selectApproach([p],{x:-500,z:50},{x:100,z:0},3),null);
const state={affinity:0};assert(affinityOnce(state,'first-respect',2));for(let i=0;i<100;i++)assert(!affinityOnce(state,'first-respect',2));assert.equal(state.affinity,2);
const persisted=JSON.parse(JSON.stringify(state));assert(!affinityOnce(persisted,'first-respect',2));assert(affinityOnce(persisted,'first-disrespect',-3));assert.equal(persisted.affinity,-1);
assert.equal(npcBudget(45,16),14);assert.equal(npcBudget(50,10),10);assert.equal(npcBudget(16,24),24);
const grid={b:{minX:0,minZ:0,maxX:2,maxZ:2},nx:2,nz:2,pos:[]};
for(let z=0;z<=2;z++)for(let x=0;x<=2;x++)grid.pos.push(x,x===1&&z===1?2:0,z);
const y=(x,z)=>{const i=Math.min(1,Math.floor(x)),j=Math.min(1,Math.floor(z)),u=x-i,v=z-j,k=j*3+i,h=n=>grid.pos[n*3+1];return u+v<=1?h(k)+(h(k+1)-h(k))*u+(h(k+3)-h(k))*v:h(k+4)+(h(k+3)-h(k+4))*(1-u)+(h(k+1)-h(k+4))*(1-v)};
const tri=conformRoadTriangle([[.1,.1],[1.9,.1],[.1,1.9]],grid);
assert(tri.length>9);
for(let i=0;i<tri.length;i+=9){for(const w of [[1/3,1/3,1/3],[.6,.2,.2],[.2,.6,.2]]){let x=0,h=0,z=0;for(let j=0;j<3;j++){x+=tri[i+j*3]*w[j];h+=tri[i+j*3+1]*w[j];z+=tri[i+j*3+2]*w[j]}assert(Math.abs(h-y(x,z)-.018)<1e-7)}}
console.log('HF581_POLICY_OK swept flight, persistent dialogue decisions, adaptive budget, exact dry road conformity');

// Guard against accidental subtraction when reading hyphenated decision IDs.
for(const file of ['p570-living-world.mjs','p580-native-population.mjs']){
 const source=readFileSync(new URL('../src/highfly/'+file,import.meta.url),'utf8');
 assert(!/\.decisions\?\.[\w]+-\w+/.test(source),'Invalid decision property access: '+file);
 assert(source.includes("q.decisions?.['first-disrespect']"),'Missing safe dialogue decision lookup: '+file);
}
console.log('HF581_DIALOGUE_KEYS_OK');
