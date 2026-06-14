export type PaymentProvider = 'stripe';

export interface CheckoutSessionParams {
  amountCents: number;
  campaignSlug: string;
  campaignTitle: string;
  cancelUrl: string;
  donationId: string;
  donorEmail: string;
  donorName: string;
  presetId: string | null;
  successUrl: string;
}

export interface CheckoutSessionResult {
  checkoutId: string;
  url: string;
}

export interface CompletedPayment {
  amountCents: number;
  donationId: string;
  paymentId: string;
}

export interface RefundedPayment {
  donationId: string;
  paymentId: string;
}

export interface PaymentEnv {
  PAYMENT_PROVIDER?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}
