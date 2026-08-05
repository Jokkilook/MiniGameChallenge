/* PENG! — 총 메시(ShockWave_Gun.glb)
 *
 * glTF 읽기·정점색 굽기·GPU 버퍼는 meshlib.js 가 한다. 이 파일에 남은 것은
 * **총에만 있는 것**뿐이다: 조준 기저에 붙는 배치(scale·ox/oy/oz), 반동으로 당기는 양,
 * 총구 위치, 그리고 gunbaked.js 형식의 저장/복원.
 *
 * 축: ShockWave_Gun 은 총구가 -X 를 향하고 +Y 가 위라서
 *     local = (-z, y, -x)   (MeshLib.AXIS_GUN)
 * 로 옮기면 게임 기저(x=오른쪽, y=위, z=앞)에 들어맞는다.
 *
 * 실패하면 조용히 ready=false 로 남는다. 호출부는 기존 박스 총으로 폴백한다
 * (file:// 로 직접 열면 fetch 가 막히므로 이 경로가 실제로 쓰인다).
 */
(function(global){
'use strict';

if(!global.MeshLib){
  if(console&&console.warn) console.warn('[gunmesh] meshlib.js 가 먼저 실려야 합니다 — 박스 총으로 그립니다');
  return;
}
var GunMesh = new MeshLib.Res('gun', MeshLib.AXIS_GUN);

// --- 배치(조준 기저 기준: x=오른쪽, y=위, z=앞). 디버그 패널에서 조절한다 ---
// 원본 메시는 총열 방향 길이가 2유닛이라 0.22 를 곱하면 약 0.44m — 박스 총과 비슷한 화면 비중이 된다.
GunMesh.scale=0.22;
GunMesh.ox=0.26; GunMesh.oy=-0.23; GunMesh.oz=0.50;
GunMesh.outlineW=0.006;          // 윤곽선 두께(월드 단위)

// 총구 위치(로컬, scale 적용 전) — 섬광·발사 원점에 쓴다.
// meshlib 은 방향성 없는 이름(front)으로 들고 있고, 총에서만 '총구'로 부른다.
Object.defineProperty(GunMesh, 'muzzle', {
  get:function(){ return this.front; },
  set:function(v){ this.front=v; }
});

/* ---------- 배치 ---------- */
// 반동(kick)만큼 총을 뒤·아래로 당긴다 — 박스 총과 같은 값
function originOf(O,R,U,F,kick,extra){
  var x=GunMesh.ox+(extra?extra[0]:0),
      y=GunMesh.oy+(extra?extra[1]:0)-0.05*kick,
      z=GunMesh.oz+(extra?extra[2]:0)-0.16*kick;
  return [O.x+R.x*x+U.x*y+F.x*z, O.y+R.y*x+U.y*y+F.y*z, O.z+R.z*x+U.z*y+F.z*z];
}
function modelMat(O,R,U,F,kick,extra){
  var s=GunMesh.scale, o=originOf(O,R,U,F,kick,extra);
  return [R.x*s,R.y*s,R.z*s,0,  U.x*s,U.y*s,U.z*s,0,  F.x*s,F.y*s,F.z*s,0,  o[0],o[1],o[2],1];
}

/* 본체. VP 는 화면 VP, (O,R,U,F) 는 총이 붙을 기저(눈 위치 + 조준 기저).
   extra 는 3인칭에서 몸 쪽으로 옮기는 추가 오프셋(GUN_TP). */
GunMesh.drawBody=function(gl,prog,VP,O,R,U,F,kick,extra){
  return this.draw(gl, prog, VP, modelMat(O,R,U,F,kick||0,extra));
};
/* 윤곽선 껍질. 호출부가 CULL_FACE/BACK 을 켠 상태에서 부른다
   (축 변환으로 바깥면이 CW 가 되어 캡슐·구와 같은 규칙이 그대로 적용된다). */
GunMesh.drawOutline=function(gl,prog,VP,O,R,U,F,kick,extra){
  return this.drawHull(gl, prog, VP, modelMat(O,R,U,F,kick||0,extra), this.outlineW, this.scale);
};
// 총구 월드 좌표(총구 섬광용)
GunMesh.muzzleWorld=function(O,R,U,F,kick,extra){
  var s=this.scale, m=this.muzzle, o=originOf(O,R,U,F,kick||0,extra);
  return { x:o[0]+(R.x*m[0]+U.x*m[1]+F.x*m[2])*s,
           y:o[1]+(R.y*m[0]+U.y*m[1]+F.y*m[2])*s,
           z:o[2]+(R.z*m[0]+U.z*m[1]+F.z*m[2])*s };
};

/* ---------- 저장 ----------
   gunbaked.js 의 내용을 문자열로 만든다(tools/bake.html 이 서버에 보내 파일로 쓴다). */
GunMesh.serialize=function(){
  return '/* 자동 생성 파일 — 직접 고치지 마세요.\n'+
         '   tools/bake.html 이 .glb 를 구워 만든 정점 데이터입니다(위치·색·법선·인덱스).\n'+
         '   모델을 바꾸면 그 페이지를 열어 [굽기] 를 다시 누르세요. */\n'+
         'window.GUN_BAKED='+JSON.stringify(this.toBaked())+';\n';
};

/* ---------- 로드 ----------
   평소 경로: gunbaked.js 가 먼저 실려 있으면 그걸 쓴다(즉시·195KB·오프라인 OK).
   없으면 원본 .glb 를 받아 그 자리에서 굽는다(6MB, tools/bake.html 도 이 경로를 쓴다). */
GunMesh.init=function(glbUrl, done){
  if(this.ready||this.loading) return;
  if(global.GUN_BAKED){
    try{
      this.applyBaked(global.GUN_BAKED); this.ready=true;
      if(console&&console.log) console.log('[gunmesh] gunbaked.js — '+this.info);
      if(done) done(true); return;
    }catch(e){
      if(console&&console.warn) console.warn('[gunmesh] 구운 데이터를 못 씁니다('+e.message+') — 원본 .glb 로 시도합니다');
    }
  }
  this.load(glbUrl, done);
};

global.GunMesh=GunMesh;
})(window);
