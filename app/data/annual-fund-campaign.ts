export interface FundraisingMilestone {
  amount: number;
  description: string;
  id: string;
  label: string;
  targetDate: string;
}

export interface AnnualFundCampaign {
  giveUrl: string;
  goalAmount: number;
  lastUpdated: string;
  milestones: FundraisingMilestone[];
  raisedAmount: number;
  schoolYear: string;
  /** Suggested household gift per student for the Annual Fund. */
  suggestedAskPerChild: number;
  title: string;
}

export const annualFundGiveUrl = 'https://bhe-pta-annual-fund-drive-2026-2027.cheddarup.com';
export const corporateContributionsUrl =
  'https://bhe-corporate-contributions-2026-2027.cheddarup.com';

/** Owned SEO/conversion landing page (payment still happens on CheddarUp). */
export const annualFundPath = '/annual-fund';

/** CheddarUp give URL with campaign UTMs for click attribution. */
export function annualFundGiveUrlWithUtm(content = 'give-cta'): string {
  const url = new URL(annualFundGiveUrl);
  url.searchParams.set('utm_source', 'bheeagles');
  url.searchParams.set('utm_medium', 'website');
  url.searchParams.set('utm_campaign', 'annual-fund-2026-27');
  url.searchParams.set('utm_content', content);
  return url.toString();
}

/**
 * Amounts shipped in code. Admin can publish a newer campaign without a deploy;
 * these values are the fallback until that first save.
 */
export const annualFundCodeDefaults = {
  goalAmount: 272_000,
  lastUpdated: '2026-10-16',
  milestones: [
    {
      id: 'art-music-pe',
      label: "Fund Art, Music & PE for '26-'27",
      description: 'Cost to fund the final third of each Music, Art & PE role',
      amount: 85_000,
      targetDate: '2026-06-25',
    },
    {
      id: 'annual-programming',
      label: 'Our Usual Programming for Students, Teachers & Staff',
      description: 'Grants, enrichment, hospitality, and more',
      amount: 187_000,
      targetDate: '2026-11-01',
    },
    {
      id: 'art-music-pe-2728',
      label: "Fund Art, Music & PE for '27-'28",
      description:
        'Cost to fund the final third of each Music, Art & PE role next year, in the bank before summer break',
      amount: 272_000,
      targetDate: '2027-05-01',
    },
  ] satisfies FundraisingMilestone[],
  /** Offline donations that have been deposited and cleared. */
  offlineRaisedAmount: 59_000,
  /** Cheddar Up (or other online) total. Keep cents when the export has them. */
  onlineRaisedAmount: 215_350.88,
  schoolYear: '2026-27',
  suggestedAskPerChild: 650,
  title: '2026-2027 Annual Fund Milestones',
};

export const annualFundCampaign: AnnualFundCampaign = {
  giveUrl: annualFundGiveUrl,
  goalAmount: annualFundCodeDefaults.goalAmount,
  lastUpdated: annualFundCodeDefaults.lastUpdated,
  milestones: annualFundCodeDefaults.milestones,
  raisedAmount:
    annualFundCodeDefaults.onlineRaisedAmount + annualFundCodeDefaults.offlineRaisedAmount,
  schoolYear: annualFundCodeDefaults.schoolYear,
  suggestedAskPerChild: annualFundCodeDefaults.suggestedAskPerChild,
  title: annualFundCodeDefaults.title,
};
