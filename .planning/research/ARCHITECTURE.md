# Architecture Research

**Domain:** Instagram-like social media platform for collectors
**Researched:** 2026-03-13
**Confidence:** MEDIUM (based on training data for well-established patterns; search tools were unavailable during research)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                     Next.js App (App Router)                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │  Feed    │ │ Stories  │ │ Explore  │ │ Profile  │ │Collection│  │    │
│  │  │  Page    │ │ Viewer   │ │ Grid     │ │ Page     │ │ Tracker  │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                            │    │
│  │  │  Reels   │ │   DM     │ │ Notifi-  │                            │    │
│  │  │  Player  │ │  Inbox   │ │ cations  │                            │    │
│  │  └──────────┘ └──────────┘ └──────────┘                            │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────────────────┤
│                             API GATEWAY LAYER                                │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                        NestJS API Server                             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │    │
│  │  │  REST    │ │ GraphQL  │ │WebSocket │ │  Auth    │               │    │
│  │  │ Endpoints│ │ Resolver │ │ Gateway  │ │  Guard   │               │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘               │    │
│  └───────┴─────────────┴────────────┴────────────┴─────────────────────┘    │
├──────────────────────────────────────────────────────────────────────────────┤
│                            SERVICE LAYER                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  User    │ │  Post    │ │  Feed    │ │  Media   │ │Collection│         │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Service  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Chat    │ │  Notif   │ │  Search  │ │  Story   │ │  Social  │         │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │ │  Graph   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
├──────────────────────────────────────────────────────────────────────────────┤
│                          INFRASTRUCTURE LAYER                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │PostgreSQL│ │  Redis   │ │    S3    │ │  CDN     │ │  Bull    │         │
│  │ Database │ │  Cache   │ │ (Media)  │ │(CloudFr.)│ │  Queues  │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Next.js App | SSR, routing, UI rendering, client state | App Router with Server Components + Client Components |
| NestJS API | Business logic, auth, API endpoints, WebSocket | Modular NestJS with Guards, Pipes, Interceptors |
| User Service | Registration, profiles, auth tokens | Passport.js + JWT via NestJS AuthModule |
| Post Service | CRUD for posts/reels/stories, media association | TypeORM entities + service layer |
| Feed Service | Feed generation, ranking, pagination | Hybrid fan-out with Redis-cached timelines |
| Media Service | Upload handling, processing pipeline, URL generation | Multer + Sharp + S3 SDK |
| Collection Service | Checklist CRUD, shared catalog, progress tracking | Custom domain with catalog + user-items junction |
| Chat Service | Real-time DM, conversation management | WebSocket Gateway + message persistence |
| Notification Service | Push/in-app notifications, activity stream | Event-driven with Bull queue workers |
| Search Service | Full-text search across users/posts/collections | PostgreSQL full-text search (upgrade to Elasticsearch later) |
| Social Graph | Follow/unfollow, blocking, follower counts | Adjacency list in PostgreSQL + Redis counters |

## Monorepo Structure

### Recommendation: Turborepo with pnpm workspaces

Use Turborepo because it handles the Next.js + NestJS monorepo case well -- both are TypeScript, and Turborepo provides build caching, task orchestration, and dependency graph awareness. pnpm workspaces for disk-efficient dependency management.

```
figly/
├── apps/
│   ├── web/                        # Next.js frontend (App Router)
│   │   ├── app/                    # App Router pages & layouts
│   │   │   ├── (auth)/             # Auth route group (login, register)
│   │   │   ├── (main)/             # Main app route group
│   │   │   │   ├── feed/           # Home feed
│   │   │   │   ├── explore/        # Explore/discover
│   │   │   │   ├── reels/          # Reels viewer
│   │   │   │   ├── messages/       # DM interface
│   │   │   │   ├── notifications/  # Activity feed
│   │   │   │   ├── [username]/     # User profiles
│   │   │   │   └── collections/    # Collection tracking
│   │   │   ├── layout.tsx          # Root layout
│   │   │   └── page.tsx            # Landing page
│   │   ├── components/             # Shared UI components
│   │   │   ├── feed/               # Feed-specific components
│   │   │   ├── media/              # Image/video viewers, uploaders
│   │   │   ├── stories/            # Story ring, story viewer
│   │   │   ├── collections/        # Collection grids, checklist UI
│   │   │   └── ui/                 # Generic UI primitives
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utilities, API client, config
│   │   ├── stores/                 # Zustand stores (client state)
│   │   └── next.config.ts
│   │
│   └── api/                        # NestJS backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/           # AuthModule (JWT, OAuth, Guards)
│       │   │   ├── users/          # UserModule (profiles, settings)
│       │   │   ├── posts/          # PostModule (posts, reels, stories)
│       │   │   ├── feed/           # FeedModule (timeline generation)
│       │   │   ├── media/          # MediaModule (upload, processing)
│       │   │   ├── collections/    # CollectionModule (catalogs, checklists)
│       │   │   ├── chat/           # ChatModule (DM, WebSocket)
│       │   │   ├── notifications/  # NotificationModule (activity, push)
│       │   │   ├── search/         # SearchModule (full-text search)
│       │   │   ├── social/         # SocialModule (follow, block, like)
│       │   │   └── explore/        # ExploreModule (trending, discover)
│       │   ├── common/
│       │   │   ├── guards/         # Auth guards, role guards
│       │   │   ├── interceptors/   # Logging, transform, cache
│       │   │   ├── pipes/          # Validation pipes
│       │   │   ├── decorators/     # Custom decorators (@CurrentUser)
│       │   │   └── filters/        # Exception filters
│       │   ├── config/             # Configuration (DB, S3, Redis, JWT)
│       │   ├── database/
│       │   │   ├── entities/       # TypeORM entities
│       │   │   ├── migrations/     # Database migrations
│       │   │   └── seeds/          # Seed data (collection catalogs)
│       │   ├── jobs/               # Bull queue processors
│       │   ├── app.module.ts       # Root module
│       │   └── main.ts             # Bootstrap
│       └── nest-cli.json
│
├── packages/
│   ├── shared/                     # Shared TypeScript types & validation
│   │   ├── src/
│   │   │   ├── types/              # Shared interfaces (User, Post, etc.)
│   │   │   ├── dto/                # Shared DTOs with class-validator
│   │   │   ├── constants/          # Shared enums, constants
│   │   │   └── utils/              # Shared utility functions
│   │   └── package.json
│   └── eslint-config/              # Shared ESLint configuration
│
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml             # Workspace definition
├── package.json                    # Root package.json
└── docker-compose.yml              # Local dev (Postgres, Redis, MinIO)
```

