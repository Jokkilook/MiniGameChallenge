/* PUNG! — 플레이어 캐릭터 메시(Mesh/SK_Player.glb)
 *
 * 총·아이템(meshlib.js)과 달리 이건 **움직이는** 메시라 파이프라인이 하나 더 필요하다.
 * 지금까지의 메시는 텍스처를 정점색에 구워 정적 VBO 로 올렸다. 캐릭터에 그걸 그대로 쓰면
 * 두 가지가 무너진다:
 *   1) 정점 6205 개에 얼굴(눈·부리)이 뭉개진다 — 굽기는 정점 단위라 텍스처보다 훨씬 성기다.
 *   2) 뼈대가 움직이면 정점이 옮겨가는데, 구워둔 명암은 원래 자리의 것이라 같이 안 따라간다.
 * 그래서 캐릭터만 전용 셰이더를 쓴다: 텍스처를 그대로 샘플링하고, 스키닝(본 15개)과
 * 음영을 GPU 에서 계산한다. 나머지 파이프라인(정점색)은 손대지 않는다.
 *
 * 뼈대: spine×7 + pelvis.L/R + thigh/shin/foot ×2 = 15. 팔 본은 없다(총은 몸에 붙인다).
 * 애니메이션: Walk 한 벌(0.92초). 실제로 키가 찍힌 채널은 thigh.L/R 의 회전뿐이라
 * 무릎·발은 아직 안 접힌다 — 블렌더에서 키를 더 얹으면 여기는 그대로 두고도 좋아진다.
 * 정지 상태에는 쓸 동작이 없으므로 바인드 포즈로 부드럽게 돌아간다.
 *
 * 포즈는 **미리 구워둔다**. 매 프레임 노드 계층을 훑어 행렬을 만드는 대신, 굽는 시점에
 * 24fps 로 한 바퀴를 떠서 (프레임 × 본 × 4x3) 로 저장한다 — 17KB 다. 런타임에 남는 일은
 * 두 프레임 사이 보간뿐이고, 그 결과를 uniform 으로 올린다(플레이어당 드로우콜 1개).
 *
 * 좌표계: glTF 는 오른손(+Z 가 화면 앞), 이 게임은 왼손(+Z 가 캐릭터 앞)이다. 오른손 →
 * 왼손 변환에는 반드시 거울이 한 번 들어간다(meshlib 이 (x,y,-z) 를 쓰는 것과 같은 이유).
 * 이 모델은 부리와 발이 +Z 를 보고 있어서 (-x, y, z) 로 뒤집는다 — 그래야 게임의 '앞'과
 * 모델의 '앞'이 그대로 맞아 yaw 보정이 필요 없다. 본 행렬도 같은 거울로 켤레를 취한다.
 * 감기 방향은 meshlib 과 같은 규약(바깥면 CW)을 따라 인덱스를 뒤집는다 — 윤곽선 껍질이
 * BACK 컬링을 전제로 하기 때문이다.
 */
