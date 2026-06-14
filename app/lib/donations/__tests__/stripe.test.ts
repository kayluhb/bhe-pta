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
});
