---
status: partial
phase: 13-backend-hardening
source: [13-VERIFICATION.md]
started: 2026-03-25
updated: 2026-03-25
---

## Current Test

[awaiting human testing]

## Tests

### 1. Swagger UI Accessibility
expected: Start backend with valid env vars. Navigate to `http://localhost:4000/api/docs`. Swagger UI loads showing "Figly API" title, version "2.0", cookie auth support, and all API endpoints with Zod-generated schemas.
result: [pending]

### 2. Pino JSON Log Output in Production Mode
expected: Set `NODE_ENV=production` and start the backend. Make a request. Log lines are newline-delimited JSON objects (not pino-pretty text). Authorization and cookie header values must not appear in logged output.
result: [pending]

### 3. GET /api/health Returns 503 on Service Failure
expected: Stop the PostgreSQL container. Call `GET /api/health`. HTTP 503 response with `status: "error"` and `database` indicator showing `status: "down"`.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
