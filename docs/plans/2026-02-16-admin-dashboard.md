# Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Google OAuth-protected admin dashboard for PTA board members to manage reimbursement submissions.

**Architecture:** Google OAuth 2.0 flow with HMAC-signed session cookies. Admin routes at `/admin/*` with a shared `requireAdmin()` auth guard. All admin data queries go directly to D1, file downloads via R2 presigned URLs.

**Tech Stack:** React Router 7 (SSR), Cloudflare Workers (D1, R2, KV), Tailwind CSS v4, Google OAuth 2.0, Web Crypto API for HMAC signing.

---

### Task 1: Add New Env Vars to Worker Env Interface

**Files:**
- Modify: `workers/app.ts:6-20`

**Step 1: Add Google OAuth and session env vars to the Env interface**

Add these three fields to the `Env` interface in `workers/app.ts`:

```typescript
GOOGLE_CLIENT_ID: string;
GOOGLE_CLIENT_SECRET: string;
SESSION_SECRET: string;
```

**Step 2: Add D1 migration for admin_notes column**

Create `migrations/0002_admin_notes.sql`:

```sql
ALTER TABLE submissions ADD COLUMN admin_notes TEXT;
```

**Step 3: Commit**

```bash
git add workers/app.ts migrations/0002_admin_notes.sql
git commit -m "feat: add admin env vars and admin_notes column"
```

---

### Task 2: Auth Utilities — Session Signing and Verification

**Files:**
- Create: `app/lib/admin/auth.ts`

**Step 1: Implement session cookie helpers**

Create `app/lib/admin/auth.ts` with:

- `signSession(payload: { email: string; name: string; picture?: string }, secret: string): Promise<string>` — creates `base64(payload).base64(hmac-sha256)` cookie value with `exp` field (24h from now)
- `verifySession(cookie: string, secret: string): Promise<{ email: string; name: string; picture?: string } | null>` — verifies HMAC, checks expiry
- `requireAdmin(request: Request, env: { SESSION_SECRET: string }): Promise<{ email: string; name: string } | Response>` — reads `admin_session` cookie, verifies it, returns user data or a redirect Response to `/api/auth/google`

Use the Web Crypto API (`crypto.subtle`) for HMAC-SHA256 — this is available on Cloudflare Workers.

**Step 2: Commit**

```bash
git add app/lib/admin/auth.ts
git commit -m "feat: add admin session auth utilities"
```

---

### Task 3: Google OAuth Routes

**Files:**
- Create: `app/routes/api.auth.google.ts`
- Create: `app/routes/api.auth.callback.ts`
- Create: `app/routes/api.auth.logout.ts`
- Modify: `app/routes.ts`

**Step 1: Implement Google OAuth redirect route**

Create `app/routes/api.auth.google.ts`:

```typescript
// loader: GET /api/auth/google
// Build Google OAuth URL with:
//   - client_id from env
//   - redirect_uri = origin + "/api/auth/callback"
//   - scope = "openid email profile"
//   - response_type = "code"
//   - hd = "bheeagles.com" (domain hint)
// Redirect to the URL
```

**Step 2: Implement callback route**

Create `app/routes/api.auth.callback.ts`:

```typescript
// loader: GET /api/auth/callback
// 1. Extract ?code= from URL
// 2. Exchange code for tokens at https://oauth2.googleapis.com/token
// 3. Decode id_token (JWT) to get email, name, picture
//    (just base64-decode the payload — Google's id_token is a JWT,
//     we trust it because we just received it directly from Google over HTTPS)
// 4. Check email ends with @bheeagles.com — if not, return 403
// 5. Sign session cookie with signSession()
// 6. Set cookie: admin_session, HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=86400
// 7. Redirect to /admin
```

**Step 3: Implement logout route**

Create `app/routes/api.auth.logout.ts`:

```typescript
// loader: GET /api/auth/logout
// Clear the admin_session cookie (Max-Age=0)
// Redirect to /
```

