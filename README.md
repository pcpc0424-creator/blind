# Bulag - Anonymous Workplace Community Platform

An anonymous workplace community platform similar to Blind, where professionals can share insights and connect with colleagues.

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (Server state management)
- **Zustand** (Global state management)
- **React Hook Form** + **Zod** (Form handling & validation)

### Backend
- **Node.js 20 LTS**
- **Express.js** + **TypeScript**
- **Prisma ORM**
- **PostgreSQL 16**

### Infrastructure
- **Turborepo** (Monorepo)
- **PM2** (Process manager)
- **Nginx** (Reverse proxy)

## Project Structure

```
blind/
├── apps/
│   ├── web/                    # Next.js frontend (port 3001)
│   └── api/                    # Express.js backend (port 4007)
├── packages/
│   ├── database/               # Prisma client & schema
│   └── shared/                 # Shared utilities, types, Zod schemas
├── docker/
│   └── docker-compose.yml      # PostgreSQL, Redis
└── turbo.json                  # Turborepo config
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- PostgreSQL 16
- Nginx (for production)

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

### 4. Development Server

```bash
npm run dev
```

- Frontend: http://localhost:3001/blind
- Backend API: http://localhost:4007/api/v1

## Production Deployment

### 1. Build

```bash
npm run build
```

### 2. Start with PM2

```bash
pm2 start ecosystem.config.js
```

### 3. Access

- URL: https://bulagph.com/blind

## Features

### Authentication (3-Step Email Verification)
1. Submit company email → Domain matching
2. Verify email code
3. Set password → Auto-generated anonymous nickname

### Communities
- **Company Communities** - Verified employees only (auto-join)
- **General Communities** - Open to all users
- **Public Servant Communities** - For government employees
- **Interest Communities** - Topic-based communities

### Posts & Comments
- Anonymous/non-anonymous posting
- Image attachments
- Tag system
- Upvote/downvote
- Nested comments

### Reviews
- Company reviews with ratings
- Public servant category reviews
- Rating breakdown (Work-Life, Salary, Stability, Growth)

### Admin Panel
- User management (suspend, activate, role change)
- Post management (pin, hide, delete)
- Comment management
- Community management
- Company management
- Review management (approve, reject)
- Report handling
- Notification broadcasting
- Site settings

## API Endpoints

```
/api/v1

# Authentication
POST /auth/register          # Email → Send verification code
POST /auth/verify-email      # Verify code
POST /auth/complete          # Complete registration
POST /auth/login             # Login
POST /auth/logout            # Logout
GET  /auth/me                # Current user

# Communities
GET  /communities            # List communities
GET  /communities/me         # My communities
GET  /communities/:slug      # Community details
POST /communities/:id/join   # Join
POST /communities/:id/leave  # Leave

# Posts
GET  /posts                  # Feed
GET  /posts/trending         # Trending posts
GET  /posts/:id              # Post details
POST /posts                  # Create post
PATCH /posts/:id             # Update post
DELETE /posts/:id            # Delete post
POST /posts/:id/vote         # Vote
POST /posts/:id/bookmark     # Bookmark

# Comments
GET  /posts/:id/comments     # List comments
POST /posts/:id/comments     # Create comment
PATCH /comments/:id          # Update comment
DELETE /comments/:id         # Delete comment
POST /comments/:id/vote      # Vote

# Reviews
GET  /reviews/company/:id           # Company reviews
POST /reviews/company/:id           # Create company review
GET  /reviews/public-servant/:id    # Public servant reviews
POST /reviews/public-servant/:id    # Create public servant review

# Companies
GET  /companies              # List companies
GET  /companies/search       # Search companies
GET  /companies/:slug        # Company details

# Admin
GET  /reviews/admin/:type    # Admin review list
PATCH /reviews/:id/approve   # Approve review
PATCH /reviews/:id/reject    # Reject review
DELETE /reviews/:id          # Delete review
```

## Database

### Core Tables
- `users` - Users (anonymous nickname, company link)
- `email_verifications` - Email verification (hashed for anonymity)
- `companies` - Company information
- `company_domains` - Company email domains
- `communities` - Communities
- `posts` - Posts
- `comments` - Comments
- `votes` - Votes
- `company_reviews` - Company reviews
- `public_servant_reviews` - Public servant reviews

## Development Commands

```bash
# Development server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Format code
npm run format

# Database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema
npm run db:migrate     # Run migrations
npm run db:seed        # Seed data

# PM2
pm2 restart blind-api blind-web    # Restart services
pm2 logs blind-api                 # View API logs
pm2 logs blind-web                 # View web logs
```

## License

MIT
