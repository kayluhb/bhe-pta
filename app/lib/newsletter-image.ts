const SKIP_IMAGE_HOST =
  /cdn-images\.mailchimp\.com|list-manage\.com\/track|facebook\.com|twitter\.com|instagram\.com|googleusercontent\.com\/proxy|fonts\.gstatic\.com|twemoji|emoji/i;

const SKIP_IMAGE_PATH = /\/icons\/|monkey_rewards|open\.gif|pixel|spacer|1x1|\/emoji\//i;

const PREFERRED_IMAGE_HOST = /mcusercontent\.com|gallery\.mailchimp\.com/i;

function absoluteImageUrl(src: string): string | undefined {
  const trimmed = src.trim();
  if (!trimmed || trimmed.startsWith('data:')) return undefined;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return undefined;
}

function isUsableContentImage(url: string): boolean {
  if (SKIP_IMAGE_HOST.test(url) || SKIP_IMAGE_PATH.test(url)) return false;
  return PREFERRED_IMAGE_HOST.test(url) || /\.(jpe?g|png|webp)(\?|$)/i.test(url);
}

interface ImageCandidate {
  dropZone: boolean;
  height: number;
  url: string;
  width: number;
}

/** Higher is better for newsletter card previews. */
export function scoreNewsletterImageCandidate(candidate: ImageCandidate): number {
  const {dropZone, height, width} = candidate;
  let score = 0;

  if (dropZone) score -= 40;
  if (width > 0 && width < 160) score -= 50;
  if (height > 0 && height < 120) score -= 50;

  if (width > 0 && height > 0) {
    const ratio = width / height;
    // Prefer near-landscape card shapes; heavily penalize tall portraits.
    if (ratio >= 1.15 && ratio <= 2.4) score += 80;
    else if (ratio >= 0.95 && ratio < 1.15)
      score += 35; // square-ish
    else if (ratio > 2.4)
      score += 20; // very wide banners
    else score -= 60; // portrait
    score += Math.min(width, 900) / 20;
  } else if (width > 0) {
    // HTML width only — prefer typical body flyer widths.
    if (width >= 480 && width <= 700) score += 40;
    else if (width > 700) score += 20;
    else score += width / 30;
  }

  return score;
}

/**
 * Best usable content image from Mailchimp campaign HTML.
 * Prefers landscape body images that work as card previews.
 */
export function extractMailchimpImageUrl(html: string): string | undefined {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  const seen = new Set<string>();
  const candidates: ImageCandidate[] = [];

  for (const tag of tags) {
    const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    const src = srcMatch?.[1];
    if (!src) continue;
    const url = absoluteImageUrl(src);
    if (!url || !isUsableContentImage(url) || seen.has(url)) continue;
    seen.add(url);
    const widthMatch = tag.match(/\bwidth\s*=\s*["']?(\d+)/i);
    const heightMatch = tag.match(/\bheight\s*=\s*["']?(\d+)/i);
    candidates.push({
      dropZone: /imageDropZone|mceImage/i.test(tag),
      height: heightMatch ? Number(heightMatch[1]) : 0,
      url,
      width: widthMatch ? Number(widthMatch[1]) : 0,
    });
  }

  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => scoreNewsletterImageCandidate(b) - scoreNewsletterImageCandidate(a));

  return candidates[0]?.url;
}

/** Read Open Graph / Twitter card image from HTML. */
export function extractOgImageUrl(html: string): string | undefined {
  const og =
    html.match(
      /<meta\b[^>]*\bproperty\s*=\s*["']og:image["'][^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta\b[^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*\bproperty\s*=\s*["']og:image["'][^>]*>/i,
    );
  if (og?.[1]) return absoluteImageUrl(og[1]);

  const twitter =
    html.match(
      /<meta\b[^>]*\bname\s*=\s*["']twitter:image["'][^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta\b[^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*\bname\s*=\s*["']twitter:image["'][^>]*>/i,
    );
  if (twitter?.[1]) return absoluteImageUrl(twitter[1]);

  return undefined;
}
