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
  title: 'BHE Annual Fund',
  giveUrl: annualFundGiveUrl,
  goalAmount: 252_340,
  raisedAmount: 0,
  lastUpdated: '2026-06-14',
  milestones: [
    {
      id: 'music-art-pe-staffing',
      label: 'Fund Music, Art & PE Staffing',
      description: 'Cost to fund the final third of each Music, Art & PE role',
      amount: 85_000,
    },
    {
      id: 'teachers-and-staff',
      label: 'Support Teachers & Staff',
      description:
        'Teacher grants, classroom materials, hospitality, and staff appreciation',
      amount: 150_650,
    },
    {
      id: 'student-programs',
      label: 'Student Programs & Enrichment',
      description:
        'Academic enrichment, cultural arts, library, yearbooks, student merch, PE programs, and scholarships',
      amount: 202_900,
    },
    {
      id: 'full-budget-goal',
      label: 'Full PTA Budget Goal',
      description:
        'Complete funding for all PTA programs, school improvements, fundraisers, and operations',
      amount: 252_340,
    },
  ],
};
