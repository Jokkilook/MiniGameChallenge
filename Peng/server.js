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
  if(urlPath === '/' || urlPath === '') urlPath = '/index.html';
  // 경로 탈출 방지
  var filePath = path.normalize(path.join(ROOT, urlPath));
  if(filePath.indexOf(ROOT) !== 0){ res.writeHead(403); res.end('forbidden'); return; }
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
  sendRoster(room);
  log('join', 'room='+room, 'id='+id, 'now='+Object.keys(rooms[room]).length);

  var buf = Buffer.alloc(0);
  socket.on('data', function(chunk){
    buf = Buffer.concat([buf, chunk]);
    buf = parseFrames(buf, function(opcode, payload){
      if(opcode === 0x8){ closeClient(); }                     // close
      else if(opcode === 0x9){ send(socket, payload, 0xA); }   // ping -> pong
      else if(opcode === 0x1){ onMessage(payload.toString('utf8')); } // text
    });
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
    if(m.t === 'start'){ broadcast(room, id, JSON.stringify({ t:'start' })); return; } // 호스트가 전원 시작
    if(m.t === 'st'){  m.id = id; m.name = client.name; broadcast(room, id, JSON.stringify(m)); return; }
    if(m.t === 'bl'){  m.id = id; broadcast(room, id, JSON.stringify(m)); return; }
  }
});

/* 대기방 명단 브로드캐스트: 방 전원에게 {players, host}. host = 방에서 가장 먼저 들어온(id 최소) 사람 */
function sendRoster(room){
  var r = rooms[room]; if(!r) return;
  var ids = Object.keys(r).map(Number).sort(function(a,b){ return a-b; });
  var players = ids.map(function(id){ return { id:id, name:r[id].name }; });
  var msg = JSON.stringify({ t:'roster', players:players, host: ids[0] });
  ids.forEach(function(id){ send(r[id].socket, msg); });
}

function broadcast(room, exceptId, str){
  var r = rooms[room]; if(!r) return;
  for(var id in r){ if(+id === exceptId) continue; send(r[id].socket, str); }
}

/* WebSocket 프레임 파서: 버퍼에서 완성된 프레임을 뽑아 콜백, 남은 바이트 반환 */
function parseFrames(b, onFrame){
  var off = 0;
  while(off + 2 <= b.length){
    var b1 = b[off+1];
    var masked = (b1 & 0x80) !== 0;
    var len = b1 & 0x7f;
    var p = off + 2;
    if(len === 126){ if(p+2 > b.length) break; len = b.readUInt16BE(p); p += 2; }
    else if(len === 127){ if(p+8 > b.length) break; len = Number(b.readBigUInt64BE(p)); p += 8; }
    var mask = null;
    if(masked){ if(p+4 > b.length) break; mask = b.slice(p, p+4); p += 4; }
    if(p + len > b.length) break;                 // 프레임 미완성 → 대기
    var payload = b.slice(p, p+len);
    if(masked){ for(var i=0;i<payload.length;i++) payload[i] ^= mask[i & 3]; }
    onFrame(b[off] & 0x0f, payload);
    off = p + len;
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

server.listen(PORT, function(){
  console.log('PENG! 멀티 서버 실행 → http://localhost:' + PORT + '/');
  console.log('친구와 함께: http://localhost:' + PORT + '/?room=<방이름>  (같은 링크 공유)');
});
