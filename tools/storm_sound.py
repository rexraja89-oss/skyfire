#!/usr/bin/env python3
"""Original storm-at-sea ambience for the Storm Fleet stage (Skyfire v5.14).

Writes art/snd/storm.ogg: a 48 s seamless stereo loop of
  - wind: gusting band-limited noise plus a resonant howl that rises and falls with the gusts
  - rain: dense hiss with drop clicks, swelling with the gusts
  - sea: rolling swell (low rumble with slow surges) and breaking crests (broadband wash)
  - ship machinery: a distant low engine throb under everything
Everything is synthesised here (no recordings), so the result is Skyfire's own. Every slow modulation completes a
whole number of cycles over the loop and the tail is crossfaded into the head, so the loop has no seam.
Usage: python3 tools/storm_sound.py   (needs numpy, scipy, ffmpeg)
"""
import os, subprocess, tempfile, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
LEN = 48.0
FADE = 3.0
N = int(SR * LEN)
NT = int(SR * (LEN + FADE))
rng = np.random.default_rng(1405)
t = np.arange(NT) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'lowpass', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'highpass', fs=SR, output='sos'), x)


def per(cycles, phase=0.0):
    """slow periodic modulation with a whole number of cycles over the loop length"""
    return np.sin(2 * np.pi * cycles * t / LEN + phase)


def noise():
    return rng.standard_normal(NT)


# gust envelope shared by wind and rain (0..1), irregular but periodic
gust = 0.5 + 0.22 * per(3, .4) + 0.16 * per(5, 1.9) + 0.1 * per(11, 3.1) + 0.05 * per(23, .7)
gust = np.clip(gust, 0.08, 1.0)


def wind(ch):
    body = bp(noise(), 120, 900) * (0.35 + 0.75 * gust)
    # howl: a narrow resonance whose pitch follows the gusts (time-varying, done in short blocks)
    src, out, blk = noise(), np.zeros(NT), 2048
    zi = None
    for i in range(0, NT, blk):
        g = gust[i]
        f0 = 260 + 420 * g + (25 if ch else -25)
        sos = butter(2, [f0 * .93, f0 * 1.07], 'bandpass', fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + blk], zi = sosfilt(sos, src[i:i + blk], zi=zi)
    howl = out * (gust ** 2.2) * 1.6
    whistle = bp(noise(), 1800, 3200) * np.clip(gust - .55, 0, 1) * .5
    return body + howl + whistle


def rain(ch):
    hiss = bp(noise(), 2400, 8000) * (0.28 + 0.22 * gust)
    hiss += bp(noise(), 600, 2400) * 0.12
    drops = np.zeros(NT)
    idx = rng.integers(0, NT - 400, int(LEN * 650))
    amp = rng.uniform(.2, 1, len(idx))
    for i, a in zip(idx, amp):
        drops[i:i + 60] += a * np.exp(-np.arange(60) / 9) * rng.standard_normal(60)
    return hiss + hp(drops, 3000) * .35


def sea(ch):
    # rolling swell: low rumble with surges every 6-9 s
    surge = np.clip(0.45 + 0.3 * per(6, .3 + ch * .4) + 0.2 * per(7, 2.2) + .12 * per(13, 1.1), 0, 1)
    rumble = lp(noise(), 260, 3) * (0.5 + 1.1 * surge ** 1.5)
    # breaking crests: broadband wash shaped by short bursts at irregular times
    wash = np.zeros(NT)
    times = [1.2, 6.8, 11.5, 17.9, 22.4, 28.6, 33.1, 39.7, 44.3]
    for k, c in enumerate(times):
        c0 = c + (0.35 if ch else 0)
        e = np.exp(-((t - c0) / 1.1) ** 2) * (1 - np.exp(-np.clip(t - c0 + 1.2, 0, None) * 4))
        wash += e * (0.6 + 0.4 * ((k * 37) % 5) / 4)
        # also the copy one loop later so crests near the end wrap into the head
        wash += np.exp(-((t - c0 - LEN) / 1.1) ** 2)
    crest = bp(noise(), 300, 5000) * wash * .55
    return rumble + crest


def machinery(ch):
    f = 47.0
    throb = 0.7 + 0.3 * np.sin(2 * np.pi * (72 / LEN) * t)  # ~1.5 Hz, whole cycles
    tone = sum(a * np.sin(2 * np.pi * f * h * t + ch * .3) for h, a in [(1, 1), (2, .5), (3, .28), (5, .12)])
    rattle = bp(noise(), 90, 300) * .25
    return (tone * .06 + rattle * .05) * throb


chans = []
for ch in (0, 1):
    mix = 0.9 * wind(ch) + 0.55 * rain(ch) + 0.8 * sea(ch) + machinery(ch)
    chans.append(mix)
st = lp(hp(np.stack(chans), 30), 11000)   # filter before the splice so no filter start-up lands on the seam
# seamless loop: crossfade the extra tail into the head (equal power)
nf = int(SR * FADE)
a = np.sin(np.linspace(0, np.pi / 2, nf)) ** 2
head = st[:, :nf] * a + st[:, N:N + nf] * (1 - a)
st = np.concatenate([head, st[:, nf:N]], axis=1)
# level: peak-safe and roughly -20 LUFS-ish RMS so it sits under the weapons
st /= np.max(np.abs(st)) / 0.8
rms = np.sqrt(np.mean(st ** 2))
st *= min(1.0, 0.12 / rms)

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'art', 'snd', 'storm.ogg')
with tempfile.TemporaryDirectory() as d:
    wp = os.path.join(d, 'storm.wav')
    pcm = (np.clip(st.T, -1, 1) * 32767).astype('<i2')
    with wave.open(wp, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wp, '-c:a', 'libvorbis', '-q:a', '3', out], check=True)
print('wrote', out, 'rms', round(float(np.sqrt(np.mean(st ** 2))), 4), 'peak', round(float(np.max(np.abs(st))), 3))
