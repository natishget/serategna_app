# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Serategna — production-grade Ethiopian labor marketplace (Expo/React Native + Express 5 backend + PostgreSQL).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (30d expiry), OTP via `otp_sessions` table (5-min expiry)

## Artifacts

### Serategna Mobile App (`artifacts/serategna`)
- **Type**: Expo React Native
- **Preview**: `/` (port 25617 via `$PORT`)
- **API base**: `https://${EXPO_PUBLIC_DOMAIN}/api`
- **Description**: Ethiopian labor marketplace platform

**Features implemented:**
- Role-based auth (Worker / Employer / Agent) with OTP + Fayda ID verification
- Job lifecycle engine: Requested → Matched → Funded → Active → Completed → Rated
- Escrow payment system with Telebirr/CBE mock integration (87/8/2/3% split)
- Real-time chat with in-chat action buttons (Accept, Fund, Complete, SOS)
- Trust score / labor credit scoring (0–1000)
- Agent commission system (2%)
- Worker matching with geo-distance ranking
- Active job tracker with milestone progress
- Multi-language: English, Amharic (አማርኛ), Afaan Oromo, Tigrinya, Af Soomaali, Arabic
- Offline-first via AsyncStorage; falls back to mock data when API unreachable
- Finance Hub: 9 loan/insurance products (Telebirr, CBE, Amhara Bank, etc.)
- Escrow Dispute wizard
- AI-powered Post Job with 150 ETB wage guardrail
- Age Verification (18–65) in onboarding

**Screens:**
- `/onboarding` — Language select, role select, OTP login, Fayda ID verification, age check
- `/(tabs)/index` — Home dashboard (role-aware)
- `/(tabs)/jobs` — Jobs list with status filter tabs
- `/(tabs)/chat` — Chat rooms list
- `/(tabs)/wallet` — Wallet balance, transactions, payment methods
- `/(tabs)/profile` — Profile, trust score, skills, language settings
- `/job-detail` — Full job detail with escrow, worker selection
- `/post-job` — Create new job (employer) with AI assist + budget guardrail
- `/job-feed` — Worker job feed with accept/decline
- `/chat-room` — Real-time chat with in-chat actions
- `/active-job` — Live job tracker with map, milestones, SOS
- `/rate-job` — Star rating + feedback post-completion
- `/register-worker` — Agent worker registration
- `/finance` — Finance Hub (loan / insurance products)
- `/dispute` — Escrow Dispute wizard

**Key files:**
- `artifacts/serategna/lib/api.ts` — typed API client with token storage + offline fallback
- `artifacts/serategna/context/AuthContext.tsx` — real API + mock fallback
- `artifacts/serategna/context/JobContext.tsx` — real API + mock fallback

### API Server (`artifacts/api-server`)
- **Type**: Express 5 + TypeScript
- **Preview path**: `/api` and `/api/v1` (port 8080) — both paths work identically
- **Rate limits**: 200 req/min global, 10 req/min for OTP endpoints
- **Demo OTP**: `123456` (hardcoded in `NODE_ENV !== production`)
- **Third-party auth**: `X-API-Key: sk_<role>_<hex>` header (generate with `POST /api/v1/users/me/api-key`)
- **Response headers**: `X-API-Version: v1`, `X-Powered-By: Serategna/2.0`
- **Standard envelope**: list endpoints return `{ data: [...], meta: { page, limit, hasMore } }` (legacy `jobs: [...]` key preserved for backward compat)

**Job Types (11):** `informal`, `formal`, `gig`, `short_run`, `contract`, `seasonal`, `professional`, `emergency`, `remote`, `internship`, `mass_hire`

**Job Categories (35+):** plumbing, electrical, construction, carpentry, welding, painting, cleaning, cooking, gardening, moving, childcare, eldercare, driving, delivery, logistics, security, bodyguard, it_tech, finance_admin, legal, healthcare, education, engineering, agriculture, livestock, fishing, hospitality, retail, events, arts_media, tailoring, hairdressing, manufacturing, other

**Employer Types (7):** `individual`, `company`, `mass_hire`, `vip`, `ministry`, `ngo`, `startup`
- Ministry fields: `ministryCode` (MoLSA, MoE, MoF, MoH, MoA, MoT, MoI, MoD, MoJ, MoWIE)
- Mass hire: `massHireQuota` (max workers per posting), bulk job endpoint
- VIP: `isVip` boolean, premium matching

**New endpoints added:**
- `POST /api/v1/users/me/api-key` — generate/rotate API key for third-party integration
- `GET  /api/v1/users/employers` — browse employers (filter by `employerType`, `ministryCode`, `q`)
- `POST /api/v1/jobs/bulk` — bulk job creation (up to 50 postings in one call, mass hire)
- New job fields: `jobType`, `tags`, `requirements`, `isRemote`, `scheduledAt`, `durationDays`, `workersFilled`, `isPublic`, `externalRef`
- New user fields: `employerType`, `orgName`, `orgLicense`, `massHireQuota`, `isVip`, `ministryCode`
- Pagination: `?page=1&limit=20` on all list endpoints
- Filtering jobs: `?jobType=formal&category=finance_admin&status=requested&isRemote=true`

**All endpoints:**
- `GET  /api/healthz` — health check
- `POST /api/auth/otp/send` — send OTP to phone
- `POST /api/auth/otp/verify` — verify OTP → returns JWT
- `POST /api/auth/fayda` — link Fayda ID (+50 trust score, once)
- `GET  /api/auth/me` — current user
- `POST /api/auth/logout` — invalidate session
- `GET  /api/users/workers` — browse workers (employer/agent)
- `GET  /api/users/:id` — public profile
- `POST /api/jobs` — create job (employer/agent)
- `GET  /api/jobs` — list jobs (filtered by role)
- `GET  /api/jobs/:id` — job detail
- `POST /api/jobs/:id/accept` — worker accepts job
- `POST /api/jobs/:id/fund` — employer funds escrow
- `POST /api/jobs/:id/complete` — employer marks complete
- `POST /api/jobs/:id/rate` — rate worker (+5 trust score per completion)
- `GET  /api/disputes` — list own disputes
- `POST /api/disputes` — raise dispute (freezes escrow)
- `GET  /api/finance/products` — list 9 finance products with eligibility
- `POST /api/finance/apply` — apply for product
- `GET  /api/chat` — chat rooms
- `POST /api/chat` — create chat room
- `GET  /api/chat/:id/messages` — messages in room
- `POST /api/chat/:id/messages` — send message

**Key files:**
- `artifacts/api-server/src/app.ts` — Express app, middleware, rate limits
- `artifacts/api-server/src/routes/{auth,users,jobs,disputes,finance,chat}.ts`
- `artifacts/api-server/src/lib/jwt.ts` — sign/verify JWT
- `artifacts/api-server/src/middleware/auth.ts` — JWT guard + role guard
- `artifacts/api-server/src/middleware/error.ts` — global error handler

### Database (`lib/db`)
- PostgreSQL via `DATABASE_URL` (Replit managed)
- Schema pushed with `pnpm --filter @workspace/db run push`
- Tables: `users`, `jobs`, `otp_sessions`, `disputes`, `ratings`, `chat_rooms`, `chat_messages`
- Trust score: starts at 400, +50 for Fayda verify, +5 per completed job, max 1000
- Payment split: 87% worker / 8% platform / 2% agent / 3% tax
- Min job budget: 150 ETB

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
