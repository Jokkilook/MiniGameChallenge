# 이 파일은 fly.io 배포용입니다 — 로컬 플레이에는 필요 없습니다.
# PUNG! 은 의존성이 0(Node 내장 모듈만)이라 npm install 단계가 없습니다.
# 그래서 fly launch 의 Node 자동 감지(package.json 을 봅니다)가 걸리지 않아,
# 이 Dockerfile 을 직접 둡니다.
FROM node:22-alpine

WORKDIR /app
COPY . .

# server.js 는 process.env.PORT 를 읽습니다(기본 8090).
# fly.toml 의 internal_port 와 반드시 같아야 합니다.
ENV PORT=8080
EXPOSE 8080

# 시작할 때 server.js 가 levels/_all.js 를 다시 만듭니다 —
# 컨테이너 쓰기 계층에 쓰므로 별도 볼륨은 필요 없습니다.
CMD ["node", "server.js"]
