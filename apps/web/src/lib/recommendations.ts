import type { CustomerContext, Flower, FlowerSelection, PreferenceProfile } from "../types";

const budgetMaximums: Record<string, number> = {
  "Under ₱500": 500,
  "₱500–₱1,000": 1000,
  "₱1,000–₱1,500": 1500,
  "₱1,500–₱2,500": 2500,
  "₱2,500+": Number.POSITIVE_INFINITY,
};

function intersects(values: string[], preferred: string[]) {
  return values.some((value) => preferred.includes(value));
}

export function recommendationScore(
  flower: Flower,
  profile: PreferenceProfile,
  context: CustomerContext,
) {
  let score = 0;
  if (intersects(flower.styles, profile.styles)) score += 3;
  if (intersects(flower.colors, profile.colors)) score += 2;
  if (intersects(flower.shapes, profile.shapes)) score += 2;
  if (intersects(flower.tags, profile.tags)) score += 1;
  if (context.occasion && flower.occasions.includes(context.occasion)) score += 1;
  const budgetMax = context.budget ? budgetMaximums[context.budget] : undefined;
  if (budgetMax !== undefined && flower.pricing.amount <= budgetMax) score += 1;
  return score;
}

export function recommendFlowers(
  flowers: Flower[],
  selections: FlowerSelection[],
  profile: PreferenceProfile,
  context: CustomerContext,
  limit = 4,
) {
  const selected = new Set(
    selections.filter((selection) => selection.decision !== "skipped").map((selection) => selection.flowerId),
  );
  const skipped = new Set(
    selections.filter((selection) => selection.decision === "skipped").map((selection) => selection.flowerId),
  );

  const primary = flowers.filter((flower) => !selected.has(flower.id) && !skipped.has(flower.id));
  const fallback = flowers.filter((flower) => !selected.has(flower.id) && skipped.has(flower.id));
  return [...primary, ...fallback]
    .map((flower) => ({ flower, score: recommendationScore(flower, profile, context), wasSkipped: skipped.has(flower.id) }))
    .sort((a, b) => Number(a.wasSkipped) - Number(b.wasSkipped) || b.score - a.score || a.flower.name.localeCompare(b.flower.name))
    .slice(0, Math.min(5, Math.max(3, limit)))
    .map(({ flower }) => flower);
}

const arrangementByStyle: Record<string, { name: string; price: number }> = {
  Romantic: { name: "Blush Garden Bouquet", price: 1250 },
  "Garden-inspired": { name: "Loose Field Bouquet", price: 1350 },
  Elegant: { name: "Quiet Elegance Arrangement", price: 1650 },
  Minimal: { name: "Simple White Posy", price: 980 },
  Cheerful: { name: "Sunlit Cheer Bunch", price: 1100 },
  Modern: { name: "Modern Stem Study", price: 1450 },
};

export function matchingArrangement(profile: PreferenceProfile) {
  return arrangementByStyle[profile.styles[0] ?? ""] ?? arrangementByStyle.Romantic;
}
