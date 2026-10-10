#!/usr/bin/env python3
"""Bakes a Poly Haven HDRI (CC0) into six small cube-map faces for the game's sky reflections/lighting.

Phones can't use three.js PMREM here (it renders black on some GPUs), so the game loads plain cube faces like its
painted envCube(). This tool: decodes the 1k Radiance .hdr, rotates the sky so its sun matches the game's sun azimuth,
tone-maps it to LDR and writes art/sky/<name>_{px,nx,py,ny,pz,nz}.jpg (128 px). Face layout follows the OpenGL cube
spec with three.js' x-flip for CubeTexture (flipEnvMap = -1).
Usage: python3 tools/sky_bake.py <hdr file> <name> [exposure]
"""
import math, os, sys
import numpy as np
from PIL import Image

N = 128
SUN = (-0.45, 0.6, -0.5)     # typical day-biome sun direction in the game (BIOME.*.sunDir)


def read_hdr(path):
    data = open(path, 'rb').read()
    i = data.index(b'\n\n') + 2
    j = data.index(b'\n', i)
    dims = data[i:j].split()
    h, w = int(dims[1]), int(dims[3])
    pos = j + 1
    out = np.zeros((h, w, 4), np.uint8)
    for y in range(h):
        if data[pos] == 2 and data[pos + 1] == 2:   # new-style RLE scanline
            pos += 4
            for c in range(4):
                x = 0
                while x < w:
                    n = data[pos]; pos += 1
                    if n > 128:
                        n -= 128; out[y, x:x + n, c] = data[pos]; pos += 1
                    else:
                        out[y, x:x + n, c] = np.frombuffer(data, np.uint8, n, pos); pos += n
                    x += n
        else:
            out[y] = np.frombuffer(data, np.uint8, w * 4, pos).reshape(w, 4); pos += w * 4
    e = out[..., 3].astype(np.int32)
    f = np.where(e > 0, np.ldexp(1.0, e - 136), 0.0)
    return out[..., :3] * f[..., None]


def bake(hdr, name, exposure):
    img = read_hdr(hdr)
    H, W, _ = img.shape
    lum = img @ np.array([.2126, .7152, .0722])
    sy, sx = np.unravel_index(np.argmax(lum), lum.shape)
    # three.js equirect: u = atan(z, x)/2pi + .5 ; v = asin(y)/pi + .5, image row 0 = v 1
    sun_az = (sx + .5) / W * 2 * math.pi - math.pi
    want_az = math.atan2(SUN[2], SUN[0])
    rot = sun_az - want_az
    faces = {'px': lambda s, t: (1, -t, -s), 'nx': lambda s, t: (-1, -t, s), 'py': lambda s, t: (s, 1, t),
             'ny': lambda s, t: (s, -1, -t), 'pz': lambda s, t: (s, -t, 1), 'nz': lambda s, t: (-s, -t, -1)}
    c = (np.arange(N) + .5) / N * 2 - 1
    S, T = np.meshgrid(c, c)
    os.makedirs('art/sky', exist_ok=True)
    for k, f in faces.items():
        gx, gy, gz = [np.broadcast_to(np.asarray(a, float), S.shape) for a in f(S, T)]
        wx, wy, wz = -gx, gy, gz                       # three.js flips x for CubeTexture lookups
        n = np.sqrt(wx * wx + wy * wy + wz * wz)
        wx, wy, wz = wx / n, wy / n, wz / n
        az = np.arctan2(wz, wx) + rot
        u = (az / (2 * math.pi) + .5) % 1.0
        v = np.arcsin(np.clip(wy, -1, 1)) / math.pi + .5
        px = np.clip((u * W).astype(int), 0, W - 1)
        py = np.clip(((1 - v) * H).astype(int), 0, H - 1)
        col = img[py, px] * exposure
        col = col / (1 + col)                          # Reinhard: keeps the sun bright without clipping the sky
        col = np.where(col <= .0031308, col * 12.92, 1.055 * np.power(col, 1 / 2.4) - .055)
        Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save('art/sky/%s_%s.jpg' % (name, k), quality=88)
    print('baked', name, 'sun at row', sy, 'rotated', round(math.degrees(rot), 1), 'deg')


if __name__ == '__main__':
    bake(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 1.0)
