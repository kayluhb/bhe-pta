import {cloudflare} from '@cloudflare/vite-plugin';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    // Default off: `remoteBindings: true` starts an edge-preview session and calls the
    // Cloudflare API; that fails without a working login/token. Set CF_REMOTE_BINDINGS=1
    // to use real remote KV/D1/R2/etc. after `wrangler login`.
    cloudflare({
      remoteBindings: process.env.CF_REMOTE_BINDINGS === '1',
      viteEnvironment: {name: 'ssr'},
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
