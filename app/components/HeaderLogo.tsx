/**
 * Header wordmark: line-art eagle + two-line school name,
 * vertical border, then PTA.
 */
export function HeaderLogo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        alt=""
        aria-hidden="true"
        className="h-9 w-auto sm:h-10"
        height={723}
        src="/eagle-mark.svg"
        width={1400}
      />
      <span aria-hidden="true" className="inline-flex items-center gap-2.5 sm:gap-3">
        <span className="flex flex-col font-heading text-[15px] font-bold leading-[1.05] tracking-tight text-white sm:text-base">
          <span>Barton Hills</span>
          <span>Elementary</span>
        </span>
        <span aria-hidden="true" className="self-stretch w-px bg-white/40" />
        <span className="font-heading text-2xl font-bold leading-none tracking-wide text-spirit-gold sm:text-3xl">
          PTA
        </span>
      </span>
      <span className="sr-only">Barton Hills Elementary PTA</span>
    </span>
  );
}
