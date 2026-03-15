# Contributing to Figly

## Branching Strategy

This project follows the **Gitflow** branching model.

```
main          <- Production-ready code (protected)
  └─ develop  <- Integration branch for development
       ├─ feature/*   <- New features
       ├─ release/*   <- Release preparation
       └─ hotfix/*    <- Production bug fixes
```

## Branch Types

### `main`
- Always reflects production-ready state
- **Never commit directly** — only merge from `release/*` or `hotfix/*`
- Tagged with version numbers on each release

### `develop`
- Integration branch for ongoing development
- All feature branches merge here via Pull Request

### `feature/<name>`
- **Create from:** `develop`
- **Merge into:** `develop`
- **Naming:** `feature/add-login`, `feature/update-dashboard`

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
# ... work ...
git push -u origin feature/my-feature
# Open PR to develop
```

### `release/<version>`
- **Create from:** `develop`
- **Merge into:** `main` AND `develop`
- **Naming:** `release/1.0.0`, `release/1.2.0`

```bash
git checkout develop
git checkout -b release/1.0.0
# ... final fixes, bump version ...
# Open PR to main, then merge back to develop
```

### `hotfix/<name>`
- **Create from:** `main`
- **Merge into:** `main` AND `develop`
- **Naming:** `hotfix/fix-crash`, `hotfix/security-patch`

```bash
git checkout main
git checkout -b hotfix/fix-crash
# ... fix ...
# Open PR to main, then merge back to develop
```

## Pull Request Guidelines

1. All changes go through Pull Requests
2. PRs to `main` require at least 1 review approval
3. Keep PRs focused and small when possible
4. Write clear PR descriptions explaining what and why

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add user authentication
fix: resolve dashboard loading issue
docs: update API documentation
refactor: simplify data processing pipeline
```
