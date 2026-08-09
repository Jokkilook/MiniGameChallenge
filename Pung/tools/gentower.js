/* 관제탑 생성기 — levels/tower.js 를 찍어낸다.  `node tools/gentower.js`

   지금까지의 여섯 맵은 전부 한 겹짜리 판이었다. 여러 층을 위해 있는 맵을 뜯어고치면
   그 맵의 설계가 망가진다 — 실제로 한 번 그렇게 했다가 되돌렸다. 그래서 층을 위한
   판은 층을 위해 새로 짓는다.

   ---- 무엇을 노리나 ----
   여섯이 뛰는 판. 지름 50m 로 넓고, 세 층으로 높다.
     1층 y=0.0   넓은 원형 갑판 — 여기가 주 싸움터
     2층 y=4.5   가운데가 뚫린 고리 — 아래로도 위로도 쏜다
     3층 y=9.0   중앙 원반 — 제일 좁고 제일 높다
   간격은 물리에서 나왔다. 로켓점프 한 번이 8.38m 이므로
     1→2 (4.5m) · 2→3 (4.5m) 는 혼자 오르고,
     1→3 (9.0m) 는 혼자서는 못 오른다. 팀원이 리프트로 받쳐 주면 18.08m 까지 가므로
   맨 위로 한 번에 오르는 것은 팀전에서만 되는 수가 된다.

   ---- 톤 ----
   station 킷 하나만 쓴다. 사용자가 가장 좋아하는 맵 셋 중 둘(우주 정거장·정거장
   격납고)이 이 킷이라 나란히 놓아도 겉돌지 않는다. 다른 킷 조각은 한 장도 안 섞는다.
   킷에 없는 것은 안 만든다 — 컨베이어도 점프대도 station 킷에는 없으므로 안 넣는다.
   움직이는 것은 승강기와 점멸 발판 둘뿐이고, 둘 다 킷의 바닥 조각으로 그려진다.

   ---- 늘리지 않는다 ----
   움직이는 발판의 상자 크기를 조각 크기의 정수배로 잡는다. 조각을 상자에 맞춰
   늘리면 난간과 테두리까지 같이 늘어나 킷의 톤이 깨진다(그 실수를 이미 한 번 했다).
   skinTile 을 켜면 늘리는 대신 여러 장을 깐다. */
'use strict';
var fs=require('fs'), path=require('path');
var ROOT=path.join(__dirname,'..');
global.window=global;
require(path.join(ROOT,'meshlib.js'));
require(path.join(ROOT,'gunmesh.js'));
require(path.join(ROOT,'level.js'));
eval(fs.readFileSync(path.join(ROOT,'stationbaked.js'),'utf8'));
var BAG=global.STATION_BAKED;
function ext(name){
  var m=GunMesh.decodeBaked(BAG[name]);
  var mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  for(var v=0;v<m.pos.length;v+=3) for(var a=0;a<3;a++){ var p=m.pos[v+a]; if(p<mn[a])mn[a]=p; if(p>mx[a])mx[a]=p; }
  return {w:mx[0]-mn[0], d:mx[2]-mn[2], top:mx[1], tris:Math.round(m.idx.length/3)};
}

/* 1킷유닛 = 2.95m. 우주 정거장이 쓰는 값 그대로다 — 그 판의 주석에 이유가 적혀 있다:
   문 구멍이 0.65유닛이라 2.95 여야 1.92m 가 되어 사람(1.8m)이 실제로 지나간다.
   같은 킷을 다른 배율로 쓰면 나란히 놓았을 때 같은 조각이 다른 크기로 보인다. */
var UNIT=2.95;
var FLOOR_TOP=ext('floor').top;            // 바닥 조각 윗면(로컬 유닛)
var CELL_M=ext('floor').w*UNIT;            // 바닥 조각 한 장의 월드 크기
var R1=8.5, R2_IN=3.5, R2_OUT=6.5, R3=3.0; // 층별 반지름(킷유닛)
var Y2=4.5, Y3=9.0;

/* ---------- 승강기 자리 ----------
   승강기는 2층 고리의 한가운데 반지름을 오르내린다. 그러니 고리에 그만큼 구멍을
   내지 않으면 승강기가 사람을 갑판 밑면에 밀어붙인다 — 실제로 그랬다. 발판은
   4.5m 까지 올라가는데 갑판 밑면이 3.61m 라, 키 1.8m 인 사람은 발판이 1.81m 일 때
   이미 천장에 닿아 절반도 못 올라갔다.
   그래서 자리를 여기 한 번만 적고, 구멍과 발판 상자가 같은 값에서 나오게 한다.
   따로 적으면 한쪽만 옮겼을 때 다시 막힌다.

   자리는 각도가 아니라 칸으로 적는다. 아래 CELLS 의 칸 중심이 정수라, 발판(2×2칸)을
   정수 자리에 두면 아홉 칸에 반씩 걸쳐 어느 칸을 빼도 구멍이 안 맞는다. 반 칸 어긋난
   자리에 두어야 네 칸에 딱 떨어진다.
   구멍은 고리 바깥쪽에 붙인다(안쪽 j=4 줄이 통로로 남는다). 안쪽에 붙이면 남는 통로가
   바깥 줄이 되고, 구멍이 가운데 빈 공간과 이어져 헛디디면 1층도 없이 그대로 떨어진다. */
