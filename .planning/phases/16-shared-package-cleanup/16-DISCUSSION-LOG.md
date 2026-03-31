# Phase 16: Shared Package Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-26
**Phase:** 16-shared-package-cleanup
**Areas discussed:** Shared package strategy, File naming, Constants handling, Validation approach, Scope

---

## Shared Package Strategy

| Option                    | Description                                                                                           | Selected |
| ------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| Giữ shared, dọn sạch      | Giữ @figly/shared nhưng dọn: dto/ → schemas/, xóa dist/ khỏi git. Phổ biến nhất cho monorepo 1 người. |          |
| Xóa shared, dùng codegen  | Xóa shared. Dùng Swagger codegen để generate types cho frontend. Chuyên nghiệp hơn nhưng cần setup.   | ✓        |
| Xóa shared, copy thủ công | Xóa shared. Copy types/schemas vào cả 2 bên. Nhanh nhưng duplicate code.                              |          |

**User's choice:** Xóa shared, dùng codegen — "dùng đúng cách micro service đi đừng nên share"
**Notes:** User explicitly wants microservice-style independence. Does not want a shared package at all.

---

## Frontend Types Source

| Option             | Description                                                                       | Selected |
| ------------------ | --------------------------------------------------------------------------------- | -------- |
| Codegen từ Swagger | Dùng swagger-typescript-api hoặc openapi-typescript để generate types từ Swagger. | ✓        |
| Copy thủ công      | Copy types thủ công từ shared vào frontend/backend.                               |          |

**User's choice:** Codegen từ Swagger

---

## Validation Strategy

| Option               | Description                                                        | Selected |
| -------------------- | ------------------------------------------------------------------ | -------- |
| Mỗi bên tự validate  | Frontend tự viết Zod schemas riêng. Backend giữ Zod schemas riêng. | ✓        |
| Chỉ backend validate | Backend là nguồn duy nhất. Frontend không validate.                |          |

**User's choice:** Mỗi bên tự validate

---

## Constants Handling

| Option              | Description                                                                      | Selected |
| ------------------- | -------------------------------------------------------------------------------- | -------- |
| Duplicate constants | Copy POST_LIMITS, REEL_LIMITS vào cả 2 bên.                                      |          |
| API config endpoint | Backend expose constants qua API endpoint (/api/config). Frontend fetch về dùng. | ✓        |

**User's choice:** API config endpoint

---

## Scope / Roadmap

| Option            | Description                                                               | Selected |
| ----------------- | ------------------------------------------------------------------------- | -------- |
| Cập nhật Phase 16 | Cập nhật ROADMAP Phase 16 thành "Remove Shared Package" với scope mới.    |          |
| Thêm Phase 17 mới | Giữ Phase 16 gốc (rename + gitignore), thêm Phase 17 cho việc xóa shared. | ✓        |

**User's choice:** Thêm Phase 17 mới — Phase 16 giữ scope gốc, Phase 17 xóa shared hoàn toàn.

---

## File Naming

| Option          | Description                                                      | Selected |
| --------------- | ---------------------------------------------------------------- | -------- |
| Đổi tên file    | auth.dto.ts → auth.schema.ts, post.dto.ts → post.schema.ts, etc. | ✓        |
| Chỉ đổi thư mục | Chỉ đổi dto/ → schemas/, giữ nguyên tên file.                    |          |

**User's choice:** Đổi tên file — sạch hơn vì đây là Zod schemas, không phải DTO.

---

## Claude's Discretion

- Type suffix renaming (SignupDto → SignupInput) deferred to Phase 17

## Deferred Ideas

- **Phase 17:** Remove shared package entirely — codegen from Swagger, independent validation, API config endpoint for constants. User wants full microservice independence.
