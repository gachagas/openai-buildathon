# OpenAI Buildathon

## Repository layout

- `apps/web` — Vite + React 19 single-page application.

## Development

Requires Node.js 24 or newer and pnpm 11.13.1.

```sh
cd apps/web
pnpm install
pnpm dev
```

Run `pnpm lint` and `pnpm build` from `apps/web` before submitting changes.

## Deployment

The web app is packaged as static files in a Docker image and served by Caddy.
GitHub Actions validates app changes with lint and build checks. Railway's native
GitHub integration deploys `main` to the `web-playground` service in the
`playground` environment, using `/apps/web` as the service root and
`/apps/web/railway.json` as its config-as-code file.

Public URL: https://web-playground-playground.up.railway.app