(function(global){
'use strict';

if(!global.MeshLib){
  if(console&&console.warn) console.warn('[charmesh] meshlib.js 가 먼저 실려야 합니다 — 캡슐 캐릭터로 그립니다');
  return;
}
var ML=global.MeshLib;

var BAKE_VER=1;
var FPS=24;                       // 포즈를 굽는 프레임률(원본 키가 24fps 로 찍혀 있다)
var TEX=1024;                     // 구운 텍스처 한 변(2의 거듭제곱이라 밉맵·REPEAT 가 그대로 된다)
var MIRROR=[-1,1,1];              // 오른손 → 왼손. x 만 뒤집는다(위 주석)

var CharMesh={
  ready:false, loading:false, err:null, info:'',
  /* 배치 — 바인드 포즈의 발바닥이 모델 y=-1, 정수리가 +1 이다(높이 2유닛).
     scale 0.9 → 키 1.8m 로, 지금까지 쓰던 캡슐(0.35r·0.55h → 1.8m)과 같다. */
  scale:0.90,
  foot:1.00,          // 발바닥의 모델 y(부호 반전). 원점을 발밑에 맞추는 데 쓴다
  outlineW:0.020,     // 윤곽선 두께(월드 단위)
  /* 팀 색을 텍스처에 얼마나 섞을지. 0 이면 원화 그대로지만 누가 누군지 구분이 안 되고,
     1 이면 색만 남고 그림이 죽는다. 원화를 살리는 쪽으로 낮게 잡는다. */
  tint:0.40,
  stride:1.50,        // 걷기 한 주기가 나아가는 거리(m) — 발이 미끄러지면 이걸 맞춘다
  M:null,             // 정점 {pos,nrm,uv,jnt,wgt,idx,n,min,max}
  POSE:null,          // {J,F,dur,data,rest}
  texURI:null,        // 구운 베이스컬러(데이터 URI)
  _gl:null, _vbo:null, _ibo:null, _prog:null, _tex:null, _texImg:null, _scratch:null
};

/* ---------- 행렬(열 우선 4x4, index.html 의 mat4Mul 과 같은 규약) ---------- */
function trsMat(t,r,s){
  var x=r[0],y=r[1],z=r[2],w=r[3];
  var m=[1-2*(y*y+z*z), 2*(x*y+z*w), 2*(x*z-y*w), 0,
         2*(x*y-z*w), 1-2*(x*x+z*z), 2*(y*z+x*w), 0,
         2*(x*z+y*w), 2*(y*z-x*w), 1-2*(x*x+y*y), 0,
         0,0,0,1];
  for(var c=0;c<3;c++) for(var r2=0;r2<3;r2++) m[c*4+r2]*=s[c];
  m[12]=t[0]; m[13]=t[1]; m[14]=t[2];
  return m;
}

/* ---------- 애니메이션 샘플링 ---------- */
// 채널 하나를 시각 t 에서 뽑는다. STEP·LINEAR 를 지원하고, 회전만 구면 보간한다.
function sampleChan(ch, t, out){
  var T=ch.t, V=ch.v, n=ch.n, cnt=T.length;
  var i=0;
  if(t<=T[0]) i=0;
  else if(t>=T[cnt-1]) i=cnt-1;
  else { while(i<cnt-2 && T[i+1]<t) i++; }
  var j=Math.min(cnt-1, i+1);
  var f = (ch.step || j===i || T[j]===T[i]) ? 0 : (t-T[i])/(T[j]-T[i]);
  var a=i*n, b=j*n, k;
  if(n===4 && ch.rot && f>0){
    // 쿼터니언 구면 보간. 부호를 맞춰 짧은 쪽으로 돈다.
    var d=V[a]*V[b]+V[a+1]*V[b+1]+V[a+2]*V[b+2]+V[a+3]*V[b+3], sg=d<0?-1:1;
    d=Math.abs(d);
    var w0, w1;
    if(d>0.9995){ w0=1-f; w1=f; }                 // 거의 같은 회전 — 선형이 더 안전하다
    else { var th=Math.acos(d), si=Math.sin(th); w0=Math.sin((1-f)*th)/si; w1=Math.sin(f*th)/si; }
    w1*=sg;
    var L=0;
    for(k=0;k<4;k++){ out[k]=V[a+k]*w0+V[b+k]*w1; L+=out[k]*out[k]; }
    L=Math.sqrt(L)||1; for(k=0;k<4;k++) out[k]/=L;
  } else {
    for(k=0;k<n;k++) out[k]=V[a+k]+(V[b+k]-V[a+k])*f;
  }
  return out;
}

/* 노드별 애니메이션 채널 표를 만든다: nodeIdx → {t:{...}, r:{...}, s:{...}} */
function channelTable(g, anim){
  var tbl={}, json=g.json;
  if(!anim) return tbl;
  for(var i=0;i<anim.channels.length;i++){
    var c=anim.channels[i], sm=anim.samplers[c.sampler];
    if(c.target.node==null) continue;
    var path=c.target.path;
    if(path!=='translation'&&path!=='rotation'&&path!=='scale') continue;   // 모프는 안 쓴다
    var interp=sm.interpolation||'LINEAR';
    var stride=(interp==='CUBICSPLINE')?3:1;      // 큐빅은 [접선,값,접선] 이라 가운데만 쓴다
    var vals=ML.readAccessor(g, sm.output), times=ML.readAccessor(g, sm.input);
    var n=(path==='rotation')?4:3;
    if(stride===3){                                // 값만 뽑아 LINEAR 로 낮춘다
      var v2=new Float32Array(times.length*n);
      for(var k=0;k<times.length;k++) for(var q=0;q<n;q++) v2[k*n+q]=vals[(k*3+1)*n+q];
      vals=v2;
    }
    var e=tbl[c.target.node] || (tbl[c.target.node]={});
    e[path.charAt(0)] = {t:times, v:vals, n:n, step:(interp==='STEP'), rot:(path==='rotation')};
  }
  return tbl;
}

/* 시각 t 에서 모든 관절의 스키닝 행렬(4x3, 거울 적용)을 out 에 채운다. */
var _t=[0,0,0], _r=[0,0,0,1], _s=[1,1,1];
function posePack(g, skin, ibm, tbl, t, out){
  var json=g.json, nodes=json.nodes, joints=skin.joints;
  var globals=new Array(nodes.length);
  // 씬 루트부터 내려가며 전역 변환을 만든다(부모가 먼저 필요하다)
  var roots=(json.scenes&&json.scenes[json.scene||0]&&json.scenes[json.scene||0].nodes)
            || nodes.map(function(_,i){return i;});
  var stack=[];
  for(var i=roots.length-1;i>=0;i--) stack.push({n:roots[i], p:null});
  while(stack.length){
    var it=stack.pop(), nd=nodes[it.n], ch=tbl[it.n];
    var loc;
    if(ch){
      var tt=(nd.translation||[0,0,0]), rr=(nd.rotation||[0,0,0,1]), ss=(nd.scale||[1,1,1]);
      if(ch.t) sampleChan(ch.t, t, _t); else { _t[0]=tt[0]; _t[1]=tt[1]; _t[2]=tt[2]; }
      if(ch.r) sampleChan(ch.r, t, _r); else { _r[0]=rr[0]; _r[1]=rr[1]; _r[2]=rr[2]; _r[3]=rr[3]; }
      if(ch.s) sampleChan(ch.s, t, _s); else { _s[0]=ss[0]; _s[1]=ss[1]; _s[2]=ss[2]; }
      loc=trsMat(_t,_r,_s);
    } else loc=ML.nodeMatrix(nd);
    globals[it.n] = it.p==null ? loc : ML.mul(globals[it.p], loc);
    var kids=nd.children||[];
    for(var c2=kids.length-1;c2>=0;c2--) stack.push({n:kids[c2], p:it.n});
  }
  // skin = global(joint) · inverseBind, 그 다음 거울 켤레 A·M·A (A=diag(-1,1,1))
  var sx=MIRROR[0], sy=MIRROR[1], sz=MIRROR[2], sg=[sx,sy,sz];
  for(var j=0;j<joints.length;j++){
    var G=globals[joints[j]] || [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    var B=new Array(16);
    for(var c=0;c<16;c++) B[c]=ibm[j*16+c];
    var m=ML.mul(G, B);
    var o=j*12;
    for(var r=0;r<3;r++) for(var cc=0;cc<4;cc++){
      var v=m[cc*4+r];
      out[o+r*4+cc] = v * sg[r] * (cc<3?sg[cc]:1);    // (i,j) *= s_i·s_j, 이동 열은 s_i 만
    }
  }
  return out;
}

/* ---------- 정점 ---------- */
function buildGeom(g){
  var json=g.json, mesh=json.meshes[0], prim=null;
  for(var i=0;i<mesh.primitives.length;i++){
    var p=mesh.primitives[i];
    if((p.mode==null||p.mode===4) && p.attributes && p.attributes.POSITION!=null){ prim=p; break; }
  }
  if(!prim) throw new Error('삼각형 프리미티브가 없음');
  if(prim.attributes.JOINTS_0==null || prim.attributes.WEIGHTS_0==null)
    throw new Error('스킨(JOINTS_0/WEIGHTS_0)이 없는 메시입니다 — 리깅된 .glb 인지 확인하세요');

  var P=ML.readAccessor(g, prim.attributes.POSITION);
  var N=prim.attributes.NORMAL!=null ? ML.readAccessor(g, prim.attributes.NORMAL) : null;
  var T=prim.attributes.TEXCOORD_0!=null ? ML.readAccessor(g, prim.attributes.TEXCOORD_0) : null;
  var J=ML.readAccessor(g, prim.attributes.JOINTS_0);
  var W=ML.readAccessor(g, prim.attributes.WEIGHTS_0);
  var IDX=prim.indices!=null ? ML.readAccessor(g, prim.indices) : null;
  var n=P.length/3;
  if(n>65535) throw new Error('정점이 65535 개를 넘음(uint16 인덱스 불가): '+n);

  var pos=new Float32Array(n*3), nrm=new Float32Array(n*3), uv=new Float32Array(n*2);
  var jnt=new Uint8Array(n*4), wgt=new Float32Array(n*4);
  var mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9], umn=[1e9,1e9], umx=[-1e9,-1e9];
  var sx=MIRROR[0], sy=MIRROR[1], sz=MIRROR[2], v, a, k;
  for(v=0;v<n;v++){
    pos[v*3]=P[v*3]*sx; pos[v*3+1]=P[v*3+1]*sy; pos[v*3+2]=P[v*3+2]*sz;
    for(a=0;a<3;a++){ var q=pos[v*3+a]; if(q<mn[a])mn[a]=q; if(q>mx[a])mx[a]=q; }
    if(N){
      var nx=N[v*3]*sx, ny=N[v*3+1]*sy, nz=N[v*3+2]*sz, nl=Math.hypot(nx,ny,nz)||1;
      nrm[v*3]=nx/nl; nrm[v*3+1]=ny/nl; nrm[v*3+2]=nz/nl;
    } else nrm[v*3+1]=1;
    uv[v*2]=T?T[v*2]:0; uv[v*2+1]=T?T[v*2+1]:0;
    for(a=0;a<2;a++){ var u2=uv[v*2+a]; if(u2<umn[a])umn[a]=u2; if(u2>umx[a])umx[a]=u2; }
    // 가중치 합을 1 로 맞춘다(파일에 따라 0.999… 로 어긋나 있고, 그대로 두면 살짝 오그라든다)
    var s=0;
    for(k=0;k<4;k++) s+=W[v*4+k];
    if(s<=1e-6){ wgt[v*4]=1; }
    else for(k=0;k<4;k++) wgt[v*4+k]=W[v*4+k]/s;
    for(k=0;k<4;k++) jnt[v*4+k]=J[v*4+k];
  }
  var idx;
  if(IDX){ idx=new Uint16Array(IDX.length);
    for(k=0;k<IDX.length;k+=3){ idx[k]=IDX[k]; idx[k+1]=IDX[k+2]; idx[k+2]=IDX[k+1]; } }
  else { idx=new Uint16Array(n); for(k=0;k<n;k+=3){ idx[k]=k; idx[k+1]=k+2; idx[k+2]=k+1; } }

  return {pos:pos, nrm:nrm, uv:uv, jnt:jnt, wgt:wgt, idx:idx, n:n,
          min:mn, max:mx, uvMin:umn, uvMax:umx};
}

/* ---------- 포즈 굽기 ---------- */
function buildPose(g){
  var json=g.json, skin=json.skins&&json.skins[0];
  if(!skin) throw new Error('스킨이 없습니다');
  var ibm = skin.inverseBindMatrices!=null ? ML.readAccessor(g, skin.inverseBindMatrices) : null;
  var Jn=skin.joints.length;
  if(!ibm){ ibm=new Float32Array(Jn*16); for(var q=0;q<Jn;q++) for(var d=0;d<4;d++) ibm[q*16+d*4+d]=1; }
  if(Jn>64) throw new Error('본이 너무 많습니다('+Jn+') — uniform 한도를 넘습니다');

  var anim=(json.animations&&json.animations[0])||null;
  var tbl=channelTable(g, anim);
  // 클립 길이 = 모든 입력 접근자의 최대 시각
  var dur=0;
  if(anim) for(var i=0;i<anim.samplers.length;i++){
    var ac=json.accessors[anim.samplers[i].input];
    if(ac && ac.max && ac.max[0]>dur) dur=ac.max[0];
  }
  var F = dur>0 ? Math.max(2, Math.round(dur*FPS)) : 1;
  var data=new Float32Array(F*Jn*12), frame=new Float32Array(Jn*12);
  for(var f=0;f<F;f++){
    posePack(g, skin, ibm, tbl, dur*f/F, frame);   // 마지막 프레임이 0 번으로 이어지게 F 로 나눈다
    data.set(frame, f*Jn*12);
  }
  var rest=new Float32Array(Jn*12);
  posePack(g, skin, ibm, {}, 0, rest);             // 채널 없이 = 바인드 포즈(대기 자세)
  return {J:Jn, F:F, dur:dur||1, data:data, rest:rest,
          names:skin.joints.map(function(nd){ return (json.nodes[nd]||{}).name||('joint'+nd); })};
}

/* ---------- 텍스처 굽기 ----------
   베이스컬러만 쓴다(노멀·러프니스는 이 셰이더가 안 읽는다). 원본은 4K JPEG 3장 = 7MB 라
   그대로 들고 다닐 수 없다. 1024 정사각으로 줄여 JPEG 로 다시 뽑으면 200KB 안팎이고,
   데이터 URI 라 <script src> 로 실려 file:// 에서도 그대로 나온다. */
function bakeTexture(g, ok, fail){
  var json=g.json, imgIdx=null;
  try{
    var prim=json.meshes[0].primitives[0];
    var mat=json.materials[prim.material];
    imgIdx=json.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source;
  }catch(e){ imgIdx=null; }
  if(imgIdx==null && json.images && json.images.length) imgIdx=0;
  if(imgIdx==null){ ok(null); return; }
  var im=json.images[imgIdx];
  if(im.bufferView==null){ ok(null); return; }        // 외부 URI 이미지는 지원 안 함
  var bv=json.bufferViews[im.bufferView];
  var bytes=new Uint8Array(g.ab, g.binOff+(bv.byteOffset||0), bv.byteLength);
  var url=URL.createObjectURL(new Blob([bytes],{type:im.mimeType||'image/jpeg'}));
  var img=new Image();
  img.onload=function(){
    var cv=document.createElement('canvas'); cv.width=TEX; cv.height=TEX;
    cv.getContext('2d').drawImage(img,0,0,TEX,TEX);   // 정사각으로 늘린다 — UV 는 정규화라 상관없다
    var uri;
    try{ uri=cv.toDataURL('image/jpeg',0.88); }catch(e){ URL.revokeObjectURL(url); fail(e); return; }
    URL.revokeObjectURL(url); ok(uri);
  };
  img.onerror=function(){ URL.revokeObjectURL(url); fail(new Error('텍스처 디코드 실패')); };
  img.src=url;
}

/* ---------- 셰이더 ----------
   본 행렬은 4x3 을 vec4 세 개로 넣는다(mat4 로 넣으면 uniform 벡터를 4/3 배 먹는다).
   uInflate 는 윤곽선 껍질을 부풀리는 양, uUseFlat 은 그 껍질을 단색으로 칠하는 스위치다. */
function vsSrc(J){
  return 'attribute vec3 aPos;attribute vec3 aNrm;attribute vec2 aUV;'+
    'attribute vec4 aJnt;attribute vec4 aWgt;'+
    'uniform mat4 uVP;uniform mat4 uModel;uniform vec4 uBone['+(J*3)+'];uniform float uInflate;'+
    'varying vec2 vUV;varying float vSh;'+
    'const vec3 L=vec3(0.3198,0.8494,-0.4197);'+          // 캡슐 음영과 같은 광원(위+앞)
    'mat4 boneMat(int i){vec4 a=uBone[i*3];vec4 b=uBone[i*3+1];vec4 c=uBone[i*3+2];'+
    'return mat4(a.x,b.x,c.x,0.0, a.y,b.y,c.y,0.0, a.z,b.z,c.z,0.0, a.w,b.w,c.w,1.0);}'+
    'void main(){'+
    'mat4 sk=aWgt.x*boneMat(int(aJnt.x))+aWgt.y*boneMat(int(aJnt.y))'+
    '+aWgt.z*boneMat(int(aJnt.z))+aWgt.w*boneMat(int(aJnt.w));'+
    'vec3 p=(sk*vec4(aPos,1.0)).xyz;'+
    'vec3 nl=normalize((sk*vec4(aNrm,0.0)).xyz);'+
    'p+=nl*uInflate;'+
    'vec4 wp=uModel*vec4(p,1.0);'+
    'vec3 wn=normalize((uModel*vec4(nl,0.0)).xyz);'+
    'vSh=0.55+0.45*max(0.0,dot(wn,L));'+
    'vUV=aUV;gl_Position=uVP*wp;}';
}
var FS_CHAR='precision mediump float;varying vec2 vUV;varying float vSh;'+
  'uniform sampler2D uTex;uniform vec3 uTint;uniform vec3 uFlat;uniform float uUseFlat;'+
  'void main(){vec3 c=texture2D(uTex,vUV).rgb*uTint*vSh;'+
  'gl_FragColor=vec4(mix(c,uFlat,uUseFlat),1.0);}';

CharMesh.ensureGL=function(gl){
  if(this._gl===gl && this._prog && this._vbo) return true;
  var M=this.M, P=this.POSE;
  if(!M||!P) return false;
  this._gl=gl;
  // 프로그램
  function sh(t,src){ var s=gl.createShader(t); gl.shaderSource(s,src); gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s; }
  var pr=gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vsSrc(P.J)));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS_CHAR));
  gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  pr.aPos=gl.getAttribLocation(pr,'aPos'); pr.aNrm=gl.getAttribLocation(pr,'aNrm');
  pr.aUV =gl.getAttribLocation(pr,'aUV');  pr.aJnt=gl.getAttribLocation(pr,'aJnt');
  pr.aWgt=gl.getAttribLocation(pr,'aWgt');
  pr.uVP=gl.getUniformLocation(pr,'uVP');       pr.uModel=gl.getUniformLocation(pr,'uModel');
  pr.uBone=gl.getUniformLocation(pr,'uBone');   pr.uInflate=gl.getUniformLocation(pr,'uInflate');
  pr.uTex=gl.getUniformLocation(pr,'uTex');     pr.uTint=gl.getUniformLocation(pr,'uTint');
  pr.uFlat=gl.getUniformLocation(pr,'uFlat');   pr.uUseFlat=gl.getUniformLocation(pr,'uUseFlat');
  this._prog=pr;

  // 정점 — pos3 + nrm3 + uv2 + jnt4 + wgt4 = 16 float
  var n=M.n, inter=new Float32Array(n*16);
  for(var v=0;v<n;v++){
    var o=v*16;
    inter[o]=M.pos[v*3]; inter[o+1]=M.pos[v*3+1]; inter[o+2]=M.pos[v*3+2];
    inter[o+3]=M.nrm[v*3]; inter[o+4]=M.nrm[v*3+1]; inter[o+5]=M.nrm[v*3+2];
    inter[o+6]=M.uv[v*2]; inter[o+7]=M.uv[v*2+1];
    for(var k=0;k<4;k++){ inter[o+8+k]=M.jnt[v*4+k]; inter[o+12+k]=M.wgt[v*4+k]; }
  }
  this._vbo=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this._vbo);
  gl.bufferData(gl.ARRAY_BUFFER,inter,gl.STATIC_DRAW);
  this._ibo=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this._ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,M.idx,gl.STATIC_DRAW);

  // 텍스처 — 이미지가 아직 안 왔으면 흰 1픽셀로 시작한다(그림만 늦게 나타난다)
  this._tex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,this._tex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  this._texUp=false;
  this.uploadTex(gl);
  return true;
};
// 데이터 URI → GL 텍스처. 디코드가 끝나야 올라가므로 한 프레임쯤 흰 몸으로 보일 수 있다.
CharMesh.uploadTex=function(gl){
  if(this._texUp || !this.texURI || !this._tex) return;
  this._texUp=true;
  var self=this, img=new Image();
  img.onload=function(){
    gl.bindTexture(gl.TEXTURE_2D, self._tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);   // glTF UV 는 좌상단 기준 = 캔버스와 같다
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    self._texImg=img;
  };
  img.onerror=function(){ self._texUp=false; };
  img.src=this.texURI;
};

