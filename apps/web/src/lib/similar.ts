import vectorsData from "../data/vectors.json";

// TF-IDF vectors precomputed by scripts/ingest/vectorize.mjs.
// Sparse doc = [termIndexes[], weights[]], l2-normalized, so cosine = dot product.
type SparseDoc = [number[], number[]];

const docs = (vectorsData as unknown as { docs: Record<string, SparseDoc> }).docs;

export type TasteVector = Map<number, number>;

export function likedMeanVector(likedIds: string[]): TasteVector | null {
  const sum: TasteVector = new Map();
  let used = 0;
  for (const id of likedIds) {
    const doc = docs[id];
    if (!doc) continue;
    used += 1;
    const [idxs, weights] = doc;
    for (let i = 0; i < idxs.length; i += 1) sum.set(idxs[i], (sum.get(idxs[i]) ?? 0) + weights[i]);
  }
  if (!used) return null;
  let norm = 0;
  for (const w of sum.values()) norm += w * w;
  norm = Math.sqrt(norm) || 1;
  for (const [k, w] of sum) sum.set(k, w / norm);
  return sum;
}

export function similarityTo(taste: TasteVector, productId: string): number {
  const doc = docs[productId];
  if (!doc) return 0;
  const [idxs, weights] = doc;
  let dot = 0;
  for (let i = 0; i < idxs.length; i += 1) {
    const w = taste.get(idxs[i]);
    if (w) dot += w * weights[i];
  }
  return dot;
}

export function hasVector(productId: string): boolean {
  return Boolean(docs[productId]);
}
