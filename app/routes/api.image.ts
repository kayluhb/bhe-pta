import {parseImageProxyRequest} from '~/lib/resized-image';
import type {Route} from './+types/api.image';

/**
 * Resize/optimize remote newsletter preview images via Cloudflare Image Resizing.
 * Only allowlisted hosts are accepted (open-proxy guard).
 */
export async function loader({request}: Route.LoaderArgs) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {status: 405});
  }

  // Avoid request loops when Cloudflare Image Resizing fetches the source.
  if (/image-resizing/i.test(request.headers.get('via') ?? '')) {
    return new Response('Loop detected', {status: 400});
  }

  const parsed = parseImageProxyRequest(new URL(request.url));
  if (!parsed) {
    return new Response('Invalid image request', {status: 400});
  }

  const accept = request.headers.get('Accept') ?? '';
  let format: 'avif' | 'webp' | undefined;
  if (/image\/avif/i.test(accept)) format = 'avif';
  else if (/image\/webp/i.test(accept)) format = 'webp';

  const imageRequest = new Request(parsed.imageUrl, {
    headers: {
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
  });

  let response = await fetch(imageRequest, {
    cf: {
      image: {
        fit: parsed.fit,
        ...(format ? {format} : {}),
        ...(parsed.height != null ? {height: parsed.height} : {}),
        quality: 80,
        width: parsed.width,
      },
    },
  });

  // If Image Resizing is unavailable/misconfigured, still serve the original.
  if (!response.ok) {
    response = await fetch(imageRequest);
  }

  if (!response.ok) {
    return new Response('Image unavailable', {status: response.status === 404 ? 404 : 502});
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  headers.delete('set-cookie');

  return new Response(request.method === 'HEAD' ? null : response.body, {
    headers,
    status: response.status,
  });
}
