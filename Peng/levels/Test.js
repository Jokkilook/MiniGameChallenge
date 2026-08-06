/* PENG! 레벨 — kiteditor.html 에서 만듦. 손으로 고쳐도 된다.
   pieces 의 좌표는 '킷유닛'이고 월드 미터 = 유닛 * unit 이다. */
PENG.defineLevel('Test', {
  name: 'aaa',
  unit: 3,
  boxes: [
    // 저 아래 배경 바닥(deco = 밟히지 않는다). 발판은 전부 pieces 다
    {cx:0, cy:-72, cz:0, hx:220, hy:1, hz:220, col:'#2b3a2c', deco:true}
  ],
  pieces: [
    {t:'survival/rock-flat', i:-0.194, j:0.017, y:-0.642, sx:5.087, sy:5.087, sz:5.087}
  ],
  arena: true,
  goal: {cx:0, cy:-999, cz:0, r:0.1},
  checkpoints: [ {x:2.398, y:1.05, z:1.038} ],
  killY: -30,
  start: {x:2.398, y:1.05, z:1.038},
  spawns: [ {x:2.398, y:1.05, z:1.038} ],
  pads: [ {x:-6.427, y:1.05, z:-2.017} ]
});
