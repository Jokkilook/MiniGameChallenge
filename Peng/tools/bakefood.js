/* 아이템 아트 굽기 — Kenney Food Kit(CC0) → itembaked.js + itemicons.js
 *
 *   node tools/bakefood.js
 *
 * 아이템 6종의 표식 메시와 HUD 아이콘을 한 킷에서 함께 굽는다.
 * 원본은 Mesh/kenney_food-kit/ 안에 있고, 게임이 쓰는 건 구운 결과 두 파일뿐이다.
 *
 * 왜 브라우저(tools/bake.html)가 아니라 node 인가 — 이 킷은 meshlib.js 의 로더가
 * 못 읽는 두 가지를 쓴다:
 *   · 한 파일에 메시가 여럿이다(버거 = 빵 위·아래·패티·치즈·양상추·토마토 6조각).
 *     Res.build 는 meshes[0] 의 첫 프리미티브만 굽는다 → 아랫빵만 나온다.
 *   · 텍스처가 GLB 밖에 있다(Textures/colormap.png). Res.load 는 외부 URI 이미지를
 *     건너뛰고 무채색으로 굽는다 → 팔레트가 곧 생김새인 킷이라 회색 덩어리가 된다.
 * 그래서 여기서 씬 그래프를 훑어 조각을 전부 합치고, colormap 을 직접 읽어 굽는다.
 * 결과 형식은 meshlib.js 의 Res.toBaked 와 같다(BAKE_VER=1) — 게임 쪽은 그대로다.
 *
 * 아이콘은 킷의 Previews/*.png 를 그대로 쓴다. 64x64 팔레트 PNG 에 tRNS 로 배경이
 * 이미 뚫려 있어서, 옛 아이콘(1254px 불투명 회색 배경)처럼 배경을 빼낼 필요가 없다.
 */
'use strict';
var fs = require('fs'), path = require('path'), zlib = require('zlib');

var ROOT = path.join(__dirname, '..');
var KIT  = path.join(ROOT, 'Mesh', 'kenney_food-kit');
var GLB  = path.join(KIT, 'Models', 'GLB format');
var PREV = path.join(KIT, 'Previews');
var OUT_MESH = path.join(ROOT, 'itembaked.js');
var OUT_ICON = path.join(ROOT, 'itemicons.js');

/* 아이템 키 → 음식 이름. 키는 index.html 의 ITEMS 와 맞춰야 한다.
   메시(.glb)와 아이콘(.png) 이 같은 이름이라 표가 하나면 된다. */
var MAP = {
  reverse: 'croissant',    // 안으로 말린 모양 — 밀어내는 대신 끌어당긴다
  power:   'burger',       // 제일 든든한 한 방
  drum:    'sub',          // 길쭉한 게 탄창처럼 생겼다
  feather: 'banana',       // 가볍고 미끄러지듯 붕 뜬다
  anchor:  'wholer-ham',   // 묵직한 고깃덩이 — 밀려나지 않는다
  pulse:   'sushi-egg'     // 가운데서 퍼지는 파동
};

var ICON = 64;        // 아이콘 해상도. 원본 미리보기가 64px 이라 키워봐야 흐려지기만 한다
var MARGIN = 0.04;    // 내용물 주위 여백(변 길이 대비)

/* ================= PNG 읽기 =================
   옛 아이콘은 트루컬러였지만 이 킷은 팔레트(colorType 3) 다 — colormap 도 미리보기도
   그렇다. 그래서 0/2/3/6 을 다 받고, 팔레트는 PLTE·tRNS 를 풀어 RGBA 로 되돌린다. */
