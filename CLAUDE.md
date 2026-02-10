# Blind Platform - Project Notes

## Project Overview
Anonymous workplace community platform (like Blind app)
- **Frontend**: Next.js 14 (apps/web) - Port 3001, basePath `/blind`
- **Backend**: Express.js (apps/api) - Port 4007
- **Database**: PostgreSQL (blind_db)
- **Process Manager**: PM2 (blind-web, blind-api)

## Database Connection
```
Host: localhost
User: blind_user
Password: blind_password
Database: blind_db
```

## Recent Work (2026-02-08)

### Admin Settings Implementation
관리자 설정이 실제로 동작하도록 구현

#### 1. Maintenance Mode Middleware
- `apps/api/src/middleware/maintenance.middleware.ts` 생성
- 유지보수 모드 활성화 시 일반 사용자 API 접근 차단
- 관리자 및 로그인/설정 API는 허용

#### 2. Settings Applied to Services
- **auth.service.ts**: 회원가입 허용 여부, 비밀번호 최소 길이, 세션 만료시간
- **post.service.ts**: 일일 게시글 제한
- **comment.service.ts**: 일일 댓글 제한

#### 3. Email Service Update
- `apps/api/src/services/email.service.ts` 수정
- 우선순위: AWS SES → Postfix/sendmail → Console logging
- Postfix 설치 및 구성 완료

#### 4. Admin Functionality Verified (All Working)
| 기능 | API 엔드포인트 | 상태 |
|------|----------------|------|
| 게시글 고정/숨김/삭제 | `/posts/admin/:id/*` | ✅ |
| 사용자 정지/활성화/역할변경 | `/users/admin/:id/*` | ✅ |
| 커뮤니티 생성/수정/삭제 | `/communities/admin/*` | ✅ |
| 알림 개별/전체 발송 | `/notifications/admin/*` | ✅ |
| 댓글 숨김/삭제 | `/comments/:id/*` | ✅ |
| 신고 처리/기각 | `/reports/:id/*` | ✅ |
| 설정 변경 | `/settings/admin/*` | ✅ |

### Admin Pages - All Have Full CRUD
모든 관리자 페이지에 수정/삭제 기능 구현되어 있음 확인:
- Ads, Comments, Community Requests, Notifications
- Posts, Reports, Users, Communities, Companies
- Tags, Interest Categories, Public Servant Categories, Settings

---

## Previous Work (2026-02-07)

### Branding & Feature Updates

#### 1. Logo Change
- Changed logo from "Blind" to "bulag" across all pages:
  - Header (`components/layouts/header.tsx`)
  - Sidebar (`components/layouts/sidebar.tsx`)
  - Login page (`app/(auth)/login/page.tsx`)
  - Register page (`app/(auth)/register/page.tsx`)
  - Forgot password page (`app/(auth)/forgot-password/page.tsx`)
  - Browser tab title (`app/layout.tsx`)

#### 2. Post Edit Feature - NEW
- Added post edit page: `apps/web/src/app/(main)/post/[id]/edit/page.tsx`
- Added "Edit" button on post detail page (visible only to post author)
- Uses existing `PATCH /api/v1/posts/:id` API endpoint
- Author permission check on both frontend and backend

#### 3. Rate Limit Adjustment
- Changed rate limit settings in `apps/api/src/config/index.ts`:
  - Before: 15 minutes window, 1000 requests
  - After: 1 minute window, 1000 requests (more lenient)

### Korean to English Translation - COMPLETED

#### 1. UI Code Translation
All Korean text in the codebase has been translated to English:

**Shared Package** (`packages/shared/src/schemas/`):
- comment.schema.ts, post.schema.ts, community.schema.ts, company.schema.ts, message.schema.ts, report.schema.ts

**API Services** (`apps/api/src/`):
- Middleware: auth.middleware.ts, error.middleware.ts, notFound.middleware.ts
- Services: auth, post, comment, community, notification, report, user, email, settings, community-request
- Controllers: auth, report, settings, user, community-request
- Main: index.ts (rate limit message)

**Web Frontend - Admin Pages** (15 files in `apps/web/src/app/admin/`):
- Dashboard, layout, posts, comments, communities, companies, users, notifications, reports, settings, tags, ads, public-servant-categories, interest-categories, community-requests

**Web Frontend - User Pages** (20+ files):
- Main pages: community, settings, bookmarks, profile, messages, posts, communities
- Auth pages: login, register, forgot-password
- Other pages: my-requests, request-community, companies
- Components: sidebar, comment-section, report-modal, access-restricted
- Hooks: use-permissions.ts, use-community-request.ts

#### 2. Database Data Translation
All Korean data in the database has been translated to English:

**Communities** (24 items):
- 자유게시판 → Free Talk
- 커리어 → Career
- 개발자 라운지 → Developer Lounge
- IT 업계 → IT Industry
- 삼성전자 → Samsung Electronics
- LG전자 → LG Electronics
- SK하이닉스 → SK Hynix
- 네이버 → Naver
- 카카오 → Kakao
- 쿠팡 → Coupang
- 토스 → Toss
- 현대자동차 → Hyundai Motor
- 경찰 커뮤니티 → Police Community
- 교사 커뮤니티 → Teacher Community
- 군인 커뮤니티 → Military Community
- 소방관 커뮤니티 → Firefighter Community
- 보건의료 커뮤니티 → Healthcare Community
- 행정직 커뮤니티 → Government Admin Community
- 지역 → Local
- etc.

**Public Servant Categories** (6 items):
- 경찰 → Police
- 교사 → Teacher
- 군인 → Military
- 보건의료 → Healthcare
- 소방관 → Firefighter
- 행정직 → Government Admin

**Interest Categories** (10 items):
- 게이밍 → Gaming
- 투자 → Investment
- 라이프스타일 → Lifestyle
- Tech & 개발 → Tech & Development
- 리그오브레전드 → League of Legends
- 발로란트 → Valorant
- 배틀그라운드 → PUBG
- 부동산 → Real Estate
- 주식 → Stocks
- 코인 → Crypto

**Tags** (6 items):
- 꿀팁 → Tips
- 면접 → Interview
- 연봉 → Salary
- 워라밸 → Work-Life Balance
- 이직 → Job Change
- 회사문화 → Company Culture

**Companies** (8 items):
- Same as communities (Samsung Electronics, LG Electronics, etc.)

#### 3. Test Data Cleanup
- Deleted test categories and tags containing Korean text

### Notes
- Regex patterns in slug generation (`[^a-z0-9가-힣]`) intentionally kept to allow Korean characters in slugs
- After changes, run `npm run build` and `pm2 restart blind-api blind-web`

## Commands Reference
```bash
# Build
cd /var/www/blind && npm run build

# Restart services
pm2 restart blind-api blind-web

# Database access
PGPASSWORD=blind_password psql -h localhost -U blind_user -d blind_db

# Check for Korean text in database
PGPASSWORD=blind_password psql -h localhost -U blind_user -d blind_db -c "SELECT name FROM communities WHERE name ~ '[가-힣]';"
```
