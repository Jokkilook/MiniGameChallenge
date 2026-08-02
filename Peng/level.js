/* PENG! 공용 모듈 — 물리 상수 · 레벨 레지스트리 · 도달 가능성 계산
 *
 *   index.html(게임) 과 editor.html(에디터) 가 이 파일을 함께 쓴다.
 *   에디터가 "이 협곡을 넘을 수 있는가"를 게임과 똑같은 숫자로 판정하려면
 *   물리 상수의 출처가 하나여야 하기 때문이다. 상수를 고칠 일이 있으면 여기만 고친다.
 *
 *   ※ 고전 <script src> 로 로드된다(ES 모듈 아님). type="module" 로 바꾸면
 *     file:// 에서 CORS 로 차단돼 "index.html 더블클릭 = 솔로 플레이"가 깨진다.
 */
'use strict';
var PENG = window.PENG || (window.PENG = {});
PENG.levels = PENG.levels || {};   // id -> 레벨 데이터
PENG.order  = PENG.order  || [];   // 로드된 순서(선택 목록용). 첫 번째가 기본 맵.

/* ---------- 물리 상수 (게임·에디터 단일 출처) ---------- */
PENG.PHYS = {
  RUN:6.2, JUMPV:8.6, GRAV:22, EYE:1.6,
  PH_HX:0.35, PH_HY:0.9, PH_HZ:0.35,
  BLAST_R:4.2, BLAST_F:13.5, BLAST_RANGE:40,
  AMMO_MAX:3, AMMO_REGEN:1.1, PROJ_SPD:62, KB_TIME:0.45,
  // 조작 감각용 유예 시간. 둘 다 없으면 발판 끝에서 점프가 씹힌다.
  COYOTE:0.09,    // 발판을 벗어난 뒤에도 점프를 받아주는 시간(초)
  JUMP_BUF:0.12,  // 착지 직전에 누른 점프를 기억하는 시간(초)
  // 시야각 상하한(rad). 거의 수직(88.8°)까지 내려가야 발밑 자폭이 몸을 곧게 위로 민다.
  PITCH_LIM:1.55,
  // 근접 신관 반경(m). 광선이 팀원 몸에서 이 거리 안을 지나가면 거기서 폭발한다.
  FUSE_R:1.3
};

/* ---------- 레벨 등록 ---------- */
// 레벨 파일(levels/*.js)이 스스로를 등록한다. 잘못된 데이터는 콘솔에 알리고 건너뛴다.
PENG.defineLevel = function(id, data){
  var bad = PENG.validateLevel(data);
  if(bad){ console.error('[peng] 레벨 "'+id+'" 무시됨: '+bad); return; }
  if(!PENG.levels[id]) PENG.order.push(id);
  PENG.levels[id] = data;
};
PENG.getLevel = function(id){ return PENG.levels[id] || null; };
PENG.defaultLevel = function(){ return PENG.order[0] || null; };

// 최소 검증 — 없으면 게임이 조용히 이상해지는 필드만 본다.
PENG.validateLevel = function(d){
  if(!d || typeof d!=='object') return '객체가 아님';
  if(!d.boxes || !d.boxes.length) return 'boxes 가 비어 있음';
  for(var i=0;i<d.boxes.length;i++){ var b=d.boxes[i];
    var k=['cx','cy','cz','hx','hy','hz'];
    for(var j=0;j<k.length;j++) if(typeof b[k[j]]!=='number' || !isFinite(b[k[j]]))
      return 'boxes['+i+'].'+k[j]+' 가 숫자가 아님';
    if(b.hx<=0||b.hy<=0||b.hz<=0) return 'boxes['+i+'] 의 반경이 0 이하';
  }
  if(!d.goal || typeof d.goal.cx!=='number') return 'goal 이 없음';
  if(!d.checkpoints || !d.checkpoints.length) return 'checkpoints 가 비어 있음';
  if(typeof d.killY!=='number') return 'killY 가 없음';
  if(!d.start || typeof d.start.x!=='number') return 'start 가 없음';
  return null;
};

