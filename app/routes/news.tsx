import {useRef, useState} from 'react';
import {useLoaderData} from 'react-router';
import {mergeParentMeta} from '~/lib/meta';
import {mockNewsletters, mockPtaNewsletters} from '~/lib/mock-data';
import type {Newsletter} from '~/lib/types';
import type {Route} from './+types/news';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'News & Updates | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content: 'Read the latest Eagle Updates from Principal Achtermann and PTA newsletters.',
    },
  ]);
}

export async function loader({context}: Route.LoaderArgs) {
  let schoolNews = mockNewsletters;
  let ptaNews = mockPtaNewsletters;

  try {
    const kvSchool = await context.cloudflare.env.BHE_NEWSLETTERS.get('latest', 'json');
    if (kvSchool) schoolNews = kvSchool as typeof schoolNews;
    const kvPta = await context.cloudflare.env.BHE_PTA_NEWSLETTERS.get('latest', 'json');
    if (kvPta) ptaNews = kvPta as typeof ptaNews;
  } catch {
    // KV not available in local dev — use mock data
  }

  return {schoolNews, ptaNews};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function sortByDateDesc(items: Newsletter[]): Newsletter[] {
  return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function News() {
  const {schoolNews, ptaNews} = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'school' | 'pta'>('school');
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({school: 5, pta: 5});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({school: null, pta: null});

  const tabs = [
    {id: 'school' as const, label: 'Eagle Updates'},
    {id: 'pta' as const, label: 'PTA News'},
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent, tabId: 'school' | 'pta') => {
    const tabIds = tabs.map((t) => t.id);
    const currentIndex = tabIds.indexOf(tabId);

    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabIds.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = tabIds[nextIndex];
      setActiveTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  };

  const sortedSchoolNews = sortByDateDesc(schoolNews);
  const sortedPtaNews = sortByDateDesc(ptaNews);
  const allNews = activeTab === 'school' ? sortedSchoolNews : sortedPtaNews;
  const displayedNews = allNews.slice(0, visibleCount[activeTab]);
  const hasMore = allNews.length > visibleCount[activeTab];

  return (
    <div>
      {/* ── Page Banner ──────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            News & Updates
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            Stay informed with the latest from our school and PTA
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── Tabs + Newsletter List ────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          {/* Tab Switcher */}
          <div
            aria-label="Newsletter categories"
            className="flex border-b-2 border-charcoal/10 mb-10"
            role="tablist"
          >
            {tabs.map((tab) => (
              <button
                aria-controls={`tabpanel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={`relative pb-3 px-5 font-heading font-bold text-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'text-eagle-blue'
                    : 'text-charcoal/70 hover:text-charcoal/80'
                }`}
                id={`tab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                role="tab"
                tabIndex={activeTab === tab.id ? 0 : -1}
                type="button"
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-spirit-gold rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Newsletter Cards */}
          <div
            aria-labelledby={`tab-${activeTab}`}
            className="space-y-6"
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
          >
            {displayedNews.map((item) => (
              <NewsletterCard key={item.id} newsletter={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                className="inline-flex items-center gap-2 px-8 py-3 bg-eagle-blue text-white font-heading font-bold rounded-full hover:bg-eagle-blue/90 transition-all duration-200 hover:shadow-lg cursor-pointer"
                onClick={() =>
                  setVisibleCount((prev) => ({
                    ...prev,
                    [activeTab]: prev[activeTab] + 5,
                  }))
                }
                type="button"
              >
                Load More
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}

          {displayedNews.length === 0 && (
            <p className="text-center text-charcoal/70 py-12 text-lg">
              No newsletters available yet. Check back soon!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Newsletter Card ──────────────────────────────────────────────────────────

function NewsletterCard({newsletter}: {newsletter: Newsletter}) {
  return (
    <article className="group bg-white rounded-lg shadow-md border-t-4 border-eagle-blue overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-spirit-gold">
            {formatDate(newsletter.date)}
          </span>
          <span
            className={`text-xs font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              newsletter.source === 'school'
                ? 'bg-eagle-blue/10 text-eagle-blue'
                : 'bg-spirit-gold/15 text-spirit-gold'
            }`}
          >
            {newsletter.source === 'school' ? 'School' : 'PTA'}
          </span>
        </div>
        <h2 className="font-heading font-bold text-charcoal text-xl group-hover:text-eagle-blue transition-colors">
          {newsletter.title}
        </h2>
        {newsletter.excerpt && (
          <p className="mt-3 text-charcoal/70 leading-relaxed">{newsletter.excerpt}</p>
        )}
        <a
          className="mt-4 inline-flex items-center text-sm font-semibold text-eagle-blue group-hover:text-spirit-gold transition-colors"
          href={newsletter.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Read more about {newsletter.title}
          <span className="sr-only"> (opens in new tab)</span>
          <svg
            aria-hidden="true"
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </article>
  );
}
