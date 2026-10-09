# Extra realistic-terrain layers (v5.4) for the biomes that use js/terrain_pbr.js beyond Jungle Ridge.
# All procedural, tileable (FFT noise wraps), original. Same conventions as tools/terrain_tex.py
# (the colour map's luminance doubles as the layer's height for height-based blending).
#   art/ter_sand.jpg   wind-rippled fine sand with grit and shell bits (beaches, canyon floors)
#   art/ter_snow.jpg   wind-packed snow with sastrugi ridges, crust and blue shadows
#   art/ter_ash.jpg    volcanic ash and cinders with glassy grit
# run: python3 tools/terrain_tex2.py
import numpy as np
from PIL import Image

def noise(N, lo, hi, seed):
    fx = np.fft.fftfreq(N)[None, :]; fy = np.fft.fftfreq(N)[:, None]; fr = np.sqrt(fx*fx + fy*fy)
    s = np.fft.fft2(np.random.default_rng(seed).normal(size=(N, N)))
    m = ((fr >= lo/N) & (fr <= hi/N)).astype(float)
    n = np.real(np.fft.ifft2(s*m)); return (n - n.mean())/(n.std() + 1e-9)

def palette(t, stops):
    t = np.clip(t, 0, 1); xs = [s for s, _ in stops]
    return np.stack([np.interp(t, xs, [c[i] for _, c in stops]) for i in range(3)], -1)

def save(a, path):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(path, quality=88)

N = 512
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
# ---------- sand: wind ripples (tileable: whole numbers of ripples across the tile), grit ----------
warp = noise(N, 1, 6, 61)*7
rip = np.sin((xx*np.cos(.35) + yy*np.sin(.35))/N*2*np.pi*38 + warp*.9)
rip = np.sign(rip)*np.abs(rip)**.6
base = noise(N, 2, 10, 62)*.5 + noise(N, 10, 60, 63)*.3
grit = noise(N, 120, 256, 64)
t = .5 + base*.14 + rip*.07 + grit*.05
sand = palette(t, [(0, (150, 128, 96)), (.45, (196, 172, 132)), (.75, (220, 200, 160)), (1, (236, 222, 190))])
bits = noise(N, 150, 256, 65) > 2.3
sand[bits] = sand[bits]*.55 + np.array([250, 245, 232])*.45
dark = noise(N, 150, 256, 66) > 2.4
sand[dark] *= .7
save(sand, 'art/ter_sand.jpg')
# ---------- snow: wind-packed with sastrugi, crust patches, cold blue in the hollows ----------
w2 = noise(N, 1, 4, 71)*1.6
sas = np.sin((xx*np.cos(1.1) + yy*np.sin(1.1))/N*2*np.pi*14 + w2)*.5 + .5
sas = sas**3*.6
crust = noise(N, 3, 18, 72)
fine = noise(N, 60, 220, 73)
h = .55 + crust*.12 + sas*.15 + fine*.04
snow = palette(h, [(0, (150, 170, 196)), (.35, (196, 210, 228)), (.65, (232, 238, 246)), (1, (250, 252, 255))])
sparkle = noise(N, 200, 256, 74) > 2.6
snow[sparkle] = 255
save(snow, 'art/ter_snow.jpg')
# ---------- ash: dark cinders, lighter ash drifts, glassy grit ----------
c1 = noise(N, 2, 12, 81); c2 = noise(N, 12, 70, 82); c3 = noise(N, 70, 240, 83)
t = .45 + c1*.12 + c2*.1 + c3*.08
ash = palette(t, [(0, (28, 24, 24)), (.4, (52, 46, 44)), (.7, (82, 74, 70)), (1, (120, 110, 104))])
drift = np.clip(noise(N, 2, 8, 84)*.6 + .2, 0, 1)
ash = ash*(1 - drift[..., None]*.35) + np.array([110, 104, 100])*drift[..., None]*.35
glass = noise(N, 180, 256, 85) > 2.2
ash[glass] = ash[glass]*.4 + np.array([170, 160, 150])*.6
save(ash, 'art/ter_ash.jpg')
print('ok')