/* ---------- 도달 가능성 ----------
   레벨 디자인의 핵심 질문 "이 간격을 넘을 수 있는가"를 물리 상수에서 직접 계산한다.
   모델: 최고 수평속도(RUN)로 달리다 점프. 공중 조작 계수가 0.10 이라 체공 중
   수평속도는 거의 변하지 않으므로 수평 도달거리 ≈ RUN × 체공시간 으로 본다.
   따라서 결과는 "이상적으로 잘 탔을 때의 상한"이다 — 실제로는 약간 짧게 잡는 게 안전하다. */
PENG.reach = {
  // 초기 상승속도 v0 로 뛰어 높이차 dy 인 지점에 닿기까지의 체공시간(0 이면 도달 불가)
  airTime: function(v0, dy){
    var D = v0*v0 - 2*PENG.PHYS.GRAV*(dy||0);
    if(D < 0) return 0;                       // 그 높이까지 아예 못 올라감
    return (v0 + Math.sqrt(D)) / PENG.PHYS.GRAV;
  },
  apex: function(v0){ return v0*v0 / (2*PENG.PHYS.GRAV); },

  // 발밑 자폭 1회가 주는 상승 임펄스.
  // 폭발 중심은 발판 표면, 플레이어 중심은 발에서 PH_HY 위 → 그 거리만큼 감쇠한다.
  selfBlast: function(){ var P=PENG.PHYS; return P.BLAST_F * (1 - P.PH_HY/P.BLAST_R); },
  // 팀원이 d 미터 떨어진 곳에서 쏴 주는 보조 임펄스(기본 1.5m — 현실적인 근접 사격).
  teamBlast: function(d){ var P=PENG.PHYS; d=(d==null?1.5:d);
    return d>=P.BLAST_R ? 0 : P.BLAST_F * (1 - d/P.BLAST_R); },

  // 높이차 dy 를 오르면서 넘을 수 있는 최대 수평 간격
  jump:     function(dy){ var P=PENG.PHYS; return P.RUN * this.airTime(P.JUMPV, dy); },
  rocket:   function(dy){ var P=PENG.PHYS; return P.RUN * this.airTime(P.JUMPV + this.selfBlast(), dy); },
  assisted: function(dy, d){ var P=PENG.PHYS;
    return P.RUN * this.airTime(P.JUMPV + this.selfBlast() + this.teamBlast(d), dy); },

  /* 구간 난이도 분류 — 에디터가 협곡마다 이 라벨을 띄운다.
     'coop' = 혼자서는 불가능하고 팀원이 밀어줘야만 넘어가는 구간(= 2인 게임의 존재 이유). */
  classify: function(gap, dy, d){
    if(gap <= this.jump(dy))        return 'jump';
    if(gap <= this.rocket(dy))      return 'rocket';
    if(gap <= this.assisted(dy, d)) return 'coop';
    return 'impossible';
  }
};

/* 어느 발판 위의 지점인지 찾는다(체크포인트·결승이 어느 발판에 속하는지 판정용). */
PENG.platformAt = function(boxes, x, y, z){
  var best=null, bd=Infinity;
  for(var i=0;i<boxes.length;i++){ var b=boxes[i]; if(b.deco) continue;
    var dx=Math.max(0, Math.abs(x-b.cx)-b.hx);
    var dz=Math.max(0, Math.abs(z-b.cz)-b.hz);
    var dy=Math.abs(y-(b.cy+b.hy));
    var dd=dx*dx+dz*dz+dy*dy*0.5;
    if(dd<bd){ bd=dd; best=b; }
  }
  return best;
};
/* 두 발판(축 정렬) 사이의 실제 협곡. 진행 방향으로 각 박스의 반경을 투영해서 뺀다 —
   z 차이만 쓰면 좌우로 꺾이는 코스에서 값이 틀린다. */
function gapBetween(a, b){
  var dx=b.cx-a.cx, dz=b.cz-a.cz, L=Math.hypot(dx,dz);
  if(L<1e-6) return -1;
  var ux=dx/L, uz=dz/L;
  var ra=Math.abs(ux)*a.hx+Math.abs(uz)*a.hz;
  var rb=Math.abs(ux)*b.hx+Math.abs(uz)*b.hz;
  return L-ra-rb;
}
/* 코스의 구간별 난이도 분석.
   경로는 "체크포인트 순서 → 결승"으로 잡는다. 예전처럼 z 좌표로 정렬하면
   좌우로 꺾이는 코스에서 엉뚱한 발판끼리 짝지어진다. 체크포인트가 없으면 z 정렬로 폴백. */
