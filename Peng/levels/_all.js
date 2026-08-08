/* 자동 생성 파일 — 직접 고치지 마세요.
   levels/ 안의 레벨 파일들을 server.js 가 이어붙인 것입니다.
   맵을 고치려면 levels/<이름>.js 를 고치거나 editor.html 을 쓰세요. */

/* ---------- levels/TESTR.js ---------- */
/* PUNG! 레벨 — kiteditor.html 에서 만듦. 손으로 고쳐도 된다.
   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다. */
PUNG.defineLevel('TESTR', {
  name: 'TT',
  unit: 3,
  boxes: [
    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#2b3a2c', deco:true}
  ],
  pieces: [
    {t:'forest/stones', i:-0.144, j:-1.223, y:-2.846, sx:9.323, sy:9.323, sz:9.323}
  ],
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:0, y:4.159, z:-1.039} ],
  killY: -30,
  start: {x:0, y:4.159, z:-1.039},
  spawns: [ {x:0, y:4.159, z:-1.039} ],
  pads: [  ]
});


/* ---------- levels/Test.js ---------- */
/* PUNG! 레벨 — kiteditor.html 에서 만듦. 손으로 고쳐도 된다.
   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다. */
PUNG.defineLevel('TEST', {
  name: 'TEST',
  unit: 3,
  boxes: [
    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#2b3a2c', deco:true}
  ],
  pieces: [
    {t:'proto/weapon-shield', i:0.118, j:-1.424, y:-0.943, sx:12.414, sy:12.414, sz:12.414}
  ],
  arena: true,
  // 시험용 판이다 — 맵 고르기 목록에서 뺀다(index.html 의 mapListFor).
  // 지운 게 아니라 숨긴 것이므로 setLevel('TEST') 로는 그대로 들어갈 수 있다.
  hidden: true,
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:2.921, y:1.789, z:-4.181} ],
  killY: -30,
  start: {x:2.921, y:1.789, z:-4.181},
  spawns: [ {x:2.921, y:1.789, z:-4.181} ],
  pads: [  ]
});


/* ---------- levels/Testmap1.js ---------- */
/* PUNG! 레벨 — editor.html 에서 생성. 손으로 고쳐도 된다.
   <script src="levels/Testmap1.js"></script> 로 index.html 에 추가하면 목록에 뜬다. */
PUNG.defineLevel('Testmap1', {
  name: '테스트맵1',
  boxes: [
    {cx:0, cy:-0.5, cz:3.5, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:0.5, cy:-0.5, cz:16.5, hx:3.4, hy:0.5, hz:3.4, col:'#3aa860'},
    {cx:-6, cy:0.5, cz:8.5, hx:0.9, hy:0.5, hz:0.75, col:'#6b7280', deco:true, g:'rock#1'},
    {cx:-5.48, cy:0.78, cz:8.2, hx:0.5, hy:0.35, hz:0.45, col:'#7c8593', deco:true, g:'rock#1'},
    {cx:-6.44, cy:0.68, cz:8.84, hx:0.4, hy:0.28, hz:0.35, col:'#5d6470', deco:true, g:'rock#1'},
    {cx:-2, cy:0.34, cz:2.5, hx:0.06, hy:0.34, hz:0.3, col:'#4e9455', deco:true, g:'grass#2'},
    {cx:-1.76, cy:0.27, cz:2.62, hx:0.05, hy:0.27, hz:0.24, col:'#5aa862', deco:true, g:'grass#2'},
    {cx:-2.2, cy:0.3, cz:2.36, hx:0.05, hy:0.3, hz:0.22, col:'#458a4c', deco:true, g:'grass#2'},
    {cx:2, cy:0.34, cz:2, hx:0.06, hy:0.34, hz:0.3, col:'#4e9455', deco:true, g:'grass#3'},
    {cx:2.24, cy:0.27, cz:2.12, hx:0.05, hy:0.27, hz:0.24, col:'#5aa862', deco:true, g:'grass#3'},
    {cx:1.8, cy:0.3, cz:1.86, hx:0.05, hy:0.3, hz:0.22, col:'#458a4c', deco:true, g:'grass#3'},
    {cx:21.5, cy:0.8, cz:7, hx:0.8, hy:0.8, hz:0.8, col:'#8a6a45'}
  ],
  goal: {cx:0.5, cy:0.5, cz:16.5, r:3.2},
  checkpoints: [
    {x:0, y:0, z:2}
  ],
  killY: -14, start: {x:0, y:0, z:5.5}
});


/* ---------- levels/arena.js ---------- */
PUNG.defineLevel('arena', {
  name: '우주 정거장 (경쟁)',
  arena: true,
  space: true,          // 배경을 검은 우주 + 흰 별로
  collapse: {
    /* 판을 Kenney Space Station Kit 조각으로 조립한다(PUNG.genStation).
       예전의 '원판을 깔고 파내는' 방식과 달리 코어 → 복도 → 포드 순으로 붙여
       허브+스포크 실루엣이 나온다. 라운드마다 시드가 바뀐다.
       size 는 킷 1칸의 미터 크기(index.html 의 STATION.unit 과 맞춰야 한다). */
    gen: 'station',
    /* 킷 1칸의 미터 크기. 문 구멍이 0.65유닛이라 2.6 이면 1.69m 로 플레이어(1.8m)가
       못 지나간다 — 2.95 로 잡아야 1.92m 가 되어 문이 실제로 통로가 된다. */
    size: 2.95,
    y: -0.5, hy: 0.5,
    col: '#5a7bb0', warnCol: '#e0713a',
    /* 붕괴는 판을 좁혀 결판을 내라고 있는 장치이지 그 자체가 위협이어서는 안 된다.
       예전 값(16 / 4.2)은 둘 다 그 선을 넘었다: 서로 맞붙기도 전에 첫 겹이 떨어지고,
       그 뒤로는 자리를 잡을 때마다 발밑이 사라져 싸우는 대신 도망만 다니게 됐다.
       판이 10겹이라 간격이 조금만 짧아도 체감이 크게 달라진다.
       지금은 24 + 8*6.5 = 76초에 코어만 남고, 5초(ARENA_HOLD) 뒤 새 판이 선다. */
    first: 24,                       // 첫 분리까지(초)
    every: 6.5,                      // 모듈 한 겹이 떨어져 나가는 간격(초)
    /* 예고는 '피할 시간'이라 간격과 같이 늘려야 한다 — 간격만 늘리고 이걸 두면
       무너지는 순간의 급작스러움은 그대로다. */
    warn: 2.2,                       // 분리 전 깜빡이는 예고(초)
    keepRings: 1                     // 코어(order 0)는 안 떨어진다
  },
  boxes: [
    // 저 아래 장식 바닥 — 떨어졌다는 게 확실히 보이게. 발판은 전부 생성기가 만든다
    /* 우주 맵이라 '저 아래 바닥'이 없다 — 검은 우주에 네모 판이 떠 있으면 그게 더
       이상하다. 그래도 boxes 가 비면 레벨 검증에 걸리므로, 그리기 거리(FAR=400m)
       바깥으로 내려 눈에 안 띄게 둔다. */
    {cx:0, cy:-900, cz:0, hx:4, hy:1, hz:4, col:'#0a0d16', deco:true}
  ],
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:0, y:0, z:0} ],
  killY: -16,
  /* start·spawns·pads 는 생성기가 매 라운드 덮어쓴다. 여기 값은 형식상의 기본값. */
  start: {x:0, y:0, z:-10.4},
  spawns: [ {x:0,y:0,z:-10.4}, {x:0,y:0,z:10.4}, {x:-10.4,y:0,z:0}, {x:10.4,y:0,z:0} ],
  pads: [ {x:0, y:0, z:0} ],
  /* 이 줄은 붕괴 맵에서만 뜬다(index.html 의 showHint). 붕괴는 화면만 봐서는 모르는
     유일한 규칙이라 남겨 뒀고, 남긴 이상 튜토리얼과 같은 말투로 끝맺는다 — 조각으로
     끊으면 안내가 아니라 메모로 읽힌다. 무엇이 일어나는지 먼저, 무엇을 할지 나중에. */
  hints: [ '바깥 모듈부터 차례로 떨어져 나갑니다. 안쪽으로 붙고, 상대는 <b>펑건으로 밀어</b> 정거장 밖으로 보내세요!' ]
});


/* ---------- levels/camp.js ---------- */
/* PUNG! 레벨 — 야영지.
   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다.

   판을 한 번 다시 깔았다. 예전 판은 반지름 16.5m 에 소품이 쉰 개 가까이 있었고,
   그중 열여섯 개가 한 겹의 오름단이라 사방이 벽이었다 — 바닥 칸의 63% 가 몸이
   아예 못 들어가는 자리였다(실측). 밀려도 두 걸음 만에 무언가에 걸리니
   넉백이 일어나는 걸 볼 수가 없었다.
   지금은 반지름 19.8m, 소품은 사분면당 일곱 개, 오름단은 넷이다. */
PUNG.defineLevel('camp', {
  name: '야영지 (경쟁)',
  unit: 3,
  boxes: [
    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#2b3a2c', deco:true}
  ],
  pieces: [
    {t:'survival/floor', i:-5.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-5.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-5.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-5.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-4.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-4.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-4.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-4.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-4.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-4.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-4.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-4.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-3.5, j:-4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-3.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-3.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-3.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-3.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-3.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-3.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-3.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-3.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-3.5, j:4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-2.5, j:-4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-2.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-2.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-2.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-2.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-2.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-2.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-2.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-2.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-2.5, j:4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-1.5, j:-5.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-1.5, j:-4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-1.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-1.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-1.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-1.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-1.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-1.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-1.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-1.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-1.5, j:4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-1.5, j:5.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-0.5, j:-5.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-0.5, j:-4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-0.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-0.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-0.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-0.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-0.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-0.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-0.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-0.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:-0.5, j:4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:-0.5, j:5.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:0.5, j:-5.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:0.5, j:-4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:0.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:0.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:0.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:0.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:0.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:0.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:0.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:0.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:0.5, j:4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:0.5, j:5.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:1.5, j:-5.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:1.5, j:-4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:1.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:1.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:1.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:1.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:1.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:1.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:1.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:1.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:1.5, j:4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:1.5, j:5.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:2.5, j:-4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:2.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:2.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:2.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:2.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:2.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:2.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:2.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:2.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:2.5, j:4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:3.5, j:-4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:3.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:3.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:3.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:3.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:3.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:3.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:3.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:3.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:3.5, j:4.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:4.5, j:-3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:4.5, j:-2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:4.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:4.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:4.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:4.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:4.5, j:2.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:4.5, j:3.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:5.5, j:-1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:5.5, j:-0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:5.5, j:0.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor-old', i:5.5, j:1.5, y:-0.102, sx:2, sy:2, sz:2},
    {t:'survival/floor', i:2.4, j:2.4, y:0.329, sx:1.4, sy:1.4, sz:1.4},
    {t:'survival/floor', i:2.4, j:-2.4, y:0.329, rot:1, sx:1.4, sy:1.4, sz:1.4},
    {t:'survival/floor', i:-2.4, j:-2.4, y:0.329, rot:2, sx:1.4, sy:1.4, sz:1.4},
    {t:'survival/floor', i:-2.4, j:2.4, y:0.329, rot:3, sx:1.4, sy:1.4, sz:1.4},
    {t:'survival/tent', i:3.55, j:1.35, y:0.404, rot:2, sx:1.35, sy:1.35, sz:1.35},
    {t:'survival/tent', i:1.35, j:-3.55, y:0.404, rot:3, sx:1.35, sy:1.35, sz:1.35},
    {t:'survival/tent', i:-3.55, j:-1.35, y:0.404, sx:1.35, sy:1.35, sz:1.35},
    {t:'survival/tent', i:-1.35, j:3.55, y:0.404, rot:1, sx:1.35, sy:1.35, sz:1.35},
    {t:'survival/tree-tall', i:1.3, j:4.3, y:0.004},
    {t:'survival/tree-tall', i:4.3, j:-1.3, y:0.004, rot:1},
    {t:'survival/tree-tall', i:-1.3, j:-4.3, y:0.004, rot:2},
    {t:'survival/tree-tall', i:-4.3, j:1.3, y:0.004, rot:3},
    {t:'survival/rock-b', i:4.35, j:0.6, y:0.004, sx:1.5, sy:1.5, sz:1.5},
    {t:'survival/rock-b', i:0.6, j:-4.35, y:0.004, rot:1, sx:1.5, sy:1.5, sz:1.5},
    {t:'survival/rock-b', i:-4.35, j:-0.6, y:0.004, rot:2, sx:1.5, sy:1.5, sz:1.5},
    {t:'survival/rock-b', i:-0.6, j:4.35, y:0.004, rot:3, sx:1.5, sy:1.5, sz:1.5},
    {t:'survival/barrel', i:0.7, j:2.55, y:0.004, sx:1.4, sy:1.4, sz:1.4},
    {t:'survival/barrel', i:2.55, j:-0.7, y:0.004, rot:1, sx:1.4, sy:1.4, sz:1.4},
    {t:'survival/barrel', i:-0.7, j:-2.55, y:0.004, rot:2, sx:1.4, sy:1.4, sz:1.4},
    {t:'survival/barrel', i:-2.55, j:0.7, y:0.004, rot:3, sx:1.4, sy:1.4, sz:1.4},
    {t:'survival/tree-trunk', i:3.05, j:3.55, y:0.004, sx:1.259, sy:1.259, sz:1.259},
    {t:'survival/tree-trunk', i:3.55, j:-3.05, y:0.004, rot:1, sx:1.259, sy:1.259, sz:1.259},
    {t:'survival/tree-trunk', i:-3.05, j:-3.55, y:0.004, rot:2, sx:1.259, sy:1.259, sz:1.259},
    {t:'survival/tree-trunk', i:-3.55, j:3.05, y:0.004, rot:3, sx:1.259, sy:1.259, sz:1.259},
    {t:'survival/tree-log', i:4.85, j:2.25, y:0.169, rot:1, sx:1.5, sy:1.5, sz:1.5},
    {t:'survival/tree-log', i:2.25, j:-4.85, y:0.169, rot:2, sx:1.5, sy:1.5, sz:1.5},
    {t:'survival/tree-log', i:-4.85, j:-2.25, y:0.169, rot:3, sx:1.5, sy:1.5, sz:1.5},
    {t:'survival/tree-log', i:-2.25, j:4.85, y:0.169, sx:1.5, sy:1.5, sz:1.5},
    {t:'survival/campfire-pit', i:0, j:0, y:0.004, sx:1.8, sy:1.8, sz:1.8, deco:true},
    {t:'survival/grass-large', i:1.45, j:0, y:0.004, sx:1.3, sy:1.3, sz:1.3, deco:true},
    {t:'survival/grass-large', i:0, j:-1.45, y:0.004, rot:1, sx:1.3, sy:1.3, sz:1.3, deco:true},
    {t:'survival/grass-large', i:-1.45, j:0, y:0.004, rot:2, sx:1.3, sy:1.3, sz:1.3, deco:true},
    {t:'survival/grass-large', i:0, j:1.45, y:0.004, rot:3, sx:1.3, sy:1.3, sz:1.3, deco:true},
    {t:'survival/grass-large', i:3.3, j:0, y:0.004, sx:1.1, sy:1.1, sz:1.1, deco:true},
    {t:'survival/grass-large', i:0, j:-3.3, y:0.004, rot:1, sx:1.1, sy:1.1, sz:1.1, deco:true},
    {t:'survival/grass-large', i:-3.3, j:0, y:0.004, rot:2, sx:1.1, sy:1.1, sz:1.1, deco:true},
    {t:'survival/grass-large', i:0, j:3.3, y:0.004, rot:3, sx:1.1, sy:1.1, sz:1.1, deco:true},
    {t:'survival/grass-large', i:2.2, j:4.8, y:0.004, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'survival/grass-large', i:4.8, j:-2.2, y:0.004, rot:1, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'survival/grass-large', i:-2.2, j:-4.8, y:0.004, rot:2, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'survival/grass-large', i:-4.8, j:2.2, y:0.004, rot:3, sx:1.2, sy:1.2, sz:1.2, deco:true}
  ],
  arena: true,
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:15.5, y:0.2, z:0} ],
  killY: -30,
  start: {x:15.5, y:0.2, z:0},
  spawns: [ {x:15.5, y:0.2, z:0}, {x:0, y:0.2, z:15.5}, {x:-15.5, y:0.2, z:0}, {x:0, y:0.2, z:-15.5} ],
  /* 가운데 하나 + 오름단 위 넷. 단 위 패드는 y 를 단 높이(0.99m)에 맞춘다. */
  pads: [ {x:0, y:0, z:0}, {x:7.2, y:0.99, z:7.2}, {x:-7.2, y:0.99, z:7.2}, {x:-7.2, y:0.99, z:-7.2}, {x:7.2, y:0.99, z:-7.2} ],
  hints: [ '단은 <b>점프로</b> 오릅니다. 야영지 밖은 낭떠러지!' ]
});


