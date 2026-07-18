import { describe, expect, it } from "vitest";
import { flowers } from "../data/products";
import { BUDGETS, similarTo, topMatches } from "./match";

const SYMPATHY_ALLOWED = ["Sympathy", "Flowers", "Orchid", "Dried flowers", "Plant", "Gift basket"];

describe("topMatches", () => {
  it("returns up to 10 items and never surfaces sympathy for a non-sympathy occasion", () => {
    const results = topMatches({ occasion: "Birthday" }, new Set());
    expect(results.length).toBe(10);
    expect(results.every((flower) => flower.tags[0] !== "Sympathy" && !flower.occasions.includes("Sympathy"))).toBe(true);
  });

  it("only returns sympathy-appropriate categories for a sympathy occasion", () => {
    const results = topMatches({ occasion: "Sympathy" }, new Set());
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((flower) => SYMPATHY_ALLOWED.includes(flower.tags[0]!))).toBe(true);
  });

  it("respects budget bounds", () => {
    const [min, max] = BUDGETS["Under ₱1,000"];
    const results = topMatches({ budget: "Under ₱1,000" }, new Set());
    expect(results.every((flower) => flower.pricing.amount >= min && flower.pricing.amount < max)).toBe(true);
  });

  it("excludes already-seen products", () => {
    const first = topMatches({ occasion: "Birthday" }, new Set());
    const excluded = new Set(first.map((flower) => flower.id));
    const next = topMatches({ occasion: "Birthday" }, excluded);
    expect(next.every((flower) => !excluded.has(flower.id))).toBe(true);
  });
});

describe("similarTo", () => {
  it("returns the requested count and never an excluded or liked id", () => {
    const liked = [flowers[0].id, flowers[1].id];
    const exclude = new Set(liked);
    const results = similarTo(liked, exclude, 6);
    expect(results).toHaveLength(6);
    expect(results.every((flower) => !exclude.has(flower.id))).toBe(true);
  });

  it("returns nothing when there are no liked products", () => {
    expect(similarTo([], new Set())).toEqual([]);
  });

  it("keeps sympathy out of similars unless a liked item was sympathy", () => {
    const nonSympathy = flowers.find((flower) => flower.tags[0] !== "Sympathy" && !flower.occasions.includes("Sympathy"))!;
    const results = similarTo([nonSympathy.id], new Set([nonSympathy.id]));
    expect(results.every((flower) => flower.tags[0] !== "Sympathy")).toBe(true);
  });
});
