# Phase 16: Shared Package Cleanup - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Rename shared package's `dto/` directory to `schemas/` with updated file names, and remove `dist/` from git tracking. This is a cleanup phase — no new functionality, no architecture changes.

**Note:** A follow-up Phase 17 will handle the full removal of the shared package (codegen, independent validation, API config endpoint). This phase only does the rename + gitignore work from SHRD-01 and SHRD-02.

</domain>

<decisions>
## Implementation Decisions

### Directory & File Renaming (SHRD-01)

- **D-01:** Rename `packages/shared/src/dto/` directory to `packages/shared/src/schemas/`
- **D-02:** Rename all files inside: `auth.dto.ts` → `auth.schema.ts`, `post.dto.ts` → `post.schema.ts`, `profile.dto.ts` → `profile.schema.ts`, `comment.dto.ts` → `comment.schema.ts`, `collection.dto.ts` → `collection.schema.ts`, `checklist.dto.ts` → `checklist.schema.ts`, `reel.dto.ts` → `reel.schema.ts`
- **D-03:** Update all internal imports in `packages/shared/src/index.ts` from `./dto/*.dto` to `./schemas/*.schema`
- **D-04:** No external import paths change — consumers import from `@figly/shared` barrel, not deep paths

### dist/ Removal (SHRD-02)

- **D-05:** Add `dist/` to `packages/shared/.gitignore` (or update root `.gitignore`)
- **D-06:** Remove `!packages/shared/dist/` exception from root `.gitignore`
- **D-07:** Run `git rm -r --cached packages/shared/dist/` to untrack without deleting local files
- **D-08:** Shared package is already consumed as source-only by workspace tooling — `main` field in package.json should point to `./src/index.ts` instead of `./dist/index.js`

### Claude's Discretion

- Type suffix naming (e.g., whether to also rename `SignupDto` → `SignupInput` inside files) — defer to Phase 17 when shared package is fully removed

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Shared Package

- `packages/shared/package.json` — Package entry points (main, types) that need updating
- `packages/shared/tsconfig.json` — Build config with outDir: ./dist
- `packages/shared/src/index.ts` — Barrel file with all dto/ imports to update

### Git Configuration

- `.gitignore` — Root gitignore with `!packages/shared/dist/` exception to remove

### Codebase Maps

- `.planning/codebase/STRUCTURE.md` — Current directory layout documentation (needs updating after rename)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Barrel file `packages/shared/src/index.ts` re-exports everything — consumers never import deep paths, so only internal imports need updating

### Established Patterns

- All 7 DTO files are Zod schemas (migrated in Phase 13) — renaming to `.schema.ts` reflects actual content
- `reel.dto.ts` is not exported from barrel (has `CreateReelInput` type, not `CreateReelDto`) — include in rename anyway for consistency

### Integration Points

- Backend imports from `@figly/shared`: ~18 locations (services, DTOs, tests)
- Frontend imports from `@figly/shared`: ~50 locations (hooks, components, stores, pages)
- All go through barrel — zero deep `dto/` path imports from consumers
- Backend has local DTO wrappers (e.g., `backend/src/posts/dto/create-post.dto.ts`) that re-export from `@figly/shared` — these are unaffected by the internal rename

</code_context>

<specifics>
## Specific Ideas

- User explicitly wants to move toward microservice independence (Phase 17 will fully remove shared package)
- This phase is a stepping stone — make the rename clean so Phase 17 has less to untangle

</specifics>

<deferred>
## Deferred Ideas

### Phase 17: Remove Shared Package (new phase to add to roadmap)

- **Remove `@figly/shared` entirely** — no shared package between frontend and backend
- **Codegen from Swagger:** Use swagger-typescript-api or openapi-typescript to generate frontend types from Swagger/OpenAPI (already available from Phase 13)
- **Independent validation:** Each side writes own Zod schemas — frontend validates forms, backend validates API requests
- **API config endpoint:** Backend exposes constants (POST_LIMITS, FILE_LIMITS, REEL_LIMITS, etc.) via `/api/config` endpoint instead of sharing constants
- User wants "đúng cách microservice" — full independence between frontend and backend

</deferred>

---

_Phase: 16-shared-package-cleanup_
_Context gathered: 2026-03-26_
