import * as cheerio from "cheerio";
import type { Newsletter } from "./types";

export async function scrapeSchoolNews(): Promise<Newsletter[]> {
  const response = await fetch("https://bartonhills.austinschools.org/news");
  const html = await response.text();
  const $ = cheerio.load(html);

  const newsletters: Newsletter[] = [];

  // School site uses Drupal with .panel.panel-default for each news item:
  //   <div class="panel panel-default clearfix">
  //     <h2><a href="/news/2026/02/04/eagle-update-...">Eagle Update - ...</a></h2>
  //     <div class="time"><time datetime="2026-02-04">February 04, 2026</time></div>
  //     <p>Eagle Update - ...</p>
  //   </div>
  $(".panel.panel-default").each((i, el) => {
    const $el = $(el);
    const titleEl = $el.find("h2 a").first();
    const title = titleEl.text().trim();
    const href = titleEl.attr("href");
    const timeEl = $el.find("time").first();
    const dateText =
      timeEl.attr("datetime") || timeEl.text().trim();
    const excerpt = $el.find("p").first().text().trim();

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
