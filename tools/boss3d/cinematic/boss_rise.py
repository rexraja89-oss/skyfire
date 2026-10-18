# Skyfire Stage 10 mega-boss: "rise" cinematic (Blender 4.5, Cycles, headless). Rex's storyboard:
#   a mountain ridge at dusk starts to shake -> rubble tumbles down, dust and smoke escalate into the sky -> the boss
#   rises from behind the mountains, dwarfing them -> camera pulls back from close-up until the boss fits the screen.
#   While rising every light blinks (power-up flicker, chase waves along the light lines, wingtip strobes) and the
#   wings flap. Extras: rubble sliding off the boss (it was buried under the range), lightning inside the dust,
#   lava cracks flaring with the quake, engine ignition + light flash + dust shockwave at the end.
# Builds everything from scratch: boss (out/megaboss_cine.glb), CC0 Poly Haven sky HDRI + photo-scanned rock.
# Run (from tools/boss3d):
#   ~/tools/blender-4.5.14-linux-x64/blender -b -P cinematic/boss_rise.py -- --frames 1-264 --samples 32 --out cinematic/rise
#   options: --frames a-b | a,b,c   --samples N   --res 576x1024   --out DIR   --save scene.blend   --resume 0
# Coordinates (Blender): Z up; camera looks along +Y at the ridge; boss nose = -Y (towards camera), up = +Z.
import bpy, math, os, sys, random, time
from mathutils import Vector, Euler, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
opt = {'frames': '1-264', 'samples': '32', 'res': '576x1024', 'out': 'cinematic/rise', 'save': '', 'resume': '1'}
for i in range(0, len(argv) - 1, 2): opt[argv[i].lstrip('-')] = argv[i + 1]
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
A = lambda n: os.path.join(HERE, 'assets', n)
FPS, END = 24, 264
RIDGE_Y, BOSS_Y, S = 140, 330, 12.0           # ridge line, where the boss rises, boss scale (30-unit span -> 360)
random.seed(10)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.fps = FPS; sc.frame_start, sc.frame_end = 1, END

def node(nt, kind, loc=(0, 0), **props):
    n = nt.nodes.new(kind); n.location = loc
    for k, v in props.items(): setattr(n, k, v)
    return n
def link(nt, a, b): nt.links.new(a, b)
def keys(target, path, pts, interp='BEZIER', index=-1):
    """pts: [(frame, value)]; target can be an ID, a socket (default_value) or a pose bone"""
    for f, v in pts:
        setattr(target, path, v); target.keyframe_insert(path, frame=f, index=index)
    return target
def set_interp(idblock, interp):
    ad = idblock.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = interp
def smooth(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)

# ---------- world: CC0 sky HDRI ("Industrial Sunset (Pure Sky)", Poly Haven) ----------
w = bpy.data.worlds.new('Sky'); sc.world = w; w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
tc = node(nt, 'ShaderNodeTexCoord', (-900, 0)); mp = node(nt, 'ShaderNodeMapping', (-700, 0)); mp.inputs['Rotation'].default_value = (0, 0, math.radians(165))
env = node(nt, 'ShaderNodeTexEnvironment', (-500, 0)); env.image = bpy.data.images.load(A('sky_2k.hdr'))
bg = node(nt, 'ShaderNodeBackground', (-200, 0)); bg.inputs['Strength'].default_value = 0.7
link(nt, tc.outputs['Generated'], mp.inputs['Vector']); link(nt, mp.outputs['Vector'], env.inputs['Vector'])
link(nt, env.outputs['Color'], bg.inputs['Color']); link(nt, bg.outputs['Background'], node(nt, 'ShaderNodeOutputWorld', (0, 0)).inputs['Surface'])
w.mist_settings.start, w.mist_settings.depth, w.mist_settings.falloff = 150, 3200, 'QUADRATIC'
sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN')); sc.collection.objects.link(sun)
sun.data.energy, sun.data.angle, sun.data.color = 4.2, math.radians(1.5), (1.0, 0.72, 0.5)
sun.rotation_euler = Euler((math.radians(68), 0, math.radians(28)), 'XYZ')      # low warm key from the camera side: rakes the ridge face

