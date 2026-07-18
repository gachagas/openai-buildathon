# Personal Shopper — Buildathon Spec

Swipe-based personal shopper for ecommerce. Demo on FlowerStore (PH); generalizes to any store with a Google Merchant feed.

**Pitch:** Gift buyers don't know what they want — filters assume they do. A few swipes → a taste profile in plain words → recommendations that explain themselves → cart → checkout. Not "Tinder for flowers": an explainable, conversion-native discovery layer that works on any Google Merchant feed (the "paste another store's feed" demo moment).

## Data (measured 2026-07-18)

- Source: `https://flowerstore.ph/data/feed` — Google Merchant RSS/XML, 6,954 items, all in stock.
- Only **4,177 unique titles** (rest are variants/multi-hub duplicates) → **dedupe by title**.
- Fields: id, title, description, link, image(s), price, sale_price, brand. **No usable category** — occasion/style/color must be derived.
- 71% of descriptions truncated (~180 chars). Fine for embeddings/tags.
- Parser trap: read item-level `<g:price>`, NOT the nested shipping `<g:price>` (0.00 PHP).
- Audited: no PII, no signed URLs, no credentials. Share `products.json`, not the endpoint URL.

## Recommendation model — code for mechanics, LLM only for words

Signals per product (build-time): OpenAI embedding (title+desc+tags) + LLM-derived structured tags `{type, colors[], style[], occasions[], recipient_fit[], tone}` + price band.

Runtime (pure code, in-browser, no LLM in the swipe loop):
- Hard filters first: occasion chip + budget pill. **Sympathy items never appear outside sympathy sessions.**
- User vector = weighted mean of liked embeddings; cart-add = 2× like; skip subtracts at 0.5×.
- Rank by cosine within the filtered pool, exclude seen, ~20% exploration variety.
- LLM called ONCE at results time (`/api/taste`): swipe history + top recs → taste summary + one-line "why" per rec, each citing concrete evidence. **4s timeout → templated fallback** built from liked-tag tallies. The demo must be un-failable.

## Ingest pipeline (`scripts/ingest/`, run once, commit artifacts)

1. Fetch XML → parse → dedupe by title (keep cheapest variant, keep all images).
2. Tag: keyword pass, then batched LLM calls (~50 products/call ≈ 85 calls, mini-class model, JSON output).
3. Embed: `text-embedding-3-small`, batched; slice to 256 dims or Int8-quantize (keeps vectors file ~1–4 MB).
4. Emit `apps/web/public/products.json` + `vectors.json` (same row order).
5. **Hour 1: ship a fake 50-product version** matching the contract so UI work never waits.

## UI flow — one-tap opener (3 surfaces, 1 tap to first swipe)

1. **Opener**: hero + one line + occasion chips (*Anniversary · Birthday · Sorry/Get well · Sympathy · Just browsing*). **Tapping a chip IS the start button.** Preload first ~10 card images here.
2. **Deck**: swipe left = skip · right = like · **up = add to cart**; button row ✕ ♥ 🛒 + small undo. Budget pill in header (bottom sheet, 3 ranges, filters live). Live taste chips + progress meter. First-card gesture overlay. Price always visible. No network calls in the swipe path.
3. **Transition**: "Reading your taste…" as a 1.5–2.5s animation (hard cap 4s), not a screen.
4. **Results**: taste summary card + recs with "why" + "keep swiping to refine" loop back to deck.
- **Cart**: persistent badge (deck + results); add-to-cart animates card flying to badge; bottom drawer with items/total; sticky bar when non-empty: "Checkout · N items · ₱total".
- **Results trigger**: auto at 8 decisions (cart counts double); "See my matches →" escape hatch at 5.
- **Cut**: Save/favorites verb (like = save), separate setup screen, welcome-only page.
- Visual language: port from the Tsubomi mockup (`docs/mockup/`).

## Cart & checkout — verified constraint

fsweb add-to-cart is POST + CSRF + requires hub/delivery date/time; guest cart lives in flowerstore.ph's own localStorage. **External cart injection is impossible today.** Our cart is in-app (local state); checkout CTA = "Checkout on FlowerStore.ph" opening the product page links. v2 (not today): tiny fsweb change to accept a variant-preselect/cart-import param → real funnel.

## Architecture & deploy

- `apps/web` — Vite + React SPA (exists): screens `Opener.tsx`, `Deck.tsx`, `Results.tsx`, state machine in `App.tsx`, engine in `lib/taste.ts`. Static, served by Caddy, auto-deploys to Railway on push to `main`.
- `apps/api` — NEW tiny Node/Express service on Railway: one route `POST /api/taste` (the only LLM call). `OPENAI_API_KEY` lives here as a Railway env var — never in client code.

## Contracts (frozen)

```
// products.json entry
{ id, title, desc, price, salePrice, image, images[], link, tags: { type, colors[], style[], occasions[], recipient_fit[], tone } }

// engine (client-side)
recommend(likes: id[], carts: id[], skips: id[], seed: { occasion, budget? }) → ranked id[]

// POST /api/taste  →  { summary, whys: { [id]: string } }
{ occasion, budget?, liked: [{id, title, tags}], carted: [...], skipped: [...], recs: [{id, title, tags}] }
```

## Team split

| Person | Owns | Deliverable |
|---|---|---|
| 1 — Data & engine | Ingest pipeline, embeddings, `recommend()` | Fake 50-product `products.json` in hour 1; real artifacts + engine after |
| 2 — Opener + Deck | Chips, gestures, budget pill, taste meter, fly-to-cart animation | The core interaction, mockup-faithful |
| 3 — Results + AI + cart | Transition, summary + whys (`/api/taste` client), fallback, cart drawer, checkout bar | The screen judges remember |
| 4 — API + integration + pitch | `apps/api` on Railway (env vars), app shell/state, "paste any feed URL" path, demo script, QA | The live demo working, twice — deployed early |

## Timeline

30 min contracts+roles → Sprint 1 vs fake data (api service live with echo route) → integrate after lunch → 3 PM feature freeze → rehearse demo twice.

## Verification

- Ingest: ~4.2k rows, no duplicate titles, no ₱0 prices, spot-check 10 products' tags vs images.
- Engine: like 3 pastel products → top-10 visibly pastel; zero sympathy items in a birthday session; all recs within budget.
- E2E on the Railway URL from a phone: chip → 8 swipes (one swipe-up) → summary cites real liked attributes → cart drawer → checkout opens correct product pages.
- Kill-switch: block `/api/taste` in devtools → templated fallback within 4s.

## Out of scope (do not build)

Auth · server persistence · real add-to-cart on flowerstore.ph · multi-market · mobile app · admin UI · fsweb changes