**Step 4: Register all three routes in app/routes.ts**

Add:
```typescript
route("api/auth/google", "./routes/api.auth.google.ts"),
route("api/auth/callback", "./routes/api.auth.callback.ts"),
route("api/auth/logout", "./routes/api.auth.logout.ts"),
```

**Step 5: Commit**

```bash
git add app/routes/api.auth.google.ts app/routes/api.auth.callback.ts app/routes/api.auth.logout.ts app/routes.ts
git commit -m "feat: add Google OAuth login/callback/logout routes"
```

---

### Task 4: Admin List View — Route and Loader

**Files:**
- Create: `app/routes/admin.reimbursements.tsx`
- Modify: `app/routes.ts`

**Step 1: Implement the list route**

Create `app/routes/admin.reimbursements.tsx` with:

**Loader:**
- Call `requireAdmin(request, env)` — redirect if not authed
- Read URL search params: `status` (filter), `sort` (field), `order` (asc/desc)
- Query D1: `SELECT * FROM submissions` with optional `WHERE status = ?`, `ORDER BY` clause
- Return `{ submissions, user, filters: { status, sort, order } }`

**Component:**
- Admin header with user name/picture and logout link
- Filter bar: status dropdown (all/pending/approved/rejected/needs_info)
- Table with columns: Date, Requester, Email, Amount, Status, Actions
- Status shown as colored badges (green=approved, yellow=pending, red=rejected, blue=needs_info)
- Each row links to `/admin/reimbursements/:id`
- Export CSV button
- Use existing brand colors (eagle-blue, spirit-gold, etc.)

**Step 2: Register route**

Add to `app/routes.ts`:
```typescript
route("admin", "./routes/admin.reimbursements.tsx"),
route("admin/reimbursements", "./routes/admin.reimbursements.tsx"),
```

**Step 3: Run typecheck**

```bash
npm run typecheck
```

**Step 4: Commit**

```bash
git add app/routes/admin.reimbursements.tsx app/routes.ts
git commit -m "feat: add admin reimbursements list view"
```

---

### Task 5: Admin Detail View

**Files:**
- Create: `app/routes/admin.reimbursement-detail.tsx`
- Modify: `app/routes.ts`

**Step 1: Implement the detail route**

Create `app/routes/admin.reimbursement-detail.tsx` with:

**Loader:**
- `requireAdmin(request, env)`
- Extract `:id` param
- Query D1 for submission, receipt_entries, and file_attachments (3 queries or a batch)
- If not found, throw 404
- Return `{ submission, receipts, files, user }`

**Component:**
- Back link to `/admin/reimbursements`
- Submission header: requester name, email, phone, dates, invoice number
- Status badge + update form (dropdown + notes textarea + save button)
- Receipt entries table: date, description, vendor, category, amount
- Files section: list with download links
- PDF download link
- Total amount
- Delete button (with confirmation modal/dialog)

**Step 2: Register route**

Add to `app/routes.ts`:
```typescript
route("admin/reimbursements/:id", "./routes/admin.reimbursement-detail.tsx"),
```

**Step 3: Run typecheck**

```bash
npm run typecheck
```

**Step 4: Commit**

```bash
git add app/routes/admin.reimbursement-detail.tsx app/routes.ts
git commit -m "feat: add admin reimbursement detail view"
```

---

### Task 6: Admin Action Routes — Status Update, Delete, Export

**Files:**
- Create: `app/routes/api.admin.reimbursement-status.ts`
- Create: `app/routes/api.admin.reimbursement-delete.ts`
- Create: `app/routes/api.admin.reimbursements-export.ts`
- Create: `app/routes/api.admin.reimbursement-file.ts`
- Modify: `app/routes.ts`

**Step 1: Status update action**

Create `app/routes/api.admin.reimbursement-status.ts`:

