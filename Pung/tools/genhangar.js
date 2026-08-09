/* 격납고 재설계 생성기 — levels/hangar.js 를 찍어낸다.
   손으로 96칸을 적으면 대칭이 반드시 한 칸 어긋난다. 규칙으로 적고 규칙이 대칭을 보장하게 한다. */
'use strict';
var fs = require('fs'), path = require('path');

var UNIT = 2.95;
var IH = 5.5, JH = 3.5;          // 갑판 반쪽(칸 중심 최대값) → 12 x 8 칸
var PIT_I = 3.5, PIT_J = 0.5;    // 피트가 덮는 칸 범위
var BRIDGE_I = 0.5;              // 가운데 다리가 차지하는 i (|i| <= 0.5)
var PLAT_I = 4.5, PLAT_J = 2.5;  // 모서리 단(2x2 칸)의 안쪽 모서리

function cells(h){ var a=[]; for(var v=-h; v<=h; v+=1) a.push(+v.toFixed(1)); return a; }
var IS = cells(IH), JS = cells(JH);

function inPit(i,j){ return Math.abs(i)<=PIT_I && Math.abs(j)<=PIT_J && Math.abs(i)>BRIDGE_I; }
function onBridge(i,j){ return Math.abs(i)<=BRIDGE_I && Math.abs(j)<=PIT_J; }
function onPlat(i,j){ return Math.abs(i)>=PLAT_I && Math.abs(j)>=PLAT_J; }

var P = [];
function put(t,i,j,y,extra){
  var o = {t:t, i:+i.toFixed(3), j:+j.toFixed(3), y:y};
  if(extra) for(var k in extra) o[k]=extra[k];
  P.push(o);
}

/* ---------- 1층 갑판 ----------
   바닥 무늬로 구역을 읽히게 한다. 다리는 floor-panel(줄무늬)이라 달려오면서도
   "여기서부터 발밑이 없다" 가 보이고, 피트에 접한 줄은 floor-detail 로 테두리를 준다. */
IS.forEach(function(i){ JS.forEach(function(j){
  if(inPit(i,j)) return;                                  // 피트 = 바닥 없음
  var t = 'station/floor';
  if(onBridge(i,j)) t = 'station/floor-panel';            // 가운데 다리
  else if(Math.abs(j)===1.5 && Math.abs(i)<=PIT_I) t='station/floor-detail';   // 피트 양옆 가장자리
  else if(Math.abs(i)===4.5 && Math.abs(j)<=1.5) t='station/floor-detail';     // 피트 끝 가장자리
  else if(((i+j)|0) % 2 === 0) t='station/floor-panel';   // 나머지는 체크무늬로 결만
  put(t, i, j, -0.3);
}); });

/* ---------- 모서리 단(0.885m) ----------
   높은 자리가 하나도 없으면 판이 통째로 한 평면이라 눈이 쉴 데가 없고, 조준도 전부 수평이 된다.
   2x2 칸이라 올라가도 도망칠 자리가 있다(1칸이면 올라가는 순간 궁지다). */
[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(s){
  [PLAT_I, PLAT_I+1].forEach(function(ai){ [PLAT_J, PLAT_J+1].forEach(function(aj){
    put('station/floor-panel', s[0]*ai, s[1]*aj, 0);
  }); });
  /* 계단은 단 하나마다 하나만(둘이면 단이 통로가 되어 위가 안전해진다).
     자리는 '긴 변의 바깥 줄' 이다 — 차선이 만나는 모서리에 두었더니 몸이 계단에 걸려
     짧은 변 통로가 그 자리에서 끊겼다(실측: x=14 에서 z=3.5 가 막힘).
     바깥 줄로 물리면 안쪽 두 줄(5.9m)과 짧은 변(5.9m)이 통째로 열린 채 남는다. */
  put('station/stairs', s[0]*(PLAT_I-1), s[1]*(PLAT_J+1), 0.004, {rot: s[0]>0 ? 3 : 1});
});

/* ---------- 바깥 테두리 소품 ----------
   전부 '가장 바깥 한 줄'에만 둔다. 달리는 차선(안쪽 두 줄)에는 아무것도 놓지 않는다 —
   숲 공터가 소품 사이에 몸이 끼어 못 달리던 것이 정확히 이 규칙이 없어서였다. */
[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(s){
  // 모서리 단 위 — 올라설 수 있는 엄폐물과 콘솔. 단은 차선 밖이라 여기는 채워도 안 막힌다
  put('station/container', s[0]*(PLAT_I+1), s[1]*(PLAT_J+1), 0.304,
      {rot: s[0]>0 ? (s[1]>0?0:1) : (s[1]>0?3:2), sx:1.15, sy:1.15, sz:1.15});
  put('station/computer-system', s[0]*PLAT_I, s[1]*(PLAT_J+1), 0.304, {rot: s[1]>0?2:0});
});
/* 긴 변 테두리에 파이프를 한 줄 세워 봤다가 뺐다. 조각이 칸 가운데에 있지 않아서
   회전을 어떻게 주어도 좌우 발자국이 1.5m 대 0.8m 로 갈렸다 — 판이 거울 대칭이 아니게
   되고, 그 차이가 하필 사람이 밀려 떨어지는 테두리에 생긴다.
   소품은 전부 모서리 단(차선 밖·0.885m 위)에만 둔다. */