/* ---------- levels/canyon.js ---------- */
/* PUNG! 레벨 — 협곡 (기본 코스)
   기존 index.html 에 하드코딩돼 있던 코스를 그대로 옮긴 것. 좌표·색 모두 동일하다.

   코스 구성 — 발판 반경 3m 이므로 두 발판 사이 실제 협곡 = (거리 - 6)m.
   일반 점프로 넘는 한계가 약 4.85m 라, 4m 는 점프 / 6m 이상 또는 상승은 로켓점프.
   난이도: 점프 → 로켓점프 입문 → 상승 → 연속 구간 → 마지막 큰 도약

   ※ deco:true 는 에디터의 협곡 분석에서 제외하라는 표시일 뿐이다.
     게임 물리는 예전과 똑같이 모든 박스와 충돌한다(장식 기둥도 밟힌다). */
PUNG.defineLevel('canyon', {
  name: '협곡',
  boxes: [
    {cx:0, cy:-25, cz:40, hx:60, hy:1, hz:140, col:'#20304a', deco:true},  // 시각용 먼 바닥
    {cx:0, cy:-0.5, cz:0,  hx:3,   hy:0.5, hz:3,   col:'#5a7bb0'},  // A 시작
    {cx:0, cy:-0.5, cz:10, hx:3,   hy:0.5, hz:3,   col:'#5a7bb0'},  // B  협곡 4m — 그냥 점프
    {cx:0, cy:-0.5, cz:24, hx:3,   hy:0.5, hz:3,   col:'#c07b5a'},  // C  협곡 8m — 로켓점프 입문
    {cx:0, cy:2.5,  cz:36, hx:3,   hy:0.5, hz:3,   col:'#c07b5a'},  // D  협곡 6m + 3m 상승
    {cx:0, cy:2.5,  cz:46, hx:3,   hy:0.5, hz:3,   col:'#5a7bb0'},  // E  협곡 4m — 숨 고르기(점프)
    {cx:0, cy:5.5,  cz:57, hx:3,   hy:0.5, hz:3,   col:'#c07b5a'},  // F  협곡 5m + 3m 상승 — 로켓점프
    {cx:0, cy:5.5,  cz:67, hx:3,   hy:0.5, hz:3,   col:'#5a7bb0'},  // G  협곡 4m — 점프
    {cx:0, cy:8.5,  cz:79, hx:3.4, hy:0.5, hz:3.4, col:'#3aa860'},  // 결승 — 협곡 5.6m + 3m 상승
    // 장식(경로 밖 기둥) — 높이감을 주되 이동을 막지 않도록 양옆으로만
    {cx:-8, cy:-3, cz:18, hx:1, hy:4, hz:1, col:'#46557a', deco:true},
    {cx:8,  cy:-1, cz:30, hx:1, hy:5, hz:1, col:'#46557a', deco:true},
    {cx:-9, cy:1,  cz:52, hx:1, hy:5, hz:1, col:'#46557a', deco:true},
    {cx:9,  cy:3,  cz:63, hx:1, hy:5, hz:1, col:'#46557a', deco:true}
  ],
  goal: {cx:0, cy:9.5, cz:79, r:3.2},          // 결승 존(발판 위)
  checkpoints: [
    {x:0, y:0, z:0},  {x:0, y:0, z:10}, {x:0, y:0, z:24}, {x:0, y:3, z:36},
    {x:0, y:3, z:46}, {x:0, y:6, z:57}, {x:0, y:6, z:67}
  ],
  killY: -14, start: {x:0, y:0, z:-2},
  // 체크포인트 번호별 화면 힌트(<b> 강조 가능). 마지막 항목은 이후 구간까지 유지된다.
  hints: [
    '달려서 <b>Space</b>',
    '넓다. <b>점프 뒤 발밑 좌클릭</b>',
    '위로. <b>점프 + 발밑 펑!</b>',
    '짧다. 그냥 점프',
    '또 위로. 로켓점프',
    '마지막. <b>크게</b> 로켓점프해서 초록 결승대로'
  ]
});


/* ---------- levels/duo.js ---------- */
/* PUNG! 레벨 — 2인 시험장 (템플릿)
   완성된 코스가 아니라, "협동 강제 구간"이 실제로 어떤 숫자인지 보여주는 최소 예시다.
   맵 동기화 테스트용으로도 쓴다(맵이 하나뿐이면 동기화가 깨져도 티가 안 난다).

   가운데 협곡 13m 는 의도적으로 아래 구간에 놓았다:
       일반 점프  4.85m  ✗
       로켓점프  10.83m  ✗   ← 혼자서는 어떻게 해도 못 넘는다
       팀원 보조 15.72m  ✓   ← 팀원이 밀어줘야만 넘어간다
   editor.html 에서 이 협곡이 'coop' 으로 표시되는지 확인하는 기준점으로 쓰면 된다. */
PUNG.defineLevel('duo', {
  name: '2인 시험장',
  boxes: [
    {cx:0, cy:-25, cz:15, hx:60, hy:1, hz:120, col:'#20304a', deco:true},  // 시각용 먼 바닥
    {cx:0, cy:-0.5, cz:0,  hx:3,   hy:0.5, hz:3,   col:'#5a7bb0'},  // A 시작
    {cx:0, cy:-0.5, cz:19, hx:3,   hy:0.5, hz:3,   col:'#c07b5a'},  // B  협곡 13m — 협동 전용
    {cx:0, cy:-0.5, cz:29, hx:3.4, hy:0.5, hz:3.4, col:'#3aa860'},  // 결승 — 협곡 3.6m(점프)
    {cx:-8, cy:-4, cz:10, hx:1, hy:4, hz:1, col:'#46557a', deco:true},
    {cx:8,  cy:-4, cz:24, hx:1, hy:4, hz:1, col:'#46557a', deco:true}
  ],
  goal: {cx:0, cy:0.5, cz:29, r:3.2},
  checkpoints: [ {x:0, y:0, z:0}, {x:0, y:0, z:19} ],
  killY: -14, start: {x:0, y:0, z:-2},
  hints: [
    '<b>혼자서는 못 넘는다.</b> 팀원이 내 발밑을 쏴 줘야 한다',
    '마지막. 짧으니 <b>Space</b>'
  ]
});


/* ---------- levels/grove.js ---------- */
/* PUNG! 레벨 — 숲 공터.
   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다.

   판을 한 번 다시 깔았다. 예전 판은 반지름 17.3m 에 소품이 마흔 개 넘게 서 있었고
   정중앙에는 3.9m 짜리 오두막이 있었다 — 가운데 4m 안쪽 칸의 절반이 막혀 있어서
   서로 밀 자리가 판 한복판에서 끊겼다. 넉백 한 번이 3m 남짓인데 두 걸음마다
   나무가 있으니 '날아간다'가 아니라 '부딪힌다'가 됐다.
   지금은 반지름 20.3m, 소품은 고리마다 넷씩만 두고 가운데는 비워 뒀다. */
