/* PENG! — glTF(.glb) 메시 공용 모듈
 *
 * 총(gunmesh.js)과 아이템 표식(itemmesh.js)이 함께 쓴다. 원래는 총 전용이었는데
 * 아이템 6종이 들어오면서 '메시 하나'를 담는 부분만 떼어냈다 — 파서를 두 벌 들고
 * 있으면 버그도 두 번 고쳐야 한다.
 *
 * 렌더러에 외부 라이브러리가 없으므로 필요한 만큼만 직접 읽는다:
 * 삼각형 프리미티브 하나의 POSITION / NORMAL / TEXCOORD_0 / 인덱스 + 베이스컬러 텍스처.
 *
 * 텍스처는 셰이더로 넘기지 않고, 로드할 때 UV 로 한 번 찍어 정점색에 굽는다.
 * 그러면 캐릭터(캡슐)와 똑같은 정점색 파이프라인에 그대로 얹히므로 셰이더를 늘릴
 * 필요가 없고, 툰 윤곽선도 같은 방식(법선으로 부풀린 껍질)으로 붙는다.
 *
 * 좌표계: glTF 는 오른손(+X 오른쪽, +Y 위, +Z 뒤), 이 게임은 왼손(+Z 앞)이다.
 * 축 변환은 메시마다 다르므로(모델이 어느 쪽을 보고 있느냐에 달렸다) Res 를 만들 때
 * 넘긴다. 형식은 [[출처축, 부호], ...] 로 결과의 x,y,z 순이다:
 *     AXIS_FLIP_Z = [[0,1],[1,1],[2,-1]]  →  local = ( x, y, -z)
 *     AXIS_GUN    = [[2,-1],[1,1],[0,-1]] →  local = (-z, y, -x)
 *
 * ※ 어떤 축을 쓰든 **행렬식이 -1** 이어야 한다. 이 게임의 메시(캡슐·구·박스)는
 *   '바깥면이 CW' 규약이고 윤곽선 껍질이 그걸 전제로 BACK 을 컬링하는데,
 *   build() 의 감기 뒤집기가 그 전제 위에서 맞춰져 있다. 행렬식이 +1 인 축을 쓰면
 *   껍질에서 가까운 면이 살아남아 메시를 통째로 검게 덮는다.
 */
(function(global){
'use strict';

/* ---------- glTF 읽기 ---------- */
function u32(dv,o){ return dv.getUint32(o,true); }

function parseGLB(ab){
  var dv=new DataView(ab);
  if(u32(dv,0)!==0x46546C67) throw new Error('GLB 매직이 아님');
  if(u32(dv,4)!==2) throw new Error('glTF 2.0 이 아님');
  var total=u32(dv,8), off=12, json=null, binOff=0, binLen=0;
  while(off+8<=total){
    var clen=u32(dv,off), ctype=u32(dv,off+4), start=off+8;
    if(ctype===0x4E4F534A) json=JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(ab,start,clen)));
    else if(ctype===0x004E4942){ binOff=start; binLen=clen; }
    off=start+clen;
  }
  if(!json) throw new Error('JSON 청크 없음');
  return {json:json, ab:ab, binOff:binOff, binLen:binLen};
}

var COMP={5120:{a:Int8Array,s:1},5121:{a:Uint8Array,s:1},5122:{a:Int16Array,s:2},
          5123:{a:Uint16Array,s:2},5125:{a:Uint32Array,s:4},5126:{a:Float32Array,s:4}};
var NCOMP={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};

