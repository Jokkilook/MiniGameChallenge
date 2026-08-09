# BGM — 맵 배경음

여기에 파일을 떨어뜨리기만 하면 게임이 알아서 씁니다. 코드는 안 고쳐도 됩니다.

## 넣어야 할 파일 (6개)

맵에서 도는 곡 넷 — **어느 판인가**로 갈립니다.

| 파일 이름 | 쓰는 맵 | 화면 |
|---|---|---|
| `space.mp3`   | `arena` 우주 정거장 · `hangar` 정거장 격납고 | 금속·진공·어두운 남색 |
| `factory.mp3` | `plant` 조립 라인 | 컨베이어·기계 팔·주황 경고색 |
| `lab.mp3`     | `protoring` 프로토타입 링 | 무채색 실험실·회색 프로토타입 |
| `outdoor.mp3` | `camp` 야영지 · `grove` 숲 공터 · `peak` 피크 | 풀·나무·바깥 |

맵 밖에서 도는 곡 둘 — **무엇을 하는 중인가**로 갈립니다.

| 파일 이름 | 언제 | 화면 |
|---|---|---|
| `title.mp3`   | 첫 화면과 거기서 이어지는 메뉴(맵 고르기·설정·참가·결과) | 뒤에서 판이 천천히 도는 타이틀 |
| `waiting.mp3` | 대기방 = 자유 연습. 판 위에 서 있지만 아직 경기는 아님 | 사람을 기다리며 몸 푸는 중 |

이름이 정확히 맞아야 합니다(전부 소문자, 공백 없음 — 배포 대상인 리눅스는 대소문자를
구분합니다). `.mp3` 가 없으면 `.ogg` 를 찾고, 둘 다 없으면 그 자리는 무음으로 돕니다
(게임은 정상 동작하고 콘솔에 한 줄만 남습니다).

맵 → 트랙 대응표는 `index.html` 의 `BGM_TRACK`, 맵 밖 두 곡은 그 아래 `BGM_TITLE` ·
`BGM_WAIT` 입니다. 맵을 추가하면 `BGM_TRACK` 에 한 줄만 더하면 됩니다.

곡이 언제 바뀌는지는 `bgmSync` 한 곳에서 정합니다. 화면 이름이 아니라 상태로 고릅니다 —
경기 중이면 그 판의 곡, 대기방이면 `waiting`, 그 밖에는 전부 `title` 입니다.

## 왜 7개가 아니라 4개인가

맵은 7개지만 에셋 킷은 4갈래(정거장 / 공장 / 프로토타입 / 야외)입니다. 같은 킷으로
지은 맵은 화면이 서로 닮아서, 곡까지 나누면 만드는 품만 늘고 듣는 쪽은 구분하지
못합니다. 넷을 제대로 만드는 쪽이 일곱을 얕게 만드는 것보다 낫습니다.

## 곡의 톤 — 공통

**참고점: 카트라이더 「노르테유 워프게이트」.**

카트라이더를 참고하되, 빌리지·동화 테마의 통통 튀는 밝은 곡이 아니라 **노르테유(우주
테마) 쪽의 서늘한 트랜스/테크노**입니다. 이 차이가 이 게임 음악의 전부입니다.

게임 화면을 보세요. 검은 별밭에 뜬 흰 금속 갑판, 회색 패널, 머스터드 노랑 포인트.
**우중충하지 않지만 축제도 아닙니다** — 깔끔하고 서늘하고 조금 무심합니다.
PUNG! 이 파티 액션이고 총이 사람을 죽이는 대신 뻥 하고 밀어내는 건 맞지만,
그게 곧 "신나서 웃는 음악"을 뜻하지는 않습니다.

세 축을 따로 잡습니다:

- **에너지 = 항속.** 사방치기 킥이 멈추지 않지만 몰아치지는 않습니다. 흥분이 아니라
  꾸준한 추진력. 곡이 나를 재촉하지 않아야 합니다.
- **밝기 = 서늘하게.** 장조로 활짝 웃는 훅 대신 **단조/모달의 단단한 리프.**
  매끈하고 집중된 소리. 웃기려 들지 않습니다.
- **속도 = 124~128 BPM.** 140 은 너무 빨랐습니다. 트랜스가 원래 사는 영역으로
  내려오면 조급함이 빠지고 공간이 생깁니다.

곡을 끌고 가는 것은 **굴러가는 아르페지오**입니다. 리드는 노래하지 말고 패턴을
반복해야 합니다 — 몇십 판을 듣게 될 소리라 노래하는 멜로디는 금세 질립니다.

그 밖에:

- 피해야 할 것은 전자음 전체가 아니라 **무겁고 진지한 쪽**입니다: 덥스텝, 서브베이스가
  지배하는 믹스, 디스토션 기타, 웅장한 오케스트라, 공포물.
- 어쿠스틱 악기(우쿨렐레·휘파람·테레민·브러시 드럼)는 **넣지 마세요.** 연주자의 습관이
  소리의 본체인 악기라 AI 가 만들면 티가 가장 크게 납니다. 신스·칩튠처럼 원래부터
  기계적인 음색은 AI 로 만들어도 티가 안 납니다.
- 네 곡이 **한 게임의 음악으로 들려야 합니다.** 위 성격과 템포는 넷이 공유하고,
  맵마다 달라지는 건 음색과 리듬의 결입니다.

## SUNO 프롬프트

네 곡 모두 **Instrumental 켜기**(가사 없음), 길이는 **2분 이상**이면 충분합니다
(게임에서 이어 붙여 반복 재생합니다).