PUNG.defineLevel('grove', {
  name: '숲 공터 (경쟁)',
  unit: 3,
  boxes: [
    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#20301f', deco:true}
  ],
  pieces: [
    {t:'survival/rock-flat-grass', i:0, j:0, y:-0.28, sx:1.25, sy:1.25, sz:1.25},
    {t:'survival/rock-flat-grass', i:1.15, j:0, y:-0.246, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:0, j:-1.15, y:-0.246, rot:1, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:-1.15, j:0, y:-0.246, rot:2, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:0, j:1.15, y:-0.246, rot:3, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:0.813, j:0.813, y:-0.252, rot:1, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:0.813, j:-0.813, y:-0.252, rot:2, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:-0.813, j:-0.813, y:-0.252, rot:3, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:-0.813, j:0.813, y:-0.252, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:2.3, j:0, y:-0.252, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:0, j:-2.3, y:-0.252, rot:1, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:-2.3, j:0, y:-0.252, rot:2, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:0, j:2.3, y:-0.252, rot:3, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat', i:1.992, j:1.15, y:-0.258, rot:1, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat', i:1.15, j:-1.992, y:-0.258, rot:2, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat', i:-1.992, j:-1.15, y:-0.258, rot:3, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat', i:-1.15, j:1.992, y:-0.258, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:1.15, j:1.992, y:-0.264, rot:2, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:1.992, j:-1.15, y:-0.264, rot:3, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:-1.15, j:-1.992, y:-0.264, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:-1.992, j:1.15, y:-0.264, rot:1, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:3.45, j:0, y:-0.258, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:0, j:-3.45, y:-0.258, rot:1, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:-3.45, j:0, y:-0.258, rot:2, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:0, j:3.45, y:-0.258, rot:3, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:3.187, j:1.32, y:-0.264, rot:1, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:1.32, j:-3.187, y:-0.264, rot:2, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:-3.187, j:-1.32, y:-0.264, rot:3, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:-1.32, j:3.187, y:-0.264, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat', i:2.44, j:2.44, y:-0.27, rot:2, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat', i:2.44, j:-2.44, y:-0.27, rot:3, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat', i:-2.44, j:-2.44, y:-0.27, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat', i:-2.44, j:2.44, y:-0.27, rot:1, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:1.32, j:3.187, y:-0.276, rot:3, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:3.187, j:-1.32, y:-0.276, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:-1.32, j:-3.187, y:-0.276, rot:1, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:-3.187, j:1.32, y:-0.276, rot:2, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:4.6, j:0, y:-0.264, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:0, j:-4.6, y:-0.264, rot:1, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:-4.6, j:0, y:-0.264, rot:2, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:0, j:4.6, y:-0.264, rot:3, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:4.443, j:1.191, y:-0.27, rot:1, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:1.191, j:-4.443, y:-0.27, rot:2, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:-4.443, j:-1.191, y:-0.27, rot:3, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:-1.191, j:4.443, y:-0.27, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat', i:3.984, j:2.3, y:-0.276, rot:2, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat', i:2.3, j:-3.984, y:-0.276, rot:3, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat', i:-3.984, j:-2.3, y:-0.276, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat', i:-2.3, j:3.984, y:-0.276, rot:1, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:3.253, j:3.253, y:-0.24, rot:3, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:3.253, j:-3.253, y:-0.24, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:-3.253, j:-3.253, y:-0.24, rot:1, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:-3.253, j:3.253, y:-0.24, rot:2, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:2.3, j:3.984, y:-0.246, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:3.984, j:-2.3, y:-0.246, rot:1, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:-2.3, j:-3.984, y:-0.246, rot:2, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:-3.984, j:2.3, y:-0.246, rot:3, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:1.191, j:4.443, y:-0.252, rot:1, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:4.443, j:-1.191, y:-0.252, rot:2, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:-1.191, j:-4.443, y:-0.252, rot:3, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:-4.443, j:1.191, y:-0.252, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat', i:5.75, j:0, y:-0.27, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat', i:0, j:-5.75, y:-0.27, rot:1, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat', i:-5.75, j:0, y:-0.27, rot:2, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat', i:0, j:5.75, y:-0.27, rot:3, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:5.606, j:1.279, y:-0.276, rot:1, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:1.279, j:-5.606, y:-0.276, rot:2, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:-5.606, j:-1.279, y:-0.276, rot:3, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:-1.279, j:5.606, y:-0.276, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:5.181, j:2.495, y:-0.24, rot:2, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:2.495, j:-5.181, y:-0.24, rot:3, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:-5.181, j:-2.495, y:-0.24, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:-2.495, j:5.181, y:-0.24, rot:1, sx:1.14, sy:1.14, sz:1.14},
    {t:'survival/rock-flat-grass', i:4.496, j:3.585, y:-0.246, rot:3, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:3.585, j:-4.496, y:-0.246, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:-4.496, j:-3.585, y:-0.246, rot:1, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat-grass', i:-3.585, j:4.496, y:-0.246, rot:2, sx:1.185, sy:1.185, sz:1.185},
    {t:'survival/rock-flat', i:3.585, j:4.496, y:-0.252, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat', i:4.496, j:-3.585, y:-0.252, rot:1, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat', i:-3.585, j:-4.496, y:-0.252, rot:2, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat', i:-4.496, j:3.585, y:-0.252, rot:3, sx:1.23, sy:1.23, sz:1.23},
    {t:'survival/rock-flat-grass', i:2.495, j:5.181, y:-0.258, rot:1, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:5.181, j:-2.495, y:-0.258, rot:2, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:-2.495, j:-5.181, y:-0.258, rot:3, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:-5.181, j:2.495, y:-0.258, sx:1.05, sy:1.05, sz:1.05},
    {t:'survival/rock-flat-grass', i:1.279, j:5.606, y:-0.264, rot:2, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:5.606, j:-1.279, y:-0.264, rot:3, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:-1.279, j:-5.606, y:-0.264, sx:1.095, sy:1.095, sz:1.095},
    {t:'survival/rock-flat-grass', i:-5.606, j:1.279, y:-0.264, rot:1, sx:1.095, sy:1.095, sz:1.095},
    {t:'forest/rocks-low', i:2.05, j:0.85, y:0.004, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/rocks-low', i:0.85, j:-2.05, y:0.004, rot:1, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/rocks-low', i:-2.05, j:-0.85, y:0.004, rot:2, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/rocks-low', i:-0.85, j:2.05, y:0.004, rot:3, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/rocks-high', i:1.2, j:2.85, y:0.004, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/rocks-high', i:2.85, j:-1.2, y:0.004, rot:1, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/rocks-high', i:-1.2, j:-2.85, y:0.004, rot:2, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/rocks-high', i:-2.85, j:1.2, y:0.004, rot:3, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/stones', i:3.55, j:1.05, y:0.004, sx:1.25, sy:1.25, sz:1.25},
    {t:'forest/stones', i:1.05, j:-3.55, y:0.004, rot:1, sx:1.25, sy:1.25, sz:1.25},
    {t:'forest/stones', i:-3.55, j:-1.05, y:0.004, rot:2, sx:1.25, sy:1.25, sz:1.25},
    {t:'forest/stones', i:-1.05, j:3.55, y:0.004, rot:3, sx:1.25, sy:1.25, sz:1.25},
    {t:'forest/tree', i:1.55, j:4.2, y:0.004, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/tree', i:4.2, j:-1.55, y:0.004, rot:1, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/tree', i:-1.55, j:-4.2, y:0.004, rot:2, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/tree', i:-4.2, j:1.55, y:0.004, rot:3, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/tree-high', i:4.55, j:1.8, y:0.004},
    {t:'forest/tree-high', i:1.8, j:-4.55, y:0.004, rot:1},
    {t:'forest/tree-high', i:-4.55, j:-1.8, y:0.004, rot:2},
    {t:'forest/tree-high', i:-1.8, j:4.55, y:0.004, rot:3},
    {t:'forest/tent', i:2.05, j:5.2, y:0.004, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/tent', i:5.2, j:-2.05, y:0.004, rot:1, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/tent', i:-2.05, j:-5.2, y:0.004, rot:2, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/tent', i:-5.2, j:2.05, y:0.004, rot:3, sx:1.1, sy:1.1, sz:1.1},
    {t:'forest/flag', i:5.55, j:2, y:0.004, sx:1.2, sy:1.2, sz:1.2},
    {t:'forest/flag', i:2, j:-5.55, y:0.004, rot:1, sx:1.2, sy:1.2, sz:1.2},
    {t:'forest/flag', i:-5.55, j:-2, y:0.004, rot:2, sx:1.2, sy:1.2, sz:1.2},
    {t:'forest/flag', i:-2, j:5.55, y:0.004, rot:3, sx:1.2, sy:1.2, sz:1.2},
    {t:'forest/plant', i:2.35, j:0, y:0.004, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'forest/plant', i:0, j:-2.35, y:0.004, rot:1, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'forest/plant', i:-2.35, j:0, y:0.004, rot:2, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'forest/plant', i:0, j:2.35, y:0.004, rot:3, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'forest/plant', i:3.9, j:0, y:0.004, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'forest/plant', i:0, j:-3.9, y:0.004, rot:1, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'forest/plant', i:-3.9, j:0, y:0.004, rot:2, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'forest/plant', i:0, j:3.9, y:0.004, rot:3, sx:1.2, sy:1.2, sz:1.2, deco:true},
    {t:'survival/patch-grass', i:1.45, j:1.45, y:-0.05, sx:1.15, sy:1.15, sz:1.15, deco:true},
    {t:'survival/patch-grass', i:1.45, j:-1.45, y:-0.05, rot:1, sx:1.15, sy:1.15, sz:1.15, deco:true},
    {t:'survival/patch-grass', i:-1.45, j:-1.45, y:-0.05, rot:2, sx:1.15, sy:1.15, sz:1.15, deco:true},
    {t:'survival/patch-grass', i:-1.45, j:1.45, y:-0.05, rot:3, sx:1.15, sy:1.15, sz:1.15, deco:true},
    {t:'survival/patch-grass', i:3.3, j:3.3, y:-0.05, sx:1.15, sy:1.15, sz:1.15, deco:true},
    {t:'survival/patch-grass', i:3.3, j:-3.3, y:-0.05, rot:1, sx:1.15, sy:1.15, sz:1.15, deco:true},
    {t:'survival/patch-grass', i:-3.3, j:-3.3, y:-0.05, rot:2, sx:1.15, sy:1.15, sz:1.15, deco:true},
    {t:'survival/patch-grass', i:-3.3, j:3.3, y:-0.05, rot:3, sx:1.15, sy:1.15, sz:1.15, deco:true},
    {t:'survival/patch-grass', i:5.1, j:1.9, y:-0.05, sx:1.1, sy:1.1, sz:1.1, deco:true},
    {t:'survival/patch-grass', i:1.9, j:-5.1, y:-0.05, rot:1, sx:1.1, sy:1.1, sz:1.1, deco:true},
    {t:'survival/patch-grass', i:-5.1, j:-1.9, y:-0.05, rot:2, sx:1.1, sy:1.1, sz:1.1, deco:true},
    {t:'survival/patch-grass', i:-1.9, j:5.1, y:-0.05, rot:3, sx:1.1, sy:1.1, sz:1.1, deco:true}
  ],
  arena: true,
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:17.1, y:0.2, z:0} ],
  killY: -30,
  start: {x:17.1, y:0.2, z:0},
  spawns: [ {x:17.1, y:0.2, z:0}, {x:0, y:0.2, z:17.1}, {x:-17.1, y:0.2, z:0}, {x:0, y:0.2, z:-17.1} ],
  /* 패드는 가운데 하나 + 중간 고리 넷. 판이 넓어진 만큼 바깥으로 벌려 놓아야
     '집으러 간다'가 판을 가로지르는 선택이 된다. */
  pads: [ {x:0, y:0, z:0}, {x:12.6, y:0, z:0}, {x:0, y:0, z:12.6}, {x:-12.6, y:0, z:0}, {x:0, y:0, z:-12.6} ],
  hints: [ '나무 뒤에 숨고 <b>바위 위</b>를 잡으세요. 공터 밖은 낭떠러지!' ]
});


/* ---------- levels/hangar.js ---------- */
/* PUNG! 레벨 — kiteditor.html 에서 만듦. 손으로 고쳐도 된다.
   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다. */
PUNG.defineLevel('hangar', {
  name: '정거장 격납고 (경쟁)',
  unit: 2.95,
  boxes: [
    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#161f33', deco:true}
  ],
  pieces: [
    {t:'station/floor-panel', i:-4.5, j:-2.5, y:-0.3},
    {t:'station/floor', i:-4.5, j:-1.5, y:-0.3},
    {t:'station/floor', i:-4.5, j:-0.5, y:-0.3},
    {t:'station/floor-panel', i:-4.5, j:0.5, y:-0.3},
    {t:'station/floor', i:-4.5, j:1.5, y:-0.3},
    {t:'station/floor', i:-4.5, j:2.5, y:-0.3},
    {t:'station/floor-panel', i:-3.5, j:-3.5, y:-0.3},
    {t:'station/floor', i:-3.5, j:-2.5, y:-0.3},
    {t:'station/floor', i:-3.5, j:-1.5, y:-0.3},
    {t:'station/floor-panel', i:-3.5, j:-0.5, y:-0.3},
    {t:'station/floor', i:-3.5, j:0.5, y:-0.3},
    {t:'station/floor', i:-3.5, j:1.5, y:-0.3},
    {t:'station/floor-panel', i:-3.5, j:2.5, y:-0.3},
    {t:'station/floor', i:-3.5, j:3.5, y:-0.3},
    {t:'station/floor', i:-2.5, j:-4.5, y:-0.3},
    {t:'station/floor-panel', i:-2.5, j:-3.5, y:-0.3},
    {t:'station/floor', i:-2.5, j:-2.5, y:-0.3},
    {t:'station/floor', i:-2.5, j:-1.5, y:-0.3},
    {t:'station/floor-panel', i:-2.5, j:-0.5, y:-0.3},
    {t:'station/floor', i:-2.5, j:0.5, y:-0.3},
    {t:'station/floor', i:-2.5, j:1.5, y:-0.3},
    {t:'station/floor-panel', i:-2.5, j:2.5, y:-0.3},
    {t:'station/floor', i:-2.5, j:3.5, y:-0.3},
    {t:'station/floor', i:-2.5, j:4.5, y:-0.3},
    {t:'station/floor-panel', i:-1.5, j:-4.5, y:-0.3},
    {t:'station/floor', i:-1.5, j:-3.5, y:-0.3},
    {t:'station/floor', i:-1.5, j:-2.5, y:-0.3},
    {t:'station/floor-panel', i:-1.5, j:-1.5, y:-0.3},
    {t:'station/floor-detail', i:-1.5, j:-0.5, y:-0.3},
    {t:'station/floor-detail', i:-1.5, j:0.5, y:-0.3},
    {t:'station/floor-panel', i:-1.5, j:1.5, y:-0.3},
    {t:'station/floor', i:-1.5, j:2.5, y:-0.3},
    {t:'station/floor', i:-1.5, j:3.5, y:-0.3},
    {t:'station/floor-panel', i:-1.5, j:4.5, y:-0.3},
    {t:'station/floor', i:-0.5, j:-4.5, y:-0.3},
    {t:'station/floor', i:-0.5, j:-3.5, y:-0.3},
    {t:'station/floor-panel', i:-0.5, j:-2.5, y:-0.3},
    {t:'station/floor-detail', i:-0.5, j:-1.5, y:-0.3},
    {t:'station/floor-detail', i:-0.5, j:-0.5, y:-0.3},
    {t:'station/floor-detail', i:-0.5, j:0.5, y:-0.3},
    {t:'station/floor-detail', i:-0.5, j:1.5, y:-0.3},
    {t:'station/floor', i:-0.5, j:2.5, y:-0.3},
    {t:'station/floor-panel', i:-0.5, j:3.5, y:-0.3},
    {t:'station/floor', i:-0.5, j:4.5, y:-0.3},
    {t:'station/floor', i:0.5, j:-4.5, y:-0.3},
    {t:'station/floor-panel', i:0.5, j:-3.5, y:-0.3},
    {t:'station/floor', i:0.5, j:-2.5, y:-0.3},
    {t:'station/floor-detail', i:0.5, j:-1.5, y:-0.3},
    {t:'station/floor-detail', i:0.5, j:-0.5, y:-0.3},
    {t:'station/floor-detail', i:0.5, j:0.5, y:-0.3},
    {t:'station/floor-detail', i:0.5, j:1.5, y:-0.3},
    {t:'station/floor-panel', i:0.5, j:2.5, y:-0.3},
    {t:'station/floor', i:0.5, j:3.5, y:-0.3},
    {t:'station/floor', i:0.5, j:4.5, y:-0.3},
    {t:'station/floor-panel', i:1.5, j:-4.5, y:-0.3},
    {t:'station/floor', i:1.5, j:-3.5, y:-0.3},
    {t:'station/floor', i:1.5, j:-2.5, y:-0.3},
    {t:'station/floor-panel', i:1.5, j:-1.5, y:-0.3},
    {t:'station/floor-detail', i:1.5, j:-0.5, y:-0.3},
    {t:'station/floor-detail', i:1.5, j:0.5, y:-0.3},
    {t:'station/floor-panel', i:1.5, j:1.5, y:-0.3},
    {t:'station/floor', i:1.5, j:2.5, y:-0.3},
    {t:'station/floor', i:1.5, j:3.5, y:-0.3},
    {t:'station/floor-panel', i:1.5, j:4.5, y:-0.3},
    {t:'station/floor', i:2.5, j:-4.5, y:-0.3},
    {t:'station/floor', i:2.5, j:-3.5, y:-0.3},
    {t:'station/floor-panel', i:2.5, j:-2.5, y:-0.3},
    {t:'station/floor', i:2.5, j:-1.5, y:-0.3},
    {t:'station/floor', i:2.5, j:-0.5, y:-0.3},
    {t:'station/floor-panel', i:2.5, j:0.5, y:-0.3},
    {t:'station/floor', i:2.5, j:1.5, y:-0.3},
    {t:'station/floor', i:2.5, j:2.5, y:-0.3},
    {t:'station/floor-panel', i:2.5, j:3.5, y:-0.3},
    {t:'station/floor', i:2.5, j:4.5, y:-0.3},
    {t:'station/floor', i:3.5, j:-3.5, y:-0.3},
    {t:'station/floor-panel', i:3.5, j:-2.5, y:-0.3},
    {t:'station/floor', i:3.5, j:-1.5, y:-0.3},
    {t:'station/floor', i:3.5, j:-0.5, y:-0.3},
    {t:'station/floor-panel', i:3.5, j:0.5, y:-0.3},
    {t:'station/floor', i:3.5, j:1.5, y:-0.3},
    {t:'station/floor', i:3.5, j:2.5, y:-0.3},
    {t:'station/floor-panel', i:3.5, j:3.5, y:-0.3},
    {t:'station/floor', i:4.5, j:-2.5, y:-0.3},
    {t:'station/floor', i:4.5, j:-1.5, y:-0.3},
    {t:'station/floor-panel', i:4.5, j:-0.5, y:-0.3},
    {t:'station/floor', i:4.5, j:0.5, y:-0.3},
    {t:'station/floor', i:4.5, j:1.5, y:-0.3},
    {t:'station/floor-panel', i:4.5, j:2.5, y:-0.3},
    {t:'station/floor-panel', i:2.5, j:2.5, y:0},
    {t:'station/floor-panel', i:2.5, j:-2.5, y:0, rot:1},
    {t:'station/floor-panel', i:-2.5, j:-2.5, y:0, rot:2},
    {t:'station/floor-panel', i:-2.5, j:2.5, y:0, rot:3},
    {t:'station/floor-panel', i:3.5, j:2.5, y:0},
    {t:'station/floor-panel', i:2.5, j:-3.5, y:0, rot:1},
    {t:'station/floor-panel', i:-3.5, j:-2.5, y:0, rot:2},
    {t:'station/floor-panel', i:-2.5, j:3.5, y:0, rot:3},
    {t:'station/floor-panel', i:2.5, j:3.5, y:0},
    {t:'station/floor-panel', i:3.5, j:-2.5, y:0, rot:1},
    {t:'station/floor-panel', i:-2.5, j:-3.5, y:0, rot:2},
    {t:'station/floor-panel', i:-3.5, j:2.5, y:0, rot:3},
    {t:'station/floor-panel', i:3.5, j:3.5, y:0},
    {t:'station/floor-panel', i:3.5, j:-3.5, y:0, rot:1},
    {t:'station/floor-panel', i:-3.5, j:-3.5, y:0, rot:2},
    {t:'station/floor-panel', i:-3.5, j:3.5, y:0, rot:3},
    {t:'station/stairs', i:2.5, j:1.5, y:0.004, rot:2},
    {t:'station/stairs', i:1.5, j:-2.5, y:0.004, rot:3},
    {t:'station/stairs', i:-2.5, j:-1.5, y:0.004},
    {t:'station/stairs', i:-1.5, j:2.5, y:0.004, rot:1},
    {t:'station/wall-door', i:2.5, j:2.5, y:0.304},
    {t:'station/wall-door', i:2.5, j:-2.5, y:0.304, rot:1},
    {t:'station/wall-door', i:-2.5, j:-2.5, y:0.304, rot:2},
    {t:'station/wall-door', i:-2.5, j:2.5, y:0.304, rot:3},
    {t:'station/wall', i:3.5, j:2.5, y:0.304},
    {t:'station/wall', i:2.5, j:-3.5, y:0.304, rot:1},
    {t:'station/wall', i:-3.5, j:-2.5, y:0.304, rot:2},
    {t:'station/wall', i:-2.5, j:3.5, y:0.304, rot:3},
    {t:'station/wall-window', i:2.5, j:3.5, y:0.304, rot:1},
    {t:'station/wall-window', i:3.5, j:-2.5, y:0.304, rot:2},
    {t:'station/wall-window', i:-2.5, j:-3.5, y:0.304, rot:3},
    {t:'station/wall-window', i:-3.5, j:2.5, y:0.304},
    {t:'station/container', i:3.5, j:3.5, y:0.304, sx:1.2, sy:1.2, sz:1.2},
    {t:'station/container', i:3.5, j:-3.5, y:0.304, rot:1, sx:1.2, sy:1.2, sz:1.2},
    {t:'station/container', i:-3.5, j:-3.5, y:0.304, rot:2, sx:1.2, sy:1.2, sz:1.2},
    {t:'station/container', i:-3.5, j:3.5, y:0.304, rot:3, sx:1.2, sy:1.2, sz:1.2},
    {t:'station/computer-system', i:3.5, j:2.5, y:0.304, rot:2},
    {t:'station/computer-system', i:2.5, j:-3.5, y:0.304, rot:3},
    {t:'station/computer-system', i:-3.5, j:-2.5, y:0.304},
    {t:'station/computer-system', i:-2.5, j:3.5, y:0.304, rot:1},
    {t:'station/table-large', i:1.096, j:1.096, y:0.004},
    {t:'station/table-large', i:1.096, j:-1.096, y:0.004, rot:1},
    {t:'station/table-large', i:-1.096, j:-1.096, y:0.004, rot:2},
    {t:'station/table-large', i:-1.096, j:1.096, y:0.004, rot:3},
    {t:'station/skip', i:4.415, j:1.101, y:0.004, rot:1},
    {t:'station/skip', i:1.101, j:-4.415, y:0.004, rot:2},
    {t:'station/skip', i:-4.415, j:-1.101, y:0.004, rot:3},
    {t:'station/skip', i:-1.101, j:4.415, y:0.004},
    {t:'station/pipe', i:2.544, j:3.772, y:0.004, sx:1.3, sy:1.3, sz:1.3},
    {t:'station/pipe', i:3.772, j:-2.544, y:0.004, rot:1, sx:1.3, sy:1.3, sz:1.3},
    {t:'station/pipe', i:-2.544, j:-3.772, y:0.004, rot:2, sx:1.3, sy:1.3, sz:1.3},
    {t:'station/pipe', i:-3.772, j:2.544, y:0.004, rot:3, sx:1.3, sy:1.3, sz:1.3},
    {t:'station/rail', i:0.946, j:4.451, y:0.004, rot:1},
    {t:'station/rail', i:4.451, j:-0.946, y:0.004, rot:2},
    {t:'station/rail', i:-0.946, j:-4.451, y:0.004, rot:3},
    {t:'station/rail', i:-4.451, j:0.946, y:0.004},
    {t:'station/table-display-planet', i:0, j:0, y:0.004, sx:1.6, sy:1.6, sz:1.6, deco:true}
  ],
  arena: true,
  space: true,
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:14.455, y:0.2, z:0} ],
  killY: -30,
  start: {x:14.455, y:0.2, z:0},
  spawns: [ {x:14.455, y:0.2, z:0}, {x:0, y:0.2, z:14.455}, {x:-14.455, y:0.2, z:0}, {x:0, y:0.2, z:-14.455} ],
  pads: [ {x:0, y:0, z:0}, {x:8.844, y:0.885, z:8.844}, {x:-8.844, y:0.885, z:8.844}, {x:-8.844, y:0.885, z:-8.844}, {x:8.844, y:0.885, z:-8.844} ],
  hints: [ '사분면마다 <b>벽으로 둘러싼 방</b>이 있습니다. 문으로 드나드세요.' ]
});


