import type {CampaignConfig} from './types';

export const corporateCampaign: CampaignConfig = {
  slug: 'corporate-sponsors-2025-26',
  title: 'BHE Local Business Sponsorships',
  schoolYear: '2025-26',
  goalAmount: 0,
  manualAdjustmentCents: 0,
  minAmountCents: 20_000,
  maxAmountCents: 100_000_00,
  allowCustomAmount: true,
  presetAmounts: [
    {id: 'eagle-fan', label: 'Eagle Fan — $200', amountCents: 20_000},
    {id: 'eagle-friend', label: 'Eagle Friend — $500', amountCents: 50_000},
    {id: 'eagle-love', label: 'Eagle Love — $1,000', amountCents: 100_000},
    {id: 'eagle-support', label: 'Eagle Support — $2,500', amountCents: 250_000},
    {id: 'eagle-pride', label: 'Eagle Pride — $5,000', amountCents: 500_000},
  ],
  donorFields: [
    {
      id: 'businessName',
      label: 'Business name',
      type: 'text',
      required: true,
      maxLength: 200,
    },
    {
      id: 'contactName',
      label: 'Contact name',
      type: 'text',
      required: true,
      maxLength: 100,
    },
  ],
  milestones: [],
};