/* ---------- 포즈 계산 ----------
   phase: 걷기 위상(0~1, 넘어가면 알아서 감는다), mv: 0=대기 포즈, 1=걷기.
   프레임 사이는 4x3 성분을 그냥 선형으로 섞는다 — 24fps 이웃 프레임끼리라 회전이
   1도 남짓이고, 그 정도에서는 구면 보간과 눈으로 구분되지 않는다. */
CharMesh.pose=function(phase, mv){
  var P=this.POSE;
  if(!P) return null;
  var L=P.J*12;
  var out=this._scratch || (this._scratch=new Float32Array(L));
  var F=P.F, d=P.data, rst=P.rest;
  var x=(phase-Math.floor(phase))*F, i0=Math.floor(x)%F, f=x-Math.floor(x), i1=(i0+1)%F;
  var a=i0*L, b=i1*L, k, w;
  if(mv>=0.999){ for(k=0;k<L;k++) out[k]=d[a+k]+(d[b+k]-d[a+k])*f; }
  else if(mv<=0.001){ for(k=0;k<L;k++) out[k]=rst[k]; }
  else for(k=0;k<L;k++){ w=d[a+k]+(d[b+k]-d[a+k])*f; out[k]=rst[k]+(w-rst[k])*mv; }
  return out;
};

