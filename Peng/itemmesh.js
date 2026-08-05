/* PENG! — 아이템 표식 메시(Mesh/SM_*.glb)
 *
 * 패드 위에 떠 있는 표식이다. 원래는 작은 큐브 몇 개(ITEMS 의 glyph)였다 —
 * 회전 메시가 없어 축 정렬 큐브를 궤도만 돌리던 임시 조형이었고, 이제 실물이 들어왔다.
 * 큐브 경로는 그대로 남겨 둔다: 구운 데이터가 없거나 로드가 실패하면 거기로 떨어진다.
 *
 * glTF 읽기·정점색 굽기·GPU 버퍼는 meshlib.js 가 총과 공유한다.
 * 이 파일에 남은 것은 아이템에만 있는 것뿐이다: 6종 목록, 크기 정규화, Y축 회전 배치.
 *
 * 축: Meshy 에서 나온 6종은 전부 Y-up · 원점 중앙이라 방향을 맞출 게 없다.
 * 그래서 총(-z,y,-x)과 달리 기본 변환(MeshLib.AXIS_FLIP_Z = x,y,-z)만 쓴다.
 *
 * 크기: 원본은 6종 다 ±1 로 정규화돼 있지만 바운딩박스 비율은 제각각이다
 * (드럼은 납작하고 깃털은 길쭉하다). 그대로 같은 배율을 곱하면 패드마다 표식 크기가
 * 들쭉날쭉해 보이므로, **가장 긴 변이 SIZE 가 되도록** 메시마다 따로 맞춘다.
 */
