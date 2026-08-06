/* PENG! 멀티플레이 서버 — 의존성 0 (Node 내장 모듈만)
 *   실행:  node server.js       (기본 포트 8090, 환경변수 PORT 로 변경)
 *   접속:  http://localhost:8090/         (같은 방)
 *          http://localhost:8090/?room=abc (특정 방 — 친구와 링크 공유)
 * 정적 파일(index.html 등)을 서빙하고, /ws 로 오는 WebSocket을 방 단위로 중계한다.
 * 릴레이 모델: 각 클라이언트가 자기 물리를 로컬에서 돌리고 상태/폭발만 주고받는다.
 */
'use strict';
var http = require('http');
var fs   = require('fs');
var path = require('path');
var crypto = require('crypto');

var PORT = process.env.PORT || 8090;
var ROOT = __dirname;
var MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css',
             '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml',
             '.ico':'image/x-icon', '.woff2':'font/woff2', '.map':'application/json',
             '.glb':'model/gltf-binary' };

/* ---------- 레벨 묶음(levels/_all.js) 자동 생성 ----------
 * 맵을 추가할 때마다 index.html·editor.html 을 손으로 고치지 않도록,
 * levels/ 의 모든 레벨 파일을 하나로 이어붙인 _all.js 를 서버가 만든다.
 * HTML 은 이 파일 하나만 참조하므로 다시 수정할 일이 없다.
 *
 * ※ 생성물이지만 커밋해야 한다. 서버를 켜지 않고 index.html 을 더블클릭해서
 *   여는 오프라인 플레이에서는 이 파일이 이미 있어야 맵이 뜬다.
 */
var LEVELS_DIR = path.join(ROOT, 'levels');
var ALL_FILE   = path.join(LEVELS_DIR, '_all.js');
function buildAllLevels(){
  var files;
  try{ files = fs.readdirSync(LEVELS_DIR); }
  catch(e){ return; }                                    // levels/ 가 없으면 조용히 넘어간다
  files = files.filter(function(f){ return /\.js$/i.test(f) && f.charAt(0) !== '_'; }).sort();
  var out = ['/* 자동 생성 파일 — 직접 고치지 마세요.',
             '   levels/ 안의 레벨 파일들을 server.js 가 이어붙인 것입니다.',
             '   맵을 고치려면 levels/<이름>.js 를 고치거나 editor.html 을 쓰세요. */'];
  for(var i=0;i<files.length;i++){
    out.push('\n/* ---------- levels/' + files[i] + ' ---------- */');
    try{ out.push(fs.readFileSync(path.join(LEVELS_DIR, files[i]), 'utf8')); }catch(e){}
  }
  var txt = out.join('\n');
  // 내용이 같으면 쓰지 않는다 — 안 그러면 아래 감시자가 자기 쓰기에 반응해 무한 루프가 된다.
  try{ if(fs.readFileSync(ALL_FILE, 'utf8') === txt) return; }catch(e){}
  try{ fs.writeFileSync(ALL_FILE, txt); log('levels', '_all.js 갱신 (' + files.length + '개)'); }
  catch(e){ log('levels', '_all.js 쓰기 실패: ' + e.message); }
}
buildAllLevels();
try{
  var rebuildT = null;
  fs.watch(LEVELS_DIR, function(ev, fn){
    if(fn && fn.charAt(0) === '_') return;               // 자기 자신의 변경은 무시
    clearTimeout(rebuildT); rebuildT = setTimeout(buildAllLevels, 120);
  });
}catch(e){ log('levels', '폴더 감시 불가(수동 재시작 필요): ' + e.message); }

/* ---------- 에디터 저장 ----------
 * editor.html 의 [저장] 이 levels/<id>.js 를 직접 쓰게 해준다.
 * 서버는 0.0.0.0 에 바인딩돼 있으므로(친구 LAN 접속용) 이 엔드포인트를 그냥 열면
 * 같은 공유기의 누구나 파일을 쓸 수 있다. 그래서 로컬에서 온 요청만 받는다.
 */
