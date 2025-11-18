## Overview
Deliver end-to-end flow: Create User → Assign Roles → Document creation/approvals up the hierarchy, with session persistence and immediate dashboard updates. Align with pending/active states, audit logging, and email-from-name generation.

## Backend APIs
1. Auth Session Bootstrap
- Add `GET /api/auth/session` to return current user from HttpOnly cookie.
- Map backend `branch` → frontend `division` in role objects.

2. Create/List Users
- `POST /api/users`: input `{ name }` only; generate unique email-from-name; generate temp password, hash with bcrypt, save user with `status: 'pending'`; return `{ user, tempPassword }`; log audit.
- `GET /api/users`: returns all users (pending/active), mapping roles to `{ division }`.

3. Role Assignment
- `PATCH /api/users/[id]`: input `{ roles: [{ role, state?, division? }] }`; persist roles (`division → branch`), mark `status: 'active'`; return updated user.

4. Requests & Documents
- Use existing `WorkflowRequest` model for PMO/CEO/Advisor/State YP flows.
- Endpoints:
  - `POST /api/workflows`: PMO/CEO create requirement; include targets (states/divisions).
  - `PATCH /api/workflows`: approve/reject with role checks (Advisor/CEO/etc.).
  - `POST /api/forms`: Div YP submits division-level document for a request; validate with template.
  - `PATCH /api/forms/:id/approve`: HOD approves; `reject` to send back; append audit.
  - `POST /api/merge`: State YP merges approved division docs; produce consolidated data.
  - `POST /api/reports/state`: State YP compiles merged data into `StateReport` and forwards.
  - `POST /api/docs`: generate downloadable doc (docx/pdf) from submissions/merged data.

## Data Models
- Extend `User` with `status: 'pending' | 'active'`.
- Add `Audit` model: `{ action, actorId, targetUserId?, notes?, ts }`.
- Add `StateReport` model: `{ state, requestId, divisionDocs[], compiledData, audit[] }`.

## Frontend Changes
1. Auth Provider & Routing
- On mount, call `/api/auth/session`; gate redirects with `initialized` flag to avoid flicker.

2. User Management
- Load users from `GET /api/users` and show pending/active.
- Create user via `POST /api/users`; append to list immediately; toast shows `email + tempPassword`.
- Auto-open Assign Roles dialog; save roles via `PATCH /api/users/[id]`; update list in-place.

3. Unified Dashboard & Request View
- Display tasks by current assignee and context (state/division); ensure filters do not hide new/pending users.
- In request detail:
  - Div YP: submit division document via `POST /api/forms`.
  - HOD/State YP/Advisor/CEO: approve/reject actions; show audit updates.
  - State YP: merge approved division docs (`POST /api/merge`) and compile report (`POST /api/reports/state`).
  - Provide “Generate Document” button (`POST /api/docs`).

## Authorization & Mapping
- Reuse `authenticateRequest` and `requireRoles` for guards.
- Map `division ↔ branch` between UI and DB consistently.

## Email-from-Name Algorithm
- Normalize name: lowercased, spaces collapsed, alphanumerics only.
- Base: `first.last` if two+ parts, else `first`.
- Candidate: `base@niti.gov.in`; on collision, append numeric suffix (`base2@niti.gov.in`, etc.).

## Acceptance Tests
- Session persists across refresh/back/forward; redirects only on expiry.
- Create user shows instantly with `pending`.
- Email uniqueness validated with same-name inputs.
- Temp password returned to frontend; DB stores only hashed.
- Auto redirect to Assign Roles; role save persists and updates UI; user becomes `active`.
- Division doc submitted by Div YP; approvals up the chain; state-level compilation and top-level forwarding.

## Rollout & Notes
- Dev ergonomics: set auth cookies `secure` flag true only in production; false locally.
- Non-breaking migration: default `status` for existing users to `active`.
- Audit every key action (create user, role assignment, submit/approve/reject, compile/report).