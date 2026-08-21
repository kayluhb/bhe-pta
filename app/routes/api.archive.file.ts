import {getCloudflare} from '~/lib/cloudflare-context';
import type {Route} from './+types/api.archive.file';

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key || key.includes('..')) {
    return Response.json({error: 'Invalid key'}, {status: 400});
  }

  const r2 = getCloudflare(context).env.R2_ARCHIVE;
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
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
