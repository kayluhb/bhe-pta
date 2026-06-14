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

/** Update raisedAmount and lastUpdated here, then deploy to publish progress. */
export const annualFundCampaign: AnnualFundCampaign = {
  schoolYear: '2025-26',
  title: 'BHE Annual Fund',
  giveUrl: 'https://my.cheddarup.com/c/bhe-pta-annual-fund-drive-2025-26',
  goalAmount: 85_000,
  raisedAmount: 0,
  lastUpdated: '2026-06-12',
  milestones: [
    {
      id: 'special-teachers',
      label: 'Fund Special Area Teachers',
      description: 'Art, music, PE, and library support',
      amount: 20_000,
    },
    {
      id: 'core-programs',
      label: 'Core Student Programs',
      description: 'Technology, cultural arts, SEL, and enrichment',
      amount: 50_000,
    },
    {
      id: 'full-goal',
      label: 'Full Annual Fund Goal',
      description: 'Complete funding for the school year',
      amount: 85_000,
    },
  ],
};