/* ---------- levels/peak.js ---------- */
/* PUNG! 레벨 — 피크 (절벽 위의 평지)
   Kenney Survival Kit(CC0) 로 만든 두 번째 경쟁 아레나. 우주 정거장이 '실내 통로'라면
   여기는 '탁 트인 벼랑 끝'이다 — 벽이 거의 없어 밀려나면 바로 허공이고, 엄폐물은
   뛰어넘을 수 있는 바위·울타리뿐이라 서로 붙어서 싸우게 된다.

   지형은 PUNG.genPeak 이 시드로 만든다(라운드마다 새 봉우리). 판 자체는 여기 없고
   collapse 스펙만 있다 — 자세한 규칙은 level.js 의 genPeak 주석 참고. */
PUNG.defineLevel('peak', {
  name: '피크 (경쟁)',
  arena: true,
  collapse: {
    gen: 'peak',
    /* 1킷유닛 = 몇 미터인가. 3.0 이라야 서바이벌 킷이 제 크기가 된다:
       나무 4.2~5.1m · 큰 바위 폭 2.5m · 천막 1.7m · 울타리 1.56m.
       특히 울타리 높이가 점프 정점(1.68m)보다 낮아야 "넘어 다닐 수 있는 엄폐물"이
       된다 — 이 값을 키우면 울타리가 벽이 되어 아레나가 미로처럼 변한다. */
    size: 3.0,
    y: -0.5, hy: 0.5,
    col: '#4f8a45',                  // 붕괴 예고판 색(발판 자체는 킷 조각이라 색이 없다)
    warnCol: '#e0713a',
    /* 고리가 7겹(0~6)이라 정거장(10겹)보다 간격을 넉넉히 줘야 한 판이 짧지 않다.
       예전 값(18 / 6.5)은 붕괴가 판을 좁히는 게 아니라 그 자체로 위협이 됐다 —
       붙어 볼 틈도 없이 첫 겹이 떨어지고, 자리를 잡으면 곧 그 자리가 사라졌다.
       keepRings 가 2 라 실제로 떨어지는 건 고리 6·5·4·3·2 다섯 장이고, 마지막
       한 장은 first + 4*every 에 떨어진다. 판을 넓히며 고리가 한 겹 늘었으므로
       간격을 9.5 → 8.5 로 줄여 길이를 맞췄다: 26 + 4*8.5 = 60초에 정상만 남는다. */
    first: 26,                       // 첫 붕괴까지(초)
    every: 8.5,                      // 고리 한 겹이 무너지는 간격(초)
    /* 예고는 '피할 시간'이라 간격과 같이 늘려야 한다 — 간격만 늘리고 이걸 두면
       무너지는 순간의 급작스러움은 그대로다. */
    warn: 2.2,                       // 무너지기 전 깜빡이는 예고(초)
    keepRings: 2,                    // 정상(고리 0~1)은 끝까지 남는다
    /* 다 무너진 뒤에도 판을 갈아엎지 않는다. 좁아진 정상에서 끝을 보는 게 이 맵의
       결말인데, 새 봉우리가 서면 방금 만든 긴장이 그대로 풀린다. */
    keepFinal: true
  },
  boxes: [
    /* 저 아래 골짜기 바닥. 판에서 유일한 상자인데, 발판이 아니라 '떨어졌다'를
       보여 주는 배경이다(deco = 밟히지 않는다). 산체 밑동(-66m)보다 아래에 둬
       산이 바닥에 박혀 보이게 한다 — 안 그러면 산 밑으로 하늘이 비친다. */
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#2b3a2c', deco:true}
  ],
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:0, y:0, z:0} ],
  /* 데크 아래는 이제 통째로 허공이다(genPeak 2·3번 참고) — 테두리 바위도 선반도
     밟히지 않는다. 그러면 -30m 까지 떨어지는 2.3초가 그냥 빈 시간이라, 데크
     바로 아래에 킬존을 둔다. 밀려나고 1초 남짓이면 다시 판 위에 선다. */
  killY: -8,
  /* start·spawns·pads 는 생성기가 매 라운드 덮어쓴다. 여기 값은 형식상의 기본값. */
  start: {x:11, y:1.35, z:11},
  spawns: [ {x:11,y:1.35,z:11}, {x:11,y:1.35,z:-11}, {x:-11,y:1.35,z:-11}, {x:-11,y:1.35,z:11} ],
  pads: [ {x:0, y:1.35, z:0} ],
  /* arena.js 와 같은 규칙 — 붕괴 맵에만 남은 줄이라 튜토리얼 말투로 끝맺는다.
     피크는 정상(고리 0~1)이 끝까지 남으므로 '어디로 물러나야 하는가' 가 핵심이다. */
  hints: [ '바깥 고리부터 무너집니다. 정상 쪽으로 물러나면서, 상대는 <b>펑건으로 밀어</b> 절벽 아래로 떨어뜨리세요!' ]
});


/* ---------- levels/plant.js ---------- */
/* PUNG! 레벨 — kiteditor.html 에서 만듦. 손으로 고쳐도 된다.
   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다. */
