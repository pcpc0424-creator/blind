# Blind Platform - 직장인 익명 커뮤니티

블라인드와 유사한 직장인 익명 커뮤니티 플랫폼입니다.

## 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (서버 상태 관리)
- **Zustand** (전역 상태 관리)
- **React Hook Form** + **Zod** (폼 처리 및 유효성 검사)

### Backend
- **Node.js 20 LTS**
- **Express.js** + **TypeScript**
- **Prisma ORM**
- **PostgreSQL 16**
- **Redis 7**

### Infrastructure
- **Turborepo** (모노레포)
- **Docker Compose** (로컬 개발 환경)

## 프로젝트 구조

```
blind-platform/
├── apps/
│   ├── web/                    # Next.js 프론트엔드
│   └── api/                    # Express.js 백엔드
├── packages/
│   ├── database/               # Prisma 클라이언트 & 스키마
│   └── shared/                 # 공유 유틸리티, 타입, Zod 스키마
├── docker/
│   └── docker-compose.yml      # PostgreSQL, Redis
└── turbo.json                  # Turborepo 설정
```

## 시작하기

### 필수 조건
- Node.js 20 이상
- npm 또는 pnpm
- Docker & Docker Compose
- Nginx (프로덕션 배포용)

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일이 루트에 이미 생성되어 있습니다. 필요에 따라 수정하세요.

### 3. Docker 서비스 시작 (PostgreSQL, Redis)

```bash
cd docker
docker-compose up -d
```

### 4. 데이터베이스 초기화

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 스키마 적용
npm run db:push

# 시드 데이터 삽입
npm run db:seed
```

### 5. 개발 서버 실행

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## 프로덕션 배포 (http://115.68.223.124/blind)

### 1. 빌드

```bash
npm run build
```

### 2. Nginx 설정

```bash
# Nginx 설정 파일 복사
sudo cp nginx.conf /etc/nginx/sites-available/blind
sudo ln -sf /etc/nginx/sites-available/blind /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. PM2로 서버 실행

```bash
# PM2 설치 (처음 한 번만)
npm install -g pm2

# 서버 시작
npm run start:pm2

# 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 서버 중지
npm run stop:pm2
```

### 4. 접속

- URL: http://115.68.223.124/blind

## 주요 기능

### 인증 (3단계 이메일 인증)
1. 회사 이메일 제출 → 도메인으로 회사 매칭
2. 이메일 인증코드 확인
3. 비밀번호 설정 → 익명 닉네임 자동 생성

### 커뮤니티
- 회사 커뮤니티 (인증된 직원만)
- 일반 커뮤니티 (직군별, 업종별, 지역별)

### 게시글 & 댓글
- 익명/비익명 선택
- 이미지 첨부
- 태그 시스템
- 좋아요/싫어요 투표
- 대댓글 지원

### 검색
- 게시글, 회사, 커뮤니티 통합 검색
- 태그 기반 검색

## API 엔드포인트

```
/api/v1

# 인증
POST /auth/register          # 이메일 → 인증코드 발송
POST /auth/verify-email      # 인증코드 확인
POST /auth/complete          # 가입 완료
POST /auth/login             # 로그인
POST /auth/logout            # 로그아웃
GET  /auth/me                # 현재 사용자

# 커뮤니티
GET  /communities            # 커뮤니티 목록
GET  /communities/me         # 내 커뮤니티
GET  /communities/:slug      # 커뮤니티 상세
POST /communities/:slug/join # 가입
POST /communities/:slug/leave # 탈퇴

# 게시글
GET  /posts                  # 피드
GET  /posts/trending         # 인기글
GET  /posts/:id              # 상세
POST /posts                  # 작성
PATCH /posts/:id             # 수정
DELETE /posts/:id            # 삭제
POST /posts/:id/vote         # 투표
POST /posts/:id/bookmark     # 북마크

# 댓글
GET  /posts/:id/comments     # 댓글 목록
POST /posts/:id/comments     # 댓글 작성
PATCH /comments/:id          # 수정
DELETE /comments/:id         # 삭제
POST /comments/:id/vote      # 투표

# 회사
GET  /companies              # 회사 목록
GET  /companies/search       # 검색
GET  /companies/:slug        # 상세
```

## 데이터베이스 스키마

### 핵심 테이블
- `users` - 사용자 (익명 닉네임, 회사 연결)
- `email_verifications` - 이메일 인증 (해시로 익명성 보장)
- `companies` - 회사 정보
- `company_domains` - 회사 이메일 도메인
- `communities` - 커뮤니티
- `posts` - 게시글
- `comments` - 댓글
- `votes` - 투표

## 브랜드 컬러

- Primary: `#8b5cf6` (Purple)

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트
npm run lint

# 코드 포맷팅
npm run format

# 데이터베이스
npm run db:generate    # Prisma 클라이언트 생성
npm run db:push        # 스키마 푸시
npm run db:migrate     # 마이그레이션 실행
npm run db:seed        # 시드 데이터 삽입
```

## 라이선스

MIT
