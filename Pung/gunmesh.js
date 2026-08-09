/* PUNG! — glTF(.glb) 총 메시 로더
 *
 * 렌더러에 외부 라이브러리가 없으므로, 필요한 만큼만 직접 읽는다:
 * 삼각형 프리미티브 하나의 POSITION / NORMAL / TEXCOORD_0 / 인덱스 + 베이스컬러 텍스처.
 *
 * 텍스처는 셰이더로 넘기지 않고, 로드할 때 UV 로 한 번 찍어 정점색에 굽는다.
 * 그러면 캐릭터(캡슐)와 똑같은 정점색 파이프라인에 그대로 얹히므로 셰이더를 늘릴
 * 필요가 없고, 툰 윤곽선도 같은 방식(법선으로 부풀린 껍질)으로 붙는다.
 *
 * 좌표계: glTF 는 오른손(+X 오른쪽, +Y 위, +Z 뒤), 이 게임은 왼손(+Z 앞)이다.
 * 모델마다 총구가 보는 축이 달라서 AXES 로 골라 쓴다. 아래 매핑은 전부 행렬식이 -1 이라
 * (거울) 감기 방향이 한 번 뒤집히고, 인덱스 단계에서 한 번 더 뒤집어 규약을 맞춘다.
 * 좌우가 거울로 바뀌지만 총은 좌우 대칭이라 눈에 띄지 않는다.
 *
 *   shockwave : 총구가 -X   →  local = (-z,  y, -x)
 *   kenney    : 총구가 -Z   →  local = ( x,  y, -z)   (Kenney Blaster Kit 계열)
 *   bullet    : 끝이  +Y   →  local = ( x,  z,  y)   (탄환 — 긴 축을 +Z 로 세운다)
 *   station   : 그대로       →  local = (-x,  y,  z)   (레벨 조각 — 좌우만 뒤집어 감기를 맞춘다)
 *
 * 실패하면 조용히 ready=false 로 남는다. 호출부는 기존 박스 총으로 폴백한다
 * (file:// 로 직접 열면 fetch 가 막히므로 이 경로가 실제로 쓰인다).
 */