// 접근자 하나를 평평한 타입배열로. byteStride(끼워넣기)와 정렬 문제를 함께 처리한다.
function readAccessor(g, i){
  var a=g.json.accessors[i], bv=g.json.bufferViews[a.bufferView];
  var C=COMP[a.componentType], n=NCOMP[a.type], cnt=a.count;
  if(!C||!n) throw new Error('지원하지 않는 접근자');
  var base=g.binOff+(bv.byteOffset||0)+(a.byteOffset||0);
  var stride=bv.byteStride||0;
  var out=new C.a(cnt*n);
  if(!stride || stride===C.s*n){
    // 촘촘히 붙어 있음 — 정렬이 맞으면 뷰로 바로 읽고, 아니면 복사해서 읽는다
    if(base % C.s === 0) out.set(new C.a(g.ab, base, cnt*n));
    else out.set(new C.a(g.ab.slice(base, base+cnt*n*C.s)));
  } else {
    for(var k=0;k<cnt;k++){
      var o=base+k*stride;
      var row=(o % C.s===0) ? new C.a(g.ab,o,n) : new C.a(g.ab.slice(o,o+n*C.s));
      for(var c=0;c<n;c++) out[k*n+c]=row[c];
    }
  }
  return out;
}

// 노드의 지역 변환(행렬 또는 TRS) → 열 우선 4x4
function nodeMatrix(nd){
  if(nd && nd.matrix) return nd.matrix.slice();
  var t=(nd&&nd.translation)||[0,0,0], r=(nd&&nd.rotation)||[0,0,0,1], s=(nd&&nd.scale)||[1,1,1];
  var x=r[0],y=r[1],z=r[2],w=r[3];
  var m=[1-2*(y*y+z*z), 2*(x*y+z*w), 2*(x*z-y*w), 0,
         2*(x*y-z*w), 1-2*(x*x+z*z), 2*(y*z+x*w), 0,
         2*(x*z+y*w), 2*(y*z-x*w), 1-2*(x*x+y*y), 0,
         0,0,0,1];
  for(var c=0;c<3;c++) for(var r2=0;r2<3;r2++) m[c*4+r2]*=s[c];
  m[12]=t[0]; m[13]=t[1]; m[14]=t[2];
  return m;
}
function xformPoint(m,x,y,z){ return [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]]; }
function xformDir(m,x,y,z){ return [m[0]*x+m[4]*y+m[8]*z, m[1]*x+m[5]*y+m[9]*z, m[2]*x+m[6]*y+m[10]*z]; }

// 메시를 참조하는 첫 노드를 찾아 그 변환을 함께 돌려준다
function findMeshNode(json){
  var nodes=json.nodes||[];
  for(var i=0;i<nodes.length;i++) if(nodes[i].mesh!=null) return nodes[i];
  return null;
}

/* ---------- 텍스처 → 정점색 굽기 ---------- */
// 정점 수는 1만 미만이라 4K 텍스처를 그대로 들고 있을 이유가 없다. 긴 변을 1024 로 줄여 읽는다.
var BAKE_MAX=1024;
function decodeImage(bytes, mime, ok, fail){
  var url=URL.createObjectURL(new Blob([bytes],{type:mime||'image/jpeg'}));
  var im=new Image();
  im.onload=function(){
    var w=im.width,h=im.height, k=Math.min(1, BAKE_MAX/Math.max(w,h));
    var cw=Math.max(1,Math.round(w*k)), ch=Math.max(1,Math.round(h*k));
    var cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
    var cx=cv.getContext('2d'); cx.drawImage(im,0,0,cw,ch);
    var d;
    try{ d=cx.getImageData(0,0,cw,ch); }catch(e){ URL.revokeObjectURL(url); fail(e); return; }
    URL.revokeObjectURL(url);
    ok({w:cw,h:ch,data:d.data});
  };
  im.onerror=function(){ URL.revokeObjectURL(url); fail(new Error('이미지 디코드 실패')); };
  im.src=url;
}
// 이중선형 샘플. UV 는 반복(REPEAT), v 는 위에서 아래로(glTF 규약 = 캔버스와 같음).
function sampleBilinear(img,u,v,out){
  u=u-Math.floor(u); v=v-Math.floor(v);
  var x=u*img.w-0.5, y=v*img.h-0.5;
  var x0=Math.floor(x), y0=Math.floor(y), fx=x-x0, fy=y-y0;
  var r=0,g=0,b=0;
  for(var j=0;j<2;j++) for(var i=0;i<2;i++){
    var sx=((x0+i)%img.w+img.w)%img.w, sy=((y0+j)%img.h+img.h)%img.h;
    var o=(sy*img.w+sx)*4, wgt=(i?fx:1-fx)*(j?fy:1-fy);
    r+=img.data[o]*wgt; g+=img.data[o+1]*wgt; b+=img.data[o+2]*wgt;
  }
  out[0]=r/255; out[1]=g/255; out[2]=b/255;
}
// sRGB → 선형. 셰이더가 감마 보정을 안 하므로 여기서도 굳이 풀지 않는다(원본 색감 유지).

