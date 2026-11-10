import {Container} from '~/components/ui/Container';
import {GreenBand} from '~/components/ui/GreenBand';

type PageHeroProps = {
  lead?: string;
  title: string;
};

/** Page title on the green eagle band used across the redesign. */
export function PageHero({lead, title}: PageHeroProps) {
  return (
    <GreenBand className="py-14 md:py-[88px]">
      <Container>
        <h1 className="max-w-4xl font-display text-[clamp(42px,6vw,76px)] font-extrabold leading-[0.98] tracking-[-0.035em] text-bhe-on-green">
          {title}
        </h1>
        {lead ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-bhe-on-green-muted md:text-xl">
            {lead}
          </p>
        ) : null}
      </Container>
    </GreenBand>
  );
}