/* 모델 행렬 — 발밑 (x,y,z) 에 세우고 yaw 로 돌린다(게임 기저: R=오른쪽, F=앞). */
CharMesh.modelMat=function(x,y,z,yaw){
  var s=this.scale, c=Math.cos(yaw), sn=Math.sin(yaw);
  return new Float32Array([ c*s,0,-sn*s,0,  0,s,0,0,  sn*s,0,c*s,0,
                            x, y+this.foot*s, z, 1 ]);
};

/* ---------- 그리기 ----------
   전용 프로그램을 쓰므로 호출부는 끝난 뒤 자기 프로그램으로 되돌려야 한다. */
function bindAttribs(gl, pr){
  gl.enableVertexAttribArray(pr.aPos); gl.vertexAttribPointer(pr.aPos,3,gl.FLOAT,false,64,0);
  gl.enableVertexAttribArray(pr.aNrm); gl.vertexAttribPointer(pr.aNrm,3,gl.FLOAT,false,64,12);
  gl.enableVertexAttribArray(pr.aUV);  gl.vertexAttribPointer(pr.aUV,2,gl.FLOAT,false,64,24);
  gl.enableVertexAttribArray(pr.aJnt); gl.vertexAttribPointer(pr.aJnt,4,gl.FLOAT,false,64,32);
  gl.enableVertexAttribArray(pr.aWgt); gl.vertexAttribPointer(pr.aWgt,4,gl.FLOAT,false,64,48);
}
function hexRGB(hex){
  if(typeof hex!=='string'||!/^#[0-9a-fA-F]{6}$/.test(hex)) return [1,1,1];
  return [parseInt(hex.substr(1,2),16)/255, parseInt(hex.substr(3,2),16)/255, parseInt(hex.substr(5,2),16)/255];
}
// 팀 색 섞기 — 원화를 살리려고 흰색(=원색 그대로)에서 팀 색 쪽으로 tint 만큼만 당긴다
CharMesh.tintOf=function(col){
  var c=hexRGB(col), k=Math.max(0,Math.min(1,this.tint));
  return [1+(c[0]-1)*k, 1+(c[1]-1)*k, 1+(c[2]-1)*k];
};
CharMesh.draw=function(gl, VP, model, bones, col){
  if(!this.ready || !this.ensureGL(gl)) return false;
  var pr=this._prog;
  gl.useProgram(pr);
  gl.uniformMatrix4fv(pr.uVP,false,VP);
  gl.uniformMatrix4fv(pr.uModel,false,model);
  gl.uniform4fv(pr.uBone, bones||this.POSE.rest);
  gl.uniform1f(pr.uInflate, 0);
  gl.uniform1f(pr.uUseFlat, 0);
  var t=this.tintOf(col);
  gl.uniform3f(pr.uTint, t[0],t[1],t[2]);
  gl.uniform3f(pr.uFlat, 0,0,0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this._tex);
  gl.uniform1i(pr.uTex,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,this._vbo); bindAttribs(gl,pr);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this._ibo);
  gl.drawElements(gl.TRIANGLES,this.M.idx.length,gl.UNSIGNED_SHORT,0);
  return true;
};
/* 윤곽선 껍질. 호출부가 CULL_FACE/BACK 을 켠 상태에서 부른다(바깥면 CW 규약).
   부풀리는 양은 월드 단위로 받아 모델 배율로 환산한다. */
