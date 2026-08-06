/* 자동 생성 파일 — 직접 고치지 마세요.
   levels/ 안의 레벨 파일들을 server.js 가 이어붙인 것입니다.
   맵을 고치려면 levels/<이름>.js 를 고치거나 editor.html 을 쓰세요. */

/* ---------- levels/Testmap1.js ---------- */
/* PENG! 레벨 — editor.html 에서 생성. 손으로 고쳐도 된다.
   <script src="levels/Testmap1.js"></script> 로 index.html 에 추가하면 목록에 뜬다. */
PENG.defineLevel('Testmap1', {
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
PENG.defineLevel('arena', {
  name: '우주 정거장 (경쟁)',
  arena: true,
  collapse: {
    /* 판을 Kenney Space Station Kit 조각으로 조립한다(PENG.genStation).
       예전의 '원판을 깔고 파내는' 방식과 달리 코어 → 복도 → 포드 순으로 붙여
       허브+스포크 실루엣이 나온다. 라운드마다 시드가 바뀐다.
       size 는 킷 1칸의 미터 크기(index.html 의 STATION.unit 과 맞춰야 한다). */
    gen: 'station',
    /* 킷 1칸의 미터 크기. 문 구멍이 0.65유닛이라 2.6 이면 1.69m 로 플레이어(1.8m)가
       못 지나간다 — 2.95 로 잡아야 1.92m 가 되어 문이 실제로 통로가 된다. */
    size: 2.95,
    y: -0.5, hy: 0.5,
    col: '#5a7bb0', warnCol: '#e0713a',
    first: 16,                       // 첫 분리까지(초)
    every: 4.2,                      // 모듈 한 겹이 떨어져 나가는 간격(초)
    warn: 1.5,                       // 분리 전 깜빡이는 예고(초)
    keepRings: 1                     // 코어(order 0)는 안 떨어진다
  },
  boxes: [
    // 저 아래 장식 바닥 — 떨어졌다는 게 확실히 보이게. 발판은 전부 생성기가 만든다
    {cx:0, cy:-40, cz:0, hx:90, hy:1, hz:90, col:'#161f33', deco:true}
  ],
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:0, y:0, z:0} ],
  killY: -16,
  /* start·spawns·pads 는 생성기가 매 라운드 덮어쓴다. 여기 값은 형식상의 기본값. */
  start: {x:0, y:0, z:-10.4},
  spawns: [ {x:0,y:0,z:-10.4}, {x:0,y:0,z:10.4}, {x:-10.4,y:0,z:0}, {x:10.4,y:0,z:0} ],
  pads: [ {x:0, y:0, z:0} ],
  hints: [ '상대를 <b>펑건으로 밀어</b> 정거장 밖으로! 바깥 모듈부터 분리됩니다.' ]
});


/* ---------- levels/canyon.js ---------- */
/* PENG! 레벨 — 협곡 (기본 코스)
   기존 index.html 에 하드코딩돼 있던 코스를 그대로 옮긴 것. 좌표·색 모두 동일하다.

   코스 구성 — 발판 반경 3m 이므로 두 발판 사이 실제 협곡 = (거리 - 6)m.
   일반 점프로 넘는 한계가 약 4.85m 라, 4m 는 점프 / 6m 이상 또는 상승은 로켓점프.
   난이도: 점프 → 로켓점프 입문 → 상승 → 연속 구간 → 마지막 큰 도약

   ※ deco:true 는 에디터의 협곡 분석에서 제외하라는 표시일 뿐이다.
     게임 물리는 예전과 똑같이 모든 박스와 충돌한다(장식 기둥도 밟힌다). */
PENG.defineLevel('canyon', {
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
    '앞으로 달려 <b>Space</b>로 협곡을 건너요',
    '이번 협곡은 넓어요! <b>점프 후 발밑을 좌클릭</b>해 로켓점프!',
    '위로! <b>점프 + 발밑 펑!</b>으로 높은 발판을 오르세요',
    '짧은 협곡 — 이건 그냥 점프로',
    '다시 위로! 로켓점프로 올라가요',
    '마지막! <b>크게 로켓점프</b>해서 초록 결승대로'
  ]
});


/* ---------- levels/duo.js ---------- */
/* PENG! 레벨 — 2인 시험장 (템플릿)
   완성된 코스가 아니라, "협동 강제 구간"이 실제로 어떤 숫자인지 보여주는 최소 예시다.
   맵 동기화 테스트용으로도 쓴다(맵이 하나뿐이면 동기화가 깨져도 티가 안 난다).

   가운데 협곡 13m 는 의도적으로 아래 구간에 놓았다:
       일반 점프  4.85m  ✗
       로켓점프  10.83m  ✗   ← 혼자서는 어떻게 해도 못 넘는다
       팀원 보조 15.72m  ✓   ← 팀원이 밀어줘야만 넘어간다
   editor.html 에서 이 협곡이 'coop' 으로 표시되는지 확인하는 기준점으로 쓰면 된다. */
