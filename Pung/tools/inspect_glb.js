/* .glb 훑어보기 — node tools/inspect_glb.js <파일.glb> [출력폴더]
 *
 * 새 모델을 붙이기 전에 "총구가 어느 축을 보고 있는지"를 알아야 하는데,
 * 터미널에서는 모델을 볼 수가 없다. 그래서 정투영 실루엣 3장을 PNG 로 뽑는다.
 * 사람이든 CLI 든 그 그림을 보면 축 방향이 바로 판단된다.
 *
 * 출력:
 *   view_XY.png / view_XZ.png / view_ZY.png  — 와이어프레임 실루엣(빨간 십자 = 원점)
 *   basecolor.jpg                            — 내장된 베이스컬러 텍스처
 *   그리고 정점 수 · 바운딩박스 · 축별 두께 표를 찍는다.
 *
 * 의존성 없음(Node 기본 모듈만). PNG 는 zlib 로 직접 쓴다.
 */
'use strict';
var fs = require('fs'), path = require('path'), zlib = require('zlib');

var SRC = process.argv[2];
var OUT = process.argv[3] || path.dirname(SRC || '.');
if (!SRC) {
  console.error('사용법: node tools/inspect_glb.js <파일.glb> [출력폴더]');
  process.exit(1);
}
try { fs.mkdirSync(OUT, { recursive: true }); } catch (e) {}

/* ---------- GLB 읽기 ---------- */
var buf = fs.readFileSync(SRC);
if (buf.readUInt32LE(0) !== 0x46546C67) { console.error('GLB 가 아닙니다.'); process.exit(1); }
var jsonLen = buf.readUInt32LE(12);
var json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
var binOff = 20 + jsonLen + 8;                       // BIN 청크 헤더 8바이트 건너뜀
function view(i) { var b = json.bufferViews[i]; return buf.slice(binOff + b.byteOffset, binOff + b.byteOffset + b.byteLength); }
function typed(accIdx, Type) {
  var a = json.accessors[accIdx], v = view(a.bufferView);
  var off = v.byteOffset + (a.byteOffset || 0), n = a.count * (a.type === 'VEC3' ? 3 : a.type === 'VEC2' ? 2 : 1);
  // byteOffset 이 정렬에 안 맞으면 복사해서 읽는다
  if (off % Type.BYTES_PER_ELEMENT) { var c = Buffer.from(v.slice(a.byteOffset || 0)); return new Type(c.buffer, c.byteOffset, n); }
  return new Type(v.buffer, off, n);
}

var prim = json.meshes[0].primitives[0];
var P = json.accessors[prim.attributes.POSITION];
var pos = typed(prim.attributes.POSITION, Float32Array);
var IA = json.accessors[prim.indices];
var idx = typed(prim.indices, IA.componentType === 5125 ? Uint32Array : Uint16Array);

console.log('메시 ' + json.meshes.length + ' · 프리미티브 ' + json.meshes[0].primitives.length +
  ' · 재질 ' + (json.materials || []).length + ' · 이미지 ' + (json.images || []).length +
  ' · 애니메이션 ' + (json.animations || []).length + ' · 스킨 ' + (json.skins || []).length);
console.log('정점 ' + P.count + ' · 삼각형 ' + (idx.length / 3) +
  (P.count > 65535 ? '   ※ 65535 초과 — gunmesh.js 의 uint16 인덱스로는 못 씁니다' : ''));
console.log('바운딩박스 min ' + P.min.map(f2) + '  max ' + P.max.map(f2));
function f2(v) { return (Math.round(v * 1000) / 1000); }

