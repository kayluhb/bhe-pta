import type {
  CheckoutSessionParams,
  CheckoutSessionResult,
  CompletedPayment,
  PaymentEnv,
  RefundedPayment,
} from './types';

const STRIPE_API = 'https://api.stripe.com/v1';

function encodeParams(params: Record<string, string | number | undefined>): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      body.append(key, String(value));
    }
  }
  return body.toString();
}

export function getStripeSecretKey(env: PaymentEnv): string | null {
  const key = env.STRIPE_SECRET_KEY?.trim();
  return key || null;
}

export async function createStripeCheckoutSession(
  env: PaymentEnv,
  params: CheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  const secretKey = getStripeSecretKey(env);
  if (!secretKey) {
    throw new Error('Stripe is not configured');
  }

  const body = encodeParams({
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': params.campaignTitle,
    'line_items[0][price_data][unit_amount]': params.amountCents,
    'line_items[0][quantity]': 1,
    client_reference_id: params.donationId,
    customer_email: params.donorEmail,
    mode: 'payment',
    submit_type: 'donate',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    'metadata[campaign_slug]': params.campaignSlug,
    'metadata[donation_id]': params.donationId,
    'metadata[donor_name]': params.donorName,
    'metadata[preset_id]': params.presetId ?? '',
    'payment_intent_data[metadata][campaign_slug]': params.campaignSlug,
    'payment_intent_data[metadata][donation_id]': params.donationId,
  });

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    body,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stripe checkout failed: ${err}`);
  }

  const data = (await res.json()) as {id: string; url: string};
  return {checkoutId: data.id, url: data.url};
}

export async function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = signatureHeader.split(',').map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {hash: 'SHA-256', name: 'HMAC'},
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signatures.some((sig) => timingSafeEqual(sig, expected));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

interface StripeEvent {
  data: {object: Record<string, unknown>};
  id: string;
  type: string;
}

export function parseStripeWebhookEvent(payload: string): StripeEvent {
  return JSON.parse(payload) as StripeEvent;
}

export function extractCompletedPayment(event: StripeEvent): CompletedPayment | null {
  if (event.type !== 'checkout.session.completed') return null;
  const session = event.data.object;
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const donationId = String(session.client_reference_id ?? metadata.donation_id ?? '');
  const paymentId = String(session.payment_intent ?? '');
  const amountCents = Number(session.amount_total ?? 0);
  if (!donationId || !paymentId || amountCents <= 0) return null;
  return {amountCents, donationId, paymentId};
}

export function extractRefundedPayment(event: StripeEvent): RefundedPayment | null {
  if (event.type !== 'charge.refunded') return null;
  const charge = event.data.object;
  const paymentId = String(charge.payment_intent ?? '');
  const metadata = (charge.metadata ?? {}) as Record<string, string>;
  const donationId = metadata.donation_id ?? '';
  if (!donationId || !paymentId) return null;
  return {donationId, paymentId};
}
