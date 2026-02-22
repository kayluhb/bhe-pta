import type {Route} from './+types/api.reimbursement.upload-mock';

// Mock upload endpoint for development
// In production, uploads go directly to R2 via presigned URLs
export async function action({request}: Route.ActionArgs) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response('Missing key', {status: 400});
  }

  // In development, we just accept the upload and log it
  // The file data is not stored
  const contentLength = request.headers.get('content-length');
  console.log(`[Dev] Mock upload received: ${key} (${contentLength} bytes)`);

  return new Response(null, {status: 200});
}
