import {useState} from 'react';

import {Container} from '~/components/ui/Container';
import {useTurnstile} from '~/hooks/useTurnstile';

type NewsletterSignupProps = {
  variant?: 'full' | 'compact' | 'sidebar';
};

export function NewsletterSignup({variant = 'full'}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const {
    token: turnstileToken,
    containerRef,
    reset,
  } = useTurnstile({
    theme: variant === 'compact' || variant === 'sidebar' ? 'dark' : 'light',
  });

  const emailId =
    variant === 'compact'
      ? 'newsletter-email-footer'
      : variant === 'sidebar'
        ? 'newsletter-email-sidebar'
        : 'newsletter-email';
  const errorId =
    variant === 'compact'
      ? 'subscribe-error-footer'
      : variant === 'sidebar'
        ? 'subscribe-error-sidebar'
        : 'subscribe-error';
  const hintId =
    variant === 'compact'
      ? 'newsletter-hint-footer'
      : variant === 'sidebar'
        ? 'newsletter-hint-sidebar'
        : 'newsletter-hint';

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setStatus('error');
      setMessage('Please complete the verification challenge.');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, turnstileToken}),
      });

      const data = (await response.json()) as {
        success?: boolean;
        alreadySubscribed?: boolean;
        error?: string;
      };

      if (data.success) {
        setStatus('success');
        setMessage(
          data.alreadySubscribed
            ? "You're already subscribed!"
            : "You're subscribed! Check your inbox.",
        );
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }

    reset();
  };

  if (variant === 'compact' || variant === 'sidebar') {
    const onGreen = variant === 'sidebar' || variant === 'compact';
    const describedBy = [!turnstileToken ? hintId : null, status === 'error' ? errorId : null]
      .filter(Boolean)
      .join(' ');

    const inner = (
      <>
        <h3
          className={
            variant === 'sidebar'
              ? 'font-display text-2xl font-extrabold text-bhe-on-green'
              : 'text-[13px] font-bold uppercase tracking-[0.12em] text-bhe-gold'
          }
        >
          {variant === 'sidebar' ? 'Never miss an event' : 'Newsletter'}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-bhe-on-green-muted">
          {variant === 'sidebar'
            ? 'PTA events, meetings, and school updates in your inbox.'
            : 'PTA events, meetings, and school updates in your inbox.'}
        </p>
        {status === 'success' ? (
          <p className="mt-4 text-sm font-medium text-bhe-gold" role="status">
            {message}
          </p>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor={emailId}>
              Email address
            </label>
            <input
              aria-describedby={describedBy || undefined}
              aria-invalid={status === 'error' ? true : undefined}
              aria-required="true"
              className="w-full rounded-full border-2 border-bhe-on-green/40 bg-white/10 px-4 py-2.5 text-bhe-on-green placeholder:text-bhe-on-green-muted focus:border-bhe-gold focus:outline-none focus:ring-2 focus:ring-bhe-gold"
              disabled={status === 'submitting'}
              id={emailId}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              type="email"
              value={email}
            />
            {status === 'submitting' && (
              <p className="sr-only" role="status">
                Subscribing…
              </p>
            )}
            <button
              aria-describedby={!turnstileToken ? hintId : undefined}
              className="w-full min-h-11 rounded-full bg-bhe-gold px-5 py-2.5 font-bold text-bhe-green transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status === 'submitting' || !turnstileToken}
              type="submit"
            >
              {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
            </button>
            {!turnstileToken && (
              <p className="text-xs text-bhe-on-green-muted" id={hintId}>
                Complete the security check below to enable Subscribe.
              </p>
            )}
            <section aria-label="Security verification">
              <div className="min-h-px" ref={containerRef} />
            </section>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-sm text-bhe-gold" id={errorId} role="alert">
            {message}
          </p>
        )}
      </>
    );

    if (variant === 'sidebar') {
      return <div className="rounded-panel bg-bhe-green p-6 text-bhe-on-green">{inner}</div>;
    }

    return <div className={onGreen ? '' : ''}>{inner}</div>;
  }

  return (
    <section className="py-12 md:py-[88px]" id="newsletter-signup">
      <Container>
        <div className="rounded-panel bg-bhe-gold px-6 py-10 text-bhe-green md:px-12 md:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.02em] md:text-[44px]">
              Get the Eagle Update
            </h2>
            <p className="mt-3 text-base leading-relaxed text-bhe-green md:text-[17px]">
              Stay up to date with PTA events, meetings, and important school information.
            </p>
            {status === 'success' ? (
              <div className="mt-8 rounded-card bg-bhe-paper/60 p-4" role="status">
                <p className="font-medium">{message}</p>
              </div>
            ) : (
              <form className="mt-8 space-y-4" onSubmit={handleSubscribe}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="sr-only" htmlFor={emailId}>
                    Email address
                  </label>
                  <input
                    aria-describedby={
                      [!turnstileToken ? hintId : null, status === 'error' ? errorId : null]
                        .filter(Boolean)
                        .join(' ') || undefined
                    }
                    aria-invalid={status === 'error' ? true : undefined}
                    aria-required="true"
                    className="min-h-11 flex-1 rounded-full border-2 border-bhe-green bg-white px-5 py-3 text-bhe-ink placeholder:text-bhe-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bhe-green"
                    disabled={status === 'submitting'}
                    id={emailId}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    type="email"
                    value={email}
                  />
                  <button
                    aria-describedby={!turnstileToken ? hintId : undefined}
                    className="min-h-11 shrink-0 rounded-full bg-bhe-green px-8 py-3 font-bold text-bhe-on-green transition-colors hover:bg-bhe-green-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={status === 'submitting' || !turnstileToken}
                    type="submit"
                  >
                    {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </div>
                {status === 'submitting' && (
                  <p className="sr-only" role="status">
                    Subscribing…
                  </p>
                )}
                {!turnstileToken && (
                  <p className="text-xs text-bhe-green/80" id={hintId}>
                    Complete the security check below to enable Subscribe.
                  </p>
                )}
                <section aria-label="Security verification" className="flex justify-center">
                  <div className="min-h-px" ref={containerRef} />
                </section>
              </form>
            )}
            {status === 'error' && (
              <p className="mt-3 text-sm text-bhe-error" id={errorId} role="alert">
                {message}
              </p>
            )}
            <p className="mt-4 text-xs font-medium text-bhe-green">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
