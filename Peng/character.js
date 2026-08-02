/* PENG! 캐릭터 정의 — 게임(index.html)과 편집기(editor.html)가 함께 쓴다.
 *
 * 디자인 = { rig:{관절 위치·스윙}, parts:[부품...] }
 * 부품 = { n:이름, bone:붙는 뼈대, type:'box'|'cyl'|'dome'|'sph',
 *          x,y,z: 뼈대 기준 위치, 크기(박스 sx,sy,sz / 원통 r,h / 반구·구 r),
 *          col:'#rrggbb', flat:셰이딩 무시, line:외곽선 }
 * 뼈대: body/head 는 몸에 고정, armL/armR/legL/legR 은 관절에서 앞뒤로 흔들린다.
 *       팔다리 부품의 y 는 관절에서 아래로가 음수.
 * 외부에는 charFaces() 하나만 있으면 되고, 렌더러는 받은 월드 좌표 면을 그리면 된다.
 */
(function(global){
'use strict';

var BONES=['body','head','armL','armR','legL','legR'];
var BONE_LABEL={body:'몸통',head:'머리',armL:'왼팔',armR:'오른팔',legL:'왼다리',legR:'오른다리'};

// 기본 캐릭터 — 반구 머리 + 원통 몸통 + 팔다리
var DEFAULT={
  rig:{ shoulderX:0.44, shoulderY:1.34, hipX:0.135, hipY:0.58,
        swingArm:0.45, swingLeg:0.55, armSplay:0.12, gunArm:'armR', eyeH:1.60 },
  parts:[
    {n:'몸통', bone:'body', type:'cyl',  x:0, y:1.00, z:0,    r:0.38, h:0.42, col:'#ff8a3a'},
    {n:'머리', bone:'head', type:'dome', x:0, y:1.42, z:0,    r:0.42, col:'#ff8a3a'},
    {n:'왼 흰자',  bone:'head', type:'box', x:-0.16, y:1.60, z:0.33, sx:0.125, sy:0.15, sz:0.085, col:'#ffffff', flat:1},
    {n:'오른 흰자',bone:'head', type:'box', x: 0.16, y:1.60, z:0.33, sx:0.125, sy:0.15, sz:0.085, col:'#ffffff', flat:1},
    {n:'왼 눈동자',  bone:'head', type:'box', x:-0.16, y:1.59, z:0.40, sx:0.055, sy:0.075, sz:0.03, col:'#0d1626', flat:1},
    {n:'오른 눈동자',bone:'head', type:'box', x: 0.16, y:1.59, z:0.40, sx:0.055, sy:0.075, sz:0.03, col:'#0d1626', flat:1},
    {n:'왼팔',   bone:'armL', type:'box', x:0, y:-0.24, z:0, sx:0.058, sy:0.24, sz:0.065, col:'#2b3550', line:1},
    {n:'오른팔', bone:'armR', type:'box', x:0, y:-0.24, z:0, sx:0.058, sy:0.24, sz:0.065, col:'#2b3550', line:1},
    {n:'왼다리',   bone:'legL', type:'box', x:0, y:-0.29, z:0, sx:0.058, sy:0.29, sz:0.062, col:'#2b3550', line:1},
    {n:'오른다리', bone:'legR', type:'box', x:0, y:-0.29, z:0, sx:0.058, sy:0.29, sz:0.062, col:'#2b3550', line:1}
  ]
};

/* ---------- 부품 메시(부품 중심 기준 로컬 좌표) ---------- */
var MESH_CACHE={};
function key(p){
  if(p.type==='box')  return 'b'+f(p.sx)+'_'+f(p.sy)+'_'+f(p.sz);
  if(p.type==='cyl')  return 'c'+f(p.r)+'_'+f(p.h);
  if(p.type==='dome') return 'd'+f(p.r);
  return 's'+f(p.r);
}
function f(v){ return (+v||0).toFixed(3); }
function buildBox(sx,sy,sz){
  var x0=-sx,x1=sx,y0=-sy,y1=sy,z0=-sz,z1=sz;
  return [
    {n:[0,1,0],  v:[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]]},
    {n:[0,-1,0], v:[[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0]]},
    {n:[0,0,-1], v:[[x0,y1,z0],[x0,y0,z0],[x1,y0,z0],[x1,y1,z0]]},
    {n:[0,0,1],  v:[[x1,y1,z1],[x1,y0,z1],[x0,y0,z1],[x0,y1,z1]]},
    {n:[-1,0,0], v:[[x0,y1,z1],[x0,y0,z1],[x0,y0,z0],[x0,y1,z0]]},
    {n:[1,0,0],  v:[[x1,y1,z0],[x1,y0,z0],[x1,y0,z1],[x1,y1,z1]]}
  ];
}
function buildCyl(r,h){
  var S=16,out=[];
  for(var s=0;s<S;s++){
    var a0=s/S*6.2831853,a1=(s+1)/S*6.2831853;
    var c0=Math.cos(a0),z0=Math.sin(a0),c1=Math.cos(a1),z1=Math.sin(a1);
    var nx=(c0+c1)/2,nz=(z0+z1)/2,nl=Math.hypot(nx,nz)||1;
    out.push({n:[nx/nl,0,nz/nl], v:[[r*c0,h,r*z0],[r*c1,h,r*z1],[r*c1,-h,r*z1],[r*c0,-h,r*z0]]});
    out.push({n:[0,1,0],  v:[[0,h,0],[r*c0,h,r*z0],[r*c1,h,r*z1],[0,h,0]]});
    out.push({n:[0,-1,0], v:[[0,-h,0],[r*c1,-h,r*z1],[r*c0,-h,r*z0],[0,-h,0]]});
  }
  return out;
}
// 반구: 평평한 면이 아래, 적도가 y=0
function buildDome(r){ return sphereBand(r, 0, Math.PI/2); }
function buildSph(r){  return sphereBand(r, -Math.PI/2, Math.PI/2); }
function sphereBand(r, p0, p1){
  var S=16,K=6,rings=[],out=[];
  for(var t=0;t<=K;t++){ var phi=p0+(p1-p0)*(t/K); rings.push({y:r*Math.sin(phi), rr:r*Math.cos(phi)}); }
  for(var i=0;i<rings.length-1;i++){ var A=rings[i],B=rings[i+1];
    for(var s=0;s<S;s++){ var a0=s/S*6.2831853,a1=(s+1)/S*6.2831853;
      var v0=[A.rr*Math.cos(a0),A.y,A.rr*Math.sin(a0)], v1=[A.rr*Math.cos(a1),A.y,A.rr*Math.sin(a1)],
          v2=[B.rr*Math.cos(a1),B.y,B.rr*Math.sin(a1)], v3=[B.rr*Math.cos(a0),B.y,B.rr*Math.sin(a0)];
      var mx=(v0[0]+v1[0]+v2[0]+v3[0])/4,my=(v0[1]+v1[1]+v2[1]+v3[1])/4,mz=(v0[2]+v1[2]+v2[2]+v3[2])/4;
      var nl=Math.hypot(mx,my,mz)||1;
      out.push({n:[mx/nl,my/nl,mz/nl], v:[v0,v1,v2,v3]});
    } }
  return out;
}
function partMesh(p){
  var k=key(p), m=MESH_CACHE[k];
  if(m) return m;
  if(p.type==='box')       m=buildBox(+p.sx||0.1, +p.sy||0.1, +p.sz||0.1);
  else if(p.type==='cyl')  m=buildCyl(+p.r||0.2, +p.h||0.2);
  else if(p.type==='dome') m=buildDome(+p.r||0.2);
  else                     m=buildSph(+p.r||0.2);
  MESH_CACHE[k]=m; return m;
}

/* ---------- 뼈대 변환 ---------- */
function boneXform(rig, name, px,py,pz, R,U,F, walk){
  var arm = (name==='armL'||name==='armR'), leg=(name==='legL'||name==='legR');
  if(!arm && !leg) return {o:{x:px,y:py,z:pz}, R:R,U:U,F:F};
  var side = (name.charAt(3)==='R') ? 1 : -1;
  var sw=Math.sin(walk||0);
  // 총 든 팔은 고정, 반대 팔은 다리와 반대 위상
  var ang = arm ? ((rig.gunArm===name) ? 0.10 : sw*(+rig.swingArm||0))
                : sw*(+rig.swingLeg||0)*side;
  var ox = (arm ? (+rig.shoulderX||0) : (+rig.hipX||0)) * side;
  var oy =  arm ? (+rig.shoulderY||0) : (+rig.hipY||0);
  var o={ x:px+R.x*ox, y:py+oy, z:pz+R.z*ox };
  var c=Math.cos(ang), s=Math.sin(ang);
  var bU={x:U.x*c+F.x*s, y:U.y*c+F.y*s, z:U.z*c+F.z*s};
  var bF={x:F.x*c-U.x*s, y:F.y*c-U.y*s, z:F.z*c-U.z*s};
  var bR=R;
  var splay=+rig.armSplay||0;
  if(arm && splay){                         // 팔을 바깥으로 살짝 벌림
    var a2=-side*splay, c2=Math.cos(a2), s2=Math.sin(a2);
    var nR={x:bR.x*c2+bU.x*s2, y:bR.y*c2+bU.y*s2, z:bR.z*c2+bU.z*s2};
    bU={x:-bR.x*s2+bU.x*c2, y:-bR.y*s2+bU.y*c2, z:-bR.z*s2+bU.z*c2}; bR=nR;
  }
  return {o:o, R:bR, U:bU, F:bF};
}
function shade(nx,ny,nz){ var d=nx*0.32+ny*0.85-nz*0.42; return 0.55+0.45*(d>0?d:0); }

/* ---------- 월드 좌표 면 생성 ----------
 * 반환: [{v:[[x,y,z]x4], col:'#rrggbb', sh:0~1, line:bool}]
 * tint 를 주면 flat 이 아닌 부품의 색을 그것으로 덮어쓴다(팀 색 구분).
 */
function charFaces(design, px,py,pz, yaw, pitch, walk, tint){
  var d=design||DEFAULT, rig=d.rig||DEFAULT.rig, parts=d.parts||[];
  var R={x:Math.cos(yaw),y:0,z:-Math.sin(yaw)}, U={x:0,y:1,z:0}, F={x:Math.sin(yaw),y:0,z:Math.cos(yaw)};
  var cacheB={}, out=[];
  for(var i=0;i<parts.length;i++){
    var p=parts[i]; if(p.off) continue;
    var bn=p.bone||'body';
    var b=cacheB[bn] || (cacheB[bn]=boneXform(rig, bn, px,py,pz, R,U,F, walk));
    var mesh=partMesh(p), col=(tint && !p.flat) ? tint : (p.col||'#cccccc');
    var ox=+p.x||0, oy=+p.y||0, oz=+p.z||0;
    for(var m=0;m<mesh.length;m++){
      var face=mesh[m], v=face.v, w=[];
      for(var q=0;q<4;q++){
        var a=ox+v[q][0], bb=oy+v[q][1], c=oz+v[q][2];
        w.push([ b.o.x + b.R.x*a + b.U.x*bb + b.F.x*c,
                 b.o.y + b.R.y*a + b.U.y*bb + b.F.y*c,
                 b.o.z + b.R.z*a + b.U.z*bb + b.F.z*c ]);
      }
      var n=face.n;
      var wn={ x:b.R.x*n[0]+b.U.x*n[1]+b.F.x*n[2],
               y:b.R.y*n[0]+b.U.y*n[1]+b.F.y*n[2],
               z:b.R.z*n[0]+b.U.z*n[1]+b.F.z*n[2] };
      out.push({ v:w, col:col, sh:p.flat?1:shade(wn.x,wn.y,wn.z), line:!!p.line });
    }
  }
  return out;
}

/* ---------- 저장/불러오기 ---------- */
var STORE='peng.design';
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function load(){
  try{ var raw=(global.localStorage||{}).getItem ? global.localStorage.getItem(STORE) : null;
    if(raw){ var d=JSON.parse(raw); if(d && d.parts && d.rig) return sanitize(d); } }catch(e){}
  return clone(DEFAULT);
}
function save(d){ try{ global.localStorage.setItem(STORE, JSON.stringify(d)); return true; }catch(e){ return false; } }
// 외부(다른 플레이어·붙여넣기)에서 온 디자인을 안전한 값만 남겨 정리
var NUM=['x','y','z','sx','sy','sz','r','h'];
var RIGNUM=['shoulderX','shoulderY','hipX','hipY','swingArm','swingLeg','armSplay','eyeH'];
function num(v,dflt,lo,hi){ v=parseFloat(v); if(!isFinite(v)) return dflt; return Math.max(lo,Math.min(hi,v)); }
function col(v,dflt){ return (typeof v==='string' && /^#[0-9a-fA-F]{6}$/.test(v)) ? v : dflt; }
function sanitize(d){
  var r={}, dr=DEFAULT.rig;
  for(var i=0;i<RIGNUM.length;i++){ var k=RIGNUM[i]; r[k]=num((d.rig||{})[k], dr[k], -5, 5); }
  r.gunArm = (d.rig && (d.rig.gunArm==='armL'||d.rig.gunArm==='armR')) ? d.rig.gunArm : 'armR';
  var src=(d.parts||[]).slice(0,60), parts=[];
  for(var j=0;j<src.length;j++){
    var p=src[j]||{}, q={};
    q.type = (p.type==='cyl'||p.type==='dome'||p.type==='sph') ? p.type : 'box';
    q.bone = BONES.indexOf(p.bone)>=0 ? p.bone : 'body';
    q.n = (typeof p.n==='string') ? p.n.slice(0,20) : ('부품'+(j+1));
    for(var t=0;t<NUM.length;t++){ var kk=NUM[t]; if(p[kk]!=null) q[kk]=num(p[kk],0.1,-5,5); }
    if(q.type==='box'){ q.sx=num(q.sx,0.1,0.005,3); q.sy=num(q.sy,0.1,0.005,3); q.sz=num(q.sz,0.1,0.005,3); }
    else { q.r=num(q.r,0.2,0.01,3); if(q.type==='cyl') q.h=num(q.h,0.2,0.005,3); }
    q.x=num(q.x,0,-5,5); q.y=num(q.y,0,-5,5); q.z=num(q.z,0,-5,5);
    q.col=col(p.col,'#cccccc'); if(p.flat) q.flat=1; if(p.line) q.line=1; if(p.off) q.off=1;
    parts.push(q);
  }
  return {rig:r, parts:parts};
}

global.PengChar={ DEFAULT:DEFAULT, BONES:BONES, BONE_LABEL:BONE_LABEL,
  faces:charFaces, load:load, save:save, sanitize:sanitize, clone:clone, STORE:STORE };
})(typeof window!=='undefined'?window:this);
