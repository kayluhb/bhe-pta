import {createContext, type RouterContextProvider} from 'react-router';

/**
 * Cloudflare bindings + execution context for loaders/actions.
 * Seeded in `workers/app.ts` via `RouterContextProvider.set`.
 */
export type CloudflareContextValue = {
  ctx: ExecutionContext;
  env: Env;
};

export const cloudflareContext = createContext<CloudflareContextValue>();

export function getCloudflare(context: Readonly<RouterContextProvider>): CloudflareContextValue {
  return context.get(cloudflareContext);
}