function isLocal(req){
  var a = req.socket.remoteAddress || '';
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1';
}
function handleSave(req, res){
  function fail(code, msg){ res.writeHead(code, {'Content-Type':'text/plain; charset=utf-8'}); res.end(msg); }
  if(!isLocal(req)) return fail(403, '이 서버를 돌리는 PC에서만 저장할 수 있습니다.');
  var body = '', tooBig = false;
  req.on('data', function(c){
    if(tooBig) return;
    body += c;
    if(body.length > 512 * 1024){ tooBig = true; fail(413, '레벨이 너무 큽니다.'); req.destroy(); }
  });
  req.on('end', function(){
    if(tooBig) return;
    var m; try{ m = JSON.parse(body); }catch(e){ return fail(400, '잘못된 요청입니다.'); }
    var id = String(m.id || '');
    // 파일명은 영문/숫자/-/_ 만. '_' 로 시작하는 이름은 _all.js 자리라 막는다.
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,39}$/.test(id)) return fail(400, '맵 이름은 영문·숫자·-·_ 만 쓸 수 있습니다.');
    if(typeof m.text !== 'string' || !m.text) return fail(400, '내용이 비었습니다.');
    var dest = path.join(LEVELS_DIR, id + '.js');
    if(dest.indexOf(LEVELS_DIR + path.sep) !== 0) return fail(400, '잘못된 경로입니다.');
    try{ fs.mkdirSync(LEVELS_DIR, {recursive:true}); }catch(e){}
    fs.writeFile(dest, m.text, function(err){
      if(err) return fail(500, '저장 실패: ' + err.message);
      buildAllLevels();
      log('save', 'levels/' + id + '.js (' + m.text.length + 'B)');
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ ok:true, path:'levels/' + id + '.js' }));
    });
  });
}

/* ---------- 총 메시 굽기 결과 저장 ----------
 * Node 에는 JPEG 디코더가 없어서 굽는 일은 브라우저(tools/bake.html)가 하고,
 * 서버는 그 결과를 gunbaked.js 로 받아쓰기만 한다. 저장과 같은 이유로 로컬 전용이고,
 * 파일명은 클라이언트가 못 정한다(경로가 고정이라 탈출 여지가 없다).
 */
var BAKED_FILE = path.join(ROOT, 'gunbaked.js');
function handleBake(req, res){
  function fail(code, msg){ res.writeHead(code, {'Content-Type':'text/plain; charset=utf-8'}); res.end(msg); }
  if(!isLocal(req)) return fail(403, '이 서버를 돌리는 PC에서만 저장할 수 있습니다.');
  var body = '', tooBig = false;
  req.on('data', function(c){
    if(tooBig) return;
    body += c;
    if(body.length > 8 * 1024 * 1024){ tooBig = true; fail(413, '구운 데이터가 너무 큽니다.'); req.destroy(); }
  });
  req.on('end', function(){
    if(tooBig) return;
    /* 파일명은 클라이언트가 못 정한다 — 내용에 박힌 전역 이름으로만 고른다.
       경로가 고정이라 탈출 여지가 없다. */
    var name = null;
    if(body.indexOf('window.GUN_BAKED=') >= 0) name = 'gunbaked.js';
    else if(body.indexOf('window.BULLET_BAKED=') >= 0) name = 'bulletbaked.js';
    else if(body.indexOf('window.STATION_BAKED=') >= 0) name = 'stationbaked.js';
    else if(body.indexOf('window.SURVIVAL_BAKED=') >= 0) name = 'survivalbaked.js';
    else if(body.indexOf('window.FACTORY_BAKED=') >= 0) name = 'factorybaked.js';
    else if(body.indexOf('window.FOREST_BAKED=') >= 0) name = 'forestbaked.js';
    else if(body.indexOf('window.PROTO_BAKED=') >= 0) name = 'protobaked.js';
    if(!name) return fail(400, '구운 데이터가 아닙니다.');
    fs.writeFile(path.join(ROOT, name), body, function(err){
      if(err) return fail(500, '저장 실패: ' + err.message);
      log('bake', name + ' (' + Math.round(body.length/1024) + 'KB)');
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ ok:true, path:name, bytes:body.length }));
    });
  });
}