# ---------- rock material (aerial_rocks_02, CC0), object-space projection so any mesh can use it ----------
def rock_material(name, tile, lava=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    tco = node(nt, 'ShaderNodeTexCoord', (-1400, 0)); mp_ = node(nt, 'ShaderNodeMapping', (-1200, 0)); mp_.inputs['Scale'].default_value = (1 / tile,) * 3
    link(nt, tco.outputs['Object'], mp_.inputs['Vector'])
    def img(path, loc, cs='sRGB'):
        t = node(nt, 'ShaderNodeTexImage', loc, projection='BOX', projection_blend=0.3); t.image = bpy.data.images.get(os.path.basename(path)) or bpy.data.images.load(path)
        t.image.colorspace_settings.name = cs; link(nt, mp_.outputs['Vector'], t.inputs['Vector']); return t
    dif = img(A('rock_diff_2k.jpg'), (-900, 300)); rgh = img(A('rock_rough_2k.jpg'), (-900, 0), 'Non-Color'); nrm = img(A('rock_nor_2k.jpg'), (-900, -300), 'Non-Color')
    nmap = node(nt, 'ShaderNodeNormalMap', (-600, -300)); link(nt, nrm.outputs['Color'], nmap.inputs['Color'])
    dark = node(nt, 'ShaderNodeHueSaturation', (-600, 300)); dark.inputs['Value'].default_value = 0.32; dark.inputs['Saturation'].default_value = 0.7; link(nt, dif.outputs['Color'], dark.inputs['Color'])
    bs = node(nt, 'ShaderNodeBsdfPrincipled', (-200, 200)); link(nt, dark.outputs['Color'], bs.inputs['Base Color']); link(nt, rgh.outputs['Color'], bs.inputs['Roughness']); link(nt, nmap.outputs['Normal'], bs.inputs['Normal'])
    out = node(nt, 'ShaderNodeOutputMaterial', (400, 0))
    if not lava: link(nt, bs.outputs['BSDF'], out.inputs['Surface']); return m, None
    # lava cracks on flat ground: thin Voronoi edges x noise breakup x flatness x large-field mask
    m3 = node(nt, 'ShaderNodeMapping', (-1200, -700)); m3.inputs['Scale'].default_value = (0.03,) * 3; link(nt, tco.outputs['Object'], m3.inputs['Vector'])
    vor = node(nt, 'ShaderNodeTexVoronoi', (-900, -700), feature='DISTANCE_TO_EDGE'); vor.inputs['Scale'].default_value = 3.5; link(nt, m3.outputs['Vector'], vor.inputs['Vector'])
    noi = node(nt, 'ShaderNodeTexNoise', (-900, -950)); noi.inputs['Scale'].default_value = 2.0; link(nt, m3.outputs['Vector'], noi.inputs['Vector'])
    crk = node(nt, 'ShaderNodeMapRange', (-650, -700), interpolation_type='SMOOTHSTEP'); crk.inputs['From Min'].default_value = 0.02; crk.inputs['From Max'].default_value = 0.0; link(nt, vor.outputs['Distance'], crk.inputs['Value'])
    brk = node(nt, 'ShaderNodeMapRange', (-650, -950)); brk.inputs['From Min'].default_value = 0.48; brk.inputs['From Max'].default_value = 0.6; link(nt, noi.outputs['Fac'], brk.inputs['Value'])
    geo = node(nt, 'ShaderNodeNewGeometry', (-900, -1200)); sz = node(nt, 'ShaderNodeSeparateXYZ', (-700, -1200)); link(nt, geo.outputs['Normal'], sz.inputs['Vector'])
    flat = node(nt, 'ShaderNodeMapRange', (-550, -1200), interpolation_type='SMOOTHSTEP'); flat.inputs['From Min'].default_value = 0.92; flat.inputs['From Max'].default_value = 0.99; link(nt, sz.outputs['Z'], flat.inputs['Value'])
    l0 = node(nt, 'ShaderNodeMath', (-450, -800), operation='MULTIPLY'); link(nt, crk.outputs['Result'], l0.inputs[0]); link(nt, brk.outputs['Result'], l0.inputs[1])
    l1 = node(nt, 'ShaderNodeMath', (-300, -900), operation='MULTIPLY'); link(nt, l0.outputs['Value'], l1.inputs[0]); link(nt, flat.outputs['Result'], l1.inputs[1])
    em = node(nt, 'ShaderNodeEmission', (-200, -400)); em.inputs['Color'].default_value = (1.0, 0.22, 0.02, 1); em.inputs['Strength'].default_value = lava
    mix = node(nt, 'ShaderNodeMixShader', (100, 0)); link(nt, l1.outputs['Value'], mix.inputs['Fac']); link(nt, bs.outputs['BSDF'], mix.inputs[1]); link(nt, em.outputs['Emission'], mix.inputs[2])
    link(nt, mix.outputs['Shader'], out.inputs['Surface']); return m, em

# ---------- ground: flat volcanic plain near the action, mountain ranges far away ----------
bpy.ops.mesh.primitive_grid_add(x_subdivisions=500, y_subdivisions=500, size=7000, location=(0, 1500, 0)); gnd = bpy.context.object; gnd.name = 'Ground'
vg = gnd.vertex_groups.new(name='far')
for v in gnd.data.vertices:
    wy = v.co.y + 1500; rr = math.hypot(v.co.x * 0.8, wy - 450)
    t = smooth((rr - 700) / 1500) if wy > 200 else 0.0; vg.add([v.index], t, 'REPLACE')
d1 = gnd.modifiers.new('ranges', 'DISPLACE'); t1 = bpy.data.textures.new('ranges', 'CLOUDS'); t1.noise_scale = 600; t1.noise_depth = 4
d1.texture = t1; d1.strength = 1100; d1.mid_level = 0.35; d1.vertex_group = 'far'
d3 = gnd.modifiers.new('bumps', 'DISPLACE'); t3 = bpy.data.textures.new('bumps', 'CLOUDS'); t3.noise_scale = 40; d3.texture = t3; d3.strength = 4
bpy.ops.object.shade_smooth()
gmat, lava_em = rock_material('Volcanic', 24, lava=9); gnd.data.materials.append(gmat)
keys(lava_em.inputs['Strength'], 'default_value', [(1, 6), (60, 9), (130, 22), (200, 30), (264, 18)])     # cracks flare with the quake

# ---------- the ridge in front of the camera: a jagged range the boss will dwarf ----------
bpy.ops.mesh.primitive_grid_add(x_subdivisions=360, y_subdivisions=120, size=1, location=(0, RIDGE_Y, 0)); rg = bpy.context.object; rg.name = 'Ridge'
rg.scale = (900, 260, 1); bpy.ops.object.transform_apply(scale=True)
noise_t = bpy.data.textures.new('rnoise', 'CLOUDS'); noise_t.noise_scale = 0.9
for v in rg.data.vertices:
    x, y = v.co.x, v.co.y
    peaks = 70 + 28 * math.sin(x * 0.018 + 1.1) + 22 * math.sin(x * 0.047 + 0.3) + 12 * math.sin(x * 0.11)    # crest height along the ridge
    prof = math.exp(-(y / 70) ** 2)                                                                          # cross-section
    v.co.z = max(0, peaks * prof - 4)
d = rg.modifiers.new('crag', 'DISPLACE'); tt = bpy.data.textures.new('crag', 'CLOUDS'); tt.noise_scale = 18; tt.noise_depth = 5; d.texture = tt; d.strength = 16; d.mid_level = 0.4
d2_ = rg.modifiers.new('grit', 'DISPLACE'); tg = bpy.data.textures.new('grit', 'CLOUDS'); tg.noise_scale = 4; d2_.texture = tg; d2_.strength = 2.5
bpy.ops.object.shade_smooth(); rmat, _ = rock_material('RidgeRock', 22); rg.data.materials.append(rmat)
# camera-side upper slopes emit the falling rubble
rv = rg.vertex_groups.new(name='slope')
for v in rg.data.vertices:
    if v.co.z > 25 and v.co.y < 10 and abs(v.co.x) < 140: rv.add([v.index], 1.0, 'REPLACE')   # inside the frame

# ---------- rubble: a few displaced rock meshes instanced by particles ----------
rocks = bpy.data.collections.new('Rocks'); sc.collection.children.link(rocks)
pmat, _ = rock_material('RubbleRock', 3)
for i in range(5):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1, location=(0, 0, -5000 - i * 10)); r_ = bpy.context.object; r_.name = f'rock{i}'
    r_.scale = (1, 0.6 + random.random() * 0.5, 0.5 + random.random() * 0.4)
    m_ = r_.modifiers.new('d', 'DISPLACE'); t_ = bpy.data.textures.new(f'rk{i}', 'CLOUDS'); t_.noise_scale = 0.6 + random.random() * 0.5; m_.texture = t_; m_.strength = 0.5
    r_.data.materials.append(pmat); bpy.ops.object.shade_flat()
    for c in r_.users_collection: c.objects.unlink(r_)
    rocks.objects.link(r_)
