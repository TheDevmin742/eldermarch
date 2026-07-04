/* dice-engine.js — The Casting Table
   Geometric dice with real physics, cast onto a decorated tray mat.
   - cannon.js (window.CANNON, loaded from CDN) simulates the throw ahead of
     time; the recording is played back on a painterly 2D-canvas 3D renderer
     (painter's algorithm, flat warm shading, ink outlines — Hearthsheet style).
   - On settle: the up face glows. Nat 20 on a d20: a flash of light.
     Nat 1: the die cracks apart. Then the dice fade and a ghost of the
     total stays pressed into the felt.
   - If CANNON is unavailable, a canned tumble drives the same pipeline. */

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a || 1), 0, 1); return t * t * (3 - 2 * t); };
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------------- vectors / quaternions ---------------- */
const vAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vScale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vLen = a => Math.hypot(a[0], a[1], a[2]);
const vNorm = a => { const l = vLen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vLerp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const qMul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
];
const qNorm = q => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
const qRotate = (v, q) => {
  const qv = [q[0], q[1], q[2]];
  const t = vScale(vCross(qv, v), 2);
  return vAdd(vAdd(v, vScale(t, q[3])), vCross(qv, t));
};
const qAxisAngle = (axis, ang) => {
  const s = Math.sin(ang / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(ang / 2)];
};
const qSlerp = (a, b, t) => {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb = b;
  if (d < 0) { d = -d; bb = [-b[0], -b[1], -b[2], -b[3]]; }
  if (d > 0.9995) return qNorm([lerp(a[0], bb[0], t), lerp(a[1], bb[1], t), lerp(a[2], bb[2], t), lerp(a[3], bb[3], t)]);
  const th = Math.acos(clamp(d, -1, 1));
  const s = Math.sin(th);
  const wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
  return [a[0] * wa + bb[0] * wb, a[1] * wa + bb[1] * wb, a[2] * wa + bb[2] * wb, a[3] * wa + bb[3] * wb];
};
const qFromUnitVectors = (f, t) => {
  const d = vDot(f, t);
  if (d > 0.99999) return [0, 0, 0, 1];
  if (d < -0.99999) {
    let ax = vCross([1, 0, 0], f);
    if (vLen(ax) < 1e-6) ax = vCross([0, 1, 0], f);
    return qAxisAngle(vNorm(ax), Math.PI);
  }
  const ax = vCross(f, t);
  return qNorm([ax[0], ax[1], ax[2], 1 + d]);
};
const randQuat = () => qNorm(qMul(qAxisAngle(vNorm([rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)]), rnd(0, TAU)),
  qAxisAngle(vNorm([rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)]), rnd(0, TAU))));

/* ---------------- color helpers ---------------- */
function shadeHex(hex, pct) {
  const h = hex.replace('#', '');
  let r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const t = pct < 0 ? 0 : 255, p = Math.abs(pct);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return '#' + [r, g, b].map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('');
}

/* ---------------- geometry ---------------- */
function newellNormal(pts) {
  const n = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return vNorm(n);
}
function distPointSeg(p, a, b) {
  const ab = vSub(b, a);
  const t = clamp(vDot(vSub(p, a), ab) / (vDot(ab, ab) || 1), 0, 1);
  return vLen(vSub(p, vAdd(a, vScale(ab, t))));
}
function planeProject(v, n) { return vSub(v, vScale(n, vDot(v, n))); }

function finishFaces(verts, rawFaces) {
  return rawFaces.map(list => {
    let c = [0, 0, 0];
    list.forEach(i => { c = vAdd(c, verts[i]); });
    c = vScale(c, 1 / list.length);
    const nEst = vNorm(c);
    const seed = Math.abs(nEst[1]) > 0.93 ? [1, 0, 0] : [0, 1, 0];
    const t1 = vNorm(vCross(seed, nEst));
    const t2 = vCross(nEst, t1);
    const idx = list.slice().sort((A, B) => {
      const pa = vSub(verts[A], c), pb = vSub(verts[B], c);
      return Math.atan2(vDot(pa, t2), vDot(pa, t1)) - Math.atan2(vDot(pb, t2), vDot(pb, t1));
    });
    let n = newellNormal(idx.map(i => verts[i]));
    if (vDot(n, nEst) < 0) { idx.reverse(); n = vScale(n, -1); }
    let r = 1e9;
    for (let i = 0; i < idx.length; i++) r = Math.min(r, distPointSeg(c, verts[idx[i]], verts[idx[(i + 1) % idx.length]]));
    let tU = planeProject([0.12, 1, 0.05], n);
    if (vLen(tU) < 0.25) tU = planeProject([1, 0.08, 0.1], n);
    tU = vNorm(tU);
    const tR = vNorm(vCross(tU, n));
    return { idx, n, c, r, tU, tR, value: null, label: null, px: 40 };
  });
}
function facesFromDirections(verts, dirs, k) {
  return dirs.map(d => {
    const dn = vNorm(d);
    return verts.map((v, i) => [vDot(v, dn), i]).sort((a, b) => b[0] - a[0]).slice(0, k).map(x => x[1]);
  });
}
function assignPairs(faces, maxV) {
  const used = new Set(); const pairs = [];
  faces.forEach((f, i) => {
    if (used.has(i)) return;
    let best = -1, bd = 2;
    faces.forEach((g, j) => { if (j === i || used.has(j)) return; const d = vDot(f.n, g.n); if (d < bd) { bd = d; best = j; } });
    used.add(i); used.add(best); pairs.push([i, best]);
  });
  let v = 1;
  pairs.forEach(([a, b]) => { faces[a].value = v; faces[b].value = maxV + 1 - v; v++; });
  faces.forEach(f => { f.label = String(f.value); });
}

const PHI = (1 + Math.sqrt(5)) / 2;
const GEO_CACHE = {};
export function getGeo(type) {
  if (GEO_CACHE[type]) return GEO_CACHE[type];
  let verts = [], raw = [], geo;
  const finish = (extra) => {
    const faces = finishFaces(verts, raw);
    geo = Object.assign({ type, verts, faces, R: Math.max(...verts.map(vLen)) }, extra || {});
    return geo;
  };
  if (type === 'd4') {
    const s = 1.36 / Math.sqrt(3);
    verts = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => vScale(v, s));
    raw = [[1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 1, 2]];
    finish({ vertexValues: [1, 2, 3, 4] });
    geo.faces.forEach(f => { f.px = 21; });
  } else if (type === 'd6') {
    const h = 0.82;
    for (const x of [-h, h]) for (const y of [-h, h]) for (const z of [-h, h]) verts.push([x, y, z]);
    raw = facesFromDirections(verts, [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], 4);
    finish();
    assignPairs(geo.faces, 6);
    geo.faces.forEach(f => { f.px = 42; });
  } else if (type === 'd8') {
    verts = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(v => vScale(v, 1.18));
    const dirs = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) dirs.push([x, y, z]);
    raw = facesFromDirections(verts, dirs, 3);
    finish();
    assignPairs(geo.faces, 8);
  } else if (type === 'd10' || type === 'd10t' || type === 'd10u') {
    const s = 1.16, h = 0.1056, rr = 1.04;
    for (let i = 0; i < 10; i++) {
      const a = i * TAU / 10;
      verts.push([Math.cos(a) * rr * s, (i % 2 === 0 ? h : -h) * s, Math.sin(a) * rr * s]);
    }
    verts.push([0, s, 0]); verts.push([0, -s, 0]);
    for (let k = 0; k < 5; k++) {
      raw.push([10, (2 * k) % 10, (2 * k + 1) % 10, (2 * k + 2) % 10]);
      raw.push([11, (2 * k + 1) % 10, (2 * k + 2) % 10, (2 * k + 3) % 10]);
    }
    finish();
    assignPairs(geo.faces, 10);
    if (type === 'd10t') geo.faces.forEach(f => { f.value = (f.value - 1) * 10; f.label = String(f.value).padStart(2, '0'); });
    if (type === 'd10u') geo.faces.forEach(f => { f.value = f.value % 10; f.label = String(f.value); });
    geo.faces.forEach(f => { f.px = f.label.length >= 2 ? 30 : 38; });
  } else if (type === 'd12') {
    const s = 1.14 / Math.sqrt(3), a = 1 / PHI, b = PHI;
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) verts.push([x * s, y * s, z * s]);
    for (const i of [-1, 1]) for (const j of [-1, 1]) {
      verts.push([0, i * a * s, j * b * s]);
      verts.push([i * a * s, j * b * s, 0]);
      verts.push([i * b * s, 0, j * a * s]);
    }
    const dirs = [];
    for (const i of [-1, 1]) for (const j of [-1, 1]) { dirs.push([0, i * PHI, j]); dirs.push([i * PHI, j, 0]); dirs.push([i, 0, j * PHI]); }
    raw = facesFromDirections(verts, dirs, 5);
    finish();
    assignPairs(geo.faces, 12);
  } else if (type === 'd20') {
    const s = 1.2 / Math.hypot(1, PHI);
    for (const i of [-1, 1]) for (const j of [-1, 1]) {
      verts.push([0, i * s, j * PHI * s]);
      verts.push([i * s, j * PHI * s, 0]);
      verts.push([i * PHI * s, 0, j * s]);
    }
    const dirs = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) dirs.push([x, y, z]);
    for (const i of [-1, 1]) for (const j of [-1, 1]) { dirs.push([i / PHI, 0, j * PHI]); dirs.push([0, i * PHI, j / PHI]); dirs.push([i * PHI, j / PHI, 0]); }
    raw = facesFromDirections(verts, dirs, 3);
    finish();
    assignPairs(geo.faces, 20);
    geo.faces.forEach(f => { f.px = f.label.length >= 2 ? 30 : 37; });
  } else { // coin
    const N = 18, r = 1.05, hh = 0.11;
    for (let i = 0; i < N; i++) { const a = i * TAU / N; verts.push([Math.cos(a) * r, hh, Math.sin(a) * r]); }
    for (let i = 0; i < N; i++) { const a = i * TAU / N; verts.push([Math.cos(a) * r, -hh, Math.sin(a) * r]); }
    raw.push(Array.from({ length: N }, (_, i) => i));
    raw.push(Array.from({ length: N }, (_, i) => N + i));
    for (let i = 0; i < N; i++) raw.push([i, (i + 1) % N, N + (i + 1) % N, N + i]);
    finish();
    geo.faces.forEach(f => {
      if (Math.abs(f.n[1]) > 0.9) {
        f.value = f.n[1] > 0 ? 1 : 2;
        f.label = f.n[1] > 0 ? 'H' : 'T';
        f.px = 44;
        f.tU = [0, 0, -1]; f.tR = vNorm(vCross(f.tU, f.n));
      }
    });
  }
  GEO_CACHE[type] = geo;
  return geo;
}

/* ---------------- orientation helpers ---------------- */
function upFaceIndex(geo, q) {
  let bi = 0, bd = -2;
  geo.faces.forEach((f, i) => {
    if (f.value == null) return;
    const d = qRotate(f.n, q)[1];
    if (d > bd) { bd = d; bi = i; }
  });
  return bi;
}
function upVertexIndex(geo, q) {
  let bi = 0, bd = -2;
  geo.verts.forEach((v, i) => {
    const d = qRotate(vNorm(v), q)[1];
    if (d > bd) { bd = d; bi = i; }
  });
  return bi;
}
function upDirDot(geo, q) {
  if (geo.type === 'd4') return qRotate(vNorm(geo.verts[upVertexIndex(geo, q)]), q)[1];
  return qRotate(geo.faces[upFaceIndex(geo, q)].n, q)[1];
}
function alignQuat(geo, q) {
  const dir = geo.type === 'd4'
    ? vNorm(qRotate(vNorm(geo.verts[upVertexIndex(geo, q)]), q))
    : vNorm(qRotate(geo.faces[upFaceIndex(geo, q)].n, q));
  return qNorm(qMul(qFromUnitVectors(dir, [0, 1, 0]), q));
}
function restY(geo, q) {
  let m = 1e9;
  geo.verts.forEach(v => { m = Math.min(m, qRotate(v, q)[1]); });
  return -m + 0.012;
}
function readResult(geo, q) {
  if (geo.type === 'd4') {
    const vi = upVertexIndex(geo, q);
    return { value: geo.vertexValues[vi], label: String(geo.vertexValues[vi]) };
  }
  const f = geo.faces[upFaceIndex(geo, q)];
  return { value: f.value, label: f.label };
}
function quatShowingFace(geo, faceIdx, yaw) {
  const q0 = geo.type === 'd4'
    ? qFromUnitVectors(vNorm(geo.verts[faceIdx]), [0, 1, 0])
    : qFromUnitVectors(geo.faces[faceIdx].n, [0, 1, 0]);
  return qNorm(qMul(qAxisAngle([0, 1, 0], yaw || 0), q0));
}
function faceIndexForValue(geo, value) {
  if (geo.type === 'd4') return geo.vertexValues.indexOf(value);
  return geo.faces.findIndex(f => f.value === value);
}

/* ---------------- table / camera constants ---------------- */
const TABLE = { INW: 5.6, IND: 3.85, WT: 0.55, WH: 0.62, CR: 0.9 };
const CAM = { eye: [0, 11.8, 10.8], target: [0, -0.2, -0.6], f: 940, cx: 500, cy: 306 };
const LIGHT = vNorm([-0.42, 0.85, 0.3]);
const LOG_W = 1000, LOG_H = 640;

const THEMES = {
  plain:    { felt: '#5C6B4E' },
  glow:     { felt: '#69503B', candle: true },
  filigree: { felt: '#61352A', fleurons: true, brassLine: true },
  runes:    { felt: '#3D4E56', runes: true },
  heraldic: { felt: '#453B2C', frames: true, brassLine: true },
  beach:    { felt: '#C4AD82', beach: true, animated: true, noStitch: true },
  nest:     { felt: '#4A3B28', nest: true, animated: true, noStitch: true },
  bench:    { felt: '#6E5638', bench: true, noStitch: true },
  glade:    { felt: '#26312A', glade: true, animated: true, noStitch: true },
  hearth:   { felt: '#8A7462', hearth: true, animated: true, noStitch: true },
  magma:    { felt: '#241B18', magma: true, animated: true, noStitch: true }
};
const RUNES = ['ᚠ', 'ᚱ', 'ᚦ', 'ᚨ', 'ᚷ', 'ᚹ', 'ᛁ', 'ᛟ', 'ᛏ', 'ᛒ', 'ᛗ', 'ᛚ'];

