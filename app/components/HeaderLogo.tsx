import {EagleLogo} from '~/components/EagleLogo';

type HeaderLogoProps = {
  compact?: boolean;
};

/**
 * Header wordmark: eagle + two-line school name (desktop) or Barton Hills / ELEMENTARY PTA (phone).
 */
export function HeaderLogo({compact = false}: HeaderLogoProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-2.5 text-bhe-green">
        <EagleLogo className="h-9 w-auto" />
        <span aria-hidden="true" className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-extrabold tracking-tight">
            Barton Hills
          </span>
          <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-bhe-muted">
            Elementary PTA
          </span>
        </span>
        <span className="sr-only">Barton Hills Elementary PTA</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 text-bhe-green">
      <EagleLogo className="h-[50px] w-auto" />
      <span aria-hidden="true" className="flex flex-col leading-none">
        <span className="font-display text-[21px] font-extrabold tracking-tight">
          Barton Hills Elementary
        </span>
        <span className="mt-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-bhe-muted">
          Parent Teacher Association
        </span>
      </span>
      <span className="sr-only">Barton Hills Elementary PTA</span>
    </span>
  );
}