/* ---------- 정적 파일 서버 ---------- */
var server = http.createServer(function(req, res){
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  // 클라이언트가 "멀티 서버가 맞는지" 확인하는 용도
  if(urlPath === '/__peng'){ res.writeHead(200, {'Content-Type':'application/json'}); res.end('{"peng":1}'); return; }
  if(urlPath === '/__save'){
    if(req.method !== 'POST'){ res.writeHead(405); res.end('POST only'); return; }
    handleSave(req, res); return;
  }
  /* 킷 폴더의 .glb 목록. 킷을 하나 추가할 때마다 tools/bake.html 에 이름 143개를
     손으로 적는 건 못 할 짓이다 — 폴더를 훑어 알려 준다. Mesh/ 아래로만 제한한다. */
  if(urlPath === '/__kit'){
    var qs = req.url.split('?')[1] || '';
    var q = (/(?:^|&)dir=([^&]*)/.exec(qs) || [,''])[1];
    if(!/^[a-zA-Z0-9_-]{1,40}$/.test(q)){ res.writeHead(400); res.end('bad dir'); return; }
    fs.readdir(path.join(ROOT, 'Mesh', q), function(err, fl){
      if(err){ res.writeHead(404); res.end('[]'); return; }
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify(fl.filter(function(f){ return /\.glb$/i.test(f); })
        .map(function(f){ return f.replace(/\.glb$/i,''); }).sort()));
    });
    return;
  }
  if(urlPath === '/__bake'){
    if(req.method !== 'POST'){ res.writeHead(405); res.end('POST only'); return; }
    handleBake(req, res); return;
  }
  if(urlPath === '/' || urlPath === '') urlPath = '/index.html';
  // 경로 탈출 방지: 단순 접두사 비교는 형제 폴더(예: <ROOT>_evil)도 통과하므로
  // ROOT 자신이거나 ROOT + 구분자로 시작하는 경우만 허용한다.
  var filePath = path.resolve(ROOT, '.' + path.sep + urlPath);
  if(filePath !== ROOT && filePath.indexOf(ROOT + path.sep) !== 0){
    res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(filePath, function(err, data){
    if(err){ res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      // 캐시 헤더가 아예 없으면 브라우저가 휴리스틱으로 예전 파일을 계속 쓴다.
      // 맵을 추가했는데 상대 화면에만 안 뜨는(= 같은 방에서 서로 다른 맵) 원인이 된다.
      // 개발·LAN 서버라 매번 새로 받는 게 맞다.
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    });
    res.end(data);
  });
});

/* ---------- 순수 WebSocket 구현 ---------- */
var GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
var rooms = {};        // room -> { id -> client }
var roomLevel = {};    // room -> 호스트가 고른 맵 id (대기방에서도 같은 코스를 보도록)
var roomPads = {};     // room -> {패드번호: {ready:다시 밟을 수 있는 시각(ms), item:내용물}}
var PAD_CD_MS = 20000; // 아이템 패드 재생성 대기 — index.html 의 PAD_CD 와 맞춘다
/* 패드에 뭐가 들었는지는 표식으로 미리 보인다. 그래서 전원이 같은 걸 봐야 하고,
   내용물은 서버가 정해야 한다(예전엔 밟은 클라가 제안했는데, 보이는 것과
   받는 것이 어긋날 수 있다). index.html 의 ITEMS 키 목록과 맞춰야 한다. */
var ITEM_POOL = ['reverse','power','drum','feather','anchor','pulse'];
function pickItem(){ return ITEM_POOL[Math.floor(Math.random()*ITEM_POOL.length)]; }
function fillPads(room, n){
  var st = roomPads[room] = {};
  n = Math.max(0, Math.min(64, n|0));
  for(var i=0;i<n;i++) st[i] = { ready:0, item:pickItem() };
  return st;
}
function padsetLines(st){
  var out = [];
  for(var k in st) out.push(JSON.stringify({ t:'padset', pad:+k, item:st[k].item }));
  return out;
}
var roomMode  = {};    // room -> 호스트가 고른 게임 모드(coop/versus)
/* AI 봇 — 서버에는 물리도 레벨도 없으므로(순수 중계) 봇은 방장이 자기 클라이언트에서
   돌린다. 서버가 하는 일은 '가상 참가자 슬롯'을 잡아 주고, 방장이 그 슬롯 이름으로
   보내는 상태를 중계하는 것뿐이다. 게스트 입장에서는 사람과 구별되지 않는다. */
