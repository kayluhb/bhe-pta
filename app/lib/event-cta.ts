import {eventMatchesFilter} from '~/lib/event-categories';

export type EventCta = {
  href: string;
  label: string;
};

/**
 * Primary CTA for an events-list row.
 * Calendar events have no URL field, so we never invent a destination like /contact.
 * Prospective-family events get a mailto RSVP; others show no button.
 */
export function eventPrimaryCta(event: {category: string; title: string}): EventCta | null {
  if (eventMatchesFilter(event, 'prospective')) {
    return {
      href: `mailto:pta@bheeagles.com?subject=${encodeURIComponent(`RSVP: ${event.title}`)}`,
      label: 'RSVP',
    };
  }
  return null;
}