PUNG.defineLevel('plant', {
  name: '조립 라인 (경쟁)',
  unit: 1.2,
  boxes: [
    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#241a12', deco:true}
  ],
  pieces: [
    {t:'factory/top-large-checkerboard', i:-9, j:-5, y:0},
    {t:'factory/floor-large', i:-9, j:-3, y:0},
    {t:'factory/floor-large', i:-9, j:-1, y:0},
    {t:'factory/floor-large', i:-9, j:1, y:0},
    {t:'factory/top-large-checkerboard', i:-9, j:3, y:0},
    {t:'factory/floor-large', i:-9, j:5, y:0},
    {t:'factory/floor-large', i:-7, j:-7, y:0},
    {t:'factory/floor-large', i:-7, j:-5, y:0},
    {t:'factory/top-large-checkerboard', i:-7, j:-3, y:0},
    {t:'factory/floor-large', i:-7, j:-1, y:0},
    {t:'factory/floor-large', i:-7, j:1, y:0},
    {t:'factory/floor-large', i:-7, j:3, y:0},
    {t:'factory/top-large-checkerboard', i:-7, j:5, y:0},
    {t:'factory/floor-large', i:-7, j:7, y:0},
    {t:'factory/floor-large', i:-5, j:-9, y:0},
    {t:'factory/floor-large', i:-5, j:-7, y:0},
    {t:'factory/top-large-checkerboard', i:-5, j:-5, y:0},
    {t:'factory/floor-large', i:-5, j:-3, y:0},
    {t:'factory/floor-large', i:-5, j:-1, y:0},
    {t:'factory/floor-large', i:-5, j:1, y:0},
    {t:'factory/top-large-checkerboard', i:-5, j:3, y:0},
    {t:'factory/floor-large', i:-5, j:5, y:0},
    {t:'factory/floor-large', i:-5, j:7, y:0},
    {t:'factory/floor-large', i:-5, j:9, y:0},
    {t:'factory/top-large-checkerboard', i:-3, j:-9, y:0},
    {t:'factory/floor-large', i:-3, j:-7, y:0},
    {t:'factory/floor-large', i:-3, j:-5, y:0},
    {t:'factory/floor-large', i:-3, j:-3, y:0},
    {t:'factory/top-large-checkerboard', i:-3, j:-1, y:0},
    {t:'factory/floor-large', i:-3, j:1, y:0},
    {t:'factory/floor-large', i:-3, j:3, y:0},
    {t:'factory/floor-large', i:-3, j:5, y:0},
    {t:'factory/top-large-checkerboard', i:-3, j:7, y:0},
    {t:'factory/floor-large', i:-3, j:9, y:0},
    {t:'factory/floor-large', i:-1, j:-9, y:0},
    {t:'factory/floor-large', i:-1, j:-7, y:0},
    {t:'factory/top-large-checkerboard', i:-1, j:-5, y:0},
    {t:'factory/floor-large', i:-1, j:-3, y:0},
    {t:'factory/floor-large', i:-1, j:-1, y:0},
    {t:'factory/floor-large', i:-1, j:1, y:0},
    {t:'factory/top-large-checkerboard', i:-1, j:3, y:0},
    {t:'factory/floor-large', i:-1, j:5, y:0},
    {t:'factory/floor-large', i:-1, j:7, y:0},
    {t:'factory/floor-large', i:-1, j:9, y:0},
    {t:'factory/top-large-checkerboard', i:1, j:-9, y:0},
    {t:'factory/floor-large', i:1, j:-7, y:0},
    {t:'factory/floor-large', i:1, j:-5, y:0},
    {t:'factory/floor-large', i:1, j:-3, y:0},
    {t:'factory/top-large-checkerboard', i:1, j:-1, y:0},
    {t:'factory/floor-large', i:1, j:1, y:0},
    {t:'factory/floor-large', i:1, j:3, y:0},
    {t:'factory/floor-large', i:1, j:5, y:0},
    {t:'factory/top-large-checkerboard', i:1, j:7, y:0},
    {t:'factory/floor-large', i:1, j:9, y:0},
    {t:'factory/floor-large', i:3, j:-9, y:0},
    {t:'factory/floor-large', i:3, j:-7, y:0},
    {t:'factory/top-large-checkerboard', i:3, j:-5, y:0},
    {t:'factory/floor-large', i:3, j:-3, y:0},
    {t:'factory/floor-large', i:3, j:-1, y:0},
    {t:'factory/floor-large', i:3, j:1, y:0},
    {t:'factory/top-large-checkerboard', i:3, j:3, y:0},
    {t:'factory/floor-large', i:3, j:5, y:0},
    {t:'factory/floor-large', i:3, j:7, y:0},
    {t:'factory/floor-large', i:3, j:9, y:0},
    {t:'factory/top-large-checkerboard', i:5, j:-9, y:0},
    {t:'factory/floor-large', i:5, j:-7, y:0},
    {t:'factory/floor-large', i:5, j:-5, y:0},
    {t:'factory/floor-large', i:5, j:-3, y:0},
    {t:'factory/top-large-checkerboard', i:5, j:-1, y:0},
    {t:'factory/floor-large', i:5, j:1, y:0},
    {t:'factory/floor-large', i:5, j:3, y:0},
    {t:'factory/floor-large', i:5, j:5, y:0},
    {t:'factory/top-large-checkerboard', i:5, j:7, y:0},
    {t:'factory/floor-large', i:5, j:9, y:0},
    {t:'factory/floor-large', i:7, j:-7, y:0},
    {t:'factory/floor-large', i:7, j:-5, y:0},
    {t:'factory/top-large-checkerboard', i:7, j:-3, y:0},
    {t:'factory/floor-large', i:7, j:-1, y:0},
    {t:'factory/floor-large', i:7, j:1, y:0},
    {t:'factory/floor-large', i:7, j:3, y:0},
    {t:'factory/top-large-checkerboard', i:7, j:5, y:0},
    {t:'factory/floor-large', i:7, j:7, y:0},
    {t:'factory/floor-large', i:9, j:-5, y:0},
    {t:'factory/floor-large', i:9, j:-3, y:0},
    {t:'factory/top-large-checkerboard', i:9, j:-1, y:0},
    {t:'factory/floor-large', i:9, j:1, y:0},
    {t:'factory/floor-large', i:9, j:3, y:0},
    {t:'factory/floor-large', i:9, j:5, y:0},
    {t:'factory/floor-large', i:-3, j:-1, y:1.1},
    {t:'factory/floor-large', i:-3, j:1, y:1.1},
    {t:'factory/floor-large', i:-1, j:-3, y:1.1},
    {t:'factory/floor-large', i:-1, j:-1, y:1.1},
    {t:'factory/floor-large', i:-1, j:1, y:1.1},
    {t:'factory/floor-large', i:-1, j:3, y:1.1},
    {t:'factory/floor-large', i:1, j:-3, y:1.1},
    {t:'factory/floor-large', i:1, j:-1, y:1.1},
    {t:'factory/floor-large', i:1, j:1, y:1.1},
    {t:'factory/floor-large', i:1, j:3, y:1.1},
    {t:'factory/floor-large', i:3, j:-1, y:1.1},
    {t:'factory/floor-large', i:3, j:1, y:1.1},
    {t:'factory/catwalk-straight', i:4.5, j:0, y:1.151},
    {t:'factory/catwalk-straight', i:0, j:-4.5, y:1.151, rot:1},
    {t:'factory/catwalk-straight', i:-4.5, j:0, y:1.151, rot:2},
    {t:'factory/catwalk-straight', i:0, j:4.5, y:1.151, rot:3},
    {t:'factory/catwalk-straight', i:5.5, j:0, y:1.151},
    {t:'factory/catwalk-straight', i:0, j:-5.5, y:1.151, rot:1},
    {t:'factory/catwalk-straight', i:-5.5, j:0, y:1.151, rot:2},
    {t:'factory/catwalk-straight', i:0, j:5.5, y:1.151, rot:3},
    {t:'factory/catwalk-straight', i:6.5, j:0, y:1.151},
    {t:'factory/catwalk-straight', i:0, j:-6.5, y:1.151, rot:1},
    {t:'factory/catwalk-straight', i:-6.5, j:0, y:1.151, rot:2},
    {t:'factory/catwalk-straight', i:0, j:6.5, y:1.151, rot:3},
    {t:'factory/catwalk-stairs', i:8.5, j:0, y:0.004},
    {t:'factory/catwalk-stairs', i:0, j:-8.5, y:0.004, rot:1},
    {t:'factory/catwalk-stairs', i:-8.5, j:0, y:0.004, rot:2},
    {t:'factory/catwalk-stairs', i:0, j:8.5, y:0.004, rot:3},
    {t:'factory/conveyor-long', i:-4, j:-5.5, y:0.004},
    {t:'factory/conveyor-long', i:-5.5, j:4, y:0.004, rot:1},
    {t:'factory/conveyor-long', i:4, j:5.5, y:0.004, rot:2},
    {t:'factory/conveyor-long', i:5.5, j:-4, y:0.004, rot:3},
    {t:'factory/conveyor-long', i:-2, j:-5.5, y:0.004},
    {t:'factory/conveyor-long', i:-5.5, j:2, y:0.004, rot:1},
    {t:'factory/conveyor-long', i:2, j:5.5, y:0.004, rot:2},
    {t:'factory/conveyor-long', i:5.5, j:-2, y:0.004, rot:3},
    {t:'factory/conveyor-long', i:0, j:-5.5, y:0.004},
    {t:'factory/conveyor-long', i:-5.5, j:0, y:0.004, rot:1},
    {t:'factory/conveyor-long', i:0, j:5.5, y:0.004, rot:2},
    {t:'factory/conveyor-long', i:5.5, j:0, y:0.004, rot:3},
    {t:'factory/conveyor-long', i:2, j:-5.5, y:0.004},
    {t:'factory/conveyor-long', i:-5.5, j:-2, y:0.004, rot:1},
    {t:'factory/conveyor-long', i:-2, j:5.5, y:0.004, rot:2},
    {t:'factory/conveyor-long', i:5.5, j:2, y:0.004, rot:3},
    {t:'factory/conveyor-long', i:4, j:-5.5, y:0.004},
    {t:'factory/conveyor-long', i:-5.5, j:-4, y:0.004, rot:1},
    {t:'factory/conveyor-long', i:-4, j:5.5, y:0.004, rot:2},
    {t:'factory/conveyor-long', i:5.5, j:4, y:0.004, rot:3},
    {t:'factory/conveyor-corner', i:5.5, j:-5.5, y:0.004, rot:1},
    {t:'factory/conveyor-corner', i:-5.5, j:-5.5, y:0.004, rot:2},
    {t:'factory/conveyor-corner', i:-5.5, j:5.5, y:0.004, rot:3},
    {t:'factory/conveyor-corner', i:5.5, j:5.5, y:0.004},
    {t:'factory/machine', i:6.954, j:2.531, y:0.004},
    {t:'factory/machine', i:2.531, j:-6.954, y:0.004, rot:1},
    {t:'factory/machine', i:-6.954, j:-2.531, y:0.004, rot:2},
    {t:'factory/machine', i:-2.531, j:6.954, y:0.004, rot:3},
    {t:'factory/machine-window', i:2.531, j:6.954, y:0.004, rot:1},
    {t:'factory/machine-window', i:6.954, j:-2.531, y:0.004, rot:2},
    {t:'factory/machine-window', i:-2.531, j:-6.954, y:0.004, rot:3},
    {t:'factory/machine-window', i:-6.954, j:2.531, y:0.004},
    {t:'factory/hopper-high-round', i:8.636, j:2.153, y:0.004},
    {t:'factory/hopper-high-round', i:2.153, j:-8.636, y:0.004, rot:1},
    {t:'factory/hopper-high-round', i:-8.636, j:-2.153, y:0.004, rot:2},
    {t:'factory/hopper-high-round', i:-2.153, j:8.636, y:0.004, rot:3},
    {t:'factory/pipe-large', i:2.153, j:8.636, y:0.004, rot:1},
    {t:'factory/pipe-large', i:8.636, j:-2.153, y:0.004, rot:2},
    {t:'factory/pipe-large', i:-2.153, j:-8.636, y:0.004, rot:3},
    {t:'factory/pipe-large', i:-8.636, j:2.153, y:0.004},
    {t:'factory/box-large', i:6.798, j:4.585, y:0.004},
    {t:'factory/box-large', i:4.585, j:-6.798, y:0.004, rot:1},
    {t:'factory/box-large', i:-6.798, j:-4.585, y:0.004, rot:2},
    {t:'factory/box-large', i:-4.585, j:6.798, y:0.004, rot:3},
    {t:'factory/box-small', i:4.585, j:6.798, y:0.004},
    {t:'factory/box-small', i:6.798, j:-4.585, y:0.004, rot:1},
    {t:'factory/box-small', i:-4.585, j:-6.798, y:0.004, rot:2},
    {t:'factory/box-small', i:-6.798, j:4.585, y:0.004, rot:3},
    {t:'factory/warning-traffic', i:8.449, j:4.121, y:0.004},
    {t:'factory/warning-traffic', i:4.121, j:-8.449, y:0.004, rot:1},
    {t:'factory/warning-traffic', i:-8.449, j:-4.121, y:0.004, rot:2},
    {t:'factory/warning-traffic', i:-4.121, j:8.449, y:0.004, rot:3},
    {t:'factory/cone', i:4.121, j:8.449, y:0.004, sx:1.4, sy:1.4, sz:1.4},
    {t:'factory/cone', i:8.449, j:-4.121, y:0.004, rot:1, sx:1.4, sy:1.4, sz:1.4},
    {t:'factory/cone', i:-4.121, j:-8.449, y:0.004, rot:2, sx:1.4, sy:1.4, sz:1.4},
    {t:'factory/cone', i:-8.449, j:4.121, y:0.004, rot:3, sx:1.4, sy:1.4, sz:1.4},
    {t:'factory/structure-yellow-short', i:11.6, j:0, y:0.004, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:11.75, j:0, y:-1.496, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:11.377, j:2.263, y:0.004, ry:-11.25, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:11.524, j:2.292, y:-1.496, ry:-11.25, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:10.717, j:4.439, y:0.004, ry:-22.5, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:10.856, j:4.497, y:-1.496, ry:-22.5, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:9.645, j:6.445, y:0.004, ry:-33.75, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:9.77, j:6.528, y:-1.496, ry:-33.75, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:8.202, j:8.202, y:0.004, ry:-45, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:8.309, j:8.309, y:-1.496, ry:-45, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:6.445, j:9.645, y:0.004, ry:-56.25, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:6.528, j:9.77, y:-1.496, ry:-56.25, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:4.439, j:10.717, y:0.004, ry:-67.5, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:4.497, j:10.856, y:-1.496, ry:-67.5, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:2.263, j:11.377, y:0.004, ry:-78.75, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:2.292, j:11.524, y:-1.496, ry:-78.75, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:0, j:11.6, y:0.004, ry:-90, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:0, j:11.75, y:-1.496, ry:-90, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-2.263, j:11.377, y:0.004, ry:-101.25, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-2.292, j:11.524, y:-1.496, ry:-101.25, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-4.439, j:10.717, y:0.004, ry:-112.5, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-4.497, j:10.856, y:-1.496, ry:-112.5, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-6.445, j:9.645, y:0.004, ry:-123.75, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-6.528, j:9.77, y:-1.496, ry:-123.75, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-8.202, j:8.202, y:0.004, ry:-135, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-8.309, j:8.309, y:-1.496, ry:-135, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-9.645, j:6.445, y:0.004, ry:-146.25, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-9.77, j:6.528, y:-1.496, ry:-146.25, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-10.717, j:4.439, y:0.004, ry:-157.5, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-10.856, j:4.497, y:-1.496, ry:-157.5, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-11.377, j:2.263, y:0.004, ry:-168.75, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-11.524, j:2.292, y:-1.496, ry:-168.75, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-11.6, j:0, y:0.004, ry:-180, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-11.75, j:0, y:-1.496, ry:-180, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-11.377, j:-2.263, y:0.004, ry:-191.25, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-11.524, j:-2.292, y:-1.496, ry:-191.25, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-10.717, j:-4.439, y:0.004, ry:-202.5, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-10.856, j:-4.497, y:-1.496, ry:-202.5, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-9.645, j:-6.445, y:0.004, ry:-213.75, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-9.77, j:-6.528, y:-1.496, ry:-213.75, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-8.202, j:-8.202, y:0.004, ry:-225, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-8.309, j:-8.309, y:-1.496, ry:-225, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-6.445, j:-9.645, y:0.004, ry:-236.25, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-6.528, j:-9.77, y:-1.496, ry:-236.25, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-4.439, j:-10.717, y:0.004, ry:-247.5, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-4.497, j:-10.856, y:-1.496, ry:-247.5, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:-2.263, j:-11.377, y:0.004, ry:-258.75, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:-2.292, j:-11.524, y:-1.496, ry:-258.75, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:0, j:-11.6, y:0.004, ry:-270, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:0, j:-11.75, y:-1.496, ry:-270, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:2.263, j:-11.377, y:0.004, ry:-281.25, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:2.292, j:-11.524, y:-1.496, ry:-281.25, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:4.439, j:-10.717, y:0.004, ry:-292.5, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:4.497, j:-10.856, y:-1.496, ry:-292.5, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:6.445, j:-9.645, y:0.004, ry:-303.75, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:6.528, j:-9.77, y:-1.496, ry:-303.75, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:8.202, j:-8.202, y:0.004, ry:-315, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:8.309, j:-8.309, y:-1.496, ry:-315, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:9.645, j:-6.445, y:0.004, ry:-326.25, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:9.77, j:-6.528, y:-1.496, ry:-326.25, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:10.717, j:-4.439, y:0.004, ry:-337.5, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:10.856, j:-4.497, y:-1.496, ry:-337.5, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/structure-yellow-short', i:11.377, j:-2.263, y:0.004, ry:-348.75, sx:1.5, sy:1.5, sz:1.5},
    {t:'factory/structure-medium', i:11.524, j:-2.292, y:-1.496, ry:-348.75, sx:1.5, sy:1.5, sz:1.5, deco:true},
    {t:'factory/cog-c', i:0, j:0, y:1.104, sx:2.6, sy:2.6, sz:2.6, deco:true}
  ],
  arena: true,
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:8.146, y:0.2, z:8.146} ],
  killY: -30,
  start: {x:8.146, y:0.2, z:8.146},
  spawns: [ {x:8.146, y:0.2, z:8.146}, {x:-8.146, y:0.2, z:8.146}, {x:-8.146, y:0.2, z:-8.146}, {x:8.146, y:0.2, z:-8.146} ],
  pads: [ {x:0, y:1.32, z:0}, {x:8.64, y:0, z:0}, {x:0, y:0, z:8.64}, {x:-8.64, y:0, z:0}, {x:0, y:0, z:-8.64} ],
  hints: [ '가운데 상단 발판이 명당 — <b>계단</b>으로 오르고 캣워크로 건너세요.' ]
});


