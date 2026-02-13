import { createRequestHandler } from "react-router";

interface Env {
  BHE_NEWSLETTERS: KVNamespace;
  BHE_PTA_NEWSLETTERS: KVNamespace;
  BHE_CALENDAR: KVNamespace;
  MAILCHIMP_API_KEY: string;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
