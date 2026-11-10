/**
 * Build the outbound CheddarUp URL for the Annual Fund give form.
 * CheddarUp does not document amount/frequency query params, so we only
 * attach campaign UTMs and let donors choose the gift on their site.
 */
export function buildGiveCheckoutUrl(opts: {baseUrl: string; utmContent: string}): string {
  const url = new URL(opts.baseUrl);
  url.searchParams.set('utm_source', 'bheeagles');
  url.searchParams.set('utm_medium', 'website');
  url.searchParams.set('utm_campaign', 'annual-fund-2026-27');
  url.searchParams.set('utm_content', opts.utmContent);
  return url.toString();
}