프롬프트가 길수록 SUNO 는 이걸 "들려줄 작품"으로 해석해서 인트로 → 전개 → 전환이
있는 완성곡을 만듭니다. 게임 BGM 은 작품이 아니라 깔개라, 짧게 쓰고 구조를 막는 말
(`no long intro`, `no breakdown`, `loopable`)을 반드시 넣으세요.

**트랜스는 특히 조심해야 합니다.** 장르 이름만 주면 SUNO 는 빌드업 → 브레이크다운 →
드롭이 있는 클럽 트랙을 만듭니다. 그래서 Exclude 에 `build up`·`breakdown`·`drop`·
`euphoric` 이 반드시 들어가야 합니다. `euphoric` 은 트랜스의 기본 정서라 안 막으면
서늘함이 도로 밝아집니다.

### 1. `space.mp3` — 우주 정거장 · 격납고

```
Style:
cool minor key melodic techno, rolling 16th arpeggio synth carrying the track,
steady four on the floor, offbeat bass, tight closed hats, restrained saw lead
repeating one short pattern, wide spacey reverb, metallic clank accents,
sleek space station, 126 BPM, loopable, no long intro

Exclude:
vocals, euphoric, uplifting, cheerful, happy, festive, bubblegum, fanfare,
major key sparkle, build up, breakdown, drop, dubstep, sub bass, distorted
guitar, orchestral, cinematic, horror, ballad, acoustic instruments
```

### 2. `factory.mp3` — 조립 라인

```
Style:
cool minor key industrial techno, rolling arpeggio synth, gritty offbeat
bassline, metallic hits and machine clanks used as percussion, steady four on
the floor, short square lead pattern, mechanical and relentless, 128 BPM,
loopable, no long intro

Exclude:
vocals, euphoric, uplifting, cheerful, happy, festive, bubblegum, fanfare,
major key sparkle, build up, breakdown, drop, dubstep, sub bass, distorted
guitar, industrial metal, orchestral, horror, ballad, acoustic instruments
```

### 3. `lab.mp3` — 프로토타입 링

```
Style:
cool modal minimal techno, clipped chiptune arpeggios, bleepy square lead
repeating one short pattern, tight claps, steady four on the floor, dry and
clinical, clean and sparse, 124 BPM, loopable, no long intro

Exclude:
vocals, euphoric, uplifting, cheerful, happy, festive, bubblegum, fanfare,
major key sparkle, build up, breakdown, drop, dubstep, sub bass, distorted
guitar, orchestral, sci-fi horror, dark ambient, ballad, acoustic instruments
```

### 4. `outdoor.mp3` — 야영지 · 숲 공터 · 피크

```
Style:
cool minor key melodic techno, rolling arpeggio synth, bright pluck lead
repeating one short pattern, steady four on the floor, offbeat hats, marimba
accents, open and airy but not sugary, 126 BPM, loopable, no long intro

Exclude:
vocals, euphoric, uplifting, cheerful, happy, sunny, carefree, festive,
bubblegum, tropical house, steel drum, fanfare, major key sparkle, build up,
breakdown, drop, dubstep, sub bass, distorted guitar, orchestral, dark, ballad,
ukulele, acoustic guitar
```

### 마음에 안 들 때 — 어디를 만질지

- **너무 화기애애하다 / 들떠 있다** → Exclude 에 `euphoric`·`uplifting`·`cheerful`·
  `major key sparkle` 이 있는지 보세요. 장르를 바꿀 필요는 없습니다 — 계열은 맞고
  밝기만 과한 겁니다.
- **곡이 중간에 확 바뀐다 / 조용해졌다 터진다** → SUNO 가 클럽 트랙을 만든 겁니다.
  `build up`·`breakdown`·`drop` 을 Exclude 에 넣으세요.
- **재촉당하는 느낌이다** → BPM 을 2~4 내리세요. 넷을 같이 내려야 합니다.
- **AI 티가 난다(가짜 같다)** → 어쿠스틱 악기가 섞였는지 보세요. 빼고 신스·칩튠으로
  몰면 대개 사라집니다.
- **몇 판 듣다 질린다** → 리드가 노래하고 있는 겁니다. `repeating one short pattern`
  을 강조하고 `sparse lead`, `background bed` 를 넣으세요.
- **맵마다 따로 노는 네 곡이 됐다** → BPM 을 124~128 안에 모으고, 아르페지오 음색을
  하나로 통일하세요.

## 내보낼 때

- **포맷** — mp3 128~192kbps 면 충분합니다. 곡당 2~3MB 정도가 목표입니다
  (fly.io 이미지에 그대로 들어갑니다).
- **앞뒤 무음을 잘라내세요.** 이어 붙여 반복하므로 무음이 남으면 한 바퀴 돌 때마다
  음악이 끊긴 것처럼 들립니다.
- **크기(음량)를 네 곡끼리 맞추세요.** 맵을 옮길 때마다 볼륨을 다시 만지게 되면
  안 됩니다. 효과음보다 조금 작은 정도가 적당합니다 — 기본값이 효과음 60 / 배경음 45 입니다.
- SUNO 가 준 곡이 마음에 드는데 뒤쪽에 늘어지는 부분이 있으면, 좋은 구간만 잘라
  쓰는 편이 낫습니다. 어차피 반복 재생입니다.

## 라이선스

SUNO 로 만든 곡의 이용 조건은 계정 플랜에 따라 다릅니다. 심사에 내기 전에
본인 플랜의 상업/공개 이용 조건을 확인해 두세요.
