/* 맵 평면도 — `node tools/maplook.js <레벨id>` (없으면 경쟁 맵 전부)

   맵을 고친 뒤 "의도한 모양이 나왔나"를 확인하는 데 게임을 띄우는 것은 느리고,
   무엇보다 층이 겹친 판은 1인칭으로 보면 위층에 가려 아래층이 안 보인다.
   층마다 따로 위에서 내려다본 그림을 찍는다.

   기호
     #  걸을 수 있는 발판(조각)      =  상자 발판
     ~  컨베이어(밟으면 밀린다)      ^  점프대
     M  움직이는 발판(왕복 범위)     O  점멸 발판
     S  스폰      P  아이템 패드     ·  그 층에 아무것도 없음 */
'use strict';
var path=require('path');
global.window = global;
require(path.join(__dirname,'..','level.js'));
var fs=require('fs');
/* levels/*.js 를 직접 읽는다. _all.js 는 server.js 가 구워 두는 사본이라, 레벨을
   고친 뒤 서버를 다시 띄우기 전에는 옛날 것이 들어 있다 — 그걸 읽는 바람에
   방금 고친 맵이 그대로 보이는 일을 한 번 겪었다. 원본이 진실이다. */
var errs=[]; var realErr=console.error; console.error=function(m){ errs.push(m); };
var dir=path.join(__dirname,'..','levels');
fs.readdirSync(dir).filter(function(f){ return /\.js$/.test(f) && f!=='_all.js'; })
  .forEach(function(f){ eval(fs.readFileSync(path.join(dir,f),'utf8')); });
console.error=realErr;
if(errs.length){ errs.forEach(function(e){ realErr(e); }); }

var want = process.argv[2];
var ids = PUNG.order.filter(function(id){
  var d=PUNG.levels[id]; return d && d.arena && (!want || id===want);
});
if(!ids.length){ console.log('그릴 맵이 없습니다. 아는 맵: '+PUNG.order.join(', ')); process.exit(1); }

var W = 61;                                  // 그림 가로 칸 수(홀수여야 가운데가 정확히 중앙)

function draw(id){
  var d = PUNG.levels[id], u = d.unit || 1;
  console.log('\n' + '='.repeat(72));
  console.log('  ' + (d.name || id) + '   [' + id + ']');

  /* 발판을 (층, x, z, 종류) 목록으로 모은다. 조각은 킷유닛이라 미터로 바꾼다. */
  var items = [], R = 0;
  (d.pieces||[]).forEach(function(p){
    if(p.deco) return;
    var x=(p.i||0)*u, z=(p.j||0)*u, y=(p.y||0)*u;
    items.push({x:x, z:z, y:y, c:'#', hx:u, hz:u});
    R=Math.max(R, Math.abs(x)+u, Math.abs(z)+u);
  });
  (d.boxes||[]).forEach(function(b){
    if(b.deco && !b.phase) return;             // 배경 바닥은 뺀다(점멸은 꺼진 상태로 적혀 있을 수 있다)
    if(Math.abs(b.cy) > 500) return;
    var c = b.belt ? '~' : b.boost ? '^' : b.move ? 'M' : b.phase ? 'O' : '=';
    var hx=b.hx, hz=b.hz, x=b.cx, z=b.cz, y=b.cy+b.hy;
    // 움직이는 발판은 '왕복하는 범위 전체'를 칠한다 — 어디까지 가는지가 설계의 핵심이다
    if(b.move){
      var a=b.move.amp||0;
      if(b.move.ax==='x') hx+=a; else if(b.move.ax==='z') hz+=a;
    }
    items.push({x:x, z:z, y:y, c:c, hx:hx, hz:hz});
    R=Math.max(R, Math.abs(x)+hx, Math.abs(z)+hz);
  });
  if(!items.length){ console.log('  (런타임 생성기가 만드는 맵 — 데이터에 발판이 없습니다)'); return; }
  R = Math.ceil(R)+1;

  // 층 나누기 — 0.6m 안쪽이면 같은 층으로 본다
  var ys = items.map(function(t){ return t.y; }).sort(function(a,b){ return a-b; });
  var tiers=[];
  ys.forEach(function(y){
    for(var i=0;i<tiers.length;i++) if(Math.abs(tiers[i].y-y)<0.6){ tiers[i].n++; return; }
    tiers.push({y:y, n:1});
  });
  tiers.sort(function(a,b){ return b.y-a.y; });                 // 높은 층부터
  tiers = tiers.filter(function(t){ return t.n>=3; });          // 조각 몇 개짜리 잡동사니는 뺀다

  /* 조각은 '원점' 높이로 묶는다 — 윗면이 어디인지는 메시를 봐야 알 수 있고 여기엔
     메시가 없다. 그래서 층 숫자는 상자만 정확하고 조각은 원점이다(바위 슬래브처럼
     원점이 윗면보다 한참 아래인 조각은 숫자가 그만큼 낮게 나온다).
     이 그림의 쓸모는 '어디에 무엇이 있나' 이지 '몇 미터인가' 가 아니다. */
  console.log('  판 지름 ' + (R*2).toFixed(1) + 'm · 층(조각은 원점 기준) ' +
    tiers.map(function(t){ return t.y.toFixed(1)+'m'; }).reverse().join(' / '));
  console.log('  1칸 = ' + (2*R/W).toFixed(1) + 'm');

  tiers.forEach(function(tier){
    var g=[], r, cIdx;
    for(r=0;r<Math.round(W/2);r++) g.push(new Array(W).fill('·'));
    var rows=g.length;
    function cell(x,z){                                        // 월드 → 칸
      return [ Math.round((x+R)/(2*R)*(W-1)), Math.round((z+R)/(2*R)*(rows-1)) ];
    }
    var PRIO={'·':0,'#':1,'=':2,'O':3,'M':4,'^':5,'~':6};
    function mark(x,z,ch){
      var q=cell(x,z), i=q[0], k=q[1];
      if(i<0||k<0||i>=W||k>=rows) return;
      if(PRIO[ch] >= PRIO[g[k][i]]) g[k][i]=ch;
    }
    items.forEach(function(t){
      if(Math.abs(t.y-tier.y)>=0.6) return;
      for(var x=t.x-t.hx; x<=t.x+t.hx; x+=(2*R/W)*0.5)
        for(var z=t.z-t.hz; z<=t.z+t.hz; z+=(2*R/rows)*0.5) mark(x,z,t.c);
    });
    // 스폰·패드는 그 층 높이에 있는 것만
    (d.spawns||[]).forEach(function(s){ if(Math.abs((s.y||0)-tier.y)<1.5) mark(s.x,s.z,'S'); });
    (d.pads||[]).forEach(function(p){ if(Math.abs((p.y||0)-tier.y)<1.5) mark(p.x,p.z,'P'); });

    var kinds={};
    items.forEach(function(t){ if(Math.abs(t.y-tier.y)<0.6) kinds[t.c]=(kinds[t.c]||0)+1; });
    var tag=Object.keys(kinds).map(function(k){ return k+'×'+kinds[k]; }).join(' ');
    console.log('\n  ── ' + tier.y.toFixed(1) + 'm ' + '─'.repeat(28) + '  ' + tag);
    g.forEach(function(row){ console.log('    ' + row.join('')); });
  });
}
ids.forEach(draw);
console.log('');