def rubble(obj, name, start, end, count, size, rnd_size=0.7, vel=(0, 0), group='', seed=1, rot=True, objvel=0.0):
    ps_mod = obj.modifiers.new(name, 'PARTICLE_SYSTEM'); ps = ps_mod.particle_system; st = ps.settings; ps.seed = seed
    st.count, st.frame_start, st.frame_end, st.lifetime, st.lifetime_random = count, start, end, 90, 0.4
    st.emit_from = 'FACE'; st.use_emit_random = True; st.normal_factor, st.factor_random = vel; st.object_factor = objvel
    st.render_type = 'COLLECTION'; st.instance_collection = rocks; st.use_collection_pick_random = True
    st.particle_size, st.size_random = size, rnd_size; st.use_rotations = rot; st.rotation_mode = 'NONE'; st.rotation_factor_random = 1.0
    st.use_dynamic_rotation = True; st.angular_velocity_mode = 'RAND'; st.angular_velocity_factor = 3.0
    if group: ps.vertex_group_density = group
    st.display_method = 'NONE' if obj.name == 'hull' else 'RENDER'
    return ps
rubble(rg, 'trickle', 20, 120, 500, 3.5, vel=(1.5, 3), group='slope', seed=3)            # first stones loosen
rubble(rg, 'landslide', 110, 230, 2600, 5.0, vel=(3, 6), group='slope', seed=7)          # the quake peaks
sc.gravity = (0, 0, -24)                                                                   # scene scale: ~2.5x real, reads heavier

