import {Link} from 'react-router';

interface NewsCardProps {
  date: string;
  title: string;
  excerpt: string;
  to?: string;
}

export function NewsCard({date, title, excerpt, to}: NewsCardProps) {
  const content = (
    <div className="group bg-white rounded-lg shadow-md border-t-4 border-eagle-blue overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 h-full flex flex-col">
      <div className="p-6 flex flex-col flex-1">
        <span className="text-xs font-heading font-bold uppercase tracking-wider text-spirit-gold">
          {date}
        </span>
        <h3 className="mt-2 font-heading font-bold text-charcoal text-lg group-hover:text-eagle-blue transition-colors">
          {title}
        </h3>
        {excerpt && (
          <p className="mt-2 text-sm text-charcoal/70 leading-relaxed line-clamp-3 flex-1">
            {excerpt}
          </p>
        )}
        {to && (
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-eagle-blue group-hover:text-spirit-gold transition-colors">
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

  if (to) {
    return (
      <Link className="block h-full" to={to}>
        {content}
      </Link>
    );
  }

  return content;
}
