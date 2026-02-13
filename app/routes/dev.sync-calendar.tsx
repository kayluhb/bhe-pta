import { redirect } from "react-router";
import type { Route } from "./+types/dev.sync-calendar";
import { fetchCalendarEvents } from "~/lib/calendar";

/**
 * Dev-only: fetch school calendar ICS and write to KV, then redirect to /events.
 * Use once locally to populate events for testing. Disabled in production.
 */
export async function loader({ context }: Route.LoaderArgs) {
  if (!import.meta.env.DEV) {
    return new Response("Not found", { status: 404 });
  }

  const events = await fetchCalendarEvents();
  await context.cloudflare.env.BHE_CALENDAR.put(
    "events",
    JSON.stringify(events)
  );

  throw redirect("/events");
}

export default function DevSyncCalendar() {
  return null;
}
