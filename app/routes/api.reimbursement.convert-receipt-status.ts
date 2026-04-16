import {FILE_ACCESS_TTL_SEC, signFileAccess} from '~/lib/reimbursement/file-url-signature';
import type {Route} from './+types/api.reimbursement.convert-receipt-status';

interface JobRow {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'error';
  original_key: string;
  original_filename: string;
  original_content_type: string;
  original_size: number;
  converted_key: string | null;
  converted_filename: string | null;
  converted_size: number | null;
  error_message: string | null;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  if (!jobId) {
    return Response.json({error: 'Missing jobId'}, {status: 400});
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  if (!db) {
    return Response.json({error: 'Storage is not configured for this environment.'}, {status: 503});
  }

  const row = await db
    .prepare(
      `SELECT id, status, original_key, original_filename, original_content_type, original_size,
              converted_key, converted_filename, converted_size, error_message
       FROM receipt_conversion_jobs
       WHERE id = ?`,
    )
    .bind(jobId)
    .first<JobRow>();

  if (!row) {
    return Response.json({error: 'Job not found'}, {status: 404});
  }

  if (row.status !== 'complete') {
    return Response.json({
      jobId: row.id,
      status: row.status,
      ...(row.status === 'error'
        ? {error: row.error_message || 'Receipt conversion failed. Please try another file.'}
        : {}),
    });
  }

  const signingSecret = context.cloudflare.env.FILE_URL_SIGNING_SECRET;
  if (!signingSecret || !row.converted_key || !row.converted_filename || !row.converted_size) {
    return Response.json(
      {error: 'File preview signing is not configured for this environment.'},
      {status: 503},
    );
  }

  const fileAccessExp = Math.floor(Date.now() / 1000) + FILE_ACCESS_TTL_SEC;
  const [pdfSig, originalSig] = await Promise.all([
    signFileAccess(row.converted_key, fileAccessExp, signingSecret),
    signFileAccess(row.original_key, fileAccessExp, signingSecret),
  ]);

  return Response.json({
    jobId: row.id,
    status: row.status,
    key: row.converted_key,
    filename: row.converted_filename,
    contentType: 'application/pdf',
    size: row.converted_size,
    fileAccessExp,
    fileAccessSig: pdfSig,
    original: {
      key: row.original_key,
      filename: row.original_filename,
      contentType: row.original_content_type,
      size: row.original_size,
      fileAccessExp,
      fileAccessSig: originalSig,
    },
  });
}