var roomBots = {};     // room -> [{id, name, owner}]
var nextBotId = 100000;   // 사람 id(1부터)와 절대 겹치지 않게 멀리 띄운다
function botsOf(room){ return roomBots[room] || (roomBots[room] = []); }
function ownsBot(room, ownerId, botId){
  var b = botsOf(room);
  for(var i=0;i<b.length;i++) if(b[i].id === botId && b[i].owner === ownerId) return b[i];
  return null;
}
var nextId = 1;

function roomOf(url){ var m = /[?&]room=([^&]+)/.exec(url || ''); return m ? decodeURIComponent(m[1]).slice(0,40) : 'lobby'; }

server.on('upgrade', function(req, socket){
  var key = req.headers['sec-websocket-key'];
  if(!key){ socket.destroy(); return; }
  var accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
               'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
               'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n');

  var room = roomOf(req.url);
  // 참가(join=1) 인데 그런 방이 없으면 거부 — 오타 시 빈 방이 생겨 혼란해지는 것 방지
  if(/[?&]join=1/.test(req.url || '') && !rooms[room]){
    send(socket, JSON.stringify({ t:'nosuch', room:room }));
    log('reject', 'no such room='+room);
    setTimeout(function(){ try{ socket.destroy(); }catch(e){} }, 50);
    return;
  }
  var id = nextId++;
  var client = { id:id, socket:socket, room:room, name:('P'+id) };
  (rooms[room] || (rooms[room] = {}))[id] = client;
  send(socket, JSON.stringify({ t:'welcome', id:id, room:room }));
  // 현재 명단은 접속자 본인에게만. 다른 사람에게는 'join'(이름 확정) 이후에 알린다
  // — 그래야 입장 알림에 기본값('P5')이 아니라 실제 이름이 뜬다.
  sendRoster(room, socket);
  log('join', 'room='+room, 'id='+id, 'now='+Object.keys(rooms[room]).length);

  var buf = Buffer.alloc(0), fragState = { frag:null, fragLen:0, fragOp:0 };
  socket.on('data', function(chunk){
    if(closed) return;
    buf = Buffer.concat([buf, chunk]);
    buf = parseFrames(buf, fragState, function(opcode, payload){
      if(opcode === 0x8){ closeClient(); }                     // close
      else if(opcode === 0x9){ send(socket, payload, 0xA); }   // ping -> pong
      else if(opcode === 0x1){ onMessage(payload.toString('utf8')); } // text
    }, function(reason){ log('protocol', 'id='+id, reason); closeClient(); });
  });
  socket.on('error', closeClient);
  socket.on('close', closeClient);

  var closed = false;
  function closeClient(){
    if(closed) return; closed = true;
    var r = rooms[room]; if(r){ delete r[id];
      broadcast(room, id, JSON.stringify({ t:'left', id:id }));
      var mine = botsOf(room).filter(function(b){ return b.owner === id; });
      if(mine.length){
        roomBots[room] = botsOf(room).filter(function(b){ return b.owner !== id; });
        mine.forEach(function(b){ broadcast(room, id, JSON.stringify({ t:'left', id:b.id })); });
      }
      if(Object.keys(r).length === 0){ delete rooms[room]; delete roomLevel[room];
        delete roomMode[room]; delete roomPads[room]; delete roomBots[room]; } else sendRoster(room);
    }
    try{ socket.destroy(); }catch(e){}
    log('left', 'room='+room, 'id='+id);
  }
  function onMessage(str){
    var m; try{ m = JSON.parse(str); }catch(e){ return; }
    if(m.t === 'join'){
      if(typeof m.name === 'string') client.name = m.name.slice(0,24);
      sendRoster(room);
      // 새로 들어온 사람이 방의 현재 상태를 그대로 보도록 맞춰 준다
      if(roomLevel[room]) send(socket, JSON.stringify({ t:'lvl', level:roomLevel[room] }));
      if(roomMode[room])  send(socket, JSON.stringify({ t:'gm',  mode:roomMode[room] }));
      if(roomPads[room]) padsetLines(roomPads[room]).forEach(function(ln){ send(socket, ln); });
      var r0 = rooms[room];
      if(r0) Object.keys(r0).forEach(function(k){
        var o = r0[k];
        if(o.id !== id && o.col) send(socket, JSON.stringify({ t:'col', id:o.id, c:o.col }));
      });
      botsOf(room).forEach(function(b){
        if(b.col) send(socket, JSON.stringify({ t:'col', id:b.id, c:b.col }));
      });
      return;
    }
    if(m.t === 'col'){          // 몸통 색 — #rrggbb 만 통과, 방에 저장해 새 참가자에게도 전달
      if(typeof m.c !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(m.c)) return;
      // 봇 색은 방장이 대신 정한다(그 봇을 소유한 연결일 때만)
      if(m.bot != null){
        var cb = ownsBot(room, id, m.bot|0); if(!cb) return;
        cb.col = m.c;
        var cl = JSON.stringify({ t:'col', id:cb.id, c:m.c });
        broadcast(room, id, cl); send(socket, cl);
        return;
      }
      client.col = m.c;
      broadcast(room, id, JSON.stringify({ t:'col', id:id, c:m.c }));
      return;
    }
    if(m.t === 'gm'){           // 게임 모드 — 호스트만 정한다
      if(id !== hostOf(room)) return;
      if(m.mode !== 'coop' && m.mode !== 'versus') return;
      roomMode[room] = m.mode;
      broadcast(room, id, JSON.stringify({ t:'gm', mode:m.mode }));
      return;
    }
    if(m.t === 'lvl'){          // 대기방에서 호스트가 고른 맵 — 방에 저장해 두고 전원에게
      if(id !== hostOf(room)) return;
      if(typeof m.level !== 'string' || !m.level || m.level.length > 64) return;
      roomLevel[room] = m.level;
      broadcast(room, id, JSON.stringify({ t:'lvl', level:m.level }));
      return;
    }
    if(m.t === 'start'){        // 게임 시작 — 호스트만. 시작 시점의 맵을 같이 실어 보낸다
      if(id !== hostOf(room)) return;
      var lv = (typeof m.level === 'string' && m.level && m.level.length <= 64) ? m.level : roomLevel[room];
      if(lv) roomLevel[room] = lv;
      // 새 경기 — 패드 내용물을 새로 굴려 전원에게 알린다(표식이 서로 달라지면 안 된다)
      var st0 = fillPads(room, m.pads);
      /* 절차적 아레나 시드를 반드시 함께 넘긴다. 예전엔 여기서 메시지를 {t,level} 로
         다시 만드느라 seed 가 통째로 버려졌고, 게스트는 기본 시드로 자기만의 지형을
         만들어 "같은 방인데 서로 다른 판에서 싸우는" 상태가 됐다. */
      var sd = (typeof m.seed === 'number' && isFinite(m.seed)) ? (m.seed >>> 0) : 0;
      broadcast(room, id, JSON.stringify({ t:'start', level:lv, seed:sd }));
      padsetLines(st0).forEach(function(ln){ broadcast(room, id, ln); send(socket, ln); });
      return;
    }
    if(m.t === 'ch'){           // 채팅 — 보낸 사람에게도 되돌려 줘야 자기 화면에 뜬다
      if(typeof m.text !== 'string') return;
      var txt = m.text.slice(0,120); if(!txt) return;
      var line = JSON.stringify({ t:'ch', id:id, name:client.name, text:txt });
      broadcast(room, id, line); send(socket, line);
      return;
    }
    /* 아이템 패드 — 둘이 거의 동시에 밟으면 먼저 도착한 신고만 받는다.
       클라가 아이템을 제안하고 서버는 '누가 먼저인가'만 판정한다. 아이템 표를
       서버에도 복사해 두면 index.html 과 조용히 어긋나기 시작하기 때문이다.
       (친구끼리 하는 프로토타입이라 클라가 좋은 아이템만 제안하는 건 막지 않는다.) */
    if(m.t === 'pick'){
      var pi = m.pad|0;
      if(pi < 0 || pi > 63) return;
      var pads = roomPads[room] || (roomPads[room] = {});
      var slot = pads[pi];
      if(!slot) slot = pads[pi] = { ready:0, item:pickItem() };   // start 를 못 본 방 대비
      var tnow = Date.now();
      if(slot.ready > tnow) return;             // 아직 쿨다운 — 늦게 온 사람은 빈손
      var given = slot.item;
      slot.ready = tnow + PAD_CD_MS;
      slot.item  = pickItem();                  // 다음 내용물을 바로 굴려 표식에 띄운다
      var pline = JSON.stringify({ t:'pad', pad:pi, id:id, item:given });
      var nline = JSON.stringify({ t:'padset', pad:pi, item:slot.item });
      broadcast(room, id, pline); send(socket, pline);
      broadcast(room, id, nline); send(socket, nline);
      return;
    }
    if(m.t === 'bot'){          // AI 참가자 추가/제거 — 방장만
      if(id !== hostOf(room)) return;
      var list = botsOf(room);
      if(m.add){
        if(list.length >= 6) return;                 // 한 방에 봇 6까지
        list.push({ id: nextBotId++, name: 'AI ' + (list.length + 1), owner: id });
      } else {
        var gone = list.pop();
        if(gone) broadcast(room, -1, JSON.stringify({ t:'left', id:gone.id }));
      }
      sendRoster(room);
      return;
    }
    if(m.t === 'fell'){         // 아레나 밖으로 떨어짐 — 떨어진 본인이 알린다
      var who = id;
      if(m.bot != null){ var mb = ownsBot(room, id, m.bot|0); if(!mb) return; who = mb.id; }
      var by = (typeof m.by === 'number' && isFinite(m.by)) ? m.by : null;
      broadcast(room, id, JSON.stringify({ t:'fell', id:who, by:by }));
      // 봇의 낙하는 방장 화면에서도 점수에 반영돼야 한다(자기 신고는 안 되돌아온다)
      if(m.bot != null) send(socket, JSON.stringify({ t:'fell', id:who, by:by }));
      return;
    }
    /* st·bl 은 원래 보낸 사람 id 로 덮어쓴다(남을 사칭하지 못하게). 봇은 예외로,
       'bot' 필드가 있고 그 봇을 이 연결이 소유할 때만 봇 id 로 바꿔 중계한다. */
    if(m.t === 'st' || m.t === 'bl'){
      if(m.bot != null){
        var ob = ownsBot(room, id, m.bot|0); if(!ob) return;
        m.id = ob.id; if(m.t === 'st') m.name = ob.name;
        delete m.bot;
      } else {
        m.id = id; if(m.t === 'st') m.name = client.name;
      }
      broadcast(room, id, JSON.stringify(m));
      return;
    }
  }
});

