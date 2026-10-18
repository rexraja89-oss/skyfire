# Concept texture: turns Rex's top-view concept (sheet B) into a top-down projected texture for the 3D hull.
#  1. cut the ship out of the "TOP VIEW" panel (GrabCut), turn it nose-down like the game
#  2. warp it onto the model's top-down outline with a thin-plate spline through matched features (landmarks below),
#     because the concept and the Meshy model differ in proportions (a plain scale/offset fit reached only 80% overlap)
#  3. fill the background around the cut-out from the hull colours (so edges never pick up the dark backdrop)
#  4. write base colour + glow textures in "texture space": u = (x + 15.5) / 31, v = (z + 18.5) / 37 in world units
#     (game frame: +X right, +Z nose / screen down); colours sampled from a 4x super-resolved copy (EDSR)
#     HQ: 2048 base colour / 1024 glow; Smooth: 1024 / 512
# Inputs: src/concept/concept_sheet_b.jpg, out/ref/top_mask.png (build.cjs, then mask_ref.cjs). Outputs: src/concept/tex/
# (committed; build.cjs embeds them) and out/concept/warp_overlay.jpg. Run: npm run concept (needs .venv, see README)
import json, os
import numpy as np, cv2
from scipy import ndimage
from scipy.interpolate import RBFInterpolator

OUT = 'out/concept'; TEXDIR = 'src/concept/tex'; os.makedirs(OUT, exist_ok=True); os.makedirs(TEXDIR, exist_ok=True)
TEX = {'x0': -15.5, 'x1': 15.5, 'z0': -18.5, 'z1': 18.5}          # world box covered by the texture
DELIGHT = 0.0   # 0 keeps the concept's own shading (it reads best from the top-down camera)
MASK_PPU, MASK_HALF = 25.6, 20                                       # top_mask.png: 1024 px over 40 units, row 0 = z -20

