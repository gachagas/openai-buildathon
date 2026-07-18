// Precomputes OpenAI text embeddings for the 500 products so the app can do
// in-browser cosine similarity ("you might also like") with no runtime API calls.
// Usage: OPENAI_API_KEY=sk-... node scripts/ingest/embed-products.mjs
// Output: apps/web/src/data/embeddings.json  ({ [productId]: number[256] })
// Optional; the app's match engine falls back to attribute similarity without it.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PRODUCTS = resolve(here, "../../apps/web/src/data/products.json");
const OUT = resolve(here, "../../apps/web/src/data/embeddings.json");
const MODEL = "text-embedding-3-small";
const DIMS = 256;
const BATCH = 100;

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("OPENAI_API_KEY not set. Skipping — the app uses the attribute fallback without embeddings.");
  process.exit(1);
}

const products = JSON.parse(readFileSync(PRODUCTS, "utf8"));
const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
if (products.every((p) => existing[p.id]?.length === DIMS)) {
  console.log(`embeddings.json already up to date (${products.length} products).`);
  process.exit(0);
}

const embedText = (p) => `${p.name}. ${p.tags.join(", ")}. ${p.description}`.slice(0, 4000);
const out = {};
for (let i = 0; i < products.length; i += BATCH) {
  const batch = products.slice(i, i + BATCH);
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, dimensions: DIMS, input: batch.map(embedText) }),
  });
  if (!response.ok) throw new Error(`Embeddings API ${response.status}: ${await response.text()}`);
  const { data } = await response.json();
  data.forEach((row, j) => { out[batch[j].id] = row.embedding.map((v) => Math.round(v * 1e5) / 1e5); });
  console.log(`embedded ${Math.min(i + BATCH, products.length)}/${products.length}`);
}

writeFileSync(OUT, JSON.stringify(out));
console.log(`Wrote ${OUT} (${Object.keys(out).length} products × ${DIMS} dims).`);
