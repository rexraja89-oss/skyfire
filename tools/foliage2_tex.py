# Volumetric tree-crown sprites (v5.9), seen from above. Original, procedural.
# A crown is a union of leaf clumps (spheres with noise) -> height field -> sun shading (upper-left light), cavity
# darkening between clumps and soft ambient occlusion -> thousands of small leaves stamped with that shading.
#   art/spr_canopy.png   broadleaf, deep green      (replaces the v4.8 sprite)
#   art/spr_canopy2.png  broadleaf, olive / yellow-green with some dry leaves
#   art/spr_canopy3.png  dense dark rainforest giant
# run: python3 tools/foliage2_tex.py
import numpy as np, math
from PIL import Image, ImageDraw, ImageFilter

def blur(a, r):
    im = Image.fromarray((np.clip(a, 0, 1)*255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(r))
    return np.asarray(im).astype(float)/255

def crown(seed, out, pal, S=768, nclump=70, spread=.17, dry=0.0):
    r = np.random.default_rng(seed); c = S/2
    yy, xx = np.mgrid[0:S, 0:S].astype(float)
    acc = np.zeros((S, S))
    for _ in range(nclump):
        px, py = c + r.normal(0, S*spread), c + r.normal(0, S*spread)
        if math.hypot(px-c, py-c) > S*.33: continue
        R = S*(.04 + r.random()*.065)
        ang = np.arctan2(yy-py, xx-px); Rr = R*(1 + .22*np.sin(ang*r.integers(3, 7) + r.random()*6))   # lobed, irregular clumps
        q = Rr*Rr - (xx-px)**2 - (yy-py)**2
        acc += np.exp(10*np.sqrt(np.clip(q, 0, None))/S*6) - 1
    h = np.log1p(acc)/(10*6/S)/S                     # smooth union height (0..~.15)
    h = h/max(h.max(), 1e-6)
    n = blur(r.random((S, S)), 2)*1.0; n2 = blur(r.random((S, S)), 7)
    h = np.clip(h + (n - .5)*.5*(h > .02) + (n2 - .5)*.6*(h > .02), 0, 1)
    hb = blur(h, 4)
    gy, gx = np.gradient(hb)
    k = 34; nz = 1/np.sqrt(1 + (gx*k)**2 + (gy*k)**2); nx = -gx*k*nz; ny = -gy*k*nz
    lam = np.clip(nx*-.5 + ny*-.55 + nz*.67, 0, 1)
    cav = np.clip((blur(h, 14) - h)*4, 0, 1)            # gaps between clumps go dark
    shade = np.clip(lam**1.3*(1 - cav*.9)*(.5 + .5*h)*1.15, 0, 1)
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    pts = r.random((int(S*S*.045), 2))*S
    order = np.argsort(np.array([h[int(y), int(x)] for x, y in pts.astype(int)]))  # deep leaves first, top leaves last
    for i in order:
        x, y = pts[i]; hv = h[int(y), int(x)]
        if hv < .06 and r.random() > .25: continue
        if hv < .02: continue
        s = shade[int(y), int(x)]*(.85 + r.random()*.3)
        col = np.array([np.interp(s, [0, .35, .7, 1], [p[ch] for p in pal]) for ch in range(3)])
        if dry and r.random() < dry: col = col*.6 + np.array([150, 120, 50])*.4
        col = col*(.9 + r.random()*.2)
        la = r.random()*math.pi; lw = S*.016*(.6 + r.random()*.8); lh = lw*.45
        d.polygon([(x + math.cos(la)*lw, y + math.sin(la)*lw), (x + math.cos(la+1.57)*lh, y + math.sin(la+1.57)*lh),
                   (x - math.cos(la)*lw, y - math.sin(la)*lw), (x - math.cos(la+1.57)*lh, y - math.sin(la+1.57)*lh)],
                  fill=tuple(int(v) for v in np.clip(col, 0, 255)) + (255,))
    img.resize((512, 512), Image.LANCZOS).save(out, optimize=True)

crown(41, 'art/spr_canopy.png', [(10, 22, 10), (32, 60, 22), (72, 104, 40), (132, 156, 74)])
crown(42, 'art/spr_canopy2.png', [(20, 26, 12), (52, 66, 26), (102, 118, 48), (170, 170, 90)], nclump=50, spread=.15, dry=.06)
crown(43, 'art/spr_canopy3.png', [(6, 16, 8), (22, 46, 20), (52, 88, 36), (110, 140, 70)], nclump=90, spread=.19)
print('ok')
