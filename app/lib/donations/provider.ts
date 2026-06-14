import {
  createStripeCheckoutSession,
  extractCompletedPayment,
  extractRefundedPayment,
  getStripeSecretKey,
  parseStripeWebhookEvent,
  verifyStripeWebhookSignature,
} from './stripe';
import type {
  CheckoutSessionParams,
  CheckoutSessionResult,
  CompletedPayment,
  PaymentEnv,
  RefundedPayment,
} from './types';

export function isPaymentsConfigured(env: PaymentEnv): boolean {
  const provider = env.PAYMENT_PROVIDER?.trim() || 'stripe';
  if (provider === 'stripe') return Boolean(getStripeSecretKey(env));
  return false;
}

export async function createCheckoutSession(
  env: PaymentEnv,
  params: CheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  const provider = env.PAYMENT_PROVIDER?.trim() || 'stripe';
  if (provider === 'stripe') {
    return createStripeCheckoutSession(env, params);
  }
  throw new Error(`Unsupported payment provider: ${provider}`);
}

export async function verifyWebhook(
  env: PaymentEnv,
  payload: string,
  headers: Headers,
): Promise<boolean> {
  const provider = env.PAYMENT_PROVIDER?.trim() || 'stripe';
  if (provider === 'stripe') {
    const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
    const signature = headers.get('Stripe-Signature');
    if (!secret || !signature) return false;
    return verifyStripeWebhookSignature(payload, signature, secret);
  }
  return false;
}

export function parseWebhookPayload(
  env: PaymentEnv,
  payload: string,
): {
  completed: CompletedPayment | null;
  eventId: string;
  provider: string;
  refunded: RefundedPayment | null;
} {
  const provider = env.PAYMENT_PROVIDER?.trim() || 'stripe';
  if (provider === 'stripe') {
    const event = parseStripeWebhookEvent(payload);
    return {
      completed: extractCompletedPayment(event),
      eventId: event.id,
      provider: 'stripe',
      refunded: extractRefundedPayment(event),
    };
  }
  throw new Error(`Unsupported payment provider: ${provider}`);
}
