# Cut a symmetric object out of a picture with a hand-traced half outline (mirrored around x=cx).
# usage: python3 tools/polycut.py src.jpg out.png "[[x,y],...]" cx [--flip]
import sys,json
from PIL import Image,ImageDraw,ImageFilter
src,dst=sys.argv[1],sys.argv[2];half=json.loads(sys.argv[3]);cx=float(sys.argv[4])
im=Image.open(src).convert('RGB');w,h=im.size
pts=half+[(2*cx-x,y) for x,y in reversed(half)]
S=4;m=Image.new('L',(w*S,h*S),0);ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in pts],fill=255)
m=m.resize((w,h),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6))
out=im.convert('RGBA');out.putalpha(m);out=out.crop(out.getbbox())
if '--flip' in sys.argv:out=out.rotate(180)
out.save(dst);print(out.size)