# ---------- boss ----------
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, 'out', 'megaboss_cine.glb'))
hull = bpy.data.objects['hull']; root = hull.parent
rig = bpy.data.objects.new('BossRig', None); sc.collection.objects.link(rig); root.parent = rig; rig.scale = (S, S, S)
for p in hull.data.polygons: p.use_smooth = True
mat = hull.active_material; nt = mat.node_tree; pb = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
base_tex = pb.inputs['Base Color'].links[0].from_node; glow_tex = pb.inputs['Emission Color'].links[0].from_node
tcb = node(nt, 'ShaderNodeTexCoord', (-1300, -500)); sep = node(nt, 'ShaderNodeSeparateXYZ', (-1100, -500)); link(nt, tcb.outputs['Normal'], sep.inputs['Vector'])
ab = node(nt, 'ShaderNodeMath', (-900, -500), operation='ABSOLUTE'); link(nt, sep.outputs['Z'], ab.inputs[0])
top = node(nt, 'ShaderNodeMapRange', (-700, -500), interpolation_type='SMOOTHSTEP'); top.inputs['From Min'].default_value = 0.2; top.inputs['From Max'].default_value = 0.55; link(nt, ab.outputs['Value'], top.inputs['Value'])
mixc = node(nt, 'ShaderNodeMix', (-250, 200), data_type='RGBA'); mixc.inputs[6].default_value = (0.78, 0.78, 0.8, 1)
link(nt, top.outputs['Result'], mixc.inputs['Factor']); link(nt, base_tex.outputs['Color'], mixc.inputs[7]); link(nt, mixc.outputs[2], pb.inputs['Base Color'])
# light lines: concept glow x chase wave running nose -> tail (object Y) x power-up envelope (keyed on Emission Strength)
clock = node(nt, 'ShaderNodeValue', (-1300, -900)); clock.label = 'frame'; keys(clock.outputs[0], 'default_value', [(1, 1.0), (END, float(END))]); set_interp(mat.node_tree, 'LINEAR')
ob = node(nt, 'ShaderNodeSeparateXYZ', (-1100, -750)); link(nt, tcb.outputs['Object'], ob.inputs['Vector'])
ph = node(nt, 'ShaderNodeMath', (-900, -800), operation='MULTIPLY_ADD'); ph.inputs[1].default_value = 0.55; link(nt, ob.outputs['Y'], ph.inputs[0])
tm = node(nt, 'ShaderNodeMath', (-1100, -950), operation='MULTIPLY'); tm.inputs[1].default_value = -0.42; link(nt, clock.outputs[0], tm.inputs[0]); link(nt, tm.outputs['Value'], ph.inputs[2])
sn = node(nt, 'ShaderNodeMath', (-700, -800), operation='SINE'); link(nt, ph.outputs['Value'], sn.inputs[0])
wave = node(nt, 'ShaderNodeMapRange', (-500, -800)); wave.inputs['From Min'].default_value = -1; wave.inputs['From Max'].default_value = 1; wave.inputs['To Min'].default_value = 0.0; wave.inputs['To Max'].default_value = 1.0; link(nt, sn.outputs['Value'], wave.inputs['Value'])
pw = node(nt, 'ShaderNodeMath', (-350, -800), operation='POWER'); pw.inputs[1].default_value = 4; link(nt, wave.outputs['Result'], pw.inputs[0])
ch = node(nt, 'ShaderNodeMath', (-200, -800), operation='MULTIPLY_ADD'); ch.inputs[1].default_value = 1.6; ch.inputs[2].default_value = 0.45; link(nt, pw.outputs['Value'], ch.inputs[0])
mixe = node(nt, 'ShaderNodeMix', (-250, -150), data_type='RGBA'); mixe.inputs[6].default_value = (0, 0, 0, 1)
link(nt, top.outputs['Result'], mixe.inputs['Factor']); link(nt, glow_tex.outputs['Color'], mixe.inputs[7])
gsc = node(nt, 'ShaderNodeVectorMath', (-50, -300), operation='SCALE'); link(nt, mixe.outputs[2], gsc.inputs[0]); link(nt, ch.outputs['Value'], gsc.inputs['Scale']); link(nt, gsc.outputs['Vector'], pb.inputs['Emission Color'])
pb.inputs['Roughness'].default_value = 0.4; pb.inputs['Metallic'].default_value = 0.05; pb.inputs['Coat Weight'].default_value = 0.35; pb.inputs['Coat Roughness'].default_value = 0.08
# power-up: dark while buried, stuttering flicker as it breaks out, steady with chase, flash at ignition
keys(pb.inputs['Emission Strength'], 'default_value', [(1, 0.0), (128, 0.0), (132, 6.0), (134, 0.3), (139, 9.0), (141, 1.0), (146, 12.0), (149, 2.0), (156, 10.0), (200, 9.0),
                                                       (214, 26.0), (220, 11.0), (264, 10.0)])
EPATH = pb.inputs['Emission Strength'].path_from_id() + '.default_value'
for fc in mat.node_tree.animation_data.action.fcurves:
    if fc.data_path == EPATH:
        for kp in fc.keyframe_points:
            if 128 <= kp.co[0] <= 156: kp.interpolation = 'CONSTANT'

