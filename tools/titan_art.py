# Builds art/jet_titan.png from Rex's render: hand-traced outline (display-scale coords), painted flames cut off at the nozzles.
import json
from PIL import Image,ImageDraw,ImageFilter
s=0.8289374529012811;cx=592
disp=[(490,22),(470,55),(455,95),(442,140),(437,200),(420,215),(418,300),(380,305),(375,160),(366,140),(356,138),(350,155),(345,245),(340,245),(333,160),(325,147),(316,152),(312,200),(310,290),(292,305),(284,340),(284,420),(298,445),(240,505),(150,565),(70,615),(45,640),(38,700),(48,730),(60,725),(100,705),(170,700),(235,700),(250,705),(238,770),(225,850),(240,840),(268,795),(270,860),(270,940),(290,920),(345,860),(350,880),(352,930),(375,945),(410,945),(430,930),(440,930),(450,960),(462,985),(490,988)]
half=[(x/s,y/s) for x,y in disp]
im=Image.open('cut/titan_src.png').convert('RGB');W,H=im.size
pts=half+[(2*cx-x,y) for x,y in reversed(half)]
S=3;m=Image.new('L',(W*S,H*S),0);ImageDraw.Draw(m).polygon([(x*S,y*S) for x,y in pts],fill=255)
m=m.resize((W,H),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.8))
out=im.convert('RGBA');out.putalpha(m);bb=out.getbbox();out=out.crop(bb)
w,h=out.size
noz=[[round(((x/s)-bb[0])/w-.5,3),round(((y/s)-bb[1])/h-.5,3)] for x,y in [(390,938),(490,983),(590,938)]]
out=out.resize((w*2//3,h*2//3),Image.LANCZOS)
out.save('/home/user/skyfire/art/jet_titan.png',optimize=True);print(out.size,bb,noz)
