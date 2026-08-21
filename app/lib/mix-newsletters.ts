import {toIsoDay} from './format-newsletter-date';
import type {Newsletter} from './types';

function sortByDateDesc(items: Newsletter[]): Newsletter[] {
  return [...items].sort((a, b) => {
    const aDay = toIsoDay(a.date) ?? a.date;
    const bDay = toIsoDay(b.date) ?? b.date;
    return bDay.localeCompare(aDay);
  });
}

/** Merge school and PTA newsletters into one newest-first feed. */
export function mergeNewslettersByDate(
  schoolNews: Newsletter[],
  ptaNews: Newsletter[],
): Newsletter[] {
  return sortByDateDesc([...schoolNews, ...ptaNews]);
}

/**
 * Interleave school (principal) and PTA newsletters so the homepage shows both,
 * instead of whichever source happens to have the three newest dates.
 */
export function mixNewsletters(
  schoolNews: Newsletter[],
  ptaNews: Newsletter[],
  limit = 3,
): Newsletter[] {
  const school = sortByDateDesc(schoolNews);
  const pta = sortByDateDesc(ptaNews);
  const queues = [school, pta] as const;
  const indices = [0, 0];

  const schoolTop = school[0] ? (toIsoDay(school[0].date) ?? school[0].date) : '';
  const ptaTop = pta[0] ? (toIsoDay(pta[0].date) ?? pta[0].date) : '';
  const primary = schoolTop >= ptaTop ? 0 : 1;
  const secondary = 1 - primary;

  const result: Newsletter[] = [];
  while (result.length < limit) {
    const order = result.length % 2 === 0 ? [primary, secondary] : [secondary, primary];
    let added = false;
    for (const queueIndex of order) {
      if (indices[queueIndex] < queues[queueIndex].length) {
        result.push(queues[queueIndex][indices[queueIndex]++]!);
        added = true;
        break;
      }
    }
    if (!added) break;
  }
  return result;
}