### Structure Rationale

- **apps/web:** Next.js with App Router for SSR/SSG. Route groups `(auth)` and `(main)` separate layouts cleanly.
- **apps/api:** NestJS with domain-driven modules. Each module owns its controllers, services, entities, and DTOs.
- **packages/shared:** Shared TypeScript types and validation DTOs keep frontend and backend in sync. Changes to a DTO are caught at compile time on both sides.
- **Root docker-compose:** PostgreSQL, Redis, and MinIO (S3-compatible) for local development parity with production.

## API Design

### Recommendation: REST for CRUD + GraphQL for Feed/Explore

Use a hybrid approach:

**REST (primary):** Auth, media uploads, simple CRUD operations. REST is simpler to implement, easier to cache at the HTTP level, and better for file uploads. NestJS controllers map naturally to REST.

**GraphQL (optional, Phase 2+):** Feed queries, explore page, collection browsing -- anywhere the frontend needs flexible data shapes and nested data. Instagram-like feeds benefit from GraphQL because a single feed item can include user data, media, like counts, comment previews, and collection tags. Without GraphQL, this requires either over-fetching or multiple round trips.

**For MVP, start with REST only.** Add GraphQL for feed/explore when the data shape requirements become complex enough to justify it.

```
REST Endpoints (NestJS Controllers):

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/oauth/:provider

GET    /api/users/:id
PATCH  /api/users/:id
GET    /api/users/:id/followers
GET    /api/users/:id/following

POST   /api/posts
GET    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
POST   /api/posts/:id/comments

POST   /api/media/upload          (multipart/form-data)
GET    /api/media/:id

GET    /api/feed                  (paginated, cursor-based)
GET    /api/explore               (trending + category grid)

GET    /api/stories               (stories from followed users)
POST   /api/stories

GET    /api/collections/catalog             (shared catalog browse)
GET    /api/collections/catalog/:category   (items in category)
POST   /api/collections/checklists          (create custom checklist)
GET    /api/collections/checklists/:id
PATCH  /api/collections/checklists/:id/items/:itemId  (mark owned/wanted)

GET    /api/notifications
PATCH  /api/notifications/:id/read

GET    /api/search?q=...&type=users|posts|collections

WebSocket:
  /ws/chat         (DM messaging)
  /ws/notifications (live notification push)
```

## Database Schema Design

### Recommendation: PostgreSQL

PostgreSQL because: relational data (social graph is inherently relational), JSONB for flexible metadata (collection item attributes vary by category), full-text search built in, mature ecosystem with TypeORM/Prisma, transactional integrity for social operations (follow/unfollow must be atomic).

### Core Entities