/* ---------- base64 ---------- */
function b64enc(u8){
  var s='', C=0x8000;   // 한 번에 다 넘기면 인자 개수 제한에 걸린다
  for(var i=0;i<u8.length;i+=C) s+=String.fromCharCode.apply(null, u8.subarray(i,i+C));
  return btoa(s);
}
function b64dec(str){
  var s=atob(str), u8=new Uint8Array(s.length);
  for(var i=0;i<s.length;i++) u8[i]=s.charCodeAt(i);
  return u8;
}

/* ---------- 열 우선 4x4 곱(index.html 의 mat4Mul 과 같은 규약) ---------- */
function mul(a,b){ var o=new Float32Array(16);
  for(var c=0;c<4;c++)for(var r=0;r<4;r++){ var s=0;
    for(var k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; }
  return o; }

/* ---------- 메시 자원 하나 ----------
 * name  : 로그에 쓰는 이름
 * axis  : 위 주석의 축 변환 표
 */
var BAKE_VER=1;
var OUTLINE_COL=[0.04,0.06,0.10];

function Res(name, axis){
  this.name=name||'mesh';
  this.axis=axis||AXIS_FLIP_Z;
  this.ready=false; this.loading=false; this.err=null;
  this.info='';
  this.front=[0,0,0];        // 가장 앞쪽(z 최대) 2% 정점의 평균 — 총구 섬광에 쓴다
  this.M=null;               // {pos, col, nrm(용접된 평균 법선), idx, n, tris, min, max}
  this._gl=null; this._body=null; this._idx=null; this._hull=null; this._hullW=-1;
}

Res.prototype.build=function(g, img){
  var json=g.json, ax=this.axis;
  var mesh=json.meshes[0], prim=null;
  for(var i=0;i<mesh.primitives.length;i++){
    var p=mesh.primitives[i];
    if((p.mode==null||p.mode===4) && p.attributes && p.attributes.POSITION!=null){ prim=p; break; }
  }
  if(!prim) throw new Error('삼각형 프리미티브가 없음');

  var P=readAccessor(g, prim.attributes.POSITION);
  var N=prim.attributes.NORMAL!=null ? readAccessor(g, prim.attributes.NORMAL) : null;
  var T=prim.attributes.TEXCOORD_0!=null ? readAccessor(g, prim.attributes.TEXCOORD_0) : null;
  var IDX=prim.indices!=null ? readAccessor(g, prim.indices) : null;
  var n=P.length/3;
  if(n>65535) throw new Error('정점이 65535 개를 넘음(uint16 인덱스 불가): '+n);

  var nm=nodeMatrix(findMeshNode(json));
  var pos=new Float32Array(n*3), rawN=new Float32Array(n*3);
  var mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  for(var v=0;v<n;v++){
    var q=xformPoint(nm, P[v*3], P[v*3+1], P[v*3+2]);
    for(var a=0;a<3;a++){
      var e=ax[a], val=q[e[0]]*e[1];
      pos[v*3+a]=val;
      if(val<mn[a])mn[a]=val; if(val>mx[a])mx[a]=val;
    }
    if(N){
      var d=xformDir(nm, N[v*3], N[v*3+1], N[v*3+2]);
      var nx=d[ax[0][0]]*ax[0][1], ny=d[ax[1][0]]*ax[1][1], nz=d[ax[2][0]]*ax[2][1];
      var nl=Math.hypot(nx,ny,nz)||1;
      rawN[v*3]=nx/nl; rawN[v*3+1]=ny/nl; rawN[v*3+2]=nz/nl;
    }
  }

  // 원점을 그대로 두고 배치는 호출부에 맡긴다. 앞쪽 점만 따로 뽑아둔다:
  // 가장 앞쪽(z 최대) 2% 정점의 평균 → 총이면 섬광이 총열 축에 오게 한다.
  var zc=mx[2]-(mx[2]-mn[2])*0.02, mfx=0,mfy=0,mfc=0;
  for(v=0;v<n;v++) if(pos[v*3+2]>=zc){ mfx+=pos[v*3]; mfy+=pos[v*3+1]; mfc++; }
  this.front = mfc ? [mfx/mfc, mfy/mfc, mx[2]] : [0,0,mx[2]];

  /* 인덱스 → uint16. 동시에 감기 방향을 뒤집는다.
     이 게임의 메시(캡슐·구·박스)는 '바깥면이 CW' 규약이고 윤곽선 껍질이 그걸 전제로
     BACK 을 컬링한다. glTF 는 바깥면이 CCW 라 감기를 맞춰주지 않으면 껍질에서
     가까운 면이 살아남아 메시를 통째로 검게 덮는다. */
  var idx, k;
  if(IDX){ idx=new Uint16Array(IDX.length);
    for(k=0;k<IDX.length;k+=3){ idx[k]=IDX[k]; idx[k+1]=IDX[k+2]; idx[k+2]=IDX[k+1]; } }
  else { idx=new Uint16Array(n); for(k=0;k<n;k+=3){ idx[k]=k; idx[k+1]=k+2; idx[k+2]=k+1; } }

  /* 정점색 = 베이스컬러 × 음영.
     음영은 캡슐(capsuleVertShade)과 같은 식·같은 광원을 쓴다. 로컬 공간에 고정된
     광원으로 구우므로 메시를 돌려도 명암이 따라 돌지 않는다. */
  var col=new Float32Array(n*3), t=[1,1,1];
  var LX=0.32, LY=0.85, LZ=-0.42, LL=Math.hypot(LX,LY,LZ);
  LX/=LL; LY/=LL; LZ/=LL;
  for(v=0;v<n;v++){
    if(img && T) sampleBilinear(img, T[v*2], T[v*2+1], t);
    else { t[0]=0.62; t[1]=0.66; t[2]=0.76; }        // 텍스처가 없으면 무채색 금속
    var dl = N ? (rawN[v*3]*LX + rawN[v*3+1]*LY + rawN[v*3+2]*LZ) : 1;
    var sh = 0.55 + 0.45*(dl>0?dl:0);
    col[v*3]=Math.min(1,t[0]*sh); col[v*3+1]=Math.min(1,t[1]*sh); col[v*3+2]=Math.min(1,t[2]*sh);
  }

  /* 윤곽선 껍질용 법선은 '용접'해서 평균낸다.
     파일의 법선은 하드 에지에서 갈라져 있어(같은 자리에 법선이 다른 정점이 여럿)
     그대로 부풀리면 모서리마다 껍질이 찢어져 틈이 보인다. */
  var wn=new Float32Array(n*3), map={}, Q=1e4;
  var keys=new Array(n);
  for(v=0;v<n;v++){
    var key=Math.round(pos[v*3]*Q)+'_'+Math.round(pos[v*3+1]*Q)+'_'+Math.round(pos[v*3+2]*Q);
    keys[v]=key;
    var ee=map[key]; if(!ee) ee=map[key]=[0,0,0];
    ee[0]+=rawN[v*3]; ee[1]+=rawN[v*3+1]; ee[2]+=rawN[v*3+2];
  }
  for(v=0;v<n;v++){
    var aa=map[keys[v]], al=Math.hypot(aa[0],aa[1],aa[2]);
    if(al<1e-6){ wn[v*3]=rawN[v*3]; wn[v*3+1]=rawN[v*3+1]; wn[v*3+2]=rawN[v*3+2]; }
    else { wn[v*3]=aa[0]/al; wn[v*3+1]=aa[1]/al; wn[v*3+2]=aa[2]/al; }
  }

  this.M={pos:pos, col:col, nrm:wn, idx:idx, n:n, tris:idx.length/3, min:mn, max:mx};
  this.invalidate();
  this.info = n+'정점 / '+this.M.tris+'삼각형, 크기 '+
    (mx[0]-mn[0]).toFixed(2)+'×'+(mx[1]-mn[1]).toFixed(2)+'×'+(mx[2]-mn[2]).toFixed(2);
};

/* ---------- 구운 결과 저장/복원 ----------
   원본 .glb 는 6MB(텍스처 3장)라 접속할 때마다 받기엔 크다. 다 굽고 나면 필요한 건
   정점 위치·색·법선과 인덱스뿐이므로, 그것만 양자화해서 뽑아 쓴다:
     위치 uint16(바운딩박스로 정규화) · 색 uint8 · 법선 int8 · 인덱스 uint16
   → 약 190KB. 원본(6MB)의 1/32 이다.
   게다가 <script src> 로 읽으므로 fetch 가 필요 없다 — file:// 로 index.html 을
   더블클릭해도 메시가 그대로 나온다.
   ※ 타입배열을 그대로 쓰므로 리틀엔디언을 가정한다(브라우저가 도는 모든 플랫폼). */
Res.prototype.toBaked=function(){
  var M=this.M;
  if(!M) throw new Error(this.name+': 아직 구운 메시가 없습니다');
  var n=M.n, mn=M.min, mx=M.max, sc=[mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]];
  var P=new Uint16Array(n*3), C=new Uint8Array(n*3), N=new Int8Array(n*3);
  for(var v=0;v<n;v++) for(var a=0;a<3;a++){
    var t=sc[a]>1e-9 ? (M.pos[v*3+a]-mn[a])/sc[a] : 0;
    P[v*3+a]=Math.max(0,Math.min(65535,Math.round(t*65535)));
    C[v*3+a]=Math.max(0,Math.min(255,Math.round(M.col[v*3+a]*255)));
    N[v*3+a]=Math.max(-127,Math.min(127,Math.round(M.nrm[v*3+a]*127)));
  }
  return { v:BAKE_VER, n:n, mn:mn, mx:mx, mz:this.front,
    p:b64enc(new Uint8Array(P.buffer)), c:b64enc(C), nr:b64enc(new Uint8Array(N.buffer)),
    i:b64enc(new Uint8Array(M.idx.buffer, M.idx.byteOffset, M.idx.byteLength)) };
};
Res.prototype.applyBaked=function(o){
  if(!o || o.v!==BAKE_VER) throw new Error('구운 데이터의 형식 버전이 다릅니다');
  var n=o.n, mn=o.mn, mx=o.mx;
  var P=new Uint16Array(b64dec(o.p).buffer), C=b64dec(o.c),
      N=new Int8Array(b64dec(o.nr).buffer), idx=new Uint16Array(b64dec(o.i).buffer);
  if(P.length!==n*3 || C.length!==n*3 || N.length!==n*3) throw new Error('구운 데이터의 길이가 안 맞습니다');
  var pos=new Float32Array(n*3), col=new Float32Array(n*3), nrm=new Float32Array(n*3);
  var sc=[(mx[0]-mn[0])/65535, (mx[1]-mn[1])/65535, (mx[2]-mn[2])/65535];
  for(var v=0;v<n;v++){
    for(var a=0;a<3;a++){ pos[v*3+a]=mn[a]+P[v*3+a]*sc[a]; col[v*3+a]=C[v*3+a]/255; }
    var nx=N[v*3]/127, ny=N[v*3+1]/127, nz=N[v*3+2]/127, nl=Math.hypot(nx,ny,nz)||1;
    nrm[v*3]=nx/nl; nrm[v*3+1]=ny/nl; nrm[v*3+2]=nz/nl;   // int8 로 줄이며 길이가 흐트러진다
  }
  this.front=(o.mz||[0,0,0]).slice();
  this.M={pos:pos, col:col, nrm:nrm, idx:idx, n:n, tris:idx.length/3, min:mn, max:mx};
  this.invalidate();
  this.info=n+'정점 / '+this.M.tris+'삼각형 (구운 데이터)';
};

