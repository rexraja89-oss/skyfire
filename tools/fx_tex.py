# Animated effect flipbooks for the 2D overlay (v5.8). All procedural and original.
#   art/fx_smoke.png  4x4 frames, 128 px: a billowing smoke puff growing and thinning, lit from the upper left
#                     (greyscale; drawn dark or light by the game), alpha = density
#   art/fx_fire.png   4x4 frames, 128 px: a fireball - white-hot core, boiling orange flame tongues, breaking up and
#                     cooling into soot - for the explosion fireball layer
# run: python3 tools/fx_tex.py
import numpy as np
from PIL import Image

S = 128; F = 16
rng = np.random.default_rng(7)

def field(seed, size):
    """Smooth 2D fBm in [-1,1] from upsampled random grids (bicubic), several octaves."""
    r = np.random.default_rng(seed); out = np.zeros((size, size)); amp = 1.0; tot = 0
    for g in (4, 7, 13, 25, 49):
        a = r.normal(size=(g, g)).astype(np.float32)
        im = Image.fromarray(a, 'F').resize((size, size), Image.BICUBIC)
        out += amp*np.asarray(im); tot += amp; amp *= .62
    out /= tot; return out/np.abs(out).max()

def fbm3(n, oct=5, seed=0):
    """Animated noise (F, S, S): fields at 4 keyframes, smoothly blended, with outward advection (billowing)."""
    keys = [field(seed*10+k, S*2) for k in range(4)]
    out = np.zeros((F, S, S)); c = S
    for f in range(F):
        u = f/(F-1)*3; k = min(2, int(u)); w = u-k; w = w*w*(3-2*w)
        big = keys[k]*(1-w) + keys[k+1]*w
        zoom = 1 - .35*f/(F-1)                                # sample a shrinking window = features drift outward
        h = int(S*zoom); o = (2*S - h*2)//2 + S//2
        win = big[o:o+h, o:o+h] if h > 8 else big[:8, :8]
        out[f] = np.asarray(Image.fromarray(win.astype(np.float32), 'F').resize((S, S), Image.BICUBIC))
    return out/np.abs(out).max()

yy, xx = np.mgrid[0:S, 0:S].astype(float)
cx = cy = (S-1)/2
rr = np.hypot(xx-cx, yy-cy)/(S/2)
ang = np.arctan2(yy-cy, xx-cx)

def atlas(frames):
    A = np.zeros((S*4, S*4, 4))
    for i, f in enumerate(frames):
        A[(i//4)*S:(i//4+1)*S, (i % 4)*S:(i % 4+1)*S] = f
    return A

# ---------------- smoke: cauliflower billows, self-shadowed, thinning with age ----------------
def sst(a, b, x):
    t = np.clip((x-a)/(b-a), 0, 1); return t*t*(3-2*t)
def blur(a, r):
    from PIL import ImageFilter
    im = Image.fromarray((np.clip(a, 0, 1)*255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im).astype(float)/255
n1 = fbm3(5, 5, 11)
# a cluster of billows (spheres) that drift outward and swell; height field = union of sphere caps
br = np.random.default_rng(31); NB = 26
bp = br.normal(size=(NB, 2))*.3; bp *= np.minimum(1, .42/np.maximum(1e-6, np.hypot(bp[:, 0], bp[:, 1])))[:, None]; bs = br.uniform(.12, .3, NB); bd = br.normal(size=(NB, 2))*.18
X = (xx-cx)/(S/2); Y = (yy-cy)/(S/2)
frames = []
for f in range(F):
    t = f/(F-1); g = .55 + .5*t
    acc = np.zeros((S, S))
    for k in range(NB):
        px, py = (bp[k] + bd[k]*t)*g; r = bs[k]*g*(1 + .25*t)
        q = r*r - (X-px)**2 - (Y-py)**2
        acc += np.exp(14*np.sqrt(np.clip(q, 0, None)))-1   # smooth union of the billows (no seams)
    hgt = np.log1p(acc)/14
    hgt = blur(np.clip(hgt*(1 + .45*n1[f]) + .03*n1[f], 0, 1), 1.2)
    gy, gx = np.gradient(hgt)
    nz = 1/np.sqrt(1 + (gx*S*.35)**2 + (gy*S*.35)**2)
    nx = -gx*S*.35*nz; ny = -gy*S*.35*nz
    light = np.clip(.35 + .75*(nx*-.55 + ny*-.6 + nz*.58), .18, 1.0)   # lit from the upper left
    cover = sst(.005, .16, hgt)
    a = cover*(1 - t)**.7*(.85 + .15*n1[f])
    v = light*(.85 + .15*n1[f])
    frames.append(np.dstack([v, v, v, np.clip(a, 0, 1)]))
Image.fromarray((np.clip(atlas(frames), 0, 1)*255).astype(np.uint8), 'RGBA').save('art/fx_smoke.png', optimize=True)

# ---------------- fire: white-hot core, boiling orange tongues, cooling to grey-brown soot ----------------
n3 = fbm3(5, 5, 21); n4 = fbm3(5, 4, 22)
stops = np.array([[.2, .16, .14], [.55, .12, .03], [.95, .38, .06], [1, .72, .25], [1, .95, .82]])
xs = np.array([0, .22, .48, .74, 1.0])
frames = []
for f in range(F):
    t = f/(F-1)
    rad = .48 + .46*t**.7
    cone = 1 - rr/rad
    body = sst(0, .4, cone*.95 + n4[f]*.45 - .02)
    heat = np.clip((cone*1.5 + n3[f]*.55)*(1 - t*.85) - t*.35, 0, 1)
    col = np.stack([np.interp(heat, xs, stops[:, c]) for c in range(3)], -1)
    a = body*(1 - t**2.5*.85)
    frames.append(np.dstack([col, a]))
Image.fromarray((np.clip(atlas(frames), 0, 1)*255).astype(np.uint8), 'RGBA').save('art/fx_fire.png', optimize=True)
print('ok')