var LIFT_HALF=CELL_M/UNIT;                 // 발판 반크기(킷유닛) — 조각 한 장
var LIFT_R=(R2_IN+R2_OUT)/2;               // 2층 패드를 놓는 반지름(고리 한가운데)
var LIFTS=[{i:0.5, j:5.5}, {i:-0.5, j:-5.5}];   // 원점 대칭 — 밀어내는 경기에서 비대칭은 불공정이다
function inLiftShaft(i,j){
  for(var k=0;k<LIFTS.length;k++)
    if(Math.abs(i-LIFTS[k].i)<LIFT_HALF && Math.abs(j-LIFTS[k].j)<LIFT_HALF) return true;
  return false;
}

var P=[], BOX=[];
function put(t,i,j,y,extra){
  var o={t:'station/'+t, i:+i.toFixed(2), j:+j.toFixed(2), y:+y.toFixed(3)};
  if(extra) for(var k in extra) o[k]=extra[k];
  P.push(o);
}
function box(o){ BOX.push(o); }
function u2m(u){ return u*UNIT; }
// 조각 윗면이 정확히 이 높이(m)에 오도록 조각 원점을 내린다
function atTop(m){ return m/UNIT - FLOOR_TOP; }

// 칸 목록 — 중심이 반칸씩 어긋난 격자(0.5, 1.5, …)라 가운데가 칸 경계가 아니다
var CELLS=[]; for(var c=-R1; c<=R1; c+=1) CELLS.push(+(c+0.5).toFixed(1));

/* ---------- 1층 : 원형 갑판 ----------
   바닥 무늬로 구역을 읽히게 한다 — 격납고 생성기가 쓰는 방식 그대로다.
   가운데는 뚫려 있다. 위 두 층이 그 위에 떠 있어서, 아래에서 올려다보면 3층까지
   한눈에 보인다. 층이 몇 개인지가 설명 없이 읽히는 게 이 구조의 값어치다. */
var HOLE=R2_IN;
CELLS.forEach(function(i){ CELLS.forEach(function(j){
  var r=Math.hypot(i,j);
  if(r>R1 || r<HOLE) return;
  var t='floor';
  if(r>R1-1.5) t='floor-detail';                     // 바깥 테두리
  else if(((Math.round(i-0.5)+Math.round(j-0.5))&1)===0) t='floor-panel';
  put(t, i, j, atTop(0));
}); });

/* ---------- 2층 : 가운데가 뚫린 고리 ----------
   승강기가 올라오는 자리는 뚫어 둔다. 고리는 여기서 안쪽 한 칸(2.95m)으로 좁아지지만
   끊기지는 않는다 — 승강기 구멍을 안쪽으로 돌아 지나갈 수 있다. */
CELLS.forEach(function(i){ CELLS.forEach(function(j){
  var r=Math.hypot(i,j);
  if(r>R2_OUT || r<R2_IN) return;
  if(inLiftShaft(i,j)) return;
  put(((Math.round(i-0.5)+Math.round(j-0.5))&1)===0 ? 'floor-panel' : 'floor', i, j, atTop(Y2));
}); });

/* ---------- 3층 : 중앙 원반 ---------- */
CELLS.forEach(function(i){ CELLS.forEach(function(j){
  if(Math.hypot(i,j)>R3) return;
  put('floor-detail', i, j, atTop(Y3));
}); });

/* ---------- 난간 ----------
   높은 판에서는 '여기가 끝' 이 발밑으로 안 읽히면 그냥 사고사가 된다. 각 층
   바깥 둘레에 킷의 rail 을 두른다. 0.40유닛(1.18m)이라 점프(1.68m)로 넘어갈 수 있다 —
   막는 벽이 아니라 표시다. 넘어서 뛰어내리는 것은 여전히 내 선택이어야 한다. */