/* ---- the Rising Tide set (Thalasstheos) ---- */
const TIDE = {
  teal: '#2FA093', abyss: '#16324F', ink: '#0E2A33', foam: '#F5FBF8',
  num: '#1B5C88',
  water: 'rgba(16,58,92,0.50)', waterEdge: 'rgba(120,210,200,0.30)',
  pearlBase: '#EAE4D8', pearlInk: '#8C8378', pearlNum: '#2C7D7A'
};
function hexRgba(hex, a) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}
function mixHex(a, b, t) {
  const pa = a.replace('#', ''), pb = b.replace('#', '');
  const c = k => Math.round(lerp(parseInt(pa.slice(k, k + 2), 16), parseInt(pb.slice(k, k + 2), 16), clamp(t, 0, 1)));
  return '#' + [0, 2, 4].map(k => c(k).toString(16).padStart(2, '0')).join('');
}
/* deterministic pebbles for the rocky beach (fixed LCG seed → same beach every visit) */
const BEACH_PEBBLES = (() => {
  let s = 1373;
  const rand = () => (s = (s * 48271) % 2147483647) / 2147483647;
  const pebbles = [];
  const put = (x, z, rMin, rMax) => {
    const r = rMin + rand() * (rMax - rMin);
    pebbles.push({
      x, z, r,
      squish: 0.55 + rand() * 0.3,
      rot: rand() * TAU,
      tone: mixHex('#8F8272', '#6C6154', rand()),
      wob: Array.from({ length: 8 }, () => 0.86 + rand() * 0.28)
    });
  };
  // strewn along the near (dry) edge and sides
  for (let i = 0; i < 11; i++) put(-TABLE.INW + 0.7 + rand() * (TABLE.INW * 2 - 1.4), TABLE.IND - 0.55 - rand() * 1.1, 0.13, 0.34);
  for (let i = 0; i < 5; i++)  put(-TABLE.INW + 0.55 + rand() * 1.3, -0.6 + rand() * 2.6, 0.11, 0.27);
  for (let i = 0; i < 5; i++)  put(TABLE.INW - 0.55 - rand() * 1.3, -0.6 + rand() * 2.6, 0.11, 0.27);
  // a few out in the surf
  for (let i = 0; i < 6; i++)  put(-TABLE.INW + 1 + rand() * (TABLE.INW * 2 - 2), -TABLE.IND + 0.5 + rand() * 1.4, 0.14, 0.3);
  return pebbles;
})();
/* ---- the character sets: Kree, Wilhelm, Kenra ---- */
const HOARD = { // Kree — magpie-feather black, gold shinies
  base: '#141216', ink: '#08080B', num: '#E8C36A',
  gild: '#C9A227', gildInk: '#4A3410', gildNum: '#3A2B10'
};
const WORKS = { // Wilhelm — riveted brass, one arc-lit prototype
  base: '#A98544', ink: '#3A2A12', num: '#2E1F10',
  proto: '#4A5058', protoInk: '#23272C', protoNum: '#9FE8FF'
};
const MOON = { // Kenra — borrowed midnight tints, moon-silver light
  ink: '#191526', num: '#DDD9EE',
  moon: '#E6E4F2', moonInk: '#8F8BA8', moonNum: '#2E2A4A',
  dir: vNorm([-0.5, 0.7, -0.4]), // where the moonlight falls from
  tints: ['#4A3A55', '#33474F', '#3E4638', '#4E3A38', '#2F3A52', '#463349', '#3A3A3A', '#513F2E']
};

const ASH = { // the ashlings — banked coals, gentle and warm
  base: '#3A302C', ink: '#1E1614', num: '#FFD9A8',
  bop: '#7A4A32', bopInk: '#3A241A', bopNum: '#FFF3DC'
};
const CINDER = { // the salamander — black crust over living magma
  base: '#33241E', ink: '#150E0B', num: '#FFB35C',
  molten: '#B33A16', moltenInk: '#2A1006', moltenNum: '#FFE0B0'
};

/* deterministic scatter for the character mats */
function lcg(seed) { let s = seed; return () => (s = (s * 48271) % 2147483647) / 2147483647; }
const NEST_TWIGS = (() => {
  const rand = lcg(4177);
  const twigs = [];
  for (let i = 0; i < 64; i++) {
    const a = rand() * TAU;
    const rx = TABLE.INW - 0.55 - rand() * 0.75, rz = TABLE.IND - 0.5 - rand() * 0.65;
    const x = Math.cos(a) * rx, z = Math.sin(a) * rz;
    twigs.push({ x, z, ang: a + Math.PI / 2 + (rand() - 0.5) * 0.9, len: 0.5 + rand() * 0.75,
      w: 1.4 + rand() * 1.6, tone: mixHex('#6B5335', '#3A2C1A', rand()) });
  }
  return twigs;
})();
const NEST_SHINIES = (() => {
  const rand = lcg(9319);
  const kinds = ['coin', 'ring', 'button', 'gem', 'coin', 'bead'];
  const items = [];
  for (let i = 0; i < 11; i++) {
    const a = rand() * TAU, rr = 0.25 + rand() * 0.62;
    items.push({ kind: kinds[i % kinds.length],
      x: Math.cos(a) * (TABLE.INW - 1.3) * rr, z: Math.sin(a) * (TABLE.IND - 1.1) * rr,
      r: 0.13 + rand() * 0.1, ph: rand() * TAU, rot: rand() * TAU });
  }
  return items;
})();
const BENCH_COGS = (() => {
  const rand = lcg(6011);
  const cogs = [];
  for (let i = 0; i < 6; i++) {
    cogs.push({ x: -TABLE.INW + 0.8 + rand() * (TABLE.INW * 2 - 1.6),
      z: (rand() < 0.5 ? -1 : 1) * (TABLE.IND - 0.75 - rand() * 0.5),
      r: 0.22 + rand() * 0.2, teeth: 7 + Math.floor(rand() * 4), rot: rand() * TAU,
      tone: mixHex('#57452A', '#3E3020', rand()) });
  }
  return cogs;
})();
const GLADE_FLIES = (() => {
  const rand = lcg(2731);
  return Array.from({ length: 9 }, () => ({
    x: -TABLE.INW + 0.9 + rand() * (TABLE.INW * 2 - 1.8),
    z: -TABLE.IND + 0.8 + rand() * (TABLE.IND * 2 - 1.6),
    ph: rand() * TAU, sp: 0.6 + rand() * 0.8
  }));
})();
const HEARTH_DRIFTS = (() => {
  const rand = lcg(8123);
  return Array.from({ length: 7 }, () => ({
    x: -TABLE.INW + 0.8 + rand() * (TABLE.INW * 2 - 1.6),
    z: -TABLE.IND + 0.7 + rand() * (TABLE.IND * 2 - 1.4),
    r: 0.6 + rand() * 0.9, a: 0.08 + rand() * 0.09
  }));
})();
const HEARTH_MOTES = (() => {
  const rand = lcg(5471);
  return Array.from({ length: 12 }, () => ({
    x: -TABLE.INW + 0.8 + rand() * (TABLE.INW * 2 - 1.6),
    z: -TABLE.IND + 0.7 + rand() * (TABLE.IND * 2 - 1.4),
    ph: rand() * TAU, sp: 0.5 + rand() * 0.9, warm: rand() < 0.45
  }));
})();
/* a small resident's tracks, wandering across the dust */
const HEARTH_PRINTS = (() => {
  const rand = lcg(3313);
  const prints = [];
  let x = -TABLE.INW + 1.2, z = TABLE.IND - 1.0, ang = -0.5;
  for (let i = 0; i < 14; i++) {
    ang += (rand() - 0.45) * 0.55;
    x += Math.cos(ang) * 0.62; z += Math.sin(ang) * 0.5 - 0.12;
    if (Math.abs(x) > TABLE.INW - 0.8 || Math.abs(z) > TABLE.IND - 0.7) break;
    const side = i % 2 === 0 ? 1 : -1;
    prints.push({ x: x - Math.sin(ang) * 0.13 * side, z: z + Math.cos(ang) * 0.13 * side, ang });
  }
  return prints;
})();
const MAGMA_CRACKS = (() => {
  const rand = lcg(9743);
  const cracks = [];
  for (let c = 0; c < 4; c++) {
    const pts = [];
    let x = -TABLE.INW + 0.6 + rand() * (TABLE.INW * 2 - 1.2);
    let z = -TABLE.IND + 0.5 + rand() * (TABLE.IND * 2 - 1);
    let ang = rand() * TAU;
    pts.push([x, z]);
    for (let k = 0; k < 7; k++) {
      ang += (rand() - 0.5) * 1.3;
      x += Math.cos(ang) * (0.55 + rand() * 0.5);
      z += Math.sin(ang) * (0.45 + rand() * 0.4);
      x = clamp(x, -TABLE.INW + 0.4, TABLE.INW - 0.4);
      z = clamp(z, -TABLE.IND + 0.35, TABLE.IND - 0.35);
      pts.push([x, z]);
    }
    cracks.push({ pts, ph: rand() * TAU });
  }
  return cracks;
})();
const MAGMA_POOLS = (() => {
  const rand = lcg(1531);
  return Array.from({ length: 3 }, () => ({
    x: -TABLE.INW + 1.1 + rand() * (TABLE.INW * 2 - 2.2),
    z: -TABLE.IND + 0.9 + rand() * (TABLE.IND * 2 - 1.8),
    r: 0.32 + rand() * 0.3, ph: rand() * TAU
  }));
})();
const MAGMA_SPARKS = (() => {
  const rand = lcg(7247);
  return Array.from({ length: 9 }, () => ({
    x: -TABLE.INW + 0.7 + rand() * (TABLE.INW * 2 - 1.4),
    z: -TABLE.IND + 0.6 + rand() * (TABLE.IND * 2 - 1.2),
    ph: rand() * TAU, sp: 0.8 + rand() * 1.1
  }));
})();
/* the chains that were meant to bind — two runs across the hall floor */
const MAGMA_CHAINS = [
  { a: [-TABLE.INW - 0.2, -TABLE.IND + 1.1], b: [1.9, TABLE.IND - 0.7] },
  { a: [TABLE.INW + 0.2, -TABLE.IND + 0.6], b: [-1.4, 1.15] }
];

/* the animated waterline of the surf (world z for a given x) */
function surfLine(x, t) {
  return -TABLE.IND + TABLE.IND * 0.62
    + 0.22 * Math.sin(t / 2400)                 // the slow breathing of the tide
    + 0.16 * Math.sin(x * 1.15 + t / 860)
    + 0.09 * Math.sin(x * 2.3 - t / 540);
}

function roundRectPts(w, d, r, y, segs = 7) {
  const pts = [];
  const corner = (cx, cz, a0, a1) => {
    for (let i = 0; i <= segs; i++) {
      const a = a0 + (a1 - a0) * (i / segs);
      pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
    }
  };
  pts.push([-w + r, y, -d]);
  pts.push([w - r, y, -d]);
  corner(w - r, -d + r, -Math.PI / 2, 0);
  pts.push([w, y, d - r]);
  corner(w - r, d - r, 0, Math.PI / 2);
  pts.push([-w + r, y, d]);
  corner(-w + r, d - r, Math.PI / 2, Math.PI);
  pts.push([-w, y, -d + r]);
  corner(-w + r, -d + r, Math.PI, Math.PI * 1.5);
  return pts;
}

/* ---------------- physics simulation ---------------- */
function simulatePhysics(CANNON, geos, spec) {
  const S = clamp(spec.throwStrength || 1, 0.4, 2.2);
  const world = new CANNON.World();
  world.gravity.set(0, -38, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 16;
  world.allowSleep = false;

  const mDie = new CANNON.Material('die'), mFloor = new CANNON.Material('floor'), mWall = new CANNON.Material('wall');
  world.addContactMaterial(new CANNON.ContactMaterial(mDie, mFloor, { friction: 0.32, restitution: 0.36 }));
  world.addContactMaterial(new CANNON.ContactMaterial(mDie, mWall, { friction: 0.08, restitution: 0.6 }));
  world.addContactMaterial(new CANNON.ContactMaterial(mDie, mDie, { friction: 0.12, restitution: 0.45 }));

  const { INW, IND } = TABLE;
  const floor = new CANNON.Body({ mass: 0, material: mFloor });
  floor.addShape(new CANNON.Box(new CANNON.Vec3(INW + 3, 0.5, IND + 3)));
  floor.position.set(0, -0.5, 0);
  world.addBody(floor);
  const wallDefs = [
    [INW + 0.34, 0, 0.35, 10, IND + 2],
    [-INW - 0.34, 0, 0.35, 10, IND + 2],
    [0, IND + 0.34, INW + 2, 10, 0.35],
    [0, -IND - 0.34, INW + 2, 10, 0.35]
  ];
  wallDefs.forEach(([x, z, hx, hy, hz]) => {
    const w = new CANNON.Body({ mass: 0, material: mWall });
    w.addShape(new CANNON.Box(new CANNON.Vec3(hx, hy, hz)));
    w.position.set(x, hy - 0.4, z);
    world.addBody(w);
  });

  const bodies = geos.map((geo, i) => {
    const pts = geo.verts.map(v => new CANNON.Vec3(v[0], v[1], v[2]));
    const shape = new CANNON.ConvexPolyhedron(pts, geo.faces.map(f => f.idx.slice()));
    const body = new CANNON.Body({ mass: 1, material: mDie });
    body.addShape(shape);
    body.linearDamping = 0.08;
    body.angularDamping = 0.09;
    const col = i % 3;
    body.position.set(3.6 + rnd(-0.35, 0.55), 2.9 + i * 1.25, (col - 1) * 1.7 + rnd(-0.5, 0.5));
    const q = randQuat();
    body.quaternion.set(q[0], q[1], q[2], q[3]);
    body.velocity.set(-(6.5 + rnd(0, 3.4)) * S, -1.5 + rnd(-0.5, 0.5), rnd(-2.2, 2.2));
    body.angularVelocity.set(rnd(-1, 1) * 14 * S, rnd(-1, 1) * 10 * S, rnd(-1, 1) * 14 * S);
    return body;
  });
  bodies.forEach(b => world.addBody(b));

  const frames = [];
  const record = () => {
    const arr = new Float32Array(bodies.length * 7);
    bodies.forEach((b, i) => {
      arr[i * 7] = b.position.x; arr[i * 7 + 1] = b.position.y; arr[i * 7 + 2] = b.position.z;
      arr[i * 7 + 3] = b.quaternion.x; arr[i * 7 + 4] = b.quaternion.y; arr[i * 7 + 5] = b.quaternion.z; arr[i * 7 + 6] = b.quaternion.w;
    });
    frames.push(arr);
  };

  let still = 0, nudges = 0, settled = false;
  for (let f = 0; f < 620 && !settled; f++) {
    world.step(1 / 60);
    record();
    if (f < 40) continue;
    const allStill = bodies.every(b => b.velocity.length() < 0.22 && b.angularVelocity.length() < 0.3);
    still = allStill ? still + 1 : 0;
    if (still >= 14) {
      let cocked = false;
      bodies.forEach((b, i) => {
        const q = [b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w];
        const thresh = geos[i].type === 'd4' ? 0.955 : 0.965;
        if (upDirDot(geos[i], q) < thresh) {
          cocked = true; nudges++;
          b.velocity.set(rnd(-1.5, 1.5), 3.4 + rnd(0, 2), rnd(-1.5, 1.5));
          b.angularVelocity.set(rnd(-6, 6), rnd(-4, 4), rnd(-6, 6));
        }
      });
      if (cocked && nudges <= 7) { still = 0; continue; }
      settled = true;
    }
  }

  // alignment tail: ease each die to perfectly flat
  const last = frames[frames.length - 1];
  const finals = geos.map((geo, i) => {
    const p = [last[i * 7], last[i * 7 + 1], last[i * 7 + 2]];
    const q = [last[i * 7 + 3], last[i * 7 + 4], last[i * 7 + 5], last[i * 7 + 6]];
    const qa = alignQuat(geo, q);
    return { p, q, qa, y: restY(geo, qa) };
  });
  const TAIL = 14;
  for (let k = 1; k <= TAIL; k++) {
    const t = smooth(0, 1, k / TAIL);
    const arr = new Float32Array(geos.length * 7);
    finals.forEach((fi, i) => {
      const q = qSlerp(fi.q, fi.qa, t);
      arr[i * 7] = fi.p[0]; arr[i * 7 + 1] = lerp(fi.p[1], fi.y, t); arr[i * 7 + 2] = fi.p[2];
      arr[i * 7 + 3] = q[0]; arr[i * 7 + 4] = q[1]; arr[i * 7 + 5] = q[2]; arr[i * 7 + 6] = q[3];
    });
    frames.push(arr);
  }
  const results = geos.map((geo, i) => readResult(geo, finals[i].qa));
  return { frames, settleFrame: frames.length - 1, results };
}

/* validate a physics recording: every value finite, positions inside the tray area */
function recordingOk(frames, n) {
  for (let f = 0; f < frames.length; f++) {
    const arr = frames[f];
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 7; k++) if (!Number.isFinite(arr[i * 7 + k])) return false;
      const x = arr[i * 7], y = arr[i * 7 + 1], z = arr[i * 7 + 2];
      if (Math.abs(x) > 14 || Math.abs(z) > 12 || y < -3 || y > 40) return false;
    }
  }
  // settled frame must be inside the visible felt
  const last = frames[frames.length - 1];
  for (let i = 0; i < n; i++) {
    if (Math.abs(last[i * 7]) > TABLE.INW + 0.4 || Math.abs(last[i * 7 + 2]) > TABLE.IND + 0.4) return false;
  }
  return true;
}
export const __sim = { simulatePhysics, recordingOk, getGeo };

