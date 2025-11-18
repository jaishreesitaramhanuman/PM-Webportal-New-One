## Scope
Implement: Create User API with email-from-name + backend temp password + audit, frontend immediate list update and auto redirect to Assign Roles, role assignment saved in DB+UI, dashboard shows pending/active users without hiding new ones, and document creation/approval chain across Div YP → HOD → State YP → Advisor → CEO → PMO. Ensure login persistence across refresh/back/forward.

## Backend APIs
1. Create User: `POST /api/users`
- Input: `{ name }` only; no email supplied.
- Generate unique email from name: `first.last@niti.gov.in` → fallback to `first@niti.gov.in` → append numeric suffix on collision.
- Generate temporary password (random), hash with bcrypt, save to User with `status: 'pending'`.
- Return: `{ user, tempPassword }` where `user.roles = []`, `user.status = 'pending'`.
- Enforce Super Admin: use `authenticateRequest` and `requireRoles` (`src/lib/auth.ts:64`, `src/lib/auth.ts:83`).
- Create audit entry: `Audit.create({ action: 'User Created', actorId, targetUserId, notes })`.

2. List Users: `GET /api/users`
- Return all users including `pending` and `active` states; map backend role `branch` to `division` for UI.
- Use lean results; include `id`, `name`, `email`, `roles`, `avatarUrl`, `status`.

3. Role Assignment: `PATCH /api/users/[id]`
- Input: `{ roles: [{ role, state?, division? }] }`.
- Persist roles; map `division → branch` in DB; mark `status: 'active'`.
- Return updated `{ user }` for immediate UI update.

4. Session Bootstrap: `GET /api/auth/session`
- Read HttpOnly `accessToken` via `authenticateRequest` to return `{ user }` or `401`.
- Map `branch → division` in response.

5. Cookie Flags
- Set `secure` only in production when writing `accessToken`/`refreshToken` in `src/app/api/auth/route.ts:45` to enable local dev persistence.

## Data Models
- User model: add `status: 'pending' | 'active'` (`src/models/user.ts:17`).
- Audit model: add `Audit` with fields `{ action, actorId, targetUserId?, notes?, ts }` (`src/models/audit.ts:1`).

## Frontend Changes
1. Auth Provider
- On mount, call `/api/auth/session` and set `user`; expose `initialized` to gate redirects (`src/hooks/use-auth.tsx:17`).
- `logout()` posts `action: 'logout'` to clear server-side cookies.

2. User Management Page: `src/app/dashboard/user-management/page.tsx`
- Load users from `GET /api/users` on init; display all non–Super Admins, including `pending` and `active`.
- Create user: call `POST /api/users`, append to table immediately, toast with `email + tempPassword`, auto-open the roles dialog (Assign Roles).
- Save roles: call `PATCH /api/users/[id]`, update table in-place.
- Ensure no extra filters hide new users.

3. Dashboard Behavior: `src/app/dashboard/page.tsx`
- Gate redirects on `initialized` to avoid flicker; if user is Super Admin and has only that role, route to User Management.

## Document Workflow (Hierarchy)
1. Models
- Reuse `FormSubmission` for division-level documents (`src/models/form.ts:16`).
- Add `WorkflowRequest` model to represent PMO/CEO/Advisor/State YP fan-out; fields: title, description, state, division, assignedBy, currentAssigneeId, status, audit.
- Add `StateReport` model to store compiled reports referencing approved division submissions.

2. Endpoints
- `POST /api/requests`: CEO/Advisor/State YP creates/fans-out requests with role checks.
- `GET /api/requests`: list by role/context and filters.
- `POST /api/documents`: Div YP submits division-level document for a request (creates `FormSubmission`).
- `PATCH /api/documents/:id/approve` or `/reject`: HOD → State YP → Advisor → CEO approve or request changes; update `audit` trail.
- `POST /api/reports/state`: State YP compiles approved division docs into `StateReport` and forwards upward.
- All guarded by `authenticateRequest` + `requireRoles`.

3. UI Integration
- Extend existing request detail and unified dashboard to call new endpoints and show statuses; preserve current filters but ensure visibility along the chain.

## Acceptance Validation
- Login persistence: hard-refresh, back/forward, and ensure `initialized` gates redirects; verify `/api/auth/session` returns user when cookie valid.
- Create user instant visibility: call `POST /api/users`; confirm row appears without refresh and shows `pending`.
- Email-from-name uniqueness: create same-name users twice; confirm numeric suffix.
- Backend temp password: ensure response includes `tempPassword`; DB stores only hashed.
- Auto redirect to Assign Roles: create user → roles dialog opens; save roles; user `status` becomes `active`.
- Role saved in DB & UI: `PATCH /api/users/[id]` persists and updates UI immediately.
- Document chain: submit division doc, approve up the chain, compile state report, and forward to Advisor → CEO → PMO; audit reflects actions.

## Rollout & Notes
- Dev ergonomics: cookies use non-secure locally; secure in production.
- Traceability: reuse existing helpers (`authenticateRequest` at `src/lib/auth.ts:64`) and current RBAC.
- Migration: add `status` field default to existing users; no breaking changes.

Confirm and I will implement these changes end-to-end and run a quick verification across the acceptance list.