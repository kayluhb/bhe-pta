import {getCampaign} from '~/data/campaigns';
import {attachCheckoutId, insertPendingDonation} from '~/lib/donations/db';
import {createCheckoutSession, isPaymentsConfigured} from '~/lib/donations/provider';
import {verifyTurnstile} from '~/lib/donations/turnstile';
import {buildCheckoutSchema} from '~/lib/donations/validation';
import type {Route} from './+types/api.donations.checkout';

export async function action({request, context}: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  const env = context.cloudflare.env;
  if (!isPaymentsConfigured(env)) {
    return Response.json({error: 'Online donations are not configured yet'}, {status: 503});
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({error: 'Invalid JSON'}, {status: 400});
  }

  const raw = body as Record<string, unknown>;
  const campaignSlug = typeof raw.campaignSlug === 'string' ? raw.campaignSlug : '';
  const campaign = getCampaign(campaignSlug);
  if (!campaign) {
    return Response.json({error: 'Campaign not found'}, {status: 404});
  }

  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  const turnstileToken = raw.turnstileToken;
  if (!turnstileSecret || typeof turnstileToken !== 'string' || !turnstileToken) {
    return Response.json({error: 'Verification failed'}, {status: 403});
  }

  const clientIp = request.headers.get('CF-Connecting-IP');
  const verified = await verifyTurnstile(turnstileToken, turnstileSecret, clientIp);
  if (!verified) {
    return Response.json({error: 'Verification failed. Please try again.'}, {status: 403});
  }

  const schema = buildCheckoutSchema(campaign);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {details: parsed.error.flatten(), error: 'Validation failed'},
      {status: 400},
    );
  }

  const data = parsed.data;
  const provider = env.PAYMENT_PROVIDER?.trim() || 'stripe';
  const db = env.REIMBURSEMENT_DB;

  const donationId = await insertPendingDonation(db, {
    amountCents: data.amountCents,
    campaignSlug: campaign.slug,
    donorEmail: data.donorEmail,
    donorFields: data.donorFields,
    donorName: data.donorName,
    presetId: data.presetId,
    provider,
  });

  const origin = new URL(request.url).origin;
  const successUrl = `${origin}/give/${campaign.slug}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/give/${campaign.slug}`;

  try {
    const session = await createCheckoutSession(env, {
      amountCents: data.amountCents,
      campaignSlug: campaign.slug,
      campaignTitle: campaign.title,
      cancelUrl,
      donationId,
      donorEmail: data.donorEmail,
      donorName: data.donorName,
      presetId: data.presetId,
      successUrl,
    });

    await attachCheckoutId(db, donationId, session.checkoutId);

    return Response.json({url: session.url});
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return Response.json({error: message}, {status: 500});
  }
}
