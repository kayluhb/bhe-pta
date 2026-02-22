import {useCallback, useEffect, useRef, useState} from 'react';

const TURNSTILE_SITE_KEY = '0x4AAAAAACeBDkCW901l9jWe';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!turnstileRef.current || widgetIdRef.current !== null) return;
    const turnstile = (window as any).turnstile;
    if (!turnstile) return;
    widgetIdRef.current = turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(null),
      'error-callback': () => setTurnstileToken(null),
      theme: 'light',
    });
  }, []);

  useEffect(() => {
    if ((window as any).turnstile) {
      renderWidget();
      return;
    }

    const existing = document.querySelector('script[src*="turnstile"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => renderWidget();
      document.head.appendChild(script);
    } else {
      existing.addEventListener('load', renderWidget);
    }

    return () => {
      if (widgetIdRef.current !== null) {
        try {
          (window as any).turnstile?.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

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

    // Reset Turnstile widget after submission attempt
    if (widgetIdRef.current !== null) {
      try {
        (window as any).turnstile?.reset(widgetIdRef.current);
      } catch {}
      setTurnstileToken(null);
    }
  };

  return (
    <section className="bg-warm-white py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 text-center border-t-4 border-spirit-gold">
          <svg
            className="mx-auto h-12 w-12 text-spirit-gold"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
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
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-5 py-3 rounded-full border border-charcoal/20 focus:outline-none focus:border-eagle-blue focus:ring-2 focus:ring-eagle-blue/20 text-charcoal placeholder:text-charcoal/70"
                  required
                  aria-required="true"
                  aria-describedby={status === 'error' ? 'subscribe-error' : undefined}
                  aria-invalid={status === 'error' ? true : undefined}
                  disabled={status === 'submitting'}
                />
                <button
                  type="submit"
                  disabled={status === 'submitting' || !turnstileToken}
                  className="bg-spirit-gold text-night-blue font-heading font-bold px-8 py-3 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
            </form>
          )}
          {status === 'error' && (
            <p id="subscribe-error" role="alert" className="mt-3 text-sm text-red-600">
              {message}
            </p>
          )}
          <p className="mt-4 text-xs text-charcoal/70">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <div aria-label="Security verification" ref={turnstileRef} />
      </div>
    </section>
  );
}