/* 짧은 변(끝 차선)에는 아무것도 두지 않는다. 폭이 5.9m 뿐이라 무엇을 놓아도 통로가
   절반이 되고, 그 순간 이 맵은 숲 공터가 된다 — 소품 사이에 몸이 끼어 못 달리는 판.
   대신 그 자리는 '한 대 맞으면 곧 낭떠러지' 라는 긴장으로 채운다. */
// 다리 한가운데의 관제 테이블 — 패드 자리 표시이자 '여기가 중심' 이라는 표식(장식이라 통과한다)
put('station/table-display-planet', 0, 0, 0.004, {sx:1.5, sy:1.5, sz:1.5, deco:true});

/* ---------- 스폰 · 패드 ---------- */
var U = UNIT;
function w(u){ return +(u*U).toFixed(3); }
// 스폰 네 곳 — 차선 안쪽, 모서리 단 앞. 피트에서 멀고 서로 18m 이상 떨어져 있다
var spawns = [[3.0,2.5],[3.0,-2.5],[-3.0,2.5],[-3.0,-2.5]].map(function(p){
  return { x:w(p[0]), y:0.2, z:w(p[1]) };
});
/* 패드 다섯 — 가운데 다리 하나(가장 위험) + 모서리 단 넷(안전하지만 멀다).
   모서리 패드는 단의 '안쪽' 칸이다. 바깥 칸에 두었더니 네 곳 중 둘에서 컨테이너가
   그 칸까지 걸쳐서, 패드가 컨테이너 지붕 위에 얹혔다(실측: 바닥이 0.885 가 아니라 2.67m).
   컨테이너는 바깥 칸, 패드는 안쪽 칸 — 한 칸씩 떼어 두면 회전이 어떻든 안 겹친다. */
var pads = [{ x:0, y:0, z:0 }];
[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function(s){
  pads.push({ x:w(s[0]*PLAT_I), y:0.885, z:w(s[1]*PLAT_J) });
});

/* ---------- 파일 ---------- */
function fmt(o){
  var k=['t','i','j','y','rot','sx','sy','sz','deco'], p=[];
  k.forEach(function(n){ if(o[n]==null) return;
    p.push(n+':'+(typeof o[n]==='string' ? "'"+o[n]+"'" : o[n])); });
  return '    {'+p.join(', ')+'}';
}
function pt(a){ return '{x:'+a.x+', y:'+a.y+', z:'+a.z+'}'; }

var out = [
"/* PUNG! 레벨 — tools 로 생성했다(격납고 재설계). 손으로 고쳐도 된다.",
"   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다.",
"",
"   원반이 아니라 직사각 갑판이다. 같은 면적이면 원이 둘레가 가장 짧은데, 이 게임은",
"   둘레가 곧 킬 기회라 그게 손해다. 가운데를 세로로 가르는 정비 피트가 둘레를 한 번 더 준다.",
"",
"   치수의 근거:",
"     피트 폭 5.9m — 평지 점프 4.14m 로는 못 건너고 로켓점프 9.25m 로는 건너진다.",
"                    걸어서는 돌아가야 하고, 아는 사람만 질러갈 수 있는 폭이다.",
"     차선 폭 8.85m(긴 변) · 5.9m(짧은 변) — 넉백 한 번이 3m 남짓이라, 긴 변은 한 대",
"                    맞아도 버티고 짧은 변은 한 대가 곧 낭떠러지다. 그 차이가 지형이다.",
"     소품은 바깥 한 줄에만 — 숲 공터가 소품 사이에 몸이 끼어 못 달리던 것을 피한다.",
"*/",
"PUNG.defineLevel('hangar', {",
"  name: '정거장 격납고 (경쟁)',",
"  unit: "+UNIT+",",
"  boxes: [",
"    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다",
"    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#161f33', deco:true}",
"  ],",
"  pieces: [",
P.map(fmt).join(',\n'),
"  ],",
"  arena: true,",
"  space: true,",
"  goal: {cx:0, cy:-999, cz:0, r:0.1},",
"  checkpoints: [ "+pt(spawns[0])+" ],",
"  killY: -30,",
"  start: "+pt(spawns[0])+",",
"  spawns: [ "+spawns.map(pt).join(', ')+" ],",
"  pads: [ "+pads.map(pt).join(', ')+" ],",
"  hints: [ '가운데 <b>정비 피트</b>는 걸어서 못 건넙니다 — 돌아가거나, 발밑을 쏴 <b>로켓점프</b>로 질러가세요.' ]",
"});",
""].join('\n');

var dest = path.join(__dirname, 'hangar.js');
if(process.argv[2]) dest = process.argv[2];
fs.writeFileSync(dest, out);
console.log('썼다:', dest);
console.log('  조각', P.length, '개  (바닥칸', P.filter(function(p){return p.y===-0.3;}).length, ')');
console.log('  갑판', (2*IH+1)*UNIT.toFixed(2)+'m x '+((2*JH+1)*UNIT).toFixed(2)+'m');
console.log('  피트', ((2*PIT_I+1-(2*BRIDGE_I+1))/2*UNIT).toFixed(2)+'m x '+((2*PIT_J+1)*UNIT).toFixed(2)+'m  (좌우 2개)');
