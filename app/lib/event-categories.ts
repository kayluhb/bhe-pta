import type {TagTint} from '~/components/ui/TagPill';

export type EventFilterId = 'all' | 'community' | 'pta' | 'prospective';

export const EVENT_FILTERS: {id: EventFilterId; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'community', label: 'Community'},
  {id: 'pta', label: 'PTA meetings'},
  {id: 'prospective', label: 'Prospective families'},
];

/** Map a calendar category string onto a public filter chip. */
export function filterIdForCategory(category: string): Exclude<EventFilterId, 'all'> {
  const c = category.toLowerCase();
  if (/prospective|tour|future famil/.test(c)) return 'prospective';
  if (/pta\s*meeting|cac meeting|advisory/.test(c) || c === 'pta meeting') return 'pta';
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
  const haystack = `${event.category} ${event.title ?? ''}`.toLowerCase();
  if (filter === 'prospective') {
    return /prospective|tour|future famil|campus tour/.test(haystack);
  }
  if (filter === 'pta') {
    return /pta\s*meeting|cac meeting|advisory council/.test(haystack);
  }
  // Community chip: not prospective and not PTA meeting
  return (
    !/prospective|tour|future famil|campus tour/.test(haystack) &&
    !/pta\s*meeting|cac meeting|advisory council/.test(haystack)
  );
}

export function labelForCategory(category: string): string {
  const id = filterIdForCategory(category);
  if (id === 'prospective') return 'Prospective families';
  if (id === 'pta') return 'PTA meeting';
  return category || 'Community';
}
