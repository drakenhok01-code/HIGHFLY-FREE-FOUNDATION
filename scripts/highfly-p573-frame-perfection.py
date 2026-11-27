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
        m=m.filter(ImageFilter.GaussianBlur(6));im.putalpha(m)
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
# Original procedural painted wolf hide, independent of the old vector icon:
# hand-shaped tanned pelt, multilayer fur, thousands of individual strands,
# shaded dorsal stripe, pale side tufts, naturally tapered legs and tail.
def wolf_hide():
    S=512;rng=np.random.default_rng(573)
    # Unfolded, tanned wolf hide: pointed ears, neck, extended fore/hind legs,
    # narrow waist and a tapered tail. No eyes, blood or live animal.
    pts=[(224,39),(209,61),(195,37),(184,96),(149,127),(105,110),(66,117),(36,148),(49,174),(88,177),(119,165),(157,191),(170,225),(155,262),(111,289),(72,301),(39,330),(52,358),(89,355),(119,339),(164,324),(187,353),(202,386),(225,407),(230,444),(247,482),(267,464),(277,429),(285,393),(315,355),(342,327),(390,350),(421,363),(462,350),(473,327),(438,301),(399,290),(355,260),(341,225),(354,187),(390,164),(424,178),(461,174),(475,148),(444,121),(406,109),(365,126),(327,109),(314,80),(299,39),(281,61),(268,38),(249,54)]
    mask0=Image.new('L',(S,S));ImageDraw.Draw(mask0).polygon(pts,fill=255)
    mask0=mask0.filter(ImageFilter.GaussianBlur(2.0))
    alpha=np.asarray(mask0,dtype=float)/255
    y,x=np.mgrid[:S,:S];u=(x-255)/140;v=(y-220)/240
    center=np.exp(-u*u*2.8)
    noise=rng.normal(0,1,(S,S))
    broad=np.asarray(Image.fromarray(np.uint8(np.clip(128+40*rng.normal(size=(64,64)),0,255))).resize((S,S),Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(4)),dtype=float)-128
    value=121-42*center+27*np.clip(abs(u),0,1)+18*np.exp(-((y-110)/100)**2)+broad*.65+noise*13
    p=np.stack([value+10,value+3,value-4],axis=2)
    img=Image.fromarray(np.dstack([np.uint8(np.clip(p,0,255)),np.uint8(alpha*255)]),'RGBA')
    fur=Image.new('RGBA',(S,S));d=ImageDraw.Draw(fur)
    # Directional strands: fan outward along legs, flow downward along spine.
    for _ in range(30000):
        a=int(rng.integers(0,S));b=int(rng.integers(0,S))
        if alpha[b,a]<.83:continue
        lateral=(a-255)/190;ang=math.pi/2-lateral*.95+rng.normal(0,.23)
        length=float(rng.uniform(4,16));ex=a+math.cos(ang)*length;ey=b+math.sin(ang)*length
        lum0=float(value[b,a]);c=int(np.clip(lum0+rng.normal(6,29),35,230))
        d.line([(a,b),(a+math.cos(ang+.12)*length*.48,b+math.sin(ang+.12)*length*.48),(ex,ey)],fill=(min(c+12,255),min(c+6,255),max(c-4,0),int(rng.integers(65,180))),width=int(rng.choice([1,1,1,2])))
    img.alpha_composite(fur);img.putalpha(mask0)
    return img
wolf=wolf_hide()
paintings['wolf_pelt']=place_art(wolf,(42,30,214,193))
# Save preview and explicit standalone internal asset for the source audit.
preview=icons.parent/'p573';preview.mkdir(exist_ok=True)
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
            interior=paintings.get(id,source) if typ=='items' else source
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
report={'ok':True,'version':'5.7.3','rarities':grades,'count':len(rows),'protectedPixels':int(solid.sum()),'repainted':sorted(paintings),'wolfSource':'original procedural multilayer fur painting','rows':rows}
(preview/'frame-audit.json').write_text(json.dumps(report,indent=2))
# Visual contact sheet for inspection, not in-game UI.
names=['wood','ore_iron','ore_copper','ore_silver','ingot_copper','ingot_iron','wolf_pelt','hp_potion']
sheet=Image.new('RGBA',(1024,512),(25,14,42,255))
for i,n in enumerate(names):
    p=rarity/'items'/(n+'__comun.webp')
    sheet.alpha_composite(Image.open(p).convert('RGBA'),((i%4)*256,(i//4)*256))
sheet.convert('RGB').save(preview/'frame-contact.jpg',quality=95)
print('HF573_FRAME_AUDIT',json.dumps({k:v for k,v in report.items() if k!='rows'}))
