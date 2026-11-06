type DateTileProps = {
  day: string | number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass = {
  sm: 'h-14 w-14 text-[11px]',
  md: 'h-20 w-[72px] text-xs',
  lg: 'h-24 w-[88px] text-sm',
} as const;

const dayClass = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
} as const;

export function DateTile({day, label, size = 'md'}: DateTileProps) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 flex-col items-center justify-center rounded-tile bg-bhe-green text-bhe-on-green ${sizeClass[size]}`}
    >
      <span className="font-bold uppercase tracking-[0.12em] text-bhe-gold">{label}</span>
      <span className={`font-display font-extrabold leading-none ${dayClass[size]}`}>{day}</span>
    </div>
  );
}