PENG.levelRoute = function(d){
  var pf = d.boxes.filter(function(b){ return !b.deco; });
  if(!pf.length) return [];
  var route=[];
  if(d.checkpoints && d.checkpoints.length){
    for(var i=0;i<d.checkpoints.length;i++){ var c=d.checkpoints[i];
      var p=PENG.platformAt(pf, c.x, c.y, c.z); if(p && route[route.length-1]!==p) route.push(p); }
    // 결승 발판을 경로 끝에 붙인다. 단 이미 경로 안에 있으면 붙이지 않는다 —
    // 결승이 아직 코스 중간(또는 시작점)에 있을 때 되돌아가는 가짜 구간이 생기기 때문.
    if(d.goal){ var g=PENG.platformAt(pf, d.goal.cx, d.goal.cy-0.5, d.goal.cz);
      if(g && route.indexOf(g)<0) route.push(g); }
  }
  if(route.length<2) route = pf.slice().sort(function(a,b){ return a.cz-b.cz; });
  return route;
};
/* 결승이 코스 끝에 있는지. 아니면 마지막 발판까지 갔는데 끝나지 않는 맵이 된다. */
PENG.goalAtEnd = function(d){
  var route=PENG.levelRoute(d); if(route.length<2 || !d.goal) return true;
  var pf=d.boxes.filter(function(b){ return !b.deco; });
  var g=PENG.platformAt(pf, d.goal.cx, d.goal.cy-0.5, d.goal.cz);
  return g === route[route.length-1];
};
PENG.analyzeLevel = function(d){
  var route=PENG.levelRoute(d), out=[];
  for(var i=0;i<route.length-1;i++){
    var a=route[i], b=route[i+1];
    var gap=gapBetween(a,b), dy=(b.cy+b.hy)-(a.cy+a.hy);
    out.push({ from:i, to:i+1, gap:Math.round(gap*100)/100, dy:Math.round(dy*100)/100,
               a:a, b:b, kind: gap<=0 ? 'touch' : PENG.reach.classify(gap, dy) });
  }
  return out;
};
/* 난이도를 지정하면 그 구간이 되도록 다음 발판을 놓을 거리를 돌려준다.
   "채점기"를 "창작 도구"로 뒤집는 부분 — 협동 전용 구간을 손으로 계산하지 않아도 된다. */
PENG.gapFor = function(kind, dy){
  var R=PENG.reach, lo, hi;
  if(kind==='jump'){ lo=0; hi=R.jump(dy); }
  else if(kind==='rocket'){ lo=R.jump(dy); hi=R.rocket(dy); }
  else { lo=R.rocket(dy); hi=R.assisted(dy); }     // coop
  if(hi<=0) return null;                            // 그 높이는 이 방식으론 불가능
  if(lo<=0) lo=0;
  return Math.round((lo + (hi-lo)*0.62)*10)/10;     // 한계에 너무 붙지 않게 살짝 안쪽
};

/* ---------- 프롭(배치 요소) ----------
   게임 렌더러는 축 정렬 박스만 그린다. 그래서 나무·바위·풀도 박스 조합으로 만든다.
   덕분에 게임 쪽은 아무것도 고칠 게 없고, 로우폴리 블록 아트와도 그대로 맞는다.
   deco:true 인 박스는 시각 전용이라 충돌하지 않는다(index.html 의 moveAxis 참조). */