function decodePNG(buf) {
  var sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (var i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error('PNG 가 아닙니다');
  var off = 8, W = 0, H = 0, bd = 0, ct = 0, il = 0, idat = [], plte = null, trns = null;
  while (off < buf.length) {
    var len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8);
    var data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      W = data.readUInt32BE(0); H = data.readUInt32BE(4);
      bd = data[8]; ct = data[9]; il = data[12];
    } else if (type === 'PLTE') plte = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bd !== 8) throw new Error('8비트 PNG 만 지원합니다 (bitDepth=' + bd + ')');
  if (il !== 0) throw new Error('인터레이스 PNG 는 지원하지 않습니다');
  var BPP = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct];
  if (!BPP) throw new Error('지원하지 않는 colorType=' + ct);
  if (ct === 3 && !plte) throw new Error('팔레트 PNG 에 PLTE 가 없습니다');

  var stride = W * BPP;
  var raw = zlib.inflateSync(Buffer.concat(idat));
  var out = Buffer.alloc(H * stride), prev = Buffer.alloc(stride, 0);
  for (var y = 0; y < H; y++) {
    var ft = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    var cur = Buffer.alloc(stride);
    for (var x = 0; x < stride; x++) {
      var a = x >= BPP ? cur[x - BPP] : 0, b = prev[x], c = x >= BPP ? prev[x - BPP] : 0, v = line[x];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {                      // Paeth
        var p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[x] = v & 255;
    }
    cur.copy(out, y * stride); prev = cur;
  }

  // 무슨 형식으로 들어왔든 RGBA 로 통일해 내보낸다
  var px = Buffer.alloc(W * H * 4);
  for (var k = 0; k < W * H; k++) {
    var o = k * 4, s = k * BPP;
    if (ct === 3) {
      var pi = out[s];
      px[o] = plte[pi * 3]; px[o + 1] = plte[pi * 3 + 1]; px[o + 2] = plte[pi * 3 + 2];
      px[o + 3] = (trns && pi < trns.length) ? trns[pi] : 255;
    } else if (ct === 0 || ct === 4) {
      px[o] = px[o + 1] = px[o + 2] = out[s];
      px[o + 3] = (ct === 4) ? out[s + 1] : 255;
    } else {
      px[o] = out[s]; px[o + 1] = out[s + 1]; px[o + 2] = out[s + 2];
      px[o + 3] = (ct === 6) ? out[s + 3] : 255;
    }
  }
  return { w: W, h: H, px: px };
}

