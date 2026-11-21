#!/usr/bin/env python3
"""Clean exterior dark RGB margins from original premium WebP without altering
the internal gold frame, illustrative subject, user-supplied icon IDs or layout.
The 60 original SHA-pinned ZIPs remain unchanged in source control.
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter
import sys

def clean(file):
    with Image.open(file) as source:
        image=source.convert('RGB')
    width,height=image.size
    if (width,height)!=(256,256):
        raise ValueError(f'Wrong dimensions {file}: {width}x{height}')
    pixels=image.load()
    def dark(x,y):
        r,g,b=pixels[x,y]
        return r<88 and g<66 and b<105 and r+g+b<210
    visited=bytearray(width*height)
    queue=deque()
    def push(x,y):
        n=y*width+x
        if not visited[n] and dark(x,y):
            visited[n]=1
            queue.append((x,y))
    for x in range(width):
        push(x,0)
        push(x,height-1)
    for y in range(height):
        push(0,y)
        push(width-1,y)
    while queue:
        x,y=queue.popleft()
        if x:push(x-1,y)
        if x+1<width:push(x+1,y)
        if y:push(x,y-1)
        if y+1<height:push(x,y+1)
    alpha=Image.frombytes('L',(width,height),bytes(0 if outside else 255 for outside in visited))
    alpha=alpha.filter(ImageFilter.GaussianBlur(1.2))
    result=image.convert('RGBA')
    result.putalpha(alpha)
    result.save(file,format='WEBP',lossless=True,method=5)
    with Image.open(file) as check:
        if 'A' not in check.getbands() or check.getpixel((0,0))[3]>15 or check.getpixel((128,128))[3]<250:
            raise ValueError('Bad transparency in '+str(file))
    return sum(visited)/(width*height)

def main():
    if len(sys.argv)!=2:raise SystemExit('Usage: highfly-icon-alpha.py PATH_TO_user-icons')
    files=sorted(Path(sys.argv[1]).glob('*/*.webp'))
    if len(files)!=60:raise SystemExit(f'Expected 60 WebP icons; got {len(files)}')
    ratios=[clean(p) for p in files]
    if not all(0.10<r<0.55 for r in ratios):
        raise SystemExit(f'Exterior alpha bounds unsafe: {min(ratios)}-{max(ratios)}')
    print(f'[HIGHFLY ICON CLEAN] 60 alpha WebP with artwork preserved; exterior transparent {min(ratios):.1%} to {max(ratios):.1%}')

if __name__=='__main__': main()
