import {RouterContextProvider} from 'react-router';

import {type CloudflareContextValue, cloudflareContext} from '~/lib/cloudflare-context';

/** Build a RR8 load context seeded with Cloudflare bindings for unit tests. */
export function createTestLoadContext(cloudflare: {
  ctx: ExecutionContext;
  // Partial mocks are intentional in unit tests.
  env: Record<string, unknown>;
}): RouterContextProvider {
  const context = new RouterContextProvider();
  context.set(cloudflareContext, cloudflare as unknown as CloudflareContextValue);
  return context;
}