# wing flap: armature with body + two wing bones (root of each wing at |x| ~ 6.5 game units), smooth weights
arm = bpy.data.armatures.new('BossArm'); ao = bpy.data.objects.new('BossArm', arm); sc.collection.objects.link(ao); ao.parent = root
bpy.context.view_layer.objects.active = ao; bpy.ops.object.mode_set(mode='EDIT')
hz = sum(v.co.z for v in hull.data.vertices) / len(hull.data.vertices)
print('hull local matrix', [round(x, 3) for row in hull.matrix_local for x in row], flush=True)
b0 = arm.edit_bones.new('body'); b0.head, b0.tail = (0, 2, hz), (0, -2, hz)
for side, nm in ((1, 'wing_L'), (-1, 'wing_R')):
    b = arm.edit_bones.new(nm); b.head, b.tail = (side * 6.6, 0, hz), (side * 14.5, 0, hz); b.roll = 0; b.parent = b0
bpy.ops.object.mode_set(mode='OBJECT')
for nm in ('body', 'wing_L', 'wing_R'): hull.vertex_groups.new(name=nm)
for v in hull.data.vertices:
    x = v.co.x; wl = smooth((x - 6.8) / 3.6); wr = smooth((-x - 6.8) / 3.6)
    hull.vertex_groups['wing_L'].add([v.index], wl, 'REPLACE'); hull.vertex_groups['wing_R'].add([v.index], wr, 'REPLACE'); hull.vertex_groups['body'].add([v.index], 1 - wl - wr, 'REPLACE')
am = hull.modifiers.new('flap', 'ARMATURE'); am.object = ao
FLAP = [(1, 0), (150, 0), (164, -9), (180, 15), (196, -7), (212, 12), (226, -4), (240, 8), (264, 4)]     # degrees, + = tips up
for nm in ('wing_L', 'wing_R'):
    pbn = ao.pose.bones[nm]; pbn.rotation_mode = 'XYZ'
    keys(pbn, 'rotation_euler', [(f, Euler((math.radians(a), 0, 0))) for f, a in FLAP])
# wingtip / fin strobes (red port, violet starboard, white tail) at mesh extremes, parented to their bone
co = [v.co for v in hull.data.vertices]
def extreme(sel, key_): pts = [c for c in co if sel(c)]; return max(pts, key=key_) if pts else None
nav = [('wing_L', extreme(lambda c: True, lambda c: c.x), (1.0, 0.08, 0.1)), ('wing_R', extreme(lambda c: True, lambda c: -c.x), (0.62, 0.2, 1.0)),
       ('body', extreme(lambda c: c.y > 10 and c.x > 3, lambda c: c.z), (1, 1, 1)), ('body', extreme(lambda c: c.y > 10 and c.x < -3, lambda c: c.z), (1, 1, 1)),
       ('body', extreme(lambda c: abs(c.x) < 1.5, lambda c: -c.y), (1.0, 0.1, 0.15))]
for i, (bn, p, colr) in enumerate(nav):
    if p is None: continue
    nm_ = bpy.data.materials.new(f'Strobe{i}'); nm_.use_nodes = True; e = nm_.node_tree.nodes['Principled BSDF']; e.inputs['Base Color'].default_value = (0, 0, 0, 1); e.inputs['Emission Color'].default_value = (*colr, 1)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.28, segments=12, ring_count=8, location=p); s_ = bpy.context.object; s_.data.materials.append(nm_)
    bpy.context.view_layer.update(); want = root.matrix_world @ Matrix.Translation(p)      # where the strobe sits on the hull, in world space
    s_.parent = ao; s_.parent_type = 'BONE'; s_.parent_bone = bn; bpy.context.view_layer.update(); s_.matrix_world = want   # follows its wing bone from here on
    pts = [(1, 0.0)]
    for f in range(140 + i * 3, END, 24):                                                      # double blink every second
        pts += [(f, 0.0), (f + 1, 220.0), (f + 3, 0.0), (f + 6, 220.0), (f + 8, 0.0)]
    keys(e.inputs['Emission Strength'], 'default_value', pts); set_interp(nm_.node_tree, 'CONSTANT')

