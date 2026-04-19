import {requireAdmin} from '~/lib/admin/auth';
import {regenerateStoredSubmissionPdf} from '~/lib/reimbursement/pdf/regenerate-stored-pdf';
import type {Route} from './+types/api.admin.reimbursement-pdf-regenerate';

export async function action({request, params, context}: Route.ActionArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  if (request.method !== 'POST') {
    return new Response(null, {status: 405});
  }

  const submissionId = params.id;
  const env = context.cloudflare.env;
  const result = await regenerateStoredSubmissionPdf(
    env.REIMBURSEMENT_DB,
    env.R2_BUCKET,
    submissionId,
  );

  if (!result.ok) {
    if (result.reason === 'no_r2') {
      return Response.json({error: 'File storage is not configured'}, {status: 503});
    }
    if (result.reason === 'not_found') {
      return Response.json({error: 'Submission not found'}, {status: 404});
    }
    return Response.json({error: 'Failed to generate PDF'}, {status: 500});
  }

  return Response.json({success: true, pdfKey: result.pdfKey});
}