/* ---------- PNG 쓰기(RGBA) ---------- */
var CRC = null;
function crc32(b) {
  if (!CRC) { CRC = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  var r = 0xffffffff;
  for (var i = 0; i < b.length; i++) r = CRC[(r ^ b[i]) & 255] ^ (r >>> 8);
  return (r ^ 0xffffffff) >>> 0;
}
function encodePNG(W, H, px) {
  // 스캔라인마다 Paeth 필터 — 부드러운 그림이라 필터 없이 두면 2배 가까이 커진다
  var stride = W * 4, raw = Buffer.alloc(H * (stride + 1));
  for (var y = 0; y < H; y++) {
    var base = y * (stride + 1); raw[base] = 4;
    for (var x = 0; x < stride; x++) {
      var cur = px[y * stride + x];
      var a = x >= 4 ? px[y * stride + x - 4] : 0;
      var b = y > 0 ? px[(y - 1) * stride + x] : 0;
      var c = (x >= 4 && y > 0) ? px[(y - 1) * stride + x - 4] : 0;
      var p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      var pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      raw[base + 1 + x] = (cur - pr) & 255;
    }
  }
  function chunk(type, data) {
    var len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    var td = Buffer.concat([Buffer.from(type), data]);
    var crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  }
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6;                       // 8비트 RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))]);
}

/* ================= glTF(.glb) 읽기 =================
   meshlib.js 의 파서와 같은 규약이다. 다른 점은 아래 collect() 뿐 — 씬 전체를 훑는다. */
function parseGLB(ab) {
  var dv = new DataView(ab);
  function u32(o) { return dv.getUint32(o, true); }
  if (u32(0) !== 0x46546C67) throw new Error('GLB 매직이 아님');
  if (u32(4) !== 2) throw new Error('glTF 2.0 이 아님');
  var total = u32(8), off = 12, json = null, binOff = 0;
  while (off + 8 <= total) {
    var clen = u32(off), ctype = u32(off + 4), start = off + 8;
    if (ctype === 0x4E4F534A) json = JSON.parse(Buffer.from(ab, start, clen).toString('utf8'));
    else if (ctype === 0x004E4942) binOff = start;
    off = start + clen;
  }
  if (!json) throw new Error('JSON 청크 없음');
  return { json: json, ab: ab, binOff: binOff };
}

var COMP = { 5120: { a: Int8Array, s: 1 }, 5121: { a: Uint8Array, s: 1 }, 5122: { a: Int16Array, s: 2 },
             5123: { a: Uint16Array, s: 2 }, 5125: { a: Uint32Array, s: 4 }, 5126: { a: Float32Array, s: 4 } };
var NCOMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function readAccessor(g, i) {
  var a = g.json.accessors[i], bv = g.json.bufferViews[a.bufferView];
  var C = COMP[a.componentType], n = NCOMP[a.type], cnt = a.count;
  if (!C || !n) throw new Error('지원하지 않는 접근자');
  var base = g.binOff + (bv.byteOffset || 0) + (a.byteOffset || 0);
  var stride = bv.byteStride || 0;
  var out = new C.a(cnt * n);
  if (!stride || stride === C.s * n) {
    if (base % C.s === 0) out.set(new C.a(g.ab, base, cnt * n));
    else out.set(new C.a(g.ab.slice(base, base + cnt * n * C.s)));
  } else {
    for (var k = 0; k < cnt; k++) {
      var o = base + k * stride;
      var row = (o % C.s === 0) ? new C.a(g.ab, o, n) : new C.a(g.ab.slice(o, o + n * C.s));
      for (var c = 0; c < n; c++) out[k * n + c] = row[c];
    }
  }
  return out;
}

// 노드의 지역 변환(행렬 또는 TRS) → 열 우선 4x4
function nodeMatrix(nd) {
  if (nd && nd.matrix) return nd.matrix.slice();
  var t = (nd && nd.translation) || [0, 0, 0], r = (nd && nd.rotation) || [0, 0, 0, 1], s = (nd && nd.scale) || [1, 1, 1];
  var x = r[0], y = r[1], z = r[2], w = r[3];
  var m = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
           2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
           2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
           0, 0, 0, 1];
  for (var c = 0; c < 3; c++) for (var r2 = 0; r2 < 3; r2++) m[c * 4 + r2] *= s[c];
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2];
  return m;
}
function mul(a, b) {                      // 열 우선 4x4 곱
  var o = new Array(16);
  for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
    var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
var IDENT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function xformPoint(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; }
function xformDir(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z]; }

/* 씬을 훑어 (메시, 월드행렬) 을 전부 모은다. 이 킷은 조각마다 노드가 하나씩 달려
   있고 부모 노드가 통째로 옮기기도 하므로, 부모 변환을 곱해 내려가야 조각이 제자리에 붙는다. */
function collect(json) {
  var out = [], scene = json.scenes[json.scene || 0];
  (function walk(list, parent) {
    for (var i = 0; i < list.length; i++) {
      var nd = json.nodes[list[i]], m = mul(parent, nodeMatrix(nd));
      if (nd.mesh != null) out.push({ mesh: nd.mesh, m: m, name: nd.name || '' });
      if (nd.children) walk(nd.children, m);
    }
  })(scene.nodes, IDENT);
  return out;
}