# engines: emissive discs + flame cones (ignite at the end) + violet lights at the eng_* anchors (exhaust towards +Y)
fm = bpy.data.materials.new('Flame'); fm.use_nodes = True; nt = fm.node_tree; nt.nodes.clear()
lw = node(nt, 'ShaderNodeLayerWeight', (-700, 0)); lw.inputs['Blend'].default_value = 0.35
inv = node(nt, 'ShaderNodeMath', (-500, 0), operation='SUBTRACT'); inv.inputs[0].default_value = 1.0; link(nt, lw.outputs['Facing'], inv.inputs[1])
fe = node(nt, 'ShaderNodeEmission', (-300, 120)); fe.inputs['Color'].default_value = (0.62, 0.22, 1.0, 1)
keys(fe.inputs['Strength'], 'default_value', [(1, 0), (150, 0), (170, 12), (208, 12), (214, 90), (230, 45), (264, 40)])
tr = node(nt, 'ShaderNodeBsdfTransparent', (-300, -100)); fmx = node(nt, 'ShaderNodeMixShader', (-50, 0))
link(nt, inv.outputs['Value'], fmx.inputs['Fac']); link(nt, tr.outputs['BSDF'], fmx.inputs[1]); link(nt, fe.outputs['Emission'], fmx.inputs[2])
link(nt, fmx.outputs['Shader'], node(nt, 'ShaderNodeOutputMaterial', (150, 0)).inputs['Surface'])
dm = bpy.data.materials.new('EngineCore'); dm.use_nodes = True; e2 = dm.node_tree.nodes['Principled BSDF']
e2.inputs['Emission Color'].default_value = (0.85, 0.6, 1.0, 1); e2.inputs['Base Color'].default_value = (0, 0, 0, 1)
keys(e2.inputs['Emission Strength'], 'default_value', [(1, 0), (140, 0), (160, 25), (210, 25), (214, 120), (264, 60)])
for e in [o for o in bpy.data.objects if o.name.startswith('eng_')]:
    r = e.get('radius', 1.2)
    bpy.ops.mesh.primitive_cylinder_add(radius=r * 0.82, depth=0.2, vertices=32); d = bpy.context.object; d.parent = e; d.location = (0, 0, 0); d.data.materials.append(dm); d.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.mesh.primitive_cone_add(radius1=r * 0.75, radius2=0.05, depth=6.5, vertices=32); c = bpy.context.object; c.parent = e; c.data.materials.append(fm)
    c.rotation_euler = (math.radians(-90), 0, 0); c.location = (0, 3.3, 0)
    keys(c, 'scale', [(1, (0.6, 0.6, 0.4)), (208, (0.7, 0.7, 0.6)), (216, (1.2, 1.2, 2.4)), (264, (1, 1, 1.7))])
    for fc in c.animation_data.action.fcurves:
        m = fc.modifiers.new('NOISE'); m.scale, m.strength, m.phase = 2.5, 0.2, sum(map(ord, e.name)) % 100   # deterministic across render runs
    L = bpy.data.objects.new('EngLight_' + e.name, bpy.data.lights.new('EngLight_' + e.name, 'POINT')); sc.collection.objects.link(L); L.parent = e
    L.location = (0, 2.5, 0); L.data.color, L.data.shadow_soft_size = (0.6, 0.25, 1.0), 2.0
    keys(L.data, 'energy', [(1, 0), (150, 0), (170, 4e5), (210, 4e5), (214, 2e6), (264, 9e5)])

# rubble sliding off the boss as it breaks out of the range (falls behind it; emitter velocity not inherited)
rubble(hull, 'shedding', 120, 205, 1400, 0.16, rnd_size=0.8, vel=(0.4, 0.8), seed=11)

# ---------- boss motion: rises nose-up from behind the ridge, levels out, wings spread ----------
P = [(1, (0, BOSS_Y, -360), (-72, 0, 0)), (110, (0, BOSS_Y, -230), (-70, 0, 0)), (150, (6, BOSS_Y, 40), (-60, 3, -2)),
     (200, (-4, BOSS_Y, 230), (-38, -4, 3)), (236, (0, BOSS_Y - 20, 300), (-6, 2, 0)), (264, (0, BOSS_Y - 30, 312), (4, 0, 0))]   # ends nose slightly down: lit top towards the camera
for f, loc, rot in P:
    rig.location = loc; rig.rotation_euler = Euler([math.radians(a) for a in rot], 'XYZ'); rig.keyframe_insert('location', frame=f); rig.keyframe_insert('rotation_euler', frame=f)
for fc in rig.animation_data.action.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'; kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
# glow behind the ridge before it appears (its underside lights through the dust) + lightning inside the dust
gl = bpy.data.objects.new('RiseGlow', bpy.data.lights.new('RiseGlow', 'POINT')); sc.collection.objects.link(gl); gl.location = (0, BOSS_Y - 40, 60)
gl.data.color, gl.data.shadow_soft_size = (0.65, 0.25, 1.0), 40
keys(gl.data, 'energy', [(1, 0), (70, 0), (120, 3.5e7), (145, 4e7), (175, 6e6), (220, 0)])
for i, (f, x, z) in enumerate(((96, -140, 120), (118, 120, 170), (127, -40, 210), (182, 160, 260))):
    lt = bpy.data.objects.new(f'Lightning{i}', bpy.data.lights.new(f'Lightning{i}', 'POINT')); sc.collection.objects.link(lt); lt.location = (x, BOSS_Y - 60, z)
    lt.data.color, lt.data.shadow_soft_size = (0.8, 0.7, 1.0), 25
    keys(lt.data, 'energy', [(1, 0), (f - 1, 0), (f, 6e7), (f + 1, 1e7), (f + 2, 5e7), (f + 4, 0)]); set_interp(lt.data, 'CONSTANT')