/* 방의 호스트 = 가장 먼저 들어온(id 최소) 사람 */
function hostOf(room){
  var r = rooms[room]; if(!r) return null;
  var ids = Object.keys(r).map(Number); if(!ids.length) return null;
  return Math.min.apply(null, ids);
}
/* 대기방 명단: 방 전원에게 {players, host}. host = 방에서 가장 먼저 들어온(id 최소) 사람.
   onlySocket 을 주면 그 한 명에게만 보낸다. */
function sendRoster(room, onlySocket){
  var r = rooms[room]; if(!r) return;
  var ids = Object.keys(r).map(Number).sort(function(a,b){ return a-b; });
  var players = ids.map(function(id){ return { id:id, name:r[id].name }; });
  botsOf(room).forEach(function(b){ players.push({ id:b.id, name:b.name, bot:true }); });
  var msg = JSON.stringify({ t:'roster', players:players, host: ids[0] });
  if(onlySocket){ send(onlySocket, msg); return; }
  ids.forEach(function(id){ send(r[id].socket, msg); });
}

function broadcast(room, exceptId, str){
  var r = rooms[room]; if(!r) return;
  for(var id in r){ if(+id === exceptId) continue; send(r[id].socket, str); }
}

/* WebSocket 프레임 파서
   - 프레임 하나와 조립 중인 메시지 전체에 크기 상한을 둔다(메모리 고갈 방지).
   - FIN=0 / opcode=0(continuation) 분할 메시지를 조립한다.
   - 한도를 넘거나 규격을 벗어나면 onFatal 로 연결을 끊는다. */