(function(global){
'use strict';

var GunMesh = {
  ready:false, loading:false, err:null,
  // --- 배치(조준 기저 기준: x=오른쪽, y=위, z=앞). 디버그 패널에서 조절한다 ---
  // 원본 메시는 총열 방향 길이가 2유닛이라 0.22 를 곱하면 약 0.44m — 박스 총과 비슷한 화면 비중이 된다.
  /* 축 매핑 이름. 모델을 갈아끼울 때 여기만 바꾸면 된다(굽기 전에 정해야 한다). */
  axes:'kenney',
  /* blaster-h 는 총열 방향 길이가 0.648 유닛이다. 0.68 을 곱하면 약 0.44m —
     예전 박스 총·ShockWave 와 화면 비중이 비슷해진다. */
  scale:0.68,
  ox:0.26, oy:-0.20, oz:0.42,
  outlineW:0.006,          // 윤곽선 두께(월드 단위)
  muzzle:[0,0,0],          // 총구 위치(로컬, scale 적용 전) — 섬광·발사 원점에 쓴다
  info:''                  // 로드 결과 요약(디버그용)
};

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

/* ---------- 조립 ---------- */
var M=null;   // {pos, col, nrm(용접된 평균 법선), idx, n, tris}

/* 4x4 곱(열 우선) — 노드 계층을 따라 변환을 누적하는 데 쓴다 */
function mmul(a,b){ var o=new Array(16);
  for(var c=0;c<4;c++)for(var r=0;r<4;r++){ var s2=0;
    for(var k=0;k<4;k++) s2+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s2; }
  return o; }
/* 장면의 모든 메시 노드를 하나로 합친다.
   블로키 캐릭터처럼 머리·몸통·팔·다리가 노드로 쪼개진 모델은 첫 노드만 읽으면
   몸통 한 조각만 나온다. 노드 계층을 훑어 변환을 누적한 뒤 이어 붙인다.
   (애니메이션은 쓰지 않으므로 기본 포즈 그대로 굳는다.) */
function collectPrims(json){
  var out=[], nodes=json.nodes||[];
  var roots=(json.scenes&&json.scenes[json.scene||0]&&json.scenes[json.scene||0].nodes) || null;
  if(!roots){ roots=[]; for(var i=0;i<nodes.length;i++) roots.push(i); }
  function walk(idx, parent){
    var nd=nodes[idx]; if(!nd) return;
    var WM=mmul(parent, nodeMatrix(nd));
    if(nd.mesh!=null){
      var me=json.meshes[nd.mesh];
      for(var q=0;q<me.primitives.length;q++){
        var pm=me.primitives[q];
        if((pm.mode==null||pm.mode===4) && pm.attributes && pm.attributes.POSITION!=null)
          out.push({prim:pm, m:WM});
      }
    }
    if(nd.children) for(var c=0;c<nd.children.length;c++) walk(nd.children[c], WM);
  }
  var I4=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  for(var r=0;r<roots.length;r++) walk(roots[r], I4);
  return out;
}
function build(g, img){
  var json=g.json;
  var parts=collectPrims(json);
  if(!parts.length) throw new Error('삼각형 프리미티브가 없음');
  /* 여러 조각을 하나의 정점 배열로 이어 붙인다. 스킨드 메시는 노드 변환을 무시해야
     하므로(glTF 규약) 그 경우엔 첫 조각만 단위행렬로 쓴다. */
  var skinned = (json.skins && json.skins.length) ? true : false;
  var P=[], N=[], T=[], IDX=[], vbase=0;
  for(var pi=0; pi<parts.length; pi++){
    // 지역 이름을 M 으로 두면 모듈 전역 M(구운 메시)을 가려서, 아래 M={...} 가
    // 지역 변수에 들어가 버린다(var 호이스팅). 이름을 다르게 쓴다.
    var prim=parts[pi].prim, NM=skinned ? null : parts[pi].m;
    var pp=readAccessor(g, prim.attributes.POSITION);
    var nn=prim.attributes.NORMAL!=null ? readAccessor(g, prim.attributes.NORMAL) : null;
    var tt=prim.attributes.TEXCOORD_0!=null ? readAccessor(g, prim.attributes.TEXCOORD_0) : null;
    var ii=prim.indices!=null ? readAccessor(g, prim.indices) : null;
    var cnt=pp.length/3;
    for(var v=0; v<cnt; v++){
      var q = NM ? xformPoint(NM, pp[v*3], pp[v*3+1], pp[v*3+2]) : [pp[v*3],pp[v*3+1],pp[v*3+2]];
      P.push(q[0],q[1],q[2]);
      if(nn){ var d = NM ? xformDir(NM, nn[v*3], nn[v*3+1], nn[v*3+2]) : [nn[v*3],nn[v*3+1],nn[v*3+2]];
        N.push(d[0],d[1],d[2]); } else N.push(0,1,0);
      if(tt) T.push(tt[v*2], tt[v*2+1]); else T.push(0,0);
    }
    if(ii) for(var k=0;k<ii.length;k++) IDX.push(ii[k]+vbase);
    else   for(var k2=0;k2<cnt;k2++) IDX.push(k2+vbase);
    vbase+=cnt;
    if(skinned) break;                      // 스킨드는 첫 조각이 곧 전체다
  }
  N=N.length?N:null; T=T.length?T:null;
  var n=P.length/3;
  if(n>65535) throw new Error('정점이 65535 개를 넘음(uint16 인덱스 불가): '+n);

  // 위에서 노드 변환을 이미 적용했다 — 여기서 또 곱하면 이중 변환이 된다
  var nm=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
  var pos=new Float32Array(n*3), rawN=new Float32Array(n*3);
  var mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  for(var v=0;v<n;v++){
    var q=xformPoint(nm, P[v*3], P[v*3+1], P[v*3+2]);
    // glTF(오른손) → 게임 기저(왼손). 매핑은 GunMesh.axes 가 고른다(맨 위 주석 참고).
    var lx,ly,lz;
    if(GunMesh.axes==='kenney'){ lx=q[0];  ly=q[1]; lz=-q[2]; }
    else if(GunMesh.axes==='bullet'){ lx=q[0]; ly=q[2]; lz=q[1]; }
    else if(GunMesh.axes==='station'){ lx=-q[0]; ly=q[1]; lz=q[2]; }
    else                       { lx=-q[2]; ly=q[1]; lz=-q[0]; }
    pos[v*3]=lx; pos[v*3+1]=ly; pos[v*3+2]=lz;
    if(lx<mn[0])mn[0]=lx; if(ly<mn[1])mn[1]=ly; if(lz<mn[2])mn[2]=lz;
    if(lx>mx[0])mx[0]=lx; if(ly>mx[1])mx[1]=ly; if(lz>mx[2])mx[2]=lz;
    if(N){
      var d=xformDir(nm, N[v*3], N[v*3+1], N[v*3+2]);
      var nx,ny,nz;
      if(GunMesh.axes==='kenney'){ nx=d[0];  ny=d[1]; nz=-d[2]; }
      else if(GunMesh.axes==='bullet'){ nx=d[0]; ny=d[2]; nz=d[1]; }
      else if(GunMesh.axes==='station'){ nx=-d[0]; ny=d[1]; nz=d[2]; }
      else                       { nx=-d[2]; ny=d[1]; nz=-d[0]; }
      var nl=Math.hypot(nx,ny,nz)||1;
      rawN[v*3]=nx/nl; rawN[v*3+1]=ny/nl; rawN[v*3+2]=nz/nl;
    }
  }

  // 원점을 그대로 두고 배치는 호출부(ox/oy/oz)에 맡긴다. 총구만 따로 뽑아둔다:
  // 가장 앞쪽(z 최대) 2% 정점의 평균 → 섬광이 총열 축에 오게 한다.
  var zc=mx[2]-(mx[2]-mn[2])*0.02, mfx=0,mfy=0,mfc=0;
  for(v=0;v<n;v++) if(pos[v*3+2]>=zc){ mfx+=pos[v*3]; mfy+=pos[v*3+1]; mfc++; }
  GunMesh.muzzle = mfc ? [mfx/mfc, mfy/mfc, mx[2]] : [0,0,mx[2]];

  /* 인덱스 → uint16. 동시에 감기 방향을 뒤집는다.
     이 게임의 메시(캡슐·구·박스)는 '바깥면이 CW' 규약이고 윤곽선 껍질이 그걸 전제로
     BACK 을 컬링한다. glTF 는 바깥면이 CCW 라 감기를 맞춰주지 않으면 껍질에서
     가까운 면이 살아남아 총을 통째로 검게 덮는다. */
  var idx;
  if(IDX){ idx=new Uint16Array(IDX.length);
    for(var k=0;k<IDX.length;k+=3){ idx[k]=IDX[k]; idx[k+1]=IDX[k+2]; idx[k+2]=IDX[k+1]; } }
  else { idx=new Uint16Array(n); for(k=0;k<n;k+=3){ idx[k]=k; idx[k+1]=k+2; idx[k+2]=k+1; } }

  /* 정점색 = 베이스컬러 × 음영.
     음영은 캡슐(capsuleVertShade)과 같은 식·같은 광원을 쓴다. 총은 조준 기저에
     붙어 함께 돌므로, 캐릭터처럼 로컬 공간에 고정된 광원으로 구워야 박스 총과
     같은 느낌이 난다(= 돌려도 명암이 따라 돌지 않는다). */
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
    var e=map[key]; if(!e) e=map[key]=[0,0,0];
    e[0]+=rawN[v*3]; e[1]+=rawN[v*3+1]; e[2]+=rawN[v*3+2];
  }
  for(v=0;v<n;v++){
    var a=map[keys[v]], al=Math.hypot(a[0],a[1],a[2]);
    if(al<1e-6){ wn[v*3]=rawN[v*3]; wn[v*3+1]=rawN[v*3+1]; wn[v*3+2]=rawN[v*3+2]; }
    else { wn[v*3]=a[0]/al; wn[v*3+1]=a[1]/al; wn[v*3+2]=a[2]/al; }
  }

  M={pos:pos, col:col, nrm:wn, idx:idx, n:n, tris:idx.length/3, min:mn, max:mx};
  invalidateBuffers();
  GunMesh.info = M.n+'정점 / '+M.tris+'삼각형, 크기 '+
    (mx[0]-mn[0]).toFixed(2)+'×'+(mx[1]-mn[1]).toFixed(2)+'×'+(mx[2]-mn[2]).toFixed(2);
}

/* ---------- 구운 결과 저장/복원 ----------
   원본 .glb 는 6MB(텍스처 3장)라 접속할 때마다 받기엔 크다. 다 굽고 나면 필요한 건
   정점 위치·색·법선과 인덱스뿐이므로, 그것만 양자화해서 gunbaked.js 로 뽑아 쓴다:
     위치 uint16(바운딩박스로 정규화) · 색 uint8 · 법선 int8 · 인덱스 uint16
   → 약 190KB. 원본(6MB)의 1/32 이다.
   게다가 <script src> 로 읽으므로 fetch 가 필요 없다 — file:// 로 index.html 을
   더블클릭해도 총 메시가 그대로 나온다.
   ※ 타입배열을 그대로 쓰므로 리틀엔디언을 가정한다(브라우저가 도는 모든 플랫폼). */
var BAKE_VER=1;
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
// gunbaked.js 의 내용을 문자열로 만든다(tools/bake.html 이 서버에 보내 파일로 쓴다)
GunMesh.serialize=function(globalName){
  if(!M) throw new Error('아직 구운 메시가 없습니다');
  var n=M.n, mn=M.min, mx=M.max, sc=[mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]];
  var P=new Uint16Array(n*3), C=new Uint8Array(n*3), N=new Int8Array(n*3);
  for(var v=0;v<n;v++) for(var a=0;a<3;a++){
    var t=sc[a]>1e-9 ? (M.pos[v*3+a]-mn[a])/sc[a] : 0;
    P[v*3+a]=Math.max(0,Math.min(65535,Math.round(t*65535)));
    C[v*3+a]=Math.max(0,Math.min(255,Math.round(M.col[v*3+a]*255)));
    N[v*3+a]=Math.max(-127,Math.min(127,Math.round(M.nrm[v*3+a]*127)));
  }
  var o={ v:BAKE_VER, n:n, mn:mn, mx:mx, mz:this.muzzle,
    p:b64enc(new Uint8Array(P.buffer)), c:b64enc(C), nr:b64enc(new Uint8Array(N.buffer)),
    i:b64enc(new Uint8Array(M.idx.buffer, M.idx.byteOffset, M.idx.byteLength)) };
  return '/* 자동 생성 파일 — 직접 고치지 마세요.\n'+
         '   tools/bake.html 이 .glb 를 구워 만든 정점 데이터입니다(위치·색·법선·인덱스).\n'+
         '   모델을 바꾸면 그 페이지를 열어 [굽기] 를 다시 누르세요. */\n'+
         'window.'+(globalName||'GUN_BAKED')+'='+JSON.stringify(o)+';\n';
};
/* 구운 데이터 → 정점 배열. GunMesh 의 현재 메시를 건드리지 않는 순수 함수라
   탄환처럼 다른 메시를 읽는 쪽에서도 그대로 쓴다. */
