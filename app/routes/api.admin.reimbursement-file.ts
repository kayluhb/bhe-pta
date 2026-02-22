import {requireAdmin} from '~/lib/admin/auth';
import type {Route} from './+types/api.admin.reimbursement-file';

export async function loader({request, context}: Route.LoaderArgs) {
  const auth = await requireAdmin(request, context.cloudflare.env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return Response.json({error: 'Missing key parameter'}, {status: 400});
  }

  const r2 = context.cloudflare.env.R2_BUCKET;
  const object = await r2.get(key);

  if (!object) {
    return Response.json({error: 'File not found'}, {status: 404});
  }

  const filename = key.split('/').pop() || 'download';

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
