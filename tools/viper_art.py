# Builds art/jet_viper.png from Rex's render: hand-traced outline, removes real-world markings,
# repaints shiny red, turns nose-up and prints the exhaust nozzle positions for art.js META.
import numpy as np,json
from PIL import Image,ImageDraw,ImageFilter
import sys;src=sys.argv[1] if len(sys.argv)>1 else 'viper_src.jpg';im=Image.open(src).convert('RGB');a=np.asarray(im).astype(np.float32);H,W,_=a.shape
cx=278
half=[[279,703],[262,650],[250,600],[230,555],[226,515],[205,505],[175,470],[150,430],[132,380],[124,330],[126,290],[134,250],[136,232],[115,215],[80,190],[45,170],[15,152],[7,140],[14,125],[45,102],[100,88],[140,78],[150,60],[172,14],[183,8],[186,30],[192,70],[215,68],[250,58],[262,42],[270,36],[278,35]]
pts=half+[(2*cx-x,y) for x,y in reversed(half)]
S=4;m=Image.new('L',(W*S,H*S),0);ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in pts],fill=255)
mask=np.asarray(m.resize((W,H),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6))).astype(np.float32)/255
# remove real-world markings (USAF text, national insignia) by diffusion inpainting
rm=np.zeros((H,W),bool)
for x0,y0,x1,y1 in [(146,236,177,298),(369,236,419,298)]:rm[y0:y1,x0:x1]=True
f=a.copy();f[rm]=0
for it in range(400):
    b=(np.roll(f,1,0)+np.roll(f,-1,0)+np.roll(f,1,1)+np.roll(f,-1,1))/4
    f[rm]=b[rm]
# keep a little panel grain over the filled areas
g=np.random.default_rng(3).normal(0,3,(H,W,1));f[rm]+=g[rm]
a=f
# recolour: shiny red, keeping the render's light and shade
L=(a[...,0]*.3+a[...,1]*.5+a[...,2]*.2)
lo,hi=np.percentile(L[mask>.5],[2,99.5]);t=np.clip((L-lo)/(hi-lo),0,1)
t=t**.85
stops=[(0,(18,0,3)),(.28,(105,4,12)),(.5,(185,14,22)),(.7,(232,40,36)),(.86,(255,120,96)),(1,(255,238,228))]
out=np.zeros_like(a)
for c in range(3):
    xs=[s for s,_ in stops];ys=[col[c] for _,col in stops];out[...,c]=np.interp(t,xs,ys)
# glossy speculars: boost the brightest highlights
spec=np.clip((t-.78)/.22,0,1)**2;out+=spec[...,None]*np.array([40,60,55])
# smoked canopy (nose cockpit) keeps a dark glass look with a cool sheen
yy,xx=np.mgrid[0:H,0:W];can=((xx-279)/15)**2+((yy-578)/30)**2<1
glass=np.stack([t*60+10,t*90+14,t*120+22],-1);out[can]=out[can]*.25+glass[can]*.75
out=np.clip(out,0,255).astype(np.uint8)
res=Image.fromarray(out).convert('RGBA');res.putalpha(Image.fromarray((mask*255).astype(np.uint8)))
bb=res.getbbox();res=res.crop(bb).rotate(180)
w,h=res.size
# nozzle (exhaust) positions in the final image, as fractions from the centre (x right, y down)
noz=[]
for x,y in [(168,64),(388,64)]:
    fx=(W-x)-(W-bb[2]); fy=(H-y)-(H-bb[3]); noz.append([round(fx/w-.5,3),round(fy/h-.5,3)])
res.save('/home/user/skyfire/art/jet_viper.png',optimize=True);print(res.size,bb,noz)
