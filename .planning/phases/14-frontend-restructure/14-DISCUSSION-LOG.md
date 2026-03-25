# Phase 14: Frontend Restructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 14-frontend-restructure
**Areas discussed:** Directory restructure, Auth middleware, SSR & SEO, Dark mode

---

## Directory Restructure

| Option | Description | Selected |
|--------|-------------|----------|
| Full features/ | Tạo features/ mới chứa tất cả domain code. Giữ components/ui/ riêng cho shared UI primitives. | ✓ |
| Components + coloc | Giữ components/ như hiện tại, chỉ move hooks và stores vào từng domain folder | |
| You decide | Claude quyết định cách tốt nhất | |

**User's choice:** Full features/
**Notes:** Tách biệt rõ ràng, dễ scale

| Option | Description | Selected |
|--------|-------------|----------|
| Giữ nguyên | Giữ components/ui/ và lib/ ở vị trí hiện tại | ✓ |
| Move vào shared/ | Move components/ui/ và lib/ vào shared/ hoặc common/ | |

**User's choice:** Giữ nguyên — shadcn/ui components và utils là shared, không thuộc domain nào

| Option | Description | Selected |
|--------|-------------|----------|
| features/layout/ | Move sidebar, bottom-nav, header-search, public-nav vào features/layout/ | |
| Giữ nguyên | Giữ components/layout/ như hiện tại | ✓ |
| You decide | Claude quyết định | |

**User's choice:** Giữ nguyên

| Option | Description | Selected |
|--------|-------------|----------|
| Có barrel files | Mỗi feature folder có index.ts re-export public API | ✓ |
| Không barrel | Import trực tiếp file | |
| You decide | Claude quyết định | |

**User's choice:** Có barrel files — import gọn hơn, dễ refactor

---

## Auth Middleware

| Option | Description | Selected |
|--------|-------------|----------|
| Cookie check | Middleware kiểm tra cookie accessToken/refreshToken, không gọi API | |
| API verify | Middleware gọi backend API (/auth/me) để verify token | |
| You decide | Claude quyết định | |

**User's choice:** Other — "flow chuẩn tương tự các dự án enterprise" → Cookie check + JWT decode verify expiry, không call API

| Option | Description | Selected |
|--------|-------------|----------|
| Whitelist public | Protected: tất cả routes trừ whitelist | |
| Blacklist protected | Chỉ protect các routes cụ thể | ✓ |

**User's choice:** Blacklist protected — explicitly list protected routes

| Option | Description | Selected |
|--------|-------------|----------|
| Giữ cả hai | Middleware + client-side auth checks (defense in depth) | ✓ |
| Chỉ middleware | Xóa hết client-side auth checks | |

**User's choice:** Giữ cả hai — defense in depth

---

## SSR & SEO

| Option | Description | Selected |
|--------|-------------|----------|
| Chỉ public routes | Chỉ chuyển public routes sang SSR | |
| Tất cả pages | Chuyển tất cả pages sang Server Components | ✓ |
| You decide | Claude quyết định | |

**User's choice:** Other — "hãy làm best practice nhất có thể như một dự án enterprise thật" → Tất cả pages là Server Components

| Option | Description | Selected |
|--------|-------------|----------|
| Server fetch + Client Query | Server Components gọi API lấy initial data, Client components dùng React Query cho mutations | ✓ |
| Chỉ metadata SSR | Server Components chỉ render shell và metadata, data fetch vẫn client-side | |
| You decide | Claude quyết định | |

**User's choice:** Server fetch + Client Query

| Option | Description | Selected |
|--------|-------------|----------|
| Full OG + Twitter | Title, description, og:title, og:description, og:image, twitter:card cho tất cả public pages | ✓ |
| Basic meta | Chỉ title và description cơ bản | |
| You decide | Claude quyết định | |

**User's choice:** Full OG + Twitter

---

## Dark Mode

| Option | Description | Selected |
|--------|-------------|----------|
| next-themes | Thư viện tiêu chuẩn cho Next.js dark mode, no flash | ✓ |
| Custom provider | Tự build ThemeProvider bằng React Context + localStorage | |
| You decide | Claude quyết định | |

**User's choice:** next-themes

| Option | Description | Selected |
|--------|-------------|----------|
| Light/Dark/System | 3 options, mặc định theo system preference | ✓ |
| Light/Dark only | Chỉ Light và Dark, không theo system | |
| You decide | Claude quyết định | |

**User's choice:** Light/Dark/System

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar + Header | Đặt trong sidebar (dưới cùng) và header cho mobile | |
| User menu | Đặt trong dropdown menu của user avatar | ✓ |
| You decide | Claude quyết định vị trí phù hợp nhất | |

**User's choice:** User menu

---

## Claude's Discretion

- Feature folder internal structure (components/, hooks/, stores/ subdirs vs flat)
- Server-side fetch utility design
- Dark theme CSS variable values
- Loading/skeleton patterns for SSR hydration
- Middleware matcher pattern syntax
- auth-store.ts placement (may remain global)

## Deferred Ideas

None — discussion stayed within phase scope
