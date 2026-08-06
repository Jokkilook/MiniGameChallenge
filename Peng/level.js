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
  /* 발밑을 "먼저 쏜" 뒤에 누른 점프를 받아주는 시간(초).
     폭발은 맞은 사람의 지면 접촉을 지운다(onGround=false, coyote=0). 그래서 로켓점프를
     점프→사격 순서로 하면 8.0m 오르지만, 사격→점프 순서로 하면 점프가 통째로 씹혀
     2.5m 밖에 못 올랐다 — 간격을 아무리 좁혀도 마찬가지였다(입력 순서가 곧 실력이 됨).
     점프에는 선입력 버퍼(JUMP_BUF)가 있는데 사격에는 대응물이 없어 생긴 비대칭이다. */
  BLAST_JUMP_GRACE:0.22,
  // 시야각 상하한(rad). 거의 수직(88.8°)까지 내려가야 발밑 자폭이 몸을 곧게 위로 민다.
  PITCH_LIM:1.55,
  // 근접 신관 반경(m). 광선이 팀원 몸에서 이 거리 안을 지나가면 거기서 폭발한다.
  FUSE_R:1.3,
  /* 리프트 샷 — 팀원을 근접 신관 안으로 "직격"했을 때 주는 순수 상승 속도(m/s).
     폭발은 원래 방사형(중심 → 몸)이라 위에서 쏘면 팀원이 아래로 밀린다. 그래서
     도움이 "발밑을 받쳐 쏘기" 한 방향뿐이었고, 협동 전용 구간은 한 명만 넘고
     나머지 한 명은 영영 못 넘는 편도 구조였다. 직격만 위로 미는 규칙으로 바꿔
     양방향(위에서 아래로도)으로 끌어올릴 수 있게 한다.
     거리 감쇠를 두지 않는 이유: 레벨 설계가 "팀원이 얼마나 가까이서 쐈나"에
     흔들리면 아래 도달 분석을 믿을 수 없게 된다. */
  LIFT_V:9.0
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
  // 직격이 아닌 "근처 폭발"은 지금도 방사형이라 이 값이 그대로 쓰인다.
  teamBlast: function(d){ var P=PENG.PHYS; d=(d==null?1.5:d);
    return d>=P.BLAST_R ? 0 : P.BLAST_F * (1 - d/P.BLAST_R); },

  // 높이차 dy 를 오르면서 넘을 수 있는 최대 수평 간격
  jump:     function(dy){ var P=PENG.PHYS; return P.RUN * this.airTime(P.JUMPV, dy); },
  rocket:   function(dy){ var P=PENG.PHYS; return P.RUN * this.airTime(P.JUMPV + this.selfBlast(), dy); },
  // 팀원이 리프트 샷으로 직격해 준 경우. 거리와 무관한 고정 상승이라 설계값이 흔들리지 않는다.
  assisted: function(dy){ var P=PENG.PHYS;
    return P.RUN * this.airTime(P.JUMPV + this.selfBlast() + P.LIFT_V, dy); },

  /* 구간 난이도 분류 — 에디터가 협곡마다 이 라벨을 띄운다.
     'coop' = 혼자서는 불가능하고 팀원이 밀어줘야만 넘어가는 구간(= 2인 게임의 존재 이유). */
  /* 각 방식의 도달거리는 "그 높이에 아예 못 닿으면 0"이다. 그래서 0 과 비교하기 전에
     0 보다 큰지를 먼저 본다 — 안 그러면 협곡이 없는(겹친) 구간이 전부 '점프'로 통과된다.
     겹친 발판(gap<=0)은 수평 제약이 없으므로 남는 제약은 높이뿐이다. */
  classify: function(gap, dy){
    var g = gap>0 ? gap : 0;
    var j=this.jump(dy);     if(j>0 && g<=j) return 'jump';
    var r=this.rocket(dy);   if(r>0 && g<=r) return 'rocket';
    var a=this.assisted(dy); if(a>0 && g<=a) return 'coop';
    return 'impossible';
  },

  /* 수직 설계용 한계. 수평 이동이 0일 때 한 번에 오를 수 있는 최대 높이다.
     탑처럼 위로 쌓는 코스에서는 협곡 길이가 아니라 이 값이 난이도를 정한다 —
     턱이 soloRise 를 넘으면 판정에 기대지 않고 물리적으로 혼자서는 불가능해진다. */
  soloRise: function(){ var P=PENG.PHYS; return this.apex(P.JUMPV + this.selfBlast()); },
  coopRise: function(){ var P=PENG.PHYS; return this.apex(P.JUMPV + this.selfBlast() + P.LIFT_V); }
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
/* 경로 후보가 되는 발판. 장식뿐 아니라 압력판도 뺀다 — 압력판은 밟는 물건이지
   도착지가 아니라서, 경로에 끼면 협곡이 엉뚱한 지점에서 쪼개진다. */