/* ---------- GPU 버퍼 ---------- */
// 메시를 다시 만들면 올려둔 버퍼는 낡은 것이다(bake.html 에서 두 번 구울 때).
Res.prototype.invalidate=function(){ this._gl=null; this._body=null; this._hullW=-1; };
Res.prototype.ensureBuffers=function(gl){
  if(this._gl===gl && this._body) return true;
  var M=this.M; this._gl=gl;
  var inter=new Float32Array(M.n*6);
  for(var v=0;v<M.n;v++){
    inter[v*6]=M.pos[v*3]; inter[v*6+1]=M.pos[v*3+1]; inter[v*6+2]=M.pos[v*3+2];
    inter[v*6+3]=M.col[v*3]; inter[v*6+4]=M.col[v*3+1]; inter[v*6+5]=M.col[v*3+2];
  }
  this._body=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this._body);
  gl.bufferData(gl.ARRAY_BUFFER,inter,gl.STATIC_DRAW);
  this._idx=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this._idx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,M.idx,gl.STATIC_DRAW);
  this._hull=gl.createBuffer(); this._hullW=-1;
  return true;
};
// 껍질은 두께가 바뀔 때만 다시 만든다(슬라이더로 조절하므로 자주 바뀌지 않는다)
Res.prototype.ensureHull=function(gl, wLocal){
  if(this._hullW===wLocal) return;
  var M=this.M, inter=new Float32Array(M.n*6);
  for(var v=0;v<M.n;v++){
    inter[v*6]  =M.pos[v*3]  +M.nrm[v*3]  *wLocal;
    inter[v*6+1]=M.pos[v*3+1]+M.nrm[v*3+1]*wLocal;
    inter[v*6+2]=M.pos[v*3+2]+M.nrm[v*3+2]*wLocal;
    inter[v*6+3]=OUTLINE_COL[0]; inter[v*6+4]=OUTLINE_COL[1]; inter[v*6+5]=OUTLINE_COL[2];
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,this._hull);
  gl.bufferData(gl.ARRAY_BUFFER,inter,gl.STATIC_DRAW);
  this._hullW=wLocal;
};

