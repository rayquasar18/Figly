# Requirements: Figly

**Defined:** 2026-03-22
**Core Value:** Collectors can share, showcase, and manage their collections in a community of shared passion — combining social media with collection tracking.

## v2.0 Requirements

Requirements for v2.0 Architecture & Production Hardening. Each maps to roadmap phases.

### Bugfixes & UX Flow

- [x] **BUGF-01**: Signup form only requires email and password (remove name and username fields from registration)
- [x] **BUGF-02**: Backend signup endpoint accepts registration without username/name (make fields optional)
- [x] **BUGF-03**: Complete-profile page properly redirects to homepage after username is set (fix auth cache invalidation so layout stops redirecting back)
- [x] **BUGF-04**: Explore page loads and displays content correctly
- [x] **BUGF-05**: Desktop layout has Instagram-style left sidebar navigation (Home, Search, Explore, Reels, Create, Profile)

### Framework Upgrades

- [ ] **FRMW-01**: React upgraded from v18 to v19 with all breaking changes resolved
- [ ] **FRMW-02**: Next.js upgraded from v14 to v16 with async API migrations complete
- [x] **FRMW-03**: NestJS upgraded from v10 to v11 with all dependencies aligned

### Backend Hardening

- [ ] **BACK-01**: Environment variables validated at startup using Zod schemas (no fallback defaults for secrets)
- [ ] **BACK-02**: Global exception filter catches all unhandled errors and returns safe responses (no Prisma/internal details leaked)
- [ ] **BACK-03**: Structured logging with Pino replaces basic NestJS Logger across all modules
- [ ] **BACK-04**: Health check endpoint reports database, Redis, and MinIO connectivity
- [ ] **BACK-05**: Swagger/OpenAPI documentation auto-generated from all API endpoints
- [ ] **BACK-06**: DTO validation unified with nestjs-zod (class-validator duplication removed)
- [ ] **BACK-07**: Response serialization layer strips internal fields from API responses
- [ ] **BACK-08**: Redis-backed rate limiter replaces in-process memory rate limiter

### Frontend Restructure

- [ ] **FRNT-01**: Frontend directory restructured to features/ pattern (domain-grouped components, hooks, stores)
- [ ] **FRNT-02**: Next.js middleware handles auth redirects (no client-side flash of content)
- [ ] **FRNT-03**: Public routes (feed, profiles, posts) rendered as Server Components with generateMetadata for SEO
- [ ] **FRNT-04**: ThemeProvider configured with dark mode support (system preference + manual toggle)

### DevOps & Tooling

- [ ] **DEVP-01**: ESLint + Prettier configured with consistent rules across frontend, backend, shared
- [ ] **DEVP-02**: Husky + lint-staged runs linting on pre-commit
- [ ] **DEVP-03**: CI/CD pipeline via GitHub Actions (lint, type-check, build, test)
- [ ] **DEVP-04**: Docker split into 2 separate containers (figly-frontend, figly-backend)

### Shared Package

- [ ] **SHRD-01**: Shared package dto/ renamed to schemas/ with updated imports across codebase
- [ ] **SHRD-02**: dist/ removed from git tracking (built as artifact only)

## v2.1+ Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Search & Discovery

- **DISC-01**: User can search for other users by username/display name
- **DISC-02**: User can search posts by hashtag
- **DISC-03**: User can search collection items by name

### Notifications

- **NOTF-01**: User receives in-app notifications for likes, comments, follows
- **NOTF-02**: User receives push notifications via PWA
- **NOTF-03**: User can configure notification preferences

### Moderation & Safety

- **MODR-01**: User can report inappropriate content
- **MODR-02**: User can block/mute other users
- **MODR-03**: Admin can view reported content queue
- **MODR-04**: Admin can remove content and ban users

### Direct Messaging

- **MESG-01**: User can send 1-on-1 direct messages
- **MESG-02**: User can create group chats
- **MESG-03**: Messages support text and image sharing
- **MESG-04**: User receives real-time message delivery

### Stories

- **CONT-08**: User can post 24h ephemeral photo/video stories
- **CONT-09**: User can view stories from followed users in top bar

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first approach, PWA covers mobile needs |
| E-commerce/marketplace | Not selling, only sharing and tracking |
| AI-powered recommendations | Insufficient data at launch |
| NFT / digital collectibles | Market crashed, alienates users |
| Auction system | Full auction logic is an entire product |
| Offline mode | Real-time is core value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUGF-01 | Phase 11 | Complete |
| BUGF-02 | Phase 11 | Complete |
| BUGF-03 | Phase 11 | Complete |
| BUGF-04 | Phase 11 | Complete |
| BUGF-05 | Phase 11 | Complete |
| FRMW-01 | Phase 12 | Pending |
| FRMW-02 | Phase 12 | Pending |
| FRMW-03 | Phase 12 | Complete |
| BACK-01 | Phase 13 | Pending |
| BACK-02 | Phase 13 | Pending |
| BACK-03 | Phase 13 | Pending |
| BACK-04 | Phase 13 | Pending |
| BACK-05 | Phase 13 | Pending |
| BACK-06 | Phase 13 | Pending |
| BACK-07 | Phase 13 | Pending |
| BACK-08 | Phase 13 | Pending |
| FRNT-01 | Phase 14 | Pending |
| FRNT-02 | Phase 14 | Pending |
| FRNT-03 | Phase 14 | Pending |
| FRNT-04 | Phase 14 | Pending |
| DEVP-01 | Phase 15 | Pending |
| DEVP-02 | Phase 15 | Pending |
| DEVP-03 | Phase 15 | Pending |
| DEVP-04 | Phase 15 | Pending |
| SHRD-01 | Phase 16 | Pending |
| SHRD-02 | Phase 16 | Pending |

**Coverage:**
- v2.0 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