# --- 1. cut-out -----------------------------------------------------------------------------------------------------
sheet = cv2.imread('src/concept/concept_sheet_b.jpg'); panel = sheet[0:498, 612:1012].copy(); H, W = panel.shape[:2]
gc = np.full((H, W), cv2.GC_PR_BGD, np.uint8); gc[:, :4] = gc[:, -4:] = cv2.GC_BGD; gc[-45:, :] = cv2.GC_BGD
hsv = cv2.cvtColor(panel, cv2.COLOR_BGR2HSV); gc[(hsv[..., 2] > 200) | (hsv[..., 1] > 120)] = cv2.GC_FGD
gc[H // 2 - 60:H // 2 + 60, W // 2 - 15:W // 2 + 15] = cv2.GC_FGD
cv2.grabCut(panel, gc, None, np.zeros((1, 65)), np.zeros((1, 65)), 8, cv2.GC_INIT_WITH_MASK)
m = (gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD); m = ndimage.binary_opening(m, iterations=1)
lab, n = ndimage.label(m); m = lab == (1 + int(np.argmax(ndimage.sum(m, lab, range(1, n + 1))))); m = ndimage.binary_fill_holes(m)
concept = cv2.rotate(panel, cv2.ROTATE_180); cmask = np.rot90(m, 2).copy()
# super-resolution: EDSR x4 (Apache-2.0 weights, offline, .models/EDSR_x4.pb) + light unsharp mask. The cut-out and the
# warp stay on the original pixel grid; only the final colour sampling reads the 4x image.
SR = 4
srm = cv2.dnn_superres.DnnSuperResImpl_create(); srm.readModel('.models/EDSR_x4.pb'); srm.setModel('edsr', SR)
concept_sr = cv2.rotate(srm.upsample(panel), cv2.ROTATE_180)
blur = cv2.GaussianBlur(concept_sr, (0, 0), 1.6); concept_sr = cv2.addWeighted(concept_sr, 1.35, blur, -.35, 0)
cmask_sr = cv2.resize(cmask.astype(np.float32), (concept_sr.shape[1], concept_sr.shape[0]), interpolation=cv2.INTER_LINEAR) > .5

# --- 3 (before warping). background fill: grow hull colours outwards so warped edges stay on-hull ------------------
fill = concept.copy(); grow = cmask.copy()
for _ in range(40):                                                   # repeated dilation of colours into the background
    d = ndimage.binary_dilation(grow, iterations=1); ring = d & ~grow
    if not ring.any(): break
    for c in range(3):
        acc = ndimage.uniform_filter(np.where(grow, fill[..., c], 0).astype(np.float32), 5)
        cnt = ndimage.uniform_filter(grow.astype(np.float32), 5)
        fill[..., c][ring] = (acc[ring] / np.maximum(cnt[ring], 1e-3)).astype(np.uint8)
    grow = d
fill[~grow] = np.median(concept[cmask], axis=0).astype(np.uint8)
# 4x colour source: super-resolved ship, upscaled background fill around it
fill_sr = np.where(cmask_sr[..., None], concept_sr, cv2.resize(fill, (concept_sr.shape[1], concept_sr.shape[0]), interpolation=cv2.INTER_CUBIC))

# --- 2. landmarks: concept px (nose-down image)  ->  model top_mask px ---------------------------------------------
L = [  # name, concept (u,v), model mask (x,y)
 ('nose', (183, 457), (512, 915)), ('spikeL', (141, 484), (436, 975)), ('spikeR', (233, 484), (586, 975)),
 ('wingtipL', (4, 226), (131, 470)), ('wingtipR', (391, 226), (893, 470)),
 ('finFrontL', (50, 379), (236, 805)), ('finFrontR', (322, 379), (786, 805)),
 ('finRearL', (80, 46), (276, 130)), ('finRearR', (315, 46), (746, 130)),
 ('engC', (186, 15), (512, 48)), ('engL', (122, 15), (366, 120)), ('engR', (250, 15), (656, 120)),
 ('canopyTop', (186, 165), (512, 312)), ('canopyBot', (186, 305), (512, 635)), ('spineMid', (184, 381), (512, 775)),
]
src = np.array([p[1] for p in L], float); dst = np.array([p[2] for p in L], float)
# thin-plate spline from model-mask px to concept px (inverse map, used for sampling)
tps = RBFInterpolator(dst, src, kernel='thin_plate_spline', smoothing=1.0)
resid = np.abs(tps(dst) - src).max()

def bake(size):
    # texture pixel -> world (x,z) -> mask px -> concept px
    us, vs = np.meshgrid((np.arange(size) + .5) / size, (np.arange(size) + .5) / size)
    x = TEX['x0'] + us * (TEX['x1'] - TEX['x0']); z = TEX['z0'] + vs * (TEX['z1'] - TEX['z0'])
    mx = (x + MASK_HALF) * MASK_PPU; my = (z + MASK_HALF) * MASK_PPU
    q = tps(np.stack([mx.ravel(), my.ravel()], 1)).astype(np.float32).reshape(size, size, 2)
    qs = (q + .5) * SR - .5                                                    # original px -> 4x px (pixel centres)
    rgb = cv2.remap(fill_sr, qs[..., 0], qs[..., 1], cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    inside = cv2.remap(cmask.astype(np.uint8), q[..., 0], q[..., 1], cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT) > 0
    return rgb, inside, (mx, my)

def glow_of(rgb):
    # glow = the concept's saturated red / violet light strips and canopy light (hue ranges in OpenCV's 0-180 scale)
    h = cv2.cvtColor(rgb, cv2.COLOR_BGR2HSV); hue, sat, val = h[..., 0].astype(int), h[..., 1].astype(int), h[..., 2].astype(int)
    red = ((hue < 10) | (hue > 165)) & (sat > 110) & (val > 150); violet = (hue > 125) & (hue < 165) & (sat > 90) & (val > 110)
    k = np.clip((sat - 80) / 120, 0, 1) * np.clip((val - 90) / 120, 0, 1); k = cv2.GaussianBlur((k * (red | violet)).astype(np.float32), (0, 0), .8)
    return (rgb.astype(np.float32) * k[..., None]).clip(0, 255).astype(np.uint8), (red | violet).mean()

target = cv2.imread('out/ref/top_mask.png', cv2.IMREAD_GRAYSCALE) > 127
report = {'landmarks': len(L), 'tpsMaxResidualPx': round(float(resid), 2), 'texWorldBox': TEX}
SIZES = {'hq': (2048, 1024), 'smooth': (1024, 512)}   # (base colour, glow) texture sizes
for sfx, (size, gsize) in SIZES.items():
    rgb, inside, (mx, my) = bake(size)
    # base colour: soften the concept's baked highlights a little so 3D lighting does not double them
    lab_ = cv2.cvtColor(rgb, cv2.COLOR_BGR2LAB).astype(np.float32); Lc = lab_[..., 0]
    base = cv2.GaussianBlur(Lc, (0, 0), size / 40); lab_[..., 0] = np.clip(Lc - DELIGHT * (base - base.mean()), 0, 255)
    albedo = cv2.cvtColor(lab_.astype(np.uint8), cv2.COLOR_LAB2BGR)
    # model areas the concept does not cover (mostly the thin rear fins): clean white hull, feathered into the concept
    k = cv2.GaussianBlur(inside.astype(np.float32), (0, 0), size / 256)[..., None]
    hull = np.full_like(albedo, (226, 224, 222))                                            # BGR, the concept's panel white
    albedo = (albedo * k + hull * (1 - k)).astype(np.uint8)
    glow, frac = glow_of(rgb)
    # soft halo around the light strips, like the concept's bloom (cheaper than a bloom pass on the phone)
    halo = cv2.GaussianBlur(glow.astype(np.float32), (0, 0), size / 170) * 1.8
    glow = (np.maximum(glow.astype(np.float32), halo) * k).clip(0, 255).astype(np.uint8)
    cv2.imwrite(f'{TEXDIR}/albedo_{sfx}.jpg', albedo, [cv2.IMWRITE_JPEG_QUALITY, 90]); cv2.imwrite(f'{TEXDIR}/glow_{sfx}.jpg', cv2.resize(glow, (gsize, gsize), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 90])
    # how well the warped concept covers the model's outline (in texture space)
    tm = cv2.remap(target.astype(np.uint8), mx.astype(np.float32), my.astype(np.float32), cv2.INTER_NEAREST) > 0
    report[sfx] = {'size': size, 'warpedIoU': round(float((tm & inside).sum() / max(1, (tm | inside).sum())), 4),
                   'modelCoveredByConceptPct': round(float(100 * (tm & inside).sum() / max(1, tm.sum())), 2), 'glowPct': round(float(100 * frac), 2)}
    if sfx == 'hq':
        # reference for look tuning: the warped concept itself (no fill, no de-lighting) + where it covers the model
        cv2.imwrite(f'{OUT}/ref_hq.png', rgb); cv2.imwrite(f'{OUT}/ref_mask_hq.png', ((tm & inside) * 255).astype(np.uint8))
        ov = albedo.copy(); ov[~tm] = (ov[~tm] * .25).astype(np.uint8); e = cv2.Canny(tm.astype(np.uint8) * 255, 50, 150) > 0; ov[e] = (255, 255, 0)
        cv2.imwrite(f'{OUT}/warp_overlay.jpg', ov)
json.dump(report, open(f'{TEXDIR}/concept_tex.json', 'w'), indent=1); print(json.dumps(report))
