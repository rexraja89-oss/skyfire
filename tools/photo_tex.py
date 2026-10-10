#!/usr/bin/env python3
"""Photo-scanned terrain layers from Poly Haven (CC0, https://polyhaven.com/license) for the realistic terrain path.

Each entry downloads the 1k diffuse map of a Poly Haven texture, matches its average colour to the generated layer it
replaces (so the per-biome tints in js/biomes.js stay calibrated) while keeping the photo's own variation, and writes
art/ter_<name>.jpg. Poly Haven textures tile seamlessly. Credits: README.md.
Usage: python3 tools/photo_tex.py [name ...]      (needs network access to api.polyhaven.com / dl.polyhaven.org)
"""
import io, json, os, sys, urllib.request
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# out name: (Poly Haven asset, generated layer whose mean colour to match, size, contrast)
SETS = {
    'ph_grass':    ('rocky_terrain_02',    'grass',  1024, 1.0),
    'ph_soil':     ('brown_mud_leaves_01', 'soil',   1024, 1.0),
    'ph_rockmoss': ('aerial_rocks_02',     'rock',   1024, 1.0),
    'ph_moss':     ('aerial_grass_rock',   'moss',   1024, 1.0),
    'ph_gravel':   ('rocks_ground_05',     'gravel', 1024, 1.0),
    # Red Canyon
    'ph_cy_base':  ('dry_ground_rocks',    'sand',   1024, 1.0),
    'ph_cy_soil':  ('red_mud_stones',      'sand',   1024, 1.0),
    'ph_cy_rock':  ('cliff_side',          'rock',   1024, 1.0),
    'ph_cy_scrub': ('withered_grass',      'moss',   1024, 1.0),
    'ph_cy_grav':  ('rocky_trail',         'gravel', 1024, 1.0),
    # Coral Isles / Harbor
    'ph_is_sand':  ('aerial_beach_01',     'sand',   1024, 1.0),
    'ph_is_rock':  ('seaside_rock',        'rock',   1024, 1.0),
    'ph_is_grav':  ('coral_gravel',        'gravel', 1024, 1.0),
    'ph_hb_soil':  ('aerial_ground_rock',  'soil',   1024, 1.0),
    # Frozen Outpost
    'ph_ar_snow':  ('snow_02',             'snow',   1024, 1.0),
    'ph_ar_rock':  ('dark_rock_02',        'rock',   1024, 1.0),
    'ph_ar_grav':  ('snow_03',             'gravel', 1024, 1.0),
    # Magma Citadel
    'ph_vo_ash':   ('burned_ground_01',    'ash',    1024, 1.0),
    'ph_vo_rock':  ('dark_rock',           'rock',   1024, 1.0),
    'ph_vo_grav':  ('ground_grey',         'gravel', 1024, 1.0),
}


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'SkyfireSquadron-texture-tool/1.0 (+https://github.com/rexraja89-oss/skyfire)'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def build(name):
    asset, ref, size, k = SETS[name]
    files = json.loads(get('https://api.polyhaven.com/files/' + asset))
    im = Image.open(io.BytesIO(get(files['Diffuse']['1k']['jpg']['url']))).convert('RGB').resize((size, size), Image.LANCZOS)
    a = np.asarray(im).astype(float) / 255
    target = np.asarray(Image.open(os.path.join(ROOT, 'art', 'ter_%s.jpg' % ref)).convert('RGB')).astype(float).mean((0, 1)) / 255
    # match in linear light (the shader linearises with pow 2.2): scale each channel so the mean equals the old layer's
    lin = a ** 2.2
    m = lin.mean((0, 1))
    lin = m + (lin - m) * k
    lin *= (target ** 2.2) / np.maximum(m, 1e-4)
    out = np.clip(lin, 0, 1) ** (1 / 2.2)
    Image.fromarray((out * 255).astype(np.uint8)).save(os.path.join(ROOT, 'art', 'ter_%s.jpg' % name), quality=86)
    print('ter_%s.jpg  <- polyhaven/%s' % (name, asset))


for n in (sys.argv[1:] or SETS):
    build(n)
