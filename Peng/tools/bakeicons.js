/* 아이템 HUD 아이콘 굽기 — Image/Img_*.png → itemicons.js
 *
 *   node tools/bakeicons.js
 *
 * 원본은 장당 1254x1254 · 1.4MB 이고 배경이 불투명한 회색이라 HUD 에 그대로 못 쓴다.
 * 배경을 알파로 빼고, 내용물에 맞춰 자르고, 96px 로 줄여 data URI 로 굽는다.
 * 결과(itemicons.js)만 있으면 게임이 돌아가므로 원본 PNG 는 저장소에 없어도 된다
 * — gunbaked.js 와 같은 구조다(README '3D 메시 넣기' 참고).
 *
 * 메시(.glb)와 달리 브라우저가 필요 없다. GLB 텍스처는 JPEG 이라 디코더가 없지만
 * 이 아이콘들은 PNG 라서 zlib 만으로 읽을 수 있다.
 */
'use strict';
var fs = require('fs'), path = require('path'), zlib = require('zlib');

var ROOT = path.join(__dirname, '..');
var SRC = path.join(ROOT, 'Image');
var OUT = path.join(ROOT, 'itemicons.js');
var SIZE = 96;        // 굽는 해상도. HUD 는 22px 라 고해상도 화면(2배)에도 여유가 있다
var MARGIN = 0.04;    // 내용물 주위 여백(변 길이 대비)
/* 배경 제거 문턱 — 배경색으로부터의 RGB 거리.
 * T0 이하는 완전 투명, T1 이상은 완전 불투명, 사이는 선형(가장자리 안티에일리어싱).
 * 과충전의 어두운 회색 판이 배경 회색과 가장 가까우므로 너무 키우면 그게 뚫린다. */
var T0 = 18, T1 = 52;

// 파일 이름 → ITEMS 키 (index.html 의 ITEMS 와 맞춰야 한다)
var MAP = {
  Img_ReverseCapsule: 'reverse',
  Img_OverCharge:     'power',
  Img_DrumMagazine:   'drum',
  Img_Feather:        'feather',
  Img_Anchor:         'anchor',
  Img_Pulse:          'pulse'
};

