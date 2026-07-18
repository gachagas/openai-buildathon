# Tasks: push-to-main → build & deploy to Railway (new service, monorepo project, playground env)

Execute the tasks below **in order**. Each task is self-contained and ends with a check.

**Current state (verified 2026-07-18):** the Vite + React 19 SPA lives untracked in `src/` (its own `package.json`, `pnpm-lock.yaml`, `vite.config.ts`). No CI, no Railway config, no Dockerfile exists. Remote is `git@github.com:gachagas/openai-buildathon.git`, branch `main`. Local toolchain: pnpm 11.13.1, Node 24.

**Target:** a GitHub Actions workflow deploys the app on every push to `main` into a **new service `web-playground`** in the existing Railway **monorepo** project, **playground** environment, served as static files by Caddy from a Docker image.

---

## Task 1 — Restructure repo and commit the app

1. `mkdir -p apps && mv src apps/web` (plain `mv` — `src/` is untracked, no `git mv` needed).
2. In `apps/web/package.json`:
   - `"name": "src"` → `"name": "web"`
   - add `"packageManager": "pnpm@11.13.1"`
   - add `"engines": { "node": ">=24" }`
3. Create `.nvmrc` at repo root containing `24`.
4. In `apps/web/index.html`, change `<title>src</title>` to `<title>web</title>` (or the real app name).
5. Ensure `apps/web/.gitignore` covers `node_modules` and `dist` (the Vite template one already should).
6. Replace the root `README.md` (currently just `pnpm dev`) with: repo layout (`apps/web` = the Vite SPA), dev commands (`cd apps/web && pnpm install && pnpm dev`), and a Deployment section summarizing this file.
7. Commit everything: `AGENTS.md`, `README.md`, `TASKS.md`, `.nvmrc`, `apps/`.

**Check:** `git status` is clean; `cd apps/web && pnpm install && pnpm build` succeeds and produces `apps/web/dist/index.html`.

## Task 2 — Dockerfile + Caddy static serving

Create these three files in `apps/web/`:

**`apps/web/Dockerfile`**
```dockerfile
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
```

**`apps/web/Caddyfile`**
```
:{$PORT}

root * /srv
encode gzip
try_files {path} /index.html
file_server
```
(Railway injects `PORT`; Caddy must bind to it. `try_files` is the SPA fallback.)

**`apps/web/.dockerignore`**
```
node_modules
dist
.git
```

**Check (if Docker is available):** `cd apps/web && docker build -t web-playground . && docker run --rm -e PORT=8080 -p 8080:8080 web-playground`, then `curl -s localhost:8080/` and `curl -s localhost:8080/some/route` both return the SPA's `index.html`. If Docker isn't available, skip — the first Railway deploy in Task 3 is the check.

## Task 3 — Railway config + one-time service provisioning

1. Create **`apps/web/railway.json`**:
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": { "builder": "DOCKERFILE", "dockerfilePath": "Dockerfile" },
  "deploy": { "restartPolicyType": "ON_FAILURE", "restartPolicyMaxRetries": 3 }
}
```
2. One-time provisioning with the Railway CLI (`npm i -g @railway/cli` if missing). **Requires auth**: either `railway login` interactively, or `export RAILWAY_TOKEN=<project token>` — the user must supply a **project token created in the monorepo project's dashboard, scoped to the `playground` environment**. Then:
   ```sh
   railway link          # pick the monorepo project + playground environment (skip if RAILWAY_TOKEN is set — it's already scoped)
   railway add --service web-playground
   cd apps/web && railway up --service web-playground --ci
   railway domain --service web-playground
   ```
3. Record the generated public URL in the root README's Deployment section.

Note: with CLI deploys the upload context is the cwd (`apps/web`), so no dashboard "root directory" setting is needed.

**Check:** Railway dashboard shows service `web-playground` in the **playground** environment with a successful deployment, and the generated domain serves the app.

## Task 4 — GitHub Actions workflow

Create **`.github/workflows/deploy.yml`**:

```yaml
name: Deploy web to Railway (playground)

on:
  push:
    branches: [main]
    paths:
      - "apps/web/**"
      - ".github/workflows/deploy.yml"
  workflow_dispatch:

concurrency:
  group: deploy-web-playground
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
          cache-dependency-path: apps/web/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
      - run: npm i -g @railway/cli
      - run: railway up --service web-playground --ci
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Notes:
- The CI build (`pnpm lint` + `pnpm build`) is a fail-fast gate; Railway rebuilds inside Docker regardless.
- `pnpm/action-setup@v4` reads the version from `packageManager` in `apps/web/package.json`; if it can't find it from the working directory, pass `version: 11.13.1` explicitly.
- The project token is project+environment scoped, so `railway up` targets **playground** automatically.

**Check:** `.github/workflows/deploy.yml` passes `actionlint` (or at minimum valid YAML) and is committed.

## Task 5 — Secret + end-to-end verification

1. Set the repo secret (user supplies the same playground-scoped project token from Task 3):
   ```sh
   gh secret set RAILWAY_TOKEN --repo gachagas/openai-buildathon
   ```
   If `gh` isn't authenticated, add it manually: GitHub → repo → Settings → Secrets and variables → Actions.
2. Push everything to `main`.
3. Verify end-to-end:
   - The `Deploy web to Railway (playground)` action runs green.
   - Railway shows a new deployment on `web-playground` in **playground**.
   - `curl -I https://<railway-domain>/` → 200, and `curl -s https://<railway-domain>/any/client/route` returns the SPA `index.html` (Caddy fallback).
   - Push a trivial visible change to `main` and confirm it appears on the deployed site after the action completes.

---

## Only external dependency

A **Railway project token** for the monorepo project scoped to the **playground** environment (dashboard → project → Settings → Tokens). It is used twice: locally for Task 3 provisioning, and as the `RAILWAY_TOKEN` GitHub Actions secret in Task 5.