/* ---------- 텍스처 샘플 ---------- */
// 이중선형. UV 는 반복(REPEAT), v 는 위에서 아래로(glTF 규약 = 캔버스와 같음).
function sampleBilinear(img, u, v, out) {
  u = u - Math.floor(u); v = v - Math.floor(v);
  var x = u * img.w - 0.5, y = v * img.h - 0.5;
  var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  var r = 0, g = 0, b = 0;
  for (var j = 0; j < 2; j++) for (var i = 0; i < 2; i++) {
    var sx = ((x0 + i) % img.w + img.w) % img.w, sy = ((y0 + j) % img.h + img.h) % img.h;
    var o = (sy * img.w + sx) * 4, wgt = (i ? fx : 1 - fx) * (j ? fy : 1 - fy);
    r += img.px[o] * wgt; g += img.px[o + 1] * wgt; b += img.px[o + 2] * wgt;
  }
  out[0] = r / 255; out[1] = g / 255; out[2] = b / 255;
}

/* ================= 메시 굽기 =================
   meshlib.js 의 Res.build 와 같은 결과를 낸다:
   축 AXIS_FLIP_Z(x, y, -z) · 감기 뒤집기 · 로컬 고정 광원 음영 · 용접 법선.
   다른 점 하나 — 바운딩박스 중심을 원점으로 옮긴다. 옛 아이템 메시는 원점 중앙이라
   그냥 됐지만 이 킷은 바닥(Y=0)이 원점이라, 안 옮기면 표식이 패드 위로 붕 뜬다. */
var LIGHT = (function () { var x = 0.32, y = 0.85, z = -0.42, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; })();

