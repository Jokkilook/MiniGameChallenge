/* PUNG! — 아이템 표식 메시(Kenney Food Kit, CC0)
 *
 * 패드 위에 떠 있는 표식이다. 원래는 작은 큐브 몇 개(ITEMS 의 glyph)였다 —
 * 회전 메시가 없어 축 정렬 큐브를 궤도만 돌리던 임시 조형이었고, 이제 실물이 들어왔다.
 * 큐브 경로는 그대로 남겨 둔다: 구운 데이터가 없거나 로드가 실패하면 거기로 떨어진다.
 *
 * 6종은 능력에 맞춰 고른 음식이다(무엇이 무엇인지는 tools/bakefood.js 의 MAP 에 있다).
 * 정점 데이터는 itembaked.js 에 미리 구워 두고, 게임은 **그것만** 쓴다 —
 * 원본 .glb 를 그 자리에서 굽는 경로는 없다. 이 킷은 한 파일에 조각이 여럿이고
 * 텍스처가 GLB 밖에 있어서 meshlib.js 의 로더로는 못 읽는다(그래서 굽기가 node 다).
 * 음식을 바꾸려면 `node tools/bakefood.js` 를 다시 돌린다.
 *
 * glTF 읽기·정점색 굽기·GPU 버퍼는 meshlib.js 가 총과 공유한다.
 * 이 파일에 남은 것은 아이템에만 있는 것뿐이다: 6종 목록, 크기 정규화, Y축 회전 배치.
 *
 * 축: 구울 때 MeshLib.AXIS_FLIP_Z(x, y, -z)를 이미 먹였고 바운딩박스 중심도
 * 원점으로 옮겨 뒀다. 여기서는 크기와 배치만 본다.
 *
 * 크기: 음식마다 비율이 제각각이다(바나나는 길쭉하고 초밥은 작다). 그대로 같은 배율을
 * 곱하면 패드마다 표식 크기가 들쭉날쭉해 보이므로, **가장 긴 변이 SIZE 가 되도록**
 * 메시마다 따로 맞춘다.
 */
(function(global){
'use strict';

if(!global.MeshLib){
  if(console&&console.warn) console.warn('[itemmesh] meshlib.js 가 먼저 실려야 합니다 — 큐브 표식으로 그립니다');
  return;
}

var ItemMesh={
  // 아이템 키. index.html 의 ITEMS 및 tools/bakefood.js 의 MAP 과 맞춰야 한다.
  keys:['reverse','power','drum','feather','anchor','pulse'],
  SIZE:0.42,          // 가장 긴 변의 월드 길이(m). 큐브 표식이 약 0.38m 였다
  outlineW:0.005,     // 윤곽선 두께(월드 단위)
  res:{},             // key → MeshLib.Res
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
   구운 데이터(itembaked.js)를 그대로 얹는다. <script src> 로 실리므로 즉시·오프라인 OK.
   한 종이 빠지면 그 종만 큐브 표식으로 떨어지고 나머지는 그대로 뜬다. */
ItemMesh.init=function(done){
  var baked=global.ITEM_BAKED;
  if(!baked){
    this.info='구운 데이터 없음 — 큐브 표식';
    if(console&&console.log) console.log('[itemmesh] itembaked.js 가 없습니다 — 큐브 표식으로 그립니다 (node tools/bakefood.js 로 구우세요)');
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

global.ItemMesh=ItemMesh;
})(window);
