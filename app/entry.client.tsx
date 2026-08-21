import * as Sentry from '@sentry/react';
import {StrictMode, startTransition} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {HydratedRouter} from 'react-router/dom';

declare global {
  interface Window {
    __ENV?: {SENTRY_DSN?: string};
  }
}

function readSentryDsn(): string | undefined {
  const content = window.__ENV?.SENTRY_DSN?.trim();
  return content && content.length > 0 ? content : undefined;
}

const sentryDsn = readSentryDsn();
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: true,
    tracesSampleRate: 0.1,
  });
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
