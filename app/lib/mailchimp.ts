import {extractMailchimpImageUrl} from './newsletter-image';
import type {Newsletter} from './types';

interface MailchimpCampaignContent {
  html?: string;
  plain_text?: string;
}

interface MailchimpCampaign {
  archive_url?: string;
  id: string;
  send_time?: string;
  settings?: {
    preview_text?: string;
    subject_line?: string;
  };
}

interface MailchimpCampaignListResponse {
  campaigns?: MailchimpCampaign[];
}

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

function excerptFromText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated}…`;
}

interface CampaignContentFields {
  excerpt: string;
  imageUrl?: string;
}

/**
 * Fetch campaign HTML/text and extract excerpt + first content image.
 */
async function fetchCampaignContent(
  dc: string,
  apiKey: string,
  campaignId: string,
  maxLength = 250,
): Promise<CampaignContentFields> {
  try {
    const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`, {
      headers: {Authorization: `Bearer ${apiKey}`},
    });
    if (!res.ok) return {excerpt: ''};
    const data = (await res.json()) as MailchimpCampaignContent;
    const html = data.html || '';
    const raw = data.plain_text || html || '';
    const text = cleanMailchimpText(raw);
    return {
      excerpt: excerptFromText(text, maxLength),
      imageUrl: html ? extractMailchimpImageUrl(html) : undefined,
    };
  } catch {
    return {excerpt: ''};
  }
}

export async function fetchMailchimpCampaigns(apiKey: string): Promise<Newsletter[]> {
  const dc = apiKey.split('-').pop();
  if (!dc) {
    throw new Error('Mailchimp API key must include a datacenter suffix (e.g. "-us1").');
  }
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

  const data = (await response.json()) as MailchimpCampaignListResponse;
  const campaigns = data.campaigns ?? [];

  const contents = await Promise.all(campaigns.map((c) => fetchCampaignContent(dc, apiKey, c.id)));

  return campaigns.map((c, i) => {
    const title = c.settings?.subject_line || 'PTA Newsletter';
    const preview = c.settings?.preview_text || '';
    const content = contents[i] ?? {excerpt: ''};
    const excerpt = content.excerpt || (preview && preview !== title ? preview : '');
    return {
      id: c.id,
      title,
      date: c.send_time?.split('T')[0] || new Date().toISOString().split('T')[0],
      excerpt,
      url: c.archive_url || '#',
      source: 'pta' as const,
      ...(content.imageUrl ? {imageUrl: content.imageUrl} : {}),
    };
  });
}
