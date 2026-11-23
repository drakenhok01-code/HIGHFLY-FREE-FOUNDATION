import test from 'node:test';
import assert from 'node:assert/strict';
import {physicalFrameSize,installAndroidPhysicalResolution} from '../src/highfly/p498-android-resolution.mjs';

test('native S23 Ultra horizontal physical framebuffer and 1.5x lab sample',()=>{
 const w=physicalFrameSize(980,440,3.15,'native',{maxTextureSize:8192});
 assert.equal(w.w,3087);assert.equal(w.h,1386);assert.equal(w.cssW,980);
 assert.equal(w.hardwareCapped,false);
 const sharp=physicalFrameSize(980,440,3.15,'mid',{maxTextureSize:8192});
 assert.equal(sharp.w,1470);assert.equal(sharp.h,660);
});
test('low-cap mobile GPU respects renderbuffer dimension and pixel budget',()=>{
 const value=physicalFrameSize(1600,900,4,'native',{maxTextureSize:2048,maxPixels:1800000});
 assert.ok(value.w<=2048&&value.h<=2048);
 assert.ok(value.w*value.h<=1800000+2048);
 assert.equal(value.hardwareCapped,true);
});
test('real pipeline setSize runs at physical pixels, keeps CSS style and records real render targets',()=>{
 const canvas={width:0,height:0,style:{}},updates=[],handlers=new Map();
 const win={innerWidth:920,innerHeight:412,devicePixelRatio:3.5,location:{search:'?hfpx=native'},
  addEventListener:(t,f)=>handlers.set(t,f),removeEventListener:(t)=>handlers.delete(t)};
 const gl={MAX_TEXTURE_SIZE:10,MAX_RENDERBUFFER_SIZE:11,drawingBufferWidth:0,drawingBufferHeight:0,
  getParameter:()=>8192};
 const pipe={renderScale:1,renderer:{domElement:canvas,getContext:()=>gl},
  taa:{reset:false,history:[{width:1,height:1}]},
  setSize(w,h){updates.push([w,h]);this.rw=w;this.rh=h;canvas.width=w;canvas.height=h;gl.drawingBufferWidth=w;gl.drawingBufferHeight=h;this.taa.history=[{width:w,height:h}]}};
 const store={setItem(k,v){this.value=v},getItem:()=>null};
 const api=installAndroidPhysicalResolution(pipe,{win,doc:{},storage:store,search:win.location.search});
 assert.equal(updates.length,1);
 assert.deepEqual(updates[0],[3088,1384]);
 assert.equal(canvas.style.width,'920px');
 assert.equal(canvas.style.height,'412px');
 assert.equal(api.measure().drawingBuffer[0],3088);
 assert.equal(api.measure().taaTargets[0][0],3088);
 assert.equal(pipe.taa.reset,true);
 assert.equal(api.set('css'),true);
 assert.deepEqual(updates[1],[920,412]);
 assert.equal(store.value,'css');
 assert.equal(api.set('incorrect'),false);
 api.dispose();
 assert.equal(handlers.has('resize'),false);
});