/* ---------- levels/protoring.js ---------- */
/* PUNG! 레벨 — kiteditor.html 에서 만듦. 손으로 고쳐도 된다.
   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다. */
PUNG.defineLevel('protoring', {
  name: '프로토타입 링 (경쟁)',
  unit: 2,
  boxes: [
    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#1a1d24', deco:true}
  ],
  pieces: [
    {t:'proto/floor-thick', i:-7.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:-7.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:-7.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:-7.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:-7.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:-7.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:-6.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:-5.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:-4.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:-7.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:-2.5, j:7.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:-7.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:-1.5, j:7.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:-7.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:-0.5, j:7.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:-7.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:0.5, j:7.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:-7.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:1.5, j:7.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:-7.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:2.5, j:7.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:3.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:-6.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:4.5, j:6.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:-5.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:5.5, j:5.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:-4.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:-3.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:3.5, y:-0.2},
    {t:'proto/floor-thick', i:6.5, j:4.5, y:-0.2},
    {t:'proto/floor-thick', i:7.5, j:-2.5, y:-0.2},
    {t:'proto/floor-thick', i:7.5, j:-1.5, y:-0.2},
    {t:'proto/floor-thick', i:7.5, j:-0.5, y:-0.2},
    {t:'proto/floor-thick', i:7.5, j:0.5, y:-0.2},
    {t:'proto/floor-thick', i:7.5, j:1.5, y:-0.2},
    {t:'proto/floor-thick', i:7.5, j:2.5, y:-0.2},
    {t:'proto/floor-thick', i:-3.5, j:-1.5, y:0},
    {t:'proto/floor-thick', i:-3.5, j:-0.5, y:0},
    {t:'proto/floor-thick', i:-3.5, j:0.5, y:0},
    {t:'proto/floor-thick', i:-3.5, j:1.5, y:0},
    {t:'proto/floor-thick', i:-2.5, j:-2.5, y:0},
    {t:'proto/floor-thick', i:-2.5, j:-1.5, y:0},
    {t:'proto/floor-thick', i:-2.5, j:1.5, y:0},
    {t:'proto/floor-thick', i:-2.5, j:2.5, y:0},
    {t:'proto/floor-thick', i:-1.5, j:-3.5, y:0},
    {t:'proto/floor-thick', i:-1.5, j:-2.5, y:0},
    {t:'proto/floor-thick', i:-1.5, j:2.5, y:0},
    {t:'proto/floor-thick', i:-1.5, j:3.5, y:0},
    {t:'proto/floor-thick', i:-0.5, j:-3.5, y:0},
    {t:'proto/floor-thick', i:-0.5, j:3.5, y:0},
    {t:'proto/floor-thick', i:0.5, j:-3.5, y:0},
    {t:'proto/floor-thick', i:0.5, j:3.5, y:0},
    {t:'proto/floor-thick', i:1.5, j:-3.5, y:0},
    {t:'proto/floor-thick', i:1.5, j:-2.5, y:0},
    {t:'proto/floor-thick', i:1.5, j:2.5, y:0},
    {t:'proto/floor-thick', i:1.5, j:3.5, y:0},
    {t:'proto/floor-thick', i:2.5, j:-2.5, y:0},
    {t:'proto/floor-thick', i:2.5, j:-1.5, y:0},
    {t:'proto/floor-thick', i:2.5, j:1.5, y:0},
    {t:'proto/floor-thick', i:2.5, j:2.5, y:0},
    {t:'proto/floor-thick', i:3.5, j:-1.5, y:0},
    {t:'proto/floor-thick', i:3.5, j:-0.5, y:0},
    {t:'proto/floor-thick', i:3.5, j:0.5, y:0},
    {t:'proto/floor-thick', i:3.5, j:1.5, y:0},
    {t:'proto/floor-thick', i:-1.5, j:-1.5, y:0.4},
    {t:'proto/floor-thick', i:-1.5, j:-0.5, y:0.4},
    {t:'proto/floor-thick', i:-1.5, j:0.5, y:0.4},
    {t:'proto/floor-thick', i:-1.5, j:1.5, y:0.4},
    {t:'proto/floor-thick', i:-0.5, j:-1.5, y:0.4},
    {t:'proto/floor-thick', i:-0.5, j:-0.5, y:0.4},
    {t:'proto/floor-thick', i:-0.5, j:0.5, y:0.4},
    {t:'proto/floor-thick', i:-0.5, j:1.5, y:0.4},
    {t:'proto/floor-thick', i:0.5, j:-1.5, y:0.4},
    {t:'proto/floor-thick', i:0.5, j:-0.5, y:0.4},
    {t:'proto/floor-thick', i:0.5, j:0.5, y:0.4},
    {t:'proto/floor-thick', i:0.5, j:1.5, y:0.4},
    {t:'proto/floor-thick', i:1.5, j:-1.5, y:0.4},
    {t:'proto/floor-thick', i:1.5, j:-0.5, y:0.4},
    {t:'proto/floor-thick', i:1.5, j:0.5, y:0.4},
    {t:'proto/floor-thick', i:1.5, j:1.5, y:0.4},
    {t:'proto/floor-thick', i:3.5, j:3.5, y:0.8},
    {t:'proto/floor-thick', i:3.5, j:-3.5, y:0.8, rot:1},
    {t:'proto/floor-thick', i:-3.5, j:-3.5, y:0.8, rot:2},
    {t:'proto/floor-thick', i:-3.5, j:3.5, y:0.8, rot:3},
    {t:'proto/floor-thick', i:4.5, j:3.5, y:0.8},
    {t:'proto/floor-thick', i:3.5, j:-4.5, y:0.8, rot:1},
    {t:'proto/floor-thick', i:-4.5, j:-3.5, y:0.8, rot:2},
    {t:'proto/floor-thick', i:-3.5, j:4.5, y:0.8, rot:3},
    {t:'proto/floor-thick', i:3.5, j:4.5, y:0.8},
    {t:'proto/floor-thick', i:4.5, j:-3.5, y:0.8, rot:1},
    {t:'proto/floor-thick', i:-3.5, j:-4.5, y:0.8, rot:2},
    {t:'proto/floor-thick', i:-4.5, j:3.5, y:0.8, rot:3},
    {t:'proto/floor-thick', i:4.5, j:4.5, y:0.8},
    {t:'proto/floor-thick', i:4.5, j:-4.5, y:0.8, rot:1},
    {t:'proto/floor-thick', i:-4.5, j:-4.5, y:0.8, rot:2},
    {t:'proto/floor-thick', i:-4.5, j:4.5, y:0.8, rot:3},
    {t:'proto/shape-slope', i:3.5, j:2.5, y:0.004, rot:1},
    {t:'proto/shape-slope', i:2.5, j:-3.5, y:0.004, rot:2},
    {t:'proto/shape-slope', i:-3.5, j:-2.5, y:0.004, rot:3},
    {t:'proto/shape-slope', i:-2.5, j:3.5, y:0.004},
    {t:'proto/wall', i:2.5, j:3.5, y:0.004, rot:1},
    {t:'proto/wall', i:3.5, j:-2.5, y:0.004, rot:2},
    {t:'proto/wall', i:-2.5, j:-3.5, y:0.004, rot:3},
    {t:'proto/wall', i:-3.5, j:2.5, y:0.004},
    {t:'proto/wall-doorway', i:2.5, j:4.5, y:0.004, rot:1},
    {t:'proto/wall-doorway', i:4.5, j:-2.5, y:0.004, rot:2},
    {t:'proto/wall-doorway', i:-2.5, j:-4.5, y:0.004, rot:3},
    {t:'proto/wall-doorway', i:-4.5, j:2.5, y:0.004},
    {t:'proto/wall', i:2.5, j:5.5, y:0.004, rot:1},
    {t:'proto/wall', i:5.5, j:-2.5, y:0.004, rot:2},
    {t:'proto/wall', i:-2.5, j:-5.5, y:0.004, rot:3},
    {t:'proto/wall', i:-5.5, j:2.5, y:0.004},
    {t:'proto/crate', i:1.5, j:3.5, y:0.204},
    {t:'proto/crate', i:3.5, j:-1.5, y:0.204, rot:1},
    {t:'proto/crate', i:-1.5, j:-3.5, y:0.204, rot:2},
    {t:'proto/crate', i:-3.5, j:1.5, y:0.204, rot:3},
    {t:'proto/crate-color', i:3.5, j:1.5, y:0.204},
    {t:'proto/crate-color', i:1.5, j:-3.5, y:0.204, rot:1},
    {t:'proto/crate-color', i:-3.5, j:-1.5, y:0.204, rot:2},
    {t:'proto/crate-color', i:-1.5, j:3.5, y:0.204, rot:3},
    {t:'proto/shape-cylinder', i:5.5, j:2.5, y:0.004},
    {t:'proto/shape-cylinder', i:2.5, j:-5.5, y:0.004, rot:1},
    {t:'proto/shape-cylinder', i:-5.5, j:-2.5, y:0.004, rot:2},
    {t:'proto/shape-cylinder', i:-2.5, j:5.5, y:0.004, rot:3},
    {t:'proto/shape-hexagon', i:2.5, j:5.5, y:0.004},
    {t:'proto/shape-hexagon', i:5.5, j:-2.5, y:0.004, rot:1},
    {t:'proto/shape-hexagon', i:-2.5, j:-5.5, y:0.004, rot:2},
    {t:'proto/shape-hexagon', i:-5.5, j:2.5, y:0.004, rot:3},
    {t:'proto/column', i:6.5, j:1.5, y:0.004},
    {t:'proto/column', i:1.5, j:-6.5, y:0.004, rot:1},
    {t:'proto/column', i:-6.5, j:-1.5, y:0.004, rot:2},
    {t:'proto/column', i:-1.5, j:6.5, y:0.004, rot:3},
    {t:'proto/column', i:1.5, j:6.5, y:0.004},
    {t:'proto/column', i:6.5, j:-1.5, y:0.004, rot:1},
    {t:'proto/column', i:-1.5, j:-6.5, y:0.004, rot:2},
    {t:'proto/column', i:-6.5, j:1.5, y:0.004, rot:3},
    {t:'proto/indicator-round-b', i:0, j:0, y:0.604, sx:2.2, sy:2.2, sz:2.2, deco:true}
  ],
  arena: true,
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:14, y:0.2, z:0} ],
  killY: -30,
  start: {x:14, y:0.2, z:0},
  spawns: [ {x:14, y:0.2, z:0}, {x:0, y:0.2, z:14}, {x:-14, y:0.2, z:0}, {x:0, y:0.2, z:-14} ],
  pads: [ {x:0, y:1.2, z:0}, {x:8.004, y:2, z:8.004}, {x:-8.004, y:2, z:8.004}, {x:-8.004, y:2, z:-8.004}, {x:8.004, y:2, z:-8.004} ],
  hints: [ '경사로로 <b>모서리 탑</b>을 잡으면 사방이 보입니다.' ]
});


/* ---------- levels/spire.js ---------- */
/* PUNG! 레벨 — editor.html 에서 생성. 손으로 고쳐도 된다.
   <script src="levels/spire.js"></script> 로 index.html 에 추가하면 목록에 뜬다. */
