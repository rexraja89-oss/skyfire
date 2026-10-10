'use strict';
// ============ APPROVED LIBRARY ASSETS (v5.23) ============
// Assets Rex approved in the asset catalog (branch skyfire-asset-catalog-lab, lab/asset-catalog), prepared for phones
// there (meshopt-simplified geometry, Basis KTX2 textures, EXT_meshopt_compression) and copied to art/models:
//   rocks   Poly Haven CC0 photo-scans: boulder_01, namaqualand_boulder_02, rock_moss_set_01, rock_09 → the boulder props
//   fighter "Free Sci-Fi Fighter" by GrafxBOX / CGPitbull, CC-BY 4.0 (credit in README) → enemy model `fighter`
//   skies   Poly Haven CC0 HDRIs baked to small cube faces by tools/sky_bake.py (art/sky) → scene reflections/light
// Loaded with three r128 GLTFLoader + KTX2Loader + meshopt decoder (js/vendor). Everything swaps in when it arrives;
// until then, or if a file or the decoder is unavailable, the built-in code models and painted sky stay in place.
(()=>{
const T3=THREE,A=SF.a3d={rocks:{},ok:{},env:{}};
// which rock goes where: wet/green stages vs dry/cold/volcanic stages
const ROCKS={wet:{boulder:'rock-boulder01',boulder2:'rock-mossset01'},dry:{boulder:'rock-namaqua02',boulder2:'rock-09'}};
const DRY={desert:1,canyon:1,arctic:1,volcano:1,farm:1};
// baked skies per biome (others keep the painted envCube: night city, storm, volcano)
const SKY={harbor:'dawn',farm:'day',desert:'day',forest:'day',port:'day',islands:'day',canyon:'day',arctic:'day'};
let GL=null;
function loader(){if(GL)return GL;if(!T3.GLTFLoader||!T3.KTX2Loader||!window.MeshoptDecoder)return null;
 const k=new T3.KTX2Loader().setTranscoderPath('js/vendor/basis/').detectSupport(renderer);
 GL=new T3.GLTFLoader().setKTX2Loader(k).setMeshoptDecoder(window.MeshoptDecoder);return GL;}
const url=n=>'art/models/'+n+'.glb?v='+BUILD;
// meshopt-compressed files store positions/normals/UVs as (normalised) integers; read them back as floats
const NRM={Int8Array:127,Uint8Array:255,Int16Array:32767,Uint16Array:65535};
function floats(at){const n=at.count,k=at.itemSize,o=new Float32Array(n*k),d=at.normalized?(NRM[at.array.constructor.name]||1):1;
 for(let i=0;i<n;i++)for(let j=0;j<k;j++){const v=at.isInterleavedBufferAttribute?at.data.array[i*at.data.stride+at.offset+j]:at.array[i*k+j];o[i*k+j]=at.normalized?Math.max(v/d,-1):v;}return o;}
// true bounds of a scene (quantised attributes make three r128's own box wrong)
function bounds(root){root.updateMatrixWorld(true);const b=new T3.Box3(),v=new T3.Vector3();
 root.traverse(o=>{if(!o.isMesh)return;const P=floats(o.geometry.attributes.position);for(let i=0;i<P.length;i+=3){v.set(P[i],P[i+1],P[i+2]).applyMatrix4(o.matrixWorld);b.expandByPoint(v);}});return b;}
// one geometry + one material from a whole glTF scene, normalised like the old boulder: footprint ~2 units, base at y 0
function rockFrom(g){g.scene.updateMatrixWorld(true);const parts=[];let mat=null;
 g.scene.traverse(o=>{if(o.isMesh){parts.push(o);if(!mat)mat=o.material;}});
 const pos=[],nor=[],uv=[],idx=[];let base=0;const v=new T3.Vector3(),nm=new T3.Matrix3();
 for(const o of parts){const a=o.geometry.attributes,P=floats(a.position),Nn=a.normal?floats(a.normal):null,U=a.uv?floats(a.uv):null,cnt=a.position.count;nm.getNormalMatrix(o.matrixWorld);
  for(let i=0;i<cnt;i++){v.set(P[i*3],P[i*3+1],P[i*3+2]).applyMatrix4(o.matrixWorld);pos.push(v.x,v.y,v.z);
   if(Nn){v.set(Nn[i*3],Nn[i*3+1],Nn[i*3+2]).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);}uv.push(U?U[i*2]:0,U?U[i*2+1]:0);}
  const ix=o.geometry.index;if(ix)for(let i=0;i<ix.count;i++)idx.push(ix.getX(i)+base);else for(let i=0;i<cnt;i++)idx.push(i+base);base+=cnt;}
 const geo=new T3.BufferGeometry();geo.setAttribute('position',new T3.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T3.Float32BufferAttribute(uv,2));
 if(nor.length===pos.length)geo.setAttribute('normal',new T3.Float32BufferAttribute(nor,3));else geo.computeVertexNormals();geo.setIndex(idx);
 geo.computeBoundingBox();const b=geo.boundingBox,s=2/Math.max(b.max.x-b.min.x,b.max.z-b.min.z);
 geo.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);geo.scale(s,s,s);geo.translate(0,-.12,0);   // sink slightly into the ground
 mat=mat.clone();mat.vertexColors=false;mat.envMapIntensity=.6;return{geo,mat};}
