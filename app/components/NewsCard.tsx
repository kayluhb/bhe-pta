import {Link} from 'react-router';

interface NewsCardProps {
  date: string;
  excerpt: string;
  title: string;
  to?: string;
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function NewsCard({date, excerpt, title, to}: NewsCardProps) {
  const content = (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-md ${
        to
          ? 'group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg'
          : ''
      }`}
    >
      <div className="flex flex-1 flex-col p-6">
        <span className="font-heading text-xs font-bold tracking-wider text-spirit-gold uppercase">
          {date}
        </span>
        <h3 className="mt-2 font-heading text-lg font-bold text-charcoal transition-colors group-hover:text-eagle-blue">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal/70 line-clamp-3">
            {excerpt}
          </p>
        )}
        {to && (
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-eagle-blue transition-colors group-hover:text-spirit-gold">
            Read more<span className="sr-only"> about {title}</span>
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
        )}
      </div>
    </div>
  );

  if (!to) return content;

  if (isExternalUrl(to)) {
    return (
      <a className="block h-full" href={to} rel="noopener noreferrer" target="_blank">
        {content}
      </a>
    );
  }

  return (
    <Link className="block h-full" to={to}>
      {content}
    </Link>
  );
}