PENG.isPlatform = function(b){ return !b.deco && !b.plate; };
PENG.levelRoute = function(d){
  var pf = d.boxes.filter(PENG.isPlatform);
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
  var pf=d.boxes.filter(PENG.isPlatform);
  var g=PENG.platformAt(pf, d.goal.cx, d.goal.cy-0.5, d.goal.cz);
  return g === route[route.length-1];
};
PENG.analyzeLevel = function(d){
  var route=PENG.levelRoute(d), out=[];
  // 어떤 채널에 압력판이 실제로 존재하는지 — 스위치 없는 다리는 영영 안 열린다.
  var plates={};
  for(var k=0;k<d.boxes.length;k++) if(d.boxes[k].plate) plates[d.boxes[k].plate]=true;
  for(var i=0;i<route.length-1;i++){
    var a=route[i], b=route[i+1], kind;
    var gap=gapBetween(a,b), dy=(b.cy+b.hy)-(a.cy+a.hy);
    // 연동 발판으로 가는 구간은 간격과 무관하게 협동 관문이다 —
    // 팀원이 압력판을 밟아주지 않으면 발판 자체가 존재하지 않으므로.
    /* '붙어 있음'은 발판이 겹치고 "높이도 걸어 오를 만할 때"만이다. 수평으로 겹쳤다고
       14m 위로 올라갈 수는 없으므로, 높이가 일반 점프 한계를 넘으면 그대로 분류에 넘긴다. */
    if(b.link) kind = plates[b.link] ? 'gate' : 'noswitch';
    else if(gap<=0 && dy<=PENG.reach.apex(PENG.PHYS.JUMPV)) kind='touch';
    else kind = PENG.reach.classify(gap, dy);
    out.push({ from:i, to:i+1, gap:Math.round(gap*100)/100, dy:Math.round(dy*100)/100,
               a:a, b:b, kind:kind });
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

/* ---------- 협동 관문 표식 (물리에서 자동 파생) ----------
   협동 전용 구간은 "혼자서는 물리적으로 불가능한 턱"인데 화면에 아무 표시가 없어서,
   플레이어가 자기 실력 탓으로 오해하고 같은 자리에서 계속 죽었다. 텍스트 힌트는 한 번
   읽고 사라지므로 규칙을 배우게 하지 못한다 — 그래서 코스 자체에 표식을 세운다.

   표식은 손으로 놓지 않고 analyzeLevel() 의 판정에서 바로 만든다. 판정이 쓰는 숫자가
   곧 게임이 쓰는 숫자(PENG.PHYS)이므로, 상수를 고치거나 발판을 옮기면 표식이 저절로
   따라온다 — 표식이 물리와 어긋나 거짓말을 하는 상태가 원천적으로 생기지 않는다.

   두 가지를 세운다.
     · 한계 기둥 — 발판 표면에서 soloRise(혼자 로켓점프 최대 상승) 높이까지 오르는 가는
       기둥. 꼭대기의 빨간 띠가 "혼자서는 여기까지"다. 다음 발판이 띠보다 위에 보이면
       혼자서는 못 간다 — 규칙을 한 번 익히면 모든 맵에서 그대로 통한다.
     · 가장자리 테두리 — 관문 양쪽 발판의 표면 가장자리. 도우는 사람이 설 자리다.
       안쪽에서 쏘면 자기 발판에 막혀 팀원을 못 띄우므로, 테두리가 곧 사격 위치다.

   전부 deco:true 라 충돌하지도, 광선에 맞지도 않는다. 레벨 데이터(boxes)에 섞지 말고
   따로 받아서 그리기만 할 것 — 섞으면 에디터가 저장할 때 파일에 딸려 들어간다. */
PENG.MARK_COL = { rim:'#c05ad0', post:'#7a5a8c', band:'#e8484f' };
PENG.coopMarkers = function(d){
  var out=[], C=PENG.MARK_COL, lim=PENG.reach.soloRise(), done=[];

  // 발판 표면 가장자리를 두르는 얇은 띠 4개. 모서리에서 겹치지 않게 좌우 막대를 줄인다
  // (같은 높이로 겹치면 윗면이 z파이팅으로 지글거린다).
  function rim(b){
    if(done.indexOf(b)>=0) return; done.push(b);      // 발판이 두 구간에 걸려도 한 번만
    var y=b.cy+b.hy, t=0.26, h=0.05, inner=b.hz-2*t;
    out.push({cx:b.cx, cy:y+h, cz:b.cz-b.hz+t, hx:b.hx, hy:h, hz:t, col:C.rim, deco:true});
    out.push({cx:b.cx, cy:y+h, cz:b.cz+b.hz-t, hx:b.hx, hy:h, hz:t, col:C.rim, deco:true});
    if(inner<=0) return;                               // 너무 작은 발판이면 좌우 막대는 생략
    out.push({cx:b.cx-b.hx+t, cy:y+h, cz:b.cz, hx:t, hy:h, hz:inner, col:C.rim, deco:true});
    out.push({cx:b.cx+b.hx-t, cy:y+h, cz:b.cz, hx:t, hy:h, hz:inner, col:C.rim, deco:true});
  }
  /* 출발 발판에 세우는 한계 기둥 + 목표까지 뻗는 점선 레일.
     기둥만 세웠더니 읽히지 않았다 — 목표 발판은 10m 넘게 떨어져 있어서, 실제로는 띠보다
     높은데도 원근 때문에 화면에서는 띠보다 아래로 보였다(가까운 것이 커 보이니까).
     그래서 같은 높이를 목표 발판 코앞까지 점선으로 끌고 간다. 레일의 끝과 목표 발판이
     같은 거리에 놓이므로 "발판이 선 위에 있다"가 원근에 왜곡되지 않고 그대로 보인다. */
  function post(a, b){
    var dx=b.cx-a.cx, dz=b.cz-a.cz, L=Math.hypot(dx,dz)||1, ux=dx/L, uz=dz/L;
    var y=a.cy+a.hy+lim;                                  // 혼자서는 여기까지
    var px=a.cx+ux*Math.max(0,a.hx-0.5), pz=a.cz+uz*Math.max(0,a.hz-0.5);
    out.push({cx:px, cy:y-lim/2, cz:pz, hx:0.075, hy:lim/2, hz:0.075, col:C.post, deco:true});
    out.push({cx:px, cy:y,       cz:pz, hx:0.22,  hy:0.11,  hz:0.22,  col:C.band, deco:true});
    // 목표 발판의 앞 가장자리까지. 그 너머로 넘기면 발판 밑에 가려 안 보인다.
    var end=L-(Math.abs(ux)*b.hx+Math.abs(uz)*b.hz);
    var run=end-Math.max(0,a.hx*Math.abs(ux)+a.hz*Math.abs(uz)-0.5);
    var n=Math.floor(run/0.85);
    for(var k=1;k<=n;k++){ var t=k*0.85;
      out.push({cx:px+ux*t, cy:y, cz:pz+uz*t, hx:0.13, hy:0.05, hz:0.13, col:C.band, deco:true}); }
  }

  var segs=PENG.analyzeLevel(d);
  for(var i=0;i<segs.length;i++){ var s=segs[i];
    if(s.kind!=='coop') continue;     // 압력판 다리(gate)는 청록 발판·노란 판이 이미 말해 준다
    rim(s.a); rim(s.b); post(s.a, s.b);
  }
  return out;
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

  /* 협동 전용 — 압력판과 연동 발판은 한 쌍이다. 같은 채널(a~f)끼리 묶인다.
     한 명이 판을 밟고 있는 동안에만 다리가 실체가 되므로, 밟는 사람은 건널 수 없다.
     건너간 사람이 반대편 판을 밟아 되갚아 주는 왕복 릴레이가 이 기믹의 노림수다. */
  { id:'plate', name:'압력판', deco:false, tag:'협동',
    icon:'<rect x="3" y="10" width="18" height="4" rx="1" fill="#c8a52e"/><path d="M12 3v6M9 6l3-3 3 3" stroke="#ffe066" stroke-width="1.6" fill="none"/>',
    build:function(){ return [{cx:0,cy:0.12,cz:0,hx:1.4,hy:0.12,hz:1.4,col:'#c8a52e',plate:'a'}]; } },
  { id:'bridge', name:'연동 발판', deco:false, tag:'협동',
    icon:'<rect x="2" y="9" width="20" height="6" rx="1" fill="#2f9c9c" stroke="#7fe3e3" stroke-width="1" stroke-dasharray="3 2"/>',
    build:function(){ return [{cx:0,cy:-0.5,cz:0,hx:3,hy:0.5,hz:3,col:'#2f9c9c',link:'a'}]; } },

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
PENG.placeProp = function(id, x, y, z, gid, ch){
  var p=PENG.propById(id); if(!p) return [];
  var parts=p.build(), out=[];
  for(var i=0;i<parts.length;i++){
    var b=parts[i];
    var nb={cx:x+b.cx, cy:y+b.cy, cz:z+b.cz, hx:b.hx, hy:b.hy, hz:b.hz, col:b.col};
    if(p.deco) nb.deco=true;
    if(parts.length>1 && gid) nb.g=gid;
    if(b.plate) nb.plate = ch || b.plate;      // 협동 채널(a~f) — 놓을 때 지정하거나 나중에 속성 패널에서
    if(b.link)  nb.link  = ch || b.link;
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
    if(b.plate) s += ", plate:'"+String(b.plate).replace(/'/g,"\\'")+"'";  // 협동 채널
    if(b.link)  s += ", link:'"+String(b.link).replace(/'/g,"\\'")+"'";
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
  // gate:true = 여기까지만 되돌린다(리스폰 지점). 없으면 예전대로 마지막 체크포인트로 돌아간다.
  L.push(d.checkpoints.map(function(c){ return '    {x:'+n(c.x)+', y:'+n(c.y)+', z:'+n(c.z)+
    (c.gate?', gate:true':'')+'}'; }).join(',\n'));
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

/* ---------- 절차적 아레나 생성 ----------
 * 시드 하나로 같은 판을 재현한다. 릴레이 넷코드라 지형에 권위가 없어서, 각자 굴리면
 * 서로 다른 맵에서 싸우게 된다 — 그래서 Math.random 을 쓰지 않고 시드를 받아 돌린다.
 *
 * 핵심 규칙: 90도 한 조각만 굴리고 4겹 회전 대칭으로 복제한다.
 * 밀어 떨어뜨리는 경기에서 비대칭은 곧 불공정이다(한쪽 스폰만 낭떠러지 옆이면 게임이
 * 망가진다). 대칭으로 만들면 공정성이 공짜로 따라오고, 모양은 여전히 유기적으로 나온다.
 */
PENG.rng32 = function(seed){          // mulberry32 — 짧고 분포가 고르다
  var a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* C: collapse 스펙(size·radius). seed: 32비트 정수.
 * 반환: {cells, slabs, structures, spawns, pads, maxRing}
 *   slabs      — 같은 고리·같은 높이의 칸을 직사각형으로 합친 바닥(월드 좌표)
 *   structures — 탑·계단탑·아치 등. {ring, boxes:[...]} 로 통째로 한 고리에 속한다
 * 좌표는 타일 인덱스다 — 월드 변환은 부르는 쪽이 한다(size 를 곱하면 된다). */
PENG.genArena = function(C, seed){
  /* 너무 휑한 판이 나오면 다시 굴린다. 연산자가 겹치면(해자+협곡+침식) 발판이 20장까지
     줄어드는데, 그건 아레나가 아니라 징검다리다. 시드를 파생시켜 다시 굴리므로
     결정론은 유지된다 — 전원이 같은 순서로 같은 판에 도달한다. */
  var Rt = C.radius / C.size;                       // 타일 단위 반경
  var minCells = (C.minCells == null) ? Math.round(Math.PI*Rt*Rt*0.45) : C.minCells;
  var best = null;
  for(var att = 0; att < 6; att++){
    var g = PENG.genArenaOnce(C, (seed + Math.imul(att, 0x85EBCA6B)) >>> 0);
    if(!best || g.cells.length > best.cells.length) best = g;
    if(g.cells.length >= minCells){ g.tries = att + 1; return g; }
  }
  best.tries = 6; return best;
};
PENG.genArenaOnce = function(C, seed){
  var size = C.size, R = C.radius / size, n = Math.ceil(R);
  var PLAT_H = (C.platH == null) ? 1.3 : C.platH;   // 고지대 단 높이(점프 도달 1.68m 이내)
  var rnd = PENG.rng32(seed);
  var ri = function(a, b){ return a + Math.floor(rnd() * (b - a + 1)); };

  var K = function(i, j){ return i + ',' + j; };
  var cells = {}, all = [], maxRing = 0;
  for(var i = -n; i <= n; i++) for(var j = -n; j <= n; j++){
    var d = Math.hypot(i, j); if(d > R) continue;
    var c = { i:i, j:j, h:0, ring:Math.round(d), live:true };
    if(c.ring > maxRing) maxRing = c.ring;
    cells[K(i,j)] = c; all.push(c);
  }

  /* 회전 궤도로 묶는다. (i,j) -> (-j,i) 를 네 번 돌면 제자리.
     결정은 궤도당 한 번만 내리고 네 칸에 똑같이 적용한다 = 4겹 대칭. */
  var orbits = [], seen = {};
  all.forEach(function(c){
    var o = [[c.i,c.j], [-c.j,c.i], [-c.i,-c.j], [c.j,-c.i]];
    var best = o[0];
    for(var k = 1; k < 4; k++)
      if(o[k][0] < best[0] || (o[k][0] === best[0] && o[k][1] < best[1])) best = o[k];
    var ck = best[0] + ',' + best[1];
    if(seen[ck]) return;
    seen[ck] = 1;
    var grp = [];
    for(var k2 = 0; k2 < 4; k2++){
      var cc = cells[K(o[k2][0], o[k2][1])];
      if(cc && grp.indexOf(cc) < 0) grp.push(cc);
    }
    grp.ring = c.ring;
    grp.ang  = Math.atan2(c.j, c.i);
    orbits.push(grp);
  });
  var atRing = function(r){ return orbits.filter(function(g){ return g.ring === r; }); };
  var kill   = function(g){ g.forEach(function(c){ if(c.ring > 0) c.live = false; }); };

  var used = [];   // 어떤 연산자가 걸렸는지 — 로그·디버그용

  /* (1) 해자 — 한 고리를 통째로 비우고 다리만 남긴다.
     건너는 길이 좁아져서 그 위에서의 밀어내기가 곧 승부가 된다. */
  if(maxRing >= 3 && rnd() < 0.75){
    var mr = ri(2, maxRing - 1), band = atRing(mr);
    if(band.length > 1){
      var keep = ri(0, band.length - 1);
      band.forEach(function(g, idx){ if(idx !== keep) kill(g); });
      used.push('해자 r' + mr);
    }
  }

  /* (2) 협곡 — 바깥으로 뻗는 쐐기를 판다. 안쪽에도 떨어뜨릴 가장자리가 생긴다. */
  if(maxRing >= 3 && rnd() < 0.6){
    var a0 = rnd() * Math.PI * 0.5, w = 0.18 + rnd() * 0.16;
    var from = ri(2, 3);
    orbits.forEach(function(g){
      if(g.ring < from) return;
      var da = Math.abs(((g.ang % (Math.PI/2)) + Math.PI/2) % (Math.PI/2) - a0);
      if(da < w) kill(g);
    });
    used.push('협곡');
  }

  /* (3) 고지대 — 가운데 근처 고리 몇 겹을 올린다. 높이 우위와 시야가 생긴다. */
  if(maxRing >= 4 && rnd() < 0.7){
    // 고리 0·1 은 건드리지 않는다 — 마지막에 남는 결전장이라 턱이 지면 싸움이 이상해진다
    var lo = ri(2, Math.max(2, maxRing - 2)), hi = Math.min(maxRing - 1, lo + ri(0, 1));
    orbits.forEach(function(g){
      if(g.ring >= lo && g.ring <= hi) g.forEach(function(c){ c.h = PLAT_H; });
    });
    used.push('고지대 r' + lo + '~' + hi);
  }

  /* (4) 가장자리 침식 — 바깥 테두리를 들쭉날쭉하게. 완벽한 원은 인공적으로 보인다. */
  atRing(maxRing).forEach(function(g){ if(rnd() < 0.35) kill(g); });

  /* (5) 연결성 — 가운데에서 로켓점프로 닿지 않는 조각은 지운다.
     대칭 지형이라 도달 가능성도 대칭이므로 이 정리는 대칭을 깨지 않는다. */
  var liveList = all.filter(function(c){ return c.live; });
  var ok = {}, q = [];
  var c0 = cells[K(0,0)];
  if(c0 && c0.live){ ok[K(0,0)] = 1; q.push(c0); }
  while(q.length){
    var cur = q.shift();
    for(var t = 0; t < liveList.length; t++){
      var tc = liveList[t]; if(ok[K(tc.i,tc.j)]) continue;
      var gap = Math.hypot(tc.i - cur.i, tc.j - cur.j) * size - size;   // 표면 사이 대략 간격
      var span = PENG.reach.rocket(tc.h - cur.h);
      if(span > 0 && gap <= span * 0.8){ ok[K(tc.i,tc.j)] = 1; q.push(tc); }
    }
  }
  liveList.forEach(function(c){ if(!ok[K(c.i,c.j)]) c.live = false; });

  /* (6) 구조물 — 격자 발판만 있으면 '구멍 뚫린 바둑판'이지 건축물이 아니다.
     탑·계단탑·아치·벽·고가 발판을 궤도 단위로 세운다(4겹이라 네 곳에 똑같이 선다).
     구조물은 통째로 한 고리에 속하게 해서 무너질 때 반쪽만 남지 않는다. */
  var COL_W = '#8a94ad', COL_R = '#c0895a', COL_D = '#6d7party';
  COL_D = '#6d7a95';
  function bx(cx, cy, cz, hx, hy, hz, col){
    return { cx:cx, cy:cy, cz:cz, hx:hx, hy:hy, hz:hz, col:col };
  }
  var KINDS = ['tower','zig','gate','wall','sky'];
  function build(kind, x, z, y0, S, r2){
    var o = [], H;
    if(kind === 'tower'){                       // 포탑 — 벽 넷 중 하나를 터서 드나든다
      H = 2.6 + r2() * 1.8;
      var t = S*0.11, e = S*0.46, door = Math.floor(r2()*4);
      var sides = [[0,  e],[0, -e],[ e, 0],[-e, 0]];
      for(var k=0;k<4;k++){
        if(k === door) continue;
        var sx = sides[k][0], sz = sides[k][1];
        o.push(bx(x+sx, y0+H*0.5, z+sz,
                  sz ? e : t, H*0.5, sz ? t : e, COL_W));
      }
      o.push(bx(x, y0+H+0.14, z, e+t, 0.14, e+t, COL_R));   // 옥상 — 여기가 명당이다
    } else if(kind === 'zig'){                  // 계단탑 — 걸어서 올라간다
      for(var q=0;q<3;q++){
        var hh = S*(0.48 - q*0.13);
        o.push(bx(x, y0+0.35+q*0.7, z, hh, 0.35, hh, q===2?COL_R:COL_W));
      }
    } else if(kind === 'gate'){                 // 아치 — 밑으로 지나가고 위에 올라선다
      H = 2.2 + r2()*0.8;
      var pw = S*0.13, px = S*0.36;
      o.push(bx(x-px, y0+H*0.5, z, pw, H*0.5, pw, COL_W));
      o.push(bx(x+px, y0+H*0.5, z, pw, H*0.5, pw, COL_W));
      o.push(bx(x, y0+H+0.16, z, S*0.5, 0.16, pw*1.4, COL_R));
    } else if(kind === 'wall'){                 // 벽 — 시야를 끊고 밀려날 때 걸린다
      H = 1.8 + r2()*1.0;
      var ax = r2() < 0.5;
      o.push(bx(x, y0+H*0.5, z, ax?S*0.5:S*0.12, H*0.5, ax?S*0.12:S*0.5, COL_D));
    } else {                                    // sky — 로켓점프로만 닿는 고가 발판
      var sh = 3.0 + r2()*1.2;
      o.push(bx(x, y0+sh, z, S*0.44, 0.16, S*0.44, COL_R));
      o.push(bx(x, y0+sh*0.5, z, S*0.09, sh*0.5, S*0.09, COL_D));   // 가느다란 지주
    }
    return o;
  }
  var structures = [], taken = [];
  var cand = orbits.filter(function(g){
    return g.ring >= 1 && g.ring <= maxRing - 1 && g.every(function(c){ return c.live; });
  });
  var sn = Math.min(cand.length, ri(3, 6));
  for(var p = 0; p < sn; p++){
    var g2 = cand.splice(Math.floor(rnd() * cand.length), 1)[0];
    taken.push(g2);
    var kind = KINDS[Math.floor(rnd() * KINDS.length)];
    /* 네 칸이 똑같이 생겨야 하므로 난수를 한 번만 뽑아 네 번 재사용한다.
       칸마다 새로 뽑으면 4겹 대칭이 깨져 한쪽만 높은 탑이 선다. */
    var seq = [rnd(), rnd(), rnd(), rnd()], si = 0;
    g2.forEach(function(c){
      si = 0;
      var r2 = function(){ return seq[(si++) % seq.length]; };
      structures.push({ ring:c.ring, boxes:build(kind, c.i*size, c.j*size, c.h, size, r2) });
    });
  }

  /* (7) 스폰 — 살아남은 궤도 중 가장 바깥. 네 칸이 모두 살아 있어야 공평하다. */
  var full = orbits.filter(function(g){
    return g.length === 4 && g.every(function(c){ return c.live; }) && taken.indexOf(g) < 0;
  });
  full.sort(function(a, b){ return b.ring - a.ring; });
  var spawnG = full[0] || [cells[K(0,0)]];
  /* (8) 패드 — 스폰과 가운데 사이 고리에서 고른다. 집으러 가려면 자리를 비워야 한다.
     궤도를 '두 개' 고른다. 하나만 고르면 4겹 대칭에서 나올 수 있는 배치가 궤도 수
     (약 17개)로 묶여 매번 같은 자리처럼 보인다 — 두 개면 조합이 100가지를 넘는다.
     되도록 서로 다른 고리에서 뽑아 한쪽에 몰리지 않게 한다.
     가운데 패드는 남긴다: 판이 3x3 까지 줄어들면 바깥 패드는 전부 무너져
     막판에 아이템이 아예 없어진다. */
  var mid = full.filter(function(g){
    return g !== spawnG && g.ring >= 1 && g.ring < spawnG.ring;
  });
  var padGs = [];
  if(mid.length){
    var first = mid.splice(Math.floor(rnd() * mid.length), 1)[0];
    padGs.push(first);
    var other = mid.filter(function(g){ return g.ring !== first.ring; });
    var pool = other.length ? other : mid;
    if(pool.length) padGs.push(pool[Math.floor(rnd() * pool.length)]);
  } else padGs.push(spawnG);

  /* (9) 바닥 병합 — 2.6m 정사각형이 낱개로 깔리면 아무리 파내도 '바둑판'으로 읽힌다.
     같은 고리·같은 높이의 칸을 최대 직사각형으로 묶어 이음매 없이(틈 0) 깐다.
     고리별로만 묶는 이유: 여러 고리에 걸친 슬랩은 그 고리가 무너질 때 반쪽만
     남길 수 없어서, 통째로 이르게 사라지거나 늦게까지 버티거나 둘 중 하나가 된다. */
  var slabs = [];
  var groups = {};
  liveList.forEach(function(c){
    if(!c.live) return;
    var gk = c.ring + '#' + c.h;
    (groups[gk] || (groups[gk] = [])).push(c);
  });
  Object.keys(groups).forEach(function(gk){
    var set = {}, arr = groups[gk];
    arr.forEach(function(c){ set[c.i + ',' + c.j] = c; });
    var used = {};
    arr.slice().sort(function(a,b){ return (a.i-b.i) || (a.j-b.j); }).forEach(function(c){
      if(used[c.i + ',' + c.j]) return;
      var w = 1;
      while(set[c.i + ',' + (c.j+w)] && !used[c.i + ',' + (c.j+w)]) w++;
      var hgt = 1, grow = true;
      while(grow){
        for(var q = 0; q < w; q++){
          var kk = (c.i+hgt) + ',' + (c.j+q);
          if(!set[kk] || used[kk]){ grow = false; break; }
        }
        if(grow) hgt++;
      }
      for(var a = 0; a < hgt; a++) for(var b = 0; b < w; b++) used[(c.i+a) + ',' + (c.j+b)] = 1;
      slabs.push({
        cx: (c.i + (hgt-1)/2) * size, cz: (c.j + (w-1)/2) * size,
        hx: hgt*size/2, hz: w*size/2, h: c.h, ring: c.ring
      });
    });
  });

  return {
    cells:   liveList.filter(function(c){ return c.live; })
                     .map(function(c){ return { i:c.i, j:c.j, h:c.h, ring:c.ring }; }),
    slabs:   slabs,
    structures: structures,
    spawns:  spawnG.map(function(c){ return { i:c.i, j:c.j, h:c.h }; }),
    pads:    [{ i:0, j:0, h:(c0 ? c0.h : 0), center:true }].concat(
               padGs.reduce(function(acc, g){
                 return acc.concat(g.map(function(c){ return { i:c.i, j:c.j, h:c.h }; }));
               }, [])),
    maxRing: maxRing,
    used:    used
  };
};

/* ---------- 절차적 우주 정거장 (Kenney Space Station Kit) ----------
 * 예전 아레나는 "원판을 깔고 구멍을 파는" 방식이라 아무리 손봐도 지형 덩어리였다.
 * 이건 반대로 간다 — 실제 정거장처럼 코어에서 복도를 뻗고 끝에 포드를 붙여 '조립'한다.
 * 그래서 실루엣이 허브+스포크로 읽히고, 조각이 킷의 1x1 격자에 그대로 얹힌다.
 *
 * 좌표는 킷 유닛(1칸=1)으로 낸다. 미터 환산은 부르는 쪽이 한다(1유닛 = 2.6m).
 * 데크 윗면이 y=0 이 되도록 바닥 조각은 y=-0.3 에 놓는다.
 *
 * 4겹 회전 대칭은 그대로 지킨다: 한 사분면(+Z 방향 팔)만 굴리고 네 번 돌린다.
 * 밀어 떨어뜨리는 경기에서 비대칭은 곧 불공정이다.
 *
 * 붕괴는 '고리'가 아니라 '모듈 분리'다. order 가 클수록 먼저 떨어져 나간다:
 *   위성(가장 바깥) → 포드 → 복도(바깥→안) → 코어(안 떨어짐).
 */
/* ---------- 피크 — 절벽 위의 평지 (Kenney Survival Kit) ----------
   판을 통째로 킷 조각으로만 만든다. 색칠한 박스 지면도, 박스로 쌓은 절벽도 없다.

   왜 큰 바위 '한 장'이 아니라 모자이크인가 —
     킷의 rock-flat / rock-flat-grass 는 평평한 판이 아니라 가운데가 볼록한 접시다
     (실측 체비셰프 반경별 최고점: 반경 0.9 까지는 윗면이 거의 그대로고 낙차가
     0.03~0.06유닛뿐인데, 마지막 10% 에서 확 떨어진다). 하나를 아레나 크기로 키우면
     그 베벨도 같이 커져서 판판한 콜리전을 씌우면 가장자리에서 발이 몇 미터씩 뜬다.
     그래서 지름 7m 남짓을 절반쯤 겹쳐 깐다 — 서로의 베벨을 이웃이 덮어 주고,
     콜리전은 조각마다 '제 윗면 높이의 평평한 한 장'(PIECE_FLAT)이라 데크가 한 평면이다.

   왜 데크 밑에 테두리 바위를 두르는가 —
     산체로 쓰는 큰 바위는 돔이라 '가장 넓은 곳'이 밑동이다. 데크 높이에서는 이미
     좁아져 있어서, 그냥 두면 두께 1m 짜리 슬래브만 처마처럼 튀어나와 접시처럼 보인다
     (그게 '얇은 바닥'의 정체다). 데크 바로 밑에 중간 크기 바위를 두 겹 둘러 채운다.

   층 구성(첨부 스케치대로) — 정상 소봉(+1.35m) · 본 데크(0) · 네 귀퉁이 아래 선반
     (-2.55m, 밀려나도 한 번은 살아남는 자리) · 그 아래는 킬존.
   산체는 큰 바위를 고리로 쌓아 만들고 전부 deco 다. 실체로 두면 떨어진 사람이 산
   중턱에 올라서서 안 죽는다.

   배율: 1킷유닛 = 3m(collapse.size). 나무 4.2~5.1m · 천막 1.7m · 울타리 1.56m 로
   실측 크기가 맞고, 울타리가 점프 정점(1.68m)보다 낮아 넘어 다닐 수 있는 엄폐물이 된다.
   공정성: 소품·발판 모두 사분면 하나에 놓고 (i,j)->(j,-i) 로 네 번 찍는다. */
PENG.genPeak = function(seed){
  var rnd  = PENG.rng32(seed >>> 0);
  var ri   = function(a,b){ return a + Math.floor(rnd()*(b-a+1)); };
  var pick = function(a){ return a[Math.floor(rnd()*a.length)]; };

  /* 조각 윗면 높이(킷유닛). 데크를 정확히 한 평면에 맞추고 산체 층을 겹치게 하려면
     조각마다 '내 윗면이 얼마나 위인지'를 알고 그만큼 내려 놓아야 한다. */
  var TOP = { 'rock-flat':0.195, 'rock-flat-grass':0.226,
    'rock-a':0.390, 'rock-b':0.419, 'rock-c':0.510,
    'rock-sand-a':0.390, 'rock-sand-b':0.450, 'rock-sand-c':0.510 };
  var DECK_SLABS = ['rock-flat','rock-flat','rock-flat','rock-flat-grass'];
  var RIM  = ['rock-a','rock-b','rock-c','rock-sand-a','rock-sand-b','rock-sand-c'];

  var SUMMIT_Y = 0.45;                             // 정상 소봉 = +1.35m, 점프로 오른다
  var SHELF_Y  = -0.85;                            // 아래 선반 = -2.55m
  var RINGS    = [0, 1.2, 2.4, 3.6, 4.8];          // 데크 고리 반지름(킷유닛)
  var DECK_R   = RINGS[RINGS.length-1];
  var SLAB_S   = 1.35;                             // 슬래브 배율 → 지름 7.2m
  var DECK_OUT = DECK_R + 1.79*SLAB_S*0.5;         // 데크 바깥 끝 ≈ 6.0유닛 = 18m

  var pieces = [];
  /* 한 조각을 놓고 네 번 돌려 찍는다. rot 도 같이 1씩 올라가야 모양까지 대칭이 된다. */
  function put4(t, i, j, rot, s, y, order, deco){
    var x=i, z=j, r=(rot||0)&3;
    for(var k=0;k<4;k++){
      pieces.push({ t:t, i:x, j:z, y:y, rot:r&3, s:s, order:order, deco:!!deco });
      var tx=z; z=-x; x=tx; r++;
    }
  }
  // 윗면을 원하는 높이에 맞춰 놓는다(조각 원점이 바닥이라 제 윗면 높이만큼 내린다)
  function putTop(t, i, j, rot, s, topY, order, deco){
    put4(t, i, j, rot, s, topY - TOP[t]*s, order, !!deco);
  }
  // 반지름 R 의 고리에 4의 배수 개를 두른다(사분면당 qn 개)
  function ringOf(R, qn, fn){
    var base = rnd()*Math.PI*0.5;
    for(var q=0;q<qn;q++) fn(base + q*(Math.PI*0.5/qn));
  }

  /* --- 1) 데크 모자이크 --- */
  for(var g=0; g<RINGS.length; g++){
    var R = RINGS[g];
    if(R === 0){ putTop('rock-flat', 0, 0, 0, SLAB_S*1.2, 0, g); continue; }
    /* 조각 폭의 65% 간격으로 두르면 이웃과 35% 겹친다 — 흘러내리는 테두리가 서로 가려진다.
       개수는 4의 배수여야 네 사분면이 똑같아진다. */
    var n = Math.max(4, Math.round(2*Math.PI*R / (1.79*SLAB_S*0.65)));
    ringOf(R, Math.ceil(n/4), function(th){
      var rr = R + (rnd()-0.5)*0.32;               // 살짝 흔들어 고리 티를 없앤다
      var sc = SLAB_S * (0.92 + rnd()*0.2);
      putTop(pick(DECK_SLABS), Math.cos(th)*rr, Math.sin(th)*rr, ri(0,3), sc, 0, g);
    });
  }
  // 정상 소봉 — 고리 0 이라 끝까지 남는다. 마지막 결전이 여기서 난다.
  putTop('rock-flat-grass', 0.46, 0.46, 0, 1.05, SUMMIT_Y, 0);
  putTop('rock-flat',       0.0,  0.72, 1, 0.92, SUMMIT_Y, 0);
  // 오르는 디딤돌(0.70m) — 1.35m 를 한 번에 뛰지 않아도 되게
  put4('rock-a', 1.15, 0.42, 0, 0.60, 0, 1, false);

  /* --- 2) 데크 밑 테두리 --- 두 겹. 위 겹은 데크 바로 밑에 붙여 처마를 없애고,
     아래 겹은 조금 더 넓게 빼서 산체로 자연스럽게 이어 준다. 전부 deco. */
  /* 반지름은 '바위 바깥 끝'이 데크 끝과 나란해지도록 역산한다(바위 반폭 ≈ 0.415*배율).
     밖으로 튀어나오면 보이는 바위를 뚫고 떨어지게 되어 더 이상하다. */
  ringOf(0, 5, function(th){
    var sc = 2.4 + rnd()*0.5, rr = DECK_OUT - 0.12 - 0.415*sc;
    putTop(pick(RIM), Math.cos(th)*rr, Math.sin(th)*rr, ri(0,3), sc, -0.02, 0, true);
  });
  ringOf(0, 4, function(th){
    var sc2 = 3.2 + rnd()*0.7, rr2 = DECK_OUT - 0.05 - 0.415*sc2;
    putTop(pick(RIM), Math.cos(th)*rr2, Math.sin(th)*rr2, ri(0,3), sc2, -0.95, 0, true);
  });

  /* --- 3) 아래 선반 --- 네 귀퉁이. 데크 끝에 걸치게 놓아야 밀려난 사람이 떨어져
     닿는다(데크 안쪽에 두면 데크 밑에 깔려 보이지도 닿지도 않는다). */
  var shR = DECK_OUT + 1.4;
  putTop('rock-flat', Math.cos(0.785)*shR, Math.sin(0.785)*shR, 0, 1.6, SHELF_Y, RINGS.length-1);
  putTop('rock-flat-grass', Math.cos(0.60)*(shR+1.3), Math.sin(0.60)*(shR+1.3), 2, 1.15, SHELF_Y-0.55, RINGS.length-1);

  /* --- 4) 산체 --- 큰 바위를 고리로 쌓아 스케치의 뷰트를 만든다.
     층 간격보다 바위가 높아야 사이로 저 아래 골짜기가 비치지 않는다:
     가장 낮은 rock-b 가 흔들림 최소(0.92)에서도 0.419*7*0.92 = 2.70 > 2.6 이 되게
     배율 하한을 잡았다. 반지름은 '바위 바깥 끝'이 데크 끝에서 아래로 갈수록
     벌어지도록 역산한다(바위 반폭 ≈ 0.415*배율). */
  var BODY = ['rock-c','rock-sand-c','rock-b','rock-sand-b'];
  var BODY_LAYERS = 7, BODY_STEP = 2.6;
  for(var L=0; L<BODY_LAYERS; L++){
    var bTop = -0.15 - L*BODY_STEP;
    var bs   = 7.0 + L*1.0;
    var br   = (DECK_OUT + L*0.35) - 0.415*bs;
    ringOf(0, 4, function(th){
      var bt = pick(BODY), bsc = bs*(0.92 + rnd()*0.23);
      putTop(bt, Math.cos(th)*br, Math.sin(th)*br, ri(0,3), bsc, bTop, 0, true);
    });
  }

  /* --- 5) 데크 위 소품 --- 진영 캠프 · 벼랑 끝 바위 · 나무 --- */
  function prop(t, i, j, rot, s, deco){
    if(Math.hypot(i,j) > DECK_OUT - 0.3) return;   // 데크 밖으로 삐져나가면 버린다
    put4(t, i, j, 0|rot, s||1, 0,
         Math.min(RINGS.length-1, Math.round(Math.hypot(i,j)/DECK_R*(RINGS.length-1))), deco);
  }
  var CX=2.75, CZ=2.75;                            // 진영 캠프 중심(대각선, 중심에서 11.7m)
  prop('tent',         CX-0.48, CZ+0.22, 2);
  prop('campfire-pit', CX+0.28, CZ+0.04, 0);
  prop('chest',        CX+0.50, CZ+0.66, 1);
  prop('box',          CX+0.78, CZ-0.48, 3);
  prop('workbench',    CX-0.14, CZ+0.84, 2);
  prop('signpost',     CX+0.95, CZ+0.22, 1);
  prop('barrel',       CX-0.76, CZ-0.40, 0);
  for(var f=0; f<3; f++)
    prop(f===1?'fence-doorway':'fence', CX+1.18, CZ-0.5+f*0.5, 1);
  for(var w=0; w<3; w++)
    prop(w===2?'fence-fortified':'fence', CX-0.5+w*0.5, CZ+1.18, 0);

  // 벼랑 끝 바위 — 데크 가장자리를 따라. 엄폐도 되고 절벽 입술도 된다.
  var EDGE=['rock-a','rock-b','rock-c','rock-sand-a','rock-sand-b','rock-sand-c'];
  for(var eth=0.10; eth<1.5707; eth+=0.19){
    if(rnd() < 0.40) continue;
    var er = DECK_R - 0.15 - rnd()*0.5;
    prop(pick(EDGE), Math.cos(eth)*er, Math.sin(eth)*er, ri(0,3), 0.8+rnd()*0.5);
  }
  // 나무 — 중간 반경에서 시야를 끊는다
  var TREES=['tree','tree-tall','tree-autumn'];
  for(var tn=0; tn<3; tn++){
    var ta=0.18+rnd()*1.2, tr=1.7+rnd()*2.0;
    prop(pick(TREES), Math.cos(ta)*tr, Math.sin(ta)*tr, ri(0,3), 0.85+rnd()*0.3);
  }
  var ka=0.3+rnd()*0.95, kr=1.5+rnd()*1.6;
  prop('tree-trunk', Math.cos(ka)*kr, Math.sin(ka)*kr, ri(0,3), 1.0);
  var la=0.35+rnd()*0.9, lr=2.2+rnd()*1.5;
  prop('tree-log',   Math.cos(la)*lr, Math.sin(la)*lr, ri(0,3), 1.0);
  for(var gn=0; gn<4; gn++){
    var qa=0.12+rnd()*1.33, qr=1.2+rnd()*3.0;
    prop('grass-large', Math.cos(qa)*qr, Math.sin(qa)*qr, ri(0,3), 1.1, true);
  }

  /* --- 6) 스폰·패드 --- 데크 위(월드 y=0), 정상 패드만 위에 있다. */
  var spawns=[], pads=[], sx=CX, sz=CZ;
  for(var sp=0; sp<4; sp++){ spawns.push({i:sx, j:sz, h:0}); var t2=sz; sz=-sx; sx=t2; }
  pads.push({ i:0.3, j:0.3, h:SUMMIT_Y });
  var px=DECK_R-0.9, pz=0;
  for(var p=0;p<4;p++){ pads.push({i:px, j:pz, h:0}); var t3=pz; pz=-px; px=t3; }

  return { pieces:pieces, spawns:spawns, pads:pads, maxRing:RINGS.length-1,
           deckR:DECK_OUT, summitY:SUMMIT_Y,
           info:'데크지름'+(DECK_OUT*6).toFixed(0)+'m 조각'+pieces.length+'개' };
};

PENG.genStation = function(seed){
  var rnd = PENG.rng32(seed);
  var ri = function(a,b){ return a + Math.floor(rnd()*(b-a+1)); };
  var pick = function(a){ return a[Math.floor(rnd()*a.length)]; };

  /* --- 1) 칸 배치(한 사분면) ---
     킷의 벽은 슬래브가 '칸 중심선'에 있다(모서리가 아니라). 그래서 벽은 칸 단위로 놓고,
     꺾이는 칸에는 wall-corner 를 쓴다 — 모서리에 두 벽을 놓으면 직각으로 교차해
     서로를 뚫고 지나간다. 포드는 바닥 위에 '벽 칸 고리'를 둘러 방을 만든다. */
  var armLen = ri(2,4);          // 코어에서 뻗는 복도 길이(칸)
  var podR   = ri(1,2);          // 포드 안쪽 반경 → 안이 3x3 또는 5x5
  var hasSat = rnd() < 0.6;      // 포드 너머 떨어진 위성 발판(로켓점프 표적)
  var wallR  = podR + 1;         // 벽 고리는 안쪽 바로 바깥
  var podC   = 2 + armLen + wallR;                // 포드 중심의 j
  var satJ   = podC + wallR + ri(2,3);
  var maxOrd = armLen + (hasSat?2:1);

  var cells = {};                                  // "i,j" -> {i,j,order,kind}
  function put(i,j,order,kind){
    var k = i+','+j, c = cells[k];
    if(c){ if(order < c.order){ c.order=order; c.kind=kind; } return; }
    cells[k] = {i:i, j:j, order:order, kind:kind};
  }
  var q = [];
  function q4(i,j,order,kind){ q.push({i:i,j:j,order:order,kind:kind}); }
  for(var j=2; j<2+armLen; j++) q4(0, j, j-1, 'arm');
  // 포드: 안쪽(바닥) + 바깥 한 겹(벽 칸). 벽 칸에도 바닥을 깐다 — 벽이 허공에 뜨면 안 된다
  for(var pi=-wallR; pi<=wallR; pi++) for(var pj=-wallR; pj<=wallR; pj++){
    var ring = (Math.abs(pi)===wallR || Math.abs(pj)===wallR);
    q4(pi, podC+pj, armLen+0, ring?'podwall':'pod');
  }
  if(hasSat){ q4(0, satJ, armLen+1, 'sat'); q4(-1, satJ, armLen+1, 'sat'); }

  for(var ci=-1; ci<=1; ci++) for(var cj=-1; cj<=1; cj++) put(ci,cj,0,'core');
  for(var t=0; t<q.length; t++){
    var e=q[t], x=e.i, z=e.j;
    for(var r=0; r<4; r++){
      put(x, z, e.order, e.kind);
      var nx=z, nz=-x; x=nx; z=nz;
    }
  }

  /* --- 2) 조각 얹기 ---
     결정은 '회전 궤도당 한 번'만 내리고 네 칸에 똑같이 적용한다. 칸마다 굴리면
     4겹 대칭이 깨진다(밀어 떨어뜨리는 경기에서 비대칭은 곧 불공정이다). */
  var pieces=[], colliders=[];
  function has(i,j){ return !!cells[i+','+j]; }

  var orbits=[], seen={};
  var keys=Object.keys(cells).sort();
  for(var k=0;k<keys.length;k++){
    var c0=cells[keys[k]];
    var i2=c0.i, j2=c0.j, ring2=[];
    for(var r2=0;r2<4;r2++){ ring2.push([i2,j2]); var ni=j2, nj=-i2; i2=ni; j2=nj; }
    var best=ring2[0];
    for(r2=1;r2<4;r2++) if(ring2[r2][0]<best[0] || (ring2[r2][0]===best[0] && ring2[r2][1]<best[1])) best=ring2[r2];
    var ck=best[0]+','+best[1];
    if(seen[ck]) continue;
    seen[ck]=1;
    orbits.push({rep:c0, ring:ring2});
  }

  var PROP={ 'container':[0.57,0.6,0.57], 'container-wide':[0.6,0.7,0.6], 'skip':[0.7,0.5,1.2],
             'computer-system':[0.9,0.6,0.69], 'table':[1.1,0.4,0.6], 'pipe':[0.25,0.5,0.28] };
  var PROPK=Object.keys(PROP);

  /* 벽 칸의 모양·방향을 포드 중심 기준으로 정한다.
     rot 0 기준 wall-corner 의 팔은 +X 와 +Z 를 향한다(형상 실측).
       rot0 = +X,+Z  rot1 = +X,-Z  rot2 = -X,-Z  rot3 = -X,+Z
     wall 은 rot 0 일 때 X 로 길고 Z 로 얇다 → 바깥이 ±Z 면 rot 0/2, ±X 면 rot 1/3. */
  function wallOf(di, dj, R, doorSide){
    var ex=(Math.abs(di)===R), ez=(Math.abs(dj)===R);
    if(ex && ez){
      var rr = (di>0 && dj>0) ? 0 : (di>0 ? 1 : (dj>0 ? 3 : 2));
      return {t:'wall-corner', rot:rr};
    }
    if(ez) return {t:(doorSide&&dj<0&&di===0)?'wall-door':null, rot:(dj>0?0:2), straight:true};
    return {t:null, rot:(di>0?1:3), straight:true};
  }

  for(var o=0;o<orbits.length;o++){
    var ob=orbits[o], c=ob.rep;
    var floorT = rnd()<0.18 ? 'floor-detail' : (rnd()<0.3 ? 'floor-panel' : 'floor');
    var floorR = ri(0,3);
    /* 벽 칸이면 어떤 벽인지. 궤도 대표는 네 회전본 중 아무거나이므로, 기준을
       '+Z 쪽 포드에 속한 복사본'으로 잡아야 한다 — 그러지 않으면 포드 중심을
       엉뚱하게 계산해서 문이 팔 반대쪽에 뚫리거나 아예 안 생긴다. */
    var wallSpec=null, baseIdx=0;
    if(c.kind==='podwall'){
      for(var mm=0; mm<4; mm++){
        var mi=ob.ring[mm][0], mj=ob.ring[mm][1];
        if(Math.abs(mi)<=wallR && Math.abs(mj-podC)<=wallR){ baseIdx=mm; break; }
      }
      var bi=ob.ring[baseIdx][0], bj=ob.ring[baseIdx][1];
      wallSpec=wallOf(bi, bj-podC, wallR, true);
      /* 고리를 빈틈없이 두르면 포드가 닫힌 상자가 된다 — 밀려도 벽에 막혀
         아무도 밖으로 안 날아간다(실측: 낙하 4/8 → 0/8, 평균 이동 1.6m).
         직선 구간의 40% 는 비워 둔다. 모서리 기둥과 문은 남긴다. */
      if(wallSpec.straight && !wallSpec.t)
        wallSpec.t = (rnd()<0.60) ? pick(['wall','wall','wall','wall-window']) : null;
    }
    // 소품 — 벽 칸이 아닌 안쪽에만(벽과 겹치지 않게). 정중앙은 비워 둔다
    var prop=null;
    if((c.kind==='pod'||c.kind==='core') && !(c.i===0&&c.j===0) && rnd()<0.4){
      var pt=pick(PROPK); prop={t:pt, sz:PROP[pt], rot:ri(0,3)};
    }

    /* 회전해도 제자리인 칸(정중앙 0,0)은 궤도가 4중으로 접힌다 —
       그대로 돌리면 같은 자리에 조각이 네 장 겹쳐 쌓인다. */
    var done={};
    for(r2=0;r2<4;r2++){
      var ci=ob.ring[r2][0], cj=ob.ring[r2][1];
      var dk=ci+','+cj; if(done[dk]) continue; done[dk]=1;
      var cell=cells[dk]; if(!cell) continue;
      pieces.push({t:floorT, i:ci, j:cj, y:-0.3, rot:(floorR+r2)&3, order:cell.order});
      if(wallSpec && wallSpec.t)
        pieces.push({t:wallSpec.t, i:ci, j:cj, y:0,
          rot:(wallSpec.rot + r2 - baseIdx + 8)&3, order:cell.order});
      if(prop)
        pieces.push({t:prop.t, i:ci, j:cj, y:0, rot:(prop.rot+r2)&3, order:cell.order});
    }
  }

  /* --- 3) 스폰·패드 (전부 4겹) --- */
  var spawns=[], pads=[{i:0,j:0}];
  function ring4(i,j,out){ for(var t2=0;t2<4;t2++){ out.push({i:i,j:j}); var n1=j, n2=-i; i=n1; j=n2; } }
  ring4(0, podC, spawns);            // 포드 안쪽 중심
  ring4(0, 2, pads);                 // 복도 첫 칸 — 집으러 가려면 자리를 비워야 한다
  ring4(0, podC+podR, pads);         // 포드 안쪽 가장자리(벽 고리 바로 안)

  return { pieces:pieces, colliders:colliders, spawns:spawns, pads:pads,
           maxOrder:maxOrd, cells:Object.keys(cells).length,
           info:'팔'+armLen+' 포드'+(podR*2+1)+'x'+(podR*2+1)+(hasSat?' 위성':'') };
};
