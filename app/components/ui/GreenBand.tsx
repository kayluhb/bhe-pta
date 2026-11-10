import type {ReactNode} from 'react';

import {EagleLogo} from '~/components/EagleLogo';

type GreenBandProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/** Full-bleed green band with the large cream eagle watermark from the redesign. */
export function GreenBand({children, className, id}: GreenBandProps) {
  return (
    <section
      className={['relative overflow-hidden bg-bhe-green text-bhe-on-green', className]
        .filter(Boolean)
        .join(' ')}
      id={id}
    >
      <EagleLogo className="pointer-events-none absolute -bottom-16 -left-16 h-auto w-[min(920px,170vw)] text-bhe-on-green opacity-[0.07] md:-bottom-20 md:-left-[120px]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
