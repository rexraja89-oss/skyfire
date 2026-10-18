# Skyfire Stage 10 mega-boss: cinematic entrance (Blender 4.5, Cycles, headless). Builds the whole scene from scratch:
#   boss (out/megaboss_cine.glb: full 188k mesh + Rex's concept texture) | CC0 Poly Haven sky HDRI + photo-scanned rock |
#   lava cracks | engine flames + lights | haze (mist pass) + bloom (glare) | camera + boss animation.
# Run (from tools/boss3d):
#   ~/tools/blender-4.5.14-linux-x64/blender -b -P cinematic/boss_entrance.py -- --frames 1-192 --samples 40 --out cinematic/frames
#   options: --frames a-b | a,b,c   --samples N   --res 720x1280   --out DIR   --save scene.blend
import bpy, math, os, sys
from mathutils import Vector, Euler

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
opt = {'frames': '1-192', 'samples': '40', 'res': '720x1280', 'out': 'cinematic/frames', 'save': ''}
for i in range(0, len(argv) - 1, 2): opt[argv[i].lstrip('-')] = argv[i + 1]
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
A = lambda n: os.path.join(HERE, 'assets', n)
FPS, END = 24, 192

# ---------- reset ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS; sc.frame_start, sc.frame_end = 1, END

def node(nt, kind, loc=(0, 0), **props):
    n = nt.nodes.new(kind); n.location = loc
    for k, v in props.items(): setattr(n, k, v)
    return n
def link(nt, a, b): nt.links.new(a, b)
def key(obj, path, frame, value, interp='BEZIER'):
    setattr(obj, path, value) if not isinstance(path, tuple) else None
    obj.keyframe_insert(data_path=path, frame=frame)
    for fc in (obj.animation_data.action.fcurves if obj.animation_data and obj.animation_data.action else []):
        if fc.data_path == path:
            for kp in fc.keyframe_points:
                if int(kp.co[0]) == frame: kp.interpolation = interp

# ---------- world: CC0 sky HDRI ("Industrial Sunset (Pure Sky)", Poly Haven) ----------
w = bpy.data.worlds.new('Sky'); sc.world = w; w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
tc = node(nt, 'ShaderNodeTexCoord', (-900, 0)); mp = node(nt, 'ShaderNodeMapping', (-700, 0))
mp.inputs['Rotation'].default_value = (0, 0, math.radians(200))                       # sun behind-left of the boss path
env = node(nt, 'ShaderNodeTexEnvironment', (-500, 0)); env.image = bpy.data.images.load(A('sky_2k.hdr'))
bg = node(nt, 'ShaderNodeBackground', (-200, 0)); bg.inputs['Strength'].default_value = 0.85
out = node(nt, 'ShaderNodeOutputWorld', (0, 0))
link(nt, tc.outputs['Generated'], mp.inputs['Vector']); link(nt, mp.outputs['Vector'], env.inputs['Vector'])
link(nt, env.outputs['Color'], bg.inputs['Color']); link(nt, bg.outputs['Background'], out.inputs['Surface'])
w.mist_settings.start, w.mist_settings.depth, w.mist_settings.falloff = 200, 4200, 'QUADRATIC'

sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN')); sc.collection.objects.link(sun)
sun.data.energy, sun.data.angle, sun.data.color = 3.2, math.radians(1.5), (1.0, 0.72, 0.5)
sun.rotation_euler = Euler((math.radians(62), 0, math.radians(25)), 'XYZ')                # warm key light from the camera side (the sky's sun stays in the backdrop)

# ---------- ground: photo-scanned rock (aerial_rocks_02, CC0) + glowing lava cracks ----------
GZ = -320                                                                                       # ground far below the flight path
bpy.ops.mesh.primitive_grid_add(x_subdivisions=600, y_subdivisions=600, size=9000, location=(0, 0, GZ)); gnd = bpy.context.object; gnd.name = 'Ground'
# vertex weights: 0 near the action (flat lava plain), rising to 1 far away (mountain ranges), via a vertex group
vg = gnd.vertex_groups.new(name='far')
for v in gnd.data.vertices:
    rr = math.hypot(v.co.x, v.co.y - 900); t = min(1, max(0, (rr - 900) / 1700)); vg.add([v.index], t * t * (3 - 2 * t), 'REPLACE')
