import type {Newsletter} from './types';

/**
 * Clean up Mailchimp content: strip merge tags, HTML, and collapse whitespace.
 */
function cleanMailchimpText(text: string): string {
  return (
    text
      // Remove Mailchimp merge tags like *|MC:SUBJECT|*, *|MC_PREVIEW_TEXT|*, etc.
      .replace(/\*\|[A-Z0-9_:]+\|\*/g, '')
      // Strip any remaining HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode common HTML entities
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Fetch the plain-text content of a single campaign and extract an excerpt.
 */
async function fetchCampaignExcerpt(
  dc: string,
  apiKey: string,
  campaignId: string,
  maxLength = 250,
): Promise<string> {
  try {
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`, {
      headers: {Authorization: `Bearer ${apiKey}`},
    });
    if (!res.ok) return '';
    const data = (await res.json()) as any;
    // Prefer plain_text (cleaner), fall back to HTML
    const raw = data.plain_text || data.html || '';
    const text = cleanMailchimpText(raw);
    if (text.length <= maxLength) return text;
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '…';
  } catch {
    return '';
  }
}

export async function fetchMailchimpCampaigns(apiKey: string): Promise<Newsletter[]> {
  const dc = apiKey.split('-').pop(); // e.g., "us1"
  const response = await fetch(
    `https://${dc}.api.mailchimp.com/3.0/campaigns?sort_field=send_time&sort_dir=DESC&count=20&status=sent`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Mailchimp API error: ${response.status}`);
  }

  const data = (await response.json()) as any;
  const campaigns = data.campaigns || [];

  // Fetch content excerpts for all campaigns in parallel
  const excerpts = await Promise.all(
    campaigns.map((c: any) => fetchCampaignExcerpt(dc!, apiKey, c.id)),
  );

  return campaigns.map((c: any, i: number) => {
    const title = c.settings?.subject_line || 'PTA Newsletter';
    const preview = c.settings?.preview_text || '';
    // Prefer the richer content excerpt; fall back to preview_text
    const contentExcerpt = excerpts[i];
    const excerpt = contentExcerpt || (preview && preview !== title ? preview : '');
    return {
      id: c.id,
      title,
      date: c.send_time?.split('T')[0] || new Date().toISOString().split('T')[0],
      excerpt,
      url: c.archive_url || '#',
      source: 'pta' as const,
    };
  });
}
