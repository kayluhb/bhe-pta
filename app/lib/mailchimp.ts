import type { Newsletter } from "./types";

export async function fetchMailchimpCampaigns(
  apiKey: string
): Promise<Newsletter[]> {
  const dc = apiKey.split("-").pop(); // e.g., "us1"
  const response = await fetch(
    `https://${dc}.api.mailchimp.com/3.0/campaigns?sort_field=send_time&sort_dir=DESC&count=20&status=sent`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Mailchimp API error: ${response.status}`);
  }

  const data = (await response.json()) as any;

  return (data.campaigns || []).map((c: any) => {
    const title = c.settings?.subject_line || "PTA Newsletter";
    const preview = c.settings?.preview_text || "";
    // Don't use preview_text if it's the same as the title
    const excerpt = preview && preview !== title ? preview : "";
    return {
      id: c.id,
      title,
      date:
        c.send_time?.split("T")[0] || new Date().toISOString().split("T")[0],
      excerpt,
      url: c.archive_url || "#",
      source: "pta" as const,
    };
  });
}
