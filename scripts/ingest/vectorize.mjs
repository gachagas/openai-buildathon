// Builds TF-IDF vectors for every product so the app can do in-browser cosine
// similarity (Pinterest-style nearest-neighbour retrieval) with zero runtime APIs.
// Reads apps/web/src/data/products.json → writes apps/web/src/data/vectors.json:
// { vocab: string[], docs: { [id]: [termIndexes[], weights[]] } }  (l2-normalized)
// Usage: node scripts/ingest/vectorize.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PRODUCTS = resolve(here, "../../apps/web/src/data/products.json");
const OUT = resolve(here, "../../apps/web/src/data/vectors.json");
const TOP_TERMS = 60;

const STOP = new Set("the a an and or of to for with in on at from this that these those is are was be as it its your you our their they them he she his her will can just very more most also into by about not no so if when where which who whom what how all any each own same than then there here out up down over under again once only both few such nor too s t d ll m o re ve y ph com www https flowerstore product delivery deliver metro manila philippines".split(" "));

// Tag terms are prefixed so "pink" the colour and "pink" in prose count separately,
// and repeated so structured tags outweigh free text.
function docText(p) {
  const tagTerms = [
    ...p.categories.map((c) => `cat_${c}`),
    ...p.occasions.map((o) => `occ_${o}`),
    ...(p.recipients ?? []).map((r) => `rec_${r}`),
    ...(p.vibes ?? []).map((v) => `vibe_${v}`),
    ...(p.colors ?? []).map((c) => `col_${c}`),
  ];
  return [...tagTerms, ...tagTerms, ...tagTerms, ...tokenize(`${p.title} ${p.description}`)];
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-zñ]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

const products = JSON.parse(readFileSync(PRODUCTS, "utf8"));
const docTokens = products.map((p) => docText(p));

const df = new Map();
for (const tokens of docTokens) for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1);

const N = products.length;
const vocab = [];
const vocabIndex = new Map();
const docs = {};

products.forEach((p, i) => {
  const tf = new Map();
  for (const term of docTokens[i]) tf.set(term, (tf.get(term) ?? 0) + 1);

  const weighted = [...tf.entries()]
    .map(([term, count]) => [term, count * Math.log(N / df.get(term))])
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TERMS);

  const norm = Math.sqrt(weighted.reduce((sum, [, w]) => sum + w * w, 0)) || 1;
  const idxs = [];
  const weights = [];
  for (const [term, w] of weighted) {
    if (!vocabIndex.has(term)) {
      vocabIndex.set(term, vocab.length);
      vocab.push(term);
    }
    idxs.push(vocabIndex.get(term));
    weights.push(Math.round((w / norm) * 1e4) / 1e4);
  }
  docs[p.id] = [idxs, weights];
});

writeFileSync(OUT, JSON.stringify({ vocab, docs }));
console.log(`Wrote vectors for ${N} products, vocab size ${vocab.length}.`);