GunMesh.decodeBaked=function(o){
  if(!o || o.v!==BAKE_VER) throw new Error('구운 데이터의 형식 버전이 다릅니다');
  var n=o.n, mn=o.mn, mx=o.mx;
  var P=new Uint16Array(b64dec(o.p).buffer), C=b64dec(o.c),
      NR=new Int8Array(b64dec(o.nr).buffer), idx=new Uint16Array(b64dec(o.i).buffer);
  if(P.length!==n*3 || C.length!==n*3) throw new Error('구운 데이터의 길이가 안 맞습니다');
  var pos=new Float32Array(n*3), col=new Float32Array(n*3), nrm=new Float32Array(n*3);
  var sc=[(mx[0]-mn[0])/65535, (mx[1]-mn[1])/65535, (mx[2]-mn[2])/65535];
  for(var v=0;v<n;v++){
    for(var a=0;a<3;a++){ pos[v*3+a]=mn[a]+P[v*3+a]*sc[a]; col[v*3+a]=C[v*3+a]/255; }
    var qx=NR[v*3]/127, qy=NR[v*3+1]/127, qz=NR[v*3+2]/127, ql=Math.hypot(qx,qy,qz)||1;
    nrm[v*3]=qx/ql; nrm[v*3+1]=qy/ql; nrm[v*3+2]=qz/ql;
  }
  return {pos:pos, col:col, nrm:nrm, idx:idx, n:n, min:mn, max:mx, tip:o.mz.slice()};
};
function applyBaked(o){
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
  GunMesh.muzzle=o.mz.slice();
  M={pos:pos, col:col, nrm:nrm, idx:idx, n:n, tris:idx.length/3, min:mn, max:mx};
  invalidateBuffers();
  GunMesh.info=n+'정점 / '+M.tris+'삼각형 (구운 데이터)';
}

