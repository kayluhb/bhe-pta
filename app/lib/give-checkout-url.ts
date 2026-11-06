/**
 * Build the outbound CheddarUp URL for the Annual Fund give form.
 * Amount/frequency are collected in the UI for progressive enhancement only —
 * CheddarUp query encoding is not confirmed, so we never invent payment params.
 */
export function buildGiveCheckoutUrl(opts: {
  amount: number | null;
  baseUrl: string;
  frequency: 'once' | 'monthly';
  utmContent: string;
}): string {
  void opts.amount;
  void opts.frequency;
  const url = new URL(opts.baseUrl);
  url.searchParams.set('utm_source', 'bheeagles');
  url.searchParams.set('utm_medium', 'website');
  url.searchParams.set('utm_campaign', 'annual-fund-2026-27');
  url.searchParams.set('utm_content', opts.utmContent);
  return url.toString();
}
