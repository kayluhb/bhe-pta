import {useState} from 'react';
import type {ArchiveItem} from '~/data/archive';
import {archiveData} from '~/data/archive';
import type {Route} from './+types/archive';

export function meta({}: Route.MetaArgs) {
  return [
    {title: 'Our History | Barton Hills Elementary PTA'},
    {
      name: 'description',
      content:
        'Browse the Barton Hills Elementary PTA archive — photos, newsletters, event flyers, and carnival memories from years past.',
    },
  ];
}

export function loader({}: Route.LoaderArgs) {
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
            A look back at the Barton Hills Elementary PTA community through the years — photos,
            newsletters, and memories from our Eagle family.
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
                  key={yearData.year}
                  yearData={yearData}
                  defaultOpen={index === 0}
                  onImageClick={setLightboxItem}
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
                className="h-8 w-8 text-eagle-blue"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
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
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxItem(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setLightboxItem(null);
          }}
          role="dialog"
          aria-label={lightboxItem.title}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={`https://archive.bheeagles.com/${lightboxItem.r2Key}`}
              alt={lightboxItem.title}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            <p className="mt-3 text-center text-white font-heading font-semibold">
              {lightboxItem.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Year Section ──────────────────────────────────────────────────────────

function YearSection({
  yearData,
  defaultOpen,
  onImageClick,
}: {
  yearData: (typeof archiveData)[number];
  defaultOpen: boolean;
  onImageClick: (item: ArchiveItem) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-charcoal/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-charcoal/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-eagle-blue text-white font-heading font-bold text-sm shrink-0">
            {yearData.year.slice(2, 4)}
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-charcoal">
              {yearData.year}
            </h2>
            {yearData.description && (
              <p className="text-sm text-charcoal/60 mt-0.5">{yearData.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-charcoal/40">
            {yearData.items.length} {yearData.items.length === 1 ? 'item' : 'items'}
          </span>
          <svg
            className={`h-5 w-5 text-charcoal/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-charcoal/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
            {yearData.items
              .slice()
              .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
              .map((item) => (
                <ItemCard key={item.id} item={item} onImageClick={onImageClick} />
              ))}
          </div>
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
        onClick={() => onImageClick(item)}
        className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-charcoal/5 cursor-pointer text-left"
      >
        {thumbUrl && (
          <img
            src={thumbUrl}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
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
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-4 p-4 rounded-lg bg-charcoal/[0.02] border border-charcoal/10 hover:border-eagle-blue/30 hover:bg-eagle-blue/[0.03] transition-all duration-200"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-eagle-blue/10 text-eagle-blue shrink-0 group-hover:bg-eagle-blue group-hover:text-white transition-colors duration-200">
        {item.type === 'pdf' ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        ) : (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
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
