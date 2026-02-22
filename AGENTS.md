# AGENTS.md
HISP HR System — Agent Contract & Development Discipline

This file defines mandatory rules Codex must follow for every milestone.

These rules are non-optional.

---

## 1. Authoritative Documents

Before implementing anything:

1. Read `docs/requirements.md` (authoritative — DO NOT modify unless explicitly instructed).
2. Read `docs/status.md`.
3. Follow this AGENTS.md strictly.

---

## 2. Architecture Rules (Backend)

### Clean Architecture

All backend code must follow:

handlers → services → repositories → db

No business logic in:
- Wails bindings
- HTTP handlers
- Repositories

Repositories:
- SQLX only
- Parameterized queries only
- No string concatenation SQL

### Database Rules

- All schema changes MUST use `golang-migrate`.
- Every migration must have:
  - up file
  - down file
- No direct schema edits outside migrations.
- Add indexes where necessary for performance.
- No unbounded SELECT queries for reports.

---

## 3. Authentication & Security

JWT authentication must use:

- Short-lived access tokens
- Refresh tokens stored hashed in DB
- Refresh token rotation
- Proper expiry handling

Security requirements:

- Never log sensitive data.
- Never return password_hash in responses.
- Enforce RBAC server-side on ALL protected operations.
- Do not rely on frontend hiding of UI elements for security.

---

## 4. RBAC Enforcement

All protected operations MUST enforce RBAC server-side.

No method may assume frontend restrictions are sufficient.

If a new module is added:
- Define its RBAC matrix explicitly.
- Validate role at service layer.

---

## 5. Payroll & Transaction Rules

Payroll operations MUST be transactional.

Any multi-row financial operation must:
- Use explicit DB transaction
- Roll back fully on error
- Never leave partial state

---

## 6. Routing & Navigation Stability (CRITICAL)

No milestone may introduce:

- TanStack Router NotFound warnings
- Broken redirects
- Unguarded routes
- Infinite redirect loops

After every milestone:

- Re-run navigation tests:
  - "/" redirect
  - /dashboard
  - All module routes
  - /access-denied
  - Unknown route → notFoundComponent
- Confirm no routing warnings in console.

Navigation integrity is mandatory.

---

## 7. Export Rules (Desktop App Standard)

All exports must:

- Use native Wails Save File dialog.
- Not rely on browser download hacks.
- Return filename + data from backend.
- Use a centralized SaveFileWithDialog helper.

If the user cancels:
- Do not treat as error.
- Show cancellation snackbar.

No module may implement custom ad-hoc export logic.

---

## 8. Reports & Large Dataset Rules

Reports must:

- Support pagination
- Validate filters server-side
- Reject unsafe unbounded exports
- Use parameterized SQL only
- Enforce RBAC per report

CSV exports:
- Must include headers
- Use consistent date formats (YYYY-MM-DD)
- Use consistent filename convention

---

## 9. UI & UX Discipline (MUI Standards)

All pages must include:

- Loading skeleton
- Empty state
- Error state
- Snackbar feedback
- Disabled state during mutation
- Consistent spacing and typography

No cluttered layouts.
No broken responsive behavior.
No console errors allowed.

---

## 10. Prompt Archiving Policy (LOCAL ONLY)

Every milestone prompt MUST be saved locally.

### Storage Location:

docs/prompts/YYYY-MM-DD_HHMM_<milestone_slug>.md

Contents must include:
- Exact prompt text
- Date/time
- Optional short purpose note

Git Rules:
- `docs/prompts/` is ignored via `.gitignore`.
- Only `docs/prompts/README.md` and `.gitkeep` are committed.
- Prompt history files must never be committed.

This ensures reproducibility and auditability.

---

## 11. End-of-Milestone Checklist (MANDATORY)

At the end of EVERY milestone:

1. Leave `docs/requirements.md` untouched.
2. Update `docs/status.md`:
   - Mark milestone as Completed
   - Indicate next milestone
3. Create or update:
   docs/notes/<module>.md
   Including:
   - Schema changes
   - Binding signatures
   - Architectural decisions
   - Tests added
4. Re-run navigation tests.
5. Confirm no console errors.
6. Confirm RBAC is enforced server-side.

A milestone is not complete until this checklist passes.

---

## 12. Testing Requirements

Minimum required:

- Unit tests for new business logic
- RBAC tests for protected modules
- Transaction tests where applicable
- Routing smoke tests if harness exists

No milestone closes without verifying existing tests still pass.

---

## 13. Dependency Rule

Do not introduce new external frameworks unless explicitly approved.

If a new dependency is necessary:
- Explain why
- Ask for approval
- Document it in notes

---

## 14. Performance Discipline

- Add indexes where query patterns require it.
- Avoid N+1 queries.
- Avoid loading entire tables into memory.
- Prefer aggregation queries in SQL over in-memory loops.

---

## 15. Error Handling Standard

Errors must:

- Be typed where appropriate.
- Be user-friendly at UI level.
- Not leak internal stack traces.
- Not panic the application.

Audit failures must never crash main business flow.

---

## 16. Code Quality Expectations

- Keep files modular.
- Avoid overly large service files.
- Use consistent naming.
- Follow existing project patterns.
- No dead code.
- No debug print statements left in production code.

---

End of Agent Contract.