var OUTLINE_COL=[0.04,0.06,0.10];
CharMesh.drawOutline=function(gl, VP, model, bones, wWorld){
  if(!this.ready || wWorld<=0 || !this.ensureGL(gl)) return false;
  var pr=this._prog;
  gl.useProgram(pr);
  gl.uniformMatrix4fv(pr.uVP,false,VP);
  gl.uniformMatrix4fv(pr.uModel,false,model);
  gl.uniform4fv(pr.uBone, bones||this.POSE.rest);
  gl.uniform1f(pr.uInflate, wWorld/Math.max(1e-4,this.scale));
  gl.uniform1f(pr.uUseFlat, 1);
  gl.uniform3f(pr.uFlat, OUTLINE_COL[0],OUTLINE_COL[1],OUTLINE_COL[2]);
  gl.uniform3f(pr.uTint, 1,1,1);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,this._tex);
  gl.uniform1i(pr.uTex,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,this._vbo); bindAttribs(gl,pr);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this._ibo);
  gl.drawElements(gl.TRIANGLES,this.M.idx.length,gl.UNSIGNED_SHORT,0);
  return true;
};

/* ---------- 구운 결과 저장/복원 ----------
   원본 .glb 는 5.3MB(4K 텍스처 3장)다. 게임이 쓰는 건 정점·본 포즈·베이스컬러뿐이라
   위치 uint16 · 법선 int8 · UV uint16 · 관절 uint8 · 가중치 uint8 · 포즈 float32 로
   뽑으면 텍스처까지 합쳐 500KB 안쪽이 된다. <script src> 로 읽히므로 file:// 도 된다. */
