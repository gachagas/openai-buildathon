import type { GiftCategory, Occasion, Product, Recipient } from "./catalog";

export const SWIPE_COUNT = 10;
export const MIN_LIKES_FOR_RECOMMENDATION = 3;
export const RESULTS_PER_GROUP = 3;

export const BUDGETS = {
  "Under ₱1,000": [0, 1000],
  "₱1,000–₱2,500": [1000, 2500],
  "₱2,500–₱5,000": [2500, 5000],
  "₱5,000+": [5000, Infinity],
} as const satisfies Record<string, readonly [number, number]>;

export type Budget = keyof typeof BUDGETS;

export interface SwipeDecision {
  productId: string;
  direction: "like" | "pass";
}

export interface Recommendation {
  product: Product;
  reasons: string[];
  score: number;
}

const categoryNames: Record<GiftCategory, string> = {
  sympathy: "comforting tribute",
  flowers: "flowers",
  "food-drink": "gourmet treats",
  personalized: "personalized keepsakes",
  "jewelry-fashion": "jewelry and style",
  "home-keepsake": "home and keepsakes",
  "beauty-wellness": "beauty and self-care",
  plants: "plants",
  "toys-kids-pets": "playful gifts",
  other: "thoughtful gifts",
};

function stableNumber(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function eligibleProducts(allProducts: Product[], occasion: Occasion, budget?: Budget | null) {
  const byOccasion = allProducts.filter((product) =>
    occasion === "sympathy"
      ? product.categories.includes("sympathy")
      : !product.categories.includes("sympathy"),
  );
  const band = budget ? BUDGETS[budget] : undefined;
  if (!band) return byOccasion;
  const inBudget = byOccasion.filter((product) => product.price >= band[0] && product.price < band[1]);
  // Fall back to the full occasion pool if the budget is too narrow to fill a deck.
  return inBudget.length >= SWIPE_COUNT ? inBudget : byOccasion;
}

function contextScore(product: Product, recipient: Recipient, occasion: Occasion) {
  let score = 0;
  if (product.occasions.includes(occasion)) score += 5;
  if (product.recipients.includes(recipient)) score += 2.5;
  if (occasion === "anniversary" && product.vibes.includes("romantic")) score += 2;
  if (occasion === "congratulations" && product.vibes.includes("cheerful")) score += 1.5;
  if (occasion === "thank-you" && product.vibes.includes("personal")) score += 1.5;
  if (recipient === "colleague" && product.vibes.includes("romantic")) score -= 4;
  return score;
}

function primaryCategory(product: Product) {
  return product.categories[0] ?? "other";
}

export function createSwipeDeck(
  allProducts: Product[],
  recipient: Recipient,
  occasion: Occasion,
  budget?: Budget | null,
): Product[] {
  const seed = `${recipient}:${occasion}:${budget ?? "any"}`;
  const ranked = eligibleProducts(allProducts, occasion, budget)
    .map((product) => ({
      product,
      score: contextScore(product, recipient, occasion),
      tie: stableNumber(`${seed}:${product.id}`),
    }))
    .sort((a, b) => b.score - a.score || a.tie - b.tie);

  const deck: Product[] = [];
  const usedCategories = new Set<string>();
  const usedTitles = new Set<string>();

  for (const item of ranked) {
    const category = primaryCategory(item.product);
    const normalizedTitle = item.product.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (usedCategories.has(category) || usedTitles.has(normalizedTitle)) continue;
    deck.push(item.product);
    usedCategories.add(category);
    usedTitles.add(normalizedTitle);
    if (deck.length === Math.min(7, SWIPE_COUNT)) break;
  }

  for (const item of ranked) {
    if (deck.some((product) => product.id === item.product.id)) continue;
    const normalizedTitle = item.product.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (usedTitles.has(normalizedTitle)) continue;
    deck.push(item.product);
    usedTitles.add(normalizedTitle);
  }

  return deck;
}

export function likedProductsForResults(
  allProducts: Product[],
  swipes: SwipeDecision[],
): Product[] {
  const byId = new Map(allProducts.map((product) => [product.id, product]));
  const likedProducts = swipes.flatMap((swipe) => {
    if (swipe.direction !== "like") return [];
    const product = byId.get(swipe.productId);
    return product ? [product] : [];
  });

  return [...likedProducts].reverse();
}

export function hasEnoughSignals(swipes: SwipeDecision[]) {
  return (
    swipes.length >= SWIPE_COUNT
    && swipes.filter((swipe) => swipe.direction === "like").length >= MIN_LIKES_FOR_RECOMMENDATION
  );
}

function addWeight(weights: Map<string, number>, key: string, amount: number) {
  weights.set(key, (weights.get(key) ?? 0) + amount);
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function formatOccasion(occasion: Occasion) {
  return occasion.replaceAll("-", " ");
}

function buildReasons(
  product: Product,
  likedProducts: Product[],
  recipient: Recipient,
  occasion: Occasion,
  preferredPrice: number | null,
) {
  const reasons: string[] = [];
  const likedCategories = new Set(likedProducts.flatMap((item) => item.categories));
  const likedVibes = new Set(likedProducts.flatMap((item) => item.vibes));
  const matchedCategory = product.categories.find((category) => likedCategories.has(category));
  const matchedVibe = product.vibes.find((vibe) => likedVibes.has(vibe));

  if (matchedCategory) reasons.push(`Matches the ${categoryNames[matchedCategory]} you kept`);
  if (matchedVibe) reasons.push(`Carries the ${matchedVibe} feel that showed up in your picks`);
  if (product.occasions.includes(occasion)) reasons.push(`Well suited to ${formatOccasion(occasion)} gifting`);
  if (preferredPrice && Math.abs(Math.log(product.price / preferredPrice)) < 0.45) reasons.push("Stays close to the price range you preferred");
  if (product.recipients.includes(recipient)) reasons.push(`A thoughtful fit for your ${recipient}`);
  if (!reasons.length) reasons.push("The strongest overall fit from your ten choices");
  return [...new Set(reasons)].slice(0, 3);
}

export function rankRecommendations(
  allProducts: Product[],
  swipes: SwipeDecision[],
  recipient: Recipient,
  occasion: Occasion,
  budget?: Budget | null,
): Recommendation[] {
  const byId = new Map(allProducts.map((product) => [product.id, product]));
  const seenIds = new Set(swipes.map((swipe) => swipe.productId));
  const categoryWeights = new Map<string, number>();
  const vibeWeights = new Map<string, number>();
  const likedProducts: Product[] = [];

  for (const swipe of swipes) {
    const product = byId.get(swipe.productId);
    if (!product) continue;
    const multiplier = swipe.direction === "like" ? 1 : -1;
    if (swipe.direction === "like") likedProducts.push(product);
    product.categories.forEach((category) => addWeight(categoryWeights, category, multiplier * (swipe.direction === "like" ? 2.4 : 0.9)));
    product.vibes.forEach((vibe) => addWeight(vibeWeights, vibe, multiplier * (swipe.direction === "like" ? 1.5 : 0.55)));
  }

  const preferredPrice = median(likedProducts.map((product) => product.price));

  return eligibleProducts(allProducts, occasion, budget)
    .filter((product) => !seenIds.has(product.id))
    .map((product) => {
      let score = contextScore(product, recipient, occasion);
      score += product.categories.reduce((sum, category) => sum + (categoryWeights.get(category) ?? 0), 0);
      score += product.vibes.reduce((sum, vibe) => sum + (vibeWeights.get(vibe) ?? 0), 0);
      if (preferredPrice) {
        score += Math.max(-1.5, 2.25 - Math.abs(Math.log(product.price / preferredPrice)) * 3.2);
      }
      score += (stableNumber(product.id) % 1000) / 100000;
      return {
        product,
        score,
        reasons: buildReasons(product, likedProducts, recipient, occasion, preferredPrice),
      };
    })
    .sort((a, b) => b.score - a.score);
}
