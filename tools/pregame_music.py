# Original cinematic pregame soundtrack for Skyfire (v5.11): trailer-style braams, sub impacts, risers, whooshes,
# a low drone and a war-drum ostinato, in D minor. Rendered offline with numpy/scipy into a seamless 64 s loop.
# Written for Skyfire; no samples from any library. Rex asked for the feel of a movie-trailer sound reel; this is an
# original piece in that genre.  Output: art/snd/pregame.ogg (via ffmpeg)    run: python3 tools/pregame_music.py
import numpy as np, subprocess, os
from scipy.signal import butter, sosfilt, fftconvolve
SR = 44100; BAR = 3.2; NB = 20; L = BAR*NB; TAIL = 6.0
N = int((L + TAIL)*SR); out = np.zeros((N, 2)); rng = np.random.default_rng(2026)
t_all = np.arange(N)/SR
def hz(m): return 440*2**((m-69)/12)
def lp(x, f, o=2): return sosfilt(butter(o, f/(SR/2), 'low', output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f/(SR/2), 'high', output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo/(SR/2), hi/(SR/2)], 'band', output='sos'), x)
def put(sig, at, pan=0.0, g=1.0):
    i = int(at*SR); n = min(len(sig), N-i)
    if n <= 0: return
    l = np.cos((pan+1)*np.pi/4); r = np.sin((pan+1)*np.pi/4)
    out[i:i+n, 0] += sig[:n]*g*l*1.414; out[i:i+n, 1] += sig[:n]*g*r*1.414
def env(n, a, d, sus=0.0):
    t = np.arange(n)/SR; e = np.minimum(1, t/max(a, 1e-4))*np.exp(-np.maximum(0, t-a)/d)
    return e*(1-sus) + sus*np.minimum(1, t/max(a, 1e-4))
def saw(f, n, det=0.0):
    t = np.arange(n)/SR; ph = (f*(1+det))*t + rng.random(); return 2*(ph % 1) - 1

def braam(root, dur=4.5):
    n = int(dur*SR); x = np.zeros(n)
    for m in (0, 7, 12, 19, 24):                    # root, fifth, octave stack: brassy, wide
        for d in (-.006, 0, .007):
            x += saw(hz(root+m), n, d)*(1.0 if m < 13 else .5)
    t = np.arange(n)/SR
    cut = 260 + 4200*np.exp(-t/1.3)*np.minimum(1, t/0.05)        # filter opens on the hit, then closes
    y = np.zeros(n); seg = 2048                                   # time-varying low-pass in blocks
    for i in range(0, n, seg):
        y[i:i+seg] = lp(x[i:i+seg], float(cut[min(i, n-1)]))
    return y*env(n, .03, 1.6)*.09

def impact(dur=4.0):
    n = int(dur*SR); t = np.arange(n)/SR
    sub = np.sin(2*np.pi*np.cumsum(30+50*np.exp(-t/0.12))/SR)*np.exp(-t/1.4)*1.1
    crack = hp(rng.normal(size=n), 1500)*np.exp(-t/0.05)*.5
    body = lp(rng.normal(size=n), 900)*np.exp(-t/0.6)*.6
    metal = sum(np.sin(2*np.pi*f*t + rng.random()*6)*np.exp(-t/(.5+rng.random()))*.05 for f in rng.uniform(180, 1400, 8))
    return sub + crack + body + metal

def riser(dur, f0=110, f1=880):
    n = int(dur*SR); t = np.arange(n)/SR; k = (t/dur)**2.2
    f = f0*(f1/f0)**k; ph = 2*np.pi*np.cumsum(f)/SR
    tone = (np.sin(ph) + .5*np.sin(ph*1.5) + .3*np.sin(ph*2.01))*.12
    noise = hp(rng.normal(size=n), 300)
    blocks = np.zeros(n)
    for i in range(0, n, 4096):
        fc = 400 + 7000*k[min(i, n-1)]; blocks[i:i+4096] = bp(noise[i:i+4096], max(200, fc*.5), min(SR/2-100, fc*1.5))
    return (tone + blocks*.25)*k**1.3

