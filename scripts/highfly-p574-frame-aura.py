#!/usr/bin/env python3
"""P573: original ornate wooden-item frame master, same geometry for six grades.
Composite once at build time; no extra runtime layer, no CSS transform.
The approved mineral atlas and three-bar ingot cutout remain the painting sources.
"""
import sys,io,base64,math,hashlib,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageOps
import numpy as np
root,rarity,icons=map(Path,sys.argv[1:4])
grades=['comun','poco-comun','raro','epico','legendario','mitico']
# Every pixel on the outer ring and central lower jewel is copied from
# the same approved frame. A feather is confined to the safe interior.
yy,xx=np.mgrid[:256,:256]
edge=np.minimum.reduce([xx,yy,255-xx,255-yy])
rim=np.clip((36-edge)/7,0,1)
# The wood icon's centered bottom diamond and sweeping filigree are intact.
# Guard the complete lower band and the center rise of the ornament.
half=np.abs(xx-127.5)
bottom_limit=217-25*np.maximum(0,1-half/55)
bottom=np.clip((yy-bottom_limit+5)/5,0,1)
top=np.clip((30+9*np.maximum(0,1-half/30)-yy)/5,0,1)
mask=np.maximum.reduce([rim,bottom,top])
mask=Image.fromarray(np.rint(mask*255).astype('uint8'),'L')
solid=np.asarray(mask)==255
assert solid[235,128] and solid[207,128] and solid[128,10]
masters={g:Image.open(rarity/'items'/('wood__'+g+'.webp')).convert('RGBA') for g in grades}
assert all(m.size==(256,256) for m in masters.values())
# Stable purple vignette. No previous frame is resized into the new artwork.
dist=np.hypot((xx-127.5)/119,(yy-119)/117)
glow=np.maximum(0,1-dist)
back=np.stack([20+24*glow,10+14*glow,36+48*glow,np.full_like(glow,255)],axis=2)
background=Image.fromarray(np.uint8(back),'RGBA')
# Electric-blue energy sweeps continuously behind the art, without a dark inset.
def make_aura():
    layer=Image.new('RGBA',(256,256));d=ImageDraw.Draw(layer)
    for box,start,end in [((35,30,221,219),115,263),((35,30,221,219),-65,75),((43,36,213,211),106,238),((43,36,213,211),-48,68)]:
        d.arc(box,start,end,fill=(15,77,255,185),width=7)
    glow=layer.filter(ImageFilter.GaussianBlur(7))
    bright=Image.new('RGBA',(256,256));d=ImageDraw.Draw(bright)
    d.arc((36,31,220,218),121,244,fill=(16,150,255,180),width=3)
    d.arc((36,31,220,218),-54,69,fill=(27,172,255,185),width=3)
    d.arc((43,39,213,208),141,217,fill=(73,225,255,145),width=2)
    d.arc((43,39,213,208),-34,44,fill=(73,225,255,155),width=2)
    glow.alpha_composite(bright.filter(ImageFilter.GaussianBlur(.7)))
    rng=np.random.default_rng(574);d=ImageDraw.Draw(glow)
    for i in range(35):
        x=int(rng.choice([rng.integers(38,69),rng.integers(187,218)]));y=int(rng.integers(46,193))
        r=int(rng.choice([1,1,2]));d.ellipse((x-r,y-r,x+r,y+r),fill=(64,155,255,int(rng.integers(50,180))))
    return glow
aura=make_aura()
background.alpha_composite(aura)
# Restore only missing blue side energy on dim side pixels in legacy icons.
def unify_legacy(im):
    a=np.asarray(im.convert('RGBA'),dtype=np.float32)
    lum=a[:,:,0]*.29+a[:,:,1]*.59+a[:,:,2]*.12
    side=np.maximum(0,1-np.abs(np.abs(xx-127.5)-78)/28)
    dark=np.clip((75-lum)/55,0,1)
    blue=np.clip((a[:,:,2]-a[:,:,0]-25)/65,0,1)
    strength=side*dark*(1-blue)*(1-np.asarray(mask)/255)
    add=np.asarray(aura,dtype=np.float32)
    w=(strength*(add[:,:,3]/255)*.80)[:,:,None]
    a[:,:,:3]=a[:,:,:3]*(1-w)+np.maximum(a[:,:,:3],add[:,:,:3])*w
    return Image.fromarray(np.uint8(np.clip(a,0,255)),'RGBA')
def compose_master(frame,interior):
    return Image.composite(frame,interior,mask)
