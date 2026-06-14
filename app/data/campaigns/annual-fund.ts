import type {CampaignConfig} from './types';

export const annualFundCampaign: CampaignConfig = {
  slug: 'annual-fund-2025-26',
  title: 'BHE Annual Fund',
  schoolYear: '2025-26',
  goalAmount: 85_000,
  manualAdjustmentCents: 0,
  minAmountCents: 100,
  maxAmountCents: 50_000_00,
  allowCustomAmount: true,
  presetAmounts: [
    {id: 'per-child', label: '$200 per child', amountCents: 20_000},
    {id: 'two-children', label: '$400 (two children)', amountCents: 40_000},
    {id: 'family', label: '$600 family contribution', amountCents: 60_000},
  ],
  donorFields: [
    {
      id: 'studentNames',
      label: 'Student name(s)',
      type: 'text',
      required: false,
      maxLength: 200,
    },
    {
      id: 'teacher',
      label: 'Teacher',
      type: 'text',
      required: false,
      maxLength: 100,
    },
  ],
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
