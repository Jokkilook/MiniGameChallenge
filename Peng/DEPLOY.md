# PENG! 배포 메모 (fly.io)

제출 심사 기간에 심사위원이 아무 때나 들어와 플레이할 수 있도록 올려 둔 서버 기록.
**로컬 플레이(`node server.js`)에는 이 문서도, `Dockerfile`·`fly.toml`도 필요 없습니다.**

- **주소: <https://peng-vs.fly.dev/>**
- 앱 `peng-vs` · 리전 `nrt`(도쿄) · 머신 1개 · `shared-cpu-1x` / 256MB
- 배포일 2026-08-08 · 소유: kshpt9043 개인 org

---

## 왜 정적 호스팅으로는 안 되나

itch.io·GitHub Pages 같은 곳에 `index.html` 만 올리면 **심사위원은 빈 아레나에서 혼자 뜁니다.**

- 지금 출시 대상은 경쟁 모드뿐이고(`index.html:2966-2968`), 경쟁은 상대가 있어야 시작됩니다
- 혼자일 때 상대가 되어 주는 **AI 봇이 `mpIsHost()` 게이트 안**에 있습니다(`index.html:1494`, `3574`)
- `mpIsHost()` 는 `MP.connected` 가 참이어야 하므로(`index.html:3127`), **봇조차 WebSocket 서버가 떠 있어야 붙습니다**

서버만 떠 있으면 심사위원 한 명으로 충분합니다. 봇도 인원수에 포함되어(`index.html:3570`)
1명 + AI 1이면 시작 버튼이 열립니다.

### 심사위원이 밟는 경로

> 링크 접속 → **방 만들기** → **+ AI** → **시작**

---

## 구성 파일

| 파일 | 역할 |
|---|---|
| `Dockerfile` | `node:22-alpine` 에 복사 후 `node server.js`. 의존성이 0이라 `package.json` 이 없고, 그래서 fly 의 Node 자동 감지가 안 걸려 직접 둡니다 |
| `fly.toml` | 도쿄 리전, `internal_port = 8080`, 상시 가동, 인스턴스 1개 고정 |
| `.dockerignore` | `.git`·`.claude` 만 제외. `Mesh/`·`Image/`·`levels/` 는 서버가 서빙하므로 반드시 포함 |

`server.js` 는 `process.env.PORT` 를 읽고(기본 8090) `0.0.0.0` 에 바인딩하므로
**게임 코드는 한 줄도 고치지 않았습니다.**

HTTPS 도 그대로 동작합니다 — `index.html:3133` 이 `location.protocol` 을 보고 `wss:` 로 붙습니다.

---

## 배포 절차

```bash
# 최초 1회
flyctl auth login
flyctl apps create peng-vs --org personal

# 배포 (Peng 폴더 기준. 리포 루트는 한 단계 위라 경로 주의)
flyctl deploy C:\MiniGameChallenge\Peng --remote-only
```

`--remote-only` 는 로컬에 Docker 가 없어도 fly 원격 빌더로 굽게 합니다.

> flyctl 이 PATH 에 없으면 전체 경로로: `C:\Users\kshpt\.fly\bin\flyctl.exe`
> (설치는 됐지만 셸을 재시작해야 PATH 가 잡힙니다)

### ⚠️ 첫 배포 직후 반드시 확인 — 머신이 2개 생깁니다

`min_machines_running = 1` 을 넣어도 첫 `fly deploy` 는 고가용성 명목으로 머신을 2개 만듭니다.
**방 목록이 서버 메모리에 있어서, 2개면 두 사람이 다른 머신에 붙어 같은 방에서 못 만납니다.**

```bash
flyctl machines list -a peng-vs     # 1개여야 정상
flyctl scale count 1 -a peng-vs     # 2개면 이걸로 줄임
```

두 번째 배포부터는 기존 머신을 갱신하므로 다시 늘어나지 않습니다.

### 배포 중 뜨는 이 경고는 오탐입니다

```
WARNING The app is not listening on the expected address ...
```

시작할 때 `server.js` 가 `levels/_all.js` 를 다시 굽느라 4초쯤 걸려서,
fly 의 포트 검사가 그보다 먼저 지나간 것입니다. `flyctl logs` 로 기동 로그를 보면 정상입니다.

---

## 배포 후 점검 (2026-08-08 실측)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://peng-vs.fly.dev/                  # 200
curl -s -o /dev/null -w "%{http_code}\n" https://peng-vs.fly.dev/levels/_all.js    # 200
curl -s -X POST https://peng-vs.fly.dev/__save -d '{}' -w " [%{http_code}]\n"      # 403
curl -s -X POST https://peng-vs.fly.dev/__bake -d '{}' -w " [%{http_code}]\n"      # 403
curl -s https://peng-vs.fly.dev/__peng                                             # {"peng":1}

# WebSocket — 101 Switching Protocols 가 떠야 멀티가 됩니다
curl -s -i -N --max-time 8 -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" \
  "https://peng-vs.fly.dev/ws?room=testroom" | head -1
```

`__save`·`__bake` 는 파일을 쓰는 엔드포인트입니다. `server.js:63-65` 의 `isLocal()` 이
`remoteAddress` 로 막는데, fly 프록시를 거치면 루프백이 아니라 정상적으로 403 이 납니다.
**공개 서버에 올릴 때마다 이 두 개는 꼭 확인하세요.**

---

## 자동 배포가 아닙니다

fly 는 GitHub 을 보지 않습니다 — 로컬 폴더에서 이미지를 구워 올립니다.
(그래서 리포 소유자가 팀원이고 이쪽이 콜라보레이터여도 배포에 아무 문제가 없습니다.)

**팀원이 코드를 고쳐도 서버는 그대로입니다.** 반영하려면 사람이 직접:

```bash
git pull
flyctl deploy C:\MiniGameChallenge\Peng --remote-only
```

---

## 💸 과금과 철거

**요금은 앱이 아니라 조직(org) 단위로 청구됩니다.** 앱 페이지에는 금액이 없습니다.

- 사용량·청구액: <https://fly.io/dashboard/personal/billing> (월 단위, 인보이스는 Stripe 포털)
- 앱 상태·로그·머신: <https://fly.io/apps/peng-vs> — 여기는 **금액이 아니라 메트릭**만 봅니다
- CLI 로 앱 페이지 열기: `flyctl dashboard -a peng-vs`

예상 비용: `shared-cpu-1x`/256MB 상시 가동 **월 $2 안팎**, 2주면 **$1~1.5**.
아웃바운드는 아시아 $0.04/GB 인데 심사위원 몇 명이면 1GB 도 안 써서 사실상 0.

> 가입 때 온 **30일 Standard 지원 체험($29/월)** 은 컴퓨트 요금과 무관합니다.
> 직접 "Upgrade Now" 를 누르지 않으면 자동 만료되고 청구되지 않습니다.

### ⚠️ 심사 끝나면 반드시 내리세요

콜드스타트를 없애려고 **상시 가동**으로 뒀기 때문에, 켜 둔 시간만큼 계속 과금됩니다.

```bash
flyctl apps destroy peng-vs
```

**마감선: 2026년 8월 하순** (2026-08-08 기준 심사 기간 약 2주).
잠깐 멈추기만 할 거면 `flyctl scale count 0 -a peng-vs`.
