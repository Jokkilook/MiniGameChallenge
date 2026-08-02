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
             '.ico':'image/x-icon', '.woff2':'font/woff2', '.map':'application/json' };

/* ---------- 정적 파일 서버 ---------- */
var server = http.createServer(function(req, res){
  var urlPath = decodeURIComponent(req.url.split('?')[0]);
  // 클라이언트가 "멀티 서버가 맞는지" 확인하는 용도
  if(urlPath === '/__peng'){ res.writeHead(200, {'Content-Type':'application/json'}); res.end('{"peng":1}'); return; }
  if(urlPath === '/' || urlPath === '') urlPath = '/index.html';
  // 경로 탈출 방지: 단순 접두사 비교는 형제 폴더(예: <ROOT>_evil)도 통과하므로
  // ROOT 자신이거나 ROOT + 구분자로 시작하는 경우만 허용한다.
  var filePath = path.resolve(ROOT, '.' + path.sep + urlPath);
  if(filePath !== ROOT && filePath.indexOf(ROOT + path.sep) !== 0){
    res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(filePath, function(err, data){
    if(err){ res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

/* ---------- 순수 WebSocket 구현 ---------- */
var GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
var rooms = {};        // room -> { id -> client }
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
      if(Object.keys(r).length === 0) delete rooms[room]; else sendRoster(room);
    }
    try{ socket.destroy(); }catch(e){}
    log('left', 'room='+room, 'id='+id);
  }
  function onMessage(str){
    var m; try{ m = JSON.parse(str); }catch(e){ return; }
    if(m.t === 'join'){ if(typeof m.name === 'string') client.name = m.name.slice(0,24); sendRoster(room); return; }
    if(m.t === 'start'){                       // 호스트만 시작시킬 수 있다
      if(id !== hostOf(room)) return;
      broadcast(room, id, JSON.stringify({ t:'start' })); return;
    }
    if(m.t === 'ch'){   // 채팅: 길이 제한 후 본인 포함 방 전원에게(모두 같은 순서로 보이도록)
      var text = String(m.text == null ? '' : m.text).slice(0, 120);
      if(!text.trim()) return;
      var out = JSON.stringify({ t:'ch', id:id, name:client.name, text:text });
      var r = rooms[room]; if(r) Object.keys(r).forEach(function(k){ send(r[k].socket, out); });
      return;
    }
    if(m.t === 'st'){  m.id = id; m.name = client.name; broadcast(room, id, JSON.stringify(m)); return; }
    if(m.t === 'bl'){  m.id = id; broadcast(room, id, JSON.stringify(m)); return; }
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
