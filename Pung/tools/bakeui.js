/* UI 에셋 굽기 — Kenney 팩(전부 CC0) → uiassets.js
 *
 *   node tools/bakeui.js
 *
 * 왜 파일을 그대로 참조하지 않는가 — file:// 로 열면 크롬이 로컬 폰트·오디오 요청을
 * 교차 출처로 보고 막는다. 이 게임은 더블클릭으로도 돌아가야 하므로 data URI 로
 * 구워 넣는다(itemicons.js 와 같은 이유).
 *
 * 굽는 것:
 *   UI_FONT   Kenney Future — 라틴 전용(214 글리프)이라 쓰는 쪽에서 unicode-range 를
 *             ASCII 로 걸어 한글이 Pretendard 로 떨어지게 해야 한다.
 *   UI_KEYS   Input Prompts Pixel 타일맵 — 조작 안내의 키캡.
 *   UI_SND    UI 팩 사운드 3종. 메뉴가 무음이면 3D 는 소리가 나는데 UI 만 죽어 있다.
 *   UI_PANEL  Space Expansion 의 나사 패널 — 9-slice 프레임.
 *   UI_CURSOR 화살표 커서 두 벌(기본 / 누를 수 있는 것 위) — 메뉴에서 OS 커서 대신 쓴다.
 *
 * ※ 스프라이트는 그대로 안 쓰고 어두운 팔레트로 다시 칠한다. Kenney UI 는 밝은 회색
 *   바탕에 쓰라고 만든 것이라, 그대로 얹으면 검은 화면에 흰 판이 뜬다. 다행히 둘 다
 *   인덱스 PNG(ct=3)라 픽셀은 손댈 필요가 없다 — 팔레트만 갈아 끼우면 된다.
 */
'use strict';
var fs = require('fs'), path = require('path'), zlib = require('zlib');
var ROOT = path.join(__dirname, '..'), IMG = path.join(ROOT, 'Image');
var UIP  = path.join(IMG, 'kenney_ui-pack');
var SPX  = path.join(IMG, 'kenney_ui-pack-space-expansion');
var OUT  = path.join(ROOT, 'uiassets.js');

/* ---------- PNG 팔레트 교체 ----------
   인덱스 PNG 는 [IHDR][PLTE][tRNS][IDAT…][IEND] 구조라, 픽셀 데이터(IDAT)를 건드리지
   않고 PLTE·tRNS 만 새로 써도 그림 전체의 색이 바뀐다. 압축을 풀 필요조차 없다. */
