# Generates the tileable HD desert ground textures: art/tex_sand.jpg (colour) and art/tex_sand_n.jpg (normal map).
# FFT-filtered noise is periodic, so both textures tile seamlessly. Pure numpy + Pillow; run: python3 tools/sand_tex.py
import numpy as np
from PIL import Image
N=1024;rng=np.random.default_rng(42)
fx=np.fft.fftfreq(N)[None,:];fy=np.fft.fftfreq(N)[:,None];fr=np.sqrt(fx*fx+fy*fy)+1e-9
def noise(lo,hi,p=1.0,seed=0):
    r=np.random.default_rng(seed);s=np.fft.fft2(r.normal(size=(N,N)))
    band=np.exp(-((np.log(fr)-np.log((lo+hi)/2))**2)/(2*np.log(hi/lo+1e-9)**2*0.25+1e-9))*fr**(-p*0)
    n=np.real(np.fft.ifft2(s*band));return (n-n.mean())/(n.std()+1e-9)
yy,xx=np.mgrid[0:N,0:N]/N
# wind ripples: ~46 across the tile, bent by low-frequency warp, sharp crest + gentle back
warp=noise(1/N*2,1/N*6,seed=1)*0.9+noise(1/N*6,1/N*16,seed=2)*0.25
ph=(xx*46+yy*17)+warp*0.55+np.sin(yy*np.pi*2*3+warp)*0.35
f=ph-np.floor(ph);rip=np.where(f<.72,f/.72,(1-f)/.28)
rip=rip*(0.75+0.25*noise(1/N*3,1/N*10,seed=3))          # ripple strength varies
grain=noise(1/N*180,1/N*480,seed=4)
swell=noise(1/N*1.5,1/N*5,seed=5)
H=rip*1.0+grain*0.05+swell*0.6
# normal map (tangent space, +y up in texture = green)
gx=(np.roll(H,-1,1)-np.roll(H,1,1))*N/2/60;gy=(np.roll(H,-1,0)-np.roll(H,1,0))*N/2/60
nx,ny,nz=-gx,gy,np.ones_like(H);l=np.sqrt(nx*nx+ny*ny+nz*nz)
nm=np.stack([(nx/l*.5+.5),(ny/l*.5+.5),(nz/l*.5+.5)],-1)
Image.fromarray((nm*255).astype(np.uint8)).resize((512,512),Image.LANCZOS).save('art/tex_sand_n.jpg',quality=88)
# albedo: warm sand with patchy tone, slightly darker troughs, sparkling and dark grains, few pebbles
tone=noise(1/N*2,1/N*8,seed=6)*.5+noise(1/N*8,1/N*30,seed=7)*.25
base=np.array([226,160,98],np.float32);alt=np.array([238,186,122],np.float32);dark=np.array([196,128,72],np.float32)
t=np.clip(tone*.35+.5,0,1)[...,None]
col=base*(1-t)+alt*t
col=col*(0.93+0.07*rip[...,None])
col*= (1+grain[...,None]*0.035)
sp=rng.random((N,N));col[sp>0.9985]*=1.18;col[sp<0.0015]*=0.72
peb=noise(1/N*60,1/N*120,seed=8);col[(peb>3.0)]=col[(peb>3.0)]*0.86
col=np.clip(col,0,255).astype(np.uint8)
Image.fromarray(col).save('art/tex_sand.jpg',quality=88)
print('ok')