/* ---------- GPU 버퍼 ---------- */
var GL=null, bodyBuf=null, idxBuf=null, hullBuf=null, hullW=-1;
// 메시를 다시 만들면 올려둔 버퍼는 낡은 것이다(bake.html 에서 두 번 구울 때).
function invalidateBuffers(){ GL=null; bodyBuf=null; hullW=-1; }
function ensureBuffers(gl){
  if(GL===gl && bodyBuf) return true;
  GL=gl;
  var inter=new Float32Array(M.n*6);
  for(var v=0;v<M.n;v++){
    inter[v*6]=M.pos[v*3]; inter[v*6+1]=M.pos[v*3+1]; inter[v*6+2]=M.pos[v*3+2];
    inter[v*6+3]=M.col[v*3]; inter[v*6+4]=M.col[v*3+1]; inter[v*6+5]=M.col[v*3+2];
  }
  bodyBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,bodyBuf);
  gl.bufferData(gl.ARRAY_BUFFER,inter,gl.STATIC_DRAW);
  idxBuf=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,M.idx,gl.STATIC_DRAW);
  hullBuf=gl.createBuffer(); hullW=-1;
  return true;
}
// 껍질은 두께가 바뀔 때만 다시 만든다(슬라이더로 조절하므로 자주 바뀌지 않는다)
var OUTLINE_COL=[0.04,0.06,0.10];
function ensureHull(gl, wLocal){
  if(hullW===wLocal) return;
  var inter=new Float32Array(M.n*6);
  for(var v=0;v<M.n;v++){
    inter[v*6]  =M.pos[v*3]  +M.nrm[v*3]  *wLocal;
    inter[v*6+1]=M.pos[v*3+1]+M.nrm[v*3+1]*wLocal;
    inter[v*6+2]=M.pos[v*3+2]+M.nrm[v*3+2]*wLocal;
    inter[v*6+3]=OUTLINE_COL[0]; inter[v*6+4]=OUTLINE_COL[1]; inter[v*6+5]=OUTLINE_COL[2];
  }
  gl.bindBuffer(gl.ARRAY_BUFFER,hullBuf);
  gl.bufferData(gl.ARRAY_BUFFER,inter,gl.STATIC_DRAW);
  hullW=wLocal;
}