var MAX_FRAME = 64 * 1024, MAX_MESSAGE = 256 * 1024;
function parseFrames(b, state, onFrame, onFatal){
  var off = 0;
  while(off + 2 <= b.length){
    var b0 = b[off], b1 = b[off+1];
    var fin = (b0 & 0x80) !== 0, opcode = b0 & 0x0f;
    var masked = (b1 & 0x80) !== 0;
    var len = b1 & 0x7f;
    var p = off + 2;
    if(len === 126){ if(p+2 > b.length) break; len = b.readUInt16BE(p); p += 2; }
    else if(len === 127){ if(p+8 > b.length) break;
      var big = b.readBigUInt64BE(p);
      if(big > BigInt(MAX_FRAME)){ onFatal('frame too large'); return Buffer.alloc(0); }
      len = Number(big); p += 8; }
    if(len > MAX_FRAME){ onFatal('frame too large'); return Buffer.alloc(0); }
    if(!masked){ onFatal('client frame must be masked'); return Buffer.alloc(0); }  // 규격상 필수
    if(p+4 > b.length) break;
    var mask = b.slice(p, p+4); p += 4;
    if(p + len > b.length) break;                 // 프레임 미완성 → 더 받을 때까지 대기
    var payload = b.slice(p, p+len);
    for(var i=0;i<payload.length;i++) payload[i] ^= mask[i & 3];
    off = p + len;

    if(opcode === 0x8 || opcode === 0x9 || opcode === 0xA){ onFrame(opcode, payload); continue; } // 제어 프레임은 분할 없음
    if(opcode === 0x0){                            // continuation
      if(!state.frag){ onFatal('unexpected continuation'); return Buffer.alloc(0); }
      state.frag.push(payload); state.fragLen += payload.length;
    } else {                                       // 새 메시지 시작(text/binary)
      if(state.frag){ onFatal('fragment interleaved'); return Buffer.alloc(0); }
      if(fin){ onFrame(opcode, payload); continue; }
      state.frag = [payload]; state.fragLen = payload.length; state.fragOp = opcode;
    }
    if(state.fragLen > MAX_MESSAGE){ onFatal('message too large'); return Buffer.alloc(0); }
    if(fin && state.frag){ onFrame(state.fragOp, Buffer.concat(state.frag)); state.frag = null; state.fragLen = 0; }
  }
  return off > 0 ? b.slice(off) : b;
}

