/** Display widths for newsletter card previews (CSS px × ~2 for retina). */
export const NEWSLETTER_IMAGE_WIDTHS = {
  card: 800,
  listing: 1200,
} as const;

const ALLOWED_IMAGE_HOSTS = new Set([
  'cdn.smore.com',
  'gallery.mailchimp.com',
  'mcusercontent.com',
]);

type AllowedFit = 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';

const ALLOWED_FITS = new Set<string>(['scale-down', 'contain', 'cover', 'crop', 'pad']);

const MIN_WIDTH = 64;
const MAX_WIDTH = 2400;
const MIN_HEIGHT = 64;
const MAX_HEIGHT = 2400;

export function isAllowedRemoteImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_IMAGE_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function resizedImageUrl(
  sourceUrl: string,
  options: {fit?: AllowedFit; height?: number; width: number},
): string {
  if (!isAllowedRemoteImageUrl(sourceUrl)) return sourceUrl;

  const params = new URLSearchParams({
    url: sourceUrl,
    w: String(options.width),
  });
  if (options.height != null) params.set('h', String(options.height));
  if (options.fit) params.set('fit', options.fit);
  return `/api/image?${params.toString()}`;
}

export interface ImageProxyRequest {
  fit: AllowedFit;
  height?: number;
  imageUrl: string;
  width: number;
}

function parsePositiveInt(raw: string | null, min: number, max: number): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

/** Validate `/api/image` query params. Returns null when the request is unsafe. */
export function parseImageProxyRequest(requestUrl: URL): ImageProxyRequest | null {
  const imageUrl = requestUrl.searchParams.get('url');
  if (!imageUrl || !isAllowedRemoteImageUrl(imageUrl)) return null;

  const width = parsePositiveInt(requestUrl.searchParams.get('w'), MIN_WIDTH, MAX_WIDTH);
  if (width == null) return null;

  const heightRaw = requestUrl.searchParams.get('h');
  const height =
    heightRaw == null ? undefined : (parsePositiveInt(heightRaw, MIN_HEIGHT, MAX_HEIGHT) ?? null);
  if (height === null) return null;

  const fitRaw = requestUrl.searchParams.get('fit') ?? 'scale-down';
  if (!ALLOWED_FITS.has(fitRaw as AllowedFit)) return null;

  return {
    fit: fitRaw as AllowedFit,
    ...(height != null ? {height} : {}),
    imageUrl,
    width,
  };
}