```typescript
// action: POST /api/admin/reimbursements/:id/status
// requireAdmin()
// Parse body: { status, notes }
// Validate status is one of: pending, approved, rejected, needs_info
// UPDATE submissions SET status = ?, admin_notes = ?, updated_at = datetime('now') WHERE id = ?
// Return { success: true }
```

**Step 2: Delete action**

Create `app/routes/api.admin.reimbursement-delete.ts`:

```typescript
// action: DELETE /api/admin/reimbursements/:id
// requireAdmin()
// Fetch submission to get pdf_key and file attachments
// Delete from R2: pdf_key + all file_attachment r2_keys
// DELETE FROM submissions WHERE id = ? (cascades to receipt_entries and file_attachments)
// Return { success: true }
```

**Step 3: CSV export loader**

Create `app/routes/api.admin.reimbursements-export.ts`:

```typescript
// loader: GET /api/admin/reimbursements/export
// requireAdmin()
// Read ?status= filter from URL
// Query all submissions (with optional status filter) + join receipt_entries
// Build CSV string: ID, Date, Requester, Email, Amount, Status, Budget Account, Description
// Return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=reimbursements.csv" } })
```

**Step 4: File download proxy**

Create `app/routes/api.admin.reimbursement-file.ts`:

```typescript
// loader: GET /api/admin/reimbursements/file?key=...
// requireAdmin()
// Read ?key= from URL
// Fetch from R2: env.R2_BUCKET.get(key)
// Return the file with appropriate Content-Type and Content-Disposition headers
```

**Step 5: Register routes**

Add to `app/routes.ts`:
```typescript
route("api/admin/reimbursements/:id/status", "./routes/api.admin.reimbursement-status.ts"),
route("api/admin/reimbursements/:id/delete", "./routes/api.admin.reimbursement-delete.ts"),
route("api/admin/reimbursements/export", "./routes/api.admin.reimbursements-export.ts"),
route("api/admin/reimbursements/file", "./routes/api.admin.reimbursement-file.ts"),
```

**Step 6: Run typecheck**

```bash
npm run typecheck
```

**Step 7: Commit**

```bash
git add app/routes/api.admin.reimbursement-status.ts app/routes/api.admin.reimbursement-delete.ts app/routes/api.admin.reimbursements-export.ts app/routes/api.admin.reimbursement-file.ts app/routes.ts
git commit -m "feat: add admin action routes (status, delete, export, file download)"
```

---

### Task 7: Wire Up Admin UI Interactions

**Files:**
- Modify: `app/routes/admin.reimbursement-detail.tsx`
- Modify: `app/routes/admin.reimbursements.tsx`

**Step 1: Wire up status update form**

In the detail view, make the status update form submit via `fetch()` to `/api/admin/reimbursements/:id/status` and reload data on success.

**Step 2: Wire up delete button**

Add a delete confirmation (native `confirm()` dialog is fine), then `fetch()` DELETE to `/api/admin/reimbursements/:id/delete`, redirect to list on success.

**Step 3: Wire up CSV export**

In list view, export button links to `/api/admin/reimbursements/export` (optionally with current status filter as query param).

**Step 4: Wire up file downloads**

In detail view, file links point to `/api/admin/reimbursements/file?key=<r2_key>`.

**Step 5: Run typecheck and manual test**

```bash
npm run typecheck
```

**Step 6: Commit**

```bash
git add app/routes/admin.reimbursement-detail.tsx app/routes/admin.reimbursements.tsx
git commit -m "feat: wire up admin UI interactions"
```

---

### Task 8: Wrangler Config and Final Verification

**Files:**
- Modify: `wrangler.jsonc` (document needed env vars in comments)

**Step 1: Verify typecheck passes**

```bash
npm run typecheck
```

**Step 2: Verify dev server runs**

```bash
npm run dev
```

**Step 3: Final commit if any changes needed**

```bash
git add -A
git commit -m "feat: admin dashboard complete"
```
