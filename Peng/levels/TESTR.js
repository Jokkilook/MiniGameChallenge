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