function ring(rad, topY, n, t, s){
  for(var q=0;q<n;q++){
    var a=q*2*Math.PI/n;
    put(t, rad*Math.cos(a), rad*Math.sin(a), atTop(topY),
        {ry:+(-a*180/Math.PI+90).toFixed(1), s:s||1, deco:true});
  }
}
ring(R1-0.2,   0,  Math.round(2*Math.PI*(R1-0.2)),   'rail');
ring(R2_OUT-0.2, Y2, Math.round(2*Math.PI*(R2_OUT-0.2)), 'rail');
ring(R3-0.2,   Y3, Math.round(2*Math.PI*(R3-0.2)),   'rail');

/* 계단은 두지 않는다.
   stairs 한 단이 0.885m 라 1층 → 2층 4.5m 에는 여섯 단이 필요하고, 그 여섯 단은
   가로로 5.4칸을 먹는다. 그런데 2층 고리 바깥(6.5)과 갑판 테두리(8.5) 사이는
   2칸뿐이다 — 넣어 봤더니 계단이 바깥으로 올라가 꼭대기가 고리가 아니라 허공에서
   끝났다(평면도에서 걸렸다).
   억지로 밀어 넣는 대신 없앤다. '탄을 안 쓰고 오르는 길' 은 승강기가 이미 맡고 있고,
   그것이 이 판에서 station 킷으로 설명되는 방식이다. */

/* ---------- 승강기 둘 : 1층 ↔ 2층 ----------
   상자 크기를 조각 두 장(2×2 칸)에 정확히 맞춘다. skinTile 이 늘리는 대신
   네 장을 깔아 주므로 조각이 원래 크기 그대로다.
   주기 8초 · 진폭 2.25m → 최대 1.77m/s. 느린 이유는 위에 탄 사람이 발판보다
   늦으면 미끄러지기 때문이다. */
LIFTS.forEach(function(L,k){
  box({ cx:+u2m(L.i).toFixed(2), cy:+(Y2/2-0.15).toFixed(2), cz:+u2m(L.j).toFixed(2),
        hx:CELL_M, hy:0.15, hz:CELL_M, col:'#5a7bb0',
        skin:'station/floor-panel', skinTile:true,
        move:{ax:'y', amp:Y2/2, t:8, ph:k*0.5} });   // 윗면 0 ↔ Y2
});

/* ---------- 점멸 발판 셋 : 2층 → 3층 ----------
   맨 위로 가는 길. 3층은 1층에서 혼자 못 오르므로(9.0m > 8.38m) 2층을 거치거나
   팀원이 올려 줘야 하는데, 이 발판이 2층에서 가는 길이다.
   위상을 어긋나게 둬서 '지금 어느 길이 열렸나' 를 보게 만든다 — 셋이 같이 열리고
   닫히면 그냥 기다림이 되고, 기다림은 선택이 아니다. */
[0,1,2].forEach(function(q){
  var a=q*2*Math.PI/3 + Math.PI/6, r=u2m((R3+R2_IN)/2+0.4);
  box({ cx:+(Math.cos(a)*r).toFixed(2), cy:+((Y2+Y3)/2-0.15).toFixed(2), cz:+(Math.sin(a)*r).toFixed(2),
        hx:CELL_M/2, hy:0.15, hz:CELL_M/2, col:'#5a7bb0',
        skin:'station/floor', skinTile:true,
        phase:{on:3.0, off:1.5, at:+(q*1.0).toFixed(2)} });
});

/* ---------- 소품 ----------
   톤을 위해서만 둔다. 갑판 위에 사람 크기의 물건이 하나도 없으면 넓이가 안 읽히고,
   너무 많으면 넉백 한 번(3m 남짓)이 '날아간다' 대신 '부딪힌다' 가 된다.
   가장자리 쪽에만, 사분면마다 한 벌씩. */
[0,1,2,3].forEach(function(q){
  var a=Math.PI/4 + q*Math.PI/2, r=R1-2.2;
  put('container',      r*Math.cos(a),        r*Math.sin(a),        atTop(0), {ry:q*90});
  put('container-tall', (r-1)*Math.cos(a+0.3),(r-1)*Math.sin(a+0.3),atTop(0), {ry:q*90+30});
  put('pipe',           (r+0.7)*Math.cos(a-0.35),(r+0.7)*Math.sin(a-0.35), atTop(0), {ry:q*90, deco:true});
});
// 3층 한가운데 — 관제탑이라는 이름의 근거
put('computer-system', 0, 0, atTop(Y3), {deco:true});
[[1,0],[0,1],[-1,0],[0,-1]].forEach(function(d,q){
  put('table-display', d[0]*1.6, d[1]*1.6, atTop(Y3), {ry:q*90, deco:true});
});

/* ---------- 스폰 · 패드 ----------
   여섯 자리. 이 판은 여섯이 뛰라고 지은 것이라 넷만 두면 두 명이 겹쳐 선다. */
