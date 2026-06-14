import {annualFundCampaign} from './annual-fund';
import {corporateCampaign} from './corporate';
import type {CampaignConfig} from './types';

const campaigns: CampaignConfig[] = [annualFundCampaign, corporateCampaign];

const bySlug = new Map(campaigns.map((c) => [c.slug, c]));

export function getCampaign(slug: string): CampaignConfig | undefined {
  return bySlug.get(slug);
}

export function listActiveCampaigns(): CampaignConfig[] {
  return campaigns;
}

export type {CampaignConfig, CampaignProgress, DonorField, PresetAmount} from './types';
export {buildCampaignProgress, campaignGivePath} from './types';
export {annualFundCampaign, corporateCampaign};
