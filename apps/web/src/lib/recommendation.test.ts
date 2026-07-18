import { describe, expect, it } from "vitest";
import { products } from "./catalog";
import { SWIPE_COUNT, createSwipeDeck, rankRecommendations, type SwipeDecision } from "./recommendation";

describe("FlowerStore catalog snapshot", () => {
  it("contains a diverse, valid set of real products", () => {
    expect(products.length).toBeGreaterThanOrEqual(180);
    expect(new Set(products.map((product) => product.link)).size).toBe(products.length);
    expect(new Set(products.flatMap((product) => product.categories)).size).toBeGreaterThanOrEqual(8);
    expect(products.every((product) => product.link.startsWith("https://flowerstore.ph/product/"))).toBe(true);
    expect(products.every((product) => product.image.startsWith("https://flowerstoreph-assets-prod.s3"))).toBe(true);
    expect(products.every((product) => product.price >= 399)).toBe(true);
  });
});

describe("swipe deck", () => {
  it("creates exactly ten unique choices", () => {
    const deck = createSwipeDeck(products, "friend", "birthday");
    expect(deck).toHaveLength(SWIPE_COUNT);
    expect(new Set(deck.map((product) => product.id)).size).toBe(SWIPE_COUNT);
  });

  it("does not mix sympathy products into celebratory decks", () => {
    const deck = createSwipeDeck(products, "colleague", "congratulations");
    expect(deck.every((product) => !product.categories.includes("sympathy"))).toBe(true);
  });

  it("uses only sympathy-sensitive products for a sympathy deck", () => {
    const deck = createSwipeDeck(products, "family", "sympathy");
    expect(deck).toHaveLength(SWIPE_COUNT);
    expect(deck.every((product) => product.categories.includes("sympathy"))).toBe(true);
  });
});

describe("recommendation ranking", () => {
  it("never repeats a product that was already swiped", () => {
    const deck = createSwipeDeck(products, "partner", "anniversary");
    const swipes: SwipeDecision[] = deck.map((product, index) => ({ productId: product.id, direction: index % 2 ? "pass" : "like" }));
    const recommendation = rankRecommendations(products, swipes, "partner", "anniversary")[0];
    expect(deck.some((product) => product.id === recommendation.product.id)).toBe(false);
    expect(recommendation.reasons.length).toBeGreaterThan(0);
  });

  it("learns a preference for personalized gifts", () => {
    const personalized = products.filter((product) => product.categories.includes("personalized")).slice(0, 5);
    const flowers = products.filter((product) => product.categories.includes("flowers") && !product.categories.includes("personalized")).slice(0, 5);
    const swipes: SwipeDecision[] = [
      ...personalized.map((product) => ({ productId: product.id, direction: "like" as const })),
      ...flowers.map((product) => ({ productId: product.id, direction: "pass" as const })),
    ];
    const topFive = rankRecommendations(products, swipes, "friend", "just-because").slice(0, 5);
    expect(topFive.some(({ product }) => product.categories.includes("personalized"))).toBe(true);
  });
});
