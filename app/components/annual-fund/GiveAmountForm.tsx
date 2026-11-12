import {buildGiveCheckoutUrl} from '~/lib/give-checkout-url';

type GiveAmountFormProps = {
  ask: number;
  giveBaseUrl: string;
};

const FULL_COST_PER_STUDENT = 930;

export function GiveAmountForm({ask, giveBaseUrl}: GiveAmountFormProps) {
  const checkoutUrl = buildGiveCheckoutUrl({
    baseUrl: giveBaseUrl,
    utmContent: 'give-form',
  });

  return (
    <div className="rounded-panel bg-bhe-card p-6 shadow-form md:p-8">
      <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-green-2">
        Suggested gift
      </p>
      <p className="mt-2 font-display text-5xl font-extrabold leading-none text-bhe-ink">${ask}</p>
      <p className="mt-2 text-sm text-bhe-muted">per child · PTA membership included</p>
      <p className="mt-5 text-[15px] leading-relaxed text-bhe-body">
        The PTA invests about ${FULL_COST_PER_STUDENT} per student each year. Give what you can —
        every amount helps close the gap for every Eagle.
      </p>
      <a
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-bhe-gold px-6 py-3.5 text-base font-extrabold text-bhe-green hover:brightness-95"
        href={checkoutUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Continue to payment
        <span className="sr-only"> (opens in new tab)</span>
      </a>
      <p className="mt-3 text-center text-xs text-bhe-muted">
        Secure checkout via CheddarUp. Choose your amount and frequency on the payment site.
      </p>
    </div>
  );
}
