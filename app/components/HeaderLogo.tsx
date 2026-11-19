import {type PointerEvent, useRef, useState} from 'react';

import {EagleLogo} from '~/components/EagleLogo';

type HeaderLogoProps = {
  compact?: boolean;
};

/**
 * Flaps the eagle's wings while a mouse is over the logo. The flap keeps going until the current
 * beat finishes, so the wings always settle back into the resting pose instead of snapping.
 * Touch is ignored because a tap leaves the logo "hovered" until the next tap elsewhere.
 */
function useFlapOnHover() {
  const [flapping, setFlapping] = useState(false);
  const hovered = useRef(false);

  return {
    flapping,
    hoverHandlers: {
      onAnimationIteration: () => {
        if (!hovered.current) setFlapping(false);
      },
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        hovered.current = true;
        setFlapping(true);
      },
      onPointerLeave: () => {
        hovered.current = false;
      },
    },
  };
}

/**
 * Header wordmark: eagle + two-line school name (desktop) or Barton Hills / ELEMENTARY PTA (phone).
 */
export function HeaderLogo({compact = false}: HeaderLogoProps) {
  const {flapping, hoverHandlers} = useFlapOnHover();
  const flapClassName = flapping ? ' eagle-flap' : '';

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-2.5 text-bhe-green${flapClassName}`}
        {...hoverHandlers}
      >
        <EagleLogo className="h-9 w-auto" wings />
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
    <span
      className={`inline-flex items-center gap-3 text-bhe-green${flapClassName}`}
      {...hoverHandlers}
    >
      <EagleLogo className="h-[50px] w-auto" wings />
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