def place_art(raw,box=(43,33,213,196),opaque=False):
    im=ImageOps.contain(raw.convert('RGBA'),(box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
    pos=(round((box[0]+box[2]-im.width)/2),round((box[1]+box[3]-im.height)/2))
    if opaque:
        # Feather only the source painting's perimeter into the native purple
        # interior. No scaling, rotation or cropping of the premium frame.
        m=Image.new('L',im.size,0);d=ImageDraw.Draw(m)
        d.rounded_rectangle((3,3,im.width-4,im.height-4),radius=20,fill=255)
        m=m.filter(ImageFilter.GaussianBlur(9))
        # Fade the atlas's baked dark background into the new premium aura.
        a=np.asarray(im,dtype=np.float32);h,w=a.shape[:2]
        y,x=np.mgrid[:h,:w];rad=np.hypot((x-(w-1)/2)/(w*.5),(y-(h-1)/2)/(h*.5))
        lum=a[:,:,:3].max(axis=2)
        fade=np.clip((lum-15)/45,0,1)
        protect=np.clip((.85-rad)/.28,0,1)
        alpha=np.asarray(m,dtype=np.float32)*np.maximum(protect,fade)
        im.putalpha(Image.fromarray(np.uint8(np.clip(alpha,0,255)),'L'))
    out=background.copy();out.alpha_composite(im,pos);return out
atlas=Image.open(root/'p47/source-12-icons.jpg').convert('RGBA')
assert atlas.size==(1024,768)
ids=['coal','ore','ore_copper','ore_iron','ore_silver','ore_gold','raw_diamond','raw_obsidian','upgrade_stone','upgrade_stone_advanced','ingot_copper','ore_mithril']
paintings={}
for i,id in enumerate(ids):
    if id=='ingot_copper':continue
    x=i%4*256;y=i//4*256
    paintings[id]=place_art(atlas.crop((x,y,x+256,y+256)),(39,30,217,197),True)
raw=base64.b64decode((root/'p481/copper-triple.webp.b64').read_text().strip(),validate=True)
assert hashlib.sha256(raw).hexdigest()=='832f4f07e35f85eb7b0662e1d58204a350a9d627eda55918a62bae52cd9c85d6'
bars=Image.open(io.BytesIO(raw)).convert('RGBA');assert bars.size==(200,155)
arr=np.asarray(bars,dtype=np.float32);rgb=arr[:,:,:3]
lum=rgb[:,:,0]*.29+rgb[:,:,1]*.59+rgb[:,:,2]*.12
shade=np.clip((lum/124)**.88,.29,1.35);highlight=np.clip((np.max(rgb,axis=2)-lum)/185,0,.32)
palette={'iron':(150,162,179),'steel':(99,143,183),'silver':(216,229,242),'gold':(255,190,66),'diamond':(132,217,248),'obsidian':(105,77,146),'mithril':(82,223,199)}
paintings['ingot_copper']=place_art(bars,(46,48,210,190))
for metal,base in palette.items():
    p=np.clip(np.array(base)[None,None,:]*shade[:,:,None]+(255-np.array(base))[None,None,:]*highlight[:,:,None]*.34,0,255)
    tinted=Image.fromarray(np.dstack([np.uint8(np.rint(p)),arr[:,:,3].astype('uint8')]),'RGBA')
    paintings['ingot_'+metal]=place_art(tinted,(46,48,210,190))
paintings['ingot']=paintings['ingot_iron']
# Original generated transparent illustration, verified Git blob.
wolf_file=root/'p574/wolf-pelt-original.webp'
wolf_bytes=wolf_file.read_bytes()
assert hashlib.sha256(wolf_bytes).hexdigest()=='d240f9fa87997e8cd3de52340ba3ce10c8e1ad9cafdf293ddf71b63711043304'
wolf=Image.open(io.BytesIO(wolf_bytes)).convert('RGBA')
assert wolf.size==(150,141) and wolf.getchannel('A').getextrema()==(0,255)
paintings['wolf_pelt']=place_art(wolf,(43,30,213,193))
# Save preview and explicit standalone internal asset for the source audit.
preview=icons.parent/'p574';preview.mkdir(exist_ok=True)
wolf.resize((256,256),Image.Resampling.LANCZOS).save(preview/'wolf_pelt.webp','WEBP',quality=94)
# All rarity images share exactly the same protective pixels, including the
# original center jewel. Existing normal artwork is not enlarged/repainted.
rows=[]
for g in grades:
    frame=masters[g]
    for typ in ('items','armor','weapons'):
        for path in sorted((rarity/typ).glob('*__'+g+'.webp')):
            id=path.stem.rsplit('__',1)[0]
            source=Image.open(path).convert('RGBA')
            interior=paintings.get(id,unify_legacy(source)) if typ=='items' else unify_legacy(source)
            out=compose_master(frame,interior)
            assert np.array_equal(np.asarray(out)[solid],np.asarray(frame)[solid]),(g,id,'foreground overwritten')
            # Lossless WebP: all six colored frame masters survive byte-exact
            # decoded pixels, including bottom gem (no compression drift).
            out.save(path,'WEBP',lossless=True,method=5,exact=True)
            check=Image.open(path).convert('RGBA')
            assert check.size==(256,256)
            assert np.array_equal(np.asarray(check)[solid],np.asarray(frame)[solid]),(g,id,'lossless verification')
            rows.append({'grade':g,'id':typ+'/'+id,'framePixels':int(solid.sum()),'master':g,'recomposed':typ=='items' and id in paintings})
    frame.save(preview/('frame-master-'+g+'.webp'),'WEBP',lossless=True,exact=True)
# Professions keep approved gilded frames and paintings; fill dim lateral energy.
for path in sorted((icons/'professions').glob('*.webp')):
    original=Image.open(path).convert('RGBA')
    out=unify_legacy(original)
    assert np.array_equal(np.asarray(out)[solid],np.asarray(original)[solid])
    out.save(path,'WEBP',lossless=True,method=5,exact=True)
report={'ok':True,'version':'5.7.4','rarities':grades,'count':len(rows),'protectedPixels':int(solid.sum()),'repainted':sorted(paintings),'wolfSource':'original generated transparent illustration, verified SHA256','aura':'blue lateral arcs, integrated background, protected frame','rows':rows}
(preview/'frame-audit.json').write_text(json.dumps(report,indent=2))
# Visual contact sheet for inspection, not in-game UI.
names=['wood','ore_iron','ore_copper','ore_silver','ingot_copper','ingot_iron','wolf_pelt','hp_potion']
sheet=Image.new('RGBA',(1024,512),(25,14,42,255))
for i,n in enumerate(names):
    p=rarity/'items'/(n+'__comun.webp')
    sheet.alpha_composite(Image.open(p).convert('RGBA'),((i%4)*256,(i//4)*256))
sheet.convert('RGB').save(preview/'frame-contact.jpg',quality=95)
print('HF574_FRAME_AUDIT',json.dumps({k:v for k,v in report.items() if k!='rows'}))
