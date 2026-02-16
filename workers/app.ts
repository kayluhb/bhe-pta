import { createRequestHandler } from "react-router";
import { scrapeSchoolNews } from "../app/lib/scraper";
import { fetchCalendarEvents } from "../app/lib/calendar";
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

export default {
  async fetch(request, env, ctx) {
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

    const results = await Promise.allSettled([
      scrapeSchoolNews(),
      fetchCalendarEvents(),
      env.MAILCHIMP_API_KEY && env.MAILCHIMP_API_KEY !== "placeholder"
        ? fetchMailchimpCampaigns(env.MAILCHIMP_API_KEY)
        : Promise.resolve([]),
    ]);

    const [newsletterResult, calendarResult, mailchimpResult] = results;

    if (
      newsletterResult.status === "fulfilled" &&
      newsletterResult.value.length > 0
    ) {
      await env.BHE_NEWSLETTERS.put(
        "latest",
        JSON.stringify(newsletterResult.value)
      );
      console.log(`Stored ${newsletterResult.value.length} school newsletters`);
    } else {
      console.error(
        "Failed to scrape newsletters:",
        newsletterResult.status === "rejected"
          ? newsletterResult.reason
          : "No results"
      );
    }

    if (
      calendarResult.status === "fulfilled" &&
      calendarResult.value.length > 0
    ) {
      await env.BHE_CALENDAR.put(
        "events",
        JSON.stringify(calendarResult.value)
      );
      console.log(`Stored ${calendarResult.value.length} calendar events`);
    } else {
      console.error(
        "Failed to fetch calendar:",
        calendarResult.status === "rejected"
          ? calendarResult.reason
          : "No results"
      );
    }

    if (
      mailchimpResult.status === "fulfilled" &&
      mailchimpResult.value.length > 0
    ) {
      await env.BHE_PTA_NEWSLETTERS.put(
        "latest",
        JSON.stringify(mailchimpResult.value)
      );
      console.log(
        `Stored ${mailchimpResult.value.length} PTA newsletters from Mailchimp`
      );
    } else if (mailchimpResult.status === "rejected") {
      console.error(
        "Failed to fetch Mailchimp campaigns:",
        mailchimpResult.reason
      );
    }
  },
} satisfies ExportedHandler<Env>;