d1 = gnd.modifiers.new('ranges', 'DISPLACE'); t1 = bpy.data.textures.new('ranges', 'CLOUDS'); t1.noise_scale = 650; t1.noise_depth = 4; t1.noise_basis = 'BLENDER_ORIGINAL'
d1.texture = t1; d1.strength = 900; d1.mid_level = 0.35; d1.vertex_group = 'far'
d2 = gnd.modifiers.new('ridges', 'DISPLACE'); t2 = bpy.data.textures.new('ridges', 'MUSGRAVE') if hasattr(bpy.types, 'MusgraveTexture') else bpy.data.textures.new('ridges', 'CLOUDS')
try: t2.noise_scale = 160
except Exception: pass
d2.texture = t2; d2.strength = 120; d2.vertex_group = 'far'
d3 = gnd.modifiers.new('bumps', 'DISPLACE'); t3 = bpy.data.textures.new('bumps', 'CLOUDS'); t3.noise_scale = 90; d3.texture = t3; d3.strength = 14
bpy.ops.object.shade_smooth()
gm = bpy.data.materials.new('Volcanic'); gm.use_nodes = True; nt = gm.node_tree; nt.nodes.clear()
tco = node(nt, 'ShaderNodeTexCoord', (-1400, 0)); m2 = node(nt, 'ShaderNodeMapping', (-1200, 0)); m2.inputs['Scale'].default_value = (420, 420, 420)   # ~21 world units per tile: keeps the boss huge
link(nt, tco.outputs['UV'], m2.inputs['Vector'])
def img(path, loc, cs='sRGB'):
    t = node(nt, 'ShaderNodeTexImage', loc); t.image = bpy.data.images.load(path); t.image.colorspace_settings.name = cs; link(nt, m2.outputs['Vector'], t.inputs['Vector']); return t
dif = img(A('rock_diff_2k.jpg'), (-900, 300)); rgh = img(A('rock_rough_2k.jpg'), (-900, 0), 'Non-Color'); nrm = img(A('rock_nor_2k.jpg'), (-900, -300), 'Non-Color')
nmap = node(nt, 'ShaderNodeNormalMap', (-600, -300)); link(nt, nrm.outputs['Color'], nmap.inputs['Color'])
dark = node(nt, 'ShaderNodeHueSaturation', (-600, 300)); dark.inputs['Value'].default_value = 0.3; dark.inputs['Saturation'].default_value = 0.7
link(nt, dif.outputs['Color'], dark.inputs['Color'])
bs = node(nt, 'ShaderNodeBsdfPrincipled', (-200, 200)); link(nt, dark.outputs['Color'], bs.inputs['Base Color']); link(nt, rgh.outputs['Color'], bs.inputs['Roughness']); link(nt, nmap.outputs['Normal'], bs.inputs['Normal'])
# lava: thin Voronoi edges, broken up by noise, glowing orange
m3 = node(nt, 'ShaderNodeMapping', (-1200, -700)); m3.inputs['Scale'].default_value = (0.02, 0.02, 0.02); link(nt, tco.outputs['Object'], m3.inputs['Vector'])
vor = node(nt, 'ShaderNodeTexVoronoi', (-900, -700), feature='DISTANCE_TO_EDGE'); vor.inputs['Scale'].default_value = 3.5; link(nt, m3.outputs['Vector'], vor.inputs['Vector'])
noi = node(nt, 'ShaderNodeTexNoise', (-900, -950)); noi.inputs['Scale'].default_value = 2.0; link(nt, m3.outputs['Vector'], noi.inputs['Vector'])
crk = node(nt, 'ShaderNodeMapRange', (-650, -700), interpolation_type='SMOOTHSTEP'); crk.inputs['From Min'].default_value = 0.018; crk.inputs['From Max'].default_value = 0.0
link(nt, vor.outputs['Distance'], crk.inputs['Value'])
brk = node(nt, 'ShaderNodeMapRange', (-650, -950)); brk.inputs['From Min'].default_value = 0.5; brk.inputs['From Max'].default_value = 0.62; link(nt, noi.outputs['Fac'], brk.inputs['Value'])
lava0 = node(nt, 'ShaderNodeMath', (-450, -800), operation='MULTIPLY'); link(nt, crk.outputs['Result'], lava0.inputs[0]); link(nt, brk.outputs['Result'], lava0.inputs[1])
geo = node(nt, 'ShaderNodeNewGeometry', (-900, -1200)); sz = node(nt, 'ShaderNodeSeparateXYZ', (-700, -1200)); link(nt, geo.outputs['Normal'], sz.inputs['Vector'])
flat = node(nt, 'ShaderNodeMapRange', (-550, -1200), interpolation_type='SMOOTHSTEP'); flat.inputs['From Min'].default_value = 0.93; flat.inputs['From Max'].default_value = 0.99; link(nt, sz.outputs['Z'], flat.inputs['Value'])
big = node(nt, 'ShaderNodeTexNoise', (-900, -1450)); big.inputs['Scale'].default_value = 0.35; big.inputs['Detail'].default_value = 3; link(nt, m3.outputs['Vector'], big.inputs['Vector'])
fld = node(nt, 'ShaderNodeMapRange', (-650, -1450), interpolation_type='SMOOTHSTEP'); fld.inputs['From Min'].default_value = 0.5; fld.inputs['From Max'].default_value = 0.62; link(nt, big.outputs['Fac'], fld.inputs['Value'])
lava1 = node(nt, 'ShaderNodeMath', (-400, -1100), operation='MULTIPLY'); link(nt, flat.outputs['Result'], lava1.inputs[0]); link(nt, fld.outputs['Result'], lava1.inputs[1])
lava = node(nt, 'ShaderNodeMath', (-300, -800), operation='MULTIPLY'); link(nt, lava0.outputs['Value'], lava.inputs[0]); link(nt, lava1.outputs['Value'], lava.inputs[1])
em = node(nt, 'ShaderNodeEmission', (-200, -400)); em.inputs['Color'].default_value = (1.0, 0.22, 0.02, 1); em.inputs['Strength'].default_value = 9
mix = node(nt, 'ShaderNodeMixShader', (100, 0)); link(nt, lava.outputs['Value'], mix.inputs['Fac']); link(nt, bs.outputs['BSDF'], mix.inputs[1]); link(nt, em.outputs['Emission'], mix.inputs[2])
link(nt, mix.outputs['Shader'], node(nt, 'ShaderNodeOutputMaterial', (300, 0)).inputs['Surface']); gnd.data.materials.append(gm)

