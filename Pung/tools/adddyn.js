/* 있는 맵에 '움직이는 것'만 얹는다 — `node tools/adddyn.js`
   levels/*.js 의 원본 조각은 한 장도 건드리지 않는다. boxes 배열 끝에 표식이 달린
   덩어리를 끼워 넣을 뿐이고, 다시 돌리면 그 덩어리만 걷어내고 새로 넣는다.

   ---- 왜 이렇게 하나 ----
   처음에는 생성기로 맵을 통째로 다시 찍어냈다. 결과는 기능은 붙었는데 디자인이
   퇴보한 판이었다 — 원본이 손으로 놓아 둔 기계·호퍼·파이프·크레이트·경고판·
   가운데 톱니가 전부 사라지고 체커보드 원판만 남았다. 판을 다시 그리는 것과
   기능을 더하는 것은 다른 일이고, 여기서 할 일은 뒤쪽이다.

   그래서 규칙을 셋 둔다.
     1. 원본 pieces 는 읽기만 한다. 한 장도 지우거나 옮기지 않는다.
     2. 새로 놓는 것의 자리는 **원본에서 계산해서** 정한다 — 컨베이어가 어디 깔려
        있는지, 캣워크가 몇 미터인지를 데이터에서 읽어 거기에 맞춘다. 좌표를 손으로
        적으면 원본을 조금만 고쳐도 어긋난다.
     3. 보이는 것은 원본이 이미 쓰는 킷 조각으로만 그린다(skin). 새 재료를 들이지
        않는다 — 민무늬 상자가 킷 위에서 튀는 것이 애초에 문제였다. */
'use strict';
var fs=require('fs'), path=require('path');
var ROOT=path.join(__dirname,'..');
global.window=global;
require(path.join(ROOT,'meshlib.js'));
require(path.join(ROOT,'gunmesh.js'));
require(path.join(ROOT,'level.js'));

// ---- 킷 조각의 윗면 높이(로컬 유닛). 발판 윗면을 맞추는 데 쓴다 ----
var BAKED={};
['factory','proto','survival'].forEach(function(k){
  eval(fs.readFileSync(path.join(ROOT,k+'baked.js'),'utf8'));
});
var BAGS={factory:global.FACTORY_BAKED, proto:global.PROTO_BAKED, survival:global.SURVIVAL_BAKED};
function pieceTop(full){
  var p=full.split('/'), raw=BAGS[p[0]] && BAGS[p[0]][p[1]];
  if(!raw) throw new Error('없는 조각: '+full);
  var m=GunMesh.decodeBaked(raw), mx=-1e9;
  for(var v=1; v<m.pos.length; v+=3) if(m.pos[v]>mx) mx=m.pos[v];
  return mx;
}

var MARK_A='    /* ===== 여기부터 tools/adddyn.js 가 넣은 것 — 직접 고치지 마세요 =====';
var MARK_B='    /* ===== 여기까지 adddyn ===== */';

function load(id){
  var file=path.join(ROOT,'levels',id+'.js');
  var text=fs.readFileSync(file,'utf8');
  // 지난번에 넣은 덩어리를 걷어낸다(여러 번 돌려도 같은 결과가 되게)
  var a=text.indexOf(MARK_A);
  if(a>=0){
    var b=text.indexOf(MARK_B, a);
    text=text.slice(0,a)+text.slice(b+MARK_B.length+1);
    text=text.replace(/,(\s*\n\s*)\]/g, '$1]');     // 남은 쉼표 정리
  }
  console.error=function(){};
  eval(text);
  var data=PUNG.getLevel(id);
  if(!data) throw new Error(id+' 를 못 읽었습니다');
  return {file:file, text:text, d:data};
}

function j(o){ return JSON.stringify(o).replace(/"([a-z0-9_]+)":/gi,'$1:').replace(/,/g,', '); }

