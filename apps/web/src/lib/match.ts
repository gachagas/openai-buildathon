import type { Flower } from "../types";
import { flowers, flowerById } from "../data/products";
import embeddingsData from "../data/embeddings.json";

// Similarity uses precomputed OpenAI embeddings when present (see
// scripts/ingest/embed-products.mjs); otherwise it falls back to attribute
// proximity. embeddings.json ships empty and is populated by that script.
const vectors = embeddingsData as unknown as Record<string, number[]>;
const hasVectors = (id: string) => Array.isArray(vectors[id]) && vectors[id].length > 0;

export type GiftFilters = { occasion?: string; giftType?: string; budget?: string };

export const OCCASIONS = ["Birthday", "Anniversary", "Congratulations", "Thank you", "Apology", "Sympathy"];

export const GIFT_TYPES: Record<string, string[]> = {
  "Flowers & plants": ["Flowers", "Dried flowers", "Orchid", "Plant"],
  "Sweet treats": ["Cake", "Chocolate"],
  Keepsakes: ["Mug", "Teddy bear", "Candle", "Balloon", "Money bouquet"],
  "Drinks & baskets": ["Wine & spirits", "Gift basket"],
};

export const BUDGETS: Record<string, [number, number]> = {
  "Under ₱1,000": [0, 1000],
  "₱1,000–₱2,500": [1000, 2500],
  "₱2,500–₱5,000": [2500, 5000],
  "₱5,000+": [5000, Infinity],
};

// When the occasion is Sympathy, only these categories are appropriate.
const SYMPATHY_ALLOWED = new Set(["Sympathy", "Flowers", "Orchid", "Dried flowers", "Plant", "Gift basket"]);

const category = (flower: Flower) => flower.tags[0] ?? "Gift";
const isSympathy = (flower: Flower) => category(flower) === "Sympathy" || flower.occasions.includes("Sympathy");
const discountRatio = (flower: Flower) => (flower.originalPrice ? 1 - flower.pricing.amount / flower.originalPrice : 0);

function passesSympathyGate(flower: Flower, occasion?: string) {
  if (occasion === "Sympathy") return SYMPATHY_ALLOWED.has(category(flower));
  return !isSympathy(flower);
}

export function topMatches(filters: GiftFilters, excludeIds: Set<string>, count = 10): Flower[] {
  const group = filters.giftType ? GIFT_TYPES[filters.giftType] : undefined;
  const budget = filters.budget ? BUDGETS[filters.budget] : undefined;

  const scored = flowers
    .filter((flower) => !excludeIds.has(flower.id))
    .filter((flower) => !group || group.includes(category(flower)))
    .filter((flower) => !budget || (flower.pricing.amount >= budget[0] && flower.pricing.amount < budget[1]))
    .filter((flower) => passesSympathyGate(flower, filters.occasion))
    .map((flower) => {
      let score = 0;
      if (filters.occasion && flower.occasions.includes(filters.occasion)) score += 3;
      if (discountRatio(flower) >= 0.3) score += 1;
      return { flower, score };
    })
    .sort((a, b) => b.score - a.score || a.flower.id.localeCompare(b.flower.id));

  // Diversity cap: at most 4 per category, backfilling if we come up short.
  const perCategory = new Map<string, number>();
  const picked: Flower[] = [];
  const overflow: Flower[] = [];
  for (const { flower } of scored) {
    const cat = category(flower);
    const seen = perCategory.get(cat) ?? 0;
    if (seen < 4 && picked.length < count) {
      perCategory.set(cat, seen + 1);
      picked.push(flower);
    } else if (picked.length < count) {
      overflow.push(flower);
    }
  }
  return [...picked, ...overflow].slice(0, count);
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function similarTo(likedIds: string[], excludeIds: Set<string>, count = 6): Flower[] {
  const liked = likedIds.map((id) => flowerById.get(id)).filter((flower): flower is Flower => Boolean(flower));
  if (!liked.length) return [];

  // Keep the recommendation in the same emotional register as the picks:
  // suppress sympathy items unless the user actually liked one.
  const allowSympathy = liked.some(isSympathy);
  const candidates = flowers.filter(
    (flower) => !excludeIds.has(flower.id) && !likedIds.includes(flower.id) && (allowSympathy || !isSympathy(flower)),
  );

  const likedWithVectors = liked.filter((flower) => hasVectors(flower.id));
  if (likedWithVectors.length) {
    const dims = vectors[likedWithVectors[0].id].length;
    const mean = new Array(dims).fill(0);
    for (const flower of likedWithVectors) {
      const vec = vectors[flower.id];
      for (let i = 0; i < dims; i++) mean[i] += vec[i] / likedWithVectors.length;
    }
    return candidates
      .filter((flower) => hasVectors(flower.id))
      .map((flower) => ({ flower, score: cosine(mean, vectors[flower.id]) }))
      .sort((a, b) => b.score - a.score || a.flower.id.localeCompare(b.flower.id))
      .slice(0, count)
      .map((entry) => entry.flower);
  }

  // Attribute fallback: category, colors, price band, occasion overlap.
  const likedCategories = new Set(liked.map(category));
  const likedColors = new Set(liked.flatMap((flower) => flower.colors));
  const likedOccasions = new Set(liked.flatMap((flower) => flower.occasions));
  const prices = liked.map((flower) => flower.pricing.amount);

  return candidates
    .map((flower) => {
      let score = 0;
      if (likedCategories.has(category(flower))) score += 3;
      score += Math.min(2, flower.colors.filter((color) => likedColors.has(color)).length);
      if (prices.some((price) => Math.abs(flower.pricing.amount - price) <= price * 0.3)) score += 1;
      if (flower.occasions.some((occasion) => likedOccasions.has(occasion))) score += 1;
      return { flower, score };
    })
    .sort((a, b) => b.score - a.score || a.flower.id.localeCompare(b.flower.id))
    .slice(0, count)
    .map((entry) => entry.flower);
}
