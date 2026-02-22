# Bryker Heights Elementary PTA Website

The official website for the Bryker Heights Elementary PTA, built with React Router 7 and deployed on Cloudflare Workers.

## Stack

- React Router 7 (SSR)
- Cloudflare Workers
- Tailwind CSS v4
- TypeScript

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The site will be available at `http://localhost:5173`.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server with HMR |
| `npm run build` | Production build |
| `npm run deploy` | Build + deploy to Cloudflare Workers |
| `npm run typecheck` | Full type check |
| `npm run preview` | Build + local preview |

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```
