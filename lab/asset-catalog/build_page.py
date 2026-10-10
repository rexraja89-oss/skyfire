#!/usr/bin/env python3
"""Builds lab/asset-catalog/index.html from inventory.json (+ candidates.json when present).

The page is self-contained (data and thumbnails embedded), so the same file works from the repo and as a private
Claude page. Edit the JSON files, never the HTML; then run:  python3 lab/asset-catalog/build_page.py
"""
import base64, io, json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
inv = json.load(open(os.path.join(HERE, 'inventory.json')))
cand_path = os.path.join(HERE, 'candidates.json')
cands = json.load(open(cand_path)) if os.path.exists(cand_path) else {'candidates': []}

for f in inv['files']:
    p = os.path.join(ROOT, f['file'])
    if f['file'].endswith(('.png', '.jpg')) and os.path.exists(p):
        im = Image.open(p).convert('RGBA')
        im.thumbnail((112, 112))
        bg = Image.new('RGBA', im.size, (40, 46, 52, 255))
        bg.alpha_composite(im)
        b = io.BytesIO()
        bg.convert('RGB').save(b, 'JPEG', quality=72)
        f['thumb'] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

for c in cands.get('candidates', []):
    pv = os.path.join(HERE, c.get('preview') or '')
    if c.get('preview') and os.path.exists(pv):
        im = Image.open(pv).convert('RGB')
        im.thumbnail((360, 360))
        b = io.BytesIO()
        im.save(b, 'JPEG', quality=78)
        c['thumb'] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

data = json.dumps({'inv': inv, 'cands': cands}, separators=(',', ':')).replace('</', '<\\/')
tpl = open(os.path.join(HERE, 'page_template.html')).read()
open(os.path.join(HERE, 'index.html'), 'w').write(tpl.replace('/*DATA*/null', data))
print('index.html', os.path.getsize(os.path.join(HERE, 'index.html')) // 1024, 'KB')
