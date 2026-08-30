export const MISSING_ROUTE_ACTION_RE =
  /You made a \S+ request to "[^"]*" but did not provide an `action` for route/;

const ROOT_MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function messageFromUnknown(error: unknown): string | null {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') return error.message;
    if ('data' in error) {
      if (typeof error.data === 'string') return error.data;
      if (error.data instanceof Error) return error.data.message;
    }
  }
  return null;
}

/** React Router throws this when a mutating request hits a route with no `action`. */
export function isMissingRouteActionError(error: unknown): boolean {
  const message = messageFromUnknown(error);
  return message !== null && MISSING_ROUTE_ACTION_RE.test(message);
}

export function shouldDropSentryEvent(event: {
  exception?: {values?: Array<{value?: string}>};
}): boolean {
  return (event.exception?.values ?? []).some(
    (value) => typeof value.value === 'string' && MISSING_ROUTE_ACTION_RE.test(value.value),
  );
}

/** Bots POST to `/`; the homepage has no action, so answer 405 before React Router throws. */
export function methodNotAllowedForRootResponse(request: Request): Response | null {
  if (!ROOT_MUTATING_METHODS.has(request.method)) return null;
  const pathname = new URL(request.url).pathname;
  if (pathname !== '/') return null;
  return new Response(null, {
    headers: {Allow: 'GET, HEAD, OPTIONS'},
    status: 405,
  });
}
