import * as cheerio from "cheerio";
import type { Newsletter } from "./types";

export async function scrapeSchoolNews(): Promise<Newsletter[]> {
  const response = await fetch("https://bartonhills.austinschools.org/news");
  const html = await response.text();
  const $ = cheerio.load(html);

  const newsletters: Newsletter[] = [];

  // The school news page lists articles. Parse each one.
  // Look for article/news item elements with titles, dates, links.
  // Inspect the page structure — typical patterns:
  //   - .views-row or .node-teaser for each item
  //   - h2/h3 a for title + link
  //   - .date-display-single or time element for date
  //   - .field-content or p for excerpt

  // Build a resilient parser that extracts what it can
  $(
    "article, .views-row, .node--type-article, [class*='news-item'], .view-content > div"
  ).each((i, el) => {
    const $el = $(el);
    const titleEl = $el
      .find("h2 a, h3 a, .field-title a, .views-field-title a")
      .first();
    const title = titleEl.text().trim();
    const href = titleEl.attr("href");
    const dateText = $el
      .find("time, .date-display-single, .views-field-created, .field-date")
      .first()
      .text()
      .trim();
    const excerpt = $el
      .find("p, .field-body, .views-field-body, .field-teaser")
      .first()
      .text()
      .trim();

    if (title && href) {
      const url = href.startsWith("http")
        ? href
        : `https://bartonhills.austinschools.org${href}`;
      newsletters.push({
        id: `school-${i}`,
        title,
        date: dateText || new Date().toISOString().split("T")[0],
        excerpt: excerpt.slice(0, 200),
        url,
        source: "school",
      });
    }
  });

  return newsletters;
}
