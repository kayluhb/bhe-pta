import {useCallback, useEffect, useRef, useState} from 'react';

const TURNSTILE_SITE_KEY = '0x4AAAAAACeBDkCW901l9jWe';

export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || widgetIdRef.current !== null) return;
    const turnstile = window.turnstile;
    if (!turnstile) return;
    widgetIdRef.current = turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (t: string) => setToken(t),
      'expired-callback': () => setToken(null),
      'error-callback': () => setToken(null),
      theme: 'light',
    });
  }, []);

  useEffect(() => {
    if (window.turnstile) {
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
          window.turnstile?.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  const reset = useCallback(() => {
    if (widgetIdRef.current !== null) {
      try {
        window.turnstile?.reset(widgetIdRef.current);
      } catch {}
      setToken(null);
    }
  }, []);

  return {token, containerRef, reset};
}
