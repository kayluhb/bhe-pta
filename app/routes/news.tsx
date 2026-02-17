import { useState, useRef, useEffect, useCallback } from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/news";
import {
  mockNewsletters,
  mockPtaNewsletters,
} from "~/lib/mock-data";
import type { Newsletter } from "~/lib/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "News & Updates | Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "Read the latest Eagle Updates from Principal Achtermann and PTA newsletters.",
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
  const [visibleCount, setVisibleCount] = useState<Record<string, number>>({ school: 5, pta: 5 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({ school: null, pta: null });

  const tabs = [
    { id: "school" as const, label: "Eagle Updates" },
    { id: "pta" as const, label: "PTA News" },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent, tabId: "school" | "pta") => {
    const tabIds = tabs.map((t) => t.id);
    const currentIndex = tabIds.indexOf(tabId);

    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabIds.length;
    } else if (e.key === "ArrowLeft") {
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
  const allNews = activeTab === "school" ? sortedSchoolNews : sortedPtaNews;
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
              "repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)",
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
          <div role="tablist" aria-label="Newsletter categories" className="flex border-b-2 border-charcoal/10 mb-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className={`relative pb-3 px-5 font-heading font-bold text-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "text-eagle-blue"
                    : "text-charcoal/70 hover:text-charcoal/80"
                }`}
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
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="space-y-6"
          >
            {displayedNews.map((item) => (
              <NewsletterCard key={item.id} newsletter={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() =>
                  setVisibleCount((prev) => ({
                    ...prev,
                    [activeTab]: prev[activeTab] + 5,
                  }))
                }
                className="inline-flex items-center gap-2 px-8 py-3 bg-eagle-blue text-white font-heading font-bold rounded-full hover:bg-eagle-blue/90 transition-all duration-200 hover:shadow-lg cursor-pointer"
              >
                Load More
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
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

      {/* ── Newsletter Signup ───────────────────────────────────────────── */}
      <NewsletterSignup />
    </div>
  );
}

// ─── Newsletter Signup ────────────────────────────────────────────────────────

const TURNSTILE_SITE_KEY = "0x4AAAAAACeBDkCW901l9jWe";

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!turnstileRef.current || widgetIdRef.current !== null) return;
    const turnstile = (window as any).turnstile;
    if (!turnstile) return;
    widgetIdRef.current = turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
      theme: "light",
    });
  }, []);

  useEffect(() => {
    if ((window as any).turnstile) {
      renderWidget();
      return;
    }

    const existing = document.querySelector('script[src*="turnstile"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => renderWidget();
      document.head.appendChild(script);
    } else {
      existing.addEventListener("load", renderWidget);
    }

    return () => {
      if (widgetIdRef.current !== null) {
        try { (window as any).turnstile?.remove(widgetIdRef.current); } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setStatus("error");
      setMessage("Please complete the verification challenge.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const data = (await response.json()) as { success?: boolean; alreadySubscribed?: boolean; error?: string };

      if (data.success) {
        setStatus("success");
        setMessage(data.alreadySubscribed ? "You're already subscribed!" : "You're subscribed! Check your inbox.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }

    if (widgetIdRef.current !== null) {
      try { (window as any).turnstile?.reset(widgetIdRef.current); } catch {}
      setTurnstileToken(null);
    }
  };

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-warm-white rounded-lg shadow-lg p-8 md:p-12 text-center border-t-4 border-spirit-gold">
          <svg
            className="mx-auto h-12 w-12 text-spirit-gold"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <h2 className="mt-4 text-2xl md:text-3xl font-heading font-bold text-charcoal">
            Newsletter Signup
          </h2>
          <p className="mt-3 text-charcoal/70 leading-relaxed">
            Stay up to date with PTA events, meetings, and important school
            information.
          </p>
          {status === "success" ? (
            <div className="mt-8 p-4 bg-creek-green/10 rounded-lg" role="status">
              <p className="text-creek-green font-medium">{message}</p>
            </div>
          ) : (
            <form
              className="mt-8 space-y-4"
              onSubmit={handleSubscribe}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="news-newsletter-email" className="sr-only">Email address</label>
                <input
                  id="news-newsletter-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3 rounded-full border border-charcoal/20 focus:outline-none focus:border-eagle-blue focus:ring-2 focus:ring-eagle-blue/20 text-charcoal placeholder:text-charcoal/70"
                  required
                  aria-required="true"
                  aria-describedby={status === "error" ? "news-subscribe-error" : undefined}
                  aria-invalid={status === "error" ? true : undefined}
                  disabled={status === "submitting"}
                />
                <button
                  type="submit"
                  disabled={status === "submitting" || !turnstileToken}
                  className="bg-spirit-gold text-night-blue font-heading font-bold px-8 py-3 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Subscribing..." : "Subscribe"}
                </button>
              </div>
              <div className="flex justify-center">
                <div ref={turnstileRef} />
              </div>
            </form>
          )}
          {status === "error" && (
            <p id="news-subscribe-error" role="alert" className="mt-3 text-sm text-red-600">{message}</p>
          )}
          <p className="mt-4 text-xs text-charcoal/70">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
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
        {newsletter.excerpt && (
          <p className="mt-3 text-charcoal/70 leading-relaxed">
            {newsletter.excerpt}
          </p>
        )}
        <a
          href={newsletter.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center text-sm font-semibold text-eagle-blue group-hover:text-spirit-gold transition-colors"
        >
          Read more about {newsletter.title}
          <span className="sr-only"> (opens in new tab)</span>
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
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