def whoosh(dur=1.6):
    n = int(dur*SR); t = np.arange(n)/SR; e = np.sin(np.pi*t/dur)**2
    x = rng.normal(size=n); y = np.zeros(n)
    for i in range(0, n, 2048):
        fc = 300 + 3000*np.sin(np.pi*i/n); y[i:i+2048] = bp(x[i:i+2048], fc*.6, fc*1.6)
    return y*e*.6

def drum(pitch=55, dur=1.2):
    n = int(dur*SR); t = np.arange(n)/SR
    return (np.sin(2*np.pi*np.cumsum(pitch+90*np.exp(-t/0.03))/SR)*np.exp(-t/0.35) + lp(rng.normal(size=n), 2500)*np.exp(-t/0.04)*.4)

# --- drone bed (whole loop + tail): D1/D2 with slow filter breathing ---
n = N; t = t_all
drone = (np.sin(2*np.pi*hz(26)*t) + .5*np.sin(2*np.pi*hz(38)*t + .3) + .25*np.sin(2*np.pi*hz(45)*t + 1.1))*.22
pad = sum(saw(hz(m), n, d) for m in (50, 53, 57) for d in (-.004, .004))
pad = lp(pad, 700)*(.5+.5*np.sin(2*np.pi*t/(L/2)))*.035
put(drone, 0); out[:, 0] += pad; out[:, 1] += np.roll(pad, 900)

# --- arrangement (bars of 3.2 s) ---
roots = [26, 26, 29, 24, 26, 26, 31, 29, 26, 26, 29, 24, 22, 24, 26, 29, 26, 26, 24, 26]
hits = [0, 2, 4, 6, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18]
for b in hits:
    at = b*BAR; put(braam(roots[b]), at, rng.uniform(-.2, .2)); put(impact(), at, 0, .55)
for b in (3, 5, 7, 15, 19): put(whoosh(), b*BAR + BAR - 1.4, rng.uniform(-.6, .6))
put(riser(BAR*2.0, 98, 784), 2*BAR, -.3, .9)            # into bar 4
put(riser(BAR*1.8, 110, 1100), 6.2*BAR, .3, .9)         # into bar 8
put(riser(BAR*3.0, 73, 1320), 13*BAR, 0, 1.0)           # long one into bar 16
for b in range(8, 16):                                  # war-drum ostinato in the middle section
    for k, (o, p, g) in enumerate([(0, 55, 1), (.4, 62, .6), (.8, 55, .7), (1.6, 55, 1), (2.0, 62, .6), (2.4, 70, .5), (2.8, 62, .55)]):
        put(drum(p), b*BAR + o, (-.35, .35)[k % 2], .32*g)

# --- reverb, seamless loop (tail folded onto the start), master ---
ir_n = int(3.6*SR); it = np.arange(ir_n)/SR
ir = np.stack([rng.normal(size=ir_n)*np.exp(-it/0.9), rng.normal(size=ir_n)*np.exp(-it/0.95)], 1); ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
wet = np.stack([fftconvolve(out[:, c], ir[:, c])[:N] for c in range(2)], 1)
mix = out + wet*.06
Ls = int(L*SR); loop = mix[:Ls].copy(); loop[:N-Ls] += mix[Ls:]     # tail of the last bar rings into bar 1
loop = hp(loop.T, 25).T
loop = np.tanh(loop/np.percentile(np.abs(loop), 99.9)*1.1)*.82    # soft limiter
os.makedirs('art/snd', exist_ok=True); tmp = '/tmp/pregame_tmp.wav'
import wave
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(loop, -1, 1)*32767).astype('<i2').tobytes())
# static gain to -16 LUFS integrated (a time-varying normaliser would make the loop point jump)
import re
m = subprocess.run(['ffmpeg', '-nostats', '-i', tmp, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', m)[-1])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', f'volume={-16-I:.2f}dB,alimiter=limit=0.89', '-ar', '44100', '-c:a', 'libvorbis', '-q:a', '5', 'art/snd/pregame.ogg'], check=True)
print('ok', round(L, 1), 's')
