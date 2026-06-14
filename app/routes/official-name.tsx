import {mergeParentMeta} from '~/lib/meta';
import type {Route} from './+types/official-name';

const OFFICIAL_NAME = 'PTA Texas Congress Barton Hills Elementary';

export function meta({matches}: Route.MetaArgs) {
  return mergeParentMeta(matches, [
    {title: `Official Name | ${OFFICIAL_NAME}`},
    {
      name: 'description',
      content: `The official name of our parent teacher association is ${OFFICIAL_NAME}.`,
    },
  ]);
}

export default function OfficialName() {
  return (
    <div>
      <section className="relative bg-linear-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)',
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            Official Name
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            The registered name of our parent teacher association
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm font-heading font-semibold uppercase tracking-wider text-charcoal/60">
            Official Name
          </p>
          <p className="mt-4 text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-charcoal leading-tight">
            {OFFICIAL_NAME}
          </p>
          <div className="mt-8 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-8 text-lg text-charcoal/70 leading-relaxed">
            This is the name used on official PTA forms and correspondence.
          </p>
        </div>
      </section>
    </div>
  );
}
