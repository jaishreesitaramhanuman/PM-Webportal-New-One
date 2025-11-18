## Overview
Implement four enhancements: dev users reset control in User Management, global/loading animations including login, move AI Assistant to the right, and add per‑user reset password and delete actions.

## UI Changes (User Management)
- Add `Reset Dev Users` button to `CardHeader`, positioned left of `Add New User`.
- Hook: shows toast in demo mode; in DB mode calls a dev seed/reset endpoint.
- File: `src/app/dashboard/user-management/page.tsx` — header area at lines 168–181; actions column at lines 235–262.

## Loading UX
- Create a reusable `LoadingOverlay` and `Spinner` component using existing UI primitives (`Skeleton`, `progress`).
- Integrate loading states on:
  - Login submit: show signing animation and disable button (`src/components/auth/login-form.tsx:16–25,51–53`).
  - User actions: add loading for add, edit, delete, reset password in `page.tsx`.
  - AI Assistant ask flow already uses `Skeleton`; keep and unify style (`src/components/assistant/assistant-sidebar.tsx:48–55`).

## Assistant Placement
- Move AI Assistant to right side using the Sheet’s `side="right"`.
- Keep trigger in sidebar footer; alternatively add a header button for quick access.
- Files: `src/components/assistant/assistant-sidebar.tsx:39` (`side="left"` → `right`), `src/app/dashboard/layout.tsx:63–70` (trigger/button remains).

## User Actions (Reset Password & Delete)
- Add `Reset Password` button next to `Edit` in actions column with a subtle style.
- Use a red `Trash2` icon at end for delete; keep existing `AlertDialog` confirmation but wire real deletion.
- Dev mode: no persistence; update local UI state and toasts.
- DB mode: add API routes and wire calls:
  - `DELETE /api/users/:id` — delete user (role‐guarded).
  - `POST /api/users/:id/reset-password` — reset to a generated strong temp password; return it in response for admin display.
- Guard with `Super Admin` role.
- File additions: `src/app/api/users/[id]/route.ts` (DELETE, POST for reset), reuse `src/models/user.ts`.

## Implementation Notes
- Respect existing patterns: Shadcn UI components, hooks, toast notifications, Zod validation.
- Maintain demo/DB mode parity; in demo mode, simulate via toasts and local state.
- UX: disable buttons during requests; show overlay/spinner feedback.

## Verification
- Run in dev and DB modes:
  - Login: see signing animation, disable during request.
  - User Management: Reset Dev Users triggers toast/API; add/edit/delete/reset password reflect loading states and confirmations.
  - Assistant opens on right and works as before.
- Build and run tests; smoke-test new endpoints with curl.

## Confirmation
Proceed to implement these changes now?