/* sanity check: each face's vertices must be planar and CCW-outward (matches what CANNON needs) */
export function checkGeo(type) {
  const geo = getGeo(type);
  const issues = [];
  geo.faces.forEach((f, fi) => {
    const pts = f.idx.map(i => geo.verts[i]);
    // planarity
    const n = newellNormal(pts);
    const d0 = vDot(n, pts[0]);
    for (let k = 1; k < pts.length; k++) {
      if (Math.abs(vDot(n, pts[k]) - d0) > 0.02) { issues.push('face ' + fi + ' non-planar'); break; }
    }
    // first-3 winding (what cannon uses)
    const c3 = vCross(vSub(pts[1], pts[0]), vSub(pts[2], pts[0]));
    if (vDot(c3, pts[0]) < 0.001) issues.push('face ' + fi + ' bad winding');
    // duplicate verts across faces sanity
    if (new Set(f.idx).size !== f.idx.length) issues.push('face ' + fi + ' dup verts');
  });
  return issues;
}

/* canned fallback (no CANNON, or forced results for testing) */
function simulateCanned(geos, spec, force) {
  const results = geos.map((geo, i) => {
    let value;
    if (force && force[i] != null) value = force[i];
    else if (geo.type === 'd4') value = geo.vertexValues[Math.floor(Math.random() * 4)];
    else {
      const vals = geo.faces.filter(f => f.value != null).map(f => f.value);
      value = vals[Math.floor(Math.random() * vals.length)];
    }
    return { value };
  });
  const n = geos.length;
  const L = 150 + (n - 1) * 12;
  const plans = geos.map((geo, i) => {
    const fi = faceIndexForValue(geo, results[i].value);
    const qT = quatShowingFace(geo, fi, rnd(0, TAU));
    results[i].label = readResult(geo, qT).label;
    const cols = Math.min(n, 4);
    const tx = -3 + (i % cols) * (6 / Math.max(cols - 1, 1)) + rnd(-0.6, 0.6);
    const tz = (Math.floor(i / cols) - 0.5) * 2.2 + rnd(-0.6, 0.6);
    return {
      qT, fi,
      x0: 4.2, z0: rnd(-1.5, 1.5), tx: clamp(tx, -TABLE.INW + 1.4, TABLE.INW - 1.4), tz: clamp(tz, -TABLE.IND + 1.2, TABLE.IND - 1.2),
      axis: vNorm([rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)]), spin: rnd(10, 18),
      restH: restY(geo, qT), dur: L - (n - 1 - i) * 10
    };
  });
  const frames = [];
  for (let f = 0; f <= L; f++) {
    const arr = new Float32Array(n * 7);
    plans.forEach((pl, i) => {
      const t = clamp(f / pl.dur, 0, 1);
      const e = easeOutCubic(t);
      const x = lerp(pl.x0, pl.tx, e), z = lerp(pl.z0, pl.tz, e);
      const y = pl.restH + 3.6 * Math.abs(Math.cos(t * TAU * 1.35)) * Math.exp(-4.2 * t);
      const q = qNorm(qMul(qAxisAngle(pl.axis, pl.spin * (1 - e)), pl.qT));
      arr[i * 7] = x; arr[i * 7 + 1] = y; arr[i * 7 + 2] = z;
      arr[i * 7 + 3] = q[0]; arr[i * 7 + 4] = q[1]; arr[i * 7 + 5] = q[2]; arr[i * 7 + 6] = q[3];
    });
    frames.push(arr);
  }
  return { frames, settleFrame: L, results };
}

