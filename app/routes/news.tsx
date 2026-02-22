import { useState } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/news";
import {
  mockNewsletters,
  mockPtaNewsletters,
} from "~/lib/mock-data";
import type { Newsletter } from "~/lib/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "News & Updates — Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "Stay up to date with Eagle Updates from the principal and PTA newsletters from Barton Hills Elementary.",
    },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  let schoolNews = mockNewsletters;
  let ptaNews = mockPtaNewsletters;

  try {
    const kvSchool = await context.cloudflare.env.BHE_NEWSLETTERS.get(
      "latest",
      "json"
    );
    if (kvSchool) schoolNews = kvSchool as typeof schoolNews;
    const kvPta = await context.cloudflare.env.BHE_PTA_NEWSLETTERS.get(
      "latest",
      "json"
    );
    if (kvPta) ptaNews = kvPta as typeof ptaNews;
  } catch {
    // KV not available in local dev — use mock data
  }

  return { schoolNews, ptaNews };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function sortByDateDesc(items: Newsletter[]): Newsletter[] {
  return [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function News() {
  const { schoolNews, ptaNews } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<"school" | "pta">("school");

  const sortedSchoolNews = sortByDateDesc(schoolNews);
  const sortedPtaNews = sortByDateDesc(ptaNews);
  const displayedNews =
    activeTab === "school" ? sortedSchoolNews : sortedPtaNews;

  return (
    <main>
      {/* ── Page Banner ──────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            News & Updates
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Stay informed with the latest from our school and PTA
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── Tabs + Newsletter List ────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          {/* Tab Switcher */}
          <div className="flex border-b-2 border-charcoal/10 mb-10">
            <button
              onClick={() => setActiveTab("school")}
              className={`relative pb-3 px-5 font-heading font-bold text-lg transition-colors cursor-pointer ${
                activeTab === "school"
                  ? "text-eagle-blue"
                  : "text-charcoal/40 hover:text-charcoal/70"
              }`}
            >
              Eagle Updates
              {activeTab === "school" && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-spirit-gold rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("pta")}
              className={`relative pb-3 px-5 font-heading font-bold text-lg transition-colors cursor-pointer ${
                activeTab === "pta"
                  ? "text-eagle-blue"
                  : "text-charcoal/40 hover:text-charcoal/70"
              }`}
            >
              PTA News
              {activeTab === "pta" && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-spirit-gold rounded-full" />
              )}
            </button>
          </div>

          {/* Newsletter Cards */}
          <div className="space-y-6">
            {displayedNews.map((item) => (
              <NewsletterCard key={item.id} newsletter={item} />
            ))}
          </div>

          {displayedNews.length === 0 && (
            <p className="text-center text-charcoal/50 py-12 text-lg">
              No newsletters available yet. Check back soon!
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

// ─── Newsletter Card ──────────────────────────────────────────────────────────

function NewsletterCard({ newsletter }: { newsletter: Newsletter }) {
  return (
    <article className="group bg-white rounded-lg shadow-md border-t-4 border-eagle-blue overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-spirit-gold">
            {formatDate(newsletter.date)}
          </span>
          <span
            className={`text-xs font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              newsletter.source === "school"
                ? "bg-eagle-blue/10 text-eagle-blue"
                : "bg-spirit-gold/15 text-spirit-gold"
            }`}
          >
            {newsletter.source === "school" ? "School" : "PTA"}
          </span>
        </div>
        <h2 className="font-heading font-bold text-charcoal text-xl group-hover:text-eagle-blue transition-colors">
          {newsletter.title}
        </h2>
        <p className="mt-3 text-charcoal/60 leading-relaxed">
          {newsletter.excerpt}
        </p>
        <a
          href={newsletter.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center text-sm font-semibold text-eagle-blue group-hover:text-spirit-gold transition-colors"
        >
          Read More
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      </div>
    </article>
  );
}
