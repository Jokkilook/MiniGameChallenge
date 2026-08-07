PENG.defineLevel('arena', {
  name: '우주 정거장 (경쟁)',
  arena: true,
  space: true,          // 배경을 검은 우주 + 흰 별로
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
  hints: [ '<b>펑건으로 밀어</b> 정거장 밖으로 · 바깥 모듈부터 떨어져 나간다' ]
});
