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

The web app is packaged as static files in a Docker image and served by Caddy. On
pushes to `main` that affect the app or its deployment workflow, GitHub Actions
validates the app and deploys the image to the Railway `web-playground` service
in the `playground` environment. Railway is configured in
`apps/web/railway.json`; the workflow uses the `RAILWAY_TOKEN` repository secret.

Public URL: https://web-playground-playground.up.railway.app
