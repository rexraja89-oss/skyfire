# Generates the HD forest assets (all original, procedural):
#   art/tex_grass.jpg + art/tex_grass_n.jpg   tileable lush grass with dirt patches (+ normal map)
#   art/tex_rock.jpg  + art/tex_rock_n.jpg    mossy granite for boulders and cliffs (+ normal map)
#   art/spr_palm.png, art/spr_canopy.png, art/spr_fern.png   top-down foliage cut-outs (RGBA)
# run: python3 tools/forest_tex.py
import numpy as np, math
from PIL import Image, ImageDraw, ImageFilter
rng=np.random.default_rng(7)
def fftnoise(N,lo,hi,seed):
    fx=np.fft.fftfreq(N)[None,:];fy=np.fft.fftfreq(N)[:,None];fr=np.sqrt(fx*fx+fy*fy)+1e-9
    r=np.random.default_rng(seed);s=np.fft.fft2(r.normal(size=(N,N)))
    m=((fr>=lo/N)&(fr<=hi/N)).astype(float);n=np.real(np.fft.ifft2(s*m));return (n-n.mean())/(n.std()+1e-9)
def normalmap(H,k,out,size):
    gx=(np.roll(H,-1,1)-np.roll(H,1,1))*k;gy=(np.roll(H,-1,0)-np.roll(H,1,0))*k
    l=np.sqrt(gx*gx+gy*gy+1);nm=np.stack([-gx/l*.5+.5,gy/l*.5+.5,1/l*.5+.5],-1)
    Image.fromarray((nm*255).astype(np.uint8)).resize((size,size),Image.LANCZOS).save(out,quality=88)
# ---------- grass ----------
N=1024
tone=fftnoise(N,1,6,1)*.6+fftnoise(N,6,24,2)*.3
dirt=fftnoise(N,2,8,3)+fftnoise(N,8,30,4)*.4
im=Image.new('RGB',(N,N));px=np.zeros((N,N,3),np.float32)
g1=np.array([58,96,34]);g2=np.array([96,138,48]);g3=np.array([128,150,62])
t=np.clip(tone*.3+.5,0,1)[...,None];px=g1*(1-t)+g2*t
im=Image.fromarray(np.clip(px,0,255).astype(np.uint8));d=ImageDraw.Draw(im)
blade=Image.new('L',(N,N),0);db=ImageDraw.Draw(blade)
for i in range(70000):   # grass blades (drawn wrapped so the texture tiles)
    x,y=rng.random()*N,rng.random()*N;a=rng.normal(-1.9,.6);L=6+rng.random()*14
    c=tuple(int(v) for v in (g1*.55 if rng.random()<.35 else (g3 if rng.random()<.4 else g2))*(0.75+rng.random()*.5))
    for ox in (-N,0,N):
        for oy in (-N,0,N):
            p0=(x+ox,y+oy);p1=(x+ox+math.cos(a)*L,y+oy+math.sin(a)*L)
            if -20<p0[0]<N+20 and -20<p0[1]<N+20:d.line([p0,p1],fill=c,width=2);db.line([p0,p1],fill=int(120+rng.random()*135),width=2)