var CRCT = (function(){ var t=new Int32Array(256);
  for(var n=0;n<256;n++){ var c=n; for(var k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[n]=c; }
  return t; })();
function crc32(buf){ var c=0xFFFFFFFF;
  for(var i=0;i<buf.length;i++) c=CRCT[(c^buf[i])&0xFF]^(c>>>8);
  return (c^0xFFFFFFFF)>>>0; }
function chunk(type, data){
  var out=Buffer.alloc(12+data.length);
  out.writeUInt32BE(data.length,0); out.write(type,4,'latin1');
  data.copy(out,8); out.writeUInt32BE(crc32(out.slice(4,8+data.length)), 8+data.length);
  return out;
}
function readChunks(buf){
  var i=8, out=[];
  while(i<buf.length){
    var len=buf.readUInt32BE(i), type=buf.toString('latin1',i+4,i+8);
    out.push({type:type, data:buf.slice(i+8,i+8+len)});
    i+=12+len;
  }
  return out;
}
/* map(r,g,b,a) → [r,g,b,a]. 팔레트 항목마다 한 번씩만 불린다. */
function repalette(file, map){
  var buf=fs.readFileSync(file), cs=readChunks(buf);
  var plte=null, trns=null;
  cs.forEach(function(c){ if(c.type==='PLTE')plte=c.data; else if(c.type==='tRNS')trns=c.data; });
  if(!plte) throw new Error(path.basename(file)+' 은 인덱스 PNG 가 아니다(팔레트 없음)');
  var n=plte.length/3, np=Buffer.alloc(plte.length), nt=Buffer.alloc(n);
  for(var k=0;k<n;k++){
    var a=(trns && k<trns.length) ? trns[k] : 255;
    var c=map(plte[k*3], plte[k*3+1], plte[k*3+2], a);
    np[k*3]=c[0]&255; np[k*3+1]=c[1]&255; np[k*3+2]=c[2]&255; nt[k]=c[3]&255;
  }
  var parts=[buf.slice(0,8)];
  cs.forEach(function(c){
    if(c.type==='PLTE'){ parts.push(chunk('PLTE',np), chunk('tRNS',nt)); }
    else if(c.type==='tRNS'){ /* 위에서 이미 새로 썼다 */ }
    else parts.push(chunk(c.type, c.data));
  });
  return Buffer.concat(parts);
}
function lum(r,g,b){ return (r*0.3+g*0.59+b*0.11)/255; }
function mix(a,b,t){ t=Math.max(0,Math.min(1,t));
  return [Math.round(a[0]+(b[0]-a[0])*t), Math.round(a[1]+(b[1]-a[1])*t), Math.round(a[2]+(b[2]-a[2])*t)]; }

/* 패널 — 원본은 '밝은 몸통 + 어두운 테두리'다. 명도를 뒤집어 '어두운 몸통 + 밝은
   테두리'로 만든다. 나사·베벨의 미세한 명암 차이는 뒤집혀도 그대로 살아 있어서
   판이 평평해 보이지 않는다. 몸통은 살짝 비쳐야 뒤의 게임이 보인다. */
var PANEL_EDGE=[0x5a,0x74,0xa4], PANEL_BODY=[0x10,0x18,0x26];
function panelMap(r,g,b,a){
  var t=Math.pow(Math.max(0,(lum(r,g,b)-0.55)/0.45), 0.6);   // 0.55~1.0 → 0~1
  var c=mix(PANEL_EDGE, PANEL_BODY, t);
  return [c[0], c[1], c[2], a>250 ? 236 : a];                 // 불투명한 몸통만 살짝 비치게
}
/* 커서 — 검은 윤곽선은 그대로 두고 속만 밝게. 어두운 화면에서 흰 화살표가 제일 잘 보인다. */
function cursorMap(r,g,b,a){
  var L=lum(r,g,b);
  if(L<0.02) return [0x04,0x07,0x0c,a];                       // 윤곽선(알파로 계단을 만든 부분)
  var c=mix([0x5b,0x70,0x99],[0xff,0xff,0xff], L);
  return [c[0],c[1],c[2],a];
}

var font = fs.readFileSync(path.join(UIP,'Font','Kenney Future.ttf'));
var keys = fs.readFileSync(path.join(IMG,'kenney_input-prompts-pixel','Tilemap','tilemap_packed.png'));
var panel  = repalette(path.join(SPX,'PNG','Extra','Default','panel_glass_screws.png'), panelMap);
/* 커서 두 벌 — 화살표(기본)와 점 붙은 화살표(누를 수 있는 것 위). OS 의 손가락 커서로
   갈아타면 그 순간만 윈도우 커서가 튀어나와서, 공들여 바꾼 티가 오히려 난다. */
var cursor = repalette(path.join(SPX,'PNG','Extra','Default','cursor_a.png'), cursorMap);
var cursor2= repalette(path.join(SPX,'PNG','Extra','Default','cursor_d.png'), cursorMap);
/* 소리 셋. 더 넣지 않는 이유 — UI 소리는 종류가 늘수록 시끄러워지고, 이 세 가지가
   '스쳤다 / 눌렀다 / 화면이 바뀌었다'라는 서로 다른 사건을 정확히 덮는다. */
var SND = {
  tap:    path.join(UIP,'Sounds','tap-b.ogg'),      // 버튼 위를 지나갈 때
  click:  path.join(UIP,'Sounds','click-a.ogg'),    // 눌렀을 때
  swap:   path.join(UIP,'Sounds','switch-a.ogg')    // 화면이 바뀔 때
};

function uri(mime, buf){ return 'data:'+mime+';base64,'+buf.toString('base64'); }
var lines = [
  '/* 자동 생성 파일 — 직접 고치지 마세요. tools/bakeui.js 가 만듭니다.',
  '   Kenney UI Pack + Space Expansion + Input Prompts Pixel, 전부 CC0.',
  '   스프라이트는 원본이 아니라 어두운 팔레트로 다시 칠한 것입니다. */',
  'window.UI_FONT="'   + uri('font/ttf',  font)   + '";',
  'window.UI_KEYS="'   + uri('image/png', keys)   + '";',
  'window.UI_PANEL="'  + uri('image/png', panel)  + '";',
  'window.UI_CURSOR="' + uri('image/png', cursor) + '";',
  'window.UI_CURSOR2="'+ uri('image/png', cursor2)+ '";',
  'window.UI_SND={'
];
var snd=[];
Object.keys(SND).forEach(function(k){ snd.push(k+':"'+uri('audio/ogg', fs.readFileSync(SND[k]))+'"'); });
lines.push(snd.join(',\n'), '};', '');
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');

var kb=function(b){ return (b.length/1024).toFixed(1)+'KB'; };
console.log('uiassets.js 기록 완료 — 폰트 '+kb(font)+' · 키 '+kb(keys)
  +' · 패널 '+kb(panel)+' · 커서 '+kb(cursor)+'/'+kb(cursor2)
  +' · 소리 '+Object.keys(SND).length+'종 · 전체 '+(fs.statSync(OUT).size/1024).toFixed(0)+'KB');
