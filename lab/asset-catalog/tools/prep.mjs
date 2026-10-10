// Lab-only asset prep: download each candidate in candidates_src.json, shrink it to its phone budget and measure it.
//   models: dedup/prune/weld -> meshopt simplify to `tris` -> textures resized to `tex` px -> KTX2 (Basis ETC1S) ->
//           EXT_meshopt_compression  =>  candidates/<id>.glb   (raw downloads stay in raw/, git-ignored)
// Writes candidates_prep.json (sizes, triangle counts, texture sizes, GPU estimate). Never touches the game.
// Run from this folder:  node tools/prep.mjs [id ...]      (tools/node_modules -> asset toolchain)
import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, meshopt, compactPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import { ktx2 } from 'ktx2-encoder/gltf-transform';
import sharp from 'sharp';
import draco3d from 'draco3dgltf';

const HERE = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const SRC = JSON.parse(fs.readFileSync(path.join(HERE, 'candidates_src.json')));
const OUTJ = path.join(HERE, 'candidates_prep.json');
const prev = fs.existsSync(OUTJ) ? JSON.parse(fs.readFileSync(OUTJ)) : {};
const UA = { 'User-Agent': 'SkyfireSquadron-asset-lab/1.0 (+https://github.com/rexraja89-oss/skyfire)' };
const get = async (u, opt = {}) => { const r = await fetch(u, { headers: { ...UA, ...(opt.headers || {}) } }); if (!r.ok) throw new Error(r.status + ' ' + u); return opt.json ? r.json() : Buffer.from(await r.arrayBuffer()); };

async function download(m, dir) {
  fs.mkdirSync(dir, { recursive: true });
  if (m.src === 'polyhaven') {
    const files = await get('https://api.polyhaven.com/files/' + m.ref, { json: true });
    const info = await get('https://api.polyhaven.com/info/' + m.ref, { json: true });
    const g = files.gltf['1k'].gltf;
    fs.writeFileSync(path.join(dir, 'model.gltf'), await get(g.url));
    for (const [rel, f] of Object.entries(g.include || {})) { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, await get(f.url)); }
    return { file: path.join(dir, 'model.gltf'), license: 'CC0', licenseUrl: 'https://polyhaven.com/license', author: Object.keys(info.authors || {}).join(', '), page: 'https://polyhaven.com/a/' + m.ref };
  }
  // Sketchfab: the network secret adds the Authorization header for api.sketchfab.com
  const meta = await get('https://api.sketchfab.com/v3/models/' + m.ref, { json: true });
  const dl = await get('https://api.sketchfab.com/v3/models/' + m.ref + '/download', { json: true });
  fs.writeFileSync(path.join(dir, 'model.glb'), await get(dl.glb.url));
  return { file: path.join(dir, 'model.glb'), license: meta.license.label, licenseUrl: 'https://creativecommons.org/licenses/' + (meta.license.slug === 'cc0' ? 'publicdomain/zero/1.0/' : meta.license.slug + '/4.0/'), author: meta.user.displayName, page: meta.viewerUrl,
    attribution: `"${meta.name}" by ${meta.user.displayName} (${meta.viewerUrl}), ${meta.license.label}` };
}

const tris = doc => { let t = 0; for (const me of doc.getRoot().listMeshes()) for (const p of me.listPrimitives()) { const i = p.getIndices(), a = p.getAttribute('POSITION'); t += (i ? i.getCount() : a ? a.getCount() : 0) / 3; } return Math.round(t); };
const texInfo = doc => doc.getRoot().listTextures().map(t => { const s = t.getSize() || [0, 0]; return { w: s[0], h: s[1], type: t.getMimeType() }; });
const imageDecoder = async buf => { const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data: new Uint8Array(data), width: info.width, height: info.height }; };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
await MeshoptSimplifier.ready; await MeshoptEncoder.ready; await MeshoptDecoder.ready;

const want = process.argv.slice(2);
const out = prev;
fs.mkdirSync(path.join(HERE, 'candidates'), { recursive: true });
for (const m of SRC.models) {
  if (want.length && !want.includes(m.id)) continue;
  try {
    const raw = path.join(HERE, 'raw', m.id);
    const src = await download(m, raw);
    const rawBytes = fs.readdirSync(raw, { recursive: true }).map(f => path.join(raw, f)).filter(f => fs.statSync(f).isFile()).reduce((a, f) => a + fs.statSync(f).size, 0);
    const doc = await io.read(src.file);
    const t0 = tris(doc), tex0 = texInfo(doc);
    const ratio = Math.min(1, m.tris / Math.max(1, t0));
    await doc.transform(dedup(), prune(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio, error: 1, lockBorder: false }), prune(),
      textureCompress({ encoder: sharp, resize: [m.tex, m.tex], targetFormat: 'png' }),
      ktx2({ isUASTC: false, generateMipmap: true, qualityLevel: 128, imageDecoder, enableDebug: false }));
    // photo-scans have UV seams everywhere, so the seam-aware simplifier stalls: fall back to sloppy simplification
    // (ignores seams; fine for objects seen from high above, the normal map keeps the surface detail)
    if (tris(doc) > m.tris * 1.3) for (const me of doc.getRoot().listMeshes()) for (const p of me.listPrimitives()) {
      const idx = p.getIndices(), pos = p.getAttribute('POSITION'); if (!idx || !pos) continue;
      const share = m.tris * 3 * idx.getCount() / Math.max(1, tris(doc) * 3);
      const ni = MeshoptSimplifier.simplifySloppy(new Uint32Array(idx.getArray()), new Float32Array(pos.getArray()), 3, null, Math.min(idx.getCount(), Math.max(3, Math.floor(share / 3) * 3)), 1);
      idx.setArray(new Uint32Array(Array.isArray(ni) ? ni[0] : ni)); compactPrimitive(p); }
    await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
    const file = path.join(HERE, 'candidates', m.id + '.glb');
    await io.write(file, doc);
    const tex1 = texInfo(doc), px = tex1.reduce((a, t) => a + t.w * t.h, 0);
    out[m.id] = { ...src, file: 'candidates/' + m.id + '.glb', rawBytes, rawTris: t0, rawTextures: tex0.map(t => t.w + '×' + t.h), bytes: fs.statSync(file).size, tris: tris(doc),
      textures: tex1.map(t => t.w + '×' + t.h + ' ' + t.type), gpuMB_ktx2: +(px * 1 * 1.33 / 1048576).toFixed(1), gpuMB_rgba: +(px * 4 * 1.33 / 1048576).toFixed(1) };
    console.log(m.id, (rawBytes / 1e6).toFixed(1) + 'MB/' + t0 + ' tris ->', (out[m.id].bytes / 1e6).toFixed(2) + 'MB/' + out[m.id].tris + ' tris', out[m.id].textures.join(', '));
  } catch (e) { console.log(m.id, 'FAILED', e.message); out[m.id] = { error: e.message }; }
  fs.writeFileSync(OUTJ, JSON.stringify(out, null, 1));
}