# ---------- boss ----------
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'out', 'megaboss_cine.glb'))
hull = bpy.data.objects['hull']; root = hull.parent
rig = bpy.data.objects.new('BossRig', None); sc.collection.objects.link(rig); root.parent = rig
for p in hull.data.polygons: p.use_smooth = True
mat = hull.active_material; nt = mat.node_tree; pb = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
base_tex = pb.inputs['Base Color'].links[0].from_node; glow_tex = pb.inputs['Emission Color'].links[0].from_node
# concept paint only on faces that look up (object-space normal Z), plain white hull on steep sides (as in the game)
tcb = node(nt, 'ShaderNodeTexCoord', (-1100, -500)); sep = node(nt, 'ShaderNodeSeparateXYZ', (-900, -500)); link(nt, tcb.outputs['Normal'], sep.inputs['Vector'])
ab = node(nt, 'ShaderNodeMath', (-700, -500), operation='ABSOLUTE'); link(nt, sep.outputs['Z'], ab.inputs[0])
top = node(nt, 'ShaderNodeMapRange', (-500, -500), interpolation_type='SMOOTHSTEP'); top.inputs['From Min'].default_value = 0.2; top.inputs['From Max'].default_value = 0.55; link(nt, ab.outputs['Value'], top.inputs['Value'])
mixc = node(nt, 'ShaderNodeMix', (-250, 200), data_type='RGBA'); mixc.inputs[6].default_value = (0.78, 0.78, 0.8, 1)
link(nt, top.outputs['Result'], mixc.inputs['Factor']); link(nt, base_tex.outputs['Color'], mixc.inputs[7]); link(nt, mixc.outputs[2], pb.inputs['Base Color'])
mixe = node(nt, 'ShaderNodeMix', (-250, -150), data_type='RGBA'); mixe.inputs[6].default_value = (0, 0, 0, 1)
link(nt, top.outputs['Result'], mixe.inputs['Factor']); link(nt, glow_tex.outputs['Color'], mixe.inputs[7]); link(nt, mixe.outputs[2], pb.inputs['Emission Color'])
pb.inputs['Roughness'].default_value = 0.42; pb.inputs['Metallic'].default_value = 0.05
pb.inputs['Coat Weight'].default_value = 0.35; pb.inputs['Coat Roughness'].default_value = 0.08
# glow lines power up as the boss arrives, then pulse
for f, v in ((1, 2.5), (110, 3.0), (150, 14.0), (162, 7.0), (174, 11.0), (186, 7.5), (192, 9.0)):
    pb.inputs['Emission Strength'].default_value = v; pb.inputs['Emission Strength'].keyframe_insert('default_value', frame=f)