// enemy fighter: nose to -z (up the screen, like the code models), length matched to the old fighter
function fighterFrom(g){const s=g.scene;const b=bounds(s),sz=b.getSize(new T3.Vector3()),c=b.getCenter(new T3.Vector3());
 s.traverse(o=>{if(o.isMesh){o.frustumCulled=false;}});   // r128 culls quantised meshes with a wrong sphere
 const inner=new T3.Group();s.position.sub(c);inner.add(s);inner.rotation.y=Math.PI;   // the source model's nose points +z
 const k=3.9/Math.max(sz.z,sz.x);inner.scale.setScalar(k);const out=new T3.Group();out.add(inner);
 out.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=false;if(o.material){o.material.envMapIntensity=1.1;}}});return out;}
// apply the rock set for a biome to PROPS (called by buildLevel before it creates the instanced props)
A.level=bk=>{const set=ROCKS[DRY[bk]?'dry':'wet'];for(const k in set){const r=A.rocks[set[k]];if(r&&PROPS[k]){PROPS[k].geo=r.geo;PROPS[k].mat=r.mat;}}};
// sky cube for a biome, or null (the caller keeps the painted envCube)
A.envFor=bk=>A.env[SKY[bk]]||null;
function refreshLevel(){if(!LV||!LV.bk)return;A.level(LV.bk);for(const t of TER.tiles)for(const k of['boulder','boulder2'])if(t.inst[k]){t.inst[k].geometry=PROPS[k].geo;t.inst[k].material=PROPS[k].mat;}
 const e=A.envFor(LV.bk);if(e)scene.environment=e;}
A.init=()=>{const L=loader();
 for(const n of['day','dawn']){const ld=new T3.CubeTextureLoader();ld.load(['px','nx','py','ny','pz','nz'].map(f=>'art/sky/'+n+'_'+f+'.jpg?v='+BUILD),t=>{t.encoding=T3.sRGBEncoding;A.env[n]=t;A.ok['sky-'+n]=1;refreshLevel();},undefined,()=>{});}
 if(!L)return;
 for(const n of['rock-boulder01','rock-namaqua02','rock-mossset01','rock-09'])L.load(url(n),g=>{try{A.rocks[n]=rockFrom(g);A.ok[n]=1;refreshLevel();}catch(e){console.warn('rock',n,e);}},undefined,e=>console.warn('asset',n,e));
 L.load(url('jet-scifi-free'),g=>{try{const m=fighterFrom(g);if(POOL.fighter){for(const o of POOL.fighter)scene.remove(o);POOL.fighter.length=0;}MODELS.fighter=m;A.ok.fighter=1;}catch(e){console.warn('fighter',e);}},undefined,e=>console.warn('asset fighter',e));};
})();