/* ---------------- the stage ---------------- */
export function createDiceStage(canvas, initial) {
  const ctx = canvas.getContext('2d');
  const stage = {
    scene: {
      type: (initial && initial.type) || 'd20',
      color: (initial && initial.color) || { body: '#9C3D2E', light: false },
      theme: (initial && initial.theme) || 'glow',
      mode: 'showcase', ghost: null, keptDice: null
    },
    anim: null, raf: null, sc: 1, destroyed: false, ripples: [], idleRaf: null
  };

  /* camera basis */
  const fwd = vNorm(vSub(CAM.target, CAM.eye));
  const right = vNorm(vCross(fwd, [0, 1, 0]));
  const upv = vCross(right, fwd);
  const proj = p => {
    const e = vSub(p, CAM.eye);
    const z = Math.max(vDot(e, fwd), 0.1);
    return { x: CAM.cx + CAM.f * vDot(e, right) / z, y: CAM.cy - CAM.f * vDot(e, upv) / z, z };
  };

  /* ---------- resize ---------- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    stage.sc = w / LOG_W;
    if (!stage.anim) drawStatic();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  /* ---------- low-level draw helpers ---------- */
  function begin() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(stage.sc, 0, 0, stage.sc, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  }
  function pathW(pts) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const s = proj(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
  }
  function withSurface(cW, rW, dW, fn) {
    // maps local (0,0)+40u square onto the surface patch
    const P0 = proj(cW), Pr = proj(vAdd(cW, rW)), Pd = proj(vAdd(cW, dW));
    ctx.save();
    ctx.transform((Pr.x - P0.x) / 40, (Pr.y - P0.y) / 40, (Pd.x - P0.x) / 40, (Pd.y - P0.y) / 40, P0.x, P0.y);
    fn();
    ctx.restore();
  }
  function floorText(text, x, z, rot, size, fill, font) {
    const u = [Math.cos(rot), 0, Math.sin(rot)];
    const w = [Math.sin(rot), 0, -Math.cos(rot)];
    withSurface([x, 0.02, z], vScale(u, size), vScale(w, -size), () => {
      ctx.font = font || '700 40px Cinzel, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = fill;
      ctx.fillText(text, 0, 0);
    });
  }

  /* ---------- table ---------- */
  const WOOD_TOP = '#57402A', WOOD_SIDE = '#39281A';
  function tablePaths() {
    const { INW, IND, WT, WH, CR } = TABLE;
    return {
      outerTop: roundRectPts(INW + WT, IND + WT, CR + WT * 0.6, WH),
      outerBase: roundRectPts(INW + WT, IND + WT, CR + WT * 0.6, -0.05),
      innerTop: roundRectPts(INW, IND, CR, WH),
      innerBase: roundRectPts(INW, IND, CR, 0)
    };
  }
  function drawTable(now) {
    const th = THEMES[stage.scene.theme] || THEMES.plain;
    const P = tablePaths();
    // tray block
    pathW(P.outerBase); ctx.fillStyle = WOOD_SIDE; ctx.fill();
    pathW(P.outerTop); ctx.fillStyle = WOOD_TOP; ctx.fill();
    pathW(P.outerTop); ctx.strokeStyle = 'rgba(28,21,12,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
    if (th.brassLine) { pathW(P.innerTop); ctx.strokeStyle = 'rgba(199,161,78,0.6)'; ctx.lineWidth = 2; ctx.stroke(); }
    // inner walls then felt
    pathW(P.innerTop); ctx.fillStyle = shadeHex(th.felt, -0.5); ctx.fill();
    const c0 = proj([0, 0, 0]);
    pathW(P.innerBase);
    const g = ctx.createRadialGradient(c0.x, c0.y, 40, c0.x, c0.y, 470);
    g.addColorStop(0, shadeHex(th.felt, 0.07));
    g.addColorStop(1, shadeHex(th.felt, -0.12));
    ctx.fillStyle = g; ctx.fill();
    // vignette toward walls
    pathW(P.innerBase);
    const vg = ctx.createRadialGradient(c0.x, c0.y, 150, c0.x, c0.y, 430);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(15,10,5,0.24)');
    ctx.fillStyle = vg; ctx.fill();
    // stitched border
    if (!th.noStitch) {
      pathW(roundRectPts(TABLE.INW - 0.42, TABLE.IND - 0.42, TABLE.CR - 0.28, 0.01));
      ctx.setLineDash([9, 7]);
      ctx.strokeStyle = 'rgba(216,186,124,0.5)'; ctx.lineWidth = 1.7; ctx.stroke();
      ctx.setLineDash([]);
    }
    if (th.beach) drawBeach(now);
    if (th.nest) drawNest(now);
    if (th.bench) drawBench();
    if (th.glade) drawGlade(now);
    if (th.hearth) drawHearth(now);
    if (th.magma) drawMagma(now);
    // theme decorations
    if (th.candle) {
      const fl = stage.anim ? (0.05 * Math.sin(now / 160) + 0.03 * Math.sin(now / 47)) : 0;
      pathW(P.innerBase);
      const cg = ctx.createRadialGradient(c0.x, c0.y - 20, 20, c0.x, c0.y - 20, 320);
      cg.addColorStop(0, `rgba(224,180,92,${0.30 + fl})`);
      cg.addColorStop(1, 'rgba(224,180,92,0)');
      ctx.fillStyle = cg; ctx.fill();
    }
    if (th.fleurons) {
      const { INW, IND } = TABLE;
      const spots = [
        [-INW + 1.05, -IND + 0.85, -TAU / 8 + Math.PI],
        [INW - 1.05, -IND + 0.85, TAU / 8 + Math.PI],
        [-INW + 1.05, IND - 0.85, TAU / 8],
        [INW - 1.05, IND - 0.85, -TAU / 8]
      ];
      spots.forEach(([x, z, rot]) => floorText('❧', x, z, rot, 0.95, 'rgba(199,161,78,0.55)', '400 40px serif'));
    }
    if (th.runes) {
      const R = 2.55;
      RUNES.forEach((r, i) => {
        const a = i / RUNES.length * TAU - Math.PI / 2;
        floorText(r, Math.cos(a) * R, Math.sin(a) * R * 0.92, a + Math.PI / 2, 0.62, 'rgba(206,196,164,0.4)', '400 40px Cinzel, serif');
      });
      [2.02, 3.05].forEach(rr => {
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const a = i / 48 * TAU;
          const s = proj([Math.cos(a) * rr, 0.015, Math.sin(a) * rr * 0.92]);
          i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
        }
        ctx.strokeStyle = 'rgba(206,196,164,0.26)'; ctx.lineWidth = 1.4; ctx.stroke();
      });
    }
    if (th.frames) {
      pathW(roundRectPts(TABLE.INW - 0.72, TABLE.IND - 0.72, TABLE.CR - 0.4, 0.012));
      ctx.strokeStyle = 'rgba(199,161,78,0.5)'; ctx.lineWidth = 2.2; ctx.stroke();
      pathW(roundRectPts(TABLE.INW - 1.02, TABLE.IND - 1.02, TABLE.CR - 0.5, 0.012));
      ctx.strokeStyle = 'rgba(240,230,210,0.22)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  /* ---------- the rocky beach ---------- */
  function surfPath(t, inset) {
    // polygon covering the water: far wall down to the animated surf line
    ctx.beginPath();
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const x = -TABLE.INW - 1 + (i / N) * (TABLE.INW * 2 + 2);
      const s = proj([x, 0.012, surfLine(x, t) + (inset || 0)]);
      i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
    }
    const c1 = proj([TABLE.INW + 1, 0.012, -TABLE.IND - 1.5]);
    const c2 = proj([-TABLE.INW - 1, 0.012, -TABLE.IND - 1.5]);
    ctx.lineTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y);
    ctx.closePath();
  }
  function drawPebble(pb, t) {
    const wet = pb.z < surfLine(pb.x, t);
    // foam collar where a stone breaks the surf
    if (wet) {
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const a = i / 10 * TAU;
        const s = proj([pb.x + Math.cos(a) * pb.r * 1.45, 0.014, pb.z + Math.sin(a) * pb.r * 1.45 * pb.squish]);
        i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(250,255,252,${0.35 + 0.15 * Math.sin(t / 640 + pb.rot * 4)})`;
      ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.beginPath();
    pb.wob.forEach((w, i) => {
      const a = pb.rot + i / 8 * TAU;
      const s = proj([pb.x + Math.cos(a) * pb.r * w, 0.02, pb.z + Math.sin(a) * pb.r * w * pb.squish]);
      i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.fillStyle = wet ? shadeHex(pb.tone, -0.22) : pb.tone;
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,18,0.45)'; ctx.lineWidth = 1.1; ctx.stroke();
    // sunlit top edge
    const hl = proj([pb.x - pb.r * 0.25, 0.03, pb.z - pb.r * 0.3 * pb.squish]);
    ctx.beginPath();
    ctx.arc(hl.x, hl.y, Math.max(1.4, pb.r * 9), 0, TAU);
    ctx.fillStyle = wet ? 'rgba(235,245,240,0.20)' : 'rgba(248,240,220,0.28)';
    ctx.fill();
  }
  function drawBeach(now) {
    ctx.save();
    pathW(tablePaths().innerBase); ctx.clip();
    // wet sand — a darker band the retreating water has soaked, lagging past the surf
    surfPath(now, 0.55);
    ctx.fillStyle = 'rgba(96,74,48,0.32)'; ctx.fill();
    // the water itself
    surfPath(now, 0);
    ctx.fillStyle = 'rgba(24,84,106,0.46)'; ctx.fill();
    surfPath(now, 0);
    const cw = proj([0, 0, -TABLE.IND]);
    const wg = ctx.createLinearGradient(cw.x, cw.y, cw.x, cw.y + 150);
    wg.addColorStop(0, 'rgba(14,50,79,0.34)'); wg.addColorStop(1, 'rgba(47,160,147,0.10)');
    ctx.fillStyle = wg; ctx.fill();
    // sea-light: refracted caustic webs wandering over the flooded sand
    ctx.save();
    surfPath(now, 0); ctx.clip();
    let cs = 977;
    const crand = () => (cs = (cs * 48271) % 2147483647) / 2147483647;
    for (let i = 0; i < 16; i++) {
      const bx = -TABLE.INW + crand() * TABLE.INW * 2;
      const bz = -TABLE.IND + 0.25 + crand() * (TABLE.IND * 0.75);
      const len = 0.5 + crand() * 0.9, ph = crand() * TAU;
      const drift = 0.14 * Math.sin(now / 1300 + ph * 2);
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) {
        const x = bx + (k / 8 - 0.5) * len + drift;
        const z = bz + 0.16 * Math.sin(k * 1.4 + ph + now / 700);
        const s = proj([x, 0.014, z]);
        k === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
      }
      ctx.strokeStyle = `rgba(198,240,228,${0.07 + 0.07 * Math.abs(Math.sin(now / 620 + ph))})`;
      ctx.lineWidth = 1.6; ctx.stroke();
    }
    ctx.restore();
    // the foam line of the surf
    ctx.beginPath();
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const x = -TABLE.INW - 1 + (i / N) * (TABLE.INW * 2 + 2);
      const s = proj([x, 0.016, surfLine(x, now)]);
      i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
    }
    ctx.strokeStyle = 'rgba(250,255,252,0.75)'; ctx.lineWidth = 2.6; ctx.stroke();
    // scattered foam flecks trailing the line
    for (let i = 0; i < 14; i++) {
      const x = -TABLE.INW + 0.4 + (i / 13) * (TABLE.INW * 2 - 0.8);
      const jig = Math.sin(i * 3.7 + now / 720);
      const s = proj([x + jig * 0.12, 0.016, surfLine(x, now) + 0.14 + 0.09 * Math.abs(jig)]);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.4 + Math.abs(jig) * 1.6, 0, TAU);
      ctx.fillStyle = `rgba(250,255,252,${0.28 + 0.2 * Math.abs(Math.sin(i + now / 900))})`;
      ctx.fill();
    }
    // the stones
    BEACH_PEBBLES.forEach(pb => drawPebble(pb, now));
    ctx.restore();
  }

  /* ---------- the nest (Kree) ---------- */
  function glint(sx, sy, r, a) {
    if (a <= 0.02) return;
    ctx.strokeStyle = `rgba(255,246,214,${a})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx - r, sy); ctx.lineTo(sx + r, sy);
    ctx.moveTo(sx, sy - r); ctx.lineTo(sx, sy + r);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(0.8, r * 0.22), 0, TAU);
    ctx.fillStyle = `rgba(255,250,230,${a})`; ctx.fill();
  }
  function drawNest(now) {
    ctx.save();
    pathW(tablePaths().innerBase); ctx.clip();
    // the woven twig ring
    NEST_TWIGS.forEach(tw => {
      const dx = Math.cos(tw.ang) * tw.len / 2, dz = Math.sin(tw.ang) * tw.len / 2;
      const s0 = proj([tw.x - dx, 0.02, tw.z - dz]), s1 = proj([tw.x + dx, 0.02, tw.z + dz]);
      ctx.strokeStyle = tw.tone; ctx.lineWidth = tw.w;
      ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
    });
    // treasures tucked into the weave
    NEST_SHINIES.forEach(it => {
      const s = proj([it.x, 0.02, it.z]);
      const e = proj([it.x + it.r, 0.02, it.z]);
      const r = Math.max(2.5, Math.hypot(e.x - s.x, e.y - s.y));
      if (it.kind === 'ring') {
        ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.8, 0, TAU);
        ctx.strokeStyle = '#D9B75A'; ctx.lineWidth = 2.4; ctx.stroke();
      } else if (it.kind === 'gem') {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - r); ctx.lineTo(s.x + r * 0.8, s.y); ctx.lineTo(s.x, s.y + r); ctx.lineTo(s.x - r * 0.8, s.y);
        ctx.closePath(); ctx.fillStyle = '#3E6FA8'; ctx.fill();
        ctx.strokeStyle = 'rgba(20,20,30,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      } else if (it.kind === 'button') {
        ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.85, 0, TAU);
        ctx.fillStyle = '#8A7B66'; ctx.fill();
        ctx.strokeStyle = 'rgba(30,24,14,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
        [[-0.3, 0], [0.3, 0]].forEach(([ox]) => {
          ctx.beginPath(); ctx.arc(s.x + ox * r, s.y, 1, 0, TAU); ctx.fillStyle = 'rgba(30,24,14,0.7)'; ctx.fill();
        });
      } else { // coin / bead
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, r * 0.9, r * 0.62, it.rot, 0, TAU);
        ctx.fillStyle = it.kind === 'bead' ? '#7A4A3A' : '#D9B75A'; ctx.fill();
        ctx.strokeStyle = 'rgba(40,30,10,0.55)'; ctx.lineWidth = 1.1; ctx.stroke();
      }
      // each treasure twinkles in its own time
      const tw = Math.max(0, Math.sin(now / 640 + it.ph)) ** 6;
      glint(s.x + r * 0.4, s.y - r * 0.4, 3 + r * 0.25, 0.75 * tw);
    });
    ctx.restore();
  }

  /* ---------- the workbench (Wilhelm) ---------- */
  function drawBench() {
    ctx.save();
    pathW(tablePaths().innerBase); ctx.clip();
    // plank seams
    for (let k = -2; k <= 2; k++) {
      const z = k * (TABLE.IND * 0.4);
      const s0 = proj([-TABLE.INW - 1, 0.012, z]), s1 = proj([TABLE.INW + 1, 0.012, z]);
      ctx.strokeStyle = 'rgba(38,28,14,0.5)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
      // grain
      for (let g = 0; g < 5; g++) {
        const gx = -TABLE.INW + 0.6 + g * (TABLE.INW * 2 - 1.2) / 4 + (k + 2) * 0.37;
        const gs = proj([gx, 0.012, z + 0.5]), ge = proj([gx + 0.9, 0.012, z + 1.1]);
        ctx.strokeStyle = 'rgba(48,36,18,0.28)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gs.x, gs.y); ctx.lineTo(ge.x, ge.y); ctx.stroke();
      }
    }
    // a chalked schematic, half-erased by work
    ctx.strokeStyle = 'rgba(238,232,214,0.30)'; ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const a = i / 30 * TAU;
      const s = proj([-TABLE.INW + 1.7 + Math.cos(a) * 1.15, 0.013, -TABLE.IND + 1.5 + Math.sin(a) * 1.05]);
      i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const c1 = proj([-TABLE.INW + 1.7, 0.013, -TABLE.IND + 1.5]);
    const c2 = proj([-TABLE.INW + 3.6, 0.013, -TABLE.IND + 2.1]);
    ctx.strokeStyle = 'rgba(238,232,214,0.22)';
    ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
    floorText('§ fig. 12', -TABLE.INW + 3.9, -TABLE.IND + 2.3, 0.06, 0.5, 'rgba(238,232,214,0.30)', 'italic 26px Georgia, serif');
    // loose cogs and screws
    BENCH_COGS.forEach(cg => {
      const s = proj([cg.x, 0.02, cg.z]);
      const e = proj([cg.x + cg.r, 0.02, cg.z]);
      const r = Math.max(4, Math.hypot(e.x - s.x, e.y - s.y));
      ctx.beginPath();
      for (let tth = 0; tth < cg.teeth * 2; tth++) {
        const a = cg.rot + tth / (cg.teeth * 2) * TAU;
        const rr = tth % 2 === 0 ? r : r * 0.78;
        const x = s.x + Math.cos(a) * rr, y = s.y + Math.sin(a) * rr * 0.72;
        tth === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = cg.tone; ctx.fill();
      ctx.strokeStyle = 'rgba(24,18,8,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.3, 0, TAU);
      ctx.fillStyle = 'rgba(30,22,10,0.8)'; ctx.fill();
    });
    ctx.restore();
  }

  /* ---------- the moonlit glade (Kenra) ---------- */
  function drawGlade(now) {
    ctx.save();
    pathW(tablePaths().innerBase); ctx.clip();
    // the moonbeam, breathing slowly
    const breathe = 0.11 + 0.035 * Math.sin(now / 2600);
    const mb = proj([-1.2, 0.012, -0.6]);
    const mg = ctx.createRadialGradient(mb.x, mb.y, 30, mb.x, mb.y, 300);
    mg.addColorStop(0, `rgba(222,226,255,${breathe})`);
    mg.addColorStop(0.6, `rgba(222,226,255,${breathe * 0.45})`);
    mg.addColorStop(1, 'rgba(222,226,255,0)');
    pathW(tablePaths().innerBase);
    ctx.fillStyle = mg; ctx.fill();
    // soft undergrowth shadows at the edges
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + 0.4;
      const s = proj([Math.cos(a) * (TABLE.INW - 0.7), 0.012, Math.sin(a) * (TABLE.IND - 0.6)]);
      const fg = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, 60);
      fg.addColorStop(0, 'rgba(10,16,12,0.30)');
      fg.addColorStop(1, 'rgba(10,16,12,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(s.x - 60, s.y - 60, 120, 120);
    }
    // fireflies on their slow errands
    GLADE_FLIES.forEach(fl => {
      const x = fl.x + 0.55 * Math.sin(now / (1900 / fl.sp) + fl.ph);
      const z = fl.z + 0.4 * Math.cos(now / (2300 / fl.sp) + fl.ph * 2);
      const s = proj([x, 0.25 + 0.12 * Math.sin(now / 900 + fl.ph), z]);
      const pulse = Math.max(0, Math.sin(now / 800 + fl.ph * 3)) ** 3;
      if (pulse < 0.05) return;
      const fg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 7);
      fg.addColorStop(0, `rgba(255,242,168,${0.85 * pulse})`);
      fg.addColorStop(0.4, `rgba(255,232,140,${0.35 * pulse})`);
      fg.addColorStop(1, 'rgba(255,232,140,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(s.x - 7, s.y - 7, 14, 14);
    });
    ctx.restore();
  }

  /* ---------- the hearth (the ashlings) ---------- */
  function drawHearth(now) {
    ctx.save();
    pathW(tablePaths().innerBase); ctx.clip();
    // worn hearthstone tiles
    ctx.strokeStyle = 'rgba(58,44,34,0.35)'; ctx.lineWidth = 1.8;
    [-TABLE.INW * 0.34, TABLE.INW * 0.34].forEach(x => {
      const s0 = proj([x, 0.012, -TABLE.IND - 1]), s1 = proj([x, 0.012, TABLE.IND + 1]);
      ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
    });
    [0].forEach(z => {
      const s0 = proj([-TABLE.INW - 1, 0.012, z]), s1 = proj([TABLE.INW + 1, 0.012, z]);
      ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
    });
    // drifts of soft pale ash
    HEARTH_DRIFTS.forEach(dr => {
      const s = proj([dr.x, 0.013, dr.z]);
      const e = proj([dr.x + dr.r, 0.013, dr.z]);
      const r = Math.hypot(e.x - s.x, e.y - s.y);
      const g = ctx.createRadialGradient(s.x, s.y, r * 0.15, s.x, s.y, r);
      g.addColorStop(0, `rgba(214,204,192,${dr.a})`);
      g.addColorStop(1, 'rgba(214,204,192,0)');
      ctx.fillStyle = g;
      ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
    });
    // small footprints wandering through the dust
    HEARTH_PRINTS.forEach(pr => {
      const s = proj([pr.x, 0.014, pr.z]);
      ctx.save();
      ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(Math.sin(pr.ang), Math.cos(pr.ang)) * 0.4);
      ctx.beginPath(); ctx.ellipse(0, 0, 2.1, 3, 0, 0, TAU);
      ctx.fillStyle = 'rgba(66,52,42,0.34)'; ctx.fill();
      [[-1, -3.6], [0, -4.1], [1, -3.6]].forEach(([ox, oy]) => {
        ctx.beginPath(); ctx.arc(ox * 1.4, oy, 0.8, 0, TAU); ctx.fill();
      });
      ctx.restore();
    });
    // the fire is off somewhere to the left, and its light reaches this far
    const hl = proj([-TABLE.INW + 0.4, 0.012, -TABLE.IND + 0.6]);
    const warm = 0.11 + 0.035 * Math.sin(now / 700) + 0.02 * Math.sin(now / 233);
    const hg = ctx.createRadialGradient(hl.x, hl.y, 30, hl.x, hl.y, 420);
    hg.addColorStop(0, `rgba(255,164,84,${warm})`);
    hg.addColorStop(0.55, `rgba(255,140,70,${warm * 0.4})`);
    hg.addColorStop(1, 'rgba(255,140,70,0)');
    pathW(tablePaths().innerBase);
    ctx.fillStyle = hg; ctx.fill();
    // motes of dust and the occasional tiny ember, drifting up through the light
    HEARTH_MOTES.forEach(mt => {
      const cycle = (now / (5200 / mt.sp) + mt.ph) % 1;
      const h = 0.05 + cycle * 1.5;
      const x = mt.x + 0.3 * Math.sin(now / 1700 + mt.ph * 3);
      const s = proj([x, h, mt.z]);
      const a = (1 - cycle) * (mt.warm ? 0.5 : 0.3) * Math.min(1, cycle * 8);
      if (a <= 0.02) return;
      ctx.beginPath(); ctx.arc(s.x, s.y, mt.warm ? 1.6 : 1.1, 0, TAU);
      ctx.fillStyle = mt.warm ? `rgba(255,180,110,${a})` : `rgba(226,216,200,${a})`;
      ctx.fill();
    });
    ctx.restore();
  }

  /* ---------- the old hearth hall (the salamander) ---------- */
  function drawMagma(now) {
    ctx.save();
    pathW(tablePaths().innerBase); ctx.clip();
    // living cracks in the basalt
    MAGMA_CRACKS.forEach(cr => {
      const pulse = 0.55 + 0.45 * Math.sin(now / 1100 + cr.ph);
      [[7, `rgba(255,60,20,${0.14 * pulse})`], [3, `rgba(255,110,40,${0.42 * pulse})`], [1.3, `rgba(255,196,96,${0.75 * pulse})`]].forEach(([lw, col]) => {
        ctx.beginPath();
        cr.pts.forEach(([x, z], i) => { const s = proj([x, 0.013, z]); i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y); });
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      });
    });
    // pools where the stone gave up
    MAGMA_POOLS.forEach(pl => {
      const s = proj([pl.x, 0.013, pl.z]);
      const e = proj([pl.x + pl.r, 0.013, pl.z]);
      const r = Math.hypot(e.x - s.x, e.y - s.y);
      const pulse = 0.6 + 0.4 * Math.sin(now / 900 + pl.ph);
      const g = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, r);
      g.addColorStop(0, `rgba(255,208,110,${0.85 * pulse})`);
      g.addColorStop(0.45, `rgba(255,110,40,${0.6 * pulse})`);
      g.addColorStop(1, 'rgba(180,50,20,0)');
      ctx.beginPath(); ctx.ellipse(s.x, s.y, r, r * 0.72, 0, 0, TAU);
      ctx.fillStyle = g; ctx.fill();
    });
    // the chains that were meant to bind
    MAGMA_CHAINS.forEach(ch => {
      const sA = proj([ch.a[0], 0.05, ch.a[1]]), sB = proj([ch.b[0], 0.05, ch.b[1]]);
      const L = Math.hypot(sB.x - sA.x, sB.y - sA.y);
      const links = Math.max(6, Math.round(L / 17));
      const ang = Math.atan2(sB.y - sA.y, sB.x - sA.x);
      for (let k = 0; k <= links; k++) {
        const u = k / links;
        const x = lerp(sA.x, sB.x, u), y = lerp(sA.y, sB.y, u) + Math.sin(u * Math.PI) * 3;
        const flat = k % 2 === 0;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(ang);
        ctx.beginPath();
        ctx.ellipse(0, 0, 8.5, flat ? 5.2 : 2.2, 0, 0, TAU);
        ctx.strokeStyle = 'rgba(30,30,36,0.9)'; ctx.lineWidth = 3.4; ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, -0.7, 8.5, flat ? 5.2 : 2.2, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.strokeStyle = 'rgba(196,186,196,0.28)'; ctx.lineWidth = 1.3; ctx.stroke();
        // magma-light licking the underside of every link
        ctx.beginPath();
        ctx.ellipse(0, 0.8, 8.5, flat ? 5.2 : 2.2, 0, Math.PI * 0.1, Math.PI * 0.9);
        ctx.strokeStyle = `rgba(255,120,50,${0.16 + 0.1 * Math.sin(now / 950 + k)})`; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.restore();
      }
    });
    // sparks on the updraft
    MAGMA_SPARKS.forEach(sp => {
      const cycle = (now / (2600 / sp.sp) + sp.ph) % 1;
      const h = 0.05 + cycle * 1.9;
      const x = sp.x + 0.22 * Math.sin(now / 600 + sp.ph * 4);
      const s = proj([x, h, sp.z]);
      const a = (1 - cycle) * 0.75 * Math.min(1, cycle * 9);
      if (a <= 0.02) return;
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.3 + (1 - cycle), 0, TAU);
      ctx.fillStyle = `rgba(255,${Math.round(150 + 60 * cycle)},70,${a})`;
      ctx.fill();
    });
    ctx.restore();
  }

  /* ---------- ripples (the Rising Tide) ---------- */
  function spawnRipple(x, z, strength) {
    stage.ripples.push({ x, z, t0: performance.now(), s: clamp(strength, 0.3, 1.2) });
    if (stage.ripples.length > 14) stage.ripples.shift();
  }
  function drawRipples(now) {
    if (!stage.ripples.length) return;
    stage.ripples = stage.ripples.filter(r => now - r.t0 < 1300);
    stage.ripples.forEach(r => {
      const p = (now - r.t0) / 1300;
      [0, 0.22].forEach(off => {
        const pp = clamp(p - off, 0, 1);
        if (pp <= 0) return;
        const rad = (0.28 + 2.1 * pp) * r.s;
        ctx.beginPath();
        for (let i = 0; i <= 22; i++) {
          const a = i / 22 * TAU;
          const s = proj([r.x + Math.cos(a) * rad, 0.015, r.z + Math.sin(a) * rad * 0.92]);
          i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
        }
        ctx.strokeStyle = `rgba(170,228,220,${0.38 * (1 - pp) * r.s})`;
        ctx.lineWidth = 2.2 * (1 - pp) + 0.6;
        ctx.stroke();
      });
    });
  }

  /* the water that left the die, spreading across the tray */
  function drawTidePuddle(d, now) {
    if (!d.tidefx || d.tidefx.kind !== 'drain' || now < d.tidefx.t0) return;
    const p = clamp((now - d.tidefx.t0) / 1600, 0, 1);
    const e = easeOutCubic(p);
    const R = d.geo.R;
    const alpha = 0.42 * (1 - smooth(0.78, 1, p) * 0.5) * d.alpha;
    if (alpha <= 0.02) return;
    const rad = R * (0.5 + 2.3 * e);
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = i / 24 * TAU;
      const wob = 1 + 0.08 * Math.sin(a * 3 + now / 800) + 0.05 * Math.sin(a * 5 - now / 620);
      const s = proj([d.pos[0] + Math.cos(a) * rad * wob, 0.016, d.pos[2] + Math.sin(a) * rad * 0.9 * wob]);
      i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(36,110,132,${alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(250,255,252,${alpha * 0.9})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // the first spill, streaming down the near face
    if (p < 0.5) {
      const ta = (1 - p / 0.5) * 0.55 * d.alpha;
      for (let k = -1; k <= 1; k++) {
        const s0 = proj([d.pos[0] + k * R * 0.24, Math.max(0.05, d.pos[1] - R * 0.1), d.pos[2] + R * 0.5]);
        const s1 = proj([d.pos[0] + k * R * 0.3, 0.02, d.pos[2] + R * (0.62 + 0.2 * Math.abs(k))]);
        ctx.strokeStyle = `rgba(120,205,205,${ta})`;
        ctx.lineWidth = 2 - Math.abs(k) * 0.6;
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
      }
    }
  }

  function drawFrontRim() {
    const P = tablePaths();
    const zi = TABLE.IND - TABLE.CR * 0.45;
    const zo = TABLE.IND + TABLE.WT - (TABLE.CR + TABLE.WT * 0.6) * 0.45;
    const innerRun = P.innerTop.filter(p => p[2] >= zi);
    const outerRun = P.outerTop.filter(p => p[2] >= zo);
    const outerBaseRun = P.outerBase.filter(p => p[2] >= zo);
    if (innerRun.length < 2 || outerRun.length < 2) return;
    // top of front wall
    ctx.beginPath();
    innerRun.forEach((p, i) => { const s = proj(p); i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y); });
    outerRun.slice().reverse().forEach(p => { const s = proj(p); ctx.lineTo(s.x, s.y); });
    ctx.closePath(); ctx.fillStyle = WOOD_TOP; ctx.fill();
    ctx.strokeStyle = 'rgba(28,21,12,0.4)'; ctx.lineWidth = 1.2; ctx.stroke();
    // outer front side
    ctx.beginPath();
    outerRun.forEach((p, i) => { const s = proj(p); i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y); });
    outerBaseRun.slice().reverse().forEach(p => { const s = proj(p); ctx.lineTo(s.x, s.y); });
    ctx.closePath(); ctx.fillStyle = WOOD_SIDE; ctx.fill();
  }

  /* ---------- dice drawing ---------- */
  function drawShadow(die) {
    const [px, py, pz] = die.pos;
    const tide = die.color && die.color.special === 'tide';
    const pearl = tide && die.pearl;
    const a = 0.3 * clamp(1 - py / 5.5, 0.05, 1) * die.alpha;
    const r = die.geo.R * 0.78 * (1 + py * 0.04);
    // translucent sea-glass passes blue-green light: its shadow runs cold
    const base = pearl ? 'rgba(66,62,84,' : tide ? 'rgba(14,46,82,' : 'rgba(26,17,8,';
    [[1.25, 0.45], [0.8, 1]].forEach(([rs, as]) => {
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const ang = i / 14 * TAU;
        const s = proj([px + Math.cos(ang) * r * rs, 0.02, pz + Math.sin(ang) * r * rs]);
        i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
      }
      ctx.fillStyle = `${base}${a * as * (tide ? 1.25 : 1)})`;
      ctx.fill();
    });
    if (tide) {
      // refraction caustic: the lens of the die focuses light to a bright
      // spot inside its own shadow, displaced along the light's slant
      const off = vScale(vNorm([-LIGHT[0], 0, -LIGHT[2]]), r * 0.34);
      const c = proj([px + off[0], 0.021, pz + off[2]]);
      const e = proj([px + off[0] + r * 0.5, 0.021, pz + off[2]]);
      const sr = Math.max(3, Math.hypot(e.x - c.x, e.y - c.y));
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, sr);
      const glow = pearl ? '255,244,228' : '150,232,214';
      g.addColorStop(0, `rgba(${glow},${0.5 * a * 2.2})`);
      g.addColorStop(0.55, `rgba(${glow},${0.18 * a * 2.2})`);
      g.addColorStop(1, `rgba(${glow},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(c.x - sr, c.y - sr, sr * 2, sr * 2);
    }
  }
  /* clip one face's world polygon to the half-space below the die's water
     plane; returns the submerged part and the waterline crossing points */
  function clipBelowWater(pts, px, pz, wl, tx, tz) {
    const inside = v => (wl + tx * (v[0] - px) + tz * (v[2] - pz)) - v[1];
    const below = [], edge = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const fa = inside(a), fb = inside(b);
      if (fa >= 0) below.push(a);
      if ((fa >= 0) !== (fb >= 0)) {
        const t = fa / (fa - fb);
        const p = vLerp(a, b, t);
        below.push(p); edge.push(p);
      }
    }
    return { below, edge };
  }
  /* a segmented, gently animated waterline between two world points —
     pinned at the ends so it never leaves the face it belongs to */
  function wavyLine(pA, pB, t, phase, amp) {
    const sA = proj(pA), sB = proj(pB);
    const dx = sB.x - sA.x, dy = sB.y - sA.y;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const K = Math.max(5, Math.min(9, Math.round(L / 9)));
    ctx.beginPath();
    for (let k = 0; k <= K; k++) {
      const u = k / K;
      const env = Math.sin(u * Math.PI);
      const off = amp * env * (Math.sin(u * 9.5 + t / 260 + phase) + 0.5 * Math.sin(u * 17 - t / 170 + phase * 2));
      const x = sA.x + dx * u + nx * off, y = sA.y + dy * u + ny * off;
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    return { sA, sB, nx, ny };
  }
  function drawDie(die, now) {
    const { geo, color } = die;
    const special = color && color.special;
    const tide = special === 'tide';
    const pearl = tide && die.pearl;
    const glassy = tide && !die.cracked && die.slosh; // the pearl is nacre-glass too — the tide lives in her
    const sig = !!die.sig;
    let ink, numColor;
    if (tide) { ink = pearl ? TIDE.pearlInk : TIDE.ink; numColor = TIDE.num; }
    else if (special === 'hoard') { ink = sig ? HOARD.gildInk : HOARD.ink; numColor = sig ? HOARD.gildNum : HOARD.num; }
    else if (special === 'works') { ink = sig ? WORKS.protoInk : WORKS.ink; numColor = sig ? WORKS.protoNum : WORKS.num; }
    else if (special === 'moon') { ink = sig ? MOON.moonInk : MOON.ink; numColor = sig ? MOON.moonNum : MOON.num; }
    else if (special === 'ash') { ink = sig ? ASH.bopInk : ASH.ink; numColor = sig ? ASH.bopNum : ASH.num; }
    else if (special === 'cinder') { ink = sig ? CINDER.moltenInk : CINDER.ink; numColor = sig ? CINDER.moltenNum : CINDER.num; }
    else { ink = color.light ? '#4A3B24' : '#241A0E'; numColor = color.light ? '#2C2417' : '#FBF6E9'; }
    // the tide's fated moments: glowing water on a 20, water draining out on a 1
    let glowK = 0, drainK = 0;
    if (die.tidefx) {
      const fp = clamp(((now || performance.now()) - die.tidefx.t0) / 1400, 0, 1);
      if (die.tidefx.kind === 'glow') glowK = smooth(0, 0.4, fp);
      if (die.tidefx.kind === 'drain') drainK = fp;
    }
    ctx.globalAlpha = die.alpha;
    const wv = geo.verts.map(v => vAdd(qRotate(v, die.quat), die.pos));
    const sv = wv.map(proj);
    const allFaces = geo.faces.map(f => ({ f, nW: qRotate(f.n, die.quat), cW: vAdd(qRotate(f.c, die.quat), die.pos) }));
    const facing = o => vDot(o.nW, vSub(o.cW, CAM.eye)) < -1e-4;
    const faces = allFaces.filter(facing);
    const sl = die.slosh;
    const facePath = f => {
      ctx.beginPath();
      f.idx.forEach((vi, i) => { i === 0 ? ctx.moveTo(sv[vi].x, sv[vi].y) : ctx.lineTo(sv[vi].x, sv[vi].y); });
      ctx.closePath();
    };

    /* ---- transparent sea-glass: the bottle treatment ---- */
    if (glassy) {
      const t = now || performance.now();
      const px = die.pos[0], pz = die.pos[2];
      const wl = die.pos[1] + geo.R * (sl.lvl != null ? sl.lvl : -0.04);
      const back = allFaces.filter(o => !facing(o));
      const glassTint = (o, a) => {
        const d = vDot(o.nW, LIGHT);
        if (pearl) {
          const irid = mixHex(mixHex('#EBD9D6', '#DAE8DC', (o.nW[0] + 1) / 2), '#DAE1EE', (o.nW[2] + 1) / 2);
          return hexRgba(shadeHex(mixHex(TIDE.pearlBase, irid, 0.6), lerp(-0.04, 0.22, (d + 1) / 2)), a * 2.1);
        }
        const h = clamp((o.cW[1] - die.pos[1]) / geo.R, -1, 1);
        return hexRgba(shadeHex(mixHex(TIDE.abyss, TIDE.teal, (h + 1) / 2), lerp(-0.08, 0.30, (d + 1) / 2)), a);
      };
      // the water's colours, lifted toward light when the tide favors you
      const wBack = `rgba(${Math.round(lerp(22, 96, glowK))},${Math.round(lerp(74, 216, glowK))},${Math.round(lerp(104, 198, glowK))},0.42)`;
      const wFront = `rgba(${Math.round(lerp(16, 120, glowK))},${Math.round(lerp(62, 232, glowK))},${Math.round(lerp(96, 210, glowK))},${0.34 + 0.2 * glowK})`;
      const wSurf = `rgba(${Math.round(lerp(150, 205, glowK))},${Math.round(lerp(225, 252, glowK))},${Math.round(lerp(215, 238, glowK))},${0.36 + 0.24 * glowK})`;
      const crossings = [];
      // the far wall of the glass, seen through the body
      back.forEach(o => { facePath(o.f); ctx.fillStyle = glassTint(o, 0.16); ctx.fill(); });
      // water lying against the far wall
      back.forEach(o => {
        const cut = clipBelowWater(o.f.idx.map(vi => wv[vi]), px, pz, wl, sl.tx, sl.tz);
        if (cut.below.length >= 3) {
          ctx.beginPath();
          cut.below.forEach((p, i) => { const s = proj(p); i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y); });
          ctx.closePath();
          ctx.fillStyle = wBack; ctx.fill();
        }
        cut.edge.forEach(p => crossings.push(p));
      });
      // the living surface: two traveling waves, fed by the die's motion.
      // world-based, so the swell lines up across every face of the glass
      const energy = clamp(Math.max(sl.energy != null ? sl.energy : 0.2, 0.14), 0, 1.4);
      const drainMute = die.tidefx && die.tidefx.kind === 'drain' ? 0.35 : 1;
      const wAmp = geo.R * (0.02 + 0.075 * energy) * drainMute;
      const tw = now || performance.now();
      const waveAt = p => {
        const dx = p[0] - px, dz = p[2] - pz;
        return wAmp * (
          0.62 * Math.sin(dx * 3.1 + dz * 2.2 + tw / 300 + (sl.phase || 0) * 2) +
          0.38 * Math.sin(dx * -2.4 + dz * 3.5 - tw / 210 + (sl.phase || 0) * 3.4)
        );
      };
      const projWave = p => proj([p[0], p[1] + waveAt(p), p[2]]);
      // while the die tumbles, the clean surface gives way to churn
      const churn = clamp(sl.churn || 0, 0, 1);
      const surfAlpha = 1 - smooth(0.28, 0.62, churn);
      // the water's open surface — the cross-section of the whole die
      const frontCuts = faces.map(o => clipBelowWater(o.f.idx.map(vi => wv[vi]), px, pz, wl, sl.tx, sl.tz));
      frontCuts.forEach(c => c.edge.forEach(p => crossings.push(p)));
      if (crossings.length >= 3 && surfAlpha > 0.03) {
        ctx.save();
        ctx.globalAlpha = die.alpha * surfAlpha;
        const c0 = crossings.reduce((a, p) => vAdd(a, p), [0, 0, 0]).map(v => v / crossings.length);
        const pts = crossings.slice().sort((A, B) =>
          Math.atan2(A[2] - c0[2], A[0] - c0[0]) - Math.atan2(B[2] - c0[2], B[0] - c0[0]));
        ctx.beginPath();
        // subdivide the rim so the swell rounds it instead of tenting it
        pts.forEach((p, i) => {
          const q = pts[(i + 1) % pts.length];
          for (let k2 = 0; k2 < 3; k2++) {
            const s = projWave(vLerp(p, q, k2 / 3));
            (i === 0 && k2 === 0) ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
          }
        });
        ctx.closePath();
        ctx.fillStyle = wSurf; ctx.fill();
        // a gleam sliding along the swell
        const pA = pts[0], pB = pts[Math.floor(pts.length / 2)];
        ctx.beginPath();
        for (let k2 = 0; k2 <= 8; k2++) {
          const s = projWave(vLerp(pA, pB, k2 / 8));
          k2 === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
        }
        ctx.strokeStyle = `rgba(224,252,246,${0.24 + 0.2 * energy + 0.3 * glowK})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }
      // water against the near glass
      frontCuts.forEach(cut => {
        if (cut.below.length < 3) return;
        ctx.beginPath();
        cut.below.forEach((p, i) => { const s = proj(p); i === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y); });
        ctx.closePath();
        ctx.fillStyle = wFront; ctx.fill();
      });
      // churning water: bubbles and swirl while the die tumbles
      if (churn > 0.12 && !die.cracked) {
        const planeAt = p => wl + sl.tx * (p[0] - px) + sl.tz * (p[2] - pz);
        const ca = 0.6 * churn * (0.75 + 0.25 * Math.sin(tw / 190));
        for (let k2 = 0; k2 < 8; k2++) {
          const swirl = (k2 % 2 ? 1 : -1);
          const angB = k2 * 0.785 + (tw / 340) * swirl + (sl.phase || 0);
          const rad = geo.R * (0.20 + 0.34 * ((k2 * 37 % 10) / 10));
          const by = -geo.R * 0.04 - geo.R * 0.3 * ((k2 * 53 % 10) / 10) + geo.R * 0.16 * Math.sin(tw / 240 + k2 * 2.1);
          const bp = [px + Math.cos(angB) * rad, die.pos[1] + by, pz + Math.sin(angB) * rad * 0.85];
          if (bp[1] > planeAt(bp)) continue; // only where the water is
          const s = proj(bp);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1 + (k2 % 3) * 0.6, 0, TAU);
          ctx.fillStyle = `rgba(230,250,246,${ca * (0.4 + 0.6 * ((k2 * 29 % 10) / 10))})`;
          ctx.fill();
          if (k2 % 3 === 0) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, 3.2 + (k2 % 4), angB, angB + 1.3);
            ctx.strokeStyle = `rgba(210,244,238,${ca * 0.5})`;
            ctx.lineWidth = 1.1;
            ctx.stroke();
          }
        }
      }
      // luminous water throws its light out through the glass
      if (glowK > 0.02) {
        const c = proj(die.pos);
        const e = proj(vAdd(die.pos, [geo.R, 0, 0]));
        const gr = Math.hypot(e.x - c.x, e.y - c.y) * (1.8 + 0.6 * glowK);
        const gg = ctx.createRadialGradient(c.x, c.y, gr * 0.2, c.x, c.y, gr);
        const pulse = 0.8 + 0.2 * Math.sin((now || 0) / 260);
        gg.addColorStop(0, `rgba(150,255,232,${0.34 * glowK * pulse * die.alpha})`);
        gg.addColorStop(1, 'rgba(150,255,232,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gg;
        ctx.fillRect(c.x - gr, c.y - gr, gr * 2, gr * 2);
        ctx.restore();
      }
      // the near glass itself — a breath of tint, like the bottle
      faces.forEach(o => { facePath(o.f); ctx.fillStyle = glassTint(o, 0.13); ctx.fill(); });
      // sun through glass: a soft sheen on the face turned to the light
      let lit = null;
      faces.forEach(o => { const d = vDot(o.nW, LIGHT); if (!lit || d > lit.d) lit = { o, d }; });
      if (lit && lit.d > 0.15) { facePath(lit.o.f); ctx.fillStyle = `rgba(255,255,250,${0.10 * lit.d})`; ctx.fill(); }
      // the foam line rides the same swell as the surface — no seams, no zips
      ctx.save();
      ctx.globalAlpha = die.alpha * surfAlpha;
      ctx.strokeStyle = 'rgba(250,255,252,0.8)'; ctx.lineWidth = 1.6;
      frontCuts.forEach((cut, i) => {
        if (cut.edge.length < 2) return;
        const A = cut.edge[0], B = cut.edge[1];
        ctx.beginPath();
        for (let k2 = 0; k2 <= 8; k2++) {
          const s = projWave(vLerp(A, B, k2 / 8));
          k2 === 0 ? ctx.moveTo(s.x, s.y) : ctx.lineTo(s.x, s.y);
        }
        ctx.stroke();
        // foam pips bobbing on the crests
        for (let k2 = 0; k2 < 2; k2++) {
          const u = 0.28 + 0.4 * k2 + 0.1 * Math.sin(t / 340 + k2 * 2.2 + i);
          const p = vLerp(A, B, u);
          const s = proj([p[0], p[1] + waveAt(p) + 0.02, p[2]]);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.1 + 0.5 * Math.sin(t / 230 + k2 * 3 + i), 0, TAU);
          ctx.fillStyle = 'rgba(250,255,252,0.7)'; ctx.fill();
        }
      });
      ctx.restore();
      // glass edges — light, so the water stays the star
      ctx.strokeStyle = hexRgba(TIDE.ink, 0.38); ctx.lineWidth = 1.4;
      faces.forEach(o => { facePath(o.f); ctx.stroke(); });
      drawDieLabels(faces, geo, die, sv, wv, numColor);
      ctx.globalAlpha = 1;
      return;
    }

    /* ---- opaque pipeline: the character sets and every plain colour ---- */
    const t = now || performance.now();
    // Bop glows ahead of himself — a warm little halo
    if (special === 'ash' && sig && !die.cracked) {
      const c = proj(die.pos);
      const e = proj(vAdd(die.pos, [geo.R, 0, 0]));
      const hr = Math.hypot(e.x - c.x, e.y - c.y) * 2.1;
      const hg = ctx.createRadialGradient(c.x, c.y, hr * 0.25, c.x, c.y, hr);
      const ha = 0.15 + 0.06 * Math.sin(t / 620);
      hg.addColorStop(0, `rgba(255,178,106,${ha * die.alpha})`);
      hg.addColorStop(1, 'rgba(255,178,106,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(c.x - hr, c.y - hr, hr * 2, hr * 2);
    }
    // the Moon die rises with its own halo
    if (special === 'moon' && sig && !die.cracked) {
      const c = proj(die.pos);
      const e = proj(vAdd(die.pos, [geo.R, 0, 0]));
      const hr = Math.hypot(e.x - c.x, e.y - c.y) * 2.4;
      const hg = ctx.createRadialGradient(c.x, c.y, hr * 0.3, c.x, c.y, hr);
      const ha = 0.16 + 0.05 * Math.sin(t / 1300);
      hg.addColorStop(0, `rgba(226,228,250,${ha * die.alpha})`);
      hg.addColorStop(1, 'rgba(226,228,250,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(c.x - hr, c.y - hr, hr * 2, hr * 2);
    }
    faces.forEach(({ f, nW, cW }) => {
      const d = vDot(nW, LIGHT);
      const ld = (d + 1) / 2;
      let fill;
      if (pearl) {
        // mother-of-pearl: the sheen drifts hue with the facet's direction
        const irid = mixHex(mixHex('#EBD9D6', '#DAE8DC', (nW[0] + 1) / 2), '#DAE1EE', (nW[2] + 1) / 2);
        fill = shadeHex(mixHex(TIDE.pearlBase, irid, 0.62), lerp(-0.10, 0.24, ld));
      } else if (tide) {
        const h = clamp((cW[1] - die.pos[1]) / geo.R, -1, 1);
        fill = shadeHex(mixHex(TIDE.abyss, TIDE.teal, (h + 1) / 2), lerp(-0.18, 0.22, ld));
      } else if (special === 'hoard') {
        if (sig) fill = shadeHex(HOARD.gild, lerp(-0.35, 0.42, ld)); // the gilded prize
        else {
          // magpie feathers: green-violet-blue sheen turning with each facet
          const irid = mixHex(mixHex('#2C4636', '#3A2144', (nW[0] + 1) / 2), '#22355C', (nW[2] + 1) / 2);
          fill = shadeHex(mixHex(HOARD.base, irid, 0.52), lerp(-0.22, 0.34, ld));
        }
      } else if (special === 'works') {
        // machined metal: hard light, hard shade
        fill = shadeHex(sig ? WORKS.proto : WORKS.base, lerp(-0.38, 0.44, ld));
      } else if (special === 'moon') {
        if (sig) fill = shadeHex(MOON.moon, lerp(-0.07, 0.11, ld));
        else {
          // a borrowed colour, silvering and dimming with the moon's slow breath
          const shimmer = 0.5 + 0.5 * Math.sin(t / 1400 + (die._ph || 0));
          const base = mixHex(die._tint || MOON.tints[0], '#8E8AA8', 0.10 + 0.14 * shimmer);
          fill = shadeHex(base, lerp(-0.20, 0.24, ld));
        }
      } else if (special === 'ash') {
        // a banked coal: dark crust, warmth breathing beneath it
        const breathe = 0.5 + 0.5 * Math.sin(t / (sig ? 620 : 980) + (die._ph || 0) * 2);
        const base = mixHex(sig ? ASH.bop : ASH.base, '#B4542A', (sig ? 0.24 : 0.10) + (sig ? 0.22 : 0.12) * breathe);
        fill = shadeHex(base, lerp(-0.18, 0.26, ld));
      } else if (special === 'cinder') {
        // black crust over living magma
        const surge = 0.5 + 0.5 * Math.sin(t / 760 + (die._ph || 0) * 3);
        const base = sig ? mixHex(CINDER.molten, '#E4491F', 0.3 + 0.3 * surge)
                         : mixHex(CINDER.base, '#7A2E14', 0.10 + 0.10 * surge);
        fill = shadeHex(base, lerp(-0.26, 0.32, ld));
      } else {
        fill = shadeHex(color.body, lerp(-0.24, 0.26, ld));
      }
      facePath(f);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.stroke();
      // per-set flourishes
      if (special === 'hoard' && !die.cracked) {
        // a shiny tucked in the feathers, catching the light now and then
        const fi = geo.faces.indexOf(f);
        const p0 = wv[f.idx[0]], pc = vAdd(qRotate(f.c, die.quat), die.pos);
        const gp = proj(vLerp(pc, p0, 0.42));
        const tw = Math.max(0, Math.sin(t / (sig ? 420 : 700) + fi * 2.1 + (die._ph || 0) * 3)) ** 8;
        glint(gp.x, gp.y, sig ? 4.5 : 3.2, (sig ? 0.9 : 0.65) * tw * die.alpha);
      }
      if (special === 'works') {
        // rivets at the corners of every plate
        const cS = proj(vAdd(qRotate(f.c, die.quat), die.pos));
        f.idx.forEach(vi => {
          const rx = lerp(sv[vi].x, cS.x, 0.16), ry = lerp(sv[vi].y, cS.y, 0.16);
          ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, TAU);
          ctx.fillStyle = sig ? 'rgba(24,30,36,0.9)' : 'rgba(52,38,16,0.85)'; ctx.fill();
          ctx.beginPath(); ctx.arc(rx - 0.5, ry - 0.5, 0.6, 0, TAU);
          ctx.fillStyle = sig ? 'rgba(159,232,255,0.65)' : 'rgba(240,220,170,0.7)'; ctx.fill();
        });
        if (sig) {
          // the Prototype's arcane seams
          const pulse = 0.38 + 0.28 * Math.sin(t / 450 + (die._ph || 0));
          ctx.strokeStyle = `rgba(110,205,250,${pulse * die.alpha})`;
          ctx.lineWidth = 2.2;
          facePath(f); ctx.stroke();
        }
      }
      if (special === 'moon' && !sig) {
        // the rim the moonlight finds
        const md = vDot(nW, MOON.dir);
        if (md > 0.25) {
          ctx.strokeStyle = `rgba(226,226,246,${0.55 * md * die.alpha})`;
          ctx.lineWidth = 1.8;
          facePath(f); ctx.stroke();
        }
      }
      if (special === 'ash' && !die.cracked) {
        // the ember at the heart of each facet
        const fi = geo.faces.indexOf(f);
        const cS = proj(vAdd(qRotate(f.c, die.quat), die.pos));
        const eS = proj(vAdd(vAdd(qRotate(f.c, die.quat), die.pos), [f.r * 0.7, 0, 0]));
        const rr = Math.max(3, Math.hypot(eS.x - cS.x, eS.y - cS.y));
        const gl = (sig ? 0.34 : 0.20) * (0.55 + 0.45 * Math.sin(t / 840 + fi * 1.9 + (die._ph || 0) * 2));
        const eg = ctx.createRadialGradient(cS.x, cS.y, 0, cS.x, cS.y, rr);
        eg.addColorStop(0, `rgba(255,150,70,${gl * die.alpha})`);
        eg.addColorStop(1, 'rgba(255,150,70,0)');
        ctx.fillStyle = eg;
        ctx.fillRect(cS.x - rr, cS.y - rr, rr * 2, rr * 2);
      }
      if (special === 'cinder') {
        // scales laid row over row, magma light in the gaps
        if (f.r > 0.45 && !die.cracked) {
          const cW2 = vAdd(qRotate(vAdd(f.c, vScale(f.n, 0.015)), die.quat), die.pos);
          withSurface(cW2, vScale(qRotate(f.tR, die.quat), f.r), vScale(qRotate(f.tU, die.quat), -f.r), () => {
            const surge = 0.35 + 0.3 * Math.sin(t / 700 + (die._ph || 0) * 2);
            for (let row = -1; row <= 1; row++) {
              for (let col = -1; col <= 1; col++) {
                const sx = col * 13 + (row % 2 ? 6.5 : 0), sy = row * 11 + 6;
                ctx.beginPath(); ctx.arc(sx, sy, 7, Math.PI, TAU);
                ctx.strokeStyle = `rgba(255,110,45,${surge * (sig ? 0.5 : 0.3)})`;
                ctx.lineWidth = 2.2; ctx.stroke();
                ctx.beginPath(); ctx.arc(sx, sy - 1.2, 7, Math.PI, TAU);
                ctx.strokeStyle = 'rgba(14,8,5,0.55)'; ctx.lineWidth = 1.6; ctx.stroke();
              }
            }
          });
        }
        // seams of heat between the plates
        const seam = 0.22 + 0.18 * Math.sin(t / 640 + (die._ph || 0) * 3);
        ctx.strokeStyle = `rgba(255,96,36,${(sig ? seam * 1.7 : seam) * die.alpha})`;
        ctx.lineWidth = sig ? 2.6 : 1.8;
        facePath(f); ctx.stroke();
      }
    });
    drawDieLabels(faces, geo, die, sv, wv, numColor);
    ctx.globalAlpha = 1;
  }
  function drawDieLabels(faces, geo, die, sv, wv, numColor) {
    faces.forEach(({ f }) => {
      if (geo.type === 'd4') {
        f.idx.forEach(vi => {
          const vLoc = geo.verts[vi];
          const anchor = vAdd(f.c, vScale(vSub(vLoc, f.c), 0.56));
          const tU = vNorm(vSub(vLoc, f.c));
          const tR = vNorm(vCross(tU, f.n));
          const cW2 = vAdd(qRotate(vAdd(anchor, vScale(f.n, 0.02)), die.quat), die.pos);
          const sw = f.r * 0.62;
          withSurface(cW2, vScale(qRotate(tR, die.quat), sw), vScale(qRotate(tU, die.quat), -sw), () => {
            ctx.font = `700 ${f.px}px Cinzel, serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = numColor;
            ctx.fillText(String(geo.vertexValues[vi]), 0, 1);
          });
        });
      } else if (f.label != null) {
        const cW2 = vAdd(qRotate(vAdd(f.c, vScale(f.n, 0.02)), die.quat), die.pos);
        withSurface(cW2, vScale(qRotate(f.tR, die.quat), f.r), vScale(qRotate(f.tU, die.quat), -f.r), () => {
          ctx.font = `700 ${f.px}px Cinzel, serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = numColor;
          ctx.fillText(f.label, 0, 1.5);
          if (['6', '9', '60', '90'].includes(f.label)) {
            const w = ctx.measureText(f.label).width;
            ctx.fillRect(-w / 2, f.px * 0.34, w, Math.max(2.2, f.px * 0.07));
          }
        });
      }
    });
    ctx.globalAlpha = 1;
  }
  function drawDiceList(dice, now) {
    const vis = dice.filter(d => !d.hidden && d.alpha > 0.01);
    vis.forEach(drawShadow);
    vis
      .map(d => ({ d, z: vDot(vSub(d.pos, CAM.eye), fwd) }))
      .sort((a, b) => b.z - a.z)
      .forEach(o => drawDie(o.d, now));
  }

  /* ---------- effects ---------- */
  function topFaceScreen(die) {
    const fi = die.geo.type === 'd4' ? null : upFaceIndex(die.geo, die.quat);
    if (fi == null) return null;
    const f = die.geo.faces[fi];
    return f.idx.map(vi => proj(vAdd(qRotate(die.geo.verts[vi], die.quat), die.pos)));
  }
  function drawGlow(die, now) {
    const g = die.glow;
    if (!g) return;
    const t = (now - g.t0) / g.dur;
    if (t < 0 || t > 1 || die.hidden) return;
    const env = smooth(0, 0.14, t) * (1 - smooth(0.72, 1, t));
    const pulse = 0.74 + 0.26 * Math.sin(t * TAU * 2.1);
    const a = env * pulse;
    const c = proj(die.pos);
    const R = die.geo.R * (CAM.f / Math.max(vDot(vSub(die.pos, CAM.eye), fwd), 1));
    const gold = g.color === 'red' ? '168,43,32'
      : g.color === 'ebb' ? '64,104,152'
      : g.color === 'tide' ? (g.strong ? '190,245,232' : '140,225,208')
      : g.color === 'arc' ? (g.strong ? '175,235,255' : '110,205,250')
      : g.color === 'moonlit' ? (g.strong ? '242,242,255' : '212,214,242')
      : g.color === 'newmoon' ? '92,82,140'
      : g.color === 'ember' ? (g.strong ? '255,190,110' : '255,140,70')
      : g.color === 'ashen' ? '150,140,130'
      : (g.strong ? '255,214,120' : '214,168,74');
    const grad = ctx.createRadialGradient(c.x, c.y, R * 0.3, c.x, c.y, R * (g.strong ? 3 : 2.4));
    grad.addColorStop(0, `rgba(${gold},${0.5 * a})`);
    grad.addColorStop(1, `rgba(${gold},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(c.x - R * 3.2, c.y - R * 3.2, R * 6.4, R * 6.4);
    const poly = topFaceScreen(die);
    if (poly) {
      ctx.beginPath();
      poly.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.fillStyle = g.color === 'tide' ? `rgba(214,250,240,${0.3 * a})`
        : g.color === 'ebb' ? `rgba(150,190,228,${0.3 * a})`
        : g.color === 'arc' ? `rgba(190,240,255,${0.3 * a})`
        : g.color === 'moonlit' ? `rgba(238,238,255,${0.3 * a})`
        : g.color === 'newmoon' ? `rgba(150,140,200,${0.3 * a})`
        : g.color === 'ember' ? `rgba(255,196,130,${0.3 * a})`
        : g.color === 'ashen' ? `rgba(190,182,172,${0.3 * a})`
        : `rgba(255,232,160,${0.3 * a})`;
      ctx.fill();
      ctx.save();
      ctx.shadowColor = `rgba(${gold},${0.9 * a})`;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = `rgba(${gold},${0.9 * a})`;
      ctx.lineWidth = 2.6;
      ctx.stroke();
      ctx.restore();
    }
  }
  function makeFlash(die, t0) {
    return {
      until: t0 + 850,
      draw(now) {
        const t = (now - t0) / 850;
        if (t < 0 || t > 1) return;
        const env = t < 0.15 ? t / 0.15 : 1 - smooth(0.15, 1, t);
        const c = proj(die.pos);
        const R = die.geo.R * (CAM.f / Math.max(vDot(vSub(die.pos, CAM.eye), fwd), 1));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const rr = R * (1.6 + 3.4 * t);
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rr);
        grad.addColorStop(0, `rgba(255,248,224,${0.95 * env})`);
        grad.addColorStop(0.35, `rgba(255,222,140,${0.55 * env})`);
        grad.addColorStop(1, 'rgba(255,222,140,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(c.x - rr, c.y - rr, rr * 2, rr * 2);
        // rays
        ctx.fillStyle = `rgba(255,236,180,${0.5 * env})`;
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * TAU + t * 0.5;
          const len = R * (2 + 3.6 * t), w = R * 0.13;
          ctx.save();
          ctx.translate(c.x, c.y); ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(R * 0.5, -w); ctx.lineTo(len, 0); ctx.lineTo(R * 0.5, w);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
        // whole-table wash
        ctx.fillStyle = `rgba(255,244,214,${0.2 * env})`;
        ctx.fillRect(0, 0, LOG_W, LOG_H);
      }
    };
  }
  function buildShards(die) {
    const shards = [];
    const center = proj(die.pos);
    const wv = die.geo.verts.map(v => vAdd(qRotate(v, die.quat), die.pos));
    const sv = wv.map(proj);
    const topI = die.geo.type === 'd4' ? -1 : upFaceIndex(die.geo, die.quat);
    const pushShard = (pts, fill) => {
      let cx = 0, cy = 0;
      pts.forEach(p => { cx += p.x; cy += p.y; });
      cx /= pts.length; cy /= pts.length;
      const dir = Math.atan2(cy - center.y, cx - center.x);
      const sp = rnd(120, 300);
      shards.push({
        pts: pts.map(p => ({ x: p.x - cx, y: p.y - cy })),
        x: cx, y: cy,
        vx: Math.cos(dir) * sp + rnd(-50, 50),
        vy: Math.sin(dir) * sp - rnd(90, 240),
        rot: 0, vr: rnd(-5, 5), alpha: 1, fill
      });
    };
    die.geo.faces.forEach((f, i) => {
      const nW = qRotate(f.n, die.quat);
      const cW = vAdd(qRotate(f.c, die.quat), die.pos);
      if (vDot(nW, vSub(cW, CAM.eye)) > 0.15) return;
      const d = vDot(nW, LIGHT);
      const fill = shadeHex(die.color.body, lerp(-0.24, 0.26, (d + 1) / 2));
      const pts = f.idx.map(vi => sv[vi]);
      if (i === topI && pts.length >= 3) {
        const cS = proj(cW);
        for (let k = 0; k < pts.length; k++) pushShard([cS, pts[k], pts[(k + 1) % pts.length]], fill);
      } else {
        pushShard(pts, fill);
      }
    });
    for (let k = 0; k < 7; k++) {
      const a = rnd(0, TAU), rr = rnd(4, 16);
      const bx = center.x + rnd(-20, 20), by = center.y + rnd(-20, 20);
      pushShard([
        { x: bx, y: by - rr }, { x: bx + rr * 0.9, y: by + rr * 0.7 }, { x: bx - rr * 0.9, y: by + rr * rnd(0.4, 0.9) }
      ].map(p => ({ x: p.x + Math.cos(a) * 4, y: p.y + Math.sin(a) * 4 })), shadeHex(die.color.body, -0.12));
    }
    return shards;
  }
  function drawCrack(die, now) {
    const cr = die.crack;
    if (!cr) return;
    if (now < cr.burstAt) {
      // growing crack lines on the top face
      const poly = topFaceScreen(die);
      if (!poly) return;
      if (!cr.lines) {
        let cx = 0, cy = 0;
        poly.forEach(p => { cx += p.x; cy += p.y; });
        cx /= poly.length; cy /= poly.length;
        cr.lines = poly.map(p => {
          const mx = lerp(cx, p.x, 0.5) + rnd(-7, 7), my = lerp(cy, p.y, 0.5) + rnd(-7, 7);
          return [{ x: cx, y: cy }, { x: mx, y: my }, { x: lerp(cx, p.x, 1.06), y: lerp(cy, p.y, 1.06) }];
        });
        cr.c = { x: cx, y: cy };
      }
      const p = smooth(0, 1, 1 - (cr.burstAt - now) / (cr.burstAt - cr.t0));
      ctx.strokeStyle = 'rgba(20,12,6,0.85)';
      ctx.lineWidth = 2.4;
      const nLines = Math.ceil(p * cr.lines.length);
      cr.lines.slice(0, nLines).forEach(seg => {
        ctx.beginPath();
        ctx.moveTo(seg[0].x, seg[0].y);
        ctx.lineTo(seg[1].x, seg[1].y);
        if (p > 0.5) ctx.lineTo(seg[2].x, seg[2].y);
        ctx.stroke();
      });
      return;
    }
    if (!cr.shards) {
      cr.shards = buildShards(die);
      cr.lastT = now;
      die.hidden = true;
      die.cracked = true;
    }
    const dt = clamp((now - cr.lastT) / 1000, 0, 0.05);
    cr.lastT = now;
    const t = (now - cr.burstAt) / 1250;
    cr.shards.forEach(s => {
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.vy += 2100 * dt;
      s.rot += s.vr * dt;
      s.alpha = 1 - smooth(0.35, 1, t);
      if (s.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      ctx.beginPath();
      s.pts.forEach((p, i) => { i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.fillStyle = s.fill; ctx.fill();
      ctx.strokeStyle = 'rgba(30,20,10,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.restore();
    });
  }
  function drawGhost() {
    const g = stage.scene.ghost;
    if (!g) return;
    const size = g.length >= 3 ? 2.1 : 2.7;
    floorText(g, 0.03, 0.28, 0, size, 'rgba(248,240,222,0.13)');
    floorText(g, 0, 0.25, 0, size, 'rgba(20,13,6,0.22)');
  }

  /* ---------- static scenes ---------- */
  function uprightYaw(geo, idx) {
    let best = 0, bs = -1e9;
    for (let k = 0; k < 36; k++) {
      const yaw = k / 36 * TAU;
      const q = quatShowingFace(geo, idx, yaw);
      let tU;
      if (geo.type === 'd4') tU = [0, 0, -1];
      else tU = qRotate(geo.faces[idx].tU, q);
      const c = proj([0, 1, 0]);
      const p2 = proj(vAdd([0, 1, 0], tU));
      const dx = p2.x - c.x, dy = p2.y - c.y;
      const s = -dy - Math.abs(dx) * 0.4;
      if (s > bs) { bs = s; best = yaw; }
    }
    return best;
  }
  function showcaseDice(now) {
    const { type, color } = stage.scene;
    const isTide = color && color.special === 'tide';
    const mk = (t, col, x, i) => {
      const geo = getGeo(t);
      let idx, q;
      if (t === 'd4') {
        idx = 3; q = quatShowingFace(geo, idx, 0.4);
      } else {
        let best = 0, bv = -1e9;
        geo.faces.forEach((f, i) => { if (f.value != null && f.value > bv) { bv = f.value; best = i; } });
        idx = best;
        q = quatShowingFace(geo, idx, uprightYaw(geo, idx));
      }
      return {
        geo, color: col, pos: [x, restY(geo, q), 0.1], quat: q, alpha: 1, hidden: false, glow: null, crack: null,
        sig: !!(color && color.special) && t === 'd20',
        pearl: isTide && t === 'd20',
        slosh: isTide ? {
          tx: 0.07 * Math.sin((now || 0) / 1150 + i), tz: 0.055 * Math.cos((now || 0) / 990 + i),
          lvl: -0.04 + 0.035 * Math.sin((now || 0) / 640 + i), phase: i, energy: 0.28
        } : null,
        _tint: (color && color.special) === 'moon' ? MOON.tints[i % MOON.tints.length] : null,
        _ph: i * 1.37
      };
    };
    if (type === 'd100') return [mk('d10t', Object.assign({}, color, { body: shadeHex(color.body, -0.18) }), -1.5, 0), mk('d10u', color, 1.5, 1)];
    if (type === 'coin') return [mk('coin', color, 0, 0)];
    return [mk(type, color, 0, 0)];
  }
  function drawStatic() {
    if (stage.destroyed) return;
    const now = performance.now();
    begin();
    drawTable(now);
    const m = stage.scene.mode;
    if (m === 'ghost') drawGhost();
    if (m === 'keep' && stage.scene.keptDice) { drawDiceList(stage.scene.keptDice, now); }
    if (m === 'showcase') drawDiceList(showcaseDice(now), now);
    drawFrontRim();
  }

  /* idle animation — keeps the surf breathing and the showcase water
     sloshing between rolls, only when something on screen actually moves */
  function needsIdle() {
    if (stage.anim || stage.destroyed) return false;
    const th = THEMES[stage.scene.theme] || {};
    // every character set animates at rest: water, glints, arc-light, moonlight
    const specialShown = (stage.scene.mode === 'showcase' && stage.scene.color && stage.scene.color.special)
      || (stage.scene.mode === 'keep' && (stage.scene.keptDice || []).some(d => d.color && d.color.special));
    return !!(th.animated || specialShown);
  }
  function idleTick(t) {
    stage.idleRaf = null;
    if (!needsIdle()) return;
    // the idle surf runs at ~30fps — easy on school laptops
    if (t - (stage._idleLast || 0) >= 32) { drawStatic(); stage._idleLast = t; }
    stage.idleRaf = requestAnimationFrame(idleTick);
  }
  function ensureIdle() {
    if (stage.idleRaf == null && needsIdle()) stage.idleRaf = requestAnimationFrame(idleTick);
  }
  function stopIdle() {
    if (stage.idleRaf != null) { cancelAnimationFrame(stage.idleRaf); stage.idleRaf = null; }
  }

  /* ---------- roll ---------- */
  function buildOutcome(spec, results) {
    const mod = spec.type === 'coin' ? 0 : Math.round(spec.mod || 0);
    const out = { type: spec.type, values: [], dice: [], total: 0, natural: 0, mod, crit: null, ghostText: '' };
    if (spec.type === 'coin') {
      const heads = results[0].value === 1;
      out.total = heads ? 'Heads' : 'Tails';
      out.values = [out.total];
      out.dice = [{ value: out.total }];
      out.ghostText = heads ? 'H' : 'T';
      return out;
    }
    if (spec.type === 'd100') {
      let sum = 0;
      for (let k = 0; k < results.length; k += 2) {
        const t = results[k].value, u = results[k + 1].value;
        let v = t + u;
        if (v === 0) v = 100;
        out.dice.push({ value: v, tens: t, units: u });
        out.values.push(v);
        sum += v;
      }
      out.natural = sum;
      out.total = sum + mod;
      out.ghostText = String(out.total);
      return out;
    }
    out.values = results.map(r => r.value);
    out.dice = results.map(r => ({ value: r.value }));
    out.natural = out.values.reduce((a, b) => a + b, 0);
    out.total = out.natural + mod;
    out.ghostText = String(out.total);
    if (spec.type === 'd20') {
      // fate reads the die, not the arithmetic
      if (out.values.includes(20)) out.crit = 'nat20';
      else if (out.values.includes(1)) out.crit = 'nat1';
    }
    return out;
  }

  function roll(spec) {
    if (stage.destroyed) return Promise.reject(new Error('destroyed'));
    stopIdle();
    resize();
    // gracefully finish anything still playing (settled → keep its ghost; mid-air → just clear)
    if (stage.anim && stage.anim.settled) finishRoll();
    if (stage.anim && stage.anim.resolve) { stage.anim.resolve(stage.anim.outcome); stage.anim.resolve = null; }
    stage.anim = null;
    const geos = [];
    const colors = [];
    const qty = clamp(spec.qty || 1, 1, 8);
    if (spec.type === 'd100') {
      for (let k = 0; k < Math.min(qty, 4); k++) {
        geos.push(getGeo('d10t')); colors.push(Object.assign({}, spec.color, { body: shadeHex(spec.color.body, -0.18) }));
        geos.push(getGeo('d10u')); colors.push(spec.color);
      }
    } else if (spec.type === 'coin') {
      geos.push(getGeo('coin')); colors.push(spec.color);
    } else {
      for (let k = 0; k < qty; k++) { geos.push(getGeo(spec.type)); colors.push(spec.color); }
    }
    let rec;
    if (!spec.force && window.CANNON) {
      try {
        rec = simulatePhysics(window.CANNON, geos, spec);
        if (!recordingOk(rec.frames, geos.length)) {
          console.warn('physics produced a bad recording, using canned roll');
          rec = null;
        }
      }
      catch (e) { console.warn('physics failed, using canned roll', e); rec = null; }
    }
    if (!rec) rec = simulateCanned(geos, spec, spec.force);
    const outcome = buildOutcome(spec, rec.results);

    const special = spec.color && spec.color.special;
    const isTide = special === 'tide';
    const dice = geos.map((geo, i) => ({
      geo, color: colors[i],
      pos: [0, 0, 0], quat: [0, 0, 0, 1],
      alpha: 1, hidden: true, glow: null, crack: null, cracked: false,
      // each set holds ONE signature d20 — the Pearl, the gilded prize, the Prototype, the Moon
      sig: !!special && spec.type === 'd20' && i === 0,
      pearl: isTide && spec.type === 'd20' && i === 0,
      slosh: isTide ? { tx: 0, tz: 0, vx: 0, vz: 0, lvl: -0.04, phase: i * 1.9, energy: 1.2 } : null,
      _tint: special === 'moon' ? MOON.tints[i % MOON.tints.length] : null,
      _ph: i * 1.37
    }));
    stage.ripples = [];
    let resolveFn;
    const p = new Promise(res => { resolveFn = res; });
    stage.anim = {
      frames: rec.frames, settleFrame: rec.settleFrame, results: rec.results,
      dice, spec, outcome,
      startT: performance.now(),
      speed: spec.slowMotion ? 0.5 : 1,
      settled: false, tSettle: 0, doneAfter: 0,
      effects: [], resolve: resolveFn
    };
    schedule();
    return p;
  }

  function onSettle(a, now) {
    if (a.resolve) { a.resolve(a.outcome); a.resolve = null; }
    let done = 1150 + 120;
    a.dice.forEach((d, i) => {
      const val = a.results[i] ? a.results[i].value : null;
      const isD20 = d.geo.type === 'd20';
      const sp = d.color && d.color.special;
      const settleColor = sp === 'tide' ? 'tide' : sp === 'works' ? 'arc' : sp === 'moon' ? 'moonlit'
        : (sp === 'ash' || sp === 'cinder') ? 'ember' : 'gold';
      const failColor = sp === 'tide' ? 'ebb' : sp === 'moon' ? 'newmoon' : sp === 'ash' ? 'ashen' : 'red';
      d.glow = {
        t0: now, dur: 1150,
        color: isD20 && val === 1 ? failColor : settleColor,
        strong: isD20 && val === 20
      };
      if (sp === 'tide') spawnRipple(d.pos[0], d.pos[2], 0.9);
      if (isD20 && val === 20) {
        if (sp === 'tide') {
          // the water in the die begins to glow
          d.tidefx = { kind: 'glow', t0: now + 150 };
          done = Math.max(done, 2400);
        } else {
          a.effects.push(makeFlash(d, now + 140));
          done = Math.max(done, 140 + 900);
        }
      }
      if (isD20 && val === 1) {
        if (sp === 'tide') {
          // the water flows out of the die and across the tray
          d.tidefx = { kind: 'drain', t0: now + 320 };
          spawnRipple(d.pos[0], d.pos[2], 1.1);
          done = Math.max(done, 2600);
        } else {
          d.crack = { t0: now, burstAt: now + 560, lines: null, shards: null, lastT: now };
          done = Math.max(done, 560 + 1350);
        }
      }
    });
    if (!a.spec.keepDice) done = Math.max(done, 2400 + 800);
    a.doneAfter = done + 100;
  }

  let starved = false;
  function schedule() {
    if (stage.destroyed || !stage.anim) return;
    if (stage.raf == null) stage.raf = requestAnimationFrame(onRaf);
    clearTimeout(stage.tmo);
    stage.tmo = setTimeout(onTmo, starved ? 40 : 400);
  }
  function onRaf(t) { starved = false; stage.raf = null; tick(t); }
  function onTmo() {
    // rAF is being starved (hidden/offscreen iframe) — drive frames with timers
    starved = true;
    if (stage.raf != null) { cancelAnimationFrame(stage.raf); stage.raf = null; }
    tick(performance.now());
  }
  function tick(now) {
    clearTimeout(stage.tmo);
    try { tickInner(now); if (stage.anim) stage.anim.failures = 0; }
    catch (e) {
      console.error('dice tick failed', e);
      // Don't jump straight to the ghost on a hiccup — skip the frame and
      // keep playing. Only give up after repeated consecutive failures.
      const a = stage.anim;
      if (a && (a.failures = (a.failures || 0) + 1) < 12) { schedule(); return; }
      try { finishRoll(); } catch (e2) { stage.anim = null; }
    }
  }
  function tickInner(now) {
    const a = stage.anim;
    if (!a || stage.destroyed) return;
    // anchor playback to the first frame actually drawn, so a slow first
    // rAF (fonts loading, jank, a backgrounded tab) can't skip the throw
    if (a.firstTick == null) a.firstTick = now;
    const F = Math.min((now - a.firstTick) / 1000 * 60 * a.speed, a.frames.length - 1);
    const i0 = Math.floor(F), i1 = Math.min(i0 + 1, a.frames.length - 1), ft = F - i0;
    const f0 = a.frames[i0], f1 = a.frames[i1];
    if (!f0 || !f1) { schedule(); return; }
    a.dice.forEach((d, i) => {
      d.hidden = d.cracked;
      const p0 = [f0[i * 7], f0[i * 7 + 1], f0[i * 7 + 2]];
      const p1 = [f1[i * 7], f1[i * 7 + 1], f1[i * 7 + 2]];
      const q0 = [f0[i * 7 + 3], f0[i * 7 + 4], f0[i * 7 + 5], f0[i * 7 + 6]];
      const q1 = [f1[i * 7 + 3], f1[i * 7 + 4], f1[i * 7 + 5], f1[i * 7 + 6]];
      d.pos = vLerp(p0, p1, ft);
      d.quat = qSlerp(q0, q1, ft);
    });
    // water sloshing: a damped spring on each die, driven by its own motion
    {
      const dtms = a._slNow == null ? 0 : now - a._slNow;
      a._slNow = now;
      const dt = clamp(dtms / 1000, 0, 0.05);
      if (dt > 0) a.dice.forEach(d => {
        const sl = d.slosh;
        const prev = d._pp || d.pos;
        const vel = vScale(vSub(d.pos, prev), 1 / dt);
        const pv = d._pv || vel;
        const acc = vScale(vSub(vel, pv), 1 / dt);
        d._pp = d.pos.slice(); d._pv = vel;
        // ripples where a watery die strikes the tray — and a splash inside it
        if (sl && d._pvy != null && d._pvy < -3 && vel[1] > -0.4 && d.pos[1] < 1.1) {
          spawnRipple(d.pos[0], d.pos[2], clamp(Math.abs(d._pvy) / 9, 0.35, 1.2));
          sl.energy = Math.min(1.4, (sl.energy || 0) + Math.abs(d._pvy) / 7);
        }
        d._pvy = vel[1];
        if (!sl) return;
        // a heavy, slow pendulum — water sways, it doesn't snap
        const K = 15, C = 3.6, DRIVE = 0.020;
        const ax = clamp(acc[0], -80, 80), az = clamp(acc[2], -80, 80), ay = clamp(acc[1], -80, 80);
        const restx = 0.05 * Math.sin(now / 1150 + sl.phase);
        const restz = 0.04 * Math.cos(now / 990 + sl.phase);
        sl.vx += (-K * (sl.tx - restx) - C * sl.vx - DRIVE * ax) * dt;
        sl.vz += (-K * (sl.tz - restz) - C * sl.vz - DRIVE * az) * dt;
        sl.tx = clamp(sl.tx + sl.vx * dt, -0.5, 0.5);
        sl.tz = clamp(sl.tz + sl.vz * dt, -0.5, 0.5);
        // the surface's wave energy: fed by motion, spent over time
        sl.energy = Math.min(1.4, (sl.energy || 0.2) * Math.exp(-1.15 * dt)
          + (Math.abs(ax) + Math.abs(az)) * dt * 0.012
          + (Math.abs(sl.vx) + Math.abs(sl.vz)) * dt * 0.55);
        // churn: while the die tumbles fast, the water has no clean surface —
        // it's a spinning mass. Measure rotation rate and blend smoothly.
        if (d._pq) {
          const qd = clamp(Math.abs(d.quat[0] * d._pq[0] + d.quat[1] * d._pq[1] + d.quat[2] * d._pq[2] + d.quat[3] * d._pq[3]), 0, 1);
          const spinRate = 2 * Math.acos(qd) / dt; // rad/s
          const hVel = Math.hypot(vel[0], vel[2]);
          const target = clamp(spinRate / 13 + hVel / 11, 0, 1);
          sl.churn = (sl.churn || 0) + (target - (sl.churn || 0)) * Math.min(1, dt * 7);
        }
        d._pq = d.quat.slice();
        if (d.tidefx && d.tidefx.kind === 'drain' && now >= d.tidefx.t0) {
          // the tide going out: the level falls with the clock, not the framerate
          const el = (now - d.tidefx.t0) / 1000;
          sl.lvl = Math.max(-1.7, -0.05 - 1.25 * el);
          sl.tx *= 0.85; sl.tz *= 0.85;
        } else {
          sl.lvl = clamp(-0.04 + 0.035 * Math.sin(now / 640 + sl.phase) - 0.0022 * ay, -0.16, 0.10);
        }
      });
    }
    if (!a.settled && F >= a.settleFrame) { a.settled = true; a.tSettle = now; onSettle(a, now); }
    // fade
    if (a.settled && !a.spec.keepDice) {
      const ft2 = now - a.tSettle;
      a.dice.forEach(d => { if (!d.cracked) d.alpha = 1 - smooth(2400, 3200, ft2); });
    }

    // -------- draw --------
    begin();
    let shakeX = 0, shakeY = 0;
    a.dice.forEach(d => {
      if (d.crack && d.crack.shards === null && now >= d.crack.burstAt - 0) return;
      if (d.crack && now > d.crack.burstAt && now < d.crack.burstAt + 240) {
        const amp = (1 - (now - d.crack.burstAt) / 240) * 4.5;
        shakeX = rnd(-amp, amp); shakeY = rnd(-amp, amp);
      }
    });
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawTable(now);
    drawRipples(now);
    a.dice.forEach(d => drawTidePuddle(d, now));
    drawDiceList(a.dice, now);
    drawFrontRim();
    if (a.settled) {
      a.dice.forEach(d => drawGlow(d, now));
      a.dice.forEach(d => drawCrack(d, now));
      a.effects.forEach(e => e.draw(now));
    }
    ctx.restore();

    if (a.settled && now - a.tSettle >= a.doneAfter) { finishRoll(); return; }
    schedule();
  }

  function finishRoll() {
    const a = stage.anim;
    if (!a) return;
    stage.anim = null;
    if (a.resolve) { a.resolve(a.outcome); a.resolve = null; }
    if (a.spec.keepDice) {
      stage.scene.mode = 'keep';
      stage.scene.keptDice = a.dice.filter(d => !d.cracked).map(d => ({ ...d, alpha: 1, glow: null, crack: null }));
      stage.scene.ghost = null;
    } else {
      stage.scene.mode = 'ghost';
      stage.scene.ghost = a.outcome.ghostText;
      stage.scene.keptDice = null;
    }
    stage.ripples = [];
    drawStatic();
    ensureIdle();
  }

  /* ---------- public API ---------- */
  stage.roll = roll;
  stage.setTheme = id => {
    stage.scene.theme = id;
    if (!stage.anim) { drawStatic(); ensureIdle(); }
  };
  stage.setIdleDie = ({ type, color }) => {
    if (type) stage.scene.type = type;
    if (color) stage.scene.color = color;
    stage.scene.mode = 'showcase';
    stage.scene.ghost = null;
    stage.scene.keptDice = null;
    if (!stage.anim) { drawStatic(); ensureIdle(); }
  };
  stage.isRolling = () => !!stage.anim;
  stage.redraw = () => { if (!stage.anim) drawStatic(); };
  stage.destroy = () => {
    stage.destroyed = true;
    stage.anim = null;
    if (stage.raf) cancelAnimationFrame(stage.raf);
    stopIdle();
    clearTimeout(stage.tmo);
    ro.disconnect();
  };

  resize();
  ensureIdle();
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('700 40px Cinzel'),
      document.fonts.load('400 40px Cinzel')
    ]).then(() => { if (!stage.anim) drawStatic(); }).catch(() => {});
  }
  return stage;
}