```sql
-- USERS
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(30) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),           -- null for OAuth-only users
    display_name    VARCHAR(100),
    bio             TEXT,
    avatar_url      VARCHAR(500),
    is_verified     BOOLEAN DEFAULT FALSE,
    is_private      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- USER STATS (denormalized counters for fast reads)
CREATE TABLE user_stats (
    user_id         UUID PRIMARY KEY REFERENCES users(id),
    post_count      INTEGER DEFAULT 0,
    follower_count  INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    collection_count INTEGER DEFAULT 0
);

-- SOCIAL GRAPH
CREATE TABLE follows (
    follower_id     UUID NOT NULL REFERENCES users(id),
    following_id    UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);
CREATE INDEX idx_follows_following ON follows(following_id);

CREATE TABLE blocks (
    blocker_id      UUID NOT NULL REFERENCES users(id),
    blocked_id      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- POSTS (covers posts, reels, stories via type discriminator)
CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(20) NOT NULL,   -- 'post', 'reel', 'story'
    caption         TEXT,
    location        VARCHAR(255),
    is_archived     BOOLEAN DEFAULT FALSE,
    expires_at      TIMESTAMPTZ,            -- stories expire after 24h
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_type ON posts(type);

-- MEDIA (one post can have multiple media items -- carousel)
CREATE TABLE media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(20) NOT NULL,   -- 'image', 'video'
    original_url    VARCHAR(500) NOT NULL,
    thumbnail_url   VARCHAR(500),
    processed_url   VARCHAR(500),           -- optimized version
    width           INTEGER,
    height          INTEGER,
    duration_ms     INTEGER,                -- video duration
    file_size       BIGINT,
    mime_type       VARCHAR(50),
    blurhash        VARCHAR(100),           -- placeholder blur
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_media_post_id ON media(post_id);

-- INTERACTIONS
CREATE TABLE likes (
    user_id         UUID NOT NULL REFERENCES users(id),
    post_id         UUID NOT NULL REFERENCES posts(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX idx_likes_post_id ON likes(post_id);

CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID NOT NULL REFERENCES posts(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    parent_id       UUID REFERENCES comments(id),  -- threaded replies
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_post_id ON comments(post_id);

CREATE TABLE post_stats (
    post_id         UUID PRIMARY KEY REFERENCES posts(id),
    like_count      INTEGER DEFAULT 0,
    comment_count   INTEGER DEFAULT 0,
    share_count     INTEGER DEFAULT 0,
    view_count      INTEGER DEFAULT 0
);

-- HASHTAGS
CREATE TABLE hashtags (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) UNIQUE NOT NULL,
    post_count      INTEGER DEFAULT 0
);

CREATE TABLE post_hashtags (
    post_id         UUID NOT NULL REFERENCES posts(id),
    hashtag_id      INTEGER NOT NULL REFERENCES hashtags(id),
    PRIMARY KEY (post_id, hashtag_id)
);

-- COLLECTION TRACKING SYSTEM
-- Shared catalog: admin-curated items across categories
CREATE TABLE collection_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,  -- 'Gundam', 'Sneakers', etc.
    slug            VARCHAR(100) UNIQUE NOT NULL,
    description     TEXT,
    icon_url        VARCHAR(500),
    item_count      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_series (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID NOT NULL REFERENCES collection_categories(id),
    name            VARCHAR(200) NOT NULL,  -- 'MG 1/100', 'Air Jordan 1'
    description     TEXT,
    image_url       VARCHAR(500),
    item_count      INTEGER DEFAULT 0,
    metadata        JSONB DEFAULT '{}',     -- flexible category-specific data
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE catalog_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id       UUID NOT NULL REFERENCES collection_series(id),
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    image_url       VARCHAR(500),
    release_date    DATE,
    reference_number VARCHAR(100),          -- model number, SKU, etc.
    metadata        JSONB DEFAULT '{}',     -- price, rarity, dimensions, etc.
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_catalog_items_series ON catalog_items(series_id);

-- User checklists (link users to catalog items they own/want)
CREATE TABLE user_checklists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    category_id     UUID REFERENCES collection_categories(id), -- null = custom
    is_public       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_checklists_user ON user_checklists(user_id);

CREATE TABLE checklist_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id    UUID NOT NULL REFERENCES user_checklists(id) ON DELETE CASCADE,
    catalog_item_id UUID REFERENCES catalog_items(id),  -- null = custom item
    custom_name     VARCHAR(300),                        -- for custom items
    custom_image_url VARCHAR(500),
    status          VARCHAR(20) DEFAULT 'wanted',       -- 'wanted', 'owned', 'ordered'
    condition       VARCHAR(20),                        -- 'mint', 'opened', etc.
    notes           TEXT,
    acquired_date   DATE,
    acquired_price  DECIMAL(10,2),
    metadata        JSONB DEFAULT '{}',
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX idx_checklist_items_catalog ON checklist_items(catalog_item_id);

-- Link posts to collection items (show off your collection)
CREATE TABLE post_collection_tags (
    post_id         UUID NOT NULL REFERENCES posts(id),
    catalog_item_id UUID NOT NULL REFERENCES catalog_items(id),
    PRIMARY KEY (post_id, catalog_item_id)
);

-- CHAT / DIRECT MESSAGES
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(20) DEFAULT 'direct',  -- 'direct', 'group'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_members (
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    last_read_at    TIMESTAMPTZ,
    muted           BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT,
    media_url       VARCHAR(500),
    type            VARCHAR(20) DEFAULT 'text',  -- 'text', 'image', 'post_share'
    shared_post_id  UUID REFERENCES posts(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),  -- recipient
    actor_id        UUID REFERENCES users(id),           -- who triggered it
    type            VARCHAR(30) NOT NULL,  -- 'like', 'comment', 'follow', 'mention'
    entity_type     VARCHAR(20),           -- 'post', 'comment', 'user'
    entity_id       UUID,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
```

### Schema Design Rationale

- **UUID primary keys:** Prevent enumeration attacks and work well with distributed systems.
- **Denormalized counters (user_stats, post_stats):** Counting followers/likes via COUNT(*) kills performance at scale. Use triggers or application-level increments to maintain counters.
- **Single posts table with type discriminator:** Posts, reels, and stories share 90% of the same structure. The `type` column + optional `expires_at` for stories is simpler than three tables.
- **JSONB metadata on catalog_items:** Different collection categories have different attributes (Gundam has grade/scale, sneakers have colorway/size). JSONB handles this without category-specific tables.
- **Separate media table:** Supports carousel posts (multiple images), keeps media metadata (dimensions, blurhash) separate from post logic.
- **Composite primary keys on junction tables:** Enforces uniqueness at the database level (can't follow someone twice, can't like a post twice).

## Media Pipeline