var SPAWN=[], PADS=[];
for(var q=0;q<6;q++){
  var a=q*Math.PI/3 + Math.PI/6, r=u2m(R1-1.6);
  SPAWN.push({x:+(Math.cos(a)*r).toFixed(2), y:0.2, z:+(Math.sin(a)*r).toFixed(2)});
}
/* 높은 자리일수록 좋은 것을 둔다 — 올라가는 값이 있어야 층이 살아난다.
   3층 하나 · 2층 둘 · 1층 둘. */
PADS.push({x:0, y:Y3+0.2, z:0});
/* 2층 패드는 승강기와 90° 어긋나게 둔다. 승강기 자리는 이제 구멍이라, 예전처럼
   같은 각도에 두면 패드가 허공에 뜬다. */
[0,1].forEach(function(k){
  var a=k*Math.PI, r=u2m(LIFT_R);
  PADS.push({x:+(Math.cos(a)*r).toFixed(2), y:Y2+0.2, z:+(Math.sin(a)*r).toFixed(2)});
});
[0,1].forEach(function(k){
  var a=k*Math.PI, r=u2m(R1-3);
  PADS.push({x:+(Math.cos(a)*r).toFixed(2), y:0.2, z:+(Math.sin(a)*r).toFixed(2)});
});

/* ---------- 파일로 ---------- */
function j(o){ return JSON.stringify(o).replace(/"([a-z0-9_]+)":/gi,'$1:').replace(/,/g,', '); }
var L=[];
L.push("/* PUNG! 레벨 — 관제탑. tools/gentower.js 가 찍어낸 파일입니다.");
L.push("   직접 고치지 말고 생성기를 고친 뒤 `node tools/gentower.js` 를 다시 도세요.");
L.push("");
L.push("   여섯이 뛰라고 지은 세 층짜리 판입니다. 지름 " + (u2m(R1)*2).toFixed(0) + "m.");
L.push("     1층 0m · 2층 " + Y2 + "m · 3층 " + Y3 + "m");
L.push("   간격은 물리에서 나왔습니다 — 로켓점프 한 번이 8.38m 라 한 층씩은 혼자 오르고,");
L.push("   1층에서 3층(" + Y3 + "m)은 혼자 못 오릅니다. 팀원이 리프트로 받쳐 주면");
L.push("   18.08m 까지 가므로, 맨 위로 한 번에 오르는 것은 팀전에서만 되는 수입니다.");
L.push("");
L.push("   조각은 station 킷 하나만 씁니다 — 우주 정거장·정거장 격납고와 같은 킷이라");
L.push("   나란히 놓아도 겉돌지 않습니다. 킷에 없는 것은 안 만들었습니다(컨베이어도");
L.push("   점프대도 station 킷에는 없으므로 넣지 않았습니다). */");
L.push("PUNG.defineLevel('tower', {");
L.push("  name: '관제탑 (경쟁)',");
L.push("  unit: " + UNIT + ",");
L.push("  boxes: [");
L.push("    // 저 아래 배경 바닥(deco = 밟히지 않는다)");
L.push("    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#0d1420', deco:true},");
BOX.forEach(function(b,n){ L.push("    "+j(b)+(n<BOX.length-1?",":"")); });
L.push("  ],");
L.push("  pieces: [");
P.forEach(function(p,n){ L.push("    "+j(p)+(n<P.length-1?",":"")); });
L.push("  ],");
L.push("  arena: true,");
L.push("  space: true,");
L.push("  goal: {cx:0, cy:-999, cz:0, r:0.1},");
L.push("  checkpoints: [ "+j(SPAWN[0])+" ],");
L.push("  killY: -30,");
L.push("  start: "+j(SPAWN[0])+",");
L.push("  spawns: [ "+SPAWN.map(j).join(", ")+" ],");
L.push("  pads: [ "+PADS.map(j).join(", ")+" ],");
L.push("  hints: [ '세 층입니다 — <b>로켓점프</b>로 한 층씩 오르고, 꼭대기는 2층을 거치거나 <b>팀원이 올려</b> 줘야 닿습니다.' ]");
L.push("});");
fs.writeFileSync(path.join(ROOT,'levels','tower.js'), L.join('\n')+'\n', 'utf8');

var tris=P.reduce(function(a,p){ return a+ext(p.t.split('/')[1]).tris; },0);
console.log('levels/tower.js 를 썼습니다');
console.log('  조각 '+P.length+'장 · 상자 '+(BOX.length+1)+'개 · 삼각형 약 '+tris.toLocaleString());
console.log('  지름 '+(u2m(R1)*2).toFixed(1)+'m · 층 0 / '+Y2+' / '+Y3+'m · 스폰 '+SPAWN.length);
console.log('  킷: station 하나만 ('+[...new Set(P.map(function(p){return p.t.split('/')[0];}))].join(', ')+')');
