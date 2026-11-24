import assert from 'node:assert/strict';
import * as THREE from 'three';
import {selectP504HdrFormat,projectedP504Bandwidth} from './p504-hdr-options.mjs';
let inits=0,disposals=0,bindings=0;
const gl={FRAMEBUFFER:36160,FRAMEBUFFER_COMPLETE:36053,
 getExtension:(n)=>n==='EXT_color_buffer_float'?{}:null,
 checkFramebufferStatus:()=>36053};
const renderer={getContext:()=>gl,
 initRenderTarget(rt){inits++;assert.equal(rt.texture.type,THREE.UnsignedInt101111Type);assert.equal(rt.texture.format,THREE.RGBFormat)},
 setRenderTarget(rt){bindings++; if(rt===null)return;assert.equal(rt.width,4);assert.equal(rt.height,4)}};
const yes=selectP504HdrFormat(renderer,'?hfcompact=1',THREE);
assert.equal(yes.enabled,true,yes.reason);
assert.equal(yes.options.type,THREE.UnsignedInt101111Type);
assert.equal(yes.options.format,THREE.RGBFormat);
assert.equal(inits,1);
const target=new THREE.WebGLRenderTarget(2221,1080,{depthBuffer:true,...yes.options});
assert.equal(target.width,2221);assert.equal(target.height,1080);
assert.equal(target.texture.type,THREE.UnsignedInt101111Type);
assert.equal(target.texture.format,THREE.RGBFormat);
target.dispose();
const no=selectP504HdrFormat(renderer,'?hfquality=android&hfpx=native',THREE);
assert.equal(no.enabled,false);
assert.equal(inits,1,'reference path must not touch GPU or create a probe');
const unsupported=selectP504HdrFormat({getContext:()=>({...gl,getExtension:()=>null})},'?hfcompact=1',THREE);
assert.equal(unsupported.enabled,false);
const mixed=selectP504HdrFormat(renderer,'?hfcompact=1&hffastcopy=1',THREE);
assert.equal(mixed.enabled,false);
const incomplete=selectP504HdrFormat({getContext:()=>({...gl,checkFramebufferStatus:()=>999}),...renderer,getContext:()=>({...gl,checkFramebufferStatus:()=>999})},'?hfcompact=1',THREE);
assert.equal(incomplete.enabled,false);
const band=projectedP504Bandwidth(2221,1080);
assert.equal(band.pixels,2398680);
assert.equal(band.originalBytes,2398680*40);
assert.equal(band.packedBytes,2398680*20);
assert.equal(band.savedBytes,2398680*20);
console.log('[HIGHFLY P504 PACKED HDR FORMAT QA PASS]',JSON.stringify({probeCalls:inits,bytesSavedPerFrame:band.savedBytes,MiB:Math.round(band.savedBytes/1048576)}));