PENG.defineLevel('duo', {
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
    '이 협곡은 <b>혼자서는 못 넘습니다</b> — 팀원이 내 발밑을 쏴 밀어줘야 해요',
    '마지막! 짧은 협곡이니 <b>Space</b>로 건너요'
  ]
});


/* ---------- levels/peak.js ---------- */
/* PENG! 레벨 — 피크 (절벽 위의 평지)
   Kenney Survival Kit(CC0) 로 만든 두 번째 경쟁 아레나. 우주 정거장이 '실내 통로'라면
   여기는 '탁 트인 벼랑 끝'이다 — 벽이 거의 없어 밀려나면 바로 허공이고, 엄폐물은
   뛰어넘을 수 있는 바위·울타리뿐이라 서로 붙어서 싸우게 된다.

   지형은 PENG.genPeak 이 시드로 만든다(라운드마다 새 봉우리). 판 자체는 여기 없고
   collapse 스펙만 있다 — 자세한 규칙은 level.js 의 genPeak 주석 참고. */
PENG.defineLevel('peak', {
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
    /* 고리가 6겹(0~5)뿐이라 정거장(10겹)보다 간격을 넉넉히 줘야 한 판이 짧지 않다.
       18 + 4*6.5 = 44초에 정상만 남고, 5초 뒤 새 봉우리가 선다. */
    first: 18,                       // 첫 붕괴까지(초)
    every: 6.5,                      // 고리 한 겹이 무너지는 간격(초)
    warn: 1.5,                       // 무너지기 전 깜빡이는 예고(초)
    keepRings: 2                     // 정상(고리 0~1)은 끝까지 남는다
  },
  boxes: [
    /* 저 아래 골짜기 바닥. 판에서 유일한 상자인데, 발판이 아니라 '떨어졌다'를
       보여 주는 배경이다(deco = 밟히지 않는다). 산체 밑동(-66m)보다 아래에 둬
       산이 바닥에 박혀 보이게 한다 — 안 그러면 산 밑으로 하늘이 비친다. */
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#2b3a2c', deco:true}
  ],
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:0, y:0, z:0} ],
  killY: -30,
  /* start·spawns·pads 는 생성기가 매 라운드 덮어쓴다. 여기 값은 형식상의 기본값. */
  start: {x:11, y:1.35, z:11},
  spawns: [ {x:11,y:1.35,z:11}, {x:11,y:1.35,z:-11}, {x:-11,y:1.35,z:-11}, {x:-11,y:1.35,z:11} ],
  pads: [ {x:0, y:1.35, z:0} ],
  hints: [ '상대를 <b>펑건으로 밀어</b> 절벽 아래로! 바깥쪽 땅부터 무너져 내립니다.' ]
});


/* ---------- levels/spire.js ---------- */
/* PENG! 레벨 — editor.html 에서 생성. 손으로 고쳐도 된다.
   <script src="levels/spire.js"></script> 로 index.html 에 추가하면 목록에 뜬다. */
PENG.defineLevel('spire', {
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
    '탑 꼭대기까지 올라가세요. <b>Space + 발밑 좌클릭</b>으로 로켓점프!',
    '',
    '',
    '',
    '<b>협동 관문</b> — 혼자서는 못 오릅니다. 팀원이 <b>뛰는 순간 몸을 직격</b>하면 위로 띄웁니다. 위에서 도울 때는 <b>발판 가장자리</b>로 나오세요 — 안쪽에서 쏘면 자기 발판에 막힙니다.',
    '먼저 오른 사람은 <b>발판 가장자리</b>에서 아래 팀원을 직격해 끌어올리세요.',
    '',
    '',
    '',
    '',
    '<b>압력판 다리</b> — 한 명이 노란 판을 밟고 있어야 청록 다리가 생깁니다.',
    '',
    '건너간 사람은 <b>위쪽 판</b>을 밟아 아래 팀원에게 다리를 되돌려 주세요.',
    '',
    '',
    '<b>압력판 다리</b> — 한 명이 노란 판을 밟고 있어야 청록 다리가 생깁니다.',
    '',
    '건너간 사람은 <b>위쪽 판</b>을 밟아 아래 팀원에게 다리를 되돌려 주세요.',
    '',
    '',
    '',
    '<b>협동 관문</b> — 혼자서는 못 오릅니다. 팀원이 <b>뛰는 순간 몸을 직격</b>하면 위로 띄웁니다. 위에서 도울 때는 <b>발판 가장자리</b>로 나오세요 — 안쪽에서 쏘면 자기 발판에 막힙니다.',
    '먼저 오른 사람은 <b>발판 가장자리</b>에서 아래 팀원을 직격해 끌어올리세요.',
    '',
    '',
    '<b>압력판 다리</b> — 한 명이 노란 판을 밟고 있어야 청록 다리가 생깁니다.',
    '',
    '건너간 사람은 <b>위쪽 판</b>을 밟아 아래 팀원에게 다리를 되돌려 주세요.',
    '',
    '',
    '',
    '<b>마지막 협동 관문</b> — 결승까지 14m, 혼자서는 못 오릅니다. 한 명을 먼저 올린 뒤 그 사람이 <b>가장자리에서 아래를 직격</b>해 나머지를 끌어올리세요.'
  ]
});