(function(global){
'use strict';

if(!global.MeshLib){
  if(console&&console.warn) console.warn('[itemmesh] meshlib.js 가 먼저 실려야 합니다 — 큐브 표식으로 그립니다');
  return;
}

// 아이템 키 → 파일 이름. 키는 index.html 의 ITEMS 와 맞춰야 한다.
var FILES={
  reverse:'SM_ReverseCapsule',
  power:  'SM_OverCharge',
  drum:   'SM_DrumMagazine',
  feather:'SM_Feather',
  anchor: 'SM_Anchor',
  pulse:  'SM_Pulse'
};
var ItemMesh={
  // 원본 폴더. 페이지 기준 상대경로라 tools/bake.html 은 '../Mesh/' 로 바꿔 쓴다.
  dir:'Mesh/',
  SIZE:0.42,          // 가장 긴 변의 월드 길이(m). 큐브 표식이 약 0.38m 였다
  outlineW:0.005,     // 윤곽선 두께(월드 단위)
  res:{},             // key → MeshLib.Res
  keys:Object.keys(FILES),
  info:''
};
for(var i=0;i<ItemMesh.keys.length;i++){
  var k=ItemMesh.keys[i];
  ItemMesh.res[k]=new MeshLib.Res('item:'+k, MeshLib.AXIS_FLIP_Z);
}

ItemMesh.get=function(key){ var r=this.res[key]; return (r&&r.ready) ? r : null; };
ItemMesh.has=function(key){ return !!this.get(key); };
ItemMesh.count=function(){ var n=0; for(var j=0;j<this.keys.length;j++) if(this.res[this.keys[j]].ready) n++; return n; };

/* 메시마다 '가장 긴 변 → SIZE' 배율. 바운딩박스는 로드할 때 정해지므로 한 번만 재고 캐시한다. */
function fitOf(r, size){
  if(r._fit==null || r._fitSize!==size){
    var M=r.M, e=Math.max(M.max[0]-M.min[0], M.max[1]-M.min[1], M.max[2]-M.min[2]);
    r._fit = size/Math.max(1e-6, e);
    r._fitSize = size;
  }
  return r._fit;
}
/* Y축으로 ang 만큼 돌리고 s 배 키워 (x,y,z) 에 놓는 열 우선 4x4.
   회전 방향은 큐브 표식(drawGlyph)과 같다 — 메시로 바꿔도 도는 쪽이 그대로여야 한다. */
function modelMat(x,y,z,ang,s){
  var c=Math.cos(ang)*s, n=Math.sin(ang)*s;
  return [ c,0,n,0,   0,s,0,0,   -n,0,c,0,   x,y,z,1 ];
}

ItemMesh.draw=function(gl,prog,VP,key,x,y,z,ang){
  var r=this.get(key); if(!r) return false;
  var s=fitOf(r,this.SIZE);
  return r.draw(gl, prog, VP, modelMat(x,y,z,ang,s));
};
// 호출부가 CULL_FACE/BACK 을 켠 상태에서 부른다(총·캡슐과 같은 규칙)
ItemMesh.drawOutline=function(gl,prog,VP,key,x,y,z,ang){
  var r=this.get(key); if(!r) return false;
  var s=fitOf(r,this.SIZE);
  return r.drawHull(gl, prog, VP, modelMat(x,y,z,ang,s), this.outlineW, s);
};

/* ---------- 로드 ----------
   게임은 **구운 데이터만** 쓴다(itembaked.js, 즉시·오프라인 OK).
   한 종이 빠지면 그 종만 큐브 표식으로 떨어지고 나머지는 그대로 뜬다.

   총(gunmesh)은 구운 파일이 없으면 원본 .glb 를 받아 그 자리에서 굽지만, 여기서는
   그러지 않는다 — 아이템은 6종이라 원본이 합쳐서 40MB 다. 접속할 때마다 그걸 받느니
   큐브 표식이 낫다. 원본에서 굽는 경로는 tools/bake.html 만 쓴다(loadAll). */
ItemMesh.init=function(done){
  var baked=global.ITEM_BAKED;
  if(!baked){
    this.info='구운 데이터 없음 — 큐브 표식';
    if(console&&console.log) console.log('[itemmesh] itembaked.js 가 없습니다 — 큐브 표식으로 그립니다 (tools/bake.html 에서 구우세요)');
    if(done) done(false); return;
  }
  var ok=0, bad=[];
  for(var j=0;j<this.keys.length;j++){
    var key=this.keys[j];
    if(!baked[key]){ bad.push(key); continue; }
    try{ this.res[key].applyBaked(baked[key]); this.res[key].ready=true; ok++; }
    catch(e){ bad.push(key+'('+e.message+')'); }
  }
  this.info='itembaked.js — '+ok+'/'+this.keys.length+'종'+(bad.length?' · 큐브로 떨어짐: '+bad.join(', '):'');
  if(console&&console.log) console.log('[itemmesh] '+this.info);
  if(done) done(ok>0);
};
// 아직 준비 안 된 것만 원본에서 굽는다. 6개를 동시에 받으면 40MB 라 하나씩 이어 받는다.
ItemMesh.loadAll=function(done, onEach){
  var self=this, i=0;
  (function next(){
    while(i<self.keys.length && self.res[self.keys[i]].ready) i++;
    if(i>=self.keys.length){ if(done) done(self.count()); return; }
    var key=self.keys[i];
    self.res[key].load(self.dir+FILES[key]+'.glb', function(ok){
      if(onEach) onEach(key, ok, self.res[key]);
      i++; next();
    });
  })();
};

/* ---------- 저장 ----------
   itembaked.js 의 내용을 문자열로 만든다(tools/bake.html 이 서버에 보내 파일로 쓴다).
   6종을 한 파일에 담는다 — 종마다 <script> 를 여섯 줄 늘리는 것보다 낫고,
   어차피 하나가 빠지면 그 종만 큐브로 떨어지므로 통째로 다뤄도 안전하다. */
ItemMesh.serialize=function(){
  var o={}, miss=[];
  for(var j=0;j<this.keys.length;j++){
    var key=this.keys[j];
    if(!this.res[key].ready){ miss.push(key); continue; }
    o[key]=this.res[key].toBaked();
  }
  if(!Object.keys(o).length) throw new Error('구운 아이템 메시가 하나도 없습니다');
  return '/* 자동 생성 파일 — 직접 고치지 마세요.\n'+
         '   tools/bake.html 이 Mesh/SM_*.glb 를 구워 만든 정점 데이터입니다.\n'+
         '   모델을 바꾸면 그 페이지를 열어 [아이템 굽기] 를 다시 누르세요.'+
         (miss.length?'\n   ※ 빠진 종: '+miss.join(', '):'')+' */\n'+
         'window.ITEM_BAKED='+JSON.stringify(o)+';\n';
};

global.ItemMesh=ItemMesh;
})(window);
