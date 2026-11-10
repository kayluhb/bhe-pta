import {describe, expect, it} from 'vitest';

import {eventPrimaryCta} from '~/lib/event-cta';

describe('eventPrimaryCta', () => {
  it('uses mailto RSVP for prospective events and omits a fake Details link otherwise', () => {
    expect(
      eventPrimaryCta({
        category: 'Community Event',
        title: 'Prospective Parent Tour',
      }),
    ).toEqual({
      href: 'mailto:pta@bheeagles.com?subject=RSVP%3A%20Prospective%20Parent%20Tour',
      label: 'RSVP',
    });

    expect(
      eventPrimaryCta({
        category: 'Community Event',
        title: 'Carnival',
      }),
    ).toBeNull();
  });
});