/* ---------- 그리기 ----------
   model 은 열 우선 4x4. 그린 뒤 uVP 를 되돌려 놓는다(다음 드로우가 화면 VP 를 기대한다). */
function bind(gl,prog,buf){
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.enableVertexAttribArray(prog.aPos); gl.vertexAttribPointer(prog.aPos,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(prog.aCol); gl.vertexAttribPointer(prog.aCol,3,gl.FLOAT,false,24,12);
}
Res.prototype.draw=function(gl,prog,VP,model){
  if(!this.ready) return false;
  this.ensureBuffers(gl);
  gl.uniformMatrix4fv(prog.uVP,false,mul(VP,model));
  bind(gl,prog,this._body);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this._idx);
  gl.drawElements(gl.TRIANGLES,this.M.idx.length,gl.UNSIGNED_SHORT,0);
  gl.uniformMatrix4fv(prog.uVP,false,VP);
  return true;
};
/* 윤곽선 껍질. 호출부가 CULL_FACE/BACK 을 켠 상태에서 부른다.
   wWorld 는 월드 단위 두께, scale 은 모델행렬에 들어간 배율(로컬로 환산하는 데 쓴다). */
Res.prototype.drawHull=function(gl,prog,VP,model,wWorld,scale){
  if(!this.ready || wWorld<=0) return false;
  this.ensureBuffers(gl);
  this.ensureHull(gl, wWorld/Math.max(1e-4,scale));
  gl.uniformMatrix4fv(prog.uVP,false,mul(VP,model));
  bind(gl,prog,this._hull);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this._idx);
  gl.drawElements(gl.TRIANGLES,this.M.idx.length,gl.UNSIGNED_SHORT,0);
  gl.uniformMatrix4fv(prog.uVP,false,VP);
  return true;
};

