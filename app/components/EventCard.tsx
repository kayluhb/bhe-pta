import { Link } from "react-router";

interface EventCardProps {
  month: string;
  day: string;
  title: string;
  description: string;
  to?: string;
}

export function EventCard({
  month,
  day,
  title,
  description,
  to,
}: EventCardProps) {
  const content = (
    <div className="group flex bg-white rounded-lg shadow-md border-l-4 border-spirit-gold overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Date Badge */}
      <div className="flex flex-col items-center justify-center bg-white text-creek-green px-4 py-4 min-w-[72px]">
        <span className="text-xs font-heading font-bold uppercase tracking-wider text-creek-green/70">
          {month}
        </span>
        <span className="text-2xl font-heading font-bold leading-tight">
          {day}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-center px-5 py-4">
        <h3 className="font-heading font-bold text-charcoal text-base group-hover:text-eagle-blue transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-sm text-charcoal/60 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