### Upload -> Process -> Store -> Serve

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Client   │────>│  NestJS  │────>│  S3 / MinIO  │────>│   CDN    │
│  Upload   │     │  Media   │     │  (Original)  │     │(Optimized│
│(multipart)│     │ Controller│     │              │     │  Assets) │
└──────────┘     └────┬─────┘     └──────────────┘     └──────────┘
                      │                                       ↑
                      ↓                                       │
                ┌──────────┐     ┌──────────────┐            │
                │   Bull   │────>│    Sharp /   │────────────┘
                │  Queue   │     │   FFmpeg     │
                │  (async) │     │  (process)   │
                └──────────┘     └──────────────┘
```

**Flow:**

1. **Client uploads** multipart form data to `/api/media/upload`.
2. **NestJS MediaController** validates file type/size, generates a UUID, stores original directly to S3 via streaming (do not buffer entire file in memory).
3. **Returns immediately** with media ID + `processing_status: 'pending'`. Client shows a blurhash placeholder.
4. **Bull queue job** is dispatched for async processing.
5. **Media processor worker** picks up the job:
   - **Images:** Sharp generates multiple sizes (thumbnail 150x150, medium 640x640, large 1080x1080), converts to WebP, generates blurhash, strips EXIF (privacy).
   - **Videos:** FFmpeg generates thumbnail frame, transcodes to H.264/MP4 at multiple qualities (480p, 720p), generates HLS segments for adaptive streaming.
6. **Processed assets** are stored back to S3 in organized paths (`/media/{user_id}/{media_id}/thumb.webp`).
7. **CDN (CloudFront)** serves processed assets. Origin is S3. TTL is long (media is immutable once processed).
8. **Database updated** with processed URLs and `processing_status: 'completed'`.

**Key decisions:**
- **S3-compatible storage** (AWS S3 or self-hosted MinIO for dev) because it is the standard for blob storage, has SDN integration, and presigned URLs for direct client uploads at scale.
- **Sharp for images** because it is the fastest Node.js image processing library (libvips-based), handles WebP conversion natively.
- **Async processing is mandatory.** Never process media in the request cycle -- the user waits too long and the request times out for video.
- **Presigned upload URLs (Phase 2 optimization):** Instead of proxying through the API server, generate presigned S3 URLs so clients upload directly to S3. API server just records the metadata. This removes the API as a bottleneck for large files.

## Real-Time Architecture

### WebSocket via NestJS Gateway

```
┌──────────┐     ┌──────────────────────────┐     ┌──────────┐
│  Client   │<──>│  NestJS WebSocket Gateway │<──>│  Redis    │
│  (Socket  │     │  ┌──────┐  ┌──────────┐  │     │  Pub/Sub  │
│  .IO)     │     │  │ Chat │  │ Notifi-  │  │     │  Adapter  │
│           │     │  │ Gate-│  │ cation   │  │     │           │
│           │     │  │ way  │  │ Gateway  │  │     │           │
└──────────┘     │  └──────┘  └──────────┘  │     └──────────┘
                  └──────────────────────────┘
```

**NestJS WebSocket Gateways:**

- **ChatGateway** (`/ws/chat`): Handles DM messaging. Events: `sendMessage`, `typing`, `messageRead`. Each conversation is a Socket.IO room.
- **NotificationGateway** (`/ws/notifications`): Pushes real-time notifications. User connects, joins their own room (user ID). Backend emits to that room when events occur.

**Why Socket.IO (via @nestjs/platform-socket.io):**
- Automatic fallback to long-polling if WebSocket fails.
- Built-in room/namespace support maps cleanly to conversations.
- Redis adapter (`@socket.io/redis-adapter`) enables horizontal scaling -- multiple NestJS instances share WebSocket state.

**Architecture for horizontal scaling:**
- Socket.IO Redis adapter publishes events across all server instances.
- When user A sends a message to user B, and they are connected to different server instances, the Redis adapter ensures delivery.
- Presence tracking (online/offline status) via Redis SET of connected user IDs.

**Notification flow:**
1. Event occurs (like, comment, follow, DM).
2. Business service emits an internal NestJS event (`EventEmitter2`).
3. NotificationService picks up the event, creates a `notifications` DB record.
4. If recipient is online (check WebSocket connections), push via NotificationGateway immediately.
5. If offline, the notification waits in DB. Client fetches unread count on next connection.

## Feed Generation

### Recommendation: Fan-out on Write (Hybrid)

For a collectors' social network, the user base will be moderate (not Twitter-scale). Fan-out on write is simpler and faster for reads, which is the 99% case.

**How it works:**

```
User A creates a post
    ↓
PostService saves post to DB
    ↓
Bull queue: FanOutJob dispatched
    ↓
FanOutWorker:
    1. Get all followers of User A
    2. For each follower, push post ID to their Redis feed list
       LPUSH feed:{follower_id} {post_id}
       LTRIM feed:{follower_id} 0 999  (keep last 1000 items)
    ↓
When User B opens feed:
    1. LRANGE feed:{user_b_id} 0 19  (get first 20 post IDs)
    2. Multi-GET post details from cache/DB
    3. Return hydrated feed
