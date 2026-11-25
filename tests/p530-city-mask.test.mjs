import assert from 'node:assert/strict';
import {buildWorldForgeCityMask} from '../src/highfly/p530-city-ground-mask.mjs';
const dims={'floor-stone':[4,4],'floor-earth':[4,4],'kaykit-home-a':[10,9],'unsung-lantern':[1.6,1.6]};
const empty=buildWorldForgeCityMask([],dims,{resolution:128});
assert.equal(empty.painted,0);
const a=buildWorldForgeCityMask([
 {type:'floor-stone',x:0,z:0,scale:1,yaw:0},
 {type:'floor-stone',x:4,z:0,scale:1,yaw:0},
 {type:'kaykit-home-a',x:30,z:30,scale:1,yaw:.3,clearTrees:true},
 {type:'unsung-lantern',x:-80,z:-80,scale:1,yaw:0,clearTrees:false}
],dims,{resolution:512});
assert.equal(a.surfaces,3,'only floors and approved building lots clear grass');
assert.ok(a.painted>6,'roads should mask ground pixels');
const at=(x,z)=>(Math.floor((z+1024)/4)*512+Math.floor((x+1024)/4));
assert.equal(a.mask[at(0,0)],255,'pavement center must be cleared');
assert.equal(a.mask[at(4,0)],255,'adjacent paving must be continuous');
assert.equal(a.mask[at(-80,-80)],0,'native grass outside streets untouched');
assert.equal(a.mask[at(780,780)],0,'forest outside town unchanged');
assert.equal(a.mask.length,512*512);
assert.throws(()=>buildWorldForgeCityMask([],dims,{resolution:5000}));
console.log('[P530 CITY MASK PASS]',a.surfaces,'urban surfaces; ',a.painted,'native grass/flowers mask texels');