/* ---------- 원본 .glb 로드 ----------
   실패하면 조용히 ready=false 로 남는다. 호출부는 폴백을 그린다
   (file:// 로 직접 열면 fetch 가 막히므로 이 경로가 실제로 쓰인다). */
Res.prototype.load=function(url, done){
  if(this.loading||this.ready){ if(done) done(this.ready); return; }
  this.loading=true;
  var self=this;
  function fail(e){ self.loading=false; self.err=String(e&&e.message||e);
    if(console&&console.warn) console.warn('[meshlib] '+self.name+': '+self.err);
    if(done) done(false); }
  var req;
  try{ req=fetch(url); }catch(e){ fail(e); return; }
  req.then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
    .then(function(ab){
      var g=parseGLB(ab);
      // 베이스컬러 이미지 찾기(재질 → 텍스처 → 이미지). 없으면 색 없이 굽는다.
      var json=g.json, imgIdx=null;
      try{
        var prim=json.meshes[0].primitives[0];
        var mat=json.materials[prim.material];
        var texI=mat.pbrMetallicRoughness.baseColorTexture.index;
        imgIdx=json.textures[texI].source;
      }catch(e){ imgIdx = (json.images&&json.images.length) ? 0 : null; }
      if(imgIdx==null){ self.build(g,null); finish(); return; }
      var im=json.images[imgIdx];
      if(im.bufferView==null){ self.build(g,null); finish(); return; }   // 외부 URI 이미지는 지원 안 함
      var bv=json.bufferViews[im.bufferView];
      var bytes=new Uint8Array(g.ab, g.binOff+(bv.byteOffset||0), bv.byteLength);
      // 이 콜백은 promise 밖(Image.onload)에서 불리므로 여기서 던지면 .catch 가 못 잡는다.
      // 정점이 65535 개를 넘는 등 build() 가 거부하는 경우가 여기로 온다.
      decodeImage(bytes, im.mimeType,
        function(img){ try{ self.build(g,img); finish(); }catch(e){ fail(e); } },
        function(){ try{ self.build(g,null); finish(); }catch(e){ fail(e); } });  // 디코드 실패 → 무채색으로라도
      function finish(){ self.loading=false; self.ready=true;
        if(console&&console.log) console.log('[meshlib] '+self.name+' ← '+url+' — '+self.info);
        if(done) done(true); }
    })
    .catch(fail);
};

var AXIS_FLIP_Z=[[0,1],[1,1],[2,-1]];     // local = ( x, y, -z) — 방향성 없는 모델의 기본
var AXIS_GUN   =[[2,-1],[1,1],[0,-1]];    // local = (-z, y, -x) — 총구가 -X 인 ShockWave_Gun

global.MeshLib={ Res:Res, mul:mul, BAKE_VER:BAKE_VER,
  AXIS_FLIP_Z:AXIS_FLIP_Z, AXIS_GUN:AXIS_GUN };
})(window);
