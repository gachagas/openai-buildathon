// Merges the per-batch vision-tag outputs into scripts/ingest/tags.json,
// validating every value against the closed taxonomy (drops out-of-vocab values,
// reports them). Then re-run transform-500.mjs to fold tags into products.json.
// Usage: node scripts/ingest/merge-tags.mjs <tagging-dir>

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
if (!dir) throw new Error("Pass the tagging dir containing tags-batch-*.json");
const OUT = resolve(here, "tags.json");

const VOCAB = {
  categories: new Set(["sympathy", "flowers", "food-drink", "personalized", "jewelry-fashion", "home-keepsake", "beauty-wellness", "plants", "toys-kids-pets", "other"]),
  occasions: new Set(["birthday", "anniversary", "thank-you", "congratulations", "just-because", "sympathy"]),
  recipients: new Set(["partner", "family", "friend", "colleague"]),
  vibes: new Set(["romantic", "cheerful", "elegant", "playful", "cozy", "luxurious", "personal", "heartfelt", "calm", "festive", "fun", "indulgent"]),
  colors: new Set(["red", "pink", "white", "yellow", "blue", "purple", "orange", "green", "pastel", "colorful"]),
};

const rejected = {};
function clean(field, values) {
  if (!Array.isArray(values)) return [];
  const out = [];
  for (const raw of values) {
    const v = String(raw).toLowerCase().trim();
    if (VOCAB[field].has(v)) out.push(v);
    else (rejected[field] ??= new Set()).add(v);
  }
  return [...new Set(out)];
}

const merged = {};
for (const file of readdirSync(dir).filter((f) => /^tags-batch-\d+\.json$/.test(f)).sort()) {
  const batch = JSON.parse(readFileSync(join(dir, file), "utf8"));
  for (const [id, tags] of Object.entries(batch)) {
    merged[id] = {
      categories: clean("categories", tags.categories),
      occasions: clean("occasions", tags.occasions),
      recipients: clean("recipients", tags.recipients),
      vibes: clean("vibes", tags.vibes),
      colors: clean("colors", tags.colors),
    };
  }
}

// Preserve any pre-existing tags.json entries not re-tagged this run (idempotent).
if (existsSync(OUT)) {
  const prior = JSON.parse(readFileSync(OUT, "utf8"));
  for (const [id, tags] of Object.entries(prior)) if (!merged[id]) merged[id] = tags;
}

writeFileSync(OUT, JSON.stringify(merged, null, 1));
console.log(`Merged ${Object.keys(merged).length} products → ${OUT}`);
for (const [field, set] of Object.entries(rejected)) console.log(`  rejected ${field}: ${[...set].join(", ")}`);
if (!Object.keys(rejected).length) console.log("  all values in-vocab.");
