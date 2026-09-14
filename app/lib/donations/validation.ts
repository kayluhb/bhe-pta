import {z} from 'zod';

import type {CampaignConfig} from '~/data/campaigns/types';

const donorNameSchema = z.string().trim().min(1, 'Name is required').max(100);
const donorEmailSchema = z.string().trim().email('Valid email is required').max(200);

function addCustomIssue(ctx: z.RefinementCtx, message: string, path: string) {
  ctx.addIssue({
    code: 'custom',
    message,
    path: [path],
  });
}

function findPreset(campaign: CampaignConfig, presetId: string) {
  return campaign.presetAmounts.find((preset) => preset.id === presetId);
}

export function buildCheckoutSchema(campaign: CampaignConfig) {
  const donorFieldsShape: Record<string, z.ZodType<string>> = {};
  for (const field of campaign.donorFields) {
    const max = field.maxLength ?? 200;
    donorFieldsShape[field.id] = field.required
      ? z.string().trim().min(1, `${field.label} is required`).max(max)
      : z.string().trim().max(max).default('');
  }

  return z
    .object({
      amountCents: z.number().int().positive(),
      campaignSlug: z.literal(campaign.slug),
      donorEmail: donorEmailSchema,
      donorFields: z.object(donorFieldsShape),
      donorName: donorNameSchema,
      presetId: z.string().nullable(),
      turnstileToken: z.string().min(1),
    })
    .superRefine((data, ctx) => {
      if (data.amountCents < campaign.minAmountCents) {
        addCustomIssue(
          ctx,
          `Minimum contribution is $${(campaign.minAmountCents / 100).toFixed(0)}`,
          'amountCents',
        );
      }
      if (data.amountCents > campaign.maxAmountCents) {
        addCustomIssue(ctx, 'Amount exceeds maximum allowed', 'amountCents');
      }
      if (!data.presetId) {
        if (!campaign.allowCustomAmount) {
          addCustomIssue(ctx, 'Custom amounts are not allowed for this campaign', 'amountCents');
        }
        return;
      }
      const preset = findPreset(campaign, data.presetId);
      if (!preset) {
        addCustomIssue(ctx, 'Invalid preset amount', 'presetId');
        return;
      }
      if (preset.amountCents !== data.amountCents) {
        addCustomIssue(ctx, 'Amount does not match selected preset', 'amountCents');
      }
    });
}

export type CheckoutInput = z.infer<ReturnType<typeof buildCheckoutSchema>>;

export function resolveAmountCents(
  campaign: CampaignConfig,
  presetId: string | null,
  customAmountCents: number | null,
): number | null {
  if (presetId) {
    const preset = findPreset(campaign, presetId);
    return preset?.amountCents ?? null;
  }
  if (campaign.allowCustomAmount && customAmountCents != null) {
    return customAmountCents;
  }
  return null;
}
