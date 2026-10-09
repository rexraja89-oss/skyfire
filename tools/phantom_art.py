# Builds art/jet_phantom.png from Rex's render: traced outline plus cleanup of space background near the edges.
from PIL import Image,ImageDraw,ImageFilter
s=0.8396946564885496;cx=503
disp=[(503,40),(497,22),(486,24),(484,80),(470,86),(440,82),(400,90),(360,98),(320,115),(280,135),(245,150),(225,165),(180,190),(120,230),(70,270),(40,300),(20,330),(8,370),(8,420),(20,470),(25,520),(40,560),(75,600),(100,640),(130,690),(160,740),(185,790),(215,835),(228,850),(250,880),(272,903),(300,915),(320,960),(345,985),(368,1020),(408,1022),(420,995),(436,988),(438,830),(440,720),(452,690),(468,700),(482,722),(496,745),(503,750)]
half=[(x/s,y/s) for x,y in disp]
im=Image.open('cut/phantom_src.png').convert('RGB');W,H=im.size;c=cx/s
pts=half+[(2*c-x,y) for x,y in reversed(half)]
S=3;m=Image.new('L',(W*S,H*S),0);ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in pts],fill=255)
m=m.resize((W,H),Image.LANCZOS)
import numpy as np
from scipy import ndimage
a=np.asarray(im).astype(np.float32);r,g,b=a[...,0],a[...,1],a[...,2];mx=a.max(2)
inside=np.asarray(m)>=128;depth=ndimage.distance_transform_edt(inside)
spacey=((b>g*1.3)&(b>r*1.2)&(mx<150)&(g<90))&(depth<28)   # dark navy space just inside the traced outline
cand=(np.asarray(m)<128)|spacey
lab,n=ndimage.label(cand);edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
bg=np.isin(lab,list(edge));bg=ndimage.binary_opening(bg,iterations=1)|(np.asarray(m)<128)
fg=ndimage.binary_fill_holes(~bg);fg=ndimage.binary_opening(fg,iterations=2)
m=Image.fromarray((fg*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8))
out=im.convert('RGBA');out.putalpha(m);bb=out.getbbox();out=out.crop(bb);w,h=out.size
nl=[(292,905),(338,962),(388,1018)];nz=nl+[(2*cx-x,y) for x,y in nl]
noz=[[round(((x/s)-bb[0])/w-.5,3),round(((y/s)-bb[1])/h-.5,3)] for x,y in nz]
out=out.resize((w*2//3,h*2//3),Image.LANCZOS);out.save('/home/user/skyfire/art/jet_phantom.png',optimize=True);print(out.size,noz)