# ---------- dust and smoke: procedural volumes that billow and climb ----------
def dust(name, loc0, loc1, sc0, sc1, f0, f1, dens, color=(0.42, 0.36, 0.31), seed=0.0, end=0.35):   # end: share of the peak density left at f1 (dust settles)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=loc0); o = bpy.context.object; o.name = name
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    tco = node(nt, 'ShaderNodeTexCoord', (-1200, 0)); clk = node(nt, 'ShaderNodeValue', (-1200, -300)); keys(clk.outputs[0], 'default_value', [(1, 1.0), (END, float(END))])
    w_ = node(nt, 'ShaderNodeMath', (-1000, -300), operation='MULTIPLY_ADD'); w_.inputs[1].default_value = 0.012; w_.inputs[2].default_value = seed; link(nt, clk.outputs[0], w_.inputs[0])
    nz = node(nt, 'ShaderNodeTexNoise', (-800, 0), noise_dimensions='4D'); nz.inputs['Scale'].default_value = 2.2; nz.inputs['Detail'].default_value = 6; nz.inputs['Roughness'].default_value = 0.6
    link(nt, tco.outputs['Object'], nz.inputs['Vector']); link(nt, w_.outputs['Value'], nz.inputs['W'])
    ln = node(nt, 'ShaderNodeVectorMath', (-800, 300), operation='LENGTH'); link(nt, tco.outputs['Object'], ln.inputs[0])
    fall = node(nt, 'ShaderNodeMapRange', (-600, 300), interpolation_type='SMOOTHSTEP'); fall.inputs['From Min'].default_value = 1.0; fall.inputs['From Max'].default_value = 0.35; link(nt, ln.outputs['Value'], fall.inputs['Value'])
    cl = node(nt, 'ShaderNodeMapRange', (-600, 0), interpolation_type='SMOOTHSTEP'); cl.inputs['From Min'].default_value = 0.42; cl.inputs['From Max'].default_value = 0.72; link(nt, nz.outputs['Fac'], cl.inputs['Value'])
    mul = node(nt, 'ShaderNodeMath', (-400, 100), operation='MULTIPLY'); link(nt, fall.outputs['Result'], mul.inputs[0]); link(nt, cl.outputs['Result'], mul.inputs[1])
    dk = node(nt, 'ShaderNodeMath', (-250, 100), operation='MULTIPLY'); link(nt, mul.outputs['Value'], dk.inputs[0])
    keys(dk.inputs[1], 'default_value', [(1, 0.0), (f0, 0.0), (f0 + (f1 - f0) * 0.35, dens), (f1, dens * end)])
    vol = node(nt, 'ShaderNodeVolumePrincipled', (-50, 0)); vol.inputs['Color'].default_value = (*color, 1); vol.inputs['Anisotropy'].default_value = 0.35
    link(nt, dk.outputs['Value'], vol.inputs['Density']); link(nt, vol.outputs['Volume'], node(nt, 'ShaderNodeOutputMaterial', (200, 0)).inputs['Volume'])
    o.data.materials.append(m); set_interp(nt, 'LINEAR')
    keys(o, 'location', [(1, loc0), (f0, loc0), (f1, loc1)]); keys(o, 'scale', [(1, sc0), (f0, sc0), (f1, sc1)])
    return o
dust('DustL', (-70, RIDGE_Y + 90, 30), (-95, RIDGE_Y + 110, 150), (110, 70, 50), (200, 120, 230), 60, 264, 0.14, seed=1.3)
dust('DustR', (75, RIDGE_Y + 100, 30), (100, RIDGE_Y + 120, 160), (110, 70, 50), (200, 120, 240), 75, 264, 0.14, seed=4.1)
dust('DustC', (0, BOSS_Y - 30, 20), (0, BOSS_Y - 10, 190), (170, 110, 80), (330, 170, 280), 100, 264, 0.06, seed=7.7)
dust('DustFront', (0, RIDGE_Y - 40, 8), (0, RIDGE_Y - 60, 30), (230, 40, 16), (330, 80, 60), 35, 264, 0.08, color=(0.4, 0.34, 0.29), seed=2.2)
dust('Shockwave', (0, BOSS_Y - 60, 10), (0, BOSS_Y - 90, 14), (40, 40, 8), (650, 520, 26), 210, 264, 0.035, color=(0.45, 0.38, 0.33), seed=9.9, end=0.8)

# ---------- camera: close on the ridge, quake shake, pulls back + up until the boss fits ----------
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.sensor_fit = 'VERTICAL'; cam.data.sensor_height = 36; cam.data.clip_end = 15000
keys(cam.data, 'lens', [(1, 40), (120, 32), (210, 22), (264, 22)])
tgt = bpy.data.objects.new('CamTarget', None); sc.collection.objects.link(tgt)
shake = bpy.data.objects.new('Shake', None); sc.collection.objects.link(shake); cam.parent = shake
CP = [(1, (14, -110, 26), (0, RIDGE_Y, 70)), (110, (6, -125, 30), (0, RIDGE_Y + 60, 100)), (150, (0, -135, 46), (0, BOSS_Y, 170)),
      (210, (0, -150, 110), (0, BOSS_Y, 255)), (264, (0, -120, 160), (0, BOSS_Y - 25, 290))]
for f, cl_, tl in CP:
    shake.location = cl_; tgt.location = tl; shake.keyframe_insert('location', frame=f); tgt.keyframe_insert('location', frame=f)