PENG.PROPS = [
  { id:'platform', name:'발판', deco:false, tag:'코스',
    icon:'<rect x="2" y="9" width="20" height="6" rx="1" fill="#5a7bb0"/>',
    build:function(){ return [{cx:0,cy:-0.5,cz:0,hx:3,hy:0.5,hz:3,col:'#5a7bb0'}]; } },
  { id:'platform_hard', name:'발판(주황)', deco:false, tag:'코스',
    icon:'<rect x="2" y="9" width="20" height="6" rx="1" fill="#c07b5a"/>',
    build:function(){ return [{cx:0,cy:-0.5,cz:0,hx:3,hy:0.5,hz:3,col:'#c07b5a'}]; } },
  { id:'goalpad', name:'결승 발판', deco:false, tag:'코스',
    icon:'<rect x="1" y="9" width="22" height="6" rx="1" fill="#3aa860"/><rect x="10" y="3" width="4" height="6" fill="#6bffa0"/>',
    build:function(){ return [{cx:0,cy:-0.5,cz:0,hx:3.4,hy:0.5,hz:3.4,col:'#3aa860'}]; } },
  { id:'crate', name:'상자', deco:false, tag:'코스',
    icon:'<rect x="6" y="6" width="12" height="12" rx="1" fill="#8a6a45"/><path d="M6 12h12M12 6v12" stroke="#5e4830" stroke-width="1.4"/>',
    build:function(){ return [{cx:0,cy:0.8,cz:0,hx:0.8,hy:0.8,hz:0.8,col:'#8a6a45'}]; } },

  { id:'tree', name:'나무', deco:true, tag:'장식',
    icon:'<rect x="10.5" y="13" width="3" height="8" fill="#5a4632"/><path d="M12 2l6 8H6zM12 7l5 7H7z" fill="#3f7a46"/>',
    build:function(){ return [
      {cx:0,cy:1.1,cz:0, hx:0.22,hy:1.1, hz:0.22, col:'#5a4632'},
      {cx:0,cy:2.5,cz:0, hx:1.3, hy:0.62,hz:1.3,  col:'#3f7a46'},
      {cx:0,cy:3.4,cz:0, hx:0.9, hy:0.5, hz:0.9,  col:'#4a8c52'},
      {cx:0,cy:4.1,cz:0, hx:0.48,hy:0.38,hz:0.48, col:'#56a05e'} ]; } },
  { id:'pine', name:'침엽수', deco:true, tag:'장식',
    icon:'<rect x="10.5" y="15" width="3" height="6" fill="#4d3d2b"/><path d="M12 2l5 6H7zM12 7l6 7H6z" fill="#2f6b46"/>',
    build:function(){ return [
      {cx:0,cy:0.9,cz:0, hx:0.2, hy:0.9, hz:0.2,  col:'#4d3d2b'},
      {cx:0,cy:2.2,cz:0, hx:1.15,hy:0.5, hz:1.15, col:'#2f6b46'},
      {cx:0,cy:3.1,cz:0, hx:0.85,hy:0.45,hz:0.85, col:'#37794f'},
      {cx:0,cy:3.9,cz:0, hx:0.55,hy:0.4, hz:0.55, col:'#3f8a58'},
      {cx:0,cy:4.5,cz:0, hx:0.26,hy:0.3, hz:0.26, col:'#489a62'} ]; } },
  { id:'rock', name:'바위', deco:true, tag:'장식',
    icon:'<path d="M3 18l4-9 6-3 8 5-2 7z" fill="#6b7280"/><path d="M7 9l6 4 8-2" stroke="#8d96a5" stroke-width="1.2" fill="none"/>',
    build:function(){ return [
      {cx:0,    cy:0.5, cz:0,    hx:0.9, hy:0.5, hz:0.75, col:'#6b7280'},
      {cx:0.52, cy:0.78,cz:-0.3, hx:0.5, hy:0.35,hz:0.45, col:'#7c8593'},
      {cx:-0.44,cy:0.68,cz:0.34, hx:0.4, hy:0.28,hz:0.35, col:'#5d6470'} ]; } },
  { id:'grass', name:'풀', deco:true, tag:'장식',
    icon:'<path d="M6 21c1-6 2-8 3-11M12 21c0-7 1-9 2-12M18 21c-1-6-2-8-3-10" stroke="#4e9455" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
    build:function(){ return [
      {cx:0,    cy:0.34,cz:0,    hx:0.06,hy:0.34,hz:0.3,  col:'#4e9455'},
      {cx:0.24, cy:0.27,cz:0.12, hx:0.05,hy:0.27,hz:0.24, col:'#5aa862'},
      {cx:-0.2, cy:0.3, cz:-0.14,hx:0.05,hy:0.3, hz:0.22, col:'#458a4c'} ]; } },
  { id:'pillar', name:'기둥', deco:true, tag:'장식',
    icon:'<rect x="9" y="2" width="6" height="20" fill="#46557a"/>',
    build:function(){ return [{cx:0,cy:4,cz:0,hx:1,hy:4,hz:1,col:'#46557a'}]; } },
  { id:'floor', name:'먼 바닥', deco:true, tag:'장식',
    icon:'<rect x="1" y="11" width="22" height="4" fill="#20304a"/>',
    build:function(){ return [{cx:0,cy:-24.5,cz:0,hx:60,hy:1,hz:120,col:'#20304a'}]; } }
];
PENG.propById = function(id){
  for(var i=0;i<PENG.PROPS.length;i++) if(PENG.PROPS[i].id===id) return PENG.PROPS[i];
  return null;
};
/* 프롭을 (x,y,z) 에 놓아 박스 배열로 편다. 여러 박스짜리는 같은 그룹 id 를 달아
   에디터에서 하나처럼 선택·이동·삭제된다(게임은 g 필드를 무시한다). */