```

**Why fan-out on write for Figly:**
- **Read-heavy:** Users scroll feeds far more than they post. Pre-computed feeds make reads O(1) from Redis.
- **Moderate scale:** A collectors' platform will not have accounts with 10M+ followers. Fan-out costs are manageable.
- **Simplicity:** Fan-out on read requires complex real-time aggregation queries. Fan-out on write is a straightforward queue job.

**Hybrid approach for large accounts:**
- If a user has > 10,000 followers, do NOT fan out. Instead, mark them as a "celebrity" account.
- For celebrity posts, use fan-out on read: when a follower opens their feed, merge their pre-computed feed with recent posts from celebrity accounts they follow.
- This prevents one popular collector from generating millions of write operations.

**Feed pagination:** Use cursor-based pagination (not offset). The cursor is a combination of (timestamp, post_id) to handle posts with identical timestamps.

## Search Architecture

### Phase 1: PostgreSQL Full-Text Search

For initial launch, PostgreSQL's built-in full-text search is sufficient and avoids adding another infrastructure dependency.

```sql
-- Add tsvector columns for searchable entities
ALTER TABLE users ADD COLUMN search_vector tsvector;
ALTER TABLE posts ADD COLUMN search_vector tsvector;
ALTER TABLE catalog_items ADD COLUMN search_vector tsvector;

-- GIN indexes for fast full-text search
CREATE INDEX idx_users_search ON users USING GIN(search_vector);
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX idx_catalog_search ON catalog_items USING GIN(search_vector);