# engines: emissive discs + soft flame cones + violet lights at the eng_* anchors (exhaust points +Y in Blender)
fm = bpy.data.materials.new('Flame'); fm.use_nodes = True; nt = fm.node_tree; nt.nodes.clear()
lw = node(nt, 'ShaderNodeLayerWeight', (-700, 0)); lw.inputs['Blend'].default_value = 0.35
inv = node(nt, 'ShaderNodeMath', (-500, 0), operation='SUBTRACT'); inv.inputs[0].default_value = 1.0; link(nt, lw.outputs['Facing'], inv.inputs[1])
fe = node(nt, 'ShaderNodeEmission', (-300, 120)); fe.inputs['Color'].default_value = (0.62, 0.22, 1.0, 1); fe.inputs['Strength'].default_value = 40
tr = node(nt, 'ShaderNodeBsdfTransparent', (-300, -100)); fmx = node(nt, 'ShaderNodeMixShader', (-50, 0))
link(nt, inv.outputs['Value'], fmx.inputs['Fac']); link(nt, tr.outputs['BSDF'], fmx.inputs[1]); link(nt, fe.outputs['Emission'], fmx.inputs[2])
link(nt, fmx.outputs['Shader'], node(nt, 'ShaderNodeOutputMaterial', (150, 0)).inputs['Surface'])
dm = bpy.data.materials.new('EngineCore'); dm.use_nodes = True; e2 = dm.node_tree.nodes['Principled BSDF']
e2.inputs['Emission Color'].default_value = (0.85, 0.6, 1.0, 1); e2.inputs['Emission Strength'].default_value = 60; e2.inputs['Base Color'].default_value = (0, 0, 0, 1)
for e in [o for o in bpy.data.objects if o.name.startswith('eng_')]:
    r = e.get('radius', 1.2)
    bpy.ops.mesh.primitive_cylinder_add(radius=r * 0.82, depth=0.2, vertices=32); d = bpy.context.object; d.parent = e; d.location = (0, 0, 0); d.data.materials.append(dm)
    d.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.mesh.primitive_cone_add(radius1=r * 0.75, radius2=0.05, depth=6.5, vertices=32); c = bpy.context.object; c.parent = e; c.data.materials.append(fm)
    c.rotation_euler = (math.radians(-90), 0, 0); c.location = (0, 3.3, 0)                    # Blender local of the empty: exhaust towards +Y
    c.scale = (1, 1, 1); c.keyframe_insert('scale', frame=1)
    for fc in c.animation_data.action.fcurves:                                                 # flicker
        if fc.data_path == 'scale': m = fc.modifiers.new('NOISE'); m.scale, m.strength, m.phase = 2.5, 0.25, hash(e.name) % 100
    L = bpy.data.objects.new('EngLight_' + e.name, bpy.data.lights.new('EngLight_' + e.name, 'POINT')); sc.collection.objects.link(L); L.parent = e
    L.location = (0, 2.0, 0); L.data.energy, L.data.color, L.data.shadow_soft_size = 9000, (0.6, 0.25, 1.0), 2.0

# ---------- boss motion (Blender: nose = -Y, up = +Z; Euler XYZ = pitch, bank, yaw) ----------
def heading(d): return math.atan2(d[0], -d[1])
P = [(1, (-320, 900, 320), (math.radians(16), math.radians(-8), heading((250, -650)))),
     (70, (-170, 470, 200), (math.radians(14), math.radians(-26), heading((160, -320)))),
     (120, (-18, 150, 78), (math.radians(6), math.radians(-14), math.radians(12))),
     (156, (0, 98, 48), (math.radians(-6), 0, 0)),                                               # braking: nose up a touch
     (192, (2, 92, 48), (math.radians(-2), math.radians(2), math.radians(-2)))]
for f, loc, rot in P:
    rig.location = loc; rig.rotation_euler = Euler(rot, 'XYZ'); rig.keyframe_insert('location', frame=f); rig.keyframe_insert('rotation_euler', frame=f)
for fc in rig.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'; kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
    if fc.data_path == 'location' and fc.array_index == 2:                                      # hover bob at the end
        m = fc.modifiers.new('NOISE'); m.scale, m.strength = 40, 1.2; m.use_restricted_range = True; m.frame_start, m.frame_end, m.blend_in = 150, 192, 10

# ---------- camera: low over the lava, slow push-in, tracking a lagging target ----------
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 28; cam.data.sensor_fit = 'VERTICAL'; cam.data.sensor_height = 36; cam.data.clip_end = 12000
tgt = bpy.data.objects.new('CamTarget', None); sc.collection.objects.link(tgt)
for f, cl, tl in ((1, (60, -120, 40), (-230, 640, 240)), (120, (30, -6, 62), (-14, 148, 74)), (192, (12, 32, 63), (1, 92, 46))):
    cam.location = cl; tgt.location = tl; cam.keyframe_insert('location', frame=f); tgt.keyframe_insert('location', frame=f)
