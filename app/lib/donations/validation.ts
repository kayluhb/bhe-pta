import {z} from 'zod';

import type {CampaignConfig} from '~/data/campaigns/types';

const donorNameSchema = z.string().trim().min(1, 'Name is required').max(100);
const donorEmailSchema = z.string().trim().email('Valid email is required').max(200);

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
        ctx.addIssue({
          code: 'custom',
          message: `Minimum contribution is $${(campaign.minAmountCents / 100).toFixed(0)}`,
          path: ['amountCents'],
        });
      }
      if (data.amountCents > campaign.maxAmountCents) {
        ctx.addIssue({
          code: 'custom',
          message: 'Amount exceeds maximum allowed',
          path: ['amountCents'],
        });
      }
      if (data.presetId) {
        const preset = campaign.presetAmounts.find((p) => p.id === data.presetId);
        if (!preset) {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid preset amount',
            path: ['presetId'],
          });
        } else if (preset.amountCents !== data.amountCents) {
          ctx.addIssue({
            code: 'custom',
            message: 'Amount does not match selected preset',
            path: ['amountCents'],
          });
        }
      } else if (!campaign.allowCustomAmount) {
        ctx.addIssue({
          code: 'custom',
          message: 'Custom amounts are not allowed for this campaign',
          path: ['amountCents'],
        });
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
    const preset = campaign.presetAmounts.find((p) => p.id === presetId);
    return preset?.amountCents ?? null;
  }
  if (campaign.allowCustomAmount && customAmountCents != null) {
    return customAmountCents;
  }
  return null;
}