CharMesh.toBaked=function(){
  var M=this.M, P=this.POSE;
  if(!M||!P) throw new Error('아직 구운 캐릭터가 없습니다');
  var n=M.n, mn=M.min, mx=M.max, umn=M.uvMin, umx=M.uvMax;
  var sc=[mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]];
  var usc=[umx[0]-umn[0], umx[1]-umn[1]];
  var Q=new Uint16Array(n*3), NR=new Int8Array(n*3), U=new Uint16Array(n*2),
      JT=new Uint8Array(n*4), WT=new Uint8Array(n*4);
  for(var v=0;v<n;v++){
    var a;
    for(a=0;a<3;a++){
      var t=sc[a]>1e-9 ? (M.pos[v*3+a]-mn[a])/sc[a] : 0;
      Q[v*3+a]=Math.max(0,Math.min(65535,Math.round(t*65535)));
      NR[v*3+a]=Math.max(-127,Math.min(127,Math.round(M.nrm[v*3+a]*127)));
    }
    for(a=0;a<2;a++){
      var u=usc[a]>1e-9 ? (M.uv[v*2+a]-umn[a])/usc[a] : 0;
      U[v*2+a]=Math.max(0,Math.min(65535,Math.round(u*65535)));
    }
    // 가중치는 uint8 로 줄이고, 복원할 때 합을 다시 1 로 맞춘다
    for(a=0;a<4;a++){ JT[v*4+a]=M.jnt[v*4+a]; WT[v*4+a]=Math.round(M.wgt[v*4+a]*255); }
  }
  function f32(arr){ return ML.b64enc(new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength)); }
  return { v:BAKE_VER, n:n, mn:mn, mx:mx, umn:umn, umx:umx,
    p:f32(Q), nr:ML.b64enc(new Uint8Array(NR.buffer)), uv:f32(U),
    jt:ML.b64enc(JT), wt:ML.b64enc(WT), i:f32(M.idx),
    J:P.J, F:P.F, dur:P.dur, po:f32(P.data), rp:f32(P.rest), bn:P.names,
    tex:this.texURI||null };
};
CharMesh.applyBaked=function(o){
  if(!o || o.v!==BAKE_VER) throw new Error('구운 데이터의 형식 버전이 다릅니다');
  var n=o.n, mn=o.mn, mx=o.mx, umn=o.umn, umx=o.umx;
  var Q=new Uint16Array(ML.b64dec(o.p).buffer), NR=new Int8Array(ML.b64dec(o.nr).buffer),
      U=new Uint16Array(ML.b64dec(o.uv).buffer), JT=ML.b64dec(o.jt), WT=ML.b64dec(o.wt),
      idx=new Uint16Array(ML.b64dec(o.i).buffer);
  if(Q.length!==n*3 || JT.length!==n*4) throw new Error('구운 데이터의 길이가 안 맞습니다');
  var pos=new Float32Array(n*3), nrm=new Float32Array(n*3), uv=new Float32Array(n*2),
      jnt=new Uint8Array(n*4), wgt=new Float32Array(n*4);
  var sc=[(mx[0]-mn[0])/65535, (mx[1]-mn[1])/65535, (mx[2]-mn[2])/65535];
  var usc=[(umx[0]-umn[0])/65535, (umx[1]-umn[1])/65535];
  for(var v=0;v<n;v++){
    var a, s=0;
    for(a=0;a<3;a++) pos[v*3+a]=mn[a]+Q[v*3+a]*sc[a];
    var nx=NR[v*3]/127, ny=NR[v*3+1]/127, nz=NR[v*3+2]/127, nl=Math.hypot(nx,ny,nz)||1;
    nrm[v*3]=nx/nl; nrm[v*3+1]=ny/nl; nrm[v*3+2]=nz/nl;
    for(a=0;a<2;a++) uv[v*2+a]=umn[a]+U[v*2+a]*usc[a];
    for(a=0;a<4;a++){ jnt[v*4+a]=JT[v*4+a]; s+=WT[v*4+a]; }
    for(a=0;a<4;a++) wgt[v*4+a]= s>0 ? WT[v*4+a]/s : (a===0?1:0);
  }
  this.M={pos:pos, nrm:nrm, uv:uv, jnt:jnt, wgt:wgt, idx:idx, n:n,
          min:mn, max:mx, uvMin:umn, uvMax:umx};
  this.POSE={J:o.J, F:o.F, dur:o.dur, names:o.bn||[],
    data:new Float32Array(ML.b64dec(o.po).buffer), rest:new Float32Array(ML.b64dec(o.rp).buffer)};
  this.texURI=o.tex||null;
  this._scratch=null; this.invalidate();
  this.info=n+'정점 / '+(idx.length/3)+'삼각형, 본 '+o.J+'개, '+o.F+'프레임 (구운 데이터)';
};
CharMesh.invalidate=function(){ this._gl=null; this._vbo=null; this._prog=null; this._tex=null; this._texUp=false; };

