import {getCloudflare} from '~/lib/cloudflare-context';
import {sanitizeDownloadFilename} from '~/lib/reimbursement/filename';
import {generatePDF} from '~/lib/reimbursement/pdf/generator';
import {requireTurnstile} from '~/lib/turnstile';
import type {Route} from './+types/api.reimbursement.pdf';

interface PDFRequestData {
  submission?: {
    checkAmount?: number | null;
    checkNumber?: string | null;
    dateApproved?: string | null;
    datePaid?: string | null;
    id?: string;
    submittedAt: string;
    totalAmount: number;
  };
  requester: {
    payableTo: string;
    email: string;
    phone?: string;
    address: string;
    dateOfRequest: string;
    dateCheckNeeded: string;
    invoiceNumber?: string;
  };
  receipts: Array<{
    date: string;
    description: string;
    amount: number;
    placeOfPurchase?: string;
    budgetAccount: string;
  }>;
  budget: {primaryAccount: string; splitAccounts: boolean};
}

export async function action({request, context}: Route.ActionArgs) {
  try {
    const env = getCloudflare(context).env;
    const denied = await requireTurnstile(request, env.TURNSTILE_SECRET_KEY);
    if (denied) return denied;

    const data = (await request.json()) as PDFRequestData;
    const pdfBuffer = await generatePDF(data as Parameters<typeof generatePDF>[0]);
    const rawId = data.submission?.id || 'form';
    const safeId = sanitizeDownloadFilename(String(rawId).replace(/[^a-zA-Z0-9_-]/g, '_'));

    return new Response(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reimbursement-${safeId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({error: 'Failed to generate PDF'}, {status: 500});
  }
}