/* ---------- 축별 두께: 가늘고 긴 축이 총열, 아래로 늘어진 쪽이 손잡이 ---------- */
var N = 16, x0 = P.min[0], x1 = P.max[0];
var bins = [];
for (var i = 0; i < N; i++) bins.push({ n: 0, ymin: 1e9, ymax: -1e9, zmin: 1e9, zmax: -1e9 });
for (var v = 0; v < P.count; v++) {
  var x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
  var b = bins[Math.min(N - 1, Math.floor((x - x0) / ((x1 - x0) || 1) * N))];
  b.n++;
  if (y < b.ymin) b.ymin = y; if (y > b.ymax) b.ymax = y;
  if (z < b.zmin) b.zmin = z; if (z > b.zmax) b.zmax = z;
}
console.log('\nX 구간별 단면 (Y 가 아래로 튀어나온 구간이 손잡이 → 그 반대쪽이 총구)');
console.log('   X      정점    Y폭     Z폭     Y범위');
bins.forEach(function (b, k) {
  var xa = (x0 + (x1 - x0) * k / N).toFixed(2);
  console.log(pad(xa, 6) + '  ' + pad(String(b.n), 6) + '  ' +
    (b.ymax - b.ymin).toFixed(3) + '  ' + (b.zmax - b.zmin).toFixed(3) +
    '  [' + b.ymin.toFixed(2) + ', ' + b.ymax.toFixed(2) + ']');
});
function pad(s, n) { while (s.length < n) s = ' ' + s; return s; }

/* ---------- 정투영 실루엣 PNG ---------- */
var CRC = null;
function crc32(b) {
  if (!CRC) { CRC = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  var r = 0xffffffff;
  for (var i = 0; i < b.length; i++) r = CRC[(r ^ b[i]) & 255] ^ (r >>> 8);
  return (r ^ 0xffffffff) >>> 0;
}
function writePNG(file, W, H, px) {
  var raw = Buffer.alloc(H * (W * 3 + 1));
  for (var y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
  function chunk(type, data) {
    var len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    var td = Buffer.concat([Buffer.from(type), data]);
    var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  }
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2;                         // 8비트 트루컬러
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
function silhouette(file, ax, ay, label) {
  var W = 900, H = 460, pad2 = 20;
  var mnx = P.min[ax], mxx = P.max[ax], mny = P.min[ay], mxy = P.max[ay];
  var s = Math.min((W - pad2 * 2) / ((mxx - mnx) || 1), (H - pad2 * 2) / ((mxy - mny) || 1));
  var px = Buffer.alloc(W * H * 3, 255);
  function set(x, y, r, g, b) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    var o = (y * W + x) * 3; px[o] = r; px[o + 1] = g; px[o + 2] = b;
  }
  function sx(v) { return Math.round(pad2 + (v - mnx) * s); }
  function sy(v) { return Math.round(H - pad2 - (v - mny) * s); }   // 화면은 아래가 +y 라 뒤집는다
  function line(ax0, ay0, ax1, ay1) {
    var n = Math.max(Math.abs(ax1 - ax0), Math.abs(ay1 - ay0)) || 1;
    for (var i = 0; i <= n; i++) set(Math.round(ax0 + (ax1 - ax0) * i / n), Math.round(ay0 + (ay1 - ay0) * i / n), 30, 60, 140);
  }
  for (var t = 0; t < idx.length; t += 3) {
    var A = idx[t], B = idx[t + 1], C = idx[t + 2];
    var p1 = [sx(pos[A * 3 + ax]), sy(pos[A * 3 + ay])],
        p2 = [sx(pos[B * 3 + ax]), sy(pos[B * 3 + ay])],
        p3 = [sx(pos[C * 3 + ax]), sy(pos[C * 3 + ay])];
    line(p1[0], p1[1], p2[0], p2[1]); line(p2[0], p2[1], p3[0], p3[1]); line(p3[0], p3[1], p1[0], p1[1]);
  }
  var ox = sx(0), oy = sy(0);                        // 원점 = 빨간 십자(붙일 기준점)
  for (var i2 = -8; i2 <= 8; i2++) { set(ox + i2, oy, 220, 30, 30); set(ox, oy + i2, 220, 30, 30); }
  writePNG(file, W, H, px);
  console.log('  ' + file + '   ' + label);
}

console.log('\n실루엣 (가로축이 왼쪽에서 오른쪽으로 증가, 세로축은 위로 증가)');
silhouette(path.join(OUT, 'view_XY.png'), 0, 1, 'X - Y');
silhouette(path.join(OUT, 'view_XZ.png'), 0, 2, 'X - Z');
silhouette(path.join(OUT, 'view_ZY.png'), 2, 1, 'Z - Y');

var img = (json.images || [])[0];
if (img && img.bufferView != null) {
  var ext = (img.mimeType === 'image/png') ? '.png' : '.jpg';
  var dst = path.join(OUT, 'basecolor' + ext);
  fs.writeFileSync(dst, view(img.bufferView));
  console.log('  ' + dst + '   베이스컬러 텍스처');
}
