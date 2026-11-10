import type {ReactNode} from 'react';

export type TagTint = 'green' | 'gold' | 'blue';

const tintClass: Record<TagTint, string> = {
  green: 'bg-bhe-tint-green',
  gold: 'bg-bhe-tint-gold',
  blue: 'bg-bhe-tint-blue',
};

type TagPillProps = {
  children: ReactNode;
  className?: string;
  tint?: TagTint;
};

export function TagPill({children, className, tint = 'green'}: TagPillProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-bhe-ink',
        tintClass[tint],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
