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
  title: string;
}

export const annualFundGiveUrl = 'https://bhe-pta-annual-fund-drive-2026-2027.cheddarup.com';
export const corporateContributionsUrl =
  'https://bhe-corporate-contributions-2026-2027.cheddarup.com';

/** Update these amounts and lastUpdated, then deploy to publish progress. */
const onlineRaisedAmount = 118_997.99;
/** Offline donations that have been deposited and cleared. */
const offlineRaisedAmount = 50_000;

export const annualFundCampaign: AnnualFundCampaign = {
  schoolYear: '2026-27',
  title: '2026-2027 Annual Fund Milestones',
  giveUrl: annualFundGiveUrl,
  goalAmount: 272_000,
  raisedAmount: onlineRaisedAmount + offlineRaisedAmount,
  lastUpdated: '2026-08-21',
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
  ],
};
