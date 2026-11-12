import {eventMatchesFilter} from '~/lib/event-categories';

export type EventCta = {
  href: string;
  label: string;
};

function firstHttpHref(description?: string): string | undefined {
  if (!description) return undefined;
  const hrefAttr = description.match(/\bhref="(https?:[^"]+)"/i)?.[1];
  if (hrefAttr) return hrefAttr;
  const bare = description.match(/\bhttps?:\/\/[^\s<)"]+/i)?.[0];
  return bare?.replace(/[.,;:)]+$/, '');
}

function ctaLabel(event: {description?: string; title: string}): string {
  const haystack = `${event.title} ${event.description ?? ''}`;
  if (/ticket|purchase|buy|order|lunch/i.test(haystack)) return 'Get tickets';
  if (/rsvp|register|sign\s*up/i.test(haystack)) return 'Sign up';
  return 'Details';
}

/**
 * Primary CTA for an events-list row.
 * Prospective-family events get a mailto RSVP.
 * Other events use the first safe http(s) link from the sanitized description when present.
 */
export function eventPrimaryCta(event: {
  category: string;
  description?: string;
  title: string;
}): EventCta | null {
  if (eventMatchesFilter(event, 'prospective')) {
    return {
      href: `mailto:pta@bheeagles.com?subject=${encodeURIComponent(`RSVP: ${event.title}`)}`,
      label: 'RSVP',
    };
  }

  const href = firstHttpHref(event.description);
  if (!href) return null;
  return {href, label: ctaLabel(event)};
}
