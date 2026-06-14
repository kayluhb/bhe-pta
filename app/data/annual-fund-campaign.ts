export interface FundraisingMilestone {
  amount: number;
  description: string;
  id: string;
  label: string;
}

export interface AnnualFundCampaign {
  giveUrl: string;
  goalAmount: number;
  lastUpdated: string;
  milestones: FundraisingMilestone[];
  raisedAmount: number;
  schoolYear: string;
  title: string;
}

export const annualFundGiveUrl = 'https://bhe-pta-annual-fund-drive-2026-2027.cheddarup.com';
export const corporateContributionsUrl =
  'https://bhe-corporate-contributions-2026-2027.cheddarup.com';

/** Update raisedAmount and lastUpdated here, then deploy to publish progress. */
export const annualFundCampaign: AnnualFundCampaign = {
  schoolYear: '2026-27',
  title: '2026-2027 Annual Fund Milestones',
  giveUrl: annualFundGiveUrl,
  goalAmount: 187_000,
  raisedAmount: 0,
  lastUpdated: '2026-06-14',
  milestones: [
    {
      id: 'art-music-pe',
      label: 'Fund Art, Music & PE',
      description: 'Cost to fund the final third of each Music, Art & PE role',
      amount: 85_000,
    },
    {
      id: 'annual-programming',
      label: 'Our Usual Programming for Students, Teachers & Staff',
      description: 'The rest of our Annual Fund goal — grants, enrichment, hospitality, and more',
      amount: 187_000,
    },
  ],
};
