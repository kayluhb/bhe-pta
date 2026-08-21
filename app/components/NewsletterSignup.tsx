import {useState} from 'react';
import {useTurnstile} from '~/hooks/useTurnstile';

type NewsletterSignupProps = {
  variant?: 'full' | 'compact';
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
    theme: variant === 'compact' ? 'dark' : 'light',
  });

  const emailId = variant === 'compact' ? 'newsletter-email-footer' : 'newsletter-email';
  const errorId = variant === 'compact' ? 'subscribe-error-footer' : 'subscribe-error';
  const hintId = variant === 'compact' ? 'newsletter-hint-footer' : 'newsletter-hint';

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

  if (variant === 'compact') {
    const describedBy = [!turnstileToken ? hintId : null, status === 'error' ? errorId : null]
      .filter(Boolean)
      .join(' ');

    return (
      <div>
        <h3 className="text-white font-heading font-bold text-lg">Newsletter</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/80">
          PTA events, meetings, and school updates in your inbox.
        </p>
        {status === 'success' ? (
          <p className="mt-4 text-sm text-spirit-gold font-medium" role="status">
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
              className="w-full px-4 py-2.5 rounded-full border border-white/50 bg-white/20 text-white placeholder:text-white/70 focus:outline-none focus:border-spirit-gold focus:ring-2 focus:ring-spirit-gold"
              disabled={status === 'submitting'}
              id={emailId}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              required
              type="email"
              value={email}
            />
            <section aria-label="Security verification">
              <div className="min-h-px" ref={containerRef} />
            </section>
            {!turnstileToken && (
              <p className="text-xs text-white/80" id={hintId}>
                Complete the security check above to enable Subscribe.
              </p>
            )}
            {status === 'submitting' && (
              <p className="sr-only" role="status">
                Subscribing…
              </p>
            )}
            <button
              aria-describedby={!turnstileToken ? hintId : undefined}
              className="w-full bg-spirit-gold text-night-blue font-heading font-bold px-5 py-2.5 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 motion-reduce:transition-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={status === 'submitting' || !turnstileToken}
              type="submit"
            >
              {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-sm text-red-300" id={errorId} role="alert">
            {message}
          </p>
        )}
        <p className="mt-3 text-xs text-white/60">Unsubscribe anytime.</p>
      </div>
    );
  }

  return (
    <section className="bg-warm-white py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 text-center border-t-4 border-spirit-gold">
          <svg
            aria-hidden="true"
            className="mx-auto h-12 w-12 text-spirit-gold"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="mt-4 text-2xl md:text-3xl font-heading font-bold text-charcoal">
            Newsletter Signup
          </h2>
          <p className="mt-3 text-charcoal/70 leading-relaxed">
            Stay up to date with PTA events, meetings, and important school information.
          </p>
          {status === 'success' ? (
            <div className="mt-8 p-4 bg-creek-green/10 rounded-lg" role="status">
              <p className="text-creek-green font-medium">{message}</p>
            </div>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={handleSubscribe}>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="sr-only" htmlFor={emailId}>
                  Email address
                </label>
                <input
                  aria-describedby={status === 'error' ? errorId : undefined}
                  aria-invalid={status === 'error' ? true : undefined}
                  aria-required="true"
                  className="flex-1 px-5 py-3 rounded-full border border-charcoal/20 focus:outline-none focus:border-eagle-blue focus:ring-2 focus:ring-eagle-blue/20 text-charcoal placeholder:text-charcoal/70"
                  disabled={status === 'submitting'}
                  id={emailId}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  type="email"
                  value={email}
                />
                <button
                  className="bg-spirit-gold text-night-blue font-heading font-bold px-8 py-3 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 motion-reduce:transition-none hover:shadow-lg hover:shadow-spirit-gold/25 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={status === 'submitting' || !turnstileToken}
                  type="submit"
                >
                  {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
            </form>
          )}
          {status === 'error' && (
            <p className="mt-3 text-sm text-red-600" id={errorId} role="alert">
              {message}
            </p>
          )}
          <p className="mt-4 text-xs text-charcoal/70">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <section aria-label="Security verification">
          <div className="min-h-px" ref={containerRef} />
        </section>
      </div>
    </section>
  );
}
