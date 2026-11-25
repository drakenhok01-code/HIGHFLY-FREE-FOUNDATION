#!/usr/bin/env python3
"""P523: convert original Unsung gzipped uint16 heightmaps to byte-exact PNG height
channels plus scenic aerial previews. Browser NEVER needs to gzip-decode .bin.
Canonical source: immutable .work/unsung/public/world/{core,region}_h.bin.
Output: public/highfly/native-terrain-{core,region}.png and
native-relief-{core,region}.png, native-terrain-manifest.json.
"""
from pathlib import Path
from PIL import Image
import gzip,json,hashlib
import numpy as np
root=Path.cwd()
world=root/'public/world'
dest=root/'public/highfly'
dest.mkdir(parents=True,exist_ok=True)
meta=json.loads((world/'world.json').read_text())
out={'schema':3,'source':'native Unsung unmodified 16-bit heightmaps','maps':{},'meta':meta}
for k in ('core','region'):
 m=meta[k]
 path=world/(k+'_h.bin')
 raw=gzip.decompress(path.read_bytes())
 expected=m['res']*m['res']*2
 if len(raw)!=expected:raise RuntimeError(f'{k} unpack mismatch {len(raw)} expected {expected}')
 quant=np.frombuffer(raw,dtype='<u2').reshape((m['res'],m['res']))
 # RGBA PNG: high, low, sanity=165, 255. No compressor/content-encoding ambiguity.
 packed=np.empty((m['res'],m['res'],4),dtype=np.uint8)
 packed[:,:,0]=quant>>8
 packed[:,:,1]=quant&255
 packed[:,:,2]=165
 packed[:,:,3]=255
 # Unit tests: packed *byte-exact* back to the original unsigned 16-bit grid.
 recovered=(packed[:,:,0].astype(np.uint16)<<8)|packed[:,:,1].astype(np.uint16)
 if not np.array_equal(recovered,quant):raise RuntimeError('PNG height encoding did not round-trip')
 name='native-terrain-'+k+'.png'
 Image.fromarray(packed,'RGBA').save(dest/name,optimize=True,compress_level=7)
 height=m['min']+quant.astype(np.float32)*((m['max']-m['min'])/65535)
 # Aerial appearance based on ORIGINAL terrain, not a stock texture.
 # Use 16-bit world data and local height gradient for a crisp cartographic display.
 step=float(m['size'])/m['res']
 dz,dx=np.gradient(height,step)
 slope=np.sqrt(dx*dx+dz*dz)
 lighting=np.clip((dz-dx)*5,-34,34)
 sea=height<-.12
 shore=(height>=-.12)&(height<2.8)
 grass=(height>=2.8)&(slope<=.7)
 rocky=(height>=2.8)&(slope>.7)
 # Critical P533 visual bug: original script painted *every* terrace above
 # 160m grey. Arvelia's flat elevated lawns are genuine GRASS, not high cliffs.
 # Keep high-altitude rock gray ONLY on genuinely steep rock faces.
 high=(height>160)&(slope>1.15)
 rgb=np.zeros((m['res'],m['res'],3),dtype=np.float32)
 rgb[:]=[76,119,86]
 rgb[grass]=[69,130,79]  # native elevated meadow: distinct, readable green
 rgb[rocky]=[125,126,119]  # mountain and cliff stone
 rgb[high]=[147,148,140]  # only steep high altitude cliff
 rgb[shore]=[174,162,120]
 rgb[sea]=[39,86,112]
 # Height contours are visual (no effect on terrain or editing placement).
 band=np.abs(np.mod(height+10000,20)-10)<.4
 rgb[band&~sea]*=.84
 rgb+=lighting[:,:,None]
 rgb=np.clip(rgb,0,255).astype(np.uint8)
 scenic=dest/('native-relief-'+k+'.png')
 Image.fromarray(rgb,'RGB').save(scenic,optimize=True,compress_level=7)
 out['maps'][k]={
  'res':m['res'],'size':m['size'],'min':m['min'],'max':m['max'],
  'expectedRawBytes':expected,'gzipBytes':path.stat().st_size,
  'quantSha256':hashlib.sha256(raw).hexdigest(),
  'packedPNG':name,'reliefPNG':scenic.name,
  'packedPngBytes':(dest/name).stat().st_size,
  'scenicPngBytes':scenic.stat().st_size
 }
 print(f'[P523 VERIFIED] {k}: {expected} raw bytes => PNG {out["maps"][k]["packedPngBytes"]:,} + relief {out["maps"][k]["scenicPngBytes"]:,}; {m["res"]}² exact height samples')
(dest/'native-terrain-manifest.json').write_text(json.dumps(out,separators=(',',':')))
print('[P523 PASS] Byte-exact height channels, native 16-bit terrain, PNG fallback ready')
