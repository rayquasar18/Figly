# Figly

## What This Is

Figly là một mạng xã hội dành cho người sưu tập (collectors), lấy cảm hứng từ Instagram với đầy đủ tính năng tương tự (feed, stories, reels, DM, explore, notifications). Điểm khác biệt là tích hợp hệ thống checklist sưu tập — cho phép người dùng track bộ sưu tập từ database chung và tạo custom checklist riêng. Hỗ trợ nhiều loại sưu tập: Gundam, figurine, sneakers, trading cards, và nhiều hơn nữa.

## Core Value

Người sưu tập có thể chia sẻ, khoe và quản lý bộ sưu tập của mình trong một cộng đồng cùng đam mê — kết hợp social media với collection tracking.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Full Instagram-like social features (feed, stories, reels, DM, explore, notifications)
- [ ] Collection checklist system (shared database + custom lists)
- [ ] Multi-category support (Gundam, figurine, sneakers, cards, etc.)
- [ ] User authentication (email/password + social login)
- [ ] User profiles with collection showcase
- [ ] Follow/unfollow system
- [ ] Like, comment, share interactions
- [ ] Media upload (photos/videos)
- [ ] Search & explore functionality
- [ ] Real-time notifications & messaging

### Out of Scope

- Mobile native app — web-first approach, responsive design only
- E-commerce/marketplace — không bán hàng, chỉ chia sẻ và track
- AI-powered recommendations — defer to future version

## Context

- Dự án production-ready, hướng tới người dùng thật
- Target audience: collectors ở mọi lĩnh vực sưu tập
- Collection database cần data ban đầu cho nhiều categories (Gundam series, figurine lines, sneaker models, trading card sets...)
- Instagram-level UX là benchmark — UI/UX cần polish, không phải prototype

## Constraints

- **Tech stack**: Next.js (frontend) + NestJS (backend) — đã quyết định
- **Platform**: Web only, responsive design
- **Monorepo**: 2 phần riêng biệt — frontend và backend
- **Media storage**: Cần research (S3, Cloudinary, hoặc tương tự)
- **Database**: Cần research (PostgreSQL hoặc MongoDB)
- **Realtime**: Cần research (WebSocket hoặc polling)

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js frontend | User choice — SSR, routing, React ecosystem | — Pending |
| NestJS backend | User choice — TypeScript, modular architecture, scalable | — Pending |
| Web only | Focus resources, mobile later | — Pending |
| Shared + custom checklists | Flexibility — users get curated data AND personal tracking | — Pending |
| Multi-category from start | Broader appeal, not niche to one hobby | — Pending |
| Email + Social login | Lower friction for signups, both auth paths | — Pending |

---
*Last updated: 2026-03-13 after initialization*
