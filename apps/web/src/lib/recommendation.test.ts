import { describe, expect, it } from "vitest";
import { products } from "./catalog";
import { hasVector } from "./similar";
import {
  BUDGETS,
  MIN_LIKES_FOR_RECOMMENDATION,
  RESULTS_PER_GROUP,
  SWIPE_COUNT,
  adaptDeckTail,
  createSwipeDeck,
  emergingTaste,
  hasEnoughSignals,
  likedProductsForResults,
  rankRecommendations,
  type SwipeDecision,
} from "./recommendation";

describe("FlowerStore catalog snapshot", () => {
  it("contains a diverse, valid, richly-tagged set of real products", () => {
    expect(products.length).toBeGreaterThanOrEqual(450);
    expect(new Set(products.map((product) => product.link)).size).toBe(products.length);
    expect(new Set(products.flatMap((product) => product.categories)).size).toBeGreaterThanOrEqual(8);
    expect(products.every((product) => product.link.startsWith("https://flowerstore.ph/product/"))).toBe(true);
    expect(products.every((product) => product.image.startsWith("https://flowerstoreph-assets-prod.s3"))).toBe(true);
    expect(products.every((product) => product.price >= 99)).toBe(true);

    const withRecipients = products.filter((product) => product.recipients.length > 0).length;
    const withVibes = products.filter((product) => product.vibes.length > 0).length;
    expect(withRecipients / products.length).toBeGreaterThanOrEqual(0.9);
    expect(withVibes / products.length).toBeGreaterThanOrEqual(0.9);
  });
});

describe("swipe deck", () => {
  it("provides a unique deck that can continue after the first ten choices", () => {
    const deck = createSwipeDeck(products, "friend", "birthday");
    expect(deck.length).toBeGreaterThan(SWIPE_COUNT);
    expect(new Set(deck.map((product) => product.id)).size).toBe(deck.length);
  });

  it("carries no sympathy products in the catalogue at all", () => {
    expect(products.every((product) => !(product.categories as string[]).includes("sympathy"))).toBe(true);
    expect(products.every((product) => !(product.occasions as string[]).includes("sympathy"))).toBe(true);
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

  it("requires three saved gifts after the initial ten choices before showing results", () => {
    const deck = createSwipeDeck(products, "family", "birthday");
    const noLikes: SwipeDecision[] = deck.slice(0, SWIPE_COUNT).map((product) => ({
      productId: product.id,
      direction: "pass",
    }));
    const threeSavedAfterCalibration = [
      ...noLikes,
      ...deck.slice(SWIPE_COUNT, SWIPE_COUNT + MIN_LIKES_FOR_RECOMMENDATION).map((product) => ({
        productId: product.id,
        direction: "like" as const,
      })),
    ];

    expect(hasEnoughSignals(noLikes)).toBe(false);
    expect(hasEnoughSignals(threeSavedAfterCalibration)).toBe(true);
  });

  it("returns every saved pick and three unseen matches", () => {
    const deck = createSwipeDeck(products, "partner", "anniversary");
    const swipes: SwipeDecision[] = deck.slice(0, SWIPE_COUNT).map((product, index) => ({
      productId: product.id,
      direction: index % 3 === 0 ? "like" : "pass",
    }));
    const likeCount = swipes.filter((swipe) => swipe.direction === "like").length;
    const liked = likedProductsForResults(products, swipes);
    const matches = rankRecommendations(products, swipes, "partner", "anniversary").slice(0, RESULTS_PER_GROUP);

    expect(likeCount).toBeGreaterThan(RESULTS_PER_GROUP);
    expect(liked).toHaveLength(likeCount);
    expect(matches).toHaveLength(RESULTS_PER_GROUP);
    expect(matches.every(({ product }) => !swipes.some((swipe) => swipe.productId === product.id))).toBe(true);
  });

  it("keeps the deck and recommendations within the chosen budget", () => {
    const [min, max] = BUDGETS["Under ₱1,000"];
    const deck = createSwipeDeck(products, "friend", "birthday", "Under ₱1,000");
    expect(deck.length).toBeGreaterThanOrEqual(SWIPE_COUNT);
    expect(deck.every((product) => product.price >= min && product.price < max)).toBe(true);

    const swipes: SwipeDecision[] = deck.slice(0, SWIPE_COUNT).map((product, index) => ({
      productId: product.id,
      direction: index % 2 === 0 ? "like" : "pass",
    }));
    const matches = rankRecommendations(products, swipes, "friend", "birthday", "Under ₱1,000");
    expect(matches.every(({ product }) => product.price >= min && product.price < max)).toBe(true);
  });
});

describe("similarity and adaptivity", () => {
  it("has a TF-IDF vector for every product", () => {
    expect(products.every((product) => hasVector(product.id))).toBe(true);
  });

  it("adapts the deck tail differently based on what you liked (input → output)", () => {
    const deck = createSwipeDeck(products, "friend", "birthday");
    const firstFive = deck.slice(0, 5);
    const liked: SwipeDecision[] = firstFive.map((product) => ({ productId: product.id, direction: "like" }));
    const passed: SwipeDecision[] = firstFive.map((product) => ({ productId: product.id, direction: "pass" }));

    const likedDeck = adaptDeckTail(products, deck, liked, "friend", "birthday");
    const passedDeck = adaptDeckTail(products, deck, passed, "friend", "birthday");

    // The already-seen prefix is preserved...
    expect(likedDeck.slice(0, 5).map((product) => product.id)).toEqual(firstFive.map((product) => product.id));
    // ...but the tail reflects the different signals.
    expect(likedDeck.slice(5).map((product) => product.id).join()).not.toBe(passedDeck.slice(5).map((product) => product.id).join());
    // No already-seen product reappears in the adapted tail.
    const seen = new Set(firstFive.map((product) => product.id));
    expect(likedDeck.slice(5).every((product) => !seen.has(product.id))).toBe(true);
  });

  it("surfaces emerging taste labels from likes, nothing from an empty session", () => {
    const deck = createSwipeDeck(products, "partner", "anniversary");
    const liked: SwipeDecision[] = deck.slice(0, 5).map((product) => ({ productId: product.id, direction: "like" }));
    expect(emergingTaste(products, liked).length).toBeGreaterThan(0);
    expect(emergingTaste(products, [])).toEqual([]);
  });
});