-- Trigger to auto-update search_vector on users
CREATE FUNCTION users_search_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        coalesce(NEW.username, '') || ' ' ||
        coalesce(NEW.display_name, '') || ' ' ||
        coalesce(NEW.bio, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_search_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION users_search_update();
```

**Search types:**
- **Users:** Match against username, display_name, bio.
- **Posts:** Match against caption + hashtags.
- **Collections/Catalog:** Match against item names, series names, categories.

### Phase 2+: Elasticsearch (if needed)

Upgrade to Elasticsearch only when: autocomplete needs sub-50ms response, faceted search becomes important (filter by category + condition + price range), or PostgreSQL full-text search becomes a bottleneck. This is unlikely before 50k+ items in the catalog.

## Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │────>│  NestJS  │────>│ PostgreSQL│
│           │     │  Auth    │     │  (users)  │
│           │<────│  Module  │     │           │
│  (JWT in  │     │          │     │           │
│  httpOnly │     │  Passport│     │           │
│  cookie)  │     │  + JWT   │     │           │
└──────────┘     └──────────┘     └──────────┘
                       │
                       ↓
                 ┌──────────┐
                 │  OAuth   │
                 │ Providers│
                 │(Google,  │
                 │ Apple)   │
                 └──────────┘
```

**Implementation:**
- **@nestjs/passport** + **passport-jwt** for JWT strategy.
- **@nestjs/jwt** for token signing/verification.
- **Access token** (short-lived, 15min) in httpOnly cookie. Not localStorage -- XSS protection.
- **Refresh token** (long-lived, 7 days) in httpOnly cookie with rotation. Stored hashed in DB for revocation.
- **OAuth flow:** passport-google-oauth20 and passport-apple for social login. OAuth callback creates/links user account, then issues JWT pair same as email login.
- **AuthGuard** applied globally via APP_GUARD, with `@Public()` decorator for opt-out on public endpoints.
- **WebSocket auth:** Token validated during Socket.IO handshake via middleware, not on every message.

## Caching Strategy

### Multi-Layer Caching

```
Request → CDN Cache → Next.js Cache → Redis Cache → PostgreSQL
              ↓              ↓              ↓             ↓
         Static assets   SSR pages    Hot data        Source of truth
         Media files     (revalidate) Counters
                                      Sessions
                                      Feeds
```

**Layer 1 -- CDN (CloudFront/Cloudflare):**
- All processed media (images, video).
- Long TTL (1 year) because media URLs are content-addressed.
- Next.js static assets.

**Layer 2 -- Next.js Server-Side Caching:**
- `revalidate` on Server Components for semi-static pages (explore page, public profiles).
- ISR (Incremental Static Regeneration) for collection catalog pages (don't change often).

**Layer 3 -- Redis:**
- **User sessions / refresh tokens.**
- **Feed timelines:** Pre-computed per-user feed (LPUSH/LRANGE).
- **Hot counters:** Like counts, follower counts (INCR/DECR, sync to Postgres periodically).
- **Cache-aside for entities:** User profiles, post details. Key pattern: `user:{id}`, `post:{id}`. TTL 5-15 min.
- **Rate limiting:** Sliding window counters for API rate limits.
- **Online presence:** SET of connected user IDs for chat.

**Cache invalidation strategy:**
- **Write-through for counters:** Increment Redis immediately on like/follow, async sync to Postgres.
- **TTL-based for entity cache:** Most entity caches expire and refetch. 5-minute TTL is usually acceptable.
- **Event-driven invalidation for critical paths:** When a user updates their profile, publish an event that deletes `user:{id}` from Redis.

## Background Job Processing

### Bull + Redis Queue Architecture

```
┌──────────────────────────────────────────────┐
│                Bull Queues (Redis)             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │ media-     │ │ feed-      │ │ notifi-    ││
│  │ processing │ │ fanout     │ │ cation     ││
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘│
│        ↓              ↓              ↓        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │ email      │ │ cleanup    │ │ analytics  ││
│  │ sending    │ │ (expired   │ │ (aggregate)││
│  │            │ │  stories)  │ │            ││
│  └────────────┘ └────────────┘ └────────────┘│
└──────────────────────────────────────────────┘
```

**Queue definitions:**

| Queue | Purpose | Priority | Concurrency |
|-------|---------|----------|-------------|
| `media-processing` | Image resize, video transcode, blurhash | High | 2-4 workers |
| `feed-fanout` | Push posts to follower feeds in Redis | High | 4-8 workers |
| `notification` | Create notification records, push WebSocket | Medium | 2-4 workers |
| `email` | Welcome emails, password reset, digests | Low | 1-2 workers |
| `cleanup` | Expire stories, prune old feed entries | Low (scheduled) | 1 worker |
| `analytics` | Aggregate view counts, trending calculation | Low (scheduled) | 1 worker |

**Why Bull (@nestjs/bull):**
- First-class NestJS integration via `@nestjs/bull` package.
- Redis-backed (already using Redis for cache/pub-sub).
- Supports delayed jobs (schedule story expiration), repeatable jobs (hourly cleanup), rate limiting, and retries.
- Dashboard via `bull-board` for monitoring in development.

**Pattern:**
```typescript
// In PostService after creating a post:
await this.feedFanoutQueue.add('fanout', {
  postId: post.id,
  authorId: post.userId,
}, { priority: 1 });

// In FeedFanoutProcessor:
@Processor('feed-fanout')
export class FeedFanoutProcessor {
  @Process('fanout')
  async handleFanout(job: Job<{ postId: string; authorId: string }>) {
    const followers = await this.socialService.getFollowerIds(job.data.authorId);
    const pipeline = this.redis.pipeline();
    for (const followerId of followers) {
      pipeline.lpush(`feed:${followerId}`, job.data.postId);
      pipeline.ltrim(`feed:${followerId}`, 0, 999);
    }
    await pipeline.exec();
  }
}
```

## Architectural Patterns

### Pattern 1: NestJS Module Boundaries (Domain Modules)

**What:** Each domain (users, posts, collections, chat) is a self-contained NestJS module with its own controllers, services, entities, and DTOs. Modules communicate via dependency injection (importing the module) or events.

**When to use:** Always. This is NestJS's core organizational pattern.

**Trade-offs:** (+) Clear boundaries, testable in isolation, can be extracted to microservice later. (-) Cross-module queries can get awkward; resist the urge to import everything into everything.

**Example:**
```typescript
// posts.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Media, PostStats]),
    MediaModule,         // For media processing
    SocialModule,        // For feed fanout
    NotificationModule,  // For post notifications
    BullModule.registerQueue({ name: 'feed-fanout' }),
  ],
  controllers: [PostsController],
  providers: [PostsService, FeedFanoutProcessor],
  exports: [PostsService],
})
export class PostsModule {}
```

### Pattern 2: Event-Driven Decoupling

**What:** Instead of services calling each other directly for side effects, emit domain events. Listeners in other modules react independently.

**When to use:** When an action triggers side effects in multiple modules (e.g., "user liked a post" triggers notification + counter update + feed relevance signal).

**Trade-offs:** (+) Modules stay decoupled, easy to add new reactions. (-) Harder to trace flow, eventual consistency.

**Example:**
```typescript
// In PostsService:
await this.eventEmitter.emit('post.liked', { postId, userId, authorId });

// In NotificationModule listener:
@OnEvent('post.liked')
async handlePostLiked(payload: PostLikedEvent) {
  await this.notificationService.create({
    userId: payload.authorId,
    actorId: payload.userId,
    type: 'like',
    entityType: 'post',
    entityId: payload.postId,
  });
}

// In StatsModule listener:
@OnEvent('post.liked')
async handlePostLiked(payload: PostLikedEvent) {
  await this.statsService.incrementPostLikes(payload.postId);
}
```

### Pattern 3: Repository + Service Separation

**What:** Services contain business logic. Repositories (TypeORM) handle database queries. Controllers handle HTTP concerns only (validation, auth, response shaping).

**When to use:** Always. Keep the layers clean.

**Trade-offs:** (+) Testable (mock repository in service tests), clean separation. (-) More files per feature.

### Pattern 4: Cursor-Based Pagination

**What:** Use opaque cursors (encoded timestamp + ID) instead of offset/limit for paginating feeds, comments, and notifications.

**When to use:** Any infinite-scroll or chronologically-ordered list.

**Trade-offs:** (+) Stable pagination (new items don't shift pages), performs well at any depth. (-) Can't jump to "page 5" directly.

**Example:**
```typescript
// Cursor: base64(JSON.stringify({ createdAt, id }))
async getFeed(userId: string, cursor?: string, limit = 20) {
  const decoded = cursor ? decodeCursor(cursor) : null;
  const postIds = await this.redis.lrange(`feed:${userId}`, 0, limit + 10);

  // Hydrate and apply cursor filtering
  const posts = await this.postRepo.findByIds(postIds);
  const filtered = decoded
    ? posts.filter(p => p.createdAt < decoded.createdAt
        || (p.createdAt === decoded.createdAt && p.id < decoded.id))
    : posts;

  const page = filtered.slice(0, limit);
  const nextCursor = page.length === limit
    ? encodeCursor(page[page.length - 1])
    : null;

  return { items: page, nextCursor };
}
```

## Data Flow

### Request Flow (Standard REST)

```
[Browser/Client]
    ↓ HTTP Request
[Next.js Server Component / API Route]
    ↓ fetch() to NestJS API (or Server Action)
[NestJS Controller]
    ↓ Validate (Pipes) → Auth (Guards) → Transform (Interceptors)
[NestJS Service]
    ↓ Business logic
[TypeORM Repository → PostgreSQL]
    ↓ Query result
[Service → Controller → Next.js → Client]
    ↓ Response
[React Client Components hydrate + render]
```

### Real-Time Flow (WebSocket)

```
[Client Socket.IO]  ←→  [NestJS WebSocket Gateway]
                              ↓ (on message)
                         [ChatService]
                              ↓
                    [PostgreSQL (persist)]
                              ↓
                    [Redis Pub/Sub (broadcast)]
                              ↓
                    [Other NestJS instances]
                              ↓
                    [Recipient's Socket.IO connection]
```

### Media Upload Flow

```
[Client selects file]
    ↓
[Multipart POST → NestJS MediaController]
    ↓
[Stream to S3 (original)]
    ↓
[Return media ID + blurhash placeholder]
    ↓ (async)
[Bull queue → MediaProcessor worker]
    ↓
[Sharp/FFmpeg → multiple sizes/formats]
    ↓
[Store processed to S3 → Update DB status]
    ↓
[CDN serves processed media on next request]
```

### Key Data Flows

1. **Post creation:** Client uploads media -> gets media IDs -> submits post with media IDs + caption -> post saved -> fan-out job queued -> followers' feeds updated in Redis -> notification events emitted.

2. **Feed loading:** Client requests feed -> NestJS reads post IDs from Redis feed list -> hydrates posts from cache/DB (batch query) -> returns with user info, media URLs, interaction counts, collection tags.

3. **Collection tracking:** User browses catalog -> selects items to add to checklist -> marks status (owned/wanted/ordered) -> status saved -> profile collection showcase updated -> optionally creates a "showcase post" linking to their collection.

4. **DM conversation:** User opens conversation -> WebSocket connection established -> previous messages loaded from DB (paginated) -> new messages sent via WebSocket -> persisted to DB -> broadcast to conversation members via Redis pub/sub.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-5k users | Single NestJS instance, single Postgres, Redis. No CDN needed (serve from S3 directly). Bull runs in-process. This handles the first year easily. |
| 5k-50k users | Add CDN for media. Separate Bull workers into their own process. Add Redis replicas for read scaling. Connection pooling (PgBouncer). Consider read replicas for Postgres. |
| 50k-500k users | Multiple NestJS instances behind load balancer. Redis cluster. Postgres read replicas mandatory. Elasticsearch for search. Consider splitting media processing to separate service. Feed fan-out hybrid (celebrity accounts). |
| 500k+ users | Microservice extraction for highest-traffic modules (feed, chat, media). Dedicated message broker (RabbitMQ/Kafka) instead of just Redis pub/sub. Sharding strategies for Postgres. This scale is unlikely in early years for a niche social platform. |

### Scaling Priorities

1. **First bottleneck -- Media storage/serving:** Will hit S3/bandwidth costs first. Solution: CDN + aggressive image optimization (WebP, proper sizing).
2. **Second bottleneck -- Database reads:** Feed queries and social graph lookups. Solution: Redis caching layer + Postgres read replicas.
3. **Third bottleneck -- WebSocket connections:** If DM is popular. Solution: Redis adapter for Socket.IO + horizontal NestJS instances.

## Anti-Patterns

### Anti-Pattern 1: N+1 Query in Feed Hydration

**What people do:** Load feed post IDs, then query each post individually in a loop (including user, media, likes).
**Why it's wrong:** 20 posts = 60+ database queries per feed load. Kills performance immediately.
**Do this instead:** Batch-load all post IDs in one query with JOIN/eager loading. Use DataLoader pattern if using GraphQL. Cache hydrated posts in Redis.

### Anti-Pattern 2: Synchronous Media Processing

**What people do:** Process images/video in the upload request handler before responding to the client.
**Why it's wrong:** Video transcoding takes minutes. Request times out. Server resources blocked. User sees spinner forever.
**Do this instead:** Store original immediately, return pending status, process asynchronously via Bull queue. Show blurhash placeholder until processed.

### Anti-Pattern 3: Counting Aggregates in Real-Time

**What people do:** `SELECT COUNT(*) FROM likes WHERE post_id = $1` on every post render.
**Why it's wrong:** COUNT is O(n) in PostgreSQL. A popular post with 50k likes = slow count every time anyone views it.
**Do this instead:** Maintain denormalized counters (post_stats table). Increment/decrement via application logic or database triggers. Accept slight eventual consistency.

### Anti-Pattern 4: Monolithic "God Module"

**What people do:** Put all services in one NestJS module or import every module into every other module.
**Why it's wrong:** Destroys module boundaries. Testing requires the entire app. Circular dependencies become inevitable.
**Do this instead:** Keep modules focused. Use events for cross-cutting concerns. Only export services that other modules genuinely need.

### Anti-Pattern 5: Storing Media in the Database

**What people do:** Store images as BLOBs in PostgreSQL.
**Why it's wrong:** Database backup size explodes. No CDN integration. Can't serve media efficiently. Postgres is not a file server.
**Do this instead:** Store media in S3/object storage. Store only the URL reference in the database.

### Anti-Pattern 6: Offset Pagination on Large Tables

**What people do:** `SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 10000`.
**Why it's wrong:** PostgreSQL must scan and discard 10,000 rows to get to offset. Gets slower as users scroll deeper.
**Do this instead:** Cursor-based pagination using WHERE clause on (created_at, id) tuple.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| AWS S3 / MinIO | `@aws-sdk/client-s3` via NestJS MediaModule | MinIO for local dev (S3-compatible API). Presigned URLs for direct upload at scale. |
| CloudFront / Cloudflare CDN | DNS + origin config pointing to S3 | Invalidation rarely needed (content-addressed URLs). |
| Google OAuth | `passport-google-oauth20` via NestJS AuthModule | Callback URL must be configured per environment. |
| Apple Sign-In | `passport-apple` via NestJS AuthModule | Requires Apple Developer account + key configuration. |
| SMTP (email) | `@nestjs-modules/mailer` with Nodemailer | Use service like SendGrid/Resend for production. Handlebars templates. |
| Sharp (image processing) | Direct dependency in media worker | Requires libvips native dependency. Ensure Docker image includes it. |
| FFmpeg (video processing) | Child process via `fluent-ffmpeg` | Must be installed on server/container. Resource-intensive -- run on dedicated workers. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Next.js (web) -> NestJS (api) | HTTP REST + WebSocket | Server Components fetch during SSR. Client Components fetch via API client. |
| PostsModule -> MediaModule | Direct import (DI) | Posts reference media entities. Media processing is fire-and-forget via queue. |
| PostsModule -> SocialModule | Event emission (`post.created`) | Feed fan-out triggered by event, not direct call. Keeps PostsModule decoupled from feed logic. |
| PostsModule -> NotificationModule | Event emission (`post.liked`, `post.commented`) | Notifications are a side effect, not core post logic. |
| CollectionModule -> PostsModule | Direct import (DI) | Posts can be tagged with collection items. Collection showcases query posts. |
| ChatModule -> Redis Pub/Sub | `@socket.io/redis-adapter` | Required for multi-instance WebSocket delivery. |
| All modules -> Bull queues -> Redis | `@nestjs/bull` | Async job dispatch. Workers can run in-process or as separate processes. |

## Build Order (Suggested Implementation Phases)

Based on dependency analysis, components should be built in this order:

```
Phase 1: Foundation
├── Monorepo setup (Turborepo + pnpm)
├── PostgreSQL + Redis + MinIO (docker-compose)
├── NestJS bootstrap (AppModule, config, database connection)
├── Next.js bootstrap (App Router, layouts, basic pages)
├── Shared package (types, DTOs)
└── Auth system (register, login, JWT, OAuth)

Phase 2: Core Social
├── User profiles (CRUD, avatar upload)
├── Media pipeline (upload, processing, S3, Sharp)
├── Post creation (text + images)
├── Social graph (follow/unfollow)
├── Feed generation (fan-out on write, Redis)
└── Basic interactions (like, comment)

Phase 3: Rich Media
├── Carousel posts (multiple images)
├── Stories (24h expiry, viewer tracking)
├── Reels (video upload, FFmpeg processing)
├── Explore page (trending, category grid)
└── Search (PostgreSQL full-text)

Phase 4: Real-Time + Messaging
├── WebSocket infrastructure (Socket.IO + Redis adapter)
├── Real-time notifications
├── DM system (conversations, messages)
└── Online presence

Phase 5: Collection System
├── Category + series + catalog item management
├── Catalog seeding (initial data for Gundam, sneakers, etc.)
├── User checklists (create, browse, mark status)
├── Collection showcase on profiles
├── Post-collection tagging
└── Collection search + browse

Phase 6: Polish + Scale
├── CDN integration
├── Performance optimization (caching, pagination)
├── Rate limiting
├── Admin panel (catalog management, moderation)
└── Analytics + trending algorithms
```

**Build order rationale:**
- **Auth first:** Everything depends on knowing who the user is.
- **Media pipeline before posts:** Posts are meaningless without images. Get upload/processing working early.
- **Social graph before feed:** Feed fan-out requires knowing who follows whom.
- **Collections after core social:** The collection system is Figly's differentiator but depends on posts + profiles being solid. Users need to be able to post and interact before the collection layer adds value.
- **Real-time in Phase 4:** DM and notifications enhance the experience but are not blocking for core functionality. WebSocket infrastructure is complex enough to warrant its own phase.

## Sources

- Instagram Engineering Blog (instagram-engineering.com) -- original architecture writings on feed ranking, media pipelines, and scaling challenges (training data knowledge)
- NestJS official documentation (docs.nestjs.com) -- modules, guards, WebSocket gateways, Bull integration (training data knowledge, HIGH confidence -- well-established framework)
- Next.js official documentation (nextjs.org/docs) -- App Router, Server Components, ISR patterns (training data knowledge, HIGH confidence)
- System design references: "Designing Data-Intensive Applications" by Martin Kleppmann -- fan-out patterns, caching strategies
- PostgreSQL documentation -- full-text search, JSONB, indexing strategies (training data knowledge, HIGH confidence)
- Bull/BullMQ documentation -- queue patterns, job processing (training data knowledge, MEDIUM confidence)

**Note:** Web search and Brave search tools were unavailable during this research session. All findings are based on training data for well-established architectural patterns. The social media system design domain is one of the most extensively documented architecture topics, and the patterns described here represent industry-standard approaches. Confidence is MEDIUM overall because specific version numbers and latest API changes could not be verified against live documentation.

---
*Architecture research for: Instagram-like social media platform for collectors (Figly)*
*Researched: 2026-03-13*