/* ---------- 그리기 ---------- */
// 열 우선 4x4 곱(index.html 의 mat4Mul 과 같은 규약)
function mul(a,b){ var o=new Float32Array(16);
  for(var c=0;c<4;c++)for(var r=0;r<4;r++){ var s=0;
    for(var k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; }
  return o; }

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
function bind(gl,prog,buf){
  gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.enableVertexAttribArray(prog.aPos); gl.vertexAttribPointer(prog.aPos,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(prog.aCol); gl.vertexAttribPointer(prog.aCol,3,gl.FLOAT,false,24,12);
}

/* 본체. VP 는 화면 VP, (O,R,U,F) 는 총이 붙을 기저(눈 위치 + 조준 기저).
   extra 는 3인칭에서 몸 쪽으로 옮기는 추가 오프셋(GUN_TP). 그린 뒤 uVP 를 되돌려 놓는다. */
GunMesh.drawBody=function(gl,prog,VP,O,R,U,F,kick,extra){
  if(!this.ready) return false;
  ensureBuffers(gl);
  gl.uniformMatrix4fv(prog.uVP,false,mul(VP,modelMat(O,R,U,F,kick||0,extra)));
  bind(gl,prog,bodyBuf);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idxBuf);
  gl.drawElements(gl.TRIANGLES,M.idx.length,gl.UNSIGNED_SHORT,0);
  gl.uniformMatrix4fv(prog.uVP,false,VP);
  return true;
};
/* 윤곽선 껍질. 호출부가 CULL_FACE/BACK 을 켠 상태에서 부른다
   (축 변환으로 바깥면이 CW 가 되어 캡슐·구와 같은 규칙이 그대로 적용된다). */
GunMesh.drawOutline=function(gl,prog,VP,O,R,U,F,kick,extra){
  if(!this.ready || this.outlineW<=0) return false;
  ensureBuffers(gl);
  ensureHull(gl, this.outlineW/Math.max(1e-4,this.scale));   // 두께는 월드 기준 → 로컬로 환산
  gl.uniformMatrix4fv(prog.uVP,false,mul(VP,modelMat(O,R,U,F,kick||0,extra)));
  bind(gl,prog,hullBuf);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,idxBuf);
  gl.drawElements(gl.TRIANGLES,M.idx.length,gl.UNSIGNED_SHORT,0);
  gl.uniformMatrix4fv(prog.uVP,false,VP);
  return true;
};
// 총구 월드 좌표(총구 섬광용)
GunMesh.muzzleWorld=function(O,R,U,F,kick,extra){
  var s=this.scale, m=this.muzzle, o=originOf(O,R,U,F,kick||0,extra);
  return { x:o[0]+(R.x*m[0]+U.x*m[1]+F.x*m[2])*s,
           y:o[1]+(R.y*m[0]+U.y*m[1]+F.y*m[2])*s,
           z:o[2]+(R.z*m[0]+U.z*m[1]+F.z*m[2])*s };
};

