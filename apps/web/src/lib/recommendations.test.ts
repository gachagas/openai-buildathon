import { describe, expect, it } from "vitest";
import { flowerById, flowers } from "../data/flowers";
import { recommendFlowers, recommendationScore } from "./recommendations";

const romanticProfile = {
  colors: ["Blush pink"],
  tags: ["Romantic"],
  shapes: ["Layered petals"],
  styles: ["Romantic"],
};

describe("recommendationScore", () => {
  it("rewards style, color, shape, tag, occasion, and budget matches", () => {
    const ranunculus = flowerById.get("pink-ranunculus")!;
    expect(recommendationScore(ranunculus, romanticProfile, {
      occasion: "Anniversary",
      budget: "Under ₱500",
    })).toBe(10);
  });
});

describe("recommendFlowers", () => {
  it("excludes liked flowers and ranks unskipped matches first", () => {
    const recommendations = recommendFlowers(flowers, [
      { flowerId: "pink-ranunculus", decision: "liked" },
      { flowerId: "garden-rose", decision: "skipped" },
    ], romanticProfile, { occasion: "Anniversary" }, 4);

    expect(recommendations).toHaveLength(4);
    expect(recommendations.map((flower) => flower.id)).not.toContain("pink-ranunculus");
    expect(recommendations.map((flower) => flower.id)).not.toContain("garden-rose");
    expect(recommendations[0].id).toBe("blush-peony");
  });

  it("returns between three and five recommendations", () => {
    expect(recommendFlowers(flowers, [], romanticProfile, {}, 1)).toHaveLength(3);
    expect(recommendFlowers(flowers, [], romanticProfile, {}, 9)).toHaveLength(5);
  });
});
