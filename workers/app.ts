import { createRequestHandler } from "react-router";
import { scrapeSchoolNews } from "../app/lib/scraper";
import { fetchCalendarEvents, fetchPtaCalendarEvents } from "../app/lib/calendar";
import { fetchMailchimpCampaigns } from "../app/lib/mailchimp";

interface Env {
  BHE_NEWSLETTERS: KVNamespace;
  BHE_PTA_NEWSLETTERS: KVNamespace;
  BHE_CALENDAR: KVNamespace;
  MAILCHIMP_API_KEY: string;
  REIMBURSEMENT_DB: D1Database;
  R2_BUCKET: R2Bucket;
  RESEND_API_KEY: string;
  NOTIFICATION_EMAIL: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  TURNSTILE_SECRET_KEY: string;
  AI: Ai;
  GEMINI_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_SECRET: string;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

async function runDataRefresh(env: Env): Promise<string[]> {
  const log: string[] = [];

  const results = await Promise.allSettled([
    scrapeSchoolNews(),
    fetchCalendarEvents(),
    fetchPtaCalendarEvents(),
    env.MAILCHIMP_API_KEY && env.MAILCHIMP_API_KEY !== "placeholder"
      ? fetchMailchimpCampaigns(env.MAILCHIMP_API_KEY)
      : Promise.resolve([]),
  ]);

  const [newsletterResult, calendarResult, ptaCalendarResult, mailchimpResult] = results;

  if (
    newsletterResult.status === "fulfilled" &&
    newsletterResult.value.length > 0
  ) {
    await env.BHE_NEWSLETTERS.put(
      "latest",
      JSON.stringify(newsletterResult.value)
    );
    log.push(`Stored ${newsletterResult.value.length} school newsletters`);
  } else {
    const msg =
      "Failed to scrape newsletters: " +
      (newsletterResult.status === "rejected"
        ? newsletterResult.reason
        : "No results");
    console.error(msg);
    log.push(msg);
  }

  // Merge school + PTA calendar events
  const schoolEvents =
    calendarResult.status === "fulfilled" ? calendarResult.value : [];
  const ptaEvents =
    ptaCalendarResult.status === "fulfilled" ? ptaCalendarResult.value : [];
  const allCalendarEvents = [...schoolEvents, ...ptaEvents];

  if (allCalendarEvents.length > 0) {
    await env.BHE_CALENDAR.put(
      "events",
      JSON.stringify(allCalendarEvents)
    );
    log.push(
      `Stored ${schoolEvents.length} school + ${ptaEvents.length} PTA calendar events`
    );
  } else {
    const msg =
      "Failed to fetch calendars: " +
      (calendarResult.status === "rejected"
        ? calendarResult.reason
        : "No results");
    console.error(msg);
    log.push(msg);
  }

  if (ptaCalendarResult.status === "rejected") {
    const msg = "Failed to fetch PTA calendar: " + ptaCalendarResult.reason;
    console.error(msg);
    log.push(msg);
  }

  if (
    mailchimpResult.status === "fulfilled" &&
    mailchimpResult.value.length > 0
  ) {
    await env.BHE_PTA_NEWSLETTERS.put(
      "latest",
      JSON.stringify(mailchimpResult.value)
    );
    log.push(
      `Stored ${mailchimpResult.value.length} PTA newsletters from Mailchimp`
    );
  } else if (mailchimpResult.status === "rejected") {
    const msg = "Failed to fetch Mailchimp campaigns: " + mailchimpResult.reason;
    console.error(msg);
    log.push(msg);
  }

  return log;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.replace(/^www\./, "");
      return Response.redirect(url.toString(), 301);
    }

    // Manual refresh endpoint — requires SESSION_SECRET as bearer token
    if (url.pathname === "/api/refresh" && request.method === "POST") {
      const auth = request.headers.get("Authorization");
      if (auth !== `Bearer ${env.SESSION_SECRET}`) {
        return new Response("Unauthorized", { status: 401 });
      }
      const log = await runDataRefresh(env);
      return Response.json({ ok: true, log });
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    console.log(`Cron triggered: ${controller.cron}`);
    const log = await runDataRefresh(env);
    log.forEach((msg) => console.log(msg));
  },
} satisfies ExportedHandler<Env>;
