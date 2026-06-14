import {Resend} from 'resend';

import {nonprofit} from '~/data/nonprofit';

interface DonationReceiptParams {
  amountCents: number;
  campaignTitle: string;
  completedAt: string;
  donorEmail: string;
  donorName: string;
  notificationEmail: string;
  resendApiKey: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function generateReceiptHTML(params: DonationReceiptParams): string {
  const amount = formatCurrency(params.amountCents);
  const date = formatDate(params.completedAt);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 24px; background: #fff; border: 1px solid #e5e7eb; border-top: none; }
        .footer { text-align: center; padding: 16px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 22px;">Donation Receipt</h1>
      </div>
      <div class="content">
        <p>Dear ${params.donorName},</p>
        <p>Thank you for your generous contribution to ${params.campaignTitle}.</p>
        <p><strong>Organization:</strong> ${nonprofit.legalName}<br>
        <strong>EIN:</strong> ${nonprofit.ein}<br>
        <strong>Date:</strong> ${date}<br>
        <strong>Amount:</strong> ${amount}</p>
        <p>${nonprofit.noGoodsOrServices}</p>
        <p style="font-size: 14px; color: #6b7280;">${nonprofit.membershipNote}</p>
        <p>With gratitude,<br>${nonprofit.shortName}</p>
      </div>
      <div class="footer">
        Please retain this email for your tax records.
      </div>
    </body>
    </html>
  `;
}

export async function sendDonationReceiptEmail(params: DonationReceiptParams): Promise<void> {
  const resend = new Resend(params.resendApiKey);
  const html = generateReceiptHTML(params);

  await resend.emails.send({
    bcc: params.notificationEmail,
    from: 'BHE PTA <donations@bheeagles.com>',
    html,
    subject: `Thank you for your donation — ${nonprofit.shortName}`,
    to: params.donorEmail,
  });
}
