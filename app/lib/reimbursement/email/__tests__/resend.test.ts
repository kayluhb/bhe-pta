import {beforeEach, describe, expect, it, vi} from 'vitest';

const send = vi.hoisted(() => vi.fn().mockResolvedValue({data: {id: 'm1'}}));

vi.mock('resend', () => ({
  Resend: class {
    emails = {send};
  },
}));

import {sendCashCheckNudgeEmail, sendCheckDeliveredEmail, sendNotificationEmail} from '../resend';

describe('resend email helpers', () => {
  beforeEach(() => {
    send.mockClear();
  });

  it('sends check delivered email', async () => {
    await sendCheckDeliveredEmail({
      requesterEmail: 'a@bheeagles.com',
      requesterName: 'Pat Example',
      resendApiKey: 're_test',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends cash check nudge email', async () => {
    await sendCashCheckNudgeEmail({
      requesterEmail: 'a@bheeagles.com',
      requesterName: 'Pat',
      resendApiKey: 're_test',
      totalAmountFormatted: '$12.00',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends PTA notification and requester confirmation with attachments', async () => {
    await sendNotificationEmail({
      fileAttachments: [
        {
          content: new Uint8Array([1, 2]),
          contentType: 'image/jpeg',
          filename: 'x.jpg',
        },
      ],
      notificationEmail: 'treasurer@bheeagles.com',
      pdfBuffer: new Uint8Array([3, 4]),
      pdfFilename: 'form.pdf',
      receipts: [{amount: 5, budgetAccount: 'Library', description: 'Books'}],
      requester: {
        address: '1 St',
        dateCheckNeeded: '2026-02-01',
        email: 'req@example.com',
        payableTo: 'Pat',
        phone: '555',
      },
      resendApiKey: 're_test',
      submission: {id: 's1', totalAmount: 5},
    });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('sends notification without optional phone and extra files', async () => {
    await sendNotificationEmail({
      notificationEmail: 't@bheeagles.com',
      pdfBuffer: new Uint8Array([1]),
      pdfFilename: 'f.pdf',
      receipts: [{amount: 1, budgetAccount: 'A', description: 'D'}],
      requester: {
        address: 'Addr',
        dateCheckNeeded: '2026-01-01',
        email: 'e@e.com',
        payableTo: 'P',
      },
      resendApiKey: 're_test',
      submission: {id: 's2', totalAmount: 1},
    });
    expect(send).toHaveBeenCalledTimes(2);
  });
});
