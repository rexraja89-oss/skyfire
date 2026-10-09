#!/usr/bin/env python3
"""Steel Docks ground: tileable concrete apron (Skyfire v5.15).

Writes art/tex_concrete.jpg (colour, near-white so the terrain vertex tint sets the shade) and art/tex_concrete_n.jpg
(normal map): 2x2 cast slabs with sawn joints and chipped edges, aggregate speckle, oil and rust stains, tyre scuffs and
worn fragments of painted yard markings. All procedural; tiles seamlessly.
Usage: python3 tools/port_tex.py   (needs numpy, Pillow)
"""
import os
import numpy as np
from PIL import Image

N = 1024
rng = np.random.default_rng(515)
yy, xx = np.mgrid[0:N, 0:N] / N


def tile_noise(octaves, base=4, seed=0):
    """periodic value noise (fbm) on the unit torus"""
    r = np.random.default_rng(seed)
    out = np.zeros((N, N))
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        f = base * 2 ** o
        g = r.random((f, f))
        x = xx * f
        y = yy * f
        x0 = np.floor(x).astype(int) % f
        y0 = np.floor(y).astype(int) % f
        x1 = (x0 + 1) % f
        y1 = (y0 + 1) % f
        tx = x - np.floor(x)
        ty = y - np.floor(y)
        tx = tx * tx * (3 - 2 * tx)
        ty = ty * ty * (3 - 2 * ty)
        v = (g[y0, x0] * (1 - tx) + g[y0, x1] * tx) * (1 - ty) + (g[y1, x0] * (1 - tx) + g[y1, x1] * tx) * ty
        out += v * amp
        tot += amp
        amp *= 0.5
    return out / tot


h = np.zeros((N, N))           # height (for the normal map)
c = np.ones((N, N, 3)) * 0.86  # colour

# slab-to-slab tone differences (each cast separately)
S = 2
sx = np.floor(xx * S).astype(int)
sy = np.floor(yy * S).astype(int)
tone = rng.uniform(-.05, .05, (S, S))
c += tone[sy, sx][..., None]

# large mottling + fine aggregate speckle
m = tile_noise(5, 3, 1)
c *= (0.9 + 0.2 * m)[..., None]
sp = rng.random((N, N))
c[sp > .985] *= 0.78
c[sp < .012] *= 1.08
h += (sp - .5) * .25 + m * .8

# joints between slabs (and a mid control joint), slightly chipped
for k in range(S * 2):
    p = k / (S * 2)
    w = 3 if k % 2 == 0 else 2
    chip = (tile_noise(3, 16, 10 + k) - .5) * 4
    for axis in (0, 1):
        d = np.abs((xx if axis == 0 else yy) - p)
        d = np.minimum(d, 1 - d) * N + chip
        j = d < w
        c[j] *= 0.55 if k % 2 == 0 else 0.72
        h[j] -= 1.6 if k % 2 == 0 else 0.9

# oil stains (dark, soft) and rust bleeds
for i in range(14):
    cx, cy, r = rng.random(), rng.random(), rng.uniform(.02, .07)
    dx = np.minimum(np.abs(xx - cx), 1 - np.abs(xx - cx))
    dy = np.minimum(np.abs(yy - cy), 1 - np.abs(yy - cy))
    e = np.exp(-(dx ** 2 + dy ** 2) / (2 * r * r))
    e = np.clip((e * 1.6 - .35) + (tile_noise(4, 20, 40 + i) - .5) * 1.4, 0, 1)   # ragged, splashy edges
    col = np.array([.3, .29, .28]) if i % 4 else np.array([.55, .4, .3])
    a = np.clip(e * .5, 0, .5)[..., None]
    c = c * (1 - a) + col * a

# tyre scuffs: long faint streaks along the yard lanes (z)
for i in range(5):
    x0 = rng.random()
    wob = (tile_noise(3, 2, 70 + i) - .5) * .05
    d = np.minimum(np.abs(xx - x0 - wob), 1 - np.abs(xx - x0 - wob)) * N
    s = np.exp(-(d / rng.uniform(5, 10)) ** 2) * np.clip(tile_noise(4, 4, 60 + i) * 1.6 - .5, 0, 1)
    c *= (1 - .1 * s)[..., None]
# multi-scale grime and repaired patches
g = tile_noise(6, 2, 77)
c *= (0.82 + 0.3 * g)[..., None]
for i in range(5):
    x0, y0 = rng.random(), rng.random()
    w, hh = rng.uniform(.04, .12), rng.uniform(.04, .1)
    dx = (xx - x0) % 1
    dy = (yy - y0) % 1
    pm = (dx < w) & (dy < hh)
    c[pm] *= rng.uniform(.8, .92)
    h[pm] += .4

# worn painted markings: a yellow lane line and white bay ticks, broken up by wear
wear = tile_noise(5, 12, 90)
lane = (np.abs(xx - .25) * N < 7) & (wear > .42)
c[lane] = c[lane] * .3 + np.array([.95, .78, .2]) * .7
for t in np.arange(0, 1, .125):
    tick = (np.abs(yy - t) * N < 4) & (np.abs(xx - .75) * N < 90) & (wear > .48)
    c[tick] = c[tick] * .35 + np.array([.92, .92, .9]) * .65
h[lane] += .3

c = np.clip(c, 0, 1)
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Image.fromarray((c * 255).astype(np.uint8)).save(os.path.join(root, 'art', 'tex_concrete.jpg'), quality=88)

# normal map from the height field (periodic differences)
k = 2.2
gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * k
gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * k
n = np.stack([-gx, gy, np.ones_like(h)], -1)
n /= np.linalg.norm(n, axis=-1, keepdims=True)
Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8)).save(os.path.join(root, 'art', 'tex_concrete_n.jpg'), quality=90)
print('wrote tex_concrete.jpg / tex_concrete_n.jpg')
