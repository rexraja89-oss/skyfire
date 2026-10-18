# Matched comparison for review: Rex's concept top view (turned nose-down like the game) | HQ viewer straight-down view |
# HQ in Stage 10 (gameplay camera) | the identical frozen frame without the boss. Run after shots.cjs and capture.cjs.
# python3 compare.py  -> review/compare_concept_viewer_game.jpg
from PIL import Image, ImageDraw
import numpy as np
H = 520
def fit(im, h=H):
    return im.resize((round(im.width * h / im.height), h))
sheet = Image.open('src/concept/concept_sheet_b.jpg').convert('RGB')
top = sheet.crop((612, 0, 1012, 498))                      # "TOP VIEW" panel of sheet B
a = np.asarray(top).astype(int); m = (a.max(2) > 120) | ((a.max(2) - a.min(2)) > 60); m[-40:] = False
ys, xs = np.where(m); concept = top.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)).rotate(180)
viewer = Image.open('out/shots/viewer_top_hq.png').convert('RGB')
vw = np.asarray(viewer).astype(int); vm = np.abs(vw - vw[400, 30]).sum(2) > 40; vm[:260] = False; vm[-200:] = False
ys, xs = np.where(vm); viewer = viewer.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
g_on = Image.open('out/shots/game_hq_matched_boss.png').convert('RGB'); g_off = Image.open('out/shots/game_hq_matched_off.png').convert('RGB')
box = (0, 0, g_on.width, int(g_on.height * .42))
panels = [('Concept (top view, nose down)', concept), ('HQ model, straight down', viewer), ('Stage 10, game camera', g_on.crop(box)), ('Same frame, boss hidden', g_off.crop(box))]
ims = [fit(p) for _, p in panels]; W = sum(i.width for i in ims) + 20 * (len(ims) + 1)
out = Image.new('RGB', (W, H + 60), (24, 25, 32)); d = ImageDraw.Draw(out); x = 20
for (label, _), im in zip(panels, ims):
    out.paste(im, (x, 45)); d.text((x, 16), label, fill=(230, 230, 240)); x += im.width + 20
out.save('review/compare_concept_viewer_game.jpg', quality=86); print('review/compare_concept_viewer_game.jpg', out.size)
