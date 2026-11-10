import type {ReactNode} from 'react';

import {Container} from '~/components/ui/Container';
import {GreenBand} from '~/components/ui/GreenBand';

type GreenCtaProps = {
  action: ReactNode;
  lead: string;
  title: string;
};

export function GreenCta({action, lead, title}: GreenCtaProps) {
  return (
    <GreenBand className="py-16 md:py-24">
      <Container className="text-center">
        <h2 className="font-display text-[clamp(32px,4vw,48px)] font-extrabold tracking-[-0.02em] text-bhe-on-green">
          {title}
        </h2>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-bhe-gold" />
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-bhe-on-green-muted">
          {lead}
        </p>
        <div className="mt-8 flex justify-center">{action}</div>
      </Container>
    </GreenBand>
  );
}