CharMesh.serialize=function(){
  return '/* 자동 생성 파일 — 직접 고치지 마세요.\n'+
         '   tools/bake.html 이 Mesh/SK_Player.glb 를 구워 만든 것입니다\n'+
         '   (정점·스킨 가중치·걷기 포즈·1024 베이스컬러).\n'+
         '   모델이나 애니메이션을 바꾸면 그 페이지에서 [굽기] 를 다시 누르세요. */\n'+
         'window.CHAR_BAKED='+JSON.stringify(this.toBaked())+';\n';
};

/* ---------- 원본 .glb 로드 ----------
   실패하면 조용히 ready=false 로 남는다 — 호출부는 캡슐 캐릭터로 떨어진다. */
CharMesh.load=function(url, done){
  if(this.loading||this.ready){ if(done) done(this.ready); return; }
  this.loading=true;
  var self=this;
  function fail(e){ self.loading=false; self.err=String(e&&e.message||e);
    if(console&&console.warn) console.warn('[charmesh] '+self.err);
    if(done) done(false); }
  function finish(){
    self.loading=false; self.ready=true; self.invalidate();
    self.info=self.M.n+'정점 / '+(self.M.idx.length/3)+'삼각형, 본 '+self.POSE.J+'개, '+
      self.POSE.F+'프레임('+self.POSE.dur.toFixed(2)+'초)'+(self.texURI?'':' · 텍스처 없음');
    if(console&&console.log) console.log('[charmesh] '+url+' — '+self.info);
    if(done) done(true);
  }
  var req;
  try{ req=fetch(url); }catch(e){ fail(e); return; }
  req.then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
    .then(function(ab){
      var g=ML.parseGLB(ab);
      self.M=buildGeom(g);
      self.POSE=buildPose(g);
      // 텍스처 굽기는 Image.onload 밖(프라미스 밖)이라 여기서 던지면 .catch 가 못 잡는다
      bakeTexture(g, function(uri){ self.texURI=uri; finish(); },
                     function(){ self.texURI=null; finish(); });   // 텍스처가 없어도 흰 몸으로 나온다
    })
    .catch(fail);
};

/* 평소 경로: charbaked.js 가 먼저 실려 있으면 그걸 쓴다(즉시·오프라인 OK).
   없으면 원본 .glb 를 받아 그 자리에서 굽는다(5MB, tools/bake.html 도 이 경로다). */
CharMesh.init=function(glbUrl, done){
  if(this.ready||this.loading) return;
  if(global.CHAR_BAKED){
    try{
      this.applyBaked(global.CHAR_BAKED); this.ready=true;
      if(console&&console.log) console.log('[charmesh] charbaked.js — '+this.info);
      if(done) done(true); return;
    }catch(e){
      if(console&&console.warn) console.warn('[charmesh] 구운 데이터를 못 씁니다('+e.message+') — 원본 .glb 로 시도합니다');
    }
  }
  this.load(glbUrl, done);
};

global.CharMesh=CharMesh;
})(window);
