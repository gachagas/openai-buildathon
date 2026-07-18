import { describe, expect, it } from "vitest";
import { flowers } from "../data/flowers";
import { hanakotobaMessage, meaningMessages } from "./hanakotoba";

describe("hanakotobaMessage", () => {
  it("uses a cautious default message with no selections", () => {
    expect(hanakotobaMessage(flowers, [])).toMatchObject({
      category: "sincerity",
      message: meaningMessages.sincerity,
      flowerNames: [],
    });
  });

  it("lets a favorite carry more weight than ordinary likes", () => {
    const result = hanakotobaMessage(flowers, [
      { flowerId: "sunflower", decision: "liked" },
      { flowerId: "coral-gerbera", decision: "liked" },
      { flowerId: "garden-rose", decision: "favorite" },
    ]);

    expect(result.category).toBe("affection");
    expect(result.flowerNames).toEqual(["Garden Rose"]);
  });
});
