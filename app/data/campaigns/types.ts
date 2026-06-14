export interface FundraisingMilestone {
  amount: number;
  description: string;
  id: string;
  label: string;
}

export interface PresetAmount {
  amountCents: number;
  id: string;
  label: string;
}

export interface DonorField {
  id: string;
  label: string;
  maxLength?: number;
  required: boolean;
  type: 'text' | 'email';
}

export interface CampaignConfig {
  allowCustomAmount: boolean;
  donorFields: DonorField[];
  goalAmount: number;
  manualAdjustmentCents: number;
  maxAmountCents: number;
  milestones: FundraisingMilestone[];
  minAmountCents: number;
  presetAmounts: PresetAmount[];
  schoolYear: string;
  slug: string;
  title: string;
}

/** Campaign config merged with live raised totals for progress UI. Amounts in whole dollars. */
export interface CampaignProgress extends CampaignConfig {
  lastUpdated: string;
  raisedAmount: number;
}

export function campaignGivePath(slug: string): string {
  return `/give/${slug}`;
}

export function buildCampaignProgress(
  config: CampaignConfig,
  opts: {lastUpdated: string; raisedCents: number},
): CampaignProgress {
  const raisedAmount = (opts.raisedCents + config.manualAdjustmentCents) / 100;
  return {
    ...config,
    lastUpdated: opts.lastUpdated,
    raisedAmount,
  };
}
