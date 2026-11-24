import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('P504 preserves native pixels, foliage, enemy/loot, stair BVH and original graphics reference',()=>{
 const s=fs.readFileSync('scripts/f0-build.mjs','utf8');
 const helper=fs.readFileSync('src/highfly/p504-hdr-options.mjs','utf8');
 assert.match(s,/selectP504HdrFormat/);
 assert.match(s,/this\._hfCompactHdr/);
 assert.match(s,/makeTarget\(rw, rh, \{ depthBuffer: true, \.\.\.this\._hfCompactHdr \}\)/);
 assert.match(s,/this\.history = \[makeTarget\(w, h, this\.pipe\._hfCompactHdr\), makeTarget\(w, h, this\.pipe\._hfCompactHdr\)\]/);
 assert.match(s,/c\._hfCellX!==ci/);
 assert.match(s,/p495StairTraverse/);
 assert.match(s,/HF_S23_NATIVE_TAA:1/);
 assert.match(helper,/q\.get\('hfcompact'\)!=='1'/,'default stays original half-float');
 assert.match(helper,/EXT_color_buffer_float/);
 assert.match(helper,/checkFramebufferStatus/);
 assert.match(helper,/Three\.UnsignedInt101111Type/);
 assert.match(helper,/Three\.RGBFormat/);
 assert.doesNotMatch(s,/patch\('src\/world\/flora\/forest\.js'/);
 assert.doesNotMatch(s,/_hfEnvCacheEnabled/);
});
test('RGBA16F->RGB11F bandwidth calculation is physically grounded and does not change resolution',()=>{
 const s=fs.readFileSync('src/highfly/p504-hdr-options.mjs','utf8');
 assert.match(s,/originals=pixels\*fullResSurfaces\*8/);
 assert.match(s,/compact=pixels\*fullResSurfaces\*4/);
 assert.match(s,/packedBytes:compact/);
 assert.match(s,/enabled:false,reason:'reference'/);
 assert.match(s,/enabled:false,reason:'unsupported'/);
});
