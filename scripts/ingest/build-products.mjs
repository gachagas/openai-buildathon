// Builds apps/web/src/data/products.json from the FlowerStore Google Merchant feed.
// Usage: node scripts/ingest/build-products.mjs [--local path/to/feed.xml] [--count 500]
// Deterministic: same feed in, same JSON out (no RNG).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FEED_URL = "https://flowerstore.ph/data/feed";
const OUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web/src/data/products.json");

const args = process.argv.slice(2);
const localPath = args.includes("--local") ? args[args.indexOf("--local") + 1] : null;
const TARGET = Number(args.includes("--count") ? args[args.indexOf("--count") + 1] : 500);
const CATEGORY_FLOOR = 8;

const ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
const MOJIBAKE = [["â€™", "'"], ["â€˜", "'"], ["â€œ", '"'], ["â€", '"'], ["â€“", "–"], ["â€”", "—"], ["â€¦", "…"]];

function decode(text) {
  let out = text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
  for (const [bad, good] of MOJIBAKE) out = out.replaceAll(bad, good);
  return out.replace(/\s+/g, " ").trim();
}

function tag(block, name) {
  const match = block.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return match ? decode(match[1]) : "";
}

function tags(block, name) {
  return [...block.matchAll(new RegExp(`<${name}>([^<]*)</${name}>`, "g"))].map((m) => decode(m[1]));
}

// Category priority: first match wins, on title+description (titles are poetic
// names like "Dearly Beloved" — the product type usually only appears in the desc).
// Sympathy first so funeral items never masquerade as generic flowers.
const CATEGORIES = [
  ["Sympathy", /sympathy|condolence|funeral|memorial/i],
  ["Cake", /\bcakes?\b|cupcake/i],
  ["Chocolate", /chocolat|choco\b|ferrero|toblerone/i],
  ["Wine & spirits", /\bwines?\b|whisk|liquor|champagne|brandy/i],
  ["Teddy bear", /teddy|\bbears?\b|plush|stuffed toy/i],
  ["Balloon", /balloon/i],
  ["Mug", /\bmugs?\b|tumbler/i],
  ["Candle", /candle/i],
  ["Orchid", /orchid|phalaenopsis/i],
  ["Plant", /\bplants?\b|succulent|bonsai|sansevieria/i],
  ["Gift basket", /hamper|basket/i],
  ["Money bouquet", /money bouquet|money flower|cash bouquet/i],
  ["Dried flowers", /dried|preserved|everlasting/i],
  ["Flowers", /rose|tulip|sunflower|lil(y|ies)|carnation|peony|peonies|\bmums?\b|chrysanthemum|gerbera|stargazer|bouquet|flower|blooms?\b|floral|posy|vase/i],
  ["Gift", /./],
];

const COLORS = [
  ["Red", /\b(red|crimson|scarlet|burgundy|maroon)\b/i],
  ["Pink", /\b(pink|blush|fuchsia|magenta)\b/i],
  ["White", /\b(white|ivory)\b/i],
  ["Cream", /\b(cream|beige|champagne)\b/i],
  ["Yellow", /\b(yellow|golden|gold)\b/i],
  ["Blue", /\b(blue|navy|azure)\b/i],
  ["Purple", /\b(purple|violet|lavender|lilac)\b/i],
  ["Orange", /\b(orange|tangerine)\b/i],
  ["Peach", /\b(peach|coral|salmon)\b/i],
  ["Green", /\b(green|sage|emerald)\b/i],
  ["Pastel", /\bpastel\b/i],
  ["Colorful", /\b(rainbow|colorful|multicolou?red|mixed colors?)\b/i],
];

// Values must match contextOptions.occasion in App.tsx so recommendationScore can hit.
const OCCASIONS = [
  ["Sympathy", /sympathy|condolence|funeral|memorial|deepest/i],
  ["Birthday", /birthday|bday/i],
  ["Anniversary", /anniversar|valentine|romantic|romance/i],
  ["Thank you", /thank you|gratitude|appreciation/i],
  ["Congratulations", /congrat|graduation|grand opening|achievement/i],
  ["Apology", /\bsorry\b|apolog|forgive/i],
  ["Home decoration", /home decor|decoration|desk|home or office/i],
];

const STYLES = [
  ["Romantic", /romantic|passion|heart|sweet|tender/i],
  ["Elegant", /elegant|luxur|premium|sophisticat|majestic|grand\b/i],
  ["Cheerful", /cheerful|bright|sunny|joy|happy|delight|fun\b/i],
  ["Classic", /classic|timeless|traditional/i],
];

const EXTRA_TAGS = [
  ["Personalized", /personaliz|customiz|custom\b/i],
  ["Premium", /premium|luxur/i],
  ["LED", /\bled\b/i],
  ["Korean style", /korean/i],
  ["Mini", /\bmini\b|petite/i],
  ["Bundle", /bundle|gift set|\bset\b/i],
];

function firstMatches(list, text, cap = 3) {
  return list.filter(([, re]) => re.test(text)).slice(0, cap).map(([label]) => label);
}

async function loadFeed() {
  if (localPath) return readFileSync(localPath, "utf8");
  const response = await fetch(FEED_URL);
  if (!response.ok) throw new Error(`Feed fetch failed: ${response.status}`);
  return await response.text();
}

