# Admin Dashboard for Reimbursement Submissions

## Summary

Add a Google OAuth-protected admin dashboard at `/admin` for PTA board members (`@bheeagles.com`) to view, manage, export, and delete reimbursement submissions.

## Authentication

- Manual Google OAuth 2.0 authorization code flow
- Domain restriction: `@bheeagles.com` only
- Session via HMAC-signed cookie (no server-side store)
- Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`

## Routes

- `GET /api/auth/google` — redirect to Google consent
- `GET /api/auth/callback` — exchange code, validate domain, set cookie
- `GET /api/auth/logout` — clear cookie
- `/admin` — redirect to `/admin/reimbursements`
- `/admin/reimbursements` — list view
- `/admin/reimbursements/:id` — detail view
- `POST /api/admin/reimbursements/:id/status` — update status
- `DELETE /api/admin/reimbursements/:id` — delete submission
- `GET /api/admin/reimbursements/export` — CSV export

## Admin Features

- List: table with date, requester, email, amount, status; filter by status; sort by date/amount
- Detail: full submission info, receipt line items, file downloads (presigned R2 URLs), PDF download, status update with notes, delete with confirmation
- Export: CSV of all/filtered submissions