tcon = cam.constraints.new('TRACK_TO'); tcon.target = tgt; tcon.track_axis = 'TRACK_NEGATIVE_Z'; tcon.up_axis = 'UP_Y'
# quake: smooth random shake (sum of sines, fixed phases), envelope rises with the quake, peaks as the boss breaks out
ph_ = [random.random() * 6.28 for _ in range(9)]
def env_(f): return 0.15 * smooth((f - 15) / 60) + 0.6 * smooth((f - 90) / 50) - 0.45 * smooth((f - 200) / 50) + 0.5 * math.exp(-((f - 214) / 5) ** 2)
for f in range(1, END + 1):
    t = f / FPS; e = env_(f)
    cam.location = (e * (0.9 * math.sin(t * 23 + ph_[0]) + 0.5 * math.sin(t * 41 + ph_[1])), e * 0.3 * math.sin(t * 17 + ph_[2]),
                    e * (0.8 * math.sin(t * 29 + ph_[3]) + 0.4 * math.sin(t * 53 + ph_[4])))
    cam.keyframe_insert('location', frame=f)
fill = bpy.data.objects.new('Fill', bpy.data.lights.new('Fill', 'AREA')); sc.collection.objects.link(fill); fill.parent = shake
fill.data.size, fill.data.color = 80, (1.0, 0.92, 0.85); fill.location = (-60, 20, 40)
keys(fill.data, 'energy', [(1, 3e5), (140, 6e5), (264, 1.4e6)])

# ---------- render: Cycles CPU, denoised, motion blur, haze + bloom + grade ----------
r = sc.render; r.engine = 'CYCLES'; cy = sc.cycles; cy.device = 'CPU'
cy.samples = int(opt['samples']); cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.05
cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'
cy.max_bounces, cy.diffuse_bounces, cy.glossy_bounces, cy.transmission_bounces, cy.volume_bounces, cy.transparent_max_bounces = 6, 2, 3, 2, 0, 8
cy.volume_step_rate = 4.0; cy.volume_max_steps = 96; cy.light_sampling_threshold = 0.01
rx, ry = map(int, opt['res'].split('x')); r.resolution_x, r.resolution_y, r.resolution_percentage = rx, ry, 100
r.use_motion_blur = True; r.motion_blur_shutter = 0.4; r.use_persistent_data = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = 0.25
r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGB'
vl = sc.view_layers[0]; vl.use_pass_mist = True
sc.use_nodes = True; ct = sc.node_tree; ct.nodes.clear()
rl = node(ct, 'CompositorNodeRLayers', (-600, 0))
haze = node(ct, 'CompositorNodeMixRGB', (-300, 0), blend_type='MIX'); haze.inputs[2].default_value = (0.5, 0.31, 0.25, 1)
hzm = node(ct, 'CompositorNodeMath', (-450, -200), operation='MULTIPLY'); hzm.inputs[1].default_value = 0.45
link(ct, rl.outputs['Mist'], hzm.inputs[0]); link(ct, hzm.outputs['Value'], haze.inputs['Fac']); link(ct, rl.outputs['Image'], haze.inputs[1])
gla = node(ct, 'CompositorNodeGlare', (-100, 0)); gla.glare_type = 'FOG_GLOW'; gla.quality = 'HIGH'
try: gla.threshold = 1.1; gla.size = 8
except Exception: pass
link(ct, haze.outputs['Image'], gla.inputs['Image'])
cb = node(ct, 'CompositorNodeColorBalance', (100, 0)); cb.correction_method = 'LIFT_GAMMA_GAIN'
cb.lift = (0.96, 0.98, 1.05); cb.gamma = (1.0, 0.98, 0.97); cb.gain = (1.08, 1.0, 0.92); link(ct, gla.outputs['Image'], cb.inputs['Image'])
el = node(ct, 'CompositorNodeEllipseMask', (100, -300)); el.width, el.height = 0.95, 0.8
bl = node(ct, 'CompositorNodeBlur', (300, -300)); bl.size_x = bl.size_y = 180; link(ct, el.outputs['Mask'], bl.inputs['Image'])
vgn = node(ct, 'CompositorNodeMixRGB', (500, 0), blend_type='MULTIPLY'); vgn.inputs[0].default_value = 0.55
link(ct, cb.outputs['Image'], vgn.inputs[1]); link(ct, bl.outputs['Image'], vgn.inputs[2])
link(ct, vgn.outputs['Image'], node(ct, 'CompositorNodeComposite', (700, 0)).inputs['Image'])

if opt['save']: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(opt['save']))
# ---------- render: step through every frame in order (particles simulate sequentially), render the requested ones ----------
fr = opt['frames']; frames = list(range(int(fr.split('-')[0]), int(fr.split('-')[1]) + 1)) if '-' in fr else [int(x) for x in fr.split(',')]
outdir = os.path.abspath(opt['out']); os.makedirs(outdir, exist_ok=True)
for f in range(1, max(frames) + 1):
    sc.frame_set(f)
    if f not in frames: continue
    path = os.path.join(outdir, f'{f:04d}.png')
    if os.path.exists(path) and opt['resume'] == '1': continue
    t0 = time.time(); r.filepath = path; bpy.ops.render.render(write_still=True); print(f'FRAME {f} {time.time() - t0:.1f}s', flush=True)
