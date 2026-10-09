# Phase 1 terrain material layers for Jungle Ridge. All procedural, tileable (FFT noise wraps), original.
#   art/ter_grass.jpg  art/ter_soil.jpg  art/ter_rock.jpg  art/ter_moss.jpg  art/ter_gravel.jpg   colour, 1024 or 512 px
#   art/ter_ground_n.jpg  art/ter_rock_n.jpg                                                          normal maps
#   art/ter_macro.png   R: large-scale brightness, G: blend breakup, B: wet/dry tone   (256 px)
# The alpha-free colour maps carry a "height" in their luminance that the shader uses for height-based blending.
# run: python3 tools/terrain_tex.py
import numpy as np, math
from PIL import Image, ImageDraw, ImageFilter

def noise(N, lo, hi, seed):
    fx = np.fft.fftfreq(N)[None, :]; fy = np.fft.fftfreq(N)[:, None]; fr = np.sqrt(fx*fx + fy*fy)
    s = np.fft.fft2(np.random.default_rng(seed).normal(size=(N, N)))
    m = ((fr >= lo/N) & (fr <= hi/N)).astype(float)
    n = np.real(np.fft.ifft2(s*m)); return (n - n.mean())/(n.std() + 1e-9)

def cells(N, count, seed, jitter=1.0):
    """Tileable Worley distances (F1, F2) and cell id for pebbles and rock plates."""
    r = np.random.default_rng(seed); pts = r.random((count, 2))*N; ids = np.arange(count)
    allp = []; alli = []
    for ox in (-N, 0, N):
        for oy in (-N, 0, N):
            allp.append(pts + [ox, oy]); alli.append(ids)
    allp = np.concatenate(allp); alli = np.concatenate(alli)
    yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
    f1 = np.full((N, N), 1e9, np.float32); f2 = np.full((N, N), 1e9, np.float32); cid = np.zeros((N, N), np.int32)
    for p, i in zip(allp, alli):
        if p[0] < -N*.25 or p[0] > N*1.25 or p[1] < -N*.25 or p[1] > N*1.25: continue
        d = np.hypot(xx - p[0], yy - p[1])
        closer = d < f1
        f2 = np.where(closer, f1, np.minimum(f2, d)); cid = np.where(closer, i, cid); f1 = np.where(closer, d, f1)
    return f1, f2, cid

def save_rgb(a, path, size=None):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    if size: im = im.resize((size, size), Image.LANCZOS)
    im.save(path, quality=88)

def normal_map(H, strength, path, size):
    gx = (np.roll(H, -1, 1) - np.roll(H, 1, 1))*strength; gy = (np.roll(H, -1, 0) - np.roll(H, 1, 0))*strength
    l = np.sqrt(gx*gx + gy*gy + 1)
    nm = np.stack([-gx/l*.5 + .5, gy/l*.5 + .5, 1/l*.5 + .5], -1)
    save_rgb(nm*255, path, size)

def palette(t, stops):
    t = np.clip(t, 0, 1); xs = [s for s, _ in stops]
    return np.stack([np.interp(t, xs, [c[i] for _, c in stops]) for i in range(3)], -1)

rng = np.random.default_rng(1)
N = 1024
# ---------------- grass: short mixed turf, olive to straw, no single saturated green ----------------
base = noise(N, 2, 10, 1)*.6 + noise(N, 10, 40, 2)*.4
img = Image.fromarray(palette(base*.22 + .5, [(0, (40, 52, 28)), (.45, (66, 82, 42)), (.75, (90, 100, 54)), (1, (116, 112, 70))]).astype(np.uint8))
d = ImageDraw.Draw(img); hgt = Image.new('L', (N, N), 0); dh = ImageDraw.Draw(hgt)
for i in range(110000):
    x, y = rng.random()*N, rng.random()*N; a = rng.normal(-1.57, .55); L = 4 + rng.random()*9
    kind = rng.random()
    c = (40, 54, 28) if kind < .4 else (78, 94, 48) if kind < .75 else (112, 116, 70) if kind < .93 else (146, 136, 94)
    f = .8 + rng.random()*.35; c = tuple(int(v*f) for v in c)
    for ox in (-N, 0, N):
        for oy in (-N, 0, N):
            x0, y0 = x + ox, y + oy
            if -12 < x0 < N + 12 and -12 < y0 < N + 12:
                p1 = (x0 + math.cos(a)*L, y0 + math.sin(a)*L)
                d.line([(x0, y0), p1], fill=c, width=1); dh.line([(x0, y0), p1], fill=int(100 + 155*rng.random()), width=1)
g = np.asarray(img).astype(np.float32)
g *= (.86 + .14*np.clip(noise(N, 60, 220, 3)*.5 + .5, 0, 1))[..., None]
save_rgb(g, 'art/ter_grass.jpg')
Hg = np.asarray(hgt.filter(ImageFilter.GaussianBlur(.7))).astype(np.float32)/255

