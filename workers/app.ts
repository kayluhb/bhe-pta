import * as Sentry from '@sentry/cloudflare';
import {createRequestHandler, RouterContextProvider} from 'react-router';
import {fetchCalendarEvents, fetchPtaCalendarEvents} from '../app/lib/calendar';
import {cloudflareContext} from '../app/lib/cloudflare-context';
import {fetchMailchimpCampaigns} from '../app/lib/mailchimp';
import {processReceiptConversionJob} from '../app/lib/reimbursement/receipt-conversion-queue';
import {scrapeSchoolNews} from '../app/lib/scraper';
import {
  isMissingRouteActionError,
  methodNotAllowedForRootResponse,
  shouldDropSentryEvent,
} from '../app/lib/sentry';

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

function unauthorizedStageResponse() {
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="BHE PTA Stage"',
    },
  });
}

function hasValidStageBasicAuth(request: Request, env: Env): boolean {
  const expectedUser = env.STAGE_BASIC_AUTH_USER?.trim();
  const expectedPassword = env.STAGE_BASIC_AUTH_PASSWORD;

  // Disabled unless both vars are configured (intended for stage only).
  if (!expectedUser || !expectedPassword) return true;

  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Basic ')) return false;

  try {
    const encoded = auth.slice(6).trim();
    const decoded = atob(encoded);
    const colon = decoded.indexOf(':');
    if (colon < 0) return false;
    const user = decoded.slice(0, colon);
    const password = decoded.slice(colon + 1);
    return user === expectedUser && password === expectedPassword;
  } catch {
    return false;
  }
}

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

    // Some bots/CDNs send OPTIONS probes to arbitrary paths; React Router throws on
    // unmatched OPTIONS requests, so handle them at the edge first.
    if (request.method === 'OPTIONS') {
      const allowMethods =
        url.pathname === '/api/refresh' ? 'GET, HEAD, OPTIONS, POST' : 'GET, HEAD, OPTIONS';
      return new Response(null, {
        status: 204,
        headers: {
          Allow: allowMethods,
        },
      });
    }

    // Same class of noise: POST (etc.) to `/` with no root `action` throws in React Router
    // and would otherwise be reported to Sentry.
    const rootMethodNotAllowed = methodNotAllowedForRootResponse(request);
    if (rootMethodNotAllowed) return rootMethodNotAllowed;

    if (!hasValidStageBasicAuth(request, env)) {
      return unauthorizedStageResponse();
    }

    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.replace(/^www\./, '');
      return Response.redirect(url.toString(), 301);
    }

    // Legacy WordPress / fundraising URLs → owned Annual Fund landing page
    const legacyDonatePaths = new Set([
      '/donate',
      '/donate/',
      '/fundraising',
      '/fundraising/',
      '/fundraising/payments-and-donations',
      '/fundraising/payments-and-donations/',
    ]);
    if (legacyDonatePaths.has(url.pathname)) {
      url.pathname = '/annual-fund';
      url.search = '';
      return Response.redirect(url.toString(), 301);
    }

    // Soft-duplicate homepage from old WP query params
    if (url.pathname === '/' && url.searchParams.has('page_id')) {
      url.search = '';
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

    const loadContext = new RouterContextProvider();
    loadContext.set(cloudflareContext, {ctx, env});
    let response: Response;
    try {
      response = await requestHandler(request, loadContext);
    } catch (error) {
      if (!isMissingRouteActionError(error)) throw error;
      response = new Response(null, {
        headers: {Allow: 'GET, HEAD, OPTIONS'},
        status: 405,
      });
    }

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
    beforeSend(event, hint) {
      if (isMissingRouteActionError(hint.originalException) || shouldDropSentryEvent(event)) {
        return null;
      }
      return event;
    },
  };
}, handler);
