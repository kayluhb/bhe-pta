import {getCampaign} from '~/data/campaigns';
import {
  isWebhookEventProcessed,
  markDonationCompleted,
  markDonationRefunded,
  recordWebhookEvent,
} from '~/lib/donations/db';
import {parseWebhookPayload, verifyWebhook} from '~/lib/donations/provider';
import {sendDonationReceiptEmail} from '~/lib/donations/receipt-email';
import type {Route} from './+types/api.webhooks.payments';

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {status: 405});
  }

  const env = context.cloudflare.env;
  const payload = await request.text();

  const valid = await verifyWebhook(env, payload, request.headers);
  if (!valid) {
    return new Response('Invalid signature', {status: 400});
  }

  let parsed: ReturnType<typeof parseWebhookPayload>;
  try {
    parsed = parseWebhookPayload(env, payload);
  } catch {
    return new Response('Unsupported provider', {status: 400});
  }

  const db = env.REIMBURSEMENT_DB;

  if (await isWebhookEventProcessed(db, parsed.eventId)) {
    return new Response('OK', {status: 200});
  }

  const recorded = await recordWebhookEvent(db, parsed.eventId, parsed.provider);
  if (!recorded) {
    return new Response('OK', {status: 200});
  }

  if (parsed.completed) {
    const donor = await markDonationCompleted(
      db,
      parsed.completed.donationId,
      parsed.completed.paymentId,
      parsed.completed.amountCents,
    );

    if (donor && env.RESEND_API_KEY && env.NOTIFICATION_EMAIL) {
      const campaign = getCampaign(donor.campaignSlug);
      try {
        await sendDonationReceiptEmail({
          amountCents: parsed.completed.amountCents,
          campaignTitle: campaign?.title ?? donor.campaignSlug,
          completedAt: new Date().toISOString(),
          donorEmail: donor.donorEmail,
          donorName: donor.donorName,
          notificationEmail: env.NOTIFICATION_EMAIL,
          resendApiKey: env.RESEND_API_KEY,
        });
      } catch (err) {
        console.error('Donation receipt email failed:', err);
      }
    }
  }

  if (parsed.refunded) {
    await markDonationRefunded(db, parsed.refunded.donationId);
  }

  return new Response('OK', {status: 200});
}