PENG.placeProp = function(id, x, y, z, gid){
  var p=PENG.propById(id); if(!p) return [];
  var parts=p.build(), out=[];
  for(var i=0;i<parts.length;i++){
    var b=parts[i];
    var nb={cx:x+b.cx, cy:y+b.cy, cz:z+b.cz, hx:b.hx, hy:b.hy, hz:b.hz, col:b.col};
    if(p.deco) nb.deco=true;
    if(parts.length>1 && gid) nb.g=gid;
    out.push(nb);
  }
  return out;
};

/* ---------- 직렬화 (에디터 저장용) ----------
   editor.html 이 편집 결과를 levels/<id>.js 파일 내용으로 뽑아낼 때 쓴다.
   출력은 손으로 읽고 고칠 수 있는 형태를 유지한다. */
PENG.serialize = function(id, d){
  function n(v){ return (Math.round(v*1000)/1000).toString(); }
  function bx(b){
    var s = '    {cx:'+n(b.cx)+', cy:'+n(b.cy)+', cz:'+n(b.cz)+
            ', hx:'+n(b.hx)+', hy:'+n(b.hy)+', hz:'+n(b.hz)+
            ", col:'"+(b.col||'#5a7bb0')+"'";
    if(b.deco) s += ', deco:true';
    if(b.g) s += ", g:'"+String(b.g).replace(/'/g,"\\'")+"'";   // 에디터 그룹(게임은 무시)
    s += '}';
    return s + (b.note ? '  // '+b.note : '');
  }
  var L=[];
  L.push('/* PENG! 레벨 — editor.html 에서 생성. 손으로 고쳐도 된다.');
  L.push('   <script src="levels/'+id+'.js"></script> 로 index.html 에 추가하면 목록에 뜬다. */');
  L.push("PENG.defineLevel('"+id+"', {");
  L.push("  name: '"+String(d.name||id).replace(/'/g,"\\'")+"',");
  L.push('  boxes: [');
  L.push(d.boxes.map(bx).join(',\n'));
  L.push('  ],');
  L.push('  goal: {cx:'+n(d.goal.cx)+', cy:'+n(d.goal.cy)+', cz:'+n(d.goal.cz)+', r:'+n(d.goal.r)+'},');
  L.push('  checkpoints: [');
  L.push(d.checkpoints.map(function(c){ return '    {x:'+n(c.x)+', y:'+n(c.y)+', z:'+n(c.z)+'}'; }).join(',\n'));
  L.push('  ],');
  L.push('  killY: '+n(d.killY)+', start: {x:'+n(d.start.x)+', y:'+n(d.start.y)+', z:'+n(d.start.z)+'}'+
         ((d.hints&&d.hints.length)?',':''));
  if(d.hints && d.hints.length){
    L.push('  // 체크포인트 번호별 화면 힌트(<b> 강조 가능). 마지막 항목은 이후 구간까지 유지된다.');
    L.push('  hints: [');
    L.push(d.hints.map(function(h){ return "    '"+String(h).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'"; }).join(',\n'));
    L.push('  ]');
  }
  L.push('});');
  return L.join('\n') + '\n';
};
