import {zipSync, strToU8} from 'fflate';
import {requireAdmin} from '~/lib/admin/auth';
import type {Route} from './+types/api.admin.bulk-download';

interface FileRow {
  r2_key: string;
  original_filename: string;
  submission_id: number;
}

interface SubmissionRow {
  id: number;
  requester_name: string;
}

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids');

  if (!idsParam) {
    return Response.json({error: 'Missing ids parameter'}, {status: 400});
  }

  const ids = idsParam
    .split(',')
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => !Number.isNaN(id) && id > 0);

  if (ids.length === 0) {
    return Response.json({error: 'No valid ids provided'}, {status: 400});
  }

  const db = context.cloudflare.env.REIMBURSEMENT_DB;
  const r2 = context.cloudflare.env.R2_BUCKET;

  const placeholders = ids.map(() => '?').join(',');

  const [submissions, files] = await Promise.all([
    db
      .prepare(`SELECT id, requester_name FROM submissions WHERE id IN (${placeholders})`)
      .bind(...ids)
      .all<SubmissionRow>(),
    db
      .prepare(
        `SELECT r2_key, original_filename, submission_id FROM file_attachments WHERE submission_id IN (${placeholders}) ORDER BY submission_id, sort_order`,
      )
      .bind(...ids)
      .all<FileRow>(),
  ]);

  if (files.results.length === 0) {
    return Response.json({error: 'No files found for selected submissions'}, {status: 404});
  }

  const nameMap = new Map(submissions.results.map((s) => [s.id, s.requester_name]));

  const zipFiles: Record<string, Uint8Array> = {};
  const filenameCounts = new Map<string, number>();

  await Promise.all(
    files.results.map(async (file) => {
      const object = await r2.get(file.r2_key);
      if (!object) return;

      const bytes = new Uint8Array(await object.arrayBuffer());
      const requesterName = (nameMap.get(file.submission_id) ?? 'Unknown').replace(/[^a-zA-Z0-9 _-]/g, '');
      const folder = `${requesterName} - ${file.submission_id}`;
      let path = `${folder}/${file.original_filename}`;

      // Handle duplicate filenames within same folder
      const count = filenameCounts.get(path) ?? 0;
      if (count > 0) {
        const ext = file.original_filename.lastIndexOf('.');
        const name = ext >= 0 ? file.original_filename.slice(0, ext) : file.original_filename;
        const suffix = ext >= 0 ? file.original_filename.slice(ext) : '';
        path = `${folder}/${name} (${count})${suffix}`;
      }
      filenameCounts.set(`${folder}/${file.original_filename}`, count + 1);

      zipFiles[path] = bytes;
    }),
  );

  if (Object.keys(zipFiles).length === 0) {
    return Response.json({error: 'No files could be retrieved'}, {status: 404});
  }

  const zipped = zipSync(zipFiles);

  return new Response(zipped, {
    headers: {
      'Content-Disposition': 'attachment; filename="reimbursement-files.zip"',
      'Content-Type': 'application/zip',
    },
  });
}