/* boxes 배열의 닫는 대괄호 앞에 끼워 넣는다. 조각(pieces)은 건드리지 않는다. */
function inject(L, boxes, note){
  var t=L.text;
  var s=t.indexOf('boxes: [');
  if(s<0) throw new Error('boxes 배열을 못 찾음');
  var depth=0, i=t.indexOf('[', s), end=-1;
  for(; i<t.length; i++){
    if(t[i]==='[') depth++;
    else if(t[i]===']'){ depth--; if(!depth){ end=i; break; } }
  }
  if(end<0) throw new Error('boxes 배열이 안 닫힘');
  var before=t.slice(0,end), after=t.slice(end);
  // 앞 항목 뒤에 쉼표가 필요한지 본다
  var trimmed=before.replace(/\s+$/,'');
  var sep = /[,\[]$/.test(trimmed) ? '' : ',';
  var lines=[trimmed+sep, MARK_A];
  note.forEach(function(n){ lines.push('       '+n); });
  lines.push('       ===================================================================== */');
  boxes.forEach(function(b,n){ lines.push('    '+j(b)+(n<boxes.length-1?',':'')); });
  lines.push(MARK_B);
  fs.writeFileSync(L.file, lines.join('\n')+'\n  '+after.replace(/^\s*/,''), 'utf8');
}

/* ============================================================
   조립 라인 — 원본은 바깥을 도는 정사각 컨베이어 루프 + 십자 캣워크 + 계단이다.
   ============================================================ */
function plant(){
  var L=load('plant'), d=L.d, u=d.unit;

  /* 1) 벨트 — 이미 깔려 있는 컨베이어를 진짜로 움직이게 한다.
        조각은 한 장도 안 건드린다. 그 위에 '밟으면 밀린다' 판정 상자만 얹고
        상자는 안 그린다(_hide) — 보이는 것은 원래의 컨베이어다.
        루프가 어디에 있는지는 데이터에서 읽는다. */
  var conv=d.pieces.filter(function(p){ return /conveyor-long/.test(p.t); });
  var top=(conv[0].y||0)*u + pieceTop('factory/conveyor-long')*u;      // 벨트 윗면(m)
  var arm=Math.max.apply(null, conv.map(function(p){ return Math.max(Math.abs(p.i),Math.abs(p.j)); }))*u;
  var reach=Math.max.apply(null, conv.map(function(p){ return Math.min(Math.abs(p.i),Math.abs(p.j)); }))*u;
  var half=u*1.0;                                     // 컨베이어 폭 반쪽

  /* 루프를 한 방향으로 돌린다. 네 변에 각각 '다음 변 쪽으로' 미는 방향을 준다 —
     반시계로 돌면 (z=-arm 변은 +x) → (x=+arm 변은 +z) → (z=+arm 변은 -x) → (x=-arm 변은 -z).
     모서리는 비운다: 두 변의 상자가 겹치면 미는 방향이 그 자리에서 다툰다.
     2.2m/s 는 달리기(5.3)의 42% 라 거슬러 걸어 나올 수 있다 — 함정이 아니라 흐름이다. */
  var V=2.2, BOX=[];
  [[0,-1,'x', 1],[ 1,0,'z', 1],[0, 1,'x',-1],[-1,0,'z',-1]].forEach(function(s){
    var nx=s[0], nz=s[1], ax=s[2], dir=s[3];
    BOX.push({ cx:nx*arm, cy:top-0.12, cz:nz*arm,
               hx: nx?half:reach, hy:0.12, hz: nz?half:reach,
               col:'#8a6a3a', _hide:true,
               belt: ax==='x' ? {vx:dir*V, vz:0} : {vx:0, vz:dir*V} });
  });

  /* 캣워크 사이 이동 발판과 점프대는 뺐다.
     스킨은 조각을 상자 크기에 맞춰 늘리는데, catwalk-straight 를 2.5배·바닥 버튼을
     4.7배로 늘리자 난간과 테두리가 같이 늘어나 가운데 십자 옆에서 이상해 보였다.
     조각을 늘려 쓰는 것은 원본 톤을 깨는 일이고, 여기서 할 일은 그 반대였다.
     여러 층과 움직이는 발판은 그것을 위해 지은 새 맵(레인지)이 맡는다.
     이 판에 남는 것은 '이미 있던 컨베이어가 진짜로 움직인다' 하나뿐이고,
     그건 보이는 것을 하나도 안 바꾼다. */

  inject(L, BOX, [
    '조립 라인에 더한 것 — 원본 조각도 보이는 것도 하나도 안 바뀐다.',
    '  · 벨트 4 : 이미 깔려 있던 컨베이어 루프를 진짜로 움직이게 했다(반시계 '+V+'m/s).',
    '             판정 상자는 안 그린다(_hide) — 보이는 것은 원래의 컨베이어다.'
  ]);
  return {id:'plant', n:BOX.length, top:top};
}

/* ============================================================
   프로토타입 링 — 원본은 벽으로 나뉜 사분면 방 + 네 단(0 / 0.4 / 1.2 / 2.0m)이다.
   ============================================================ */
function proto(){
  /* 프로토타입 링에는 아무것도 얹지 않는다.
     점멸 발판·도는 발판·바닥 버튼을 넣어 봤지만, 이 판은 벽으로 나뉜 사분면 방과
     네 낮은 단(0 / 0.4 / 1.2 / 2.0m)으로 이미 완결돼 있었다. 높이차가 2m뿐이라
     점멸 다리가 이을 것이 없고, 그러니 그것들은 기능이 아니라 그냥 얹힌 물건이었다.
     얹었던 것을 걷어내기만 하고 끝낸다(load 가 표식 덩어리를 지운다). */
  var L=load('protoring');
  fs.writeFileSync(L.file, L.text, 'utf8');
  return {id:'protoring', n:0};
}

/* ============================================================
   숲 공터 — 원본은 바위 판 + 나무·천막·깃발이다. 물길이 없으므로 벨트는 안 넣는다.
   ============================================================ */
function grove(){
  var L=load('grove'), d=L.d, u=d.unit;
  var R=Math.max.apply(null, d.pieces.map(function(p){ return Math.hypot(p.i,p.j); }))*u;
  var BOX=[];
  /* 통나무 발판 둘 — survival 킷의 tree-log 다. 숲에 어울리는 유일한 '움직이는 것'이라
     이것만 넣는다. 상자를 통나무 비율(0.25 x 1.00 유닛)에 맞춰 길쭉하게 잡는다 —
     정사각 상자에 맞추면 조각이 가로로 5배 늘어나 널빤지가 된다. */
  [1,-1].forEach(function(sgn){
    var amp=R*0.28, t=Math.max(10, 6.2832*amp/2.2);
    BOX.push({ cx:+(sgn*R*0.45).toFixed(2), cy:0.28, cz:0,
               hx:0.9, hy:0.28, hz:2.9, col:'#6b4f32', skin:'survival/tree-log',
               move:{ax:'z', amp:+amp.toFixed(2), t:+t.toFixed(1), ph: sgn>0?0:0.5} });
  });
  inject(L, BOX, [
    '숲 공터에 더한 것 — 원본 조각은 그대로다.',
    '  · 통나무 발판 2 : 떠내려갔다 돌아온다. 숲에 어울리는 움직임이 이것뿐이라',
    '                   벨트도 점멸도 안 넣었다 — 물길도 기계도 없는 판이다.'
  ]);
  return {id:'grove', n:BOX.length};
}

[plant, proto, grove].forEach(function(fn){
  var r=fn();
  console.log('levels/'+r.id+'.js — 상자 '+r.n+'개를 얹었습니다(조각 변경 0)');
});
