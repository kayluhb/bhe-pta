const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

const descriptionClassName =
  'mt-1.5 text-sm text-charcoal/70 leading-relaxed [&_p+p]:mt-2 [&_a]:text-eagle-blue [&_a]:underline [&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-4';

export function EventDescription({html}: {html: string}) {
  if (HTML_TAG_RE.test(html)) {
    return (
      <div
        className={descriptionClassName}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Descriptions are allowlist-sanitized in sanitizeEventDescription.
        dangerouslySetInnerHTML={{__html: html}}
      />
    );
  }
  return <p className="mt-1.5 text-sm text-charcoal/70 leading-relaxed">{html}</p>;
}

interface EventCardProps {
  month: string;
  day: string;
  title: string;
  description: string;
}

export function EventCard({month, day, title, description}: EventCardProps) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-lg bg-white shadow-md">
      {/* Date badge — stretches with row height */}
      <div className="flex flex-col items-center justify-start bg-white text-creek-green px-4 py-4 min-w-[72px] shrink-0 self-stretch">
        <span className="text-xs font-heading font-bold uppercase tracking-wider text-creek-green/70">
          {month}
        </span>
        <span className="text-2xl font-heading font-bold leading-tight">{day}</span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0 px-5 py-4">
        <h3 className="font-heading font-bold text-charcoal text-base leading-snug">{title}</h3>
        <EventDescription html={description} />
      </div>
    </div>
  );
}
