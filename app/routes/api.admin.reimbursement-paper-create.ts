import {requireAdmin} from '~/lib/admin/auth';
import {getCloudflare} from '~/lib/cloudflare-context';
import {buildPdfFilename, buildSubmissionSlug} from '~/lib/reimbursement/filename';
import {generatePDF} from '~/lib/reimbursement/pdf/generator';
import {resolveSchoolYearIdForNewSubmission} from '~/lib/reimbursement/school-years';
import {adminPaperSubmissionSchema} from '~/lib/reimbursement/validation';
import type {Route} from './+types/api.admin.reimbursement-paper-create';

function isSchemaOutdatedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('no such column') ||
    message.includes('has no column named') ||
    message.includes('school_year_id') ||
    message.includes('school_years')
  );
}

/** Placeholder contact for treasurer-entered paper rows; not used for outbound mail from this path. */
const PAPER_ENTRY_REQUESTER_EMAIL = 'e0ed4daea85145fe98c5c919@example.com';

function newReimbursementDraftId(): string {
  return `${Date.now()}-${crypto.randomUUID()}`;
}

export async function action({request, context}: Route.ActionArgs) {
  const env = getCloudflare(context).env;
  const adminAuth = await requireAdmin(request, env);
  if (adminAuth instanceof Response) return adminAuth;

  if (request.method !== 'POST') {
    return Response.json({error: 'Method not allowed'}, {status: 405});
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({error: 'Invalid JSON body'}, {status: 400});
  }

  const parsed = adminPaperSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {details: parsed.error.flatten(), error: 'Validation failed'},
      {status: 400},
    );
  }

  const {lines, payableTo, primaryBudgetAccount} = parsed.data;
  const db = env.REIMBURSEMENT_DB;
  const r2 = env.R2_BUCKET;

  if (!db) {
    return Response.json({error: 'Storage is not configured for this environment.'}, {status: 503});
  }
  if (!r2) {
    return Response.json(
      {error: 'File storage is not configured for this environment.'},
      {status: 503},
    );
  }

  const submissionId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const submittedDay = submittedAt.slice(0, 10);

  const reimbursementDraftId = newReimbursementDraftId();
  const slug = buildSubmissionSlug(payableTo, reimbursementDraftId);

  const receiptsForPdf = lines.map((line, i) => ({
    amount: line.amount,
    budgetAccount: primaryBudgetAccount,
    date: line.date ?? submittedDay,
    description: (line.description?.trim() || `Paper reimbursement (${i + 1})`).slice(0, 500),
  }));

  const receiptsForDb = receiptsForPdf.map((r) => ({
    amount: r.amount,
    budgetAccount: r.budgetAccount,
    date: r.date,
    description: r.description,
    placeOfPurchase: null as string | null,
  }));

  const totalAmount = receiptsForDb.reduce((sum, r) => sum + r.amount, 0);

  const requesterForPdf = {
    address: '—',
    dateCheckNeeded: submittedDay,
    dateOfRequest: submittedDay,
    email: PAPER_ENTRY_REQUESTER_EMAIL,
    payableTo: payableTo.trim(),
  };

  try {
    const pdfBuffer = await generatePDF({
      budget: {primaryAccount: primaryBudgetAccount, splitAccounts: false},
      receipts: receiptsForPdf,
      requester: requesterForPdf,
      submission: {
        id: submissionId,
        submittedAt,
        totalAmount,
      },
    });

    const pdfFilename = buildPdfFilename(slug);
    const pdfKey = `submissions/${submissionId}/${pdfFilename}`;
    await r2.put(pdfKey, pdfBuffer, {
      httpMetadata: {contentType: 'application/pdf'},
    });

    const schoolYearResolution = await resolveSchoolYearIdForNewSubmission(db);
    if (!schoolYearResolution.ok) {
      await r2.delete(pdfKey);
      return schoolYearResolution.response;
    }
    const schoolYearId = schoolYearResolution.schoolYearId;

    await db.batch([
      db
        .prepare(
          `INSERT INTO submissions
            (id, requester_name, requester_email, requester_phone, requester_address,
             date_check_needed, status, total_amount, pdf_key, submitted_at, school_year_id)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        )
        .bind(
          submissionId,
          payableTo.trim(),
          PAPER_ENTRY_REQUESTER_EMAIL,
          null,
          null,
          submittedDay,
          totalAmount,
          pdfKey,
          submittedAt,
          schoolYearId,
        ),
      ...receiptsForDb.map((receipt, i) =>
        db
          .prepare(
            `INSERT INTO receipt_entries (id, submission_id, receipt_date, description, amount, category, vendor, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            submissionId,
            receipt.date,
            receipt.description,
            receipt.amount,
            receipt.budgetAccount,
            receipt.placeOfPurchase,
            i,
          ),
      ),
    ]);

    console.log('[paper-create] submission saved:', {
      id: submissionId,
      lines: lines.length,
      payableTo: payableTo.trim(),
      totalAmount,
    });

    return Response.json({submissionId});
  } catch (error) {
    console.error('[paper-create] error:', error);
    if (isSchemaOutdatedError(error)) {
      return Response.json(
        {
          error:
            'Database schema is out of date. Please run the latest reimbursement migrations and try again.',
        },
        {status: 503},
      );
    }
    return Response.json({error: 'Failed to create submission'}, {status: 500});
  }
}
