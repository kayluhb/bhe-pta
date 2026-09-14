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

const PAYMENT_PROVIDER_STRIPE = 'stripe';

function getPaymentProvider(env: PaymentEnv): string {
  return env.PAYMENT_PROVIDER?.trim() || PAYMENT_PROVIDER_STRIPE;
}

export function isPaymentsConfigured(env: PaymentEnv): boolean {
  if (getPaymentProvider(env) !== PAYMENT_PROVIDER_STRIPE) return false;
  return Boolean(getStripeSecretKey(env));
}

export async function createCheckoutSession(
  env: PaymentEnv,
  params: CheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  const provider = getPaymentProvider(env);
  if (provider !== PAYMENT_PROVIDER_STRIPE) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
  return createStripeCheckoutSession(env, params);
}

export async function verifyWebhook(
  env: PaymentEnv,
  payload: string,
  headers: Headers,
): Promise<boolean> {
  if (getPaymentProvider(env) !== PAYMENT_PROVIDER_STRIPE) return false;
  const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = headers.get('Stripe-Signature');
  if (!secret || !signature) return false;
  return verifyStripeWebhookSignature(payload, signature, secret);
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
  const provider = getPaymentProvider(env);
  if (provider !== PAYMENT_PROVIDER_STRIPE) {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
  const event = parseStripeWebhookEvent(payload);
  return {
    completed: extractCompletedPayment(event),
    eventId: event.id,
    provider: PAYMENT_PROVIDER_STRIPE,
    refunded: extractRefundedPayment(event),
  };
}
