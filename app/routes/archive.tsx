import {useEffect, useRef, useState} from 'react';
import type {ArchiveItem, ArchivePost, ArchiveYear} from '~/data/archive';
import {archiveData} from '~/data/archive';
import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/archive';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: 'Our History | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'Browse the Barton Hills Elementary PTA archive — blog posts, photos, newsletters, and memories from years past.',
    },
  ]);
}

export function loader(_args: Route.LoaderArgs) {
  return {years: archiveData};
}

export default function Archive({loaderData}: Route.ComponentProps) {
  const {years} = loaderData;
  const [lightboxItem, setLightboxItem] = useState<ArchiveItem | null>(null);

  return (
    <div>
      {/* ── 1. Page Banner ───────────────────────────────────────────────── */}
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
            Our History
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            A look back at the Barton Hills Elementary PTA community through the years — blog posts,
            photos, newsletters, and memories from our Eagle family.
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. Timeline ──────────────────────────────────────────────────── */}
      {years.length > 0 ? (
        <section className="bg-warm-white py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="space-y-8">
              {years.map((yearData, index) => (
                <YearSection
                  defaultOpen={index === 0}
                  key={yearData.year}
                  onImageClick={setLightboxItem}
                  yearData={yearData}
                />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-warm-white py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-eagle-blue/10 mb-6">
              <svg
                aria-hidden="true"
                className="h-8 w-8 text-eagle-blue"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">
              Archive Coming Soon
            </h2>
            <p className="mt-4 text-charcoal/70 max-w-md mx-auto">
              We're curating photos, newsletters, and memories from years of BHE PTA history. Check
              back soon!
            </p>
          </div>
        </section>
      )}

      {/* ── 3. Lightbox ──────────────────────────────────────────────────── */}
      {lightboxItem && <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />}
    </div>
  );
}

// ─── Lightbox ───────────────────────────────────────────────────────────────

function Lightbox({item, onClose}: {item: ArchiveItem; onClose: () => void}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [onClose]);

  return (
    <div
      aria-labelledby="lightbox-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      ref={dialogRef}
      role="dialog"
    >
      <button
        aria-label="Close lightbox"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-10 max-w-4xl w-full max-h-[90vh]">
        <button
          aria-label="Close"
          className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors cursor-pointer"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <img
          alt={item.title}
          className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
          src={`https://archive.bheeagles.com/${item.r2Key}`}
        />
        <p className="mt-3 text-center text-white font-heading font-semibold" id="lightbox-title">
          {item.title}
        </p>
      </div>
    </div>
  );
}

// ─── Year Section ──────────────────────────────────────────────────────────

function YearSection({
  yearData,
  defaultOpen,
  onImageClick,
}: {
  yearData: ArchiveYear;
  defaultOpen: boolean;
  onImageClick: (item: ArchiveItem) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const postCount = yearData.posts?.length ?? 0;
  const itemCount = yearData.items.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-charcoal/5 overflow-hidden">
      <button
        aria-controls={`year-panel-${yearData.year}`}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-charcoal/[0.02] transition-colors"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-eagle-blue text-white font-heading font-bold text-sm shrink-0">
            {yearData.year.slice(2, 4)}
          </div>
          <div>
            <h2
              className="text-xl md:text-2xl font-heading font-bold text-charcoal"
              id={`year-heading-${yearData.year}`}
            >
              {yearData.year}
            </h2>
            {yearData.description && (
              <p className="text-sm text-charcoal/60 mt-0.5">{yearData.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-charcoal/40">
            {postCount > 0 && (
              <>
                {postCount} {postCount === 1 ? 'post' : 'posts'}
                {itemCount > 0 && ' · '}
              </>
            )}
            {itemCount > 0 && (
              <>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </>
            )}
          </span>
          <svg
            aria-hidden="true"
            className={`h-5 w-5 text-charcoal/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <section
          aria-labelledby={`year-heading-${yearData.year}`}
          className="border-t border-charcoal/5"
          id={`year-panel-${yearData.year}`}
        >
          {/* ── Posts ── */}
          {yearData.posts && yearData.posts.length > 0 && (
            <div className="px-6 pt-5 pb-2">
              <div className="space-y-3">
                {yearData.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* ── Media Items ── */}
          {yearData.items.length > 0 && (
            <MediaSection items={yearData.items} onImageClick={onImageClick} />
          )}
        </section>
      )}
    </div>
  );
}

// ─── Post Card ──────────────────────────────────────────────────────────────

function formatPostDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
}

function PostCard({post}: {post: ArchivePost}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="group rounded-lg border border-charcoal/8 bg-charcoal/[0.01] overflow-hidden transition-colors hover:border-eagle-blue/20">
      <button
        className="w-full text-left px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        type="button"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <time className="text-xs font-medium text-charcoal/50" dateTime={post.date}>
                {formatPostDate(post.date)}
              </time>
              {post.category && post.category !== 'News' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-spirit-gold/15 text-spirit-gold">
                  {post.category}
                </span>
              )}
            </div>
            <h3 className="text-base font-heading font-semibold text-charcoal group-hover:text-eagle-blue transition-colors leading-snug">
              {post.title}
            </h3>
            {!expanded && post.excerpt && (
              <p className="mt-1.5 text-sm text-charcoal/60 line-clamp-2 leading-relaxed">
                {post.excerpt}
              </p>
            )}
          </div>
          <svg
            aria-hidden="true"
            className={`h-4 w-4 text-charcoal/30 shrink-0 mt-1.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-charcoal/5">
          <div
            className="prose prose-sm max-w-none pt-4
              prose-headings:font-heading prose-headings:text-charcoal
              prose-p:text-charcoal/80 prose-p:leading-relaxed
              prose-a:text-eagle-blue prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:max-h-96 prose-img:w-auto
              prose-table:text-sm
              [&_img]:my-3 [&_table]:my-3"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Static WordPress HTML embedded in curated archive data.
            dangerouslySetInnerHTML={{__html: post.content}}
          />
        </div>
      )}
    </article>
  );
}

// ─── Media Section (collapsible) ────────────────────────────────────────────

function MediaSection({
  items,
  onImageClick,
}: {
  items: ArchiveItem[];
  onImageClick: (item: ArchiveItem) => void;
}) {
  const [showMedia, setShowMedia] = useState(false);

  return (
    <div className="px-6 pb-5 pt-3">
      <button
        className="flex items-center gap-2 text-sm font-heading font-semibold text-charcoal/50 hover:text-eagle-blue transition-colors cursor-pointer"
        onClick={() => setShowMedia(!showMedia)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Photos &amp; Documents ({items.length})
        <svg
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${showMedia ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {showMedia && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {items
            .slice()
            .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
            .map((item) => (
              <ItemCard item={item} key={item.id} onImageClick={onImageClick} />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Item Card ─────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onImageClick,
}: {
  item: ArchiveItem;
  onImageClick: (item: ArchiveItem) => void;
}) {
  const fileUrl = `https://archive.bheeagles.com/${item.r2Key}`;
  const thumbUrl = item.thumbnailR2Key
    ? `https://archive.bheeagles.com/${item.thumbnailR2Key}`
    : item.type === 'image'
      ? fileUrl
      : null;

  if (item.type === 'image') {
    return (
      <button
        className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-charcoal/5 cursor-pointer text-left"
        onClick={() => onImageClick(item)}
        type="button"
      >
        {thumbUrl && (
          <img
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            src={thumbUrl}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <p className="text-white text-sm font-heading font-semibold">{item.title}</p>
          {item.description && <p className="text-white/80 text-xs mt-0.5">{item.description}</p>}
        </div>
      </button>
    );
  }

  // PDF / Document card
  return (
    <a
      className="group flex items-start gap-4 p-4 rounded-lg bg-charcoal/[0.02] border border-charcoal/10 hover:border-eagle-blue/30 hover:bg-eagle-blue/[0.03] transition-all duration-200"
      href={fileUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-eagle-blue/10 text-eagle-blue shrink-0 group-hover:bg-eagle-blue group-hover:text-white transition-colors duration-200">
        {item.type === 'pdf' ? (
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-heading font-semibold text-charcoal group-hover:text-eagle-blue transition-colors">
          {item.title}
        </p>
        {item.description && <p className="text-xs text-charcoal/60 mt-0.5">{item.description}</p>}
        <p className="text-xs text-charcoal/40 mt-1 uppercase tracking-wide">
          {item.type === 'pdf' ? 'PDF' : 'Document'}
        </p>
      </div>
    </a>
  );
}
