import {redirect} from 'react-router';
import {fetchCalendarEvents, fetchPtaCalendarEvents} from '~/lib/calendar';
import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/dev.sync-calendar';

/**
 * Dev-only: fetch school + PTA calendar ICS and write to KV, then redirect to /events.
 * Use once locally to populate events for testing. Disabled in production.
 */
export async function loader({context}: Route.LoaderArgs) {
  if (!import.meta.env.DEV) {
    return new Response('Not found', {status: 404});
  }

  const [schoolEvents, ptaEvents] = await Promise.all([
    fetchCalendarEvents(),
    fetchPtaCalendarEvents(),
  ]);
  await getCloudflare(context).env.BHE_CALENDAR.put(
    'events',
    JSON.stringify([...schoolEvents, ...ptaEvents]),
  );

  throw redirect('/events');
}

export default function DevSyncCalendar() {
  return null;
}
