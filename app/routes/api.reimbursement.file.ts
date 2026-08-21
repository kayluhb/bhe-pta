import {getCloudflare} from '~/lib/cloudflare-context';
import {
  resolveFilePreviewSigningSecret,
  verifyFileAccess,
} from '~/lib/reimbursement/file-url-signature';
import {isValidStagingUploadKey} from '~/lib/reimbursement/r2-staging';
import type {Route} from './+types/api.reimbursement.file';

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const expRaw = url.searchParams.get('exp');
  const sig = url.searchParams.get('sig');

  const expSec = expRaw ? Number.parseInt(expRaw, 10) : Number.NaN;

  if (!key || !isValidStagingUploadKey(key)) {
    return Response.json({error: 'Invalid key'}, {status: 400});
  }

  const secret = resolveFilePreviewSigningSecret(getCloudflare(context).env);
  if (!secret || !sig || !Number.isFinite(expSec)) {
    return Response.json({error: 'Missing or invalid access token'}, {status: 403});
  }

  const valid = await verifyFileAccess(key, expSec, sig, secret);
  if (!valid) {
    return Response.json({error: 'Invalid or expired access token'}, {status: 403});
  }

  const r2 = getCloudflare(context).env.R2_BUCKET;
  if (!r2) {
    return Response.json({error: 'Storage not available'}, {status: 503});
  }

  const object = await r2.get(key);
  if (!object) {
    return Response.json({error: 'File not found'}, {status: 404});
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=300',
    },
  });
}
