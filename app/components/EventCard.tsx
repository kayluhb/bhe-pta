interface EventCardProps {
  month: string;
  day: string;
  title: string;
  description: string;
}

export function EventCard({month, day, title, description}: EventCardProps) {
  return (
    <div className="flex h-full min-h-0 bg-white rounded-lg shadow-md border-l-4 border-spirit-gold overflow-hidden">
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
        <p className="mt-1.5 text-sm text-charcoal/70 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
