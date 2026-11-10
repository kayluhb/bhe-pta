import type {TagTint} from '~/components/ui/TagPill';

export type EventFilterId = 'all' | 'community' | 'pta' | 'prospective';

export const EVENT_FILTERS: {id: EventFilterId; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'community', label: 'Community'},
  {id: 'pta', label: 'PTA meetings'},
  {id: 'prospective', label: 'Prospective families'},
];

/** Shared haystack matchers — keep tag chips and filter chips in sync. */
export const PROSPECTIVE_EVENT_PATTERN =
  /prospective|\btour\b|future\s*famil|campus\s*tour|open\s*house/i;
export const PTA_MEETING_PATTERN = /pta\s*meeting|cac\s*meeting|advisory\s+council/i;

/** Map a calendar category string onto a public filter chip. */
export function filterIdForCategory(category: string): Exclude<EventFilterId, 'all'> {
  if (PROSPECTIVE_EVENT_PATTERN.test(category)) return 'prospective';
  if (PTA_MEETING_PATTERN.test(category) || category.toLowerCase() === 'pta meeting') {
    return 'pta';
  }
  // Unknown and community-adjacent categories stay visible under Community / All
  return 'community';
}

export function tintForFilter(filter: Exclude<EventFilterId, 'all'>): TagTint {
  if (filter === 'prospective') return 'gold';
  if (filter === 'pta') return 'blue';
  return 'green';
}

export function eventMatchesFilter(
  event: {category: string; title?: string},
  filter: EventFilterId,
): boolean {
  if (filter === 'all') return true;
  const haystack = `${event.category} ${event.title ?? ''}`;
  const isProspective = PROSPECTIVE_EVENT_PATTERN.test(haystack);
  const isPtaMeeting = PTA_MEETING_PATTERN.test(haystack);
  if (filter === 'prospective') return isProspective;
  if (filter === 'pta') return isPtaMeeting;
  // Community chip: not prospective and not PTA meeting
  return !isProspective && !isPtaMeeting;
}

export function labelForCategory(category: string): string {
  const id = filterIdForCategory(category);
  if (id === 'prospective') return 'Prospective families';
  if (id === 'pta') return 'PTA meeting';
  return category || 'Community';
}
