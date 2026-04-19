import * as Sentry from '@sentry/cloudflare';
import {createRequestHandler} from 'react-router';
import {fetchCalendarEvents, fetchPtaCalendarEvents} from '../app/lib/calendar';
import {fetchMailchimpCampaigns} from '../app/lib/mailchimp';
import {processReceiptConversionJob} from '../app/lib/reimbursement/receipt-conversion-queue';
import {scrapeSchoolNews} from '../app/lib/scraper';

interface Env {
  BHE_NEWSLETTERS: KVNamespace;
  BHE_PTA_NEWSLETTERS: KVNamespace;
  BHE_CALENDAR: KVNamespace;
  MAILCHIMP_API_KEY: string;
  REIMBURSEMENT_DB: D1Database;
  R2_BUCKET: R2Bucket;
  R2_ARCHIVE: R2Bucket;
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  TURNSTILE_SECRET_KEY: string;
  AI: Ai;
  GEMINI_API_KEY: string;
  SENTRY_DSN?: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  /** Bearer token for POST /api/refresh (not the admin session signing secret). */
  DATA_REFRESH_SECRET?: string;
  /** HMAC secret for time-limited public preview URLs (GET /api/reimbursement/file). */
  FILE_URL_SIGNING_SECRET?: string;
  RECEIPT_CONVERSION_QUEUE: Queue;
}

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

async function runDataRefresh(env: Env): Promise<string[]> {
  const log: string[] = [];

  const results = await Promise.allSettled([
    scrapeSchoolNews(),
    fetchCalendarEvents(),
    fetchPtaCalendarEvents(),
    env.MAILCHIMP_API_KEY && env.MAILCHIMP_API_KEY !== 'placeholder'
      ? fetchMailchimpCampaigns(env.MAILCHIMP_API_KEY)
      : Promise.resolve([]),
  ]);

  const [newsletterResult, calendarResult, ptaCalendarResult, mailchimpResult] = results;

  if (newsletterResult.status === 'fulfilled' && newsletterResult.value.length > 0) {
    await env.BHE_NEWSLETTERS.put('latest', JSON.stringify(newsletterResult.value));
    log.push(`Stored ${newsletterResult.value.length} school newsletters`);
  } else {
    const msg =
      'Failed to scrape newsletters: ' +
      (newsletterResult.status === 'rejected' ? newsletterResult.reason : 'No results');
    console.error(msg);
    log.push(msg);
  }

  // Merge school + PTA calendar events
  const schoolEvents = calendarResult.status === 'fulfilled' ? calendarResult.value : [];
  const ptaEvents = ptaCalendarResult.status === 'fulfilled' ? ptaCalendarResult.value : [];
  const allCalendarEvents = [...schoolEvents, ...ptaEvents];

  if (allCalendarEvents.length > 0) {
    await env.BHE_CALENDAR.put('events', JSON.stringify(allCalendarEvents));
    log.push(`Stored ${schoolEvents.length} school + ${ptaEvents.length} PTA calendar events`);
  } else {
    const msg =
      'Failed to fetch calendars: ' +
      (calendarResult.status === 'rejected' ? calendarResult.reason : 'No results');
    console.error(msg);
    log.push(msg);
  }

  if (ptaCalendarResult.status === 'rejected') {
    const msg = `Failed to fetch PTA calendar: ${ptaCalendarResult.reason}`;
    console.error(msg);
    log.push(msg);
  }

  if (mailchimpResult.status === 'fulfilled' && mailchimpResult.value.length > 0) {
    await env.BHE_PTA_NEWSLETTERS.put('latest', JSON.stringify(mailchimpResult.value));
    log.push(`Stored ${mailchimpResult.value.length} PTA newsletters from Mailchimp`);
  } else if (mailchimpResult.status === 'rejected') {
    const msg = `Failed to fetch Mailchimp campaigns: ${mailchimpResult.reason}`;
    console.error(msg);
    log.push(msg);
  }

  return log;
}

const handler = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.replace(/^www\./, '');
      return Response.redirect(url.toString(), 301);
    }

    // Manual refresh endpoint — requires DATA_REFRESH_SECRET as bearer token
    if (url.pathname === '/api/refresh' && request.method === 'POST') {
      const auth = request.headers.get('Authorization');
      const token = env.DATA_REFRESH_SECRET;
      if (!token || auth !== `Bearer ${token}`) {
        return new Response('Unauthorized', {status: 401});
      }
      const log = await runDataRefresh(env);
      return Response.json({ok: true, log});
    }

    const response = await requestHandler(request, {
      cloudflare: {env, ctx},
    });

    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.google.com https://www.gstatic.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://challenges.cloudflare.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
      'frame-src https://challenges.cloudflare.com',
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ');
    headers.set('Content-Security-Policy', csp);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },

  async scheduled(controller: ScheduledController, env: Env, _ctx: ExecutionContext) {
    console.log(`Cron triggered: ${controller.cron}`);
    const log = await runDataRefresh(env);
    for (const msg of log) {
      console.log(msg);
    }
  },

  async queue(batch: MessageBatch<unknown>, env: Env, _ctx: ExecutionContext) {
    for (const message of batch.messages) {
      try {
        const body = message.body;
        if (!body || typeof body !== 'object' || !('jobId' in body)) {
          console.error('[receipt-conversion-queue] invalid message payload', body);
          message.ack();
          continue;
        }
        const parsed = body as {jobId: string};
        await processReceiptConversionJob(env, parsed);
        message.ack();
      } catch (error) {
        console.error('[receipt-conversion-queue] worker queue consumer failed', error);
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Env>;

export default Sentry.withSentry<Env>((env: Env) => {
  if (!env.SENTRY_DSN) {
    return undefined;
  }

  return {
    dsn: env.SENTRY_DSN,
    // Keep sampling conservative for free-tier quota.
    tracesSampleRate: 0.1,
    sendDefaultPii: true,
  };
}, handler);
