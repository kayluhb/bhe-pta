import {randomUUID} from '~/lib/random-uuid';

export interface PendingDonationRow {
  amountCents: number;
  campaignSlug: string;
  donorEmail: string;
  donorFields: Record<string, string>;
  donorName: string;
  presetId: string | null;
  provider: string;
}

export async function insertPendingDonation(
  db: D1Database,
  row: PendingDonationRow,
): Promise<string> {
  const id = randomUUID();
  await db
    .prepare(
      `INSERT INTO donations (
        id, campaign_slug, provider, amount_cents, status,
        donor_name, donor_email, donor_fields, preset_id, created_at
      ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      id,
      row.campaignSlug,
      row.provider,
      row.amountCents,
      row.donorName,
      row.donorEmail,
      JSON.stringify(row.donorFields),
      row.presetId,
    )
    .run();
  return id;
}

export async function attachCheckoutId(
  db: D1Database,
  donationId: string,
  checkoutId: string,
): Promise<void> {
  await db
    .prepare('UPDATE donations SET provider_checkout_id = ? WHERE id = ?')
    .bind(checkoutId, donationId)
    .run();
}

export async function markDonationCompleted(
  db: D1Database,
  donationId: string,
  paymentId: string,
  amountCents: number,
): Promise<{
  campaignSlug: string;
  donorEmail: string;
  donorName: string;
} | null> {
  const result = await db
    .prepare(
      `UPDATE donations
       SET status = 'completed',
           provider_payment_id = ?,
           amount_cents = ?,
           completed_at = datetime('now')
       WHERE id = ? AND status = 'pending'`,
    )
    .bind(paymentId, amountCents, donationId)
    .run();

  if (!result.meta.changes) return null;

  const row = await db
    .prepare(
      `SELECT campaign_slug, donor_email, donor_name
       FROM donations WHERE id = ?`,
    )
    .bind(donationId)
    .first<{
      campaign_slug: string;
      donor_email: string;
      donor_name: string;
    }>();

  if (!row) return null;
  return {
    campaignSlug: row.campaign_slug,
    donorEmail: row.donor_email,
    donorName: row.donor_name ?? 'Donor',
  };
}

export async function markDonationRefunded(db: D1Database, donationId: string): Promise<void> {
  await db.prepare(`UPDATE donations SET status = 'refunded' WHERE id = ?`).bind(donationId).run();
}

export async function isWebhookEventProcessed(db: D1Database, eventId: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT event_id FROM payment_webhook_events WHERE event_id = ?')
    .bind(eventId)
    .first<{event_id: string}>();
  return Boolean(row);
}

export async function recordWebhookEvent(
  db: D1Database,
  eventId: string,
  provider: string,
): Promise<boolean> {
  try {
    await db
      .prepare('INSERT INTO payment_webhook_events (event_id, provider) VALUES (?, ?)')
      .bind(eventId, provider)
      .run();
    return true;
  } catch {
    return false;
  }
}
