# Barton Hills Elementary PTA Website

The official website for the Barton Hills Elementary PTA, built with React Router 7 and deployed on Cloudflare Workers.

## Stack

- React Router 7 (SSR)
- Cloudflare Workers
- Tailwind CSS v4
- TypeScript

## Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

The site will be available at `http://localhost:5173`.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Local dev server with HMR |
| `pnpm build` | Production build |
| `pnpm prod:deploy` | Build + deploy to Cloudflare Workers |
| `pnpm typecheck` | Full type check |
| `pnpm preview` | Build + local preview |

## Deployment

Deploy to Cloudflare Workers:

```bash
pnpm prod:deploy
```
