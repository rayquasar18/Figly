---
status: partial
phase: 11-bugfixes-ux-flow
source: [11-VERIFICATION.md]
started: 2026-03-24T01:28:00Z
updated: 2026-03-24T01:28:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Signup flow end-to-end — submit form with only email+password
expected: No name or username fields visible; account created; redirected to /verify-email
result: [pending]

### 2. Complete-profile post-signup flow
expected: After setting username+displayName, user lands on homepage without being sent back to /complete-profile
result: [pending]

### 3. Desktop sidebar visibility at >= 768px viewport
expected: Sidebar appears at 220px width with all 6 items; header Figly text is hidden
result: [pending]

### 4. Mobile layout unchanged
expected: Bottom nav visible below 768px; sidebar hidden
result: [pending]

### 5. Explore page loads without errors
expected: Posts from users with usernames display; no null-username author errors
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