px=np.asarray(im).astype(np.float32)
dm=(np.clip((dirt-1.3)*.9,0,1)**1.5)[...,None]*.8                    # bare earth patches
earth=np.array([92,74,50])*(0.85+0.15*fftnoise(N,40,120,5)[...,None]*.5+0.15)
px=px*(1-dm)+earth*dm
px*=(0.9+0.1*fftnoise(N,60,200,6)[...,None]*.5+0.1)
Image.fromarray(np.clip(px,0,255).astype(np.uint8)).save('art/tex_grass.jpg',quality=86)
H=np.asarray(blade.filter(ImageFilter.GaussianBlur(.8))).astype(np.float32)/255*(1-dm[...,0]*.7)+fftnoise(N,2,10,7)*.15
normalmap(H,2.2,'art/tex_grass_n.jpg',512)
# ---------- rock ----------
N=512
big=fftnoise(N,1,5,11);mid=fftnoise(N,5,20,12);fine=fftnoise(N,20,90,13)
crk=np.exp(-(fftnoise(N,3,12,14)/0.07)**2)+0.6*np.exp(-(fftnoise(N,8,30,17)/0.05)**2)   # thin crack lines
Hr=big*.5+mid*.3+fine*.15-crk*1.2
shade=np.clip(.82+big*.08+mid*.07+fine*.05-crk*.45,0.3,1.15)[...,None]
base=np.array([142,136,124])*(1+np.stack([fftnoise(N,2,8,18)*.03]*3,-1))
rock=base*shade
moss=np.clip((big*.7+mid*.6+fine*.2-1.0)*1.1,0,1)[...,None]*0.7
mosscol=np.array([92,114,52])*(0.85+0.15*np.clip(fine[...,None]*.5+.5,0,1))
rock=rock*(1-moss)+mosscol*moss
Image.fromarray(np.clip(rock,0,255).astype(np.uint8)).save('art/tex_rock.jpg',quality=86)
normalmap(Hr,3.0,'art/tex_rock_n.jpg',512)
# ---------- foliage sprites (drawn at 2x, downsampled) ----------
def lerpc(a,b,t):return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))
def frond_sprite(size,nfr,lmin,lmax,leaf_len,leaf_w,dark,light,hub,seed,curl=.35):
    S=size*2;img=Image.new('RGBA',(S,S),(0,0,0,0));d=ImageDraw.Draw(img);r=np.random.default_rng(seed);c=S/2
    order=sorted(range(nfr),key=lambda k:r.random())
    for k in order:
        a0=k/nfr*2*math.pi+r.normal(0,.12);L=(lmin+r.random()*(lmax-lmin))*S/2;bend=r.normal(0,curl)
        prev=(c,c);steps=36
        for i in range(1,steps+1):
            t=i/steps;ang=a0+bend*t*t;p=(c+math.cos(ang)*L*t,c+math.sin(ang)*L*t)
            # leaflets on both sides, swept back
            ll=leaf_len*S*(math.sin(math.pi*min(1,t*1.15))**.6)*(0.85+r.random()*.3)
            lit=0.5+0.5*math.cos(ang-(-2.3))          # light from the top-left
            for side in (-1,1):
                la=ang+side*(1.05+r.normal(0,.08))+0.35*side*t
                q=(p[0]+math.cos(la)*ll,p[1]+math.sin(la)*ll);w=leaf_w*S*(1-t*.5)
                nx,ny=-math.sin(la)*w,math.cos(la)*w
                sh=min(1,max(0,lit*.7+(0.25 if side>0 else -0.05)+t*.25+r.normal(0,.08)))
                col=lerpc(dark,light,sh)
                d.polygon([(p[0]+nx*.3,p[1]+ny*.3),((p[0]+q[0])/2+nx,(p[1]+q[1])/2+ny),q,((p[0]+q[0])/2-nx,(p[1]+q[1])/2-ny),(p[0]-nx*.3,p[1]-ny*.3)],fill=col+(255,))
            d.line([prev,p],fill=lerpc(dark,(150,140,80),.5)+(255,),width=max(2,int(S*.006*(1-t))))
            prev=p
    if hub:d.ellipse([c-S*.035,c-S*.035,c+S*.035,c+S*.035],fill=(70,60,30,255))
    return img.resize((size,size),Image.LANCZOS)
frond_sprite(512,15,.78,.96,.11,.012,(30,62,20),(150,190,70),True,21).save('art/spr_palm.png',optimize=True)
frond_sprite(256,11,.7,.95,.07,.016,(24,70,24),(120,190,70),False,22,curl=.6).save('art/spr_fern.png',optimize=True)
# broadleaf canopy: clusters of overlapping leaves, lit from the top-left
S=1024;img=Image.new('RGBA',(S,S),(0,0,0,0));d=ImageDraw.Draw(img);r=np.random.default_rng(23);c=S/2
clusters=[(c+r.normal(0,S*.15),c+r.normal(0,S*.15),S*(.1+r.random()*.09)) for _ in range(26)]
clusters.sort(key=lambda q:(q[0]+q[1]))           # far (bottom-right) first, near the light last
for (x0,y0,R) in clusters:
    if math.hypot(x0-c,y0-c)>S*.36:continue
    for i in range(int(R*1.6)):
        a=r.random()*2*math.pi;rr=R*math.sqrt(r.random());x=x0+math.cos(a)*rr;y=y0+math.sin(a)*rr
        lit=np.clip(.55-((x-x0)+(y-y0))/(2.4*R)+r.normal(0,.12),0,1)
        col=lerpc((22,52,18),(132,176,64),lit);col=lerpc(col,(150,150,60),r.random()*.15)
        la=r.random()*math.pi;lw=S*.022*(0.7+r.random()*.6);lh=lw*.5
        pts=[(x+math.cos(la+t)*lw*(1 if k%2==0 else .5)*(math.cos(t) if False else 1),y+math.sin(la+t)*lh) for k,t in enumerate(np.linspace(0,2*math.pi,8,endpoint=False))]
        d.polygon([(x+math.cos(la)*lw,y+math.sin(la)*lw),(x+math.cos(la+1.57)*lh,y+math.sin(la+1.57)*lh),(x-math.cos(la)*lw,y-math.sin(la)*lw),(x-math.cos(la+1.57)*lh,y-math.sin(la+1.57)*lh)],fill=col+(255,))
img.resize((512,512),Image.LANCZOS).save('art/spr_canopy.png',optimize=True)
print('ok')