# ---------------- soil: dry/damp earth with small stones and roots ----------------
N2 = 512
s = noise(N2, 2, 12, 11)*.55 + noise(N2, 12, 60, 12)*.3 + noise(N2, 60, 200, 13)*.15
soil = palette(s*.22 + .5, [(0, (64, 52, 40)), (.5, (96, 80, 62)), (1, (124, 106, 84))])
f1, f2, cid = cells(N2, 420, 14)
stone = np.clip(1 - f1/5.5, 0, 1)**.7*(np.random.default_rng(15).random(420)[cid] > .55)
soil = soil*(1 - stone[..., None]*.6) + stone[..., None]*np.array([132, 124, 112])*.6*(1 + .2*noise(N2, 40, 120, 16)[..., None]*.3)
save_rgb(soil, 'art/ter_soil.jpg')
Hs = s*.4 + stone*1.2

# ---------------- rock: weathered grey-beige stone, plates, cracks, lichen ----------------
r1 = noise(N2, 1, 6, 21); r2 = noise(N2, 6, 24, 22); r3 = noise(N2, 24, 120, 23)
# fractured stone: domain-warped plates (no regular paving), ridged fracture lines, faint strata
def warped_cells(N, count, seed, amt):
    f1, f2, cid = cells(N, count, seed)
    wx = noise(N, 2, 10, seed + 100)*amt; wy = noise(N, 2, 10, seed + 101)*amt
    yy, xx = np.mgrid[0:N, 0:N]; xs = ((xx + wx) % N).astype(int); ys = ((yy + wy) % N).astype(int)
    return f1[ys, xs], f2[ys, xs], cid[ys, xs]
pf1, pf2, pid = warped_cells(N2, 34, 24, 9)
seam = np.clip((pf2 - pf1)/(4 + 6*np.clip(noise(N2, 4, 20, 27)*.5 + .5, 0, 1)), 0, 1)**.8
frac = np.zeros((N2, N2))
plate = np.random.default_rng(25).random(34)[pid]
strata = np.sin((np.arange(N2)[:, None]/N2)*2*np.pi*9 + noise(N2, 2, 8, 30)*1.6)*.5 + .5
Hr = r1*.4 + r2*.35 + r3*.2 + plate*.35 + seam*.6 - frac*.5
tone = r1*.16 + r2*.12 + r3*.1 + (plate - .5)*.18 + (strata - .5)*.06
rock = palette(tone*.5 + .5, [(0, (82, 77, 70)), (.4, (112, 106, 96)), (.7, (136, 129, 116)), (1, (160, 152, 136))])
stain = np.clip(noise(N2, 2, 9, 31)*.5 + .5, 0, 1)
rock *= ((.58 + .42*seam)*(.85 + .2*stain))[..., None]
rock = rock*(1 - np.clip(1 - seam, 0, 1)[..., None]*.0)
rock *= (1 + noise(N2, 110, 250, 32)*.07)[..., None]
lichen = (noise(N2, 30, 140, 26) > 1.9)
rock[lichen] = rock[lichen]*.75 + np.array([150, 146, 112])*.25
save_rgb(rock, 'art/ter_rock.jpg')

# ---------------- moss: deep, soft, low saturation ----------------
m = noise(N2, 3, 20, 31)*.5 + noise(N2, 20, 90, 32)*.35 + noise(N2, 90, 240, 33)*.15
moss = palette(m*.22 + .5, [(0, (34, 42, 22)), (.5, (58, 68, 34)), (1, (88, 96, 52))])
save_rgb(moss, 'art/ter_moss.jpg')
Hm = m*.5

# ---------------- gravel: rounded pebbles in grit ----------------
gf1, gf2, gid = warped_cells(N2, 700, 41, 5)
peb = np.clip((gf2 - gf1)/9.0, 0, 1)
pv = np.random.default_rng(42).random(1500)[gid]
grav = palette(pv*.8 + noise(N2, 40, 160, 43)*.08 + .1, [(0, (78, 72, 64)), (.5, (118, 110, 98)), (1, (150, 142, 128))])
grav *= (.45 + .55*peb**.5)[..., None]
save_rgb(grav, 'art/ter_gravel.jpg')
Hv = peb**.6

# ---------------- normal maps ----------------
# ground normal: grass blades + soil stones + pebbles, one map shared by the soft layers
Hground = np.asarray(Image.fromarray((Hg*255).astype(np.uint8)).resize((N2, N2), Image.LANCZOS)).astype(np.float32)/255*.6 + Hs*.25 + Hv*.35
normal_map(Hground, 2.4, 'art/ter_ground_n.jpg', 512)
normal_map(Hr, 2.0, 'art/ter_rock_n.jpg', 512)

# ---------------- macro variation ----------------
M = 256
macro = np.stack([np.clip(noise(M, 1, 5, 51)*.5 + .5, 0, 1), np.clip(noise(M, 3, 14, 52)*.5 + .5, 0, 1), np.clip(noise(M, 1, 4, 53)*.5 + .5, 0, 1)], -1)
Image.fromarray((macro*255).astype(np.uint8)).save('art/ter_macro.png', optimize=True)
print('ok')
