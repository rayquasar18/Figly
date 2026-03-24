# Deferred Items - Phase 11

## Pre-existing Test Failure

**File:** `backend/src/feed/__tests__/public-feed.spec.ts`
**Test:** `should return chronological posts from all users without auth`
**Issue:** Test expects `findManyCall.where` to be `undefined`, but the implementation now has a where clause filtering by `postType: 'POST'` and `user.username: { not: null }`. This is a pre-existing unstaged change in `backend/src/feed/feed.service.ts` that was already present in the working directory before Phase 11 plan 01 began.
**Action needed:** Update the test to match the current implementation, or revert the feed service change if unintended.