function bakeMesh(file, tex) {
  var ab = new Uint8Array(fs.readFileSync(file)).buffer;
  var g = parseGLB(ab), json = g.json;
  var parts = collect(json);

  // 조각을 전부 이어 붙인다(위치·법선은 각자의 월드행렬을 먹인 뒤)
  var pos = [], rawN = [], uv = [], idx = [], base = 0, nprim = 0;
  for (var pi = 0; pi < parts.length; pi++) {
    var mesh = json.meshes[parts[pi].mesh], m = parts[pi].m;
    for (var qi = 0; qi < mesh.primitives.length; qi++) {
      var prim = mesh.primitives[qi];
      if (!(prim.mode == null || prim.mode === 4) || !prim.attributes || prim.attributes.POSITION == null) continue;
      var P = readAccessor(g, prim.attributes.POSITION);
      var N = prim.attributes.NORMAL != null ? readAccessor(g, prim.attributes.NORMAL) : null;
      var T = prim.attributes.TEXCOORD_0 != null ? readAccessor(g, prim.attributes.TEXCOORD_0) : null;
      var I = prim.indices != null ? readAccessor(g, prim.indices) : null;
      var cnt = P.length / 3;
      for (var v = 0; v < cnt; v++) {
        var q = xformPoint(m, P[v * 3], P[v * 3 + 1], P[v * 3 + 2]);
        pos.push(q[0], q[1], -q[2]);                       // AXIS_FLIP_Z
        if (N) {
          var d = xformDir(m, N[v * 3], N[v * 3 + 1], N[v * 3 + 2]);
          var nl = Math.hypot(d[0], d[1], d[2]) || 1;
          rawN.push(d[0] / nl, d[1] / nl, -d[2] / nl);
        } else rawN.push(0, 1, 0);
        uv.push(T ? T[v * 2] : 0, T ? T[v * 2 + 1] : 0);
      }
      /* 감기 뒤집기 — 이 게임의 메시는 '바깥면이 CW' 규약이고 윤곽선 껍질이 그걸
         전제로 BACK 을 컬링한다. 안 뒤집으면 껍질이 표식을 통째로 검게 덮는다. */
      if (I) for (var k = 0; k < I.length; k += 3) idx.push(base + I[k], base + I[k + 2], base + I[k + 1]);
      else for (k = 0; k < cnt; k += 3) idx.push(base + k, base + k + 2, base + k + 1);
      base += cnt; nprim++;
    }
  }
  var n = base;
  if (!n) throw new Error('삼각형 프리미티브가 없음');
  if (n > 65535) throw new Error('정점이 65535 개를 넘음(uint16 인덱스 불가): ' + n);

  /* 겹친 삼각형 버리기 — 조각이 맞닿는 자리(아랫빵 윗면 = 패티 밑면)가 같은 평면에
     같은 삼각형으로 두 번 있다. 깊이가 완전히 같아서 화면에서는 픽셀마다 이기는 쪽이
     갈려 얼룩이 진다. 조각을 하나로 합친 지금은 뒤에 온 쪽을 버려도 된다 —
     어차피 두 솔리드 사이에 낀 면이라 어느 쪽을 남겨도 밖에서는 안 보인다. */
  var seen = {}, kept = [], dropped = 0;
  for (var k = 0; k < idx.length; k += 3) {
    var tri = [idx[k], idx[k + 1], idx[k + 2]].map(function (v) {
      return Math.round(pos[v * 3] * 1e4) + ',' + Math.round(pos[v * 3 + 1] * 1e4) + ',' + Math.round(pos[v * 3 + 2] * 1e4);
    }).sort().join('|');
    if (seen[tri]) { dropped++; continue; }
    seen[tri] = 1; kept.push(idx[k], idx[k + 1], idx[k + 2]);
  }
  idx = kept;

  // 바운딩박스를 재고 중심을 원점으로 옮긴다
  var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], a;
  for (v = 0; v < n; v++) for (a = 0; a < 3; a++) {
    var val = pos[v * 3 + a];
    if (val < mn[a]) mn[a] = val;
    if (val > mx[a]) mx[a] = val;
  }
  var ctr = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
  for (v = 0; v < n; v++) for (a = 0; a < 3; a++) pos[v * 3 + a] -= ctr[a];
  for (a = 0; a < 3; a++) { mn[a] -= ctr[a]; mx[a] -= ctr[a]; }

  // 정점색 = 베이스컬러 × 음영. 광원은 로컬 고정이라 표식이 돌아도 명암은 안 돈다.
  var col = new Float32Array(n * 3), t = [1, 1, 1];
  for (v = 0; v < n; v++) {
    if (tex) sampleBilinear(tex, uv[v * 2], uv[v * 2 + 1], t);
    else { t[0] = 0.62; t[1] = 0.66; t[2] = 0.76; }
    var dl = rawN[v * 3] * LIGHT[0] + rawN[v * 3 + 1] * LIGHT[1] + rawN[v * 3 + 2] * LIGHT[2];
    var sh = 0.55 + 0.45 * (dl > 0 ? dl : 0);
    col[v * 3] = Math.min(1, t[0] * sh); col[v * 3 + 1] = Math.min(1, t[1] * sh); col[v * 3 + 2] = Math.min(1, t[2] * sh);
  }

  /* 윤곽선 껍질용 법선은 '용접'해서 평균낸다. 파일의 법선은 하드 에지에서 갈라져
     있어(같은 자리에 법선이 다른 정점이 여럿) 그대로 부풀리면 껍질이 찢어진다.
     조각끼리 맞닿은 자리도 이 단계에서 함께 이어진다 — 조각을 합친 지금이 제때다. */
  var wn = new Float32Array(n * 3), map = {}, keys = new Array(n), Q = 1e4;
  for (v = 0; v < n; v++) {
    var key = Math.round(pos[v * 3] * Q) + '_' + Math.round(pos[v * 3 + 1] * Q) + '_' + Math.round(pos[v * 3 + 2] * Q);
    keys[v] = key;
    var e = map[key]; if (!e) e = map[key] = [0, 0, 0];
    e[0] += rawN[v * 3]; e[1] += rawN[v * 3 + 1]; e[2] += rawN[v * 3 + 2];
  }
  for (v = 0; v < n; v++) {
    var aa = map[keys[v]], al = Math.hypot(aa[0], aa[1], aa[2]);
    if (al < 1e-6) { wn[v * 3] = rawN[v * 3]; wn[v * 3 + 1] = rawN[v * 3 + 1]; wn[v * 3 + 2] = rawN[v * 3 + 2]; }
    else { wn[v * 3] = aa[0] / al; wn[v * 3 + 1] = aa[1] / al; wn[v * 3 + 2] = aa[2] / al; }
  }

  // 가장 앞쪽(z 최대) 2% 정점의 평균 — 총이면 총구다. 아이템은 안 쓰지만 형식이 같다.
  var zc = mx[2] - (mx[2] - mn[2]) * 0.02, fx = 0, fy = 0, fc = 0;
  for (v = 0; v < n; v++) if (pos[v * 3 + 2] >= zc) { fx += pos[v * 3]; fy += pos[v * 3 + 1]; fc++; }
  var front = fc ? [fx / fc, fy / fc, mx[2]] : [0, 0, mx[2]];

  /* 양자화 — 위치 uint16(바운딩박스로 정규화) · 색 uint8 · 법선 int8 · 인덱스 uint16.
     meshlib.js 의 Res.toBaked 와 같은 형식(BAKE_VER=1)이라 applyBaked 가 그대로 읽는다. */
  var QP = new Uint16Array(n * 3), QC = new Uint8Array(n * 3), QN = new Int8Array(n * 3);
  var sc = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]];
  for (v = 0; v < n; v++) for (a = 0; a < 3; a++) {
    var u = sc[a] > 1e-9 ? (pos[v * 3 + a] - mn[a]) / sc[a] : 0;
    QP[v * 3 + a] = Math.max(0, Math.min(65535, Math.round(u * 65535)));
    QC[v * 3 + a] = Math.max(0, Math.min(255, Math.round(col[v * 3 + a] * 255)));
    QN[v * 3 + a] = Math.max(-127, Math.min(127, Math.round(wn[v * 3 + a] * 127)));
  }
  var QI = new Uint16Array(idx);
  function b64(u8) { return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString('base64'); }
  return {
    baked: { v: 1, n: n, mn: mn, mx: mx, mz: front,
             p: b64(QP), c: b64(QC), nr: b64(QN), i: b64(QI) },
    parts: parts.length, prims: nprim, n: n, tris: idx.length / 3, dropped: dropped, size: sc
  };
}