/* 서버→클라이언트 텍스트 프레임(마스킹 없음) */
function send(socket, data, opcode){
  if(!socket || socket.destroyed) return;
  var payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
  var len = payload.length, header;
  if(len < 126){ header = Buffer.from([0x80 | (opcode || 0x1), len]); }
  else if(len < 65536){ header = Buffer.alloc(4); header[0] = 0x80 | (opcode || 0x1); header[1] = 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x80 | (opcode || 0x1); header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2); }
  try{ socket.write(Buffer.concat([header, payload])); }catch(e){}
}

function log(){ var a = Array.prototype.slice.call(arguments); console.log('[peng]', a.join(' ')); }

// 0.0.0.0 = 모든 네트워크 인터페이스에서 수신(외부 접속 허용). 기본값이며 별도 설정 불필요.
server.listen(PORT, '0.0.0.0', function(){
  var os = require('os'), ifs = os.networkInterfaces(), lan = [];
  Object.keys(ifs).forEach(function(name){
    (ifs[name] || []).forEach(function(a){
      if(a.family === 'IPv4' && !a.internal) lan.push({ name:name, ip:a.address });
    });
  });
  console.log('');
  console.log('  PENG! 멀티 서버 실행 중 (포트 ' + PORT + ', 모든 인터페이스 수신)');
  console.log('');
  console.log('  이 PC에서:      http://localhost:' + PORT + '/');
  if(lan.length){
    console.log('  같은 공유기의 친구에게 알려줄 주소:');
    lan.forEach(function(l){ console.log('      http://' + l.ip + ':' + PORT + '/     (' + l.name + ')'); });
  }
  console.log('');
  console.log('  · 친구가 접속이 안 되면 Windows 방화벽에서 Node.js 인바운드를 허용하세요.');
  console.log('  · 인터넷 너머의 친구는 공유기 포트포워딩(' + PORT + ') 또는 터널이 필요합니다:');
  console.log('        npx localtunnel --port ' + PORT);
  console.log('');
});
