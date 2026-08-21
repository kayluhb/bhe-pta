/**
 * Secrets and optional bindings not (yet) present in wrangler-generated `Env`.
 * Merges with `worker-configuration.d.ts` via interface merging.
 */
interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  /** Bearer token for POST /api/refresh (not the admin session signing secret). */
  DATA_REFRESH_SECRET?: string;
  /** HMAC secret for time-limited public preview URLs (GET /api/reimbursement/file). */
  FILE_URL_SIGNING_SECRET?: string;
  GEMINI_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  NOTIFICATION_EMAIL: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  RESEND_API_KEY: string;
  SENTRY_DSN?: string;
  STAGE_BASIC_AUTH_PASSWORD?: string;
  STAGE_BASIC_AUTH_USER?: string;
  TURNSTILE_SECRET_KEY: string;
}
