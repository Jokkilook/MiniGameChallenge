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
