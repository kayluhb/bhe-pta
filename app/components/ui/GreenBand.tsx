import type {ReactNode} from 'react';

import {EagleLogo} from '~/components/EagleLogo';

type GreenBandProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function GreenBand({children, className, id}: GreenBandProps) {
  return (
    <section
      className={['relative overflow-hidden bg-bhe-green text-bhe-on-green', className]
        .filter(Boolean)
        .join(' ')}
      id={id}
    >
      <EagleLogo className="pointer-events-none absolute -right-16 -bottom-10 h-[280px] w-auto text-bhe-on-green opacity-[0.07] md:h-[360px]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}
