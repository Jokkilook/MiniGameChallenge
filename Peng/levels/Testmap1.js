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
