import {describe, expect, it} from 'vitest';

import {
  extractCompletedPayment,
  extractRefundedPayment,
  parseStripeWebhookEvent,
} from '~/lib/donations/stripe';

describe('extractCompletedPayment', () => {
  it('parses checkout.session.completed', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        data: {
          object: {
            amount_total: 20000,
            client_reference_id: 'donation-123',
            payment_intent: 'pi_abc',
          },
        },
        id: 'evt_1',
        type: 'checkout.session.completed',
      }),
    );
    const payment = extractCompletedPayment(event);
    expect(payment).toEqual({
      amountCents: 20000,
      donationId: 'donation-123',
      paymentId: 'pi_abc',
    });
  });

  it('falls back to metadata.donation_id', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        data: {
          object: {
            amount_total: 15000,
            metadata: {donation_id: 'donation-meta'},
            payment_intent: 'pi_meta',
          },
        },
        id: 'evt_1b',
        type: 'checkout.session.completed',
      }),
    );
    expect(extractCompletedPayment(event)).toEqual({
      amountCents: 15000,
      donationId: 'donation-meta',
      paymentId: 'pi_meta',
    });
  });

  it('returns null for unrelated events', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({data: {object: {}}, id: 'evt_2', type: 'payment_intent.created'}),
    );
    expect(extractCompletedPayment(event)).toBeNull();
  });
});

describe('extractRefundedPayment', () => {
  it('parses charge.refunded with metadata', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        data: {
          object: {
            metadata: {donation_id: 'donation-456'},
            payment_intent: 'pi_def',
          },
        },
        id: 'evt_3',
        type: 'charge.refunded',
      }),
    );
    expect(extractRefundedPayment(event)).toEqual({
      donationId: 'donation-456',
      paymentId: 'pi_def',
    });
  });

  it('parses charge.refunded using payment_intent when metadata is missing', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({
        data: {
          object: {
            payment_intent: 'pi_ghi',
          },
        },
        id: 'evt_4',
        type: 'charge.refunded',
      }),
    );
    expect(extractRefundedPayment(event)).toEqual({
      donationId: null,
      paymentId: 'pi_ghi',
    });
  });

  it('returns null for unrelated events', () => {
    const event = parseStripeWebhookEvent(
      JSON.stringify({data: {object: {}}, id: 'evt_5', type: 'checkout.session.completed'}),
    );
    expect(extractRefundedPayment(event)).toBeNull();
  });
});
