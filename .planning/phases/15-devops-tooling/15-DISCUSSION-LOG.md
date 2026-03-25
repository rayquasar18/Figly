# Phase 15: DevOps & Tooling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 15-devops-tooling
**Areas discussed:** Docker split

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Linting strategy | ESLint flat config vs legacy? Strict rules hay relaxed? | |
| CI/CD pipeline | GitHub Actions: chạy gì? Trigger trên push/PR? Branch protection? | |
| Docker split | 2 Dockerfile riêng hay 1 multi-stage? Network config? | ✓ |
| Pre-commit hooks | Husky + lint-staged: chạy gì trên pre-commit? | |

**User's choice:** Docker split only — other areas deferred to Claude's discretion

---

## Docker Split

### Q1: Cách tổ chức Dockerfile

| Option | Description | Selected |
|--------|-------------|----------|
| 2 Dockerfile riêng (Recommended) | frontend/Dockerfile và backend/Dockerfile, mỗi cái tự build riêng | ✓ |
| 1 Dockerfile multi-stage | 1 Dockerfile ở root với build target `--target frontend` / `--target backend` | |
| You decide | Claude tự chọn | |

**User's choice:** 2 Dockerfile riêng
**Notes:** User confirmed this is best practice — mỗi server có Dockerfile riêng, plus docker-compose để khởi động toàn bộ

### Q2: Docker Compose strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Update docker-compose.yml hiện tại (Recommended) | Xóa service `app` cũ, thay bằng `figly-frontend` + `figly-backend`. Giữ postgres/redis/minio | ✓ |
| Tách 2 compose files | docker-compose.yml cho infra, docker-compose.prod.yml cho app containers | |
| You decide | Claude tự chọn | |

**User's choice:** Update docker-compose.yml hiện tại

### Q3: Frontend Docker build strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Next.js standalone output (Recommended) | output: 'standalone' tạo minimal node server, image nhỏ (~150MB) | ✓ |
| Full build + node_modules | Copy toàn bộ .next + node_modules, image lớn (~500MB+) | |
| You decide | Claude chọn | |

**User's choice:** Next.js standalone output

### Q4: Frontend-Backend communication

| Option | Description | Selected |
|--------|-------------|----------|
| Runtime env + Docker internal network (Recommended) | NEXT_PUBLIC_API_URL set lúc runtime via Docker env. Backend URL là http://figly-backend:4000/api | ✓ |
| Build-time env | NEXT_PUBLIC_API_URL hardcode lúc build. Không linh hoạt | |
| You decide | Claude chọn | |

**User's choice:** Runtime env + Docker internal network

---

## Claude's Discretion

- ESLint configuration approach (flat config vs legacy)
- ESLint rule strictness and violation handling
- Prettier config details
- Husky + lint-staged setup details
- GitHub Actions workflow structure and steps
- CI cache strategy

## Deferred Ideas

None — discussion stayed within phase scope