/* ================= 아이콘 굽기 ================= */
// 내용물(알파가 있는 픽셀)에 맞춰 정사각형으로 자른다
function cropSquare(img) {
  var W = img.w, H = img.h, px = img.px;
  var x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    if (px[(y * W + x) * 4 + 3] > 8) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new Error('내용물이 없습니다 — 배경이 안 뚫린 PNG 인지 확인하세요');
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  var side = Math.max(x1 - x0 + 1, y1 - y0 + 1) * (1 + MARGIN * 2);
  return { x: cx - side / 2, y: cy - side / 2, side: side, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
/* 박스 필터. 알파를 곱한 상태(premultiplied)로 섞어야 투명한 픽셀의 색이 가장자리로
   새어나오지 않는다. 원본이 64px 이라 배율은 1 근처다 — 거의 그대로 옮겨진다. */
function resize(img, box, N) {
  var W = img.w, H = img.h, px = img.px, out = Buffer.alloc(N * N * 4);
  var step = box.side / N;
  for (var oy = 0; oy < N; oy++) for (var ox = 0; ox < N; ox++) {
    var sx0 = box.x + ox * step, sy0 = box.y + oy * step;
    var ix0 = Math.max(0, Math.floor(sx0)), ix1 = Math.min(W - 1, Math.ceil(sx0 + step) - 1);
    var iy0 = Math.max(0, Math.floor(sy0)), iy1 = Math.min(H - 1, Math.ceil(sy0 + step) - 1);
    if (ix1 < ix0) ix1 = ix0; if (iy1 < iy0) iy1 = iy0;
    var r = 0, g = 0, b = 0, a = 0, n = 0;
    for (var y = iy0; y <= iy1; y++) for (var x = ix0; x <= ix1; x++) {
      var o = (y * W + x) * 4, al = px[o + 3] / 255;
      r += px[o] * al; g += px[o + 1] * al; b += px[o + 2] * al; a += al; n++;
    }
    var oo = (oy * N + ox) * 4;
    if (!n || a <= 0) { out[oo] = out[oo + 1] = out[oo + 2] = out[oo + 3] = 0; continue; }
    out[oo] = Math.round(r / a);                   // 곱한 알파를 되돌린다
    out[oo + 1] = Math.round(g / a);
    out[oo + 2] = Math.round(b / a);
    out[oo + 3] = Math.round((a / n) * 255);
  }
  return out;
}

/* ================= 실행 ================= */
var keys = Object.keys(MAP);
var texFile = path.join(GLB, 'Textures', 'colormap.png');
if (!fs.existsSync(texFile)) throw new Error('텍스처가 없습니다: ' + texFile);
var tex = decodePNG(fs.readFileSync(texFile));
console.log('Kenney Food Kit (CC0) — 아이템 6종 굽기');
console.log('  텍스처 ' + path.basename(texFile) + ' ' + tex.w + 'x' + tex.h + '\n');

var meshes = {}, icons = {}, iconBytes = 0;
keys.forEach(function (key) {
  var food = MAP[key];
  var r = bakeMesh(path.join(GLB, food + '.glb'), tex);
  meshes[key] = r.baked;
  var img = decodePNG(fs.readFileSync(path.join(PREV, food + '.png')));
  var box = cropSquare(img);
  var png = encodePNG(ICON, ICON, resize(img, box, ICON));
  icons[key] = 'data:image/png;base64,' + png.toString('base64');
  iconBytes += png.length;
  console.log('  ' + key.padEnd(8) + food.padEnd(12) +
    '조각 ' + String(r.parts).padStart(2) + ' · ' + String(r.n).padStart(4) + '정점 / ' +
    String(r.tris).padStart(4) + '삼각형' + (r.dropped ? '(겹친 면 ' + r.dropped + '개 버림)' : '') + ' · 크기 ' +
    r.size.map(function (v) { return v.toFixed(2); }).join('×') +
    '   아이콘 ' + img.w + 'px→' + ICON + 'px ' + (png.length / 1024).toFixed(1) + 'KB');
});

var NL = '\n';
var meshSrc = '/* 자동 생성 파일 — 직접 고치지 마세요.' + NL +
  '   tools/bakefood.js 가 Kenney Food Kit(CC0) 의 .glb 를 구워 만든 정점 데이터입니다.' + NL +
  '   음식을 바꾸면 그 파일의 MAP 을 고치고 `node tools/bakefood.js` 를 다시 실행하세요. */' + NL +
  'window.ITEM_BAKED=' + JSON.stringify(meshes) + ';' + NL;
var iconSrc = '/* 자동 생성 파일 — 직접 고치지 마세요.' + NL +
  '   tools/bakefood.js 가 Kenney Food Kit(CC0) 의 Previews/*.png 를 구워 만든 HUD 아이콘입니다.' + NL +
  '   음식을 바꾸면 그 파일의 MAP 을 고치고 `node tools/bakefood.js` 를 다시 실행하세요. */' + NL +
  'window.ITEM_ICONS=' + JSON.stringify(icons) + ';' + NL;
fs.writeFileSync(OUT_MESH, meshSrc);
fs.writeFileSync(OUT_ICON, iconSrc);
console.log(NL + 'itembaked.js  ' + (meshSrc.length / 1024).toFixed(0) + 'KB');
console.log('itemicons.js  ' + (iconSrc.length / 1024).toFixed(0) + 'KB (PNG 합계 ' +
  (iconBytes / 1024).toFixed(0) + 'KB)');
