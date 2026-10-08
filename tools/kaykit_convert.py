import json,sys,base64,struct,numpy as np,math
from PIL import Image
D=sys.argv[1];names=sys.argv[2].split(',')
tex=np.asarray(Image.open(D+'/citybits_texture.png').convert('RGB')).astype(np.float32)
TH,TW=tex.shape[:2]
CT={5126:np.float32,5123:np.uint16,5125:np.uint32,5121:np.uint8}
NC={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def qmat(q):
 x,y,z,w=q;return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def nodeM(n):
 if 'matrix' in n:return np.array(n['matrix']).reshape(4,4).T
 M=np.eye(4);t=n.get('translation',[0,0,0]);r=n.get('rotation',[0,0,0,1]);s=n.get('scale',[1,1,1])
 M[:3,:3]=qmat(r)@np.diag(s);M[:3,3]=t;return M
out={}
for nm in names:
 g=json.load(open(f'{D}/{nm}.gltf'));bin_=open(f'{D}/{nm}.bin','rb').read()
 def acc(i):
  a=g['accessors'][i];bv=g['bufferViews'][a['bufferView']];off=bv.get('byteOffset',0)+a.get('byteOffset',0)
  n=a['count']*NC[a['type']];arr=np.frombuffer(bin_,dtype=CT[a['componentType']],count=n,offset=off)
  return arr.reshape(a['count'],NC[a['type']]) if NC[a['type']]>1 else arr
 P=[];N=[];C=[];I=[];base=0
 def walk(ni,M):
  global base
  n=g['nodes'][ni];M=M@nodeM(n)
  if 'mesh' in n:
   for pr in g['meshes'][n['mesh']]['primitives']:
    p=acc(pr['attributes']['POSITION']).astype(np.float64);no=acc(pr['attributes']['NORMAL']).astype(np.float64);uv=acc(pr['attributes']['TEXCOORD_0'])
    p=(M[:3,:3]@p.T).T+M[:3,3];no=(np.linalg.inv(M[:3,:3]).T@no.T).T;no/=np.linalg.norm(no,axis=1,keepdims=True)+1e-9
    u=np.clip((uv[:,0]%1)*TW,0,TW-1).astype(int);v=np.clip((uv[:,1]%1)*TH,0,TH-1).astype(int)
    c=tex[v,u]
    P.append(p);N.append(no);C.append(c);I.append(acc(pr['indices']).astype(np.int64)+base);base+=len(p)
  for ch in n.get('children',[]):walk(ch,M)
 base=0
 for r in g['scenes'][0]['nodes']:walk(r,np.eye(4))
 P=np.vstack(P);N=np.vstack(N);C=np.vstack(C);I=np.concatenate(I)
 mn=P.min(0);mx=P.max(0);sz=np.maximum(mx-mn,1e-6)
 q=np.round((P-mn)/sz*65535-32768).astype(np.int16)
 nq=np.round(N*127).astype(np.int8);cq=np.clip(C,0,255).astype(np.uint8)
 b64=lambda a:base64.b64encode(a.tobytes()).decode()
 out[nm]={'mn':[round(float(x),4) for x in mn],'sz':[round(float(x),4) for x in sz],'p':b64(q),'c':b64(cq),'i':b64(I.astype(np.uint16)),'v':len(P)}
 print(nm,len(P),len(I)//3,[round(float(x),2) for x in sz],file=sys.stderr)
js="'use strict';\n// KayKit City Builder Bits 1.0 by Kay Lousberg (www.kaylousberg.com), CC0 1.0 Universal.\n// Converted to compact vertex-coloured meshes (atlas colours baked per vertex) by tools in the build session.\n// Decoded by kkGeo(name) in world.js (positions are Int16 inside the bounding box mn..mn+sz).\nSF.KK="+json.dumps(out,separators=(',',':'))+";\n"
open(sys.argv[3],'w').write(js)
