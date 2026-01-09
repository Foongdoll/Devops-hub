# DevOps Hub

SSH, Git, CI/CD 흐름을 한 화면에서 다루는 사이드 프로젝트입니다. 데스크톱(Electron)과 웹 UI(React)를 함께 고려한 DevOps 관리 허브를 목표로 합니다.

## 주요 기능
- SSH 터미널 세션 관리 + 실시간 콘솔(xterm) + SFTP 파일 탐색/업로드/다운로드
- Git 원격/브랜치/변경사항/커밋/스태시 관리 및 실시간 이벤트(Socket.IO)
- CI/CD 설정 마법사 UI(리포, 브랜치, 스택, 스크립트 구성) 및 세션 연동
- JWT 로그인/회원가입/리프레시 토큰, 역할 기반 가드
- Electron 데스크톱 쉘(커스텀 타이틀바, 창 제어 IPC, 폴더 선택)

## 구성
```
apps/
  backend/    NestJS API + Socket.IO (Auth, Terminal, Git, CICD)
  frontend/   React/Vite UI + Electron 패키징 스크립트
  electron/   Electron main/preload (개발용 데스크톱 쉘)
  docs/       Next.js 문서 앱
packages/
  ui/                 공유 UI 컴포넌트
  eslint-config/      ESLint 설정
  typescript-config/  TS 설정
infra/
  db/docker-compose.yml  MySQL + Redis
```

## 기술 스택
- Backend: NestJS, TypeORM, MySQL, Redis, Socket.IO, ssh2, swagger
- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, xterm, socket.io-client
- Desktop: Electron
- Tooling: Turborepo, TypeScript, ESLint, Prettier

## 빠른 시작
### 1) 의존성 설치
```bash
npm install
```

### 2) DB/캐시 기동 (선택)
```bash
cd infra/db
docker compose up -d
```

### 3) 환경 변수 설정
`apps/backend/.env` 파일을 로컬 환경에 맞게 수정합니다.

필요한 항목:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `SWAGGER_TITLE`, `SWAGGER_DESCRIPTION`, `SWAGGER_VERSION`

### 4) 서버 실행
```bash
cd apps/backend
npm run dev
```
- 기본 포트: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`

### 5) 프런트 실행
```bash
cd apps/frontend
npm run dev:react
```
- 기본 포트: `http://localhost:5173`
- 프런트는 기본적으로 `http://localhost:3000` API에 연결됩니다.

### 6) Electron 실행 (선택)
```bash
cd apps/electron
npm run dev
```
- Electron은 `http://localhost:5173`을 로드하므로 프런트를 먼저 실행해야 합니다.

### 7) 문서 앱 실행 (선택)
```bash
cd apps/docs
npm run dev
```
- 기본 포트: `http://localhost:3001`

## 주요 엔드포인트
- REST API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api-docs`
- Socket.IO:
  - Git: `ws://localhost:3000/git`
  - CI/CD: `http://localhost:3000/cicd`
  - Terminal: `http://localhost:3000` (기본 네임스페이스)

## 루트 스크립트
```bash
npm run dev    # turbo run dev
npm run build  # turbo run build
npm run lint   # turbo run lint
```

## 상태
- Git/Terminal은 실사용 흐름이 구현되어 있고, CI/CD는 설정 UI/모델과 소켓 뼈대가 있는 초기 단계입니다.