PUNG.defineLevel('spire', {
  name: '첨탑',
  boxes: [
    {cx:15.5, cy:-0.5, cz:0, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:12.5, cy:0.5, cz:10, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:3, cy:3.5, cz:16.5, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-7.5, cy:4.7, cz:15, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:-15.5, cy:7.7, cz:6, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-15.5, cy:17.7, cz:-4.5, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-8.5, cy:20.2, cz:-13, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:1.5, cy:21, cz:-14.5, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:10.5, cy:24, cz:-10, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:14.5, cy:26, cz:-1, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:11.5, cy:28.2, cz:9, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:2, cy:33.2, cz:15, hx:3, hy:0.5, hz:3, col:'#2f9c9c', link:'a'},
    {cx:13, cy:28.82, cz:8, hx:1.4, hy:0.12, hz:1.4, col:'#c8a52e', plate:'a'},
    {cx:-9.5, cy:39.2, cz:13, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-9.5, cy:39.82, cz:13, hx:1.4, hy:0.12, hz:1.4, col:'#c8a52e', plate:'a'},
    {cx:-16, cy:42.6, cz:3.5, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-15, cy:43.6, cz:-7, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:-7, cy:46.8, cz:-15, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:5.5, cy:52.3, cz:-15, hx:3, hy:0.5, hz:3, col:'#2f9c9c', link:'b'},
    {cx:-9, cy:47.42, cz:-15, hx:1.4, hy:0.12, hz:1.4, col:'#c8a52e', plate:'b'},
    {cx:14, cy:58.8, cz:-7, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:14, cy:59.42, cz:-7, hx:1.4, hy:0.12, hz:1.4, col:'#c8a52e', plate:'b'},
    {cx:14.5, cy:60.8, cz:4, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:8.5, cy:59.3, cz:11.5, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:-1, cy:63.5, cz:14.5, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-10, cy:66, cz:10, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-15, cy:79, cz:2, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-13, cy:81.6, cz:-8.5, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-5, cy:82.5, cz:-15.5, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:6.5, cy:85.5, cz:-15.5, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:15.5, cy:91.5, cz:-6.5, hx:3, hy:0.5, hz:3, col:'#2f9c9c', link:'c'},
    {cx:5, cy:86.12, cz:-17, hx:1.4, hy:0.12, hz:1.4, col:'#c8a52e', plate:'c'},
    {cx:15.5, cy:97, cz:6, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:15.5, cy:97.62, cz:6, hx:1.4, hy:0.12, hz:1.4, col:'#c8a52e', plate:'c'},
    {cx:7.5, cy:101.7, cz:14, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-3.5, cy:100.7, cz:15, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-12, cy:104.4, cz:8.5, hx:3, hy:0.5, hz:3, col:'#c07b5a'},
    {cx:-14.5, cy:105.5, cz:-0.5, hx:3, hy:0.5, hz:3, col:'#5a7bb0'},
    {cx:-11, cy:119.5, cz:-9, hx:3.4, hy:0.5, hz:3.4, col:'#3aa860'},
    {cx:0, cy:-24.5, cz:0, hx:60, hy:1, hz:120, col:'#20304a', deco:true},
    {cx:0, cy:-13.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#46557a', deco:true},
    {cx:0, cy:-4.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#3d4a6b', deco:true},
    {cx:0, cy:4.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#46557a', deco:true},
    {cx:0, cy:13.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#3d4a6b', deco:true},
    {cx:0, cy:22.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#46557a', deco:true},
    {cx:0, cy:31.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#3d4a6b', deco:true},
    {cx:0, cy:40.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#46557a', deco:true},
    {cx:0, cy:49.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#3d4a6b', deco:true},
    {cx:0, cy:58.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#46557a', deco:true},
    {cx:0, cy:67.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#3d4a6b', deco:true},
    {cx:0, cy:76.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#46557a', deco:true},
    {cx:0, cy:85.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#3d4a6b', deco:true},
    {cx:0, cy:94.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#46557a', deco:true},
    {cx:0, cy:103.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#3d4a6b', deco:true},
    {cx:0, cy:112.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#46557a', deco:true},
    {cx:0, cy:121.5, cz:0, hx:3.2, hy:4.5, hz:3.2, col:'#3d4a6b', deco:true},
    {cx:17, cy:0.5, cz:0, hx:0.9, hy:0.5, hz:0.75, col:'#6b7280', deco:true, g:'rock#1'},
    {cx:17.52, cy:0.78, cz:-0.3, hx:0.5, hy:0.35, hz:0.45, col:'#7c8593', deco:true, g:'rock#1'},
    {cx:16.56, cy:0.68, cz:0.34, hx:0.4, hy:0.28, hz:0.35, col:'#5d6470', deco:true, g:'rock#1'},
    {cx:-17, cy:8.54, cz:6.5, hx:0.06, hy:0.34, hz:0.3, col:'#4e9455', deco:true, g:'grass#2'},
    {cx:-16.76, cy:8.47, cz:6.62, hx:0.05, hy:0.27, hz:0.24, col:'#5aa862', deco:true, g:'grass#2'},
    {cx:-17.2, cy:8.5, cz:6.36, hx:0.05, hy:0.3, hz:0.22, col:'#458a4c', deco:true, g:'grass#2'},
    {cx:11.5, cy:25, cz:-11, hx:0.9, hy:0.5, hz:0.75, col:'#6b7280', deco:true, g:'rock#3'},
    {cx:12.02, cy:25.28, cz:-11.3, hx:0.5, hy:0.35, hz:0.45, col:'#7c8593', deco:true, g:'rock#3'},
    {cx:11.06, cy:25.18, cz:-10.66, hx:0.4, hy:0.28, hz:0.35, col:'#5d6470', deco:true, g:'rock#3'},
    {cx:-18, cy:43.44, cz:4, hx:0.06, hy:0.34, hz:0.3, col:'#4e9455', deco:true, g:'grass#4'},
    {cx:-17.76, cy:43.37, cz:4.12, hx:0.05, hy:0.27, hz:0.24, col:'#5aa862', deco:true, g:'grass#4'},
    {cx:-18.2, cy:43.4, cz:3.86, hx:0.05, hy:0.3, hz:0.22, col:'#458a4c', deco:true, g:'grass#4'},
    {cx:16, cy:61.8, cz:4.5, hx:0.9, hy:0.5, hz:0.75, col:'#6b7280', deco:true, g:'rock#5'},
    {cx:16.52, cy:62.08, cz:4.2, hx:0.5, hy:0.35, hz:0.45, col:'#7c8593', deco:true, g:'rock#5'},
    {cx:15.56, cy:61.98, cz:4.84, hx:0.4, hy:0.28, hz:0.35, col:'#5d6470', deco:true, g:'rock#5'},
    {cx:-16.5, cy:79.84, cz:2, hx:0.06, hy:0.34, hz:0.3, col:'#4e9455', deco:true, g:'grass#6'},
    {cx:-16.26, cy:79.77, cz:2.12, hx:0.05, hy:0.27, hz:0.24, col:'#5aa862', deco:true, g:'grass#6'},
    {cx:-16.7, cy:79.8, cz:1.86, hx:0.05, hy:0.3, hz:0.22, col:'#458a4c', deco:true, g:'grass#6'},
    {cx:17, cy:98, cz:6.5, hx:0.9, hy:0.5, hz:0.75, col:'#6b7280', deco:true, g:'rock#7'},
    {cx:17.52, cy:98.28, cz:6.2, hx:0.5, hy:0.35, hz:0.45, col:'#7c8593', deco:true, g:'rock#7'},
    {cx:16.56, cy:98.18, cz:6.84, hx:0.4, hy:0.28, hz:0.35, col:'#5d6470', deco:true, g:'rock#7'},
    {cx:-16, cy:106.34, cz:-0.5, hx:0.06, hy:0.34, hz:0.3, col:'#4e9455', deco:true, g:'grass#8'},
    {cx:-15.76, cy:106.27, cz:-0.38, hx:0.05, hy:0.27, hz:0.24, col:'#5aa862', deco:true, g:'grass#8'},
    {cx:-16.2, cy:106.3, cz:-0.64, hx:0.05, hy:0.3, hz:0.22, col:'#458a4c', deco:true, g:'grass#8'}
  ],
  goal: {cx:-11, cy:120.5, cz:-9, r:3.2},
  checkpoints: [
    {x:15.5, y:0, z:0, gate:true},
    {x:12.5, y:1, z:10},
    {x:3, y:4, z:16.5},
    {x:-7.5, y:5.2, z:15},
    {x:-15.5, y:8.2, z:6},
    {x:-15.5, y:18.2, z:-4.5, gate:true},
    {x:-8.5, y:20.7, z:-13},
    {x:1.5, y:21.5, z:-14.5},
    {x:10.5, y:24.5, z:-10},
    {x:14.5, y:26.5, z:-1},
    {x:11.5, y:28.7, z:9},
    {x:2, y:33.7, z:15},
    {x:-9.5, y:39.7, z:13, gate:true},
    {x:-16, y:43.1, z:3.5},
    {x:-15, y:44.1, z:-7},
    {x:-7, y:47.3, z:-15},
    {x:5.5, y:52.8, z:-15},
    {x:14, y:59.3, z:-7, gate:true},
    {x:14.5, y:61.3, z:4},
    {x:8.5, y:59.8, z:11.5},
    {x:-1, y:64, z:14.5},
    {x:-10, y:66.5, z:10},
    {x:-15, y:79.5, z:2, gate:true},
    {x:-13, y:82.1, z:-8.5},
    {x:-5, y:83, z:-15.5},
    {x:6.5, y:86, z:-15.5},
    {x:15.5, y:92, z:-6.5},
    {x:15.5, y:97.5, z:6, gate:true},
    {x:7.5, y:102.2, z:14},
    {x:-3.5, y:101.2, z:15},
    {x:-12, y:104.9, z:8.5},
    {x:-14.5, y:106, z:-0.5}
  ],
  killY: -14, start: {x:15.5, y:0, z:0},
  /* 체크포인트 번호별 화면 힌트(<b> 강조 가능). 마지막 항목은 이후 구간까지 유지된다.
     힌트는 "지금 서 있는" 체크포인트 번호로 뜬다(index.html 의 showHint). 그래서 관문
     설명은 관문을 넘은 발판이 아니라 그 <b>직전</b> 발판 번호에 달아야 한다 —
     넘은 뒤에 뜨는 설명은 아무 소용이 없다. 단, "되돌려 주기" 안내는 되돌리는 판이
     실제로 놓인 발판(cp12·17·27)에 달린 게 맞으므로 그대로 둔다. */
  hints: [
    '꼭대기까지. <b>Space + 발밑 좌클릭</b>',
    '',
    '',
    '',
    '<b>협동 관문.</b> 혼자서는 못 오른다. 팀원이 <b>뛰는 순간 몸을 직격</b>하면 위로 뜬다. 도울 때는 발판 <b>가장자리</b>에서 (안쪽에서 쏘면 자기 발판에 막힌다)',
    '먼저 오른 사람이 발판 <b>가장자리</b>에서 아래를 직격해 끌어올린다',
    '',
    '',
    '',
    '',
    '<b>압력판 다리.</b> 한 명이 노란 판을 밟고 있어야 청록 다리가 생긴다',
    '',
    '건너간 사람이 <b>위쪽 판</b>을 밟아 다리를 되돌려 준다',
    '',
    '',
    '<b>압력판 다리.</b> 한 명이 노란 판을 밟고 있어야 청록 다리가 생긴다',
    '',
    '건너간 사람이 <b>위쪽 판</b>을 밟아 다리를 되돌려 준다',
    '',
    '',
    '',
    '<b>협동 관문.</b> 혼자서는 못 오른다. 팀원이 <b>뛰는 순간 몸을 직격</b>하면 위로 뜬다. 도울 때는 발판 <b>가장자리</b>에서 (안쪽에서 쏘면 자기 발판에 막힌다)',
    '먼저 오른 사람이 발판 <b>가장자리</b>에서 아래를 직격해 끌어올린다',
    '',
    '',
    '<b>압력판 다리.</b> 한 명이 노란 판을 밟고 있어야 청록 다리가 생긴다',
    '',
    '건너간 사람이 <b>위쪽 판</b>을 밟아 다리를 되돌려 준다',
    '',
    '',
    '',
    '<b>마지막 관문.</b> 결승까지 14m, 혼자서는 못 오른다. 한 명을 먼저 올리고, 그 사람이 <b>가장자리에서 아래를 직격</b>해 나머지를 끌어올린다'
  ]
});


/* ---------- levels/tutorial.js ---------- */
/* PUNG! 튜토리얼 맵 — 손으로 쓴 파일이다(에디터 산출물이 아니다).

   생김새: 가운데 광장(허브) 하나에, 아이템 여섯 개의 부스가 반지름 24m 의 육각 자리로
   빙 둘러선다. 다리를 놓지 않고 바닥을 통째로 이어 둔 이유는 상자가 축 정렬만 되기
   때문이다 — 60도로 뻗는 다리는 축 정렬 상자로 만들 수 없고, 잘게 쪼개 계단처럼 놓으면
   가장자리가 톱니가 된다. 넓은 판 하나에 부스를 얹으면 그 문제가 통째로 사라지고,
   덤으로 "아무 데나 먼저 가도 된다"는 것이 걸어 보면 바로 안다.

   부스 뒤판은 축 정렬이라 허브를 정확히 등지지 못한다. 그래서 부스마다 '가장 가까운
   축' 으로 세운다(+Z / +X / -Z / -X). 어긋난 각도로 억지로 맞추는 것보다, 넷 중 하나로
   딱 떨어지는 편이 일부러 그렇게 지은 것처럼 보인다.

   뒤판도 발판과 같이 막힌 벽이다. 한동안 deco(통과)로 뒀던 적이 있는데, 밀려난
   허수아비가 벽에 처박혀 삐뚜름하게 선 채로 남는 것을 피하려던 것이었다. 그건
   벽으로 풀 문제가 아니었다 — 지금은 허수아비가 자리를 뜬 채 잠시 멈추면 스스로
   제자리로 돌아온다(index.html 의 DUMMY_SETTLE). 눈에 벽으로 보이는 것이 몸으로도
   벽이어야 한다: 발판은 막히는데 벽은 통과하면 그게 더 큰 혼란이다.

   판은 허공에 떠 있다(killY -25). 밀려서 떨어지는 게 이 게임의 전부라, 배우는 자리에도
   떨어질 가장자리가 있어야 한다. 대신 떨어지면 마지막으로 있던 부스로 돌아온다
   (index.html 의 respawn — 튜토리얼은 체크포인트가 아니라 구역을 기억한다).

   좌표 규칙
     광장 윗면        y = 0
     허브 단          y = 0.3
     부스 발판 윗면    y = 0.5   ← 패드·허수아비·되돌아올 자리가 전부 이 높이
*/
PUNG.defineLevel('tutorial', {
  name: '튜토리얼',
  hidden: true,          // 경기용 맵 목록에 끼면 안 된다(경쟁 필터가 arena 로 이미 거르지만 명시한다)

  boxes: [
    // 저 아래 배경 바닥 — deco 라 밟히지 않는다. 떨어질 때 '얼마나 높았는지'가 보인다
    {cx:0, cy:-60, cz:0, hx:200, hy:1, hz:200, col:'#1a2029', deco:true},

    // 광장. 68x68 — 부스 바깥(31m)에서 가장자리(34m)까지 3m 를 남겨,
    // 허수아비가 바깥으로 밀리면 실제로 떨어진다
    {cx:0, cy:-0.6, cz:0, hx:34, hy:0.6, hz:34, col:'#2a3340'},

    // 허브 단 — 시작 자리. 한 단 올려 두면 "여기가 가운데" 가 서 있는 것만으로 읽힌다
    {cx:0, cy:0.15, cz:0, hx:9, hy:0.15, hz:9, col:'#37455a'},
    /* 기본 조작 연습용 턱 둘. 높이가 다른 이유는 하나로는 "점프로 오르는 높이" 와
       "폭발로만 오르는 높이" 가 구분되지 않기 때문이다. 낮은 쪽(1.2m)은 점프로 닿고,
       높은 쪽(3.4m)은 발밑을 쏴야 오른다. */
    {cx:6.5, cy:0.6,  cz:6.5,  hx:2, hy:0.6, hz:2, col:'#46566e'},
    {cx:-6.5, cy:1.7, cz:6.5,  hx:2, hy:1.7, hz:2, col:'#46566e'},

    /* ── 부스 1 · 과충전 (0, 24) · 뒤판 +Z ── */
    {cx:0, cy:0.25, cz:24, hx:7, hy:0.25, hz:7, col:'#4a2a1a'},
    {cx:0, cy:2.1,  cz:30.5, hx:7, hy:1.6, hz:0.5, col:'#8a4526'},
    /* ── 부스 2 · 드럼 탄창 (20.8, 12) · 뒤판 +X ── */
    {cx:20.8, cy:0.25, cz:12, hx:7, hy:0.25, hz:7, col:'#4a3f14'},
    {cx:27.3, cy:2.1,  cz:12, hx:0.5, hy:1.6, hz:7, col:'#8a7420'},
    /* ── 부스 3 · 깃털 (20.8, -12) · 뒤판 +X ──
       활공은 '건너가는 것' 이라 건너갈 곳이 있어야 한다. 그래서 여기만 뒤판 가운데를
       비워 문을 내고, 광장 가장자리(x=34) 밖으로 8m 건너에 착지판을 놓았다.

       거리는 level.js 의 PUNG.reach 로 재서 잡았다(추측하면 반드시 틀린다):
         맨점프 낙차 -3.5m → 약 5.7m   ← 8m 를 못 건넌다
         활공 1초가 더해지면 약 11m    ← 건넌다
       착지판을 3.5m 낮춘 것도 계산에 들어간 값이다. 같은 높이면 체공이 짧아 활공을
       써도 아슬아슬해진다.

       로켓점프로 가면(9.3m) 활공 없이도 건너간다. 그건 막지 않았다 — 길을 하나로
       조이는 것보다 시킨 대로 했을 때 되는 게 중요하고, 로켓점프로 건너간 사람은
       이미 그 앞 부스에서 배운 것을 쓴 것이다. */
    {cx:20.8, cy:0.25, cz:-12, hx:7, hy:0.25, hz:7, col:'#1c3a45'},
    {cx:27.3, cy:2.1,  cz:-17, hx:0.5, hy:1.6, hz:2, col:'#2f6a80'},   // 뒤판 — 문 옆
    {cx:27.3, cy:2.1,  cz:-7,  hx:0.5, hy:1.6, hz:2, col:'#2f6a80'},
    // 도약대 — 광장 끝(34)에 붙여 둔다. 출발점이 정해져 있어야 거리가 매번 같다
    {cx:32.3, cy:0.25, cz:-12, hx:1.5, hy:0.25, hz:2.5, col:'#2f6a80'},
    // 착지판 — 윗면 -3.0. 틈은 34 에서 42 까지 8m
    {cx:46, cy:-3.4, cz:-12, hx:4, hy:0.4, hz:4, col:'#2f6a80'},
    {cx:46, cy:-2.9, cz:-12, hx:4, hy:0.1, hz:0.4, col:'#7ce0ff', deco:true},   // 도착 표시선
    /* ── 부스 4 · 리버스캡슐 (0, -24) · 뒤판 -Z ── */
    {cx:0, cy:0.25, cz:-24, hx:7, hy:0.25, hz:7, col:'#2f2445'},
    {cx:0, cy:2.1,  cz:-30.5, hx:7, hy:1.6, hz:0.5, col:'#574080'},
    /* ── 부스 5 · 닻 (-20.8, -12) · 뒤판 -X ──
       닻은 '안 일어나는 것' 을 가르쳐야 한다. 안 밀리고 안 뜨는 것은 그 자체로는
       아무 그림도 아니라서, 되는 때와 안 되는 때를 가르는 기준이 있어야 한다.
       그래서 '맨몸 로켓점프로는 오르고 닻을 끼면 못 오르는' 높이의 단을 세운다.

       높이는 level.js 로 실측해 잡았다(눈대중으로는 절대 못 맞춘다):
         맨몸 로켓점프 최고 8.38m
         닻(넉백 0.35배) 로켓점프 최고 3.44m
         맨점프만          1.68m
       그래서 발판에서 4.5m — 닻이면 1m 넘게 모자라고, 맨몸이면 4m 가까이 남는다.
       (처음에 3.4m 로 잡았다가 닻을 끼고도 3.44m 로 넘어가 버려 고쳤다. 허브의
        높은 턱 3.4m 와 같은 값이었는데, 그건 '맨점프로는 안 되는' 기준이라 다르다.) */
    {cx:-20.8, cy:0.25, cz:-12, hx:7, hy:0.25, hz:7, col:'#24401f'},
    {cx:-27.3, cy:2.1,  cz:-12, hx:0.5, hy:1.6, hz:7, col:'#4a7a3e'},
    // 기준 단 — 윗면 5.0m(발판 0.5 에서 4.5m 위). 뒤판 안쪽 면(-26.8)에 안 닿게 뗀다
    {cx:-24.0, cy:2.75, cz:-12, hx:2.4, hy:2.25, hz:2.4, col:'#4a7a3e'},
    {cx:-24.0, cy:5.05, cz:-12, hx:2.4, hy:0.05, hz:2.4, col:'#8fd67a', deco:true},  // 윗면 표시
    /* ── 부스 6 · 펄스 (-20.8, 12) · 뒤판 -X ── */
    {cx:-20.8, cy:0.25, cz:12, hx:7, hy:0.25, hz:7, col:'#45201f'},
    {cx:-27.3, cy:2.1,  cz:12, hx:0.5, hy:1.6, hz:7, col:'#80304f'}
  ],

  /* 패드에 item 을 박아 둔다 — 이 자리에서는 이것만 나온다. 무작위면 과충전을 배우러
     와서 닻이 나오고, 그러면 설명판과 손에 든 것이 어긋난다.
     자리는 전부 부스의 '허브 쪽' 이다: 들어서면서 집고, 안쪽 체험존에서 쓰게 된다. */
  pads: [
    {x:0,     y:0.5, z:19,    item:'power'},
    {x:15.5,  y:0.5, z:12,    item:'drum'},
    {x:15.5,  y:0.5, z:-12,   item:'feather'},
    {x:0,     y:0.5, z:-19,   item:'reverse'},
    {x:-15.5, y:0.5, z:-12,   item:'anchor'},
    {x:-15.5, y:0.5, z:12,    item:'pulse'}
  ],
  /* 경기에서 20초인 건 아이템이 흔해지면 판을 가르는 물건이 아니라 기본 장비가 되기
     때문이다. 배우는 자리에는 그 이유가 없다 — 한 번 써 보고 "다시" 가 바로 돼야 한다. */
  padCd: 4,

  /* 허수아비는 '남에게 일어나는 일' 을 가르치는 부스에만 둔다.
     과충전·리버스캡슐·펄스가 그렇다 — 맞는 쪽이 어떻게 되는지가 배울 내용이다.

     깃털과 닻은 뺐다. 둘 다 내 몸에 일어나는 일이라 상대가 필요 없다. 세워 두면
     "쟤한테 뭘 해야 하나" 로 읽혀 오히려 헷갈린다 — 그 자리에는 대신 몸으로 확인할
     구조물을 뒀다(위 boxes 의 착지판과 기준 단).

     허브에도 하나 둔다: 아이템 이전에 '펑!' 이 사람을 민다는 것부터 봐야 한다. */
  dummies: [
    {x:0, y:0.4, z:5, yaw:3.14},                                  // 허브 · 기본 조작

    {x:-3.5, y:0.5, z:28},    {x:3.5, y:0.5, z:28},               // 과충전
    {x:24.8, y:0.5, z:8.5},   {x:24.8, y:0.5, z:15.5},            // 드럼 탄창
    {x:-3.5, y:0.5, z:-28},   {x:3.5, y:0.5, z:-28},              // 리버스캡슐
    {x:-24.8, y:0.5, z:8.5},  {x:-24.8, y:0.5, z:15.5}            // 펄스
  ],

  /* 구역 — 들어서면 설명판이 뜨고, 떨어지면 여기로 돌아온다.
     r 이 부스 반지름(7)보다 넉넉한 건, 패드를 밟기 전에 설명이 먼저 떠야 하기 때문이다.

     ── 문체 ─────────────────────────────────────────────────────────
     여기는 맵 힌트(arena.js·peak.js)와 문체가 다르다. 일부러 다르다.

     맵 힌트는 달리는 중에 눈길 한 번으로 읽는 것이라 조각으로 끊는다
     ('<b>펑건으로 밀어</b> 정거장 밖으로 · 바깥 모듈부터 떨어져 나간다').
     튜토리얼은 서서 읽는 자리다. 처음 오는 사람에게 무엇을 왜 하는지 알려주는 곳이라
     문장이 끝나야 한다 — "민다" 같은 조각으로 끊으면 설명이 아니라 메모로 읽힌다.

     그래서 여기서는 설명은 <b>합니다체</b>로 끝맺고, 시켜야 할 것은 <b>~하세요!</b>로 쓴다.

     ITEMS 표의 desc 를 그대로 쓰지 않는 이유도 같다. 저건 게임 데이터의 문체(조각)라
     이 자리에 그대로 얹으면 설명판 안에서 두 문체가 섞인다. 그래서 text 를 맵이 직접 갖는다.
     ── ─────────────────────────────────────────────────────────────

     signSub 는 표지판에 붙는 짧은 꼬리표라 문장이 아니다 — 이름씨로 둔다. 멀리서
     "저기가 무엇을 하는 자리인가"만 읽히면 되고, 문장을 넣으면 허공에 뜬 라벨이
     한 줄로 길어져 뒤의 판을 가린다. */
  zones: [
    {x:0, z:0, r:12, y:0.3, hy:0.5, kind:'조작', title:'펑건',
     text:'펑건은 상대를 죽이지 않고 <b>밀어냅니다</b>. 쏜 사람도 반대 방향으로 똑같이 밀려납니다.',
     how:'앞에 있는 허수아비를 향해 쏴 보세요! 발밑을 쏘면 그 반동으로 몸이 떠오릅니다. 저 높은 턱은 그렇게 올라갑니다.',
     signSub:'펑! · 로켓점프'},

    {x:0, z:24, r:11, y:0.5, item:'power',
     text:'폭발의 위력과 반경이 커집니다. 같은 자리에서 쏘아도 상대가 훨씬 멀리 밀려납니다.',
     how:'먼저 그냥 한 발 쏘고, 아이템을 집은 뒤에 다시 쏴 보세요! 밀려나는 거리가 확 달라집니다.',
     signSub:'위력 강화'},

    {x:20.8, z:12, r:11, y:0.5, item:'drum',
     text:'탄창이 즉시 가득 차고, 재장전 속도가 3배 빨라집니다.',
     how:'멈추지 말고 연달아 쏴 보세요! 탄이 끊기지 않는 동안 얼마나 몰아붙일 수 있는지 느껴 보세요.',
     signSub:'탄창 보충'},

    /* 깃털만 구역이 넓다(18). 실습이 광장 밖 착지판까지 이어져서, 11 이면 뛰어드는
       도중에 설명판이 사라진다 — 하려던 것을 잊게 만드는 자리에서 안내를 끄면 안 된다.
       옆 부스와 겹치는 만큼은 '가장 가까운 구역' 규칙이 갈라 준다(tutorTick). */
    {x:20.8, z:-12, r:18, y:0.5, item:'feather',
     text:'더 멀리 날 수 있지만, 그만큼 상대에게 더 크게 밀려나기도 합니다. 공중에서 1초 동안 활공할 수 있습니다.',
     how:'도약대에서 문 밖으로 뛴 다음, 공중에서 <b>Space</b> 를 누르세요! 천천히 내려오는 동안 건너편 착지판까지 닿습니다.',
     signSub:'체공 · 활공'},

    {x:0, z:-24, r:11, y:0.5, item:'reverse',
     text:'폭발이 밀어내는 대신 상대를 <b>끌어당깁니다</b>. 가장자리 쪽으로 밀 수 없을 때 반대로 끌어와 떨어뜨립니다.',
     how:'허수아비의 <b>뒤쪽</b> 바닥을 쏴 보세요! 이쪽으로 끌려옵니다.',
     signSub:'끌어당기기'},

    {x:-20.8, z:-12, r:11, y:0.5, item:'anchor',
     text:'폭발에 밀려나지 않습니다. 대신 발밑을 쏘아 뛰어오르는 힘도 같이 약해집니다.',
     how:'먼저 맨몸으로 발밑을 쏘아 저 단 위에 올라가 보세요. 그다음 아이템을 집고 똑같이 해 보세요! 이번에는 오르지 못합니다.',
     signSub:'넉백 무효'},

    {x:-20.8, z:12, r:11, y:0.5, item:'pulse',
     text:'<b>F</b> 를 누르면 내 주위로 큰 폭발이 일어납니다. 몸에 붙은 상대를 한 번에 떼어낼 때 씁니다.',
     how:'허수아비에 바싹 붙은 다음 <b>F</b> 를 누르세요!',
     signSub:'F · 광역 폭발'}
  ],

  /* 아래 셋은 튜토리얼에서 쓰이지 않지만 있어야 한다.
     goal 은 render 가 결승 기둥을 그리려고 무조건 읽고(없으면 첫 프레임에 터진다),
     checkpoints 는 updateCheckpoint 가 훑는다. 결승선은 아무도 닿지 못하게 저 아래 둔다
     — 어차피 튜토리얼은 GAMEMODE 가 versus 라 승리 판정 자체가 돌지 않는다. */
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:0, y:0.4, z:0} ],
  killY: -25,
  start: {x:0, y:0.4, z:0}
});