const xml = await loadFeed();
const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
if (!blocks.length) throw new Error("No <item> blocks found — feed format changed?");

const byTitle = new Map();
for (const raw of blocks) {
  const block = raw.replace(/<g:shipping>[\s\S]*?<\/g:shipping>/g, ""); // its <g:price>0.00</g:price> poisons price parsing
  const title = tag(block, "g:title");
  const image = tag(block, "g:image_link");
  const price = parseFloat(tag(block, "g:price")) || 0;
  const salePrice = parseFloat(tag(block, "g:sale_price")) || 0;
  const amount = salePrice > 0 ? Math.min(salePrice, price || salePrice) : price;
  if (!title || !image.startsWith("https://") || amount <= 0) continue;

  const product = {
    id: tag(block, "g:id"),
    title,
    desc: tag(block, "g:description"),
    link: tag(block, "g:link"),
    image,
    images: tags(block, "g:additional_image_link").slice(0, 4),
    amount: Math.round(amount),
    originalPrice: salePrice > 0 && salePrice < price ? Math.round(price) : null,
  };
  const key = title.toLowerCase();
  const existing = byTitle.get(key);
  if (!existing || product.amount < existing.amount) byTitle.set(key, product);
}

const products = [...byTitle.values()];
for (const p of products) {
  const text = `${p.title} ${p.desc}`;
  p.category = CATEGORIES.find(([, re]) => re.test(text))[0];
  p.colors = firstMatches(COLORS, text);
  p.occasions = p.category === "Sympathy" ? ["Sympathy"] : firstMatches(OCCASIONS, text);
  p.styles = firstMatches(STYLES, text, 2);
  p.extraTags = firstMatches(EXTRA_TAGS, text, 2);
}

// Stratified sample: proportional per category with a floor, then evenly spaced
// picks over each price-sorted stratum so the full price range is covered.
const strata = new Map();
for (const p of products) (strata.get(p.category) ?? strata.set(p.category, []).get(p.category)).push(p);
for (const list of strata.values()) list.sort((a, b) => a.amount - b.amount || a.id.localeCompare(b.id));

const total = products.length;
const alloc = new Map(
  [...strata.entries()].map(([cat, list]) => [cat, Math.max(Math.min(CATEGORY_FLOOR, list.length), Math.round((list.length / total) * TARGET))]),
);
let diff = TARGET - [...alloc.values()].reduce((a, b) => a + b, 0);
const bySizeDesc = [...alloc.keys()].sort((a, b) => strata.get(b).length - strata.get(a).length);
while (diff !== 0) {
  for (const cat of bySizeDesc) {
    if (diff === 0) break;
    const current = alloc.get(cat);
    if (diff > 0 && current < strata.get(cat).length) { alloc.set(cat, current + 1); diff--; }
    else if (diff < 0 && current > Math.min(CATEGORY_FLOOR, strata.get(cat).length)) { alloc.set(cat, current - 1); diff++; }
  }
}

function evenPicks(list, k) {
  if (k >= list.length) return list;
  if (k === 1) return [list[0]];
  const picked = new Set();
  for (let i = 0; i < k; i++) picked.add(Math.round((i * (list.length - 1)) / (k - 1)));
  return [...picked].map((idx) => list[idx]);
}

const sampled = new Map([...strata.keys()].map((cat) => [cat, evenPicks(strata.get(cat), alloc.get(cat))]));

// Round-robin across categories so the deck alternates gift types.
const emit = [];
const queues = [...sampled.values()].map((list) => [...list]);
while (queues.some((q) => q.length)) for (const q of queues) if (q.length) emit.push(q.shift());

const flowerShaped = emit.map((p) => ({
  id: p.id,
  name: p.title,
  image: { src: p.image, position: "full", alt: p.title },
  ...(p.images.length ? { images: p.images } : {}),
  link: p.link,
  pricing: { amount: p.amount, currency: "PHP", unit: "per_item", displayLabel: "" },
  ...(p.originalPrice ? { originalPrice: p.originalPrice } : {}),
  colors: p.colors,
  tags: [p.category, ...p.extraTags],
  shapes: [],
  styles: p.styles,
  summary: p.desc.length > 140 ? `${p.desc.slice(0, p.desc.lastIndexOf(" ", 140))}…` : p.desc,
  description: p.desc,
  occasions: p.occasions,
  availability: "available_today",
  isMockData: false,
}));

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(flowerShaped, null, 1));

const bands = [500, 1000, 2000, 4000, 8000, Infinity];
const bandLabel = (amount) => `≤₱${bands.find((b) => amount <= b) === Infinity ? "8k+" : bands.find((b) => amount <= b)}`;
console.log(`Feed items: ${blocks.length} → unique valid products: ${total} → sampled: ${flowerShaped.length}`);
console.log(`Wrote ${OUT_PATH}`);
for (const [cat, list] of [...sampled.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const catBands = {};
  for (const p of list) catBands[bandLabel(p.amount)] = (catBands[bandLabel(p.amount)] ?? 0) + 1;
  console.log(`  ${cat.padEnd(14)} ${String(list.length).padStart(3)} of ${String(strata.get(cat).length).padStart(4)}  ${Object.entries(catBands).map(([b, n]) => `${b}:${n}`).join(" ")}`);
}
