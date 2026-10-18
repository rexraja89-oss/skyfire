# Scores tune.cjs renders against the warped concept (out/concept/ref_hq.png) inside the area the concept covers:
#   dE   = mean CIE76 colour difference (Lab), lower = closer colours
#   edge = correlation of edge maps (Sobel magnitude), higher = same detail in the same places
#   score = dE - 40 * edge (lower is better)
# Run: .venv/bin/python tune_score.py candidates.json outdir
import json, sys, glob, cv2, numpy as np
cands = json.load(open(sys.argv[1])); files = sorted(glob.glob(sys.argv[2] + '/c*.png'))
ref = cv2.imread('out/concept/ref_hq.png'); m = cv2.imread('out/concept/ref_mask_hq.png', 0) > 127
H, W = cv2.imread(files[0]).shape[:2]; ref = cv2.resize(ref, (W, H), interpolation=cv2.INTER_AREA); m = cv2.resize(m.astype(np.uint8), (W, H), interpolation=cv2.INTER_NEAREST) > 0
m = cv2.erode(m.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
lab = lambda im: cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32) * [100 / 255, 1, 1] - [0, 128, 128]
edges = lambda im: np.hypot(*[cv2.Sobel(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32), cv2.CV_32F, *d) for d in ((1, 0), (0, 1))])
rl, re = lab(ref), edges(ref)
rows = []
for f, c in zip(files, cands):
    im = cv2.imread(f); dE = float(np.linalg.norm(lab(im) - rl, axis=2)[m].mean())
    a, b = edges(im)[m], re[m]; edge = float(np.corrcoef(a, b)[0, 1])
    rows.append({'file': f.split('/')[-1], 'dE': round(dE, 2), 'edge': round(edge, 3), 'score': round(dE - 40 * edge, 2), 'cand': c})
rows.sort(key=lambda r: r['score']); print(json.dumps(rows[:6], indent=0)); json.dump(rows, open(sys.argv[2] + '/scores.json', 'w'), indent=1)
