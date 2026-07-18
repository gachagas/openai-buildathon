// Transforms our 500-product dataset (commit c1b7823 shape) into the catalog
// schema the app uses (see apps/web/src/lib/catalog.ts), with keyword-derived
// baseline tags. The vision tagging pass (tags.json) then overrides/enriches
// categories, occasions, recipients, vibes, and colors via merge-tags.mjs.
// Usage: git show c1b7823:apps/web/src/data/products.json > scripts/ingest/source-500.json
//        node scripts/ingest/transform-500.mjs

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, "source-500.json");
const TAGS = resolve(here, "tags.json");
const OUT = resolve(here, "../../apps/web/src/data/products.json");

const CATEGORY_MAP = {
  Sympathy: "sympathy",
  Flowers: "flowers",
  "Dried flowers": "flowers",
  Orchid: "flowers",
  Plant: "plants",
  Cake: "food-drink",
  Chocolate: "food-drink",
  "Wine & spirits": "food-drink",
  "Gift basket": "food-drink",
  "Teddy bear": "toys-kids-pets",
  Balloon: "other",
  Mug: "home-keepsake",
  Candle: "home-keepsake",
  "Money bouquet": "other",
  Gift: "other",
};

const OCCASION_MAP = {
  Birthday: "birthday",
  Anniversary: "anniversary",
  "Thank you": "thank-you",
  Congratulations: "congratulations",
  Apology: "just-because",
  "Home decoration": "just-because",
  Sympathy: "sympathy",
};

const VIBE_MAP = { Romantic: "romantic", Elegant: "elegant", Cheerful: "cheerful", Classic: "calm" };

const source = JSON.parse(readFileSync(SOURCE, "utf8"));
const visionTags = existsSync(TAGS) ? JSON.parse(readFileSync(TAGS, "utf8")) : {};

const products = source
  .map((p) => {
    const tagged = visionTags[p.id] ?? {};
    const baseCategory = CATEGORY_MAP[p.tags?.[0]] ?? "other";
    const baseOccasions = [...new Set((p.occasions ?? []).map((o) => OCCASION_MAP[o]).filter(Boolean))];
    const baseVibes = [...new Set((p.styles ?? []).map((s) => VIBE_MAP[s]).filter(Boolean))];
    const baseColors = (p.colors ?? []).map((c) => c.toLowerCase());

    const categories = tagged.categories?.length ? tagged.categories : [baseCategory];
    const occasions = (tagged.occasions?.length ? tagged.occasions : (baseOccasions.length ? baseOccasions : ["just-because"]))
      .filter((o) => o !== "sympathy");

    return {
      id: p.id,
      title: p.name,
      description: p.description ?? "",
      link: p.link,
      image: p.image.src,
      price: p.pricing.amount,
      maxPrice: p.originalPrice ?? p.pricing.amount,
      categories,
      occasions: occasions.length ? occasions : ["just-because"],
      recipients: tagged.recipients ?? [],
      vibes: tagged.vibes?.length ? tagged.vibes : baseVibes,
      colors: tagged.colors?.length ? tagged.colors : baseColors,
      hubs: [],
    };
  })
  // Sympathy is out of scope for the gift finder — drop funeral/condolence items entirely.
  .filter((p) => !p.categories.includes("sympathy"));

writeFileSync(OUT, JSON.stringify(products, null, 1));
const tagged = products.filter((p) => visionTags[p.id]).length;
console.log(`Wrote ${products.length} products (${tagged} with vision tags, ${products.length - tagged} keyword-baseline).`);