/* ---------- 로드 ----------
   평소 경로: gunbaked.js 가 먼저 실려 있으면 그걸 쓴다(즉시·195KB·오프라인 OK).
   없으면 원본 .glb 를 받아 그 자리에서 굽는다(6MB, tools/bake.html 도 이 경로를 쓴다). */
GunMesh.init=function(glbUrl, done){
  if(this.ready||this.loading) return;
  if(global.GUN_BAKED){
    try{
      applyBaked(global.GUN_BAKED); this.ready=true;
      if(console&&console.log) console.log('[gunmesh] gunbaked.js — '+this.info);
      if(done) done(true); return;
    }catch(e){
      if(console&&console.warn) console.warn('[gunmesh] 구운 데이터를 못 씁니다('+e.message+') — 원본 .glb 로 시도합니다');
    }
  }
  this.load(glbUrl, done);
};
/* .glb 의 베이스컬러 이미지를 찾아 디코드한다. 못 찾거나 실패하면 null.
   캐릭터 굽기도 같은 경로가 필요해서 load() 안에 있던 걸 밖으로 뺐다. */
function resolveImage(g, url, done){
  var json=g.json, imgIdx=null;
  try{
    var prim=json.meshes[0].primitives[0];
    var mat=json.materials[prim.material];
    imgIdx=json.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source;
  }catch(e){ imgIdx = (json.images&&json.images.length) ? 0 : null; }
  if(imgIdx==null){ done(null); return; }
  var im=json.images[imgIdx];
  function withBytes(bytes, mime){ decodeImage(bytes, mime, done, function(){ done(null); }); }
  if(im.bufferView!=null){
    var bv=json.bufferViews[im.bufferView];
    withBytes(new Uint8Array(g.ab, g.binOff+(bv.byteOffset||0), bv.byteLength), im.mimeType);
  } else if(im.uri){
    /* 외부 파일로 분리된 텍스처(Kenney 계열이 그렇다: Textures/colormap.png).
       예전엔 여기서 그냥 포기해서 총이 통째로 무채색으로 구워졌다 —
       팔레트 텍스처가 곧 그 모델의 생김새라 회색 덩어리로 보인다. */
    if(/^data:/i.test(im.uri)){
      var b64=im.uri.slice(im.uri.indexOf(',')+1), raw=atob(b64);
      var u8=new Uint8Array(raw.length);
      for(var q=0;q<raw.length;q++) u8[q]=raw.charCodeAt(q);
      withBytes(u8, (/data:([^;]+)/i.exec(im.uri)||[])[1]);
    } else {
      var texUrl=url.replace(/[^\/]*$/, '') + im.uri;
      fetch(texUrl).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
        .then(function(tb){
          // Blob 타입을 확장자에서 잡아 준다(기본값이 image/jpeg 라 png 가 어긋날 수 있다)
          var mm=/\.png(\?|$)/i.test(im.uri)?'image/png':(/\.webp(\?|$)/i.test(im.uri)?'image/webp':'image/jpeg');
          withBytes(new Uint8Array(tb), mm); })
        .catch(function(){
          if(console&&console.warn) console.warn('[gunmesh] 텍스처를 못 읽었습니다('+texUrl+') — 무채색으로 굽습니다');
          done(null);
        });
    }
  } else done(null);
}

GunMesh.load=function(url, done){
  if(this.loading||this.ready) return;
  this.loading=true;
  var self=this;
  function fail(e){ self.loading=false; self.err=String(e&&e.message||e);
    if(console&&console.warn) console.warn('[gunmesh] '+self.err+' — 기본 박스 총으로 그립니다');
    if(done) done(false); }
  var req;
  try{ req=fetch(url); }catch(e){ fail(e); return; }
  req.then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.arrayBuffer(); })
    .then(function(ab){
      var g=parseGLB(ab);
      // 이 콜백은 promise 밖(Image.onload)에서 올 수 있어 여기서 던지면 .catch 가 못 잡는다.
      resolveImage(g, url, function(img){
        try{
          build(g, img);
          self.loading=false; self.ready=true;
          if(console&&console.log) console.log('[gunmesh] '+url+' — '+self.info);
          if(done) done(true);
        }catch(e){ fail(e); }
      });
    })
    .catch(fail);
};

global.GunMesh=GunMesh;
})(window);
