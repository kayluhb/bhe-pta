import {describe, expect, it} from 'vitest';

import {eventPrimaryCta} from '~/lib/event-cta';

describe('eventPrimaryCta', () => {
  it('uses mailto RSVP for prospective events', () => {
    expect(
      eventPrimaryCta({
        category: 'Community Event',
        title: 'Prospective Parent Tour',
      }),
    ).toEqual({
      href: 'mailto:pta@bheeagles.com?subject=RSVP%3A%20Prospective%20Parent%20Tour',
      label: 'RSVP',
    });
  });

  it('omits a button when there is no safe link', () => {
    expect(
      eventPrimaryCta({
        category: 'Community Event',
        title: 'Carnival',
      }),
    ).toBeNull();
  });

  it('uses the first description link for ticket and detail CTAs', () => {
    expect(
      eventPrimaryCta({
        category: 'Other',
        description:
          'Purchase your BHE Thanksgiving lunch tickets <a href="https://example.com/lunch" rel="noopener noreferrer" target="_blank">here</a>',
        title: 'BHE Community Thanksgiving Dinner',
      }),
    ).toEqual({
      href: 'https://example.com/lunch',
      label: 'Get tickets',
    });

    expect(
      eventPrimaryCta({
        category: 'Community Event',
        description: 'Details at https://example.com/info',
        title: 'Coffee Talk',
      }),
    ).toEqual({
      href: 'https://example.com/info',
      label: 'Details',
    });
  });
});