fill = bpy.data.objects.new('Fill', bpy.data.lights.new('Fill', 'AREA')); sc.collection.objects.link(fill); fill.parent = cam
fill.data.size, fill.data.energy, fill.data.color = 40, 85000, (1.0, 0.93, 0.86); fill.location = (-18, 10, 0)
tc_ = cam.constraints.new('TRACK_TO'); tc_.target = tgt; tc_.track_axis = 'TRACK_NEGATIVE_Z'; tc_.up_axis = 'UP_Y'
for fc in tgt.animation_data.action.fcurves:                                                    # subtle hand-held drift
    m = fc.modifiers.new('NOISE'); m.scale, m.strength = 60, 1.5

# ---------- render: Cycles CPU, denoised, motion blur, haze + bloom ----------
r = sc.render; r.engine = 'CYCLES'; cy = sc.cycles; cy.device = 'CPU'
cy.samples = int(opt['samples']); cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.04
cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces, cy.diffuse_bounces, cy.glossy_bounces, cy.transmission_bounces, cy.volume_bounces, cy.transparent_max_bounces = 6, 2, 3, 2, 0, 8
cy.light_sampling_threshold = 0.01
rx, ry = map(int, opt['res'].split('x')); r.resolution_x, r.resolution_y, r.resolution_percentage = rx, ry, 100
r.use_motion_blur = True; r.motion_blur_shutter = 0.45; r.use_persistent_data = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = -0.2
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGB'
vl = sc.view_layers[0]; vl.use_pass_mist = True
sc.use_nodes = True; ct = sc.node_tree; ct.nodes.clear()
rl = node(ct, 'CompositorNodeRLayers', (-600, 0))
haze = node(ct, 'CompositorNodeMixRGB', (-300, 0), blend_type='MIX'); haze.inputs[2].default_value = (0.52, 0.3, 0.24, 1)   # warm dusk haze
hz = node(ct, 'CompositorNodeMath', (-450, -200), operation='MULTIPLY'); hz.inputs[1].default_value = 0.4
link(ct, rl.outputs['Mist'], hz.inputs[0]); link(ct, hz.outputs['Value'], haze.inputs['Fac']); link(ct, rl.outputs['Image'], haze.inputs[1])
gl = node(ct, 'CompositorNodeGlare', (-100, 0)); gl.glare_type = 'FOG_GLOW'; gl.quality = 'HIGH'
try: gl.threshold = 1.2; gl.size = 7
except Exception: pass
link(ct, haze.outputs['Image'], gl.inputs['Image'])
cb = node(ct, 'CompositorNodeColorBalance', (100, 0)); cb.correction_method = 'LIFT_GAMMA_GAIN'
cb.lift = (0.96, 0.98, 1.04); cb.gamma = (1.0, 0.98, 0.97); cb.gain = (1.08, 1.0, 0.92)               # dusk grade: cool shadows, warm highlights
link(ct, gl.outputs['Image'], cb.inputs['Image'])
el = node(ct, 'CompositorNodeEllipseMask', (100, -300)); el.width, el.height = 0.95, 0.8
bl = node(ct, 'CompositorNodeBlur', (300, -300)); bl.size_x = bl.size_y = 180; link(ct, el.outputs['Mask'], bl.inputs['Image'])
vg_ = node(ct, 'CompositorNodeMixRGB', (500, 0), blend_type='MULTIPLY'); vg_.inputs[0].default_value = 0.55
link(ct, cb.outputs['Image'], vg_.inputs[1]); link(ct, bl.outputs['Image'], vg_.inputs[2])
link(ct, vg_.outputs['Image'], node(ct, 'CompositorNodeComposite', (700, 0)).inputs['Image'])

if opt['save']: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(opt['save']))
# ---------- render the requested frames ----------
fr = opt['frames']; frames = list(range(int(fr.split('-')[0]), int(fr.split('-')[1]) + 1)) if '-' in fr else [int(x) for x in fr.split(',')]
os.makedirs(opt['out'], exist_ok=True)
import time
for f in frames:
    if os.path.exists(os.path.join(os.path.abspath(opt['out']), f'{f:04d}.png')) and opt.get('resume', '1') == '1': continue
    t0 = time.time(); sc.frame_set(f); r.filepath = os.path.join(os.path.abspath(opt['out']), f'{f:04d}.png')
    bpy.ops.render.render(write_still=True); print(f'FRAME {f} {time.time() - t0:.1f}s', flush=True)
