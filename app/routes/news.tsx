import {useState} from 'react';
import {useLoaderData} from 'react-router';
import {getCloudflare} from '~/lib/cloudflare-context';
import {formatNewsletterDate} from '~/lib/format-newsletter-date';
import {mergeParentMeta} from '~/lib/meta';
import {mergeNewslettersByDate} from '~/lib/mix-newsletters';
import {mockNewsletters, mockPtaNewsletters} from '~/lib/mock-data';
import type {Newsletter} from '~/lib/types';
import type {Route} from './+types/news';

const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 8;

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
    const env = getCloudflare(context).env;
    const kvSchool = await env.BHE_NEWSLETTERS.get('latest', 'json');
    if (kvSchool) schoolNews = kvSchool as typeof schoolNews;
    const kvPta = await env.BHE_PTA_NEWSLETTERS.get('latest', 'json');
    if (kvPta) ptaNews = kvPta as typeof ptaNews;
  } catch {
    // KV not available in local dev — use mock data
  }

  return {news: mergeNewslettersByDate(schoolNews, ptaNews)};
}

export default function News() {
  const {news} = useLoaderData<typeof loader>();
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const displayedNews = news.slice(0, visibleCount);
  const hasMore = news.length > visibleCount;

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center">
          <h1 className="font-heading text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            News & Updates
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
            Eagle Updates and PTA newsletters, newest first
          </p>
          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-spirit-gold" />
        </div>
      </section>

      <section className="bg-warm-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4">
          {displayedNews.length > 0 ? (
            <ol className="relative border-l border-charcoal/15 pl-8 md:pl-10">
              {displayedNews.map((item, index) => (
                <li
                  className="news-feed-item relative pb-12 last:pb-0"
                  key={item.id}
                  style={{animationDelay: `${Math.min(index, 7) * 45}ms`}}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-1.5 -left-8 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-warm-white md:-left-10 ${
                      item.source === 'school' ? 'bg-eagle-blue' : 'bg-spirit-gold'
                    }`}
                  />
                  <NewsletterEntry newsletter={item} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-12 text-center text-lg text-charcoal/70">
              No newsletters available yet. Check back soon!
            </p>
          )}

          {hasMore && (
            <div className="mt-12 text-center">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-eagle-blue px-8 py-3 font-heading font-bold text-white transition-all duration-200 hover:bg-eagle-blue/90 hover:shadow-lg"
                onClick={() => setVisibleCount((count) => count + LOAD_MORE_STEP)}
                type="button"
              >
                Load more
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
        </div>
      </section>
    </div>
  );
}

function NewsletterEntry({newsletter}: {newsletter: Newsletter}) {
  const showExcerpt =
    Boolean(newsletter.excerpt) &&
    newsletter.excerpt.trim().toLowerCase() !== newsletter.title.trim().toLowerCase();

  return (
    <a
      className="group block rounded-lg bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg md:p-8"
      href={newsletter.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <time className="font-heading text-xs font-bold tracking-wider text-spirit-gold uppercase">
          {formatNewsletterDate(newsletter.date)}
        </time>
        <span
          className={`font-heading text-xs font-semibold tracking-wider uppercase ${
            newsletter.source === 'school' ? 'text-eagle-blue' : 'text-charcoal/55'
          }`}
        >
          {newsletter.source === 'school' ? 'Eagle Update' : 'PTA News'}
        </span>
      </div>

      <h2 className="font-heading text-xl font-bold text-charcoal transition-colors group-hover:text-eagle-blue md:text-2xl">
        {newsletter.title}
        <span className="sr-only"> (opens in new tab)</span>
      </h2>

      {showExcerpt && (
        <p className="mt-3 leading-relaxed text-charcoal/70">{newsletter.excerpt}</p>
      )}

      <span className="mt-4 inline-flex items-center text-sm font-semibold text-eagle-blue transition-colors group-hover:text-spirit-gold">
        Read more
        <span className="sr-only"> about {newsletter.title}</span>
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
      </span>
    </a>
  );
}
