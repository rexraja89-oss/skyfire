"""Customise the generated Capacitor Android project: icon, splash, fullscreen, portrait, version.
Usage: python3 tools/android_patch.py <android_dir> <version_code> <version_name>"""
import os, re, shutil, sys
from PIL import Image

android, code, name = sys.argv[1], sys.argv[2], sys.argv[3]
here = os.path.dirname(os.path.abspath(__file__))
res = os.path.join(android, 'app/src/main/res')

# launcher icons (legacy, round and adaptive foreground)
src = os.path.join(here, 'android-res')
for d in os.listdir(src):
    os.makedirs(os.path.join(res, d), exist_ok=True)
    for f in os.listdir(os.path.join(src, d)):
        shutil.copy(os.path.join(src, d, f), os.path.join(res, d, f))
os.makedirs(os.path.join(res, 'mipmap-anydpi-v26'), exist_ok=True)
adaptive = ('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
            '    <background android:drawable="@color/ic_launcher_background"/>\n'
            '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n')
for f in ('ic_launcher.xml', 'ic_launcher_round.xml'):
    open(os.path.join(res, 'mipmap-anydpi-v26', f), 'w').write(adaptive)
for f in os.listdir(os.path.join(res, 'values')):
    if f.startswith('ic_launcher_background'):
        os.remove(os.path.join(res, 'values', f))
open(os.path.join(res, 'values/ic_launcher_background.xml'), 'w').write(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0A1220</color>\n</resources>\n')

# splash screens: dark cockpit background with the icon in the middle
icon = Image.open(os.path.join(os.path.dirname(here), 'icons/icon-1024-maskable.png')).convert('RGBA')
for root, _, files in os.walk(res):
    for f in files:
        if f == 'splash.png':
            p = os.path.join(root, f)
            w, h = Image.open(p).size
            s = int(min(w, h) * 0.38)
            out = Image.new('RGB', (w, h), (10, 18, 32))
            out.paste(icon.resize((s, s), Image.LANCZOS), ((w - s) // 2, (h - s) // 2))
            out.save(p, optimize=True)

# fullscreen, edge to edge under the camera cutout
styles = os.path.join(res, 'values/styles.xml')
x = open(styles).read()
extra = ('<item name="android:windowFullscreen">true</item>'
         '<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>')
x = re.sub(r'(<style name="AppTheme\.NoActionBar(?:Launch)?"[^>]*>)', r'\1' + extra, x)
open(styles, 'w').write(x)

# portrait only
manifest = os.path.join(android, 'app/src/main/AndroidManifest.xml')
x = open(manifest).read()
if 'screenOrientation' not in x:
    x = x.replace('<activity', '<activity android:screenOrientation="portrait"', 1)
open(manifest, 'w').write(x)

# version + signing: always sign with the committed key so every new APK installs over the last one
gradle = os.path.join(android, 'app/build.gradle')
x = open(gradle).read()
x = re.sub(r'versionCode \d+', 'versionCode ' + code, x)
x = re.sub(r'versionName "[^"]*"', 'versionName "' + name + '"', x)
ks = os.path.join(here, 'debug.keystore').replace('\\', '/')
signing = ('    signingConfigs {\n        skyfire {\n'
           '            storeFile file("' + ks + '")\n'
           '            storePassword "android"\n            keyAlias "androiddebugkey"\n            keyPassword "android"\n'
           '        }\n    }\n')
assert 'signingConfigs' not in x
x = x.replace('    buildTypes {\n', signing + '    buildTypes {\n        debug {\n            signingConfig signingConfigs.skyfire\n        }\n', 1)
assert 'signingConfig signingConfigs.skyfire' in x, 'could not add signing config'
open(gradle, 'w').write(x)
print('patched', android, code, name)