/* ---------- PNG 읽기 ---------- */
function decodePNG(buf) {
  var sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (var i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error('PNG 가 아닙니다');
  var off = 8, W = 0, H = 0, bd = 0, ct = 0, il = 0, idat = [];
  while (off < buf.length) {
    var len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8);
    var data = buf.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      W = data.readUInt32BE(0); H = data.readUInt32BE(4);
      bd = data[8]; ct = data[9]; il = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bd !== 8) throw new Error('8비트 PNG 만 지원합니다 (bitDepth=' + bd + ')');
  if (il !== 0) throw new Error('인터레이스 PNG 는 지원하지 않습니다');
  if (ct !== 2 && ct !== 6) throw new Error('트루컬러 PNG 만 지원합니다 (colorType=' + ct + ')');
  var bpp = (ct === 6) ? 4 : 3, stride = W * bpp;
  var raw = zlib.inflateSync(Buffer.concat(idat));
  var out = Buffer.alloc(H * stride), prev = Buffer.alloc(stride, 0);
  for (var y = 0; y < H; y++) {
    var ft = raw[y * (stride + 1)], line = raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    var cur = Buffer.alloc(stride);
    for (var x = 0; x < stride; x++) {
      var a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0, v = line[x];
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
  // 항상 RGBA 로 통일
  if (ct === 6) return { w: W, h: H, px: out };
  var rgba = Buffer.alloc(W * H * 4);
  for (var k = 0; k < W * H; k++) {
    rgba[k * 4] = out[k * 3]; rgba[k * 4 + 1] = out[k * 3 + 1];
    rgba[k * 4 + 2] = out[k * 3 + 2]; rgba[k * 4 + 3] = 255;
  }
  return { w: W, h: H, px: rgba };
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

/* ---------- 배경 빼기 ----------
 * 배경은 완전 단색이라 네 모서리에서 색을 읽어 그걸 기준으로 지운다.
 * 테두리에서 퍼뜨리는 방식(flood fill)이 아니라 색 거리로 지우는 이유는,
 * 닻의 고리 구멍처럼 '안쪽에 갇힌 배경'도 같이 빠져야 하기 때문이다.
 * 가장자리 픽셀은 배경과 섞여 있으므로 알파를 구한 뒤 원래 색을 되돌린다
 * (안 하면 아이콘 둘레에 회색 테가 남는다). */
function keyOut(img) {
  var W = img.w, H = img.h, px = img.px;
  function at(x, y) { var o = (y * W + x) * 4; return [px[o], px[o + 1], px[o + 2]]; }
  var cs = [at(0, 0), at(W - 1, 0), at(0, H - 1), at(W - 1, H - 1)];
  var bg = [0, 0, 0];
  for (var i = 0; i < 4; i++) for (var c = 0; c < 3; c++) bg[c] += cs[i][c] / 4;
  bg = bg.map(Math.round);

  var minD = 1e9;                                  // 진단용 — 배경에 가장 가까운 아이콘 색
  for (var k = 0; k < W * H; k++) {
    var o = k * 4, r = px[o], g = px[o + 1], b = px[o + 2];
    var d = Math.sqrt((r - bg[0]) * (r - bg[0]) + (g - bg[1]) * (g - bg[1]) + (b - bg[2]) * (b - bg[2]));
    var a = d <= T0 ? 0 : d >= T1 ? 1 : (d - T0) / (T1 - T0);
    if (a > 0.98 && d < minD) minD = d;
    if (a <= 0) { px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0; continue; }
    if (a < 1) {                                   // 섞인 색에서 배경 성분을 빼 원래 색을 복원
      px[o]     = Math.max(0, Math.min(255, Math.round((r - (1 - a) * bg[0]) / a)));
      px[o + 1] = Math.max(0, Math.min(255, Math.round((g - (1 - a) * bg[1]) / a)));
      px[o + 2] = Math.max(0, Math.min(255, Math.round((b - (1 - a) * bg[2]) / a)));
    }
    px[o + 3] = Math.round(a * 255);
  }
  return { bg: bg, minD: minD };
}

/* ---------- 내용물에 맞춰 정사각형으로 자르기 ---------- */
function cropSquare(img) {
  var W = img.w, H = img.h, px = img.px;
  var x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    if (px[(y * W + x) * 4 + 3] > 8) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new Error('내용물이 없습니다 — 문턱값(T0/T1)을 확인하세요');
  var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  var side = Math.max(x1 - x0 + 1, y1 - y0 + 1) * (1 + MARGIN * 2);
  return { x: cx - side / 2, y: cy - side / 2, side: side, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/* ---------- 축소 ----------
 * 13배쯤 줄이므로 박스 필터로 평균을 낸다. 알파를 곱한 상태(premultiplied)로 섞어야
 * 투명한 픽셀의 색이 가장자리로 새어나오지 않는다. */
function resize(img, box, N) {
  var W = img.w, H = img.h, px = img.px, out = Buffer.alloc(N * N * 4);
  var step = box.side / N;
  for (var oy = 0; oy < N; oy++) for (var ox = 0; ox < N; ox++) {
    var sx0 = box.x + ox * step, sy0 = box.y + oy * step;
    var ix0 = Math.max(0, Math.floor(sx0)), ix1 = Math.min(W - 1, Math.ceil(sx0 + step) - 1);
    var iy0 = Math.max(0, Math.floor(sy0)), iy1 = Math.min(H - 1, Math.ceil(sy0 + step) - 1);
    var r = 0, g = 0, b = 0, a = 0, n = 0;
    for (var y = iy0; y <= iy1; y++) for (var x = ix0; x <= ix1; x++) {
      var o = (y * W + x) * 4, al = px[o + 3] / 255;
      r += px[o] * al; g += px[o + 1] * al; b += px[o + 2] * al; a += al; n++;
    }
    var oo = (oy * N + ox) * 4;
    if (!n || a <= 0) { out[oo] = out[oo + 1] = out[oo + 2] = out[oo + 3] = 0; continue; }
    out[oo]     = Math.round(r / a);               // 곱한 알파를 되돌린다
    out[oo + 1] = Math.round(g / a);
    out[oo + 2] = Math.round(b / a);
    out[oo + 3] = Math.round((a / n) * 255);
  }
  return out;
}

/* ---------- 실행 ---------- */
var keep = process.argv.indexOf('--png') >= 0;     // 눈으로 확인할 PNG 도 남긴다
var icons = {}, total = 0;
console.log('아이콘 굽기 — ' + SIZE + 'px\n');
Object.keys(MAP).forEach(function (base) {
  var file = path.join(SRC, base + '.png');
  if (!fs.existsSync(file)) { console.log('  건너뜀 ' + base + '.png (없음)'); return; }
  var img = decodePNG(fs.readFileSync(file));
  var info = keyOut(img);
  var box = cropSquare(img);
  var small = resize(img, box, SIZE);
  var png = encodePNG(SIZE, SIZE, small);
  icons[MAP[base]] = 'data:image/png;base64,' + png.toString('base64');
  total += png.length;
  if (keep) fs.writeFileSync(path.join(SRC, base + '_' + SIZE + '.png'), png);
  console.log('  ' + MAP[base].padEnd(8) + img.w + 'x' + img.h +
    ' → 내용물 ' + box.w + 'x' + box.h +
    ' → ' + SIZE + 'px  ' + (png.length / 1024).toFixed(1) + 'KB' +
    '   배경 rgb(' + info.bg.join(',') + ') · 최소색거리 ' + info.minD.toFixed(0));
});

var src = '/* 자동 생성 파일 — 직접 고치지 마세요.\n' +
  '   tools/bakeicons.js 가 Image/Img_*.png 를 구워 만든 HUD 아이콘입니다.\n' +
  '   그림을 바꾸면 `node tools/bakeicons.js` 를 다시 실행하세요. */\n' +
  'window.ITEM_ICONS=' + JSON.stringify(icons) + ';\n';
fs.writeFileSync(OUT, src);
console.log('\nitemicons.js  ' + (src.length / 1024).toFixed(0) + 'KB (PNG 합계 ' +
  (total / 1024).toFixed(0) + 'KB) · 아이콘 ' + Object.keys(icons).length + '개');